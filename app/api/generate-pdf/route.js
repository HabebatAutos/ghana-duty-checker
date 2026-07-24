// app/api/generate-pdf/route.js
import { NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

function fmtGhs(n) {
  return 'GHC ' + parseFloat(n || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtUsd(n) {
  return '$' + parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export async function POST(request) {
  try {
    const { result, vehicleData, isLeadSubmitted = false } = await request.json();

    if (!result) {
      return NextResponse.json({ error: 'Missing calculation summary dataset matrices.' }, { status: 400 });
    }

    // Initialize an A4 canvas document sheet (Points: 595.28 width x 841.89 height)
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]);

    // Embed isolated core standard typography layers directly from internal byte maps
    const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Dynamic color profile constants
    const pGreen = rgb(0.02, 0.39, 0.24);      // #05643c
    const pDark = rgb(0.06, 0.09, 0.16);       // #0f172a
    const pMuted = rgb(0.28, 0.33, 0.41);      // #475569
    const bgSoft = rgb(0.97, 0.98, 0.99);      // #f8fafc
    const bgGreen = rgb(0.90, 0.96, 0.92);     // #e6f4ea
    const borderGreen = rgb(0.73, 0.97, 0.82); // #bbf7d0
    const borderLight = rgb(0.80, 0.84, 0.88); // #cbd5e1

   // --- LOAD & EMBED THE PNG LOGO IMAGE ---
  let embeddedLogo;
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo.png');
    const logoBytes = fs.readFileSync(logoPath);
    embeddedLogo = await pdfDoc.embedPng(logoBytes);
  } catch (imageError) {
    console.warn('[PDF GENERATION WARNING]: Logo file not found at public/logo.png, skipping asset embedding.', imageError);
  }

  // --- BRANDED TOP HEADER BANNER BAR ---
  page.drawRectangle({ x: 0, y: 841.89 - 105, width: 595.28, height: 105, color: pGreen });
  
  // BRAND ASSET: Draw the logo asset (enlarged to 64x64 and cleanly centered)
  if (embeddedLogo) {
    page.drawImage(embeddedLogo, {
      x: 45,
      y: 841.89 - 84.5, // Perfectly centers the 64px logo inside the 105px banner area
      width: 64,
      height: 64,
    });
  } else {
    page.drawRectangle({ x: 45, y: 841.89 - 65, width: 24, height: 24, color: rgb(1,1,1) });
    page.drawText('CD', { x: 50, y: 841.89 - 58, size: 12, font: fontBold, color: pGreen });
  }

  // Header text coordinates shifted further right (124px) to accommodate the larger 64px logo width safely
  const titleXCoord = embeddedLogo ? 124 : 79;
  page.drawText('GHANA VEHICLE IMPORT DUTY ADVISOR', { x: titleXCoord, y: 841.89 - 46, size: 13.5, font: fontBold, color: rgb(1,1,1), letterSpacing: -0.01 });
  page.drawText('Statutory Simulation Ledger • Compliant with Customs Act 2015 (Act 891)', { x: titleXCoord, y: 841.89 - 62, size: 9, font: fontReg, color: rgb(1,1,1), opacity: 0.85 });

    // --- WATERMARK ADVISORY BANNER BLOCK (Shifted right to prevent layout overlapping) ---
    page.drawRectangle({ x: 440, y: 841.89 - 72, width: 110, height: 40, borderColor: rgb(1,1,1), borderWidth: 1.5, opacity: 0.4 });
    page.drawText('OFFICIAL ASSESSMENT', { x: 447, y: 841.89 - 50, size: 8, font: fontBold, color: rgb(1,1,1) });
    page.drawText('LOGISTICS SIMULATION', { x: 448, y: 841.89 - 62, size: 7, font: fontReg, color: rgb(1,1,1) });

    // --- SECTION A: VEHICLE BASE SPEC PROFILE ---
    let y = 715;
    page.drawText(result.vehicle_label || 'VEHICLE RECORD STATEMENT', { x: 45, y: y, size: 13, font: fontBold, color: pDark });
    
    y = 700;
    page.drawLine({ start: { x: 45, y: y }, end: { x: 550, y: y }, thickness: 0.5, color: borderLight });
    
    y = 680;
    page.drawText('Chassis Token (VIN):', { x: 45, y: y, size: 9, font: fontReg, color: pMuted });
    page.drawText(vehicleData?.vin || 'NOT PROVIDED / MANUAL ENTRY', { x: 155, y: y, size: 9, font: fontBold, color: pDark });
    page.drawText('Assessment Date:', { x: 350, y: y, size: 9, font: fontReg, color: pMuted });
    page.drawText(new Date().toISOString().split('T')[0], { x: 460, y: y, size: 9, font: fontReg, color: pDark });
    
    y = 665;
    page.drawText('Origin Hub Market:', { x: 45, y: y, size: 9, font: fontReg, color: pMuted });
    page.drawText(String(vehicleData?.origin || 'USA').toUpperCase(), { x: 155, y: y, size: 9, font: fontBold, color: pDark });
    page.drawText('Exchange Index Axis:', { x: 350, y: y, size: 9, font: fontReg, color: pMuted });
    page.drawText(result.exchange_label || '1 USD = GHC 11.77', { x: 460, y: y, size: 8.5, font: fontBold, color: pDark });

    // --- SECTION B: PRIMARY SUMMARY BOX CARDS ---
    y = 595;
    // Box 1: CIF Base
    page.drawRectangle({ x: 45, y: y, width: 160, height: 52, color: bgSoft, borderColor: borderLight, borderWidth: 1 });
    page.drawText('CUSTOMS CIF BASE', { x: 55, y: y + 34, size: 8, font: fontBold, color: pMuted });
    page.drawText(fmtGhs(result.cif_ghs), { x: 55, y: y + 14, size: 11, font: fontBold, color: pDark });

    // Box 2: Total Liability Green Card
    page.drawRectangle({ x: 215, y: y, width: 165, height: 52, color: bgGreen, borderColor: borderGreen, borderWidth: 1 });
    page.drawText('PORT DUTY LIABILITY', { x: 225, y: y + 34, size: 8, font: fontBold, color: rgb(0.07, 0.45, 0.20) });
    page.drawText(fmtGhs(result.total_duty_ghs), { x: 225, y: y + 14, size: 11, font: fontBold, color: rgb(0.07, 0.45, 0.20) });

    // Box 3: Landed Cost
    page.drawRectangle({ x: 390, y: y, width: 160, height: 52, color: bgSoft, borderColor: borderLight, borderWidth: 1 });
    page.drawText('ESTIMATED LANDED COST', { x: 400, y: y + 34, size: 8, font: fontBold, color: pMuted });
    page.drawText(fmtUsd(result.landed_cost_usd), { x: 400, y: y + 14, size: 11, font: fontBold, color: pDark });

    // --- SECTION C: ITEMIZED PORT DUTIES LEDGER (Shifted up slightly for enhanced spacing balance) ---
    y = 575;
    page.drawText('Itemized Statutory Port Entry Clearance Ledger', { x: 45, y: y, size: 11, font: fontBold, color: pDark });
    
    y = 545;
    page.drawRectangle({ x: 45, y: y, width: 505, height: 20, color: rgb(0.95, 0.96, 0.98) });
    page.drawText('STATUTORY DUTY COMPONENT ELEMENT CORRIDOR (ACT 891)', { x: 52, y: y + 6, size: 8, font: fontBold, color: pMuted });
    page.drawText('PAYABLE VALUE', { x: 470, y: y + 6, size: 8, font: fontBold, color: pMuted });
    
    y = 525;
    const d = result.duties || {};
    const dutyLines = [
      ['Import Duty Base Parameter (10% CIF)', d.import_duty],
      ['National Health Insurance Levy (NHIL 2.5%)', d.nhil],
      ['GETFund Allocation Levy (2.5%)', d.getfund],
      ['Import Value Added Tax (VAT 15%)', d.import_vat],
      ['ECOWAS Transnational Levy (0.5%)', d.ecowas],
      ['Vehicle Examination Inspection Fee (1%)', d.exam_fee],
      ['Network Operating Interface Charge (0.4%)', d.network_charges],
      ['  Network Operational Subsidiary NHIL Sub-allocation', d.network_nhil],
      ['  Network Operational GETFund Allocation', d.network_getfund],
      ['  Network Operational Interface processing VAT', d.network_vat],
      ['Special Import Control Levy (2%)', d.special_import_levy],
      ['EXIM Bank Development Support Allocation (0.75%)', d.exim_levy],
      ['African Union Strategic Allocation (0.2%)', d.au_levy],
      ['Vehicle Safety Certification Clearance Fee', d.cert_fee],
      ['Ghana Shippers Authority Standard Processing Fee', d.shippers_fee],
      ['Ministry of Trade e-ID System Processing integration', d.moti_fee],
      ['Port Health Sanitary Disinfection Treatment Fee', d.disinfection_fee],
      [`Overage Administrative Penalty Component (${result.overage_rate_label || '0%'})`, d.overage_penalty],
    ];

    // Expanded row step height from 15.5 to 18.5 points to provide pristine document breathing room
    const rowHeight = 18.5;
    dutyLines.forEach(([label, value], index) => {
      if (index % 2 === 0) {
        page.drawRectangle({ x: 45, y: y, width: 505, height: rowHeight, color: bgSoft });
      }
      page.drawText(label, { x: 52, y: y + 5, size: 7.5, font: fontReg, color: rgb(0.2, 0.25, 0.33) });
      
      const valStr = fmtGhs(value);
      page.drawText(valStr, { x: 540 - fontBold.widthOfTextAtSize(valStr, 8), y: y + 5, size: 8, font: fontBold, color: pDark });
      y -= rowHeight;
    });

    // Total Duties Ledger Box Banner
    y -= 4;
    page.drawRectangle({ x: 45, y: y, width: 505, height: 22, color: bgGreen });
    page.drawText('TOTAL STATUTORY PORT ENTRY DUTIES PAYABLE', { x: 52, y: y + 7, size: 8.5, font: fontBold, color: rgb(0.07, 0.45, 0.20) });
    
    const totalStr = fmtGhs(result.total_duty_ghs);
    page.drawText(totalStr, { x: 540 - fontBold.widthOfTextAtSize(totalStr, 9), y: y + 7, size: 9, font: fontBold, color: rgb(0.07, 0.45, 0.20) });
    
    // --- SECTION E: VERIFIED PORT LOGISTICS & SERVICE PROVIDERS OR ADMINISTRATIVE FALLBACK ---
    y -= 26;
    page.drawText('Verified Port Entry Logistics Partners & Valuation Services', { x: 45, y: y, size: 10, font: fontBold, color: pDark });
    
    y -= 44;
    if (isLeadSubmitted) {
      // Provider Column Card Layout 1: Clearing Broker Referral Allocation
      page.drawRectangle({ x: 45, y: y, width: 245, height: 38, color: bgSoft, borderColor: borderLight, borderWidth: 0.5 });
      page.drawText('VETTED CUSTOMS CLEARING BROKERS', { x: 52, y: y + 25, size: 7, font: fontBold, color: pGreen });
      page.drawText('Forward this document layout to verify port entry timelines with trusted handlers.', { x: 52, y: y + 11, size: 6.5, font: fontReg, color: pMuted });

      // Provider Column Card Layout 2: Valuation/Inspection Agency Referral Allocation
      page.drawRectangle({ x: 305, y: y, width: 245, height: 38, color: bgSoft, borderColor: borderLight, borderWidth: 0.5 });
      page.drawText('VEHICLE QUALITY INSPECTION & DISPUTE EXPERTS', { x: 312, y: y + 25, size: 7, font: fontBold, color: pDark });
      page.drawText('Verify condition appraisals or secure official valuation reviews to prevent port overpricing.', { x: 312, y: y + 11, size: 6.5, font: fontReg, color: pMuted });
    } else {
      // Fallback Layout: Direct Administrative Support Desk Box
      page.drawRectangle({ x: 45, y: y, width: 505, height: 38, color: bgSoft, borderColor: borderGreen, borderWidth: 0.5 });
      
      // Decorative branding left boundary indicator line
      page.drawRectangle({ x: 45, y: y, width: 3, height: 38, color: pGreen });

      // Top title string block
      page.drawText('DIRECT ASSISTANCE SUPPORT DESK — Contact Administrator for logistics and clearing support', { x: 55, y: y + 25, size: 7.5, font: fontBold, color: pGreen });
      
      // Inline contact info row block
      const contactInfoRow = 'Call: +233 20 677 5587    |    WhatsApp: +44 7411 545196    |    Email: hasconsult71@gmail.com';
      page.drawText(contactInfoRow, { x: 55, y: y + 11, size: 7.5, font: fontReg, color: pDark });
    }

    // --- SECTION D: LEGAL STATUTORY DISCLAIMER ---
    y -= 54;
    page.drawRectangle({ x: 45, y: y, width: 505, height: 46, color: rgb(0.98, 0.98, 0.98), borderColor: borderLight, borderWidth: 0.5 });
    
    const txt1 = "Statutory Proviso Rule Clause: Calculated parameters reflect appraisal methodologies locked down inside the";
    const txt2 = "Ghana Revenue Authority Customs Act 2015 (Act 891) runtime specifications. System metrics are deployed exclusively for";
    const txt3 = "vehicle logistics planning assessment and terminal entry sheet simulation. Realized execution figures remain tied";
    const txt4 = "directly to the live Bank of Ghana currency valuations active on transaction registration day.";
    
    page.drawText(txt1, { x: 52, y: y + 34, size: 7, font: fontReg, color: pMuted });
    page.drawText(txt2, { x: 52, y: y + 25, size: 7, font: fontReg, color: pMuted });
    page.drawText(txt3, { x: 52, y: y + 16, size: 7, font: fontReg, color: pMuted });
    page.drawText(txt4, { x: 52, y: y + 7, size: 7, font: fontReg, color: pMuted });

    // --- FOOTER BRAND STAMP ---
    const footerTxt = '© 2026 CediDuty Platform Registry Engine • Generated via Local Workspace Deployment Node';
    page.drawText(footerTxt, {
      x: 297.64 - fontReg.widthOfTextAtSize(footerTxt, 7.5) / 2,
      y: 20,
      size: 7.5,
      font: fontReg,
      color: rgb(0.58, 0.64, 0.72)
    });

    const pdfBytes = await pdfDoc.save();
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=CediDuty-Report.pdf',
        'Content-Length': pdfBytes.length,
      },
    });

  } catch (err) {
    console.error('[GLOBAL PDF ROUTE EXCEPTION TRACE]', err);
    return NextResponse.json({ error: 'Internal system architecture layout compilation breakdown.' }, { status: 500 });
  }
}