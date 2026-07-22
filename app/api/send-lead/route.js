// app/api/send-lead/route.js
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request) {
  console.log('[LEAD ENGINE] Intercepted new client lead payload form...');
  
  try {
    const payload = await request.json();
    const { leadDetails, vehicleContext, calculationResult } = payload;

    if (!leadDetails || !leadDetails.name || !leadDetails.phone || !leadDetails.email) {
      console.error('[LEAD ENGINE ERROR] Client payload missing essential contact parameters.');
      return NextResponse.json({ error: 'Required contact parameter fields are missing.' }, { status: 400 });
    }

    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '465');
    
    // Auto-detect secure state based on the selected port profile
    const isSecureConnection = smtpPort === 465;

    console.log(`[LEAD ENGINE] Initializing SMTP transport on ${smtpHost}:${smtpPort} (Secure: ${isSecureConnection})...`);

    // Initialize the transmission transporter with localized environment parameters
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: isSecureConnection, 
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // Local Network Shield: Prevents localhost environment handshakes from dropping due to self-signed certificates
      tls: {
        rejectUnauthorized: false
      }
    });

    const targetReceiver = process.env.LEAD_RECEIVER_EMAIL || process.env.SMTP_USER;
    
    // Construct the HTML message envelope
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; color: #0f172a;">
        <div style="background-color: #05643c; padding: 15px; border-radius: 8px 8px 0 0; color: #ffffff; text-align: center;">
          <h2 style="margin: 0; font-size: 18px; letter-spacing: 0.05em;">⚡ NEW MARKETPLACE CLIENT LEAD DETECTED</h2>
          <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">GhanaDuty Conversion Funnel Pipeline Integration</p>
        </div>
        
        <div style="padding: 20px 10px 10px 10px;">
          <h3 style="color: #05643c; border-bottom: 2px solid #f1f5f9; padding-bottom: 6px; margin-top: 0; font-size: 14px;">SECTION 1 — CUSTOMER CONTACT PROFILED DATA</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #475569; width: 130px;">Customer Name:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${leadDetails.name}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #475569;">Phone Number:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${leadDetails.phone}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #475569;">Email Address:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #0f172a;"><a href="mailto:${leadDetails.email}" style="color: #05643c; text-decoration: none;">${leadDetails.email}</a></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #475569;">Service Channel Type:</td>
              <td style="padding: 6px 0; font-weight: bold;"><span style="background-color: #fef3c7; color: #b45309; padding: 2px 6px; border-radius: 4px; font-size: 11px;">${leadDetails.type.toUpperCase()}</span></td>
            </tr>
          </table>
          
          <div style="margin-top: 14px; padding: 12px; background-color: #f8fafc; border-left: 4px solid #cbd5e1; border-radius: 0 4px 4px 0; font-size: 12px;">
            <strong style="color: #475569; display: block; margin-bottom: 4px;">User Appended Notes:</strong>
            <span style="color: #334155; font-style: italic; line-height: 1.4;">${leadDetails.notes || 'No custom notes provided by user configuration.'}</span>
          </div>

          <h3 style="color: #05643c; border-bottom: 2px solid #f1f5f9; padding-bottom: 6px; margin-top: 24px; font-size: 14px;">SECTION 2 — TRACKED VEHICLE SNAPSHOT DATA</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #475569; width: 130px;">Vehicle Identity:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${calculationResult.vehicle_label}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #475569;">Chassis Token (VIN):</td>
              <td style="padding: 6px 0; font-family: monospace; color: #0f172a; font-weight: bold;">${vehicleContext.vin || 'NOT PROVIDED (MANUAL MODE ENTRY)'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #475569;">Origin Hub Country:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${String(vehicleContext.origin || 'USA').toUpperCase()}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #475569;">Applied FX Index Axis:</td>
              <td style="padding: 6px 0; color: #0f172a; font-size: 12px;">${calculationResult.exchange_label}</td>
            </tr>
          </table>

          <h3 style="color: #05643c; border-bottom: 2px solid #f1f5f9; padding-bottom: 6px; margin-top: 24px; font-size: 14px;">SECTION 3 — APPRAISED CUSTOMS BALANCES</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; background-color: #fafafa; border-radius: 6px;">
            <tr>
              <td style="padding: 10px; color: #475569;">Customs CIF Base:</td>
              <td style="padding: 10px; font-weight: bold; text-align: right; color: #0f172a;">GHC ${parseFloat(calculationResult.cif_ghs || 0).toLocaleString()}</td>
            </tr>
            <tr style="border-top: 1px dashed #e2e8f0; border-bottom: 1px dashed #e2e8f0; background-color: #f0fdf4;">
              <td style="padding: 10px; color: #166534; font-weight: bold;">PORT DUTY LIABILITY:</td>
              <td style="padding: 10px; font-weight: bold; text-align: right; color: #05643c; font-size: 14px;">GHC ${parseFloat(calculationResult.total_duty_ghs || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 10px; color: #475569;">Landed Cost Horizon:</td>
              <td style="padding: 10px; font-weight: bold; text-align: right; color: #0f172a;">$${parseFloat(calculationResult.landed_cost_usd || 0).toLocaleString()}</td>
            </tr>
          </table>
        </div>

        <div style="margin-top: 30px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 11px; color: #94a3b8;">
          This submission statement was dispatched via local deployment nodes instantly matching on-screen transaction executions.
        </div>
      </div>
    `;

    console.log(`[LEAD ENGINE] Shipping out generated mail block packet to destination inbox: ${targetReceiver}...`);
    
    await transporter.sendMail({
      from: `"GhanaDuty Marketplace" <${process.env.SMTP_USER}>`,
      to: targetReceiver,
      subject: `🚨 Lead Alert: ${leadDetails.name} - ${calculationResult.vehicle_label}`,
      html: htmlBody,
    });

    console.log('[LEAD ENGINE SUCCESS] Lead packet dispatched successfully!');
    return NextResponse.json({ success: true, message: 'Lead recorded downstream safely.' });

  } catch (error) {
    // CRUCIAL DEBUG LOG: This will output the exact underlying network or auth rejection trace code directly to your terminal screen
    console.error('[GLOBAL LEAD ENGINE CRASH TRACE]:', error);
    return NextResponse.json({ error: 'Internal server endpoint failed to broadcast layout data.' }, { status: 500 });
  }
}