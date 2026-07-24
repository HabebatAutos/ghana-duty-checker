// app/api/verify-donation/route.js
import { NextResponse } from 'next/server'
import { supabaseAdmin, normalizeEmail } from '@/lib/supabase'

// Same retry-with-backoff pattern used in verify-payment, since Paystack's
// own infrastructure can intermittently return a 504/non-JSON response.
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
      console.error(`[VERIFY-DONATION] Attempt ${attempt}/${maxRetries} — network error:`, networkErr.message)
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, attempt * 1000))
        continue
      }
      return { ok: false, reason: 'network_error' }
    }

    const rawBody = await res.text()
    try {
      const parsed = JSON.parse(rawBody)
      return { ok: true, data: parsed }
    } catch {
      console.error(`[VERIFY-DONATION] Attempt ${attempt}/${maxRetries} — non-JSON response:`, {
        status: res.status,
        bodyPreview: rawBody.slice(0, 300),
      })
      if (attempt < maxRetries) {
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
    const { reference, email } = body
    console.log('[VERIFY-DONATION] Incoming request payload:', body)

    if (!reference) {
      return NextResponse.json(
        { success: false, error: 'Transaction reference is required.' },
        { status: 400 }
      )
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY
    if (!secretKey) {
      console.error('[VERIFY-DONATION] Critical Error: PAYSTACK_SECRET_KEY is missing.')
      return NextResponse.json(
        { success: false, error: 'Server misconfiguration.' },
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

    console.log('[VERIFY-DONATION] Paystack API Response:', JSON.stringify(paystackData, null, 2))

    if (!paystackData.status || paystackData.data?.status !== 'success') {
      const errorMessage = paystackData.message || 'Payment verification failed at Paystack.'
      console.error('[VERIFY-DONATION] Verification rejected:', errorMessage)
      return NextResponse.json({ success: false, error: errorMessage }, { status: 400 })
    }

    const rawEmail = email || paystackData.data.customer?.email
    const donorEmail = normalizeEmail(rawEmail)
    if (!donorEmail) {
      return NextResponse.json(
        { success: false, error: 'No valid email address found.' },
        { status: 400 }
      )
    }

    const amountGhs = (paystackData.data.amount || 0) / 100

    // Insert is the idempotency guard — reference is unique, so a duplicate
    // verify call (retry, double-click, etc.) simply fails silently here
    // instead of logging the same donation twice.
    const { error: insertError } = await supabaseAdmin
      .from('donations')
      .insert({
        reference,
        email: donorEmail,
        amount_ghs: amountGhs,
      })

    if (insertError && insertError.code !== '23505') {
      console.error('[VERIFY-DONATION] Insert error:', insertError)
      throw new Error('Failed to record donation.')
    }

    if (insertError && insertError.code === '23505') {
      console.log('[VERIFY-DONATION] Duplicate verify call for reference, already logged:', reference)
    } else {
      console.log('[VERIFY-DONATION] Donation recorded:', { reference, donorEmail, amountGhs })
    }

    return NextResponse.json({
      success: true,
      email: donorEmail,
      amount: amountGhs,
    })
  } catch (error) {
    console.error('[VERIFY-DONATION] Server route error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error.' },
      { status: 500 }
    )
  }
}