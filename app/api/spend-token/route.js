// app/api/spend-token/route.js
import { NextResponse } from 'next/server'
import { supabaseAdmin, normalizeEmail } from '@/lib/supabase'

export async function POST(req) {
  try {
    const { email: rawEmail, secret } = await req.json()
    const email = normalizeEmail(rawEmail)

    if (!email || !secret) {
      return NextResponse.json({ success: false, error: 'Missing account credentials.' }, { status: 400 })
    }

    const { data: wallet, error: fetchError } = await supabaseAdmin
      .from('user_wallets')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (fetchError) {
      console.error('[SPEND-TOKEN] Fetch error:', fetchError)
      return NextResponse.json({ success: false, error: 'Failed to look up wallet.' }, { status: 500 })
    }

    if (!wallet || wallet.wallet_secret !== secret) {
      return NextResponse.json({ success: false, error: 'Invalid account credentials.' }, { status: 403 })
    }

    // Pro/unlimited users don't consume tokens at all.
    const now = new Date()
    const isProValid = wallet.is_pro && wallet.pro_expires_at && new Date(wallet.pro_expires_at) > now
    if (isProValid) {
      return NextResponse.json({ success: true, tokens: wallet.tokens, isPro: true })
    }

    if (wallet.tokens <= 0) {
      return NextResponse.json({ success: false, error: 'No tokens remaining.' }, { status: 402 })
    }

    // Atomic decrement guarded by the current known value, so two
    // simultaneous spends can't both succeed against a stale read.
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('user_wallets')
      .update({ tokens: wallet.tokens - 1, updated_at: new Date().toISOString() })
      .eq('email', email)
      .eq('tokens', wallet.tokens) // optimistic concurrency check
      .select()
      .single()

    if (updateError || !updated) {
      console.error('[SPEND-TOKEN] Update failed (possible race):', updateError)
      return NextResponse.json({ success: false, error: 'Could not spend token, please retry.' }, { status: 409 })
    }

    return NextResponse.json({ success: true, tokens: updated.tokens, isPro: false })
  } catch (err) {
    console.error('[SPEND-TOKEN] Server error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}