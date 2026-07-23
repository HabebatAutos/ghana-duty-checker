// app/api/verify-payment/route.js
import { NextResponse } from 'next/server'
import { supabaseAdmin, normalizeEmail, generateWalletSecret } from '@/lib/supabase'

// Retries the Paystack verify call on transient failures (gateway timeouts,
// brief outages, non-JSON error pages) before giving up. Paystack's own
// infrastructure can return a 504 occasionally — this is not our bug, but
// we shouldn't make the user manually retry for something this common.
async function fetchPaystackVerification(reference, secretKey, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    let res
    try {
      res = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
          cache: 'no-store',
        }
      )
    } catch (networkErr) {
      // Actual network-level failure (DNS, connection refused, etc.)
      console.error(`[VERIFY-PAYMENT] Attempt ${attempt}/${maxRetries} — network error:`, networkErr.message)
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, attempt * 1000))
        continue
      }
      return { ok: false, status: null, reason: 'network_error' }
    }

    const rawBody = await res.text()
    try {
      const parsed = JSON.parse(rawBody)
      return { ok: true, data: parsed }
    } catch {
      console.error(`[VERIFY-PAYMENT] Attempt ${attempt}/${maxRetries} — non-JSON response:`, {
        status: res.status,
        statusText: res.statusText,
        bodyPreview: rawBody.slice(0, 300),
      })
      if (attempt < maxRetries) {
        // Backoff: 1s, then 2s before the next attempt.
        await new Promise(r => setTimeout(r, attempt * 1000))
        continue
      }
      return { ok: false, status: res.status, reason: 'non_json_response' }
    }
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    const { reference, email, planType } = body
    console.log('[VERIFY-PAYMENT] Incoming request payload:', body)

    if (!reference) {
      return NextResponse.json(
        { success: false, error: 'Transaction reference is required.' },
        { status: 400 }
      )
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY
    if (!secretKey) {
      console.error('[VERIFY-PAYMENT] Critical Error: PAYSTACK_SECRET_KEY is missing from environment variables.')
      return NextResponse.json(
        { success: false, error: 'Server misconfiguration: PAYSTACK_SECRET_KEY is not set.' },
        { status: 500 }
      )
    }

    const verification = await fetchPaystackVerification(reference, secretKey)
    if (!verification.ok) {
      return NextResponse.json(
        { success: false, error: 'Payment provider is temporarily unavailable. Please try again in a moment.' },
        { status: 502 }
      )
    }
    const paystackData = verification.data

    console.log('[VERIFY-PAYMENT] Paystack API Response:', JSON.stringify(paystackData, null, 2))

    if (!paystackData.status || paystackData.data?.status !== 'success') {
      const errorMessage = paystackData.message || 'Payment verification failed at Paystack.'
      console.error('[VERIFY-PAYMENT] Verification rejected:', errorMessage)
      return NextResponse.json({ success: false, error: errorMessage }, { status: 400 })
    }

    const rawEmail = email || paystackData.data.customer?.email
    const customerEmail = normalizeEmail(rawEmail)
    if (!customerEmail) {
      return NextResponse.json(
        { success: false, error: 'No valid email address found for record update.' },
        { status: 400 }
      )
    }

    const paidAmountGHS = (paystackData.data.amount || 0) / 100
    let effectivePlan = planType
    if (!effectivePlan) {
      effectivePlan = paidAmountGHS >= 100 ? 'subscription' : 'tokens'
      console.log(`[VERIFY-PAYMENT] planType was empty. Inferred plan as ${effectivePlan} based on amount (${paidAmountGHS} GHS).`)
    }

    let tokensPurchased = 10
    if (paidAmountGHS >= 50) {
      tokensPurchased = 30
    } else if (paidAmountGHS >= 30) {
      tokensPurchased = 20
    } else {
      tokensPurchased = 10
    }

    // Atomically claim this payment reference before crediting anything.
    const { error: ledgerError } = await supabaseAdmin
      .from('processed_payments')
      .insert({
        reference,
        email: customerEmail,
        plan: effectivePlan,
        tokens_credited: effectivePlan === 'tokens' ? tokensPurchased : 0,
      })

    if (ledgerError) {
      if (ledgerError.code === '23505') {
        console.log('[VERIFY-PAYMENT] Duplicate verify call for reference, skipping credit:', reference)
        const { data: existingWallet, error: existingErr } = await supabaseAdmin
          .from('user_wallets')
          .select('*')
          .eq('email', customerEmail)
          .maybeSingle()

        if (existingErr) {
          console.error('[VERIFY-PAYMENT] Supabase fetch error on duplicate path:', existingErr)
          throw new Error('Failed to query user wallet.')
        }

        return NextResponse.json({
          success: true,
          alreadyProcessed: true,
          email: customerEmail,
          tokens: existingWallet?.tokens ?? 0,
          isPro: existingWallet?.is_pro ?? false,
          proExpiresAt: existingWallet?.pro_expires_at ?? null,
          walletSecret: existingWallet?.wallet_secret ?? null,
        })
      }
      console.error('[VERIFY-PAYMENT] Ledger insert error:', ledgerError)
      throw new Error('Failed to record payment.')
    }

    // Fetch existing wallet (if any) — new reference, safe to credit.
    const { data: wallet, error: fetchError } = await supabaseAdmin
      .from('user_wallets')
      .select('*')
      .eq('email', customerEmail)
      .maybeSingle()

    if (fetchError) {
      console.error('[VERIFY-PAYMENT] Supabase fetch error:', fetchError)
      throw new Error('Failed to query user wallet.')
    }

    let currentTokens = wallet ? wallet.tokens : 0
    let newIsPro = wallet ? wallet.is_pro : false
    let newProExpiresAt = wallet ? wallet.pro_expires_at : null
    let newTokens = currentTokens

    const walletSecret = wallet?.wallet_secret || generateWalletSecret()

    if (effectivePlan === 'subscription' || effectivePlan === 'pro') {
      newIsPro = true
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + 30)
      newProExpiresAt = expiryDate.toISOString()
    } else {
      newTokens = currentTokens + tokensPurchased
    }

    console.log(`[VERIFY-PAYMENT] Saving update for ${customerEmail}:`, {
      currentTokens, tokensPurchased, newTokens, newIsPro, newProExpiresAt,
    })

    const { data: updatedWallet, error: upsertError } = await supabaseAdmin
      .from('user_wallets')
      .upsert(
        {
          email: customerEmail,
          tokens: newTokens,
          is_pro: newIsPro,
          pro_expires_at: newProExpiresAt,
          wallet_secret: walletSecret,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      )
      .select()
      .single()

    if (upsertError) {
      console.error('[VERIFY-PAYMENT] Supabase upsert error:', upsertError)
      throw new Error('Failed to update wallet in database.')
    }

    console.log('[VERIFY-PAYMENT] Database write successfully completed:', updatedWallet)

    return NextResponse.json({
      success: true,
      email: updatedWallet.email,
      tokens: updatedWallet.tokens,
      isPro: updatedWallet.is_pro,
      proExpiresAt: updatedWallet.pro_expires_at,
      walletSecret: updatedWallet.wallet_secret,
    })
  } catch (error) {
    console.error('[VERIFY-PAYMENT] Server route error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error.' },
      { status: 500 }
    )
  }
}