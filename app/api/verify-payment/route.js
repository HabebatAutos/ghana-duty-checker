import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

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

    // 0. IDEMPOTENCY CHECK: Ensure this exact reference hasn't already been processed
    const { data: existingLog, error: logCheckError } = await supabaseAdmin
      .from('payment_logs')
      .select('*')
      .eq('reference', reference)
      .maybeSingle()

    if (logCheckError) {
      console.error('[VERIFY-PAYMENT] Error checking payment logs:', logCheckError)
    }

    if (existingLog) {
      console.warn(`[VERIFY-PAYMENT] Duplicate verification attempt for already processed reference: ${reference}`)
      
      // Fetch current wallet state to safely return to client without re-crediting
      const { data: currentWallet } = await supabaseAdmin
        .from('user_wallets')
        .select('*')
        .eq('email', existingLog.email)
        .maybeSingle()

      return NextResponse.json({
        success: true,
        message: 'Transaction already verified and processed.',
        email: currentWallet?.email || existingLog.email,
        tokens: currentWallet?.tokens || 0,
        isPro: currentWallet?.is_pro || false,
        proExpiresAt: currentWallet?.pro_expires_at || null,
      })
    }

    // 1. Verify transaction status directly with Paystack API
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    )

    const paystackData = await paystackRes.json()
    console.log('[VERIFY-PAYMENT] Paystack API Response:', JSON.stringify(paystackData, null, 2))

    if (!paystackData.status || paystackData.data?.status !== 'success') {
      const errorMessage = paystackData.message || 'Payment verification failed at Paystack.'
      console.error('[VERIFY-PAYMENT] Verification rejected:', errorMessage)
      return NextResponse.json({ success: false, error: errorMessage }, { status: 400 })
    }

    // 2. Extract and normalize target email address
    const rawEmail = email || paystackData.data.customer?.email
    if (!rawEmail) {
      return NextResponse.json(
        { success: false, error: 'No valid email address found for record update.' },
        { status: 400 }
      )
    }
    const customerEmail = rawEmail.trim().toLowerCase()

    // 3. Fallback resolution: Infer plan type from paid amount if planType is omitted
    const paidAmountGHS = (paystackData.data.amount || 0) / 100
    let effectivePlan = planType

    if (!effectivePlan) {
      effectivePlan = paidAmountGHS >= 100 ? 'subscription' : 'tokens'
      console.log(`[VERIFY-PAYMENT] planType was empty. Inferred plan as ${effectivePlan} based on amount (${paidAmountGHS} GHS).`)
    }

    // 4. Fetch existing wallet record from Supabase
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

    // 5. Calculate new balance or subscription state accurately
    let tokensPurchased = 10 
    
    if (paidAmountGHS >= 50) {
      tokensPurchased = 30; 
    } else if (paidAmountGHS >= 30) {
      tokensPurchased = 20;
    } else {
      tokensPurchased = 10;
    }

    let newTokens = currentTokens
    if (effectivePlan === 'subscription' || effectivePlan === 'pro') {
      newIsPro = true
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + 30)
      newProExpiresAt = expiryDate.toISOString()
    } else {
      newTokens = currentTokens + tokensPurchased
    }

    console.log(`[VERIFY-PAYMENT] Saving update for ${customerEmail}:`, {
      currentTokens,
      tokensPurchased,
      newTokens,
      newIsPro,
      newProExpiresAt,
    })

    // 6. Upsert the wallet record in Supabase
    const { data: updatedWallet, error: upsertError } = await supabaseAdmin
      .from('user_wallets')
      .upsert(
        {
          email: customerEmail,
          tokens: newTokens,
          is_pro: newIsPro,
          pro_expires_at: newProExpiresAt,
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

    // 7. Log this transaction reference so it can NEVER be processed twice
    const { error: insertLogErr } = await supabaseAdmin
      .from('payment_logs')
      .insert({
        reference: reference,
        email: customerEmail,
        amount: paidAmountGHS,
        tokens_granted: effectivePlan === 'subscription' ? 0 : tokensPurchased
      })

    if (insertLogErr) {
      console.error('[VERIFY-PAYMENT] Warning: Failed to write payment log entry:', insertLogErr)
    }

    console.log('[VERIFY-PAYMENT] Database write successfully completed:', updatedWallet)

    // 8. Return structured payload for client TokenContext synchronization
    return NextResponse.json({
      success: true,
      email: updatedWallet.email,
      tokens: updatedWallet.tokens,
      isPro: updatedWallet.is_pro,
      proExpiresAt: updatedWallet.pro_expires_at,
    })
  } catch (error) {
    console.error('[VERIFY-PAYMENT] Server route error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error.' },
      { status: 500 }
    )
  }
}