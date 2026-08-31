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

// StandardFonts (WinAnsi encoding) can only render Latin-1 range characters.
// Any character outside that range (CJK, emoji, etc.) crashes pdf-lib's drawText.
// This strips/transliterates unsupported characters so the route never 500s
// regardless of what text data flows in (e.g. Japanese-market vehicle names).
const WINANSI_SAFE_RANGE = /[^\x00-\xFF]/g;

function toSafePdfText(input) {
  if (input === null || input === undefined) return '';
  const str = String(input);
  // Normalize first so accented Latin characters (e.g. e-acute) collapse correctly
  // rather than being dropped, then strip anything still outside WinAnsi's range.
  const normalized = str.normalize('NFKC');
  return normalized.replace(WINANSI_SAFE_RANGE, '');
}

// Wraps a PDFPage so every drawText call automatically sanitizes its text argument.
// This protects every existing drawText call site in this file without needing
// to edit each one individually.
function makeSafePage(page) {
  const originalDrawText = page.drawText.bind(page);
  page.drawText = (text, options) => originalDrawText(toSafePdfText(text), options);
  return page;
}

export async function POST(request) {
  try {
    const { result, vehicleData, isLeadSubmitted = false } = await request.json();

    if (!result) {
      return NextResponse.json({ error: 'Missing calculation summary dataset matrices.' }, { status: 400 });
    }

    // Initialize PDF document (will create pages as needed)
    const pdfDoc = await PDFDocument.create();

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

    // Disclaimer colors
    const bgYellow = rgb(0.99, 0.98, 0.91);    // #fef3c7
    const borderYellow = rgb(0.98, 0.95, 0.71); // #fbbf24
    const textYellow = rgb(0.92, 0.64, 0.06);  // #eb9806

    const bgPurple = rgb(0.98, 0.97, 0.99);    // #ede9fe
    const borderPurple = rgb(0.93, 0.91, 0.98); // #ede9fe
    const textPurple = rgb(0.59, 0.46, 0.89);  // #9966dd

    // WHT-excluded disclaimer colors (matches web result's blue info banner)
    const bgBlue = rgb(0.94, 0.98, 1.0);       // #f0f9ff
    const borderBlue = rgb(0.22, 0.74, 0.97);  // #38bdf8
    const textBlue = rgb(0.01, 0.41, 0.63);    // #0369a1

    // --- LOAD & EMBED THE PNG LOGO IMAGE ---
    let embeddedLogo;
    try {
      const logoPath = path.join(process.cwd(), 'public', 'logo.png');
      const logoBytes = fs.readFileSync(logoPath);
      embeddedLogo = await pdfDoc.embedPng(logoBytes);
    } catch (imageError) {
      console.warn('[PDF GENERATION WARNING]: Logo file not found at public/logo.png, skipping asset embedding.', imageError);
    }

    // Helper function to draw header on a page
    function drawPageHeader(page, pageNum, totalPages) {
      // --- BRANDED TOP HEADER BANNER BAR ---
      page.drawRectangle({ x: 0, y: 841.89 - 105, width: 595.28, height: 105, color: pGreen });

      // BRAND ASSET: Draw the logo asset (enlarged to 64x64 and cleanly centered)
      if (embeddedLogo) {
        page.drawImage(embeddedLogo, {
          x: 45,
          y: 841.89 - 84.5,
          width: 64,
          height: 64,
        });
      } else {
        page.drawRectangle({ x: 45, y: 841.89 - 65, width: 24, height: 24, color: rgb(1,1,1) });
        page.drawText('CD', { x: 50, y: 841.89 - 58, size: 12, font: fontBold, color: pGreen });
      }

      const titleXCoord = embeddedLogo ? 124 : 79;
      page.drawText('GHANA VEHICLE IMPORT DUTY ADVISOR', { x: titleXCoord, y: 841.89 - 46, size: 13.5, font: fontBold, color: rgb(1,1,1), letterSpacing: -0.01 });
      page.drawText('Statutory Simulation Ledger . Compliant with Customs Act 2015 (Act 891)', { x: titleXCoord, y: 841.89 - 62, size: 9, font: fontReg, color: rgb(1,1,1), opacity: 0.85 });

      // --- WATERMARK ADVISORY BANNER BLOCK ---
      page.drawRectangle({ x: 440, y: 841.89 - 72, width: 110, height: 40, borderColor: rgb(1,1,1), borderWidth: 1.5, opacity: 0.4 });
      page.drawText('OFFICIAL ASSESSMENT', { x: 447, y: 841.89 - 50, size: 8, font: fontBold, color: rgb(1,1,1) });
      page.drawText('LOGISTICS SIMULATION', { x: 448, y: 841.89 - 62, size: 7, font: fontReg, color: rgb(1,1,1) });
    }

    // Helper function to draw footer on a page
    function drawPageFooter(page, pageNum, totalPages) {
      const footerTxt = 'c 2026 CediDuty Platform Registry Engine . Generated via Local Workspace Deployment Node';
      page.drawText(footerTxt, {
        x: 297.64 - fontReg.widthOfTextAtSize(footerTxt, 7.5) / 2,
        y: 20,
        size: 7.5,
        font: fontReg,
        color: rgb(0.58, 0.64, 0.72)
      });

      // Page number at bottom
      page.drawText(`Page ${pageNum} of ${totalPages}`, {
        x: 297.64 - fontReg.widthOfTextAtSize(`Page ${pageNum} of ${totalPages}`, 8) / 2,
        y: 10,
        size: 8,
        font: fontReg,
        color: rgb(0.58, 0.64, 0.72)
      });
    }

    // Helper to draw a duty ledger row (with alternating stripe by absolute index)
    function drawDutyRow(page, label, value, yPos, rowHeight, stripeIndex) {
      if (stripeIndex % 2 === 0) {
        page.drawRectangle({ x: 45, y: yPos, width: 505, height: rowHeight, color: bgSoft });
      }
      const textBaseline = yPos + rowHeight / 2 - 3;
      page.drawText(label, { x: 52, y: textBaseline, size: 7.5, font: fontReg, color: rgb(0.2, 0.25, 0.33) });
      const valStr = fmtGhs(value);
      page.drawText(valStr, { x: 540 - fontBold.widthOfTextAtSize(valStr, 8), y: textBaseline, size: 8, font: fontBold, color: pDark });
    }

    // ============================================
    // PAGE 1: Header + Vehicle Specs + Summary + Disclaimer (if applicable)
    //         + FULL Itemized Statutory Port Entry Clearance Ledger (section 2, entirely)
    // ============================================
    const page1 = makeSafePage(pdfDoc.addPage([595.28, 841.89]));
    drawPageHeader(page1, 1, 2);

    let y = 715;

    // --- SECTION A: VEHICLE BASE SPEC PROFILE ---
    // Guard against a duplicated model token in vehicle_label (e.g. "2016 AUDI Q7 Q7 TF1"),
    // which happens if the caller concatenates model name twice upstream.
    function dedupeConsecutiveWords(str) {
      if (!str) return str;
      const words = str.split(' ');
      const out = [];
      for (let i = 0; i < words.length; i++) {
        if (i > 0 && words[i].toLowerCase() === words[i - 1].toLowerCase()) continue;
        out.push(words[i]);
      }
      return out.join(' ');
    }
    const vehicleLabel = dedupeConsecutiveWords(result.vehicle_label) || 'VEHICLE RECORD STATEMENT';
    page1.drawText(vehicleLabel, { x: 45, y: y, size: 13, font: fontBold, color: pDark });

    y = 700;
    page1.drawLine({ start: { x: 45, y: y }, end: { x: 550, y: y }, thickness: 0.5, color: borderLight });

    y = 680;
    page1.drawText('Chassis Token (VIN):', { x: 45, y: y, size: 9, font: fontReg, color: pMuted });
    page1.drawText(vehicleData?.vin || 'NOT PROVIDED / MANUAL ENTRY', { x: 155, y: y, size: 9, font: fontBold, color: pDark });
    page1.drawText('Assessment Date:', { x: 350, y: y, size: 9, font: fontReg, color: pMuted });
    page1.drawText(new Date().toISOString().split('T')[0], { x: 460, y: y, size: 9, font: fontReg, color: pDark });

    y = 665;
    page1.drawText('Origin Hub Market:', { x: 45, y: y, size: 9, font: fontReg, color: pMuted });
    page1.drawText(String(vehicleData?.origin || 'USA').toUpperCase(), { x: 155, y: y, size: 9, font: fontBold, color: pDark });
    page1.drawText('Exchange Index Axis:', { x: 350, y: y, size: 9, font: fontReg, color: pMuted });
    page1.drawText(result.exchange_label || '1 USD = GHC 11.77', { x: 460, y: y, size: 8.5, font: fontBold, color: pDark });

    // --- SECTION B: PRIMARY SUMMARY BOX CARDS ---
    y = 595;
    // Box 1: CIF Base
    page1.drawRectangle({ x: 45, y: y, width: 160, height: 52, color: bgSoft, borderColor: borderLight, borderWidth: 1 });
    page1.drawText('CUSTOMS CIF BASE', { x: 55, y: y + 34, size: 8, font: fontBold, color: pMuted });
    page1.drawText(fmtGhs(result.cif_ghs), { x: 55, y: y + 14, size: 11, font: fontBold, color: pDark });

    // Box 2: Total Liability Green Card
    page1.drawRectangle({ x: 215, y: y, width: 165, height: 52, color: bgGreen, borderColor: borderGreen, borderWidth: 1 });
    page1.drawText('PORT DUTY LIABILITY', { x: 225, y: y + 34, size: 8, font: fontBold, color: rgb(0.07, 0.45, 0.20) });
    page1.drawText(fmtGhs(result.total_duty_ghs), { x: 225, y: y + 14, size: 11, font: fontBold, color: rgb(0.07, 0.45, 0.20) });

    // Box 3: Landed Cost
    page1.drawRectangle({ x: 390, y: y, width: 160, height: 52, color: bgSoft, borderColor: borderLight, borderWidth: 1 });
    page1.drawText('ESTIMATED LANDED COST', { x: 400, y: y + 34, size: 8, font: fontBold, color: pMuted });
    page1.drawText(fmtUsd(result.landed_cost_usd), { x: 400, y: y + 14, size: 11, font: fontBold, color: pDark });

    // --- MSRP DISCLAIMER (if user-provided or AI-assisted) + WHT DISCLAIMER (if excluded) ---
    const msrpSourceType = result.msrp_source_type || 'gra_verified';
    y = 575;
    let disclaimerDrawn = false;

    if (msrpSourceType === 'user_provided') {
      page1.drawRectangle({ x: 45, y: y - 60, width: 505, height: 55, color: bgYellow, borderColor: borderYellow, borderWidth: 1 });

      page1.drawText('MSRP DISCLAIMER - USER PROVIDED:', {
        x: 60,
        y: y - 25,
        size: 10,
        font: fontBold,
        color: textYellow,
      });

      const userText = 'The original manufacturer price used in this calculation was provided directly by you and has not been verified against GRA records or any external source. Final duty may vary based on port valuation.';
      const userLines = userText.match(/.{1,80}/g) || [];

      userLines.forEach((line, idx) => {
        page1.drawText(line, {
          x: 60,
          y: y - 38 - (idx * 9),
          size: 8,
          font: fontReg,
          color: textYellow,
        });
      });

      y -= 65;
      disclaimerDrawn = true;
    } else if (msrpSourceType === 'ai_assisted') {
      page1.drawRectangle({ x: 45, y: y - 60, width: 505, height: 55, color: bgPurple, borderColor: borderPurple, borderWidth: 1 });

      page1.drawText('MSRP DISCLAIMER - AI ASSISTED:', {
        x: 60,
        y: y - 25,
        size: 10,
        font: fontBold,
        color: textPurple,
      });

      const aiText = 'The original manufacturer price used in this calculation was estimated using AI-assisted research and has not been independently verified against GRA records. Final duty may vary based on port valuation.';
      const aiLines = aiText.match(/.{1,80}/g) || [];

      aiLines.forEach((line, idx) => {
        page1.drawText(line, {
          x: 60,
          y: y - 38 - (idx * 9),
          size: 8,
          font: fontReg,
          color: textPurple,
        });
      });

      y -= 65;
      disclaimerDrawn = true;
    }

    // WHT disclaimer draws independently below any MSRP disclaimer (or at
    // the top slot if none was shown), since the two are unrelated facts
    // (price provenance vs. the importer's own tax status) and either or
    // both can apply to a given report.
    if (result.withholding_tax_applied === false) {
      page1.drawRectangle({ x: 45, y: y - 60, width: 505, height: 55, color: bgBlue, borderColor: borderBlue, borderWidth: 1 });

      page1.drawText('WITHHOLDING TAX EXCLUDED:', {
        x: 60,
        y: y - 25,
        size: 10,
        font: fontBold,
        color: textBlue,
      });

      const whtText = 'This estimate does not include the 1% Withholding Tax, based on your selection at calculation time. If it turns out WHT applies to your import, add roughly 1% of the CIF value to this total.';
      const whtLines = whtText.match(/.{1,80}/g) || [];

      whtLines.forEach((line, idx) => {
        page1.drawText(line, {
          x: 60,
          y: y - 38 - (idx * 9),
          size: 8,
          font: fontReg,
          color: textBlue,
        });
      });

      y -= 65;
      disclaimerDrawn = true;
    }

    if (!disclaimerDrawn) {
      // No disclaimer shown, so don't leave a gap sized for one
      y -= 15;
    }

    y -= 15;

    // --- SECTION C: ITEMIZED PORT DUTIES LEDGER (kept ENTIRELY on page 1, including the total) ---
    page1.drawText('Itemized Statutory Port Entry Clearance Ledger', { x: 45, y: y, size: 11, font: fontBold, color: pDark });

    y -= 30;
    page1.drawRectangle({ x: 45, y: y, width: 505, height: 20, color: rgb(0.95, 0.96, 0.98) });
    page1.drawText('STATUTORY DUTY COMPONENT ELEMENT CORRIDOR (ACT 891)', { x: 52, y: y + 6, size: 8, font: fontBold, color: pMuted });
    page1.drawText('PAYABLE VALUE', { x: 470, y: y + 6, size: 8, font: fontBold, color: pMuted });

    y -= 20;
    const d = result.duties || {};

    // Import Duty rate is now resolved per-vehicle by HS Code on the
    // calculate route (see result.import_duty_rate_label), not a flat
    // 10% — this label previously stayed hardcoded even after that
    // change, showing "10% CIF" regardless of the rate actually used.
    const importDutyLabel = result.import_duty_rate_label
      ? `Import Duty Base Parameter (${result.import_duty_rate_label} CIF)`
      : 'Import Duty Base Parameter';

    // Full, single, unbroken list of every duty line item - this entire section stays on page 1
    const allDutyLines = [
      [importDutyLabel, d.import_duty],
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
      [`1% Withholding Tax on Import${result.withholding_tax_applied === false ? ' (not applied)' : ''}`, d.withholding_tax],
      ['Vehicle Safety Certification Clearance Fee', d.cert_fee],
      ['Ghana Shippers Authority Standard Processing Fee', d.shippers_fee],
      ['Ministry of Trade e-ID System Processing integration', d.moti_fee],
      ['Port Health Sanitary Disinfection Treatment Fee', d.disinfection_fee],
      [`Overage Administrative Penalty Component (${result.overage_rate_label || '0%'})`, d.overage_penalty],
    ];

    const rowHeight = 21;

    // Dynamically size row height to fill available space down to the total box,
    // so section 2 always fits completely on page 1 with no wasted gaps.
    const minY = 95; // floor above the footer
    const available = y - minY - 26; // -26 for total box + gap
    let effectiveRowHeight = Math.min(rowHeight, available / allDutyLines.length);
    effectiveRowHeight = Math.max(11, effectiveRowHeight);

    allDutyLines.forEach(([label, value], index) => {
      drawDutyRow(page1, label, value, y, effectiveRowHeight, index);
      y -= effectiveRowHeight;
    });

    // Total Duties Box - part of section 2, stays on page 1
    y -= 4;
    page1.drawRectangle({ x: 45, y: y, width: 505, height: 22, color: bgGreen });
    page1.drawText('TOTAL STATUTORY PORT ENTRY DUTIES PAYABLE', { x: 52, y: y + 7, size: 8.5, font: fontBold, color: rgb(0.07, 0.45, 0.20) });

    const totalStr = fmtGhs(result.total_duty_ghs);
    page1.drawText(totalStr, { x: 540 - fontBold.widthOfTextAtSize(totalStr, 9), y: y + 7, size: 9, font: fontBold, color: rgb(0.07, 0.45, 0.20) });

    drawPageFooter(page1, 1, 2);

    // ============================================
    // PAGE 2: Section D (Landed Cost Breakdown) onward
    // ============================================
    const page2 = makeSafePage(pdfDoc.addPage([595.28, 841.89]));
    drawPageHeader(page2, 2, 2);

    y = 715;

    // --- SECTION D: LANDED COST BREAKDOWN ---
    page2.drawText('Landed Cost Breakdown - Total Budget Summary', { x: 45, y: y, size: 11, font: fontBold, color: pDark });

    y -= 30;
    page2.drawRectangle({ x: 45, y: y, width: 505, height: 20, color: rgb(0.95, 0.96, 0.98) });
    page2.drawText('COST COMPONENT', { x: 52, y: y + 6, size: 8, font: fontBold, color: pMuted });
    page2.drawText('AMOUNT (USD)', { x: 470, y: y + 6, size: 8, font: fontBold, color: pMuted });

    y -= 20;

    const costRows = [
      ['Purchase Price (FOB)', fmtUsd(result.purchase_price_usd)],
      ['Freight Shipping Cost', fmtUsd(result.freight_usd)],
      ['Marine Insurance (~1%)', fmtUsd(result.insurance_usd)],
      ['Total Port Customs Duty & Taxes', fmtUsd(result.total_duty_usd)],
    ];

    costRows.forEach(([label, value], index) => {
      if (index % 2 === 0) {
        page2.drawRectangle({ x: 45, y: y, width: 505, height: rowHeight, color: bgSoft });
      } else {
        page2.drawRectangle({ x: 45, y: y, width: 505, height: rowHeight, color: rgb(1, 1, 1) });
      }

      page2.drawText(label, { x: 52, y: y + 5, size: 8, font: fontReg, color: rgb(0.2, 0.25, 0.33) });
      page2.drawText(value, { x: 540 - fontBold.widthOfTextAtSize(value, 8), y: y + 5, size: 8, font: fontBold, color: pDark });
      y -= rowHeight;
    });

    // Total Landed Cost Box (Green)
    y -= 4;
    page2.drawRectangle({ x: 45, y: y, width: 505, height: 22, color: bgGreen });
    page2.drawText('TOTAL ESTIMATED LANDED COST', { x: 52, y: y + 7, size: 8.5, font: fontBold, color: rgb(0.07, 0.45, 0.20) });

    const landedStr = fmtUsd(result.landed_cost_usd);
    page2.drawText(landedStr, { x: 540 - fontBold.widthOfTextAtSize(landedStr, 9), y: y + 7, size: 9, font: fontBold, color: rgb(0.07, 0.45, 0.20) });

    // --- SECTION E: VERIFIED PORT LOGISTICS & SERVICE PROVIDERS ---
    y -= 35;
    page2.drawText('Verified Port Entry Logistics Partners & Valuation Services', { x: 45, y: y, size: 10, font: fontBold, color: pDark });

    y -= 44;
    if (isLeadSubmitted) {
      // Provider Column Card Layout 1
      page2.drawRectangle({ x: 45, y: y, width: 245, height: 38, color: bgSoft, borderColor: borderLight, borderWidth: 0.5 });
      page2.drawText('VETTED CUSTOMS CLEARING BROKERS', { x: 52, y: y + 25, size: 7, font: fontBold, color: pGreen });
      page2.drawText('Forward this document layout to verify port entry timelines with trusted handlers.', { x: 52, y: y + 11, size: 6.5, font: fontReg, color: pMuted });

      // Provider Column Card Layout 2
      page2.drawRectangle({ x: 305, y: y, width: 245, height: 38, color: bgSoft, borderColor: borderLight, borderWidth: 0.5 });
      page2.drawText('VEHICLE QUALITY INSPECTION & DISPUTE EXPERTS', { x: 312, y: y + 25, size: 7, font: fontBold, color: pDark });
      page2.drawText('Verify condition appraisals or secure official valuation reviews to prevent port overpricing.', { x: 312, y: y + 11, size: 6.5, font: fontReg, color: pMuted });
    } else {
      // Fallback Layout
      page2.drawRectangle({ x: 45, y: y, width: 505, height: 38, color: bgSoft, borderColor: borderGreen, borderWidth: 0.5 });
      page2.drawRectangle({ x: 45, y: y, width: 3, height: 38, color: pGreen });

      page2.drawText('DIRECT ASSISTANCE SUPPORT DESK - Contact Administrator for logistics and clearing support', { x: 55, y: y + 25, size: 7.5, font: fontBold, color: pGreen });

      const contactInfoRow = 'Call: +233 20 677 5587    |    WhatsApp: +44 7411 545196    |    Email: hasconsult71@gmail.com';
      page2.drawText(contactInfoRow, { x: 55, y: y + 11, size: 7.5, font: fontReg, color: pDark });
    }

    // --- LEGAL STATUTORY DISCLAIMER ---
    y -= 54;
    page2.drawRectangle({ x: 45, y: y, width: 505, height: 46, color: rgb(0.98, 0.98, 0.98), borderColor: borderLight, borderWidth: 0.5 });

    const txt1 = "Statutory Proviso Rule Clause: Calculated parameters reflect appraisal methodologies locked down inside the";
    const txt2 = "Ghana Revenue Authority Customs Act 2015 (Act 891) runtime specifications. System metrics are deployed exclusively for";
    const txt3 = "vehicle logistics planning assessment and terminal entry sheet simulation. Realized execution figures remain tied";
    const txt4 = "directly to the live Bank of Ghana currency valuations active on transaction registration day.";

    page2.drawText(txt1, { x: 52, y: y + 34, size: 7, font: fontReg, color: pMuted });
    page2.drawText(txt2, { x: 52, y: y + 25, size: 7, font: fontReg, color: pMuted });
    page2.drawText(txt3, { x: 52, y: y + 16, size: 7, font: fontReg, color: pMuted });
    page2.drawText(txt4, { x: 52, y: y + 7, size: 7, font: fontReg, color: pMuted });

    drawPageFooter(page2, 2, 2);

    // Save and return PDF
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