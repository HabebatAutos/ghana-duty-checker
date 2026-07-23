// app/api/restore-account/route.js
import { NextResponse } from 'next/server'
import { supabaseAdmin, normalizeEmail } from '@/lib/supabase'

export async function POST(req) {
  try {
    const { email: rawEmail, secret } = await req.json()
    const email = normalizeEmail(rawEmail)

    if (!email || !secret) {
      return NextResponse.json(
        { success: false, message: 'Missing account credentials.' },
        { status: 400 }
      )
    }

    const { data: wallet, error } = await supabaseAdmin
      .from('user_wallets')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (error) {
      console.error('[RESTORE-ACCOUNT] Supabase fetch error:', error)
      return NextResponse.json({ success: false, message: 'Failed to look up account.' }, { status: 500 })
    }

    // Deliberately vague on failure — don't reveal whether the email exists
    // vs. whether the secret was wrong. Both cases return the same message.
    if (!wallet || !wallet.wallet_secret || wallet.wallet_secret !== secret) {
      return NextResponse.json(
        { success: false, message: 'No matching account found on this device.' },
        { status: 404 }
      )
    }

    const now = new Date()
    const isProStillValid = wallet.is_pro && wallet.pro_expires_at && new Date(wallet.pro_expires_at) > now

    return NextResponse.json({
      success: true,
      tokens: wallet.tokens,
      isPro: isProStillValid,
      email: wallet.email,
    })
  } catch (err) {
    console.error('[RESTORE-ACCOUNT] Server route error:', err)
    return NextResponse.json({ success: false, message: err.message }, { status: 500 })
  }
}