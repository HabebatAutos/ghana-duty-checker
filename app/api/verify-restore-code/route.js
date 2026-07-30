// app/api/verify-restore-code/route.js
import { NextResponse } from 'next/server'
import { supabaseAdmin, normalizeEmail } from '@/lib/supabase'

export async function POST(req) {
  try {
    const { email: rawEmail, code } = await req.json()
    const email = normalizeEmail(rawEmail)

    if (!email || !code) {
      return NextResponse.json({ success: false, error: 'Email and code are required.' }, { status: 400 })
    }

    const { data: codeRow, error: codeErr } = await supabaseAdmin
      .from('restore_codes')
      .select('*')
      .eq('email', email)
      .eq('code', String(code).trim())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (codeErr) {
      console.error('[VERIFY-RESTORE-CODE] Lookup error:', codeErr)
      return NextResponse.json({ success: false, error: 'Failed to verify code.' }, { status: 500 })
    }

    if (!codeRow) {
      return NextResponse.json({ success: false, error: 'Invalid code. Please check and try again.' }, { status: 400 })
    }

    if (new Date(codeRow.expires_at) < new Date()) {
      return NextResponse.json({ success: false, error: 'This code has expired. Please request a new one.' }, { status: 400 })
    }

    // Single-use — delete immediately so it can't be replayed.
    await supabaseAdmin.from('restore_codes').delete().eq('id', codeRow.id)

    const { data: wallet, error: walletErr } = await supabaseAdmin
      .from('user_wallets')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (walletErr || !wallet) {
      console.error('[VERIFY-RESTORE-CODE] Wallet lookup error:', walletErr)
      return NextResponse.json({ success: false, error: 'Account not found.' }, { status: 404 })
    }

    const now = new Date()
    const isProValid = wallet.is_pro && wallet.pro_expires_at && new Date(wallet.pro_expires_at) > now

    return NextResponse.json({
      success: true,
      email: wallet.email,
      tokens: wallet.tokens,
      isPro: isProValid,
      proExpiresAt: wallet.pro_expires_at,
      walletSecret: wallet.wallet_secret,
    })
  } catch (err) {
    console.error('[VERIFY-RESTORE-CODE] Server error:', err)
    return NextResponse.json({ success: false, error: err.message || 'Internal server error.' }, { status: 500 })
  }
}