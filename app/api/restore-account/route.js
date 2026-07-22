// app/api/restore-account/route.js
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req) {
  try {
    const { email } = await req.json()

    const { data: wallet, error } = await supabaseAdmin
      .from('user_wallets')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !wallet) {
      return NextResponse.json({ success: false, message: 'No account record found for this email address.' }, { status: 404 })
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
    return NextResponse.json({ success: false, message: err.message }, { status: 500 })
  }
}