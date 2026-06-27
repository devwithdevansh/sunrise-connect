/**
 * printUtils.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Premium print engine for Sunrise Convent School.
 *
 * KEY FIX: Images are fetched and converted to base64 data URIs so they are
 * embedded directly in the HTML string — no network requests from the iframe,
 * which means logos always load correctly in both dev and production.
 *
 * Architecture:
 *  - fetchAsBase64(url)     → converts any asset URL to a data URI
 *  - generateReceiptHTML()  → premium A4 receipt HTML with embedded images
 *  - generateReportHTML()   → branded A4/landscape report HTML
 *  - printHTML(html)        → injects into hidden iframe → iframe.print()
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { PaymentTransaction } from '../mockData';

// ─── Image → Base64 ───────────────────────────────────────────────────────────

/**
 * Fetch any URL (Vite-resolved asset path) and return a base64 data URI.
 * Returns empty string on failure so print still works without the logo.
 */
export async function fetchAsBase64(url: string): Promise<string> {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return '';
    const blob = await resp.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return '';
  }
}

// ─── Text helpers ─────────────────────────────────────────────────────────────

function toIndianWords(amount: number): string {
  const parts = amount.toFixed(2).split('.');
  const rupees = parseInt(parts[0], 10);
  const paise = parseInt(parts[1], 10);

  const convertPart = (num: number): string => {
    if (num === 0) return '';
    const ones = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
      'Seventeen', 'Eighteen', 'Nineteen',
    ];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const below100 = (n: number): string =>
      n < 20 ? ones[n] : tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');

    const below1000 = (n: number): string =>
      n < 100
        ? below100(n)
        : ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + below100(n % 100) : '');

    let result = '';
    let n = num;
    const crore = Math.floor(n / 10_000_000); n %= 10_000_000;
    const lakh = Math.floor(n / 100_000); n %= 100_000;
    const thousand = Math.floor(n / 1_000); n %= 1_000;

    if (crore) result += below1000(crore) + ' Crore ';
    if (lakh) result += below1000(lakh) + ' Lakh ';
    if (thousand) result += below1000(thousand) + ' Thousand ';
    if (n) result += below1000(n);

    return result.trim();
  };

  if (rupees === 0 && paise === 0) return 'Zero Rupees Only';

  let words = '';
  if (rupees > 0) {
    words += convertPart(rupees) + ' Rupees';
  }
  if (paise > 0) {
    if (rupees > 0) words += ' and ';
    words += convertPart(paise) + ' Paise';
  }
  return words + ' Only';
}

function modeLabel(method: string): string {
  const m = (method || '').toLowerCase();
  if (m === 'cash') return 'Cash';
  if (m === 'upi') return 'UPI / Online';
  if (m === 'online') return 'Online Transfer';
  if (m === 'cheque') return 'Cheque';
  if (['neft', 'rtgs', 'imps'].includes(m)) return m.toUpperCase();
  return method ? method.charAt(0).toUpperCase() + method.slice(1) : 'N/A';
}

function inr(n: number): string {
  return Math.abs(n).toLocaleString('en-IN');
}

export interface SubItem {
  id?: string;
  description: string;
  amount: number;
  concessionAmount: number;
  method?: string;
  status?: string;
}

export function groupSubItems(items: SubItem[]): SubItem[] {
  if (!items || items.length === 0) return [];

  const MONTH_ORDER = [
    'April', 'May', 'June', 'July', 'August', 'September',
    'October', 'November', 'December', 'January', 'February', 'March'
  ];

  const groups: { [key: string]: { items: SubItem[]; months: string[] } } = {};

  for (const item of items) {
    const match = item.description.match(/^(.+?)\s*-\s*(January|February|March|April|May|June|July|August|September|October|November|December)$/i);
    if (match) {
      const rawPrefix = match[1].trim();
      const rawMonth = match[2].charAt(0).toUpperCase() + match[2].slice(1).toLowerCase();
      if (!groups[rawPrefix]) {
        groups[rawPrefix] = { items: [], months: [] };
      }
      groups[rawPrefix].items.push(item);
      groups[rawPrefix].months.push(rawMonth);
    } else {
      const desc = item.description.trim();
      if (!groups[desc]) {
        groups[desc] = { items: [], months: [] };
      }
      groups[desc].items.push(item);
    }
  }

  const result: SubItem[] = [];

  for (const key of Object.keys(groups)) {
    const g = groups[key];
    if (g.months.length > 0) {
      g.months.sort((a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b));
      const startMonth = g.months[0];
      const endMonth = g.months[g.months.length - 1];

      const totalAmt = g.items.reduce((sum, x) => sum + x.amount, 0);
      const totalConcession = g.items.reduce((sum, x) => sum + x.concessionAmount, 0);
      const first = g.items[0];

      const description = startMonth === endMonth
        ? `${key} - ${startMonth}`
        : `${key} - ${startMonth} to ${endMonth}`;

      result.push({
        description,
        amount: totalAmt,
        concessionAmount: totalConcession,
        method: first.method,
        status: first.status,
      });
    } else {
      if (g.items.length === 1) {
        result.push(g.items[0]);
      } else {
        const totalAmt = g.items.reduce((sum, x) => sum + x.amount, 0);
        const totalConcession = g.items.reduce((sum, x) => sum + x.concessionAmount, 0);
        const first = g.items[0];
        result.push({
          description: key,
          amount: totalAmt,
          concessionAmount: totalConcession,
          method: first.method,
          status: first.status,
        });
      }
    }
  }

  return result;
}

// ─── School constants ─────────────────────────────────────────────────────────

const SCH = {
  name: 'SUNRISE CONVENT SCHOOL',
  medium: 'English &amp; Gujarati Medium',
  address: 'Railnagar, Rajkot, Gujarat — 360 001',
  phone: '+91 XXXXX XXXXX',
  email: 'info@sunriseschool.in',
};

// ─── Shared base CSS ──────────────────────────────────────────────────────────

const BASE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600;700&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  font-size: 11px;
  color: #1e293b;
  background: #fff;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}
table { border-collapse: collapse; }
`;

// ─── Premium Receipt HTML ─────────────────────────────────────────────────────

export function generateReceiptHTML(
  transaction: PaymentTransaction,
  opts: { currentUserName?: string; logoBase64?: string; watermarkBase64?: string }
): string {
  const { currentUserName, logoBase64 = '', watermarkBase64 = '' } = opts;

  const totalAmount = Math.abs(transaction.amount);
  const words = toIndianWords(totalAmount);
  const mode = modeLabel(transaction.method || '');
  const receiptNo = (transaction.id?.slice(-12).toUpperCase() || 'N/A');

  const period = (() => {
    if (transaction.studentCode) {
      const match = transaction.studentCode.match(/\/(\d{4})-(\d{2})\//);
      if (match) {
        const startYear = match[1];
        const endYear = startYear.slice(0, 2) + match[2];
        return `${startYear} – ${endYear}`;
      }
    }
    const yearPart = transaction.date ? new Date(transaction.date).getFullYear() : new Date().getFullYear();
    return `${yearPart} – ${yearPart + 1}`;
  })();

  const dateStr = transaction.date
    ? new Date(transaction.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  const timeStr = transaction.time || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  // Fee rows
  const feeRows = (() => {
    if (transaction.subItems?.length) {
      const grouped = groupSubItems(transaction.subItems);
      return grouped.map((item, i) => `
        <tr style="background:${i % 2 === 0 ? '#f8fafd' : '#ffffff'};page-break-inside:avoid;">
          <td style="padding:7px 10px;color:#94a3b8;text-align:center;width:32px;border-right:1px solid #e2e8f0;font-family:'JetBrains Mono',monospace;font-size:9px;">${i + 1}</td>
          <td style="padding:7px 10px;color:#1e293b;font-weight:600;border-right:1px solid #e2e8f0;line-height:1.4;">
            ${item.description}
            ${item.concessionAmount > 0 ? `<span style="display:inline-block;margin-left:6px;font-size:8.5px;color:#b45309;background:#fef3c7;border:1px solid #fcd34d;padding:1px 7px;border-radius:9999px;font-weight:700;">−${item.concessionAmount.toLocaleString('en-IN')} ₹ off</span>` : ''}
          </td>
          <td style="padding:7px 10px;color:#64748b;text-align:center;border-right:1px solid #e2e8f0;width:100px;font-size:9.5px;">${modeLabel(item.method || transaction.method || '')}</td>
          <td style="padding:7px 10px;text-align:right;color:#1b3a6b;font-weight:700;width:115px;font-family:'JetBrains Mono',monospace;font-size:10px;white-space:nowrap;">${inr(item.amount)} ₹</td>
        </tr>
      `).join('');
    }
    return `
      <tr style="background:#f8fafd;page-break-inside:avoid;">
        <td style="padding:7px 10px;color:#94a3b8;text-align:center;width:32px;border-right:1px solid #e2e8f0;font-family:'JetBrains Mono',monospace;font-size:9px;">1</td>
        <td style="padding:7px 10px;color:#1e293b;font-weight:600;border-right:1px solid #e2e8f0;">${transaction.feeType || 'Fee Collection'}</td>
        <td style="padding:7px 10px;color:#64748b;text-align:center;border-right:1px solid #e2e8f0;width:100px;font-size:9.5px;">${mode}</td>
        <td style="padding:7px 10px;text-align:right;color:#1b3a6b;font-weight:700;width:115px;font-family:'JetBrains Mono',monospace;font-size:10px;white-space:nowrap;">${inr(totalAmount)} ₹</td>
      </tr>
    `;
  })();

  const concessionRow = (!transaction.subItems && transaction.concessionAmount) ? `
    <tr style="background:#fffbeb;page-break-inside:avoid;">
      <td style="padding:6px 10px;border-right:1px solid #e2e8f0;"></td>
      <td style="padding:6px 10px;color:#b45309;font-style:italic;font-weight:600;border-right:1px solid #e2e8f0;font-size:9.5px;">
        ✦ Concession Applied
      </td>
      <td style="border-right:1px solid #e2e8f0;"></td>
      <td style="padding:6px 10px;text-align:right;color:#b45309;font-weight:700;font-family:'JetBrains Mono',monospace;font-size:10px;white-space:nowrap;">−${(transaction.concessionAmount || 0).toLocaleString('en-IN')} ₹</td>
    </tr>
  ` : '';

  const signerName = currentUserName ? currentUserName.toUpperCase() : 'AUTHORISED SIGNATORY';
  const logoImg = logoBase64 ? `<img src="${logoBase64}" alt="Logo" style="width:100%;height:100%;object-fit:contain;" />` : '';

  // ─── LAYOUT CONSTANTS (all in mm for consistency) ───────────────────────
  // Header: 110px ≈ 29mm  |  Footer: 60px ≈ 16mm  |  Page: 297mm
  // Content area: 297 - 29 - 16 = 252mm → we use 240mm with 6mm top/bottom padding
  // Horizontal margins: 14mm each side

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Payment Receipt — ${transaction.studentName}</title>
  <style>
    ${BASE_CSS}

    /* ── Page setup ── */
    @page { size: A4 portrait; margin: 0; }

    html, body {
      width: 210mm;
      min-height: 297mm;
      padding: 0;
      margin: 0;
      position: relative;
      background: #fff;
    }

    /* ── Fixed header ── */
    .page-header {
      position: fixed;
      top: 0; left: 0;
      width: 210mm;
      height: 29mm;
      z-index: 100;
      background: #fff;
      border-bottom: 3px solid #1b3a6b;
    }

    /* ── Fixed footer ── */
    .page-footer {
      position: fixed;
      bottom: 0; left: 0;
      width: 210mm;
      height: 16mm;
      z-index: 100;
      background: #fff;
    }

    /* ── Scrollable content body ── */
    .page-content {
      /* Push down past header, pull up before footer */
      margin-top: 29mm;
      margin-bottom: 16mm;
      padding: 6mm 14mm 8mm;
      position: relative;
      z-index: 2;
    }

    /* ── Watermark: fixed, centred, behind everything ── */
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-12deg);
      width: 420px;
      height: 420px;
      opacity: 0.07;
      z-index: 1;
      pointer-events: none;
    }

    /* ── Two-column info grid ── */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 12px;
    }
    .info-col {
      padding: 9px 12px 10px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      background: #f8fafd;
    }
    .info-col + .info-col {
      background: #ffffff;
    }
    .info-col-header {
      font-family: 'Outfit', sans-serif;
      font-size: 8px;
      font-weight: 800;
      color: #1b3a6b;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      border-bottom: 2px solid #e8a020;
      padding-bottom: 5px;
      margin-bottom: 8px;
    }
    .info-row {
      display: flex;
      gap: 6px;
      margin-bottom: 5px;
      align-items: baseline;
      line-height: 1.3;
    }
    .info-row:last-child { margin-bottom: 0; }
    .info-label {
      font-family: 'Outfit', sans-serif;
      font-size: 7.5px;
      font-weight: 700;
      color: #94a3b8;
      width: 80px;
      flex-shrink: 0;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      padding-top: 1px;
    }
    .info-value {
      font-size: 10px;
      font-weight: 600;
      color: #1e293b;
      flex: 1;
      line-height: 1.3;
    }

    /* ── Section header ── */
    .section-hd {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 5px;
    }
    .section-hd-bar {
      width: 3px;
      height: 13px;
      background: #e8a020;
      border-radius: 2px;
      flex-shrink: 0;
    }
    .section-hd-text {
      font-family: 'Outfit', sans-serif;
      font-size: 9px;
      font-weight: 800;
      color: #1b3a6b;
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    /* ── Fee table ── */
    .fee-table {
      width: 100%;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
    }
    .fee-table thead tr {
      background: linear-gradient(135deg, #1b3a6b 0%, #2a5298 100%);
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .fee-table thead th {
      font-family: 'Outfit', sans-serif;
      padding: 8px 10px;
      color: #fff;
      font-size: 8.5px;
      font-weight: 700;
      text-align: left;
      letter-spacing: 0.8px;
      text-transform: uppercase;
    }
    .fee-table thead th:last-child { text-align: right; }
    .fee-table tbody tr { border-bottom: 1px solid #e8edf8; }
    .fee-table tbody tr:last-child { border-bottom: none; }
    .fee-table tfoot tr {
      background: linear-gradient(to bottom, #e8a020, #d97706);
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .fee-table tfoot td {
      padding: 9px 10px;
      color: #1b3a6b;
      font-weight: 800;
      font-family: 'Outfit', sans-serif;
    }
    .fee-table tfoot td.total-label {
      font-size: 10px;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .fee-table tfoot td.total-amt {
      text-align: right;
      font-size: 13px;
      color: #1b3a6b;
      font-family: 'JetBrains Mono', monospace;
      white-space: nowrap;
    }

    /* ── Amount in words ── */
    .words-box {
      margin-top: 10px;
      padding: 9px 12px;
      border-left: 3px solid #e8a020;
      border: 1px solid #e2e8f0;
      border-left: 3px solid #e8a020;
      border-radius: 0 5px 5px 0;
      background: linear-gradient(to right, #fffbf0, #fff);
      font-size: 9.5px;
      color: #334155;
      line-height: 1.5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Remark box ── */
    .remark-box {
      margin-top: 7px;
      padding: 8px 12px;
      border-left: 3px solid #94a3b8;
      border: 1px solid #e2e8f0;
      border-left: 3px solid #94a3b8;
      border-radius: 0 5px 5px 0;
      background: #f8fafd;
      font-size: 9px;
      color: #64748b;
      font-style: italic;
      line-height: 1.4;
    }

    /* ── Signature ── */
    .sig-section {
      display: flex;
      justify-content: flex-end;
      margin-top: 24px;
      padding-top: 8px;
      border-top: 1px dashed #e2e8f0;
    }
    .sig-block { text-align: center; }
    .sig-name {
      font-family: 'Outfit', sans-serif;
      font-size: 10px;
      font-weight: 700;
      color: #1b3a6b;
      margin-bottom: 26px;
      letter-spacing: 0.5px;
    }
    .sig-line {
      width: 160px;
      border-top: 1.5px solid #94a3b8;
      padding-top: 5px;
    }
    .sig-sub {
      font-family: 'Outfit', sans-serif;
      font-size: 8px;
      color: #94a3b8;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  </style>
</head>
<body>

  <!-- WATERMARK -->
  ${watermarkBase64 ? `<img class="watermark" src="${watermarkBase64}" alt="" />` : ''}

  <!-- ════ HEADER ════ -->
  <div class="page-header">
    <!-- Gold block (right, shorter) -->
    <div style="position:absolute;top:0;right:0;width:46%;height:21mm;background:#e8a020;z-index:1;display:flex;flex-direction:column;align-items:flex-end;justify-content:center;padding-right:22px;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
      <div style="font-family:'Outfit',sans-serif;font-size:22px;font-weight:900;letter-spacing:2px;text-transform:uppercase;color:#fff;line-height:1;text-shadow:1px 1px 2px rgba(0,0,0,0.12);">RECEIPT</div>
      <div style="margin-top:4px;background:rgba(255,255,255,0.92);padding:2px 8px;border-radius:4px;font-size:8.5px;color:#1b3a6b;font-weight:700;">
        NO:&nbsp;<span style="font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:900;letter-spacing:0.5px;">${receiptNo}</span>
      </div>
    </div>

    <!-- Navy block (left, full height, curve on bottom-right) -->
    <div style="position:absolute;top:0;left:0;width:62%;height:29mm;background:#1b3a6b;z-index:2;border-bottom-right-radius:32px;display:flex;align-items:center;padding-left:18px;padding-right:14px;gap:12px;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
      <!-- Logo circle -->
      <div style="width:52px;height:52px;border-radius:50%;background:#fff;padding:4px;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 3px 8px rgba(0,0,0,0.18);">
        ${logoImg}
      </div>
      <!-- School details -->
      <div>
        <div style="font-family:'Outfit',sans-serif;font-size:15px;font-weight:900;letter-spacing:0.5px;color:#fff;line-height:1.1;">${SCH.name}</div>
        <div style="font-family:'Outfit',sans-serif;font-size:8px;font-weight:700;color:#fcd34d;margin-top:2px;letter-spacing:0.3px;">${SCH.medium}</div>
        <div style="font-size:7.5px;color:#e2e8f0;margin-top:3px;line-height:1.4;">${SCH.address}<br/>Ph: ${SCH.phone}&nbsp;&nbsp;·&nbsp;&nbsp;${SCH.email}</div>
      </div>
    </div>
  </div>

  <!-- ════ MAIN CONTENT ════ -->
  <div class="page-content">

    <!-- Info Grid -->
    <div class="info-grid">
      <div class="info-col">
        <div class="info-col-header">Student Information</div>
        <div class="info-row">
          <span class="info-label">Name</span>
          <span class="info-value" style="font-size:11px;color:#1b3a6b;font-weight:700;">${transaction.studentName}</span>
        </div>
        ${transaction.classInfo ? `
        <div class="info-row">
          <span class="info-label">Class</span>
          <span class="info-value">${transaction.classInfo}</span>
        </div>` : ''}
        <div class="info-row">
          <span class="info-label">Period</span>
          <span class="info-value">${period}</span>
        </div>
      </div>
      <div class="info-col">
        <div class="info-col-header">Payment Information</div>
        <div class="info-row">
          <span class="info-label">Date</span>
          <span class="info-value">${dateStr}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Time</span>
          <span class="info-value">${timeStr}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Status</span>
          <span class="info-value" style="color:#16a34a;font-weight:700;">✓ Payment Received</span>
        </div>
      </div>
    </div>

    <!-- Fee Table -->
    <div class="section-hd">
      <div class="section-hd-bar"></div>
      <div class="section-hd-text">Payment Details</div>
    </div>

    <table class="fee-table">
      <thead>
        <tr>
          <th style="width:32px;text-align:center;">#</th>
          <th>Description</th>
          <th style="width:100px;text-align:center;">Mode</th>
          <th style="width:115px;text-align:right;">Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${feeRows}
        ${concessionRow}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" class="total-label">Total Paid</td>
          <td class="total-amt">${inr(totalAmount)} ₹</td>
        </tr>
      </tfoot>
    </table>

    <!-- Amount in Words -->
    <div class="words-box">
      <strong style="color:#92400e;">Amount in Words:</strong>&nbsp;<em>${words}</em>
    </div>

    ${transaction.remark ? `
    <div class="remark-box">
      <strong>Remark:</strong> ${transaction.remark}
    </div>` : ''}

    <!-- Signature -->
    <div class="sig-section">
      <div class="sig-block">
        <div class="sig-name">${signerName}</div>
        <div class="sig-line">
          <div class="sig-sub">Authorised Signatory</div>
        </div>
      </div>
    </div>

  </div><!-- /page-content -->

  <!-- ════ FOOTER ════ -->
  <div class="page-footer">
    <!-- Gold block (left, shorter) -->
    <div style="position:absolute;bottom:0;left:0;width:42%;height:12mm;background:#e8a020;z-index:1;display:flex;align-items:center;padding-left:18px;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
      <span style="font-family:'Outfit',sans-serif;font-size:10px;font-weight:900;letter-spacing:1.5px;text-transform:uppercase;color:#1b3a6b;">THANK YOU</span>
    </div>
    <!-- Navy block (right, full height, curve on top-left) -->
    <div style="position:absolute;bottom:0;right:0;width:68%;height:16mm;background:#1b3a6b;z-index:2;border-top-left-radius:32px;display:flex;align-items:center;justify-content:flex-end;padding-right:22px;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
      <div style="display:flex;gap:14px;font-family:'Outfit',sans-serif;font-size:8.5px;font-weight:600;color:#e2e8f0;align-items:center;letter-spacing:0.3px;">
        <span>📞 ${SCH.phone}</span>
        <span style="opacity:0.35;">|</span>
        <span>✉️ ${SCH.email}</span>
        <span style="opacity:0.35;">|</span>
        <span>🌐 www.sunriseschool.in</span>
      </div>
    </div>
  </div>

</body>
</html>`;
}

// ─── Premium Report HTML ──────────────────────────────────────────────────────

export function generateReportHTML(
  report: { type: string; title: string; data: any },
  opts: { logoBase64?: string } = {}
): string {
  const { type, title, data } = report;
  const { logoBase64 = '' } = opts;

  const isLandscape = type === 'outstanding-dues';
  const todayStr = new Date().toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const logoImg = logoBase64 ? `<img src="${logoBase64}" alt="Logo" style="width:100%;height:100%;object-fit:contain;" />` : '';

  const headerHTML = `
    <div style="display:flex;align-items:center;gap:0;margin-bottom:0;page-break-inside:avoid;">
      <div style="width:76px;height:60px;flex-shrink:0;display:flex;align-items:center;justify-content:center;padding:4px 10px 4px 0;">
        ${logoImg}
      </div>
      <div style="width:3px;background:linear-gradient(to bottom,#e8a020,#1b3a6b);align-self:stretch;margin:2px 12px;border-radius:2px;"></div>
      <div style="flex:1;">
        <div style="font-family:'Outfit',sans-serif;font-size:18px;font-weight:900;color:#1b3a6b;letter-spacing:0.5px;line-height:1.1;">${SCH.name}</div>
        <div style="font-size:8.5px;font-weight:700;color:#b45309;margin-top:2px;">${SCH.medium}</div>
        <div style="font-size:8px;color:#64748b;margin-top:2px;">${SCH.address}</div>
      </div>
    </div>
    <div style="height:2.5px;background:linear-gradient(to right,#e8a020,#d08c16,#e8a020);margin:7px 0 2px;-webkit-print-color-adjust:exact;print-color-adjust:exact;"></div>
    <div style="height:1.5px;background:#1b3a6b;margin-bottom:10px;-webkit-print-color-adjust:exact;print-color-adjust:exact;"></div>
    <div style="background:linear-gradient(135deg,#1b3a6b 0%,#2a5298 100%);padding:8px 14px;border-radius:4px;display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
      <div style="font-family:'Outfit',sans-serif;font-size:12px;font-weight:800;color:#fff;letter-spacing:2.5px;text-transform:uppercase;">${title}</div>
      <div style="font-size:8px;color:rgba(255,255,255,0.7);font-family:'Inter',sans-serif;">Generated: ${todayStr}</div>
    </div>
  `;

  // Stat card: consistent padding, no extra margin leakage
  const statCard = (label: string, val: string, color = '#1a1a2e') => `
    <div style="border:1px solid #dde4f0;border-radius:6px;padding:10px 14px;background:#f8fafd;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
      <div style="font-family:'Outfit',sans-serif;font-size:7.5px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:4px;">${label}</div>
      <div style="font-family:'Outfit',sans-serif;font-size:15px;font-weight:800;color:${color};line-height:1.1;">${val}</div>
    </div>
  `;

  // Table styles: tighter cells, consistent font sizing
  const thStyle = `padding:7px 9px;background:linear-gradient(135deg,#1b3a6b 0%,#2a5298 100%);color:#fff;font-family:'Outfit',sans-serif;font-size:8px;font-weight:700;text-align:left;white-space:nowrap;letter-spacing:0.5px;-webkit-print-color-adjust:exact;print-color-adjust:exact;`;
  const thRStyle = `${thStyle}text-align:right;`;
  const tdStyle = `padding:6px 9px;border-bottom:1px solid #e8edf8;font-size:9px;color:#334155;line-height:1.3;`;
  const tdRStyle = `${tdStyle}text-align:right;font-weight:700;font-family:'JetBrains Mono',monospace;`;

  const footerHTML = `
    <div style="margin-top:18px;border-top:1px solid #e2e8f0;padding-top:10px;display:flex;justify-content:space-between;align-items:flex-end;page-break-inside:avoid;">
      <div style="font-size:8px;color:#94a3b8;font-style:italic;line-height:1.5;">
        <strong style="color:#1b3a6b;font-style:normal;">Sunrise Connect</strong> — School Administration System<br/>
        This report is system-generated. Verify figures with the school office.
      </div>
      <div style="width:130px;border-top:1px solid #94a3b8;padding-top:5px;text-align:center;font-size:8px;color:#64748b;">
        Authorised Signature<br/><span style="font-size:7.5px;color:#94a3b8;">Office of the School Principal</span>
      </div>
    </div>
  `;

  let bodyHTML = '';

  if (type === 'daily-collections') {
    const rows = (data.transactions || []).map((t: any, i: number) => `
      <tr style="background:${i % 2 === 0 ? '#f8fafd' : '#fff'};page-break-inside:avoid;">
        <td style="${tdStyle}color:#94a3b8;text-align:center;font-size:8.5px;">${i + 1}</td>
        <td style="${tdStyle}font-family:'JetBrains Mono',monospace;font-size:8.5px;color:#64748b;">${t.studentCode || '—'}</td>
        <td style="${tdStyle}font-weight:600;">${t.studentName}</td>
        <td style="${tdStyle}">${t.classInfo || '—'}</td>
        <td style="${tdStyle}">${(t.feeType || '').replace(/\n/g, ', ')}</td>
        <td style="${tdStyle}font-weight:600;text-transform:uppercase;font-size:8.5px;">${t.method || '—'}</td>
        <td style="${tdStyle}color:#64748b;font-size:8.5px;">${t.time || '—'}</td>
        <td style="${tdRStyle}color:#1b3a6b;">₹${(t.amount || 0).toLocaleString('en-IN')}</td>
      </tr>
    `).join('');

    bodyHTML = `
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px;">
        ${statCard('Total Collected', `₹${(data.totalCollected || 0).toLocaleString('en-IN')}`, '#1b3a6b')}
        ${statCard('Cash', `₹${(data.cashCollected || 0).toLocaleString('en-IN')}`)}
        ${statCard('Online / UPI', `₹${(data.onlineCollected || 0).toLocaleString('en-IN')}`)}
        ${statCard('Cheque', `₹${(data.chequeCollected || 0).toLocaleString('en-IN')}`)}
      </div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #dde4f0;border-radius:6px;overflow:hidden;">
        <thead><tr>
          <th style="${thStyle}width:28px;text-align:center;">#</th>
          <th style="${thStyle}">Code</th>
          <th style="${thStyle}">Student Name</th>
          <th style="${thStyle}">Class</th>
          <th style="${thStyle}">Fee Category</th>
          <th style="${thStyle}">Method</th>
          <th style="${thStyle}">Time</th>
          <th style="${thRStyle}">Amount</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  if (type === 'outstanding-dues') {
    const avg = data.studentCount > 0 ? Math.round(data.totalOutstandingAmount / data.studentCount) : 0;
    const rows = (data.students || []).map((s: any, i: number) => `
      <tr style="background:${i % 2 === 0 ? '#f8fafd' : '#fff'};page-break-inside:avoid;">
        <td style="${tdStyle}color:#94a3b8;text-align:center;font-size:8.5px;">${i + 1}</td>
        <td style="${tdStyle}font-family:'JetBrains Mono',monospace;font-size:8.5px;color:#64748b;">${s.studentCode || '—'}</td>
        <td style="${tdStyle}font-weight:600;">${s.studentName}</td>
        <td style="${tdStyle}">${s.classInfo || '—'}</td>
        <td style="${tdStyle}">${s.parentName || '—'}</td>
        <td style="${tdStyle}color:#64748b;font-size:8.5px;">${s.parentMobile || '—'}</td>
        <td style="${tdStyle}font-weight:600;color:#64748b;">${s.overdueCount} Months</td>
        <td style="${tdRStyle}color:#ea580c;">₹${(s.educationDue || 0).toLocaleString('en-IN')}</td>
        <td style="${tdRStyle}color:#d97706;">₹${(s.transportDue || 0).toLocaleString('en-IN')}</td>
        <td style="${tdRStyle}color:#1b3a6b;font-size:10px;">₹${(s.totalDue || 0).toLocaleString('en-IN')}</td>
      </tr>
    `).join('');

    bodyHTML = `
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px;">
        ${statCard('Total Outstanding', `₹${(data.totalOutstandingAmount || 0).toLocaleString('en-IN')}`, '#dc2626')}
        ${statCard('Students with Dues', `${data.studentCount || 0}`)}
        ${statCard('Avg. Due / Student', `₹${avg.toLocaleString('en-IN')}`)}
        ${statCard('Aging 1M / 2M / 3M+', `${data.oneDueCount || 0} / ${data.twoDueCount || 0} / ${data.threePlusDueCount || 0}`)}
      </div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #dde4f0;overflow:hidden;">
        <thead><tr>
          <th style="${thStyle}width:28px;text-align:center;">#</th>
          <th style="${thStyle}">Code</th>
          <th style="${thStyle}">Student Name</th>
          <th style="${thStyle}">Class</th>
          <th style="${thStyle}">Parent</th>
          <th style="${thStyle}">Mobile</th>
          <th style="${thStyle}">Overdue</th>
          <th style="${thRStyle}">Edu Dues</th>
          <th style="${thRStyle}">Trans Dues</th>
          <th style="${thRStyle}">Total Due</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  if (type === 'rte-reconcile') {
    const rows = (data.students || []).map((s: any, i: number) => `
      <tr style="background:${i % 2 === 0 ? '#f8fafd' : '#fff'};page-break-inside:avoid;">
        <td style="${tdStyle}color:#94a3b8;text-align:center;font-size:8.5px;">${i + 1}</td>
        <td style="${tdStyle}font-family:'JetBrains Mono',monospace;font-size:8.5px;color:#64748b;">${s.studentCode || '—'}</td>
        <td style="${tdStyle}font-weight:600;">${s.studentName}</td>
        <td style="${tdStyle}">${s.classInfo || '—'}</td>
        <td style="${tdStyle}">${s.parentName || '—'}</td>
        <td style="${tdStyle}color:#64748b;font-size:8.5px;">${s.parentMobile || '—'}</td>
        <td style="${tdRStyle}color:#4338ca;font-size:10px;">₹${(s.exemptedAmount || 0).toLocaleString('en-IN')}</td>
      </tr>
    `).join('');

    bodyHTML = `
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:12px;">
        ${statCard('Total RTE Enrolled', `${data.studentCount || 0} Students`)}
        ${statCard('Total Exempted Tuition', `₹${(data.totalExemptedAmount || 0).toLocaleString('en-IN')}`, '#4338ca')}
      </div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #dde4f0;overflow:hidden;">
        <thead><tr>
          <th style="${thStyle}width:28px;text-align:center;">#</th>
          <th style="${thStyle}">Code</th>
          <th style="${thStyle}">Student Name</th>
          <th style="${thStyle}">Class &amp; Section</th>
          <th style="${thStyle}">Parent Name</th>
          <th style="${thStyle}">Mobile</th>
          <th style="${thRStyle}">Exempted Amount</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    ${BASE_CSS}
    @page { size: A4 ${isLandscape ? 'landscape' : 'portrait'}; margin: 8mm 10mm; }
    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
    tr { page-break-inside: avoid; }
  </style>
</head>
<body>
  <div style="position:relative;">
    ${headerHTML}
    ${bodyHTML}
    ${footerHTML}
  </div>
</body>
</html>`;
}

// ─── iframe print engine ──────────────────────────────────────────────────────

export function printHTML(html: string): void {
  const existing = document.getElementById('__sunrise-print-frame');
  if (existing) existing.remove();

  const iframe = document.createElement('iframe');
  iframe.id = '__sunrise-print-frame';
  iframe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;border:0;visibility:hidden;';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) return;
  doc.open();
  doc.write(html);
  doc.close();

  const imgs = Array.from(doc.querySelectorAll('img'));
  if (imgs.length === 0) {
    setTimeout(() => { iframe.contentWindow?.print(); setTimeout(() => iframe.remove(), 1500); }, 120);
    return;
  }

  let loaded = 0;
  const tryPrint = () => {
    if (++loaded >= imgs.length) {
      setTimeout(() => { iframe.contentWindow?.print(); setTimeout(() => iframe.remove(), 1500); }, 120);
    }
  };
  imgs.forEach(img => {
    if (img.complete) tryPrint();
    else { img.addEventListener('load', tryPrint); img.addEventListener('error', tryPrint); }
  });
}