// app/api/request-restore-code/route.js
import { NextResponse } from 'next/server'
import { randomInt } from 'crypto'
import nodemailer from 'nodemailer'
import { supabaseAdmin, normalizeEmail } from '@/lib/supabase'

const CODE_TTL_MINUTES = 10
const RESEND_COOLDOWN_SECONDS = 60

export async function POST(req) {
  try {
    const { email: rawEmail } = await req.json()
    const email = normalizeEmail(rawEmail)

    if (!email) {
      return NextResponse.json({ success: false, error: 'A valid email address is required.' }, { status: 400 })
    }

    // Only issue codes for emails that actually have a wallet — no point
    // emailing a code to someone who's never purchased anything.
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

    // Cooldown — don't let the same email trigger a fresh code more than
    // once a minute (prevents accidental double-taps and casual abuse).
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

    const code = String(randomInt(100000, 1000000)) // always 6 digits
    const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString()

    const { error: insertErr } = await supabaseAdmin
      .from('restore_codes')
      .insert({ email, code, expires_at: expiresAt })

    if (insertErr) {
      console.error('[REQUEST-RESTORE-CODE] Insert error:', insertErr)
      return NextResponse.json({ success: false, error: 'Failed to generate code.' }, { status: 500 })
    }

    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
    const smtpPort = parseInt(process.env.SMTP_PORT || '465')
    const isSecureConnection = smtpPort === 465

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: isSecureConnection,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      tls: { rejectUnauthorized: false },
    })

    await transporter.sendMail({
      from: `"CEDIDUTY" <${process.env.SMTP_USER}>`,
      to: email,
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