// app/api/request-restore-code/route.js
import { NextResponse } from 'next/server'
import { randomInt } from 'crypto'
import { Resend } from 'resend'
import { supabaseAdmin, normalizeEmail } from '@/lib/supabase'

const CODE_TTL_MINUTES = 10
const RESEND_COOLDOWN_SECONDS = 60
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req) {
  try {
    const { email: rawEmail } = await req.json()
    const email = normalizeEmail(rawEmail)

    if (!email) {
      return NextResponse.json({ success: false, error: 'A valid email address is required.' }, { status: 400 })
    }

    const { data: wallet, error: walletErr } = await supabaseAdmin
      .from('user_wallets')
      .select('email')
      .eq('email', email)
      .maybeSingle()

    if (walletErr) {
      console.error('[REQUEST-RESTORE-CODE] Wallet lookup error:', walletErr)
      return NextResponse.json({ success: false, error: 'Failed to look up account.' }, { status: 500 })
    }

    if (!wallet) {
      return NextResponse.json(
        { success: false, error: 'No purchase history found for this email. Choose a package below to get started.' },
        { status: 404 }
      )
    }

    const { data: recentCode } = await supabaseAdmin
      .from('restore_codes')
      .select('created_at')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (recentCode) {
      const secondsSinceLast = (Date.now() - new Date(recentCode.created_at).getTime()) / 1000
      if (secondsSinceLast < RESEND_COOLDOWN_SECONDS) {
        return NextResponse.json(
          { success: false, error: `Please wait ${Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLast)}s before requesting another code.` },
          { status: 429 }
        )
      }
    }

    const code = String(randomInt(100000, 1000000))
    const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString()

    const { error: insertErr } = await supabaseAdmin
      .from('restore_codes')
      .insert({ email, code, expires_at: expiresAt })

    if (insertErr) {
      console.error('[REQUEST-RESTORE-CODE] Insert error:', insertErr)
      return NextResponse.json({ success: false, error: 'Failed to generate code.' }, { status: 500 })
    }

    await resend.emails.send({
      from: 'CEDIDUTY <support@cediduty.com>',
      to: [email],
      subject: `Your CEDIDUTY verification code: ${code}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #05643c; margin-top: 0;">Restore your CEDIDUTY account</h2>
          <p style="color: #334155; font-size: 14px;">Use this code to restore your token balance or subscription on this device:</p>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; text-align: center; margin: 16px 0;">
            <span style="font-size: 28px; font-weight: 800; letter-spacing: 6px; color: #05643c;">${code}</span>
          </div>
          <p style="color: #64748b; font-size: 12px;">This code expires in ${CODE_TTL_MINUTES} minutes. If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true, message: 'Verification code sent to your email.' })
  } catch (err) {
    console.error('[REQUEST-RESTORE-CODE] Server error:', err)
    return NextResponse.json({ success: false, error: err.message || 'Internal server error.' }, { status: 500 })
  }
}