/**
 * printUtils.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Central print engine.
 * • Injects HTML into a hidden <iframe> and triggers iframe.contentWindow.print()
 * • Fully self-contained HTML strings: no React DOM pollution during print
 * • Supports @page A4 portrait/landscape with proper page-break rules
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { PaymentTransaction } from '../mockData';

// ─── helpers ─────────────────────────────────────────────────────────────────

function toIndianWords(num: number): string {
  if (num === 0) return 'Zero';
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
  if (crore)   result += below1000(crore)   + ' Crore ';
  if (lakh)    result += below1000(lakh)    + ' Lakh ';
  if (thousand) result += below1000(thousand) + ' Thousand ';
  if (n)       result += below1000(n);
  return result.trim();
}

function getModeLabel(method: string): string {
  const m = (method || '').toLowerCase();
  if (m === 'cash')   return 'Cash';
  if (m === 'upi')    return 'UPI / Online';
  if (m === 'online') return 'Online';
  if (m === 'cheque') return 'Cheque';
  if (m === 'neft' || m === 'rtgs' || m === 'imps') return m.toUpperCase();
  return method ? method.charAt(0).toUpperCase() + method.slice(1) : 'N/A';
}

function fmt(n: number): string {
  return Math.abs(n).toLocaleString('en-IN');
}

// ─── shared branded header HTML ──────────────────────────────────────────────
// We embed the logo as a URL so the iframe can load it.
// We resolve it from the same origin at runtime.

function logoUrl(): string {
  // Vite builds assets to /assets/... — we resolve from current origin
  // Use a CSS background-color sun icon as fallback if logo path differs
  return `${window.location.origin}/src/assets/sunrise-logo.png`;
}

function watermarkUrl(): string {
  return `${window.location.origin}/src/assets/sunrise-round-logo.png`;
}

const SCHOOL_NAME = 'SUNRISE CONVENT SCHOOL';
const SCHOOL_ADDRESS = 'Railnagar, Rajkot, Gujarat';
const SCHOOL_PHONE = '+91 XXXXX XXXXX';
const SCHOOL_EMAIL = 'info@sunriseschool.in';
const SCHOOL_MEDIUM = 'English &amp; Gujarati Medium';

// ─── Shared CSS base ─────────────────────────────────────────────────────────
const BASE_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    font-size: 11px;
    color: #1a1a2e;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  table { border-collapse: collapse; width: 100%; }
  .gold { color: #d08c16; }
  .navy { color: #1b3a6b; }
  .stripe-even { background: rgba(0,0,0,0.025); }
`;

// ─── Branded header block ─────────────────────────────────────────────────────
function brandedHeader(logoSrc: string): string {
  return `
    <div class="header-block" style="display:flex;align-items:center;gap:16px;margin-bottom:8px;page-break-inside:avoid;">
      <div style="flex-shrink:0;width:190px;">
        <img src="${logoSrc}" alt="Sunrise School Logo"
             style="width:100%;height:auto;object-fit:contain;"
             onerror="this.style.display='none'" />
      </div>
      <div style="flex:1;">
        <div style="font-size:22px;font-weight:800;color:#1b3a6b;letter-spacing:0.5px;line-height:1.1;">${SCHOOL_NAME}</div>
        <div style="font-size:11px;font-weight:700;color:#d08c16;margin-top:3px;">${SCHOOL_MEDIUM}</div>
        <div style="font-size:10.5px;color:#555;margin-top:2px;">${SCHOOL_ADDRESS}</div>
        <div style="font-size:10.5px;color:#555;margin-top:1px;">Ph: ${SCHOOL_PHONE} &nbsp;|&nbsp; Email: ${SCHOOL_EMAIL}</div>
      </div>
    </div>
    <div style="height:4px;background:#e8a020;margin-bottom:3px;"></div>
    <div style="height:2px;background:#1b3a6b;margin-bottom:14px;"></div>
  `;
}

// ─── Receipt HTML generator ───────────────────────────────────────────────────
export function generateReceiptHTML(
  transaction: PaymentTransaction,
  currentUserName?: string
): string {
  const totalAmount = Math.abs(transaction.amount);
  const amountInWords = `${toIndianWords(totalAmount)} Rupees Only`;
  const modeLabel = getModeLabel(transaction.method || '');

  const period = (() => {
    if (transaction.subItems && transaction.subItems.length > 0) {
      const months = transaction.subItems.map(i => i.description.split(' ')[0]);
      return months.length > 1
        ? `${months[0]} – ${months[months.length - 1]} (${months.length} Months)`
        : months[0];
    }
    return transaction.feeType || '—';
  })();

  const metaRows: { label: string; value: string }[] = [
    { label: 'Receipt No.', value: (transaction.id?.slice(-16).toUpperCase() || 'N/A') },
    { label: 'Student Name', value: transaction.studentName },
    ...(transaction.studentCode ? [{ label: 'Student Code', value: transaction.studentCode }] : []),
    ...(transaction.classInfo ? [{ label: 'Class', value: transaction.classInfo }] : []),
    { label: 'Period', value: period },
    {
      label: 'Payment Date',
      value: `${transaction.date || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })},  ${transaction.time || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`,
    },
    { label: 'Payment Mode', value: modeLabel },
  ];

  const metaRowsHTML = metaRows.map((row, i) => `
    <tr style="background:${i % 2 === 0 ? 'rgba(0,0,0,0.025)' : 'transparent'};">
      <td style="padding:6px 12px;font-weight:700;color:#1b3a6b;width:155px;white-space:nowrap;">${row.label}</td>
      <td style="padding:6px 4px;font-weight:700;color:#555;width:12px;">:</td>
      <td style="padding:6px 12px;color:#333;font-weight:600;">${row.value}</td>
    </tr>
  `).join('');

  const feeRows = (() => {
    if (transaction.subItems && transaction.subItems.length > 0) {
      return transaction.subItems.map((item, i) => `
        <tr style="background:${i % 2 === 0 ? 'rgba(0,0,0,0.025)' : 'transparent'};border-bottom:1px solid #e4eaf4;page-break-inside:avoid;">
          <td style="padding:7px 10px;color:#444;width:34px;">${i + 1}</td>
          <td style="padding:7px 10px;color:#333;">
            ${item.description}
            ${item.concessionAmount > 0 ? `<span style="color:#e8a020;font-size:9.5px;margin-left:8px;font-weight:600;">(−₹${item.concessionAmount.toLocaleString('en-IN')} concession)</span>` : ''}
          </td>
          <td style="padding:7px 10px;color:#555;">${getModeLabel(item.method || transaction.method || '')}</td>
          <td style="padding:7px 10px;text-align:right;color:#333;font-weight:600;">₹${fmt(item.amount)}</td>
        </tr>
      `).join('');
    }
    return `
      <tr style="background:rgba(0,0,0,0.025);border-bottom:1px solid #e4eaf4;">
        <td style="padding:7px 10px;color:#444;">1</td>
        <td style="padding:7px 10px;color:#333;">${transaction.feeType || 'Fee Collection'}</td>
        <td style="padding:7px 10px;color:#555;">${modeLabel}</td>
        <td style="padding:7px 10px;text-align:right;font-weight:600;">₹${fmt(totalAmount)}</td>
      </tr>
    `;
  })();

  const concessionRow = (!transaction.subItems && transaction.concessionAmount) ? `
    <tr style="background:rgba(232,160,32,0.05);border-bottom:1px solid #e4eaf4;">
      <td style="padding:7px 10px;"></td>
      <td style="padding:7px 10px;color:#e8a020;font-style:italic;">Concession Applied</td>
      <td style="padding:7px 10px;"></td>
      <td style="padding:7px 10px;text-align:right;color:#e8a020;font-weight:600;">−₹${(transaction.concessionAmount || 0).toLocaleString('en-IN')}</td>
    </tr>
  ` : '';

  const signerName = currentUserName ? currentUserName.toUpperCase() : 'AUTHORISED SIGNATORY';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Payment Receipt — ${transaction.studentName}</title>
  <style>
    ${BASE_CSS}
    @page {
      size: A4 portrait;
      margin: 10mm 12mm;
    }
    body { padding: 0; }
    .page { position: relative; min-height: 257mm; }
    .watermark {
      position: fixed;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      opacity: 0.07;
      pointer-events: none;
      z-index: 0;
      width: 420px;
    }
    .content { position: relative; z-index: 1; }
    .title-bar {
      background: #1b3a6b;
      color: #fff;
      text-align: center;
      padding: 9px 0;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 3px;
      margin-bottom: 16px;
      page-break-inside: avoid;
    }
    .section-header {
      color: #1b3a6b;
      font-weight: 800;
      font-size: 11.5px;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
      border-bottom: 2px solid #1b3a6b;
      padding-bottom: 3px;
      page-break-after: avoid;
    }
    .fee-table th {
      padding: 8px 10px;
      background: #516f9e;
      color: #fff;
      font-size: 11px;
      font-weight: 700;
    }
    .fee-table th:last-child { text-align: right; }
    .total-row td {
      padding: 9px 10px;
      background: #1b3a6b;
      color: #fff;
      font-weight: 800;
    }
    .total-row td:last-child { text-align: right; font-size: 13px; }
    .words-box {
      border-left: 4px solid #e8a020;
      padding: 7px 12px;
      background: #fffbf0;
      margin: 12px 0 16px;
      font-size: 11px;
      color: #333;
      page-break-inside: avoid;
    }
    .sig-row {
      display: flex;
      justify-content: flex-end;
      align-items: flex-end;
      margin: 10px 0 18px;
      page-break-inside: avoid;
    }
    .sig-line {
      width: 170px;
      border-top: 1.5px solid #888;
      padding-top: 4px;
      text-align: center;
    }
    .footer-box {
      border-left: 4px solid #e8a020;
      padding: 7px 12px;
      background: #fffaf0;
      font-size: 10px;
      color: #666;
      font-style: italic;
      page-break-inside: avoid;
    }
  </style>
</head>
<body>
  <img class="watermark" src="${watermarkUrl()}" alt="" />
  <div class="page">
    <div class="content">
      ${brandedHeader(logoUrl())}

      <div class="title-bar">PAYMENT RECEIPT</div>

      <table style="margin-bottom:16px;">
        <tbody>${metaRowsHTML}</tbody>
      </table>

      <div class="section-header">PAYMENT DETAILS</div>

      <table class="fee-table" style="margin-bottom:6px;">
        <thead>
          <tr>
            <th style="width:34px;text-align:left;">#</th>
            <th style="text-align:left;">Description</th>
            <th style="text-align:left;width:110px;">Mode</th>
            <th style="width:110px;">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${feeRows}
          ${concessionRow}
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="3">TOTAL PAID</td>
            <td>₹ ${fmt(totalAmount)}</td>
          </tr>
        </tfoot>
      </table>

      <div class="words-box">
        <strong>Amount in Words:</strong>&nbsp;<em>${amountInWords}</em>
      </div>

      ${transaction.remark ? `
        <div class="words-box" style="margin-top:-8px;">
          <strong>Remark:</strong>&nbsp;<em>${transaction.remark}</em>
        </div>
      ` : ''}

      <div class="sig-row">
        <div>
          <div style="font-size:10px;font-weight:700;color:#333;text-align:center;margin-bottom:34px;">${signerName}</div>
          <div class="sig-line">
            <div style="font-size:9px;color:#666;margin-top:2px;">Authorised Signatory</div>
          </div>
        </div>
      </div>

      <div class="footer-box">
        This is a computer-generated receipt and does not require a physical signature.<br/>
        For queries, contact: Sunrise Convent School, Railnagar, Rajkot, Gujarat.
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ─── Report HTML generator ────────────────────────────────────────────────────
export function generateReportHTML(report: { type: string; title: string; data: any }): string {
  const { type, title, data } = report;
  const todayStr = new Date().toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const isLandscape = type === 'outstanding-dues';

  const reportBody = (() => {
    if (type === 'daily-collections') {
      const rows = (data.transactions || []).map((t: any, idx: number) => `
        <tr style="page-break-inside:avoid;" class="${idx % 2 === 0 ? 'stripe-even' : ''}">
          <td>${idx + 1}</td>
          <td style="font-family:monospace;color:#555;">${t.studentCode || '—'}</td>
          <td style="font-weight:700;color:#1a1a2e;">${t.studentName}</td>
          <td>${t.classInfo || '—'}</td>
          <td>${(t.feeType || '').replace(/\n/g, ', ')}</td>
          <td style="font-weight:700;text-transform:uppercase;">${t.method || '—'}</td>
          <td style="color:#666;">${t.time || '—'}</td>
          <td style="text-align:right;font-weight:700;color:#1b3a6b;">₹${(t.amount || 0).toLocaleString('en-IN')}</td>
        </tr>
      `).join('');

      return `
        <div class="summary-grid" style="grid-template-columns:repeat(4,1fr);">
          <div class="stat-card"><div class="stat-label">Total Collected</div><div class="stat-val">₹${(data.totalCollected||0).toLocaleString('en-IN')}</div></div>
          <div class="stat-card"><div class="stat-label">Cash</div><div class="stat-val">₹${(data.cashCollected||0).toLocaleString('en-IN')}</div></div>
          <div class="stat-card"><div class="stat-label">Online</div><div class="stat-val">₹${(data.onlineCollected||0).toLocaleString('en-IN')}</div></div>
          <div class="stat-card"><div class="stat-label">Cheque</div><div class="stat-val">₹${(data.chequeCollected||0).toLocaleString('en-IN')}</div></div>
        </div>
        <table class="data-table">
          <thead><tr>
            <th>S.No</th><th>Code</th><th>Student Name</th><th>Class &amp; Medium</th>
            <th>Fee Category</th><th>Method</th><th>Time</th><th class="right">Amount</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      `;
    }

    if (type === 'outstanding-dues') {
      const rows = (data.students || []).map((s: any, idx: number) => `
        <tr style="page-break-inside:avoid;" class="${idx % 2 === 0 ? 'stripe-even' : ''}">
          <td>${idx + 1}</td>
          <td style="font-family:monospace;color:#555;">${s.studentCode || '—'}</td>
          <td style="font-weight:700;color:#1a1a2e;">${s.studentName}</td>
          <td>${s.classInfo || '—'}</td>
          <td>${s.parentName || '—'}</td>
          <td style="color:#666;">${s.parentMobile || '—'}</td>
          <td style="font-weight:700;color:#666;">${s.overdueCount} Months</td>
          <td style="text-align:right;font-weight:700;color:#ea580c;">₹${(s.educationDue||0).toLocaleString('en-IN')}</td>
          <td style="text-align:right;font-weight:700;color:#d97706;">₹${(s.transportDue||0).toLocaleString('en-IN')}</td>
          <td style="text-align:right;font-weight:800;color:#1b3a6b;">₹${(s.totalDue||0).toLocaleString('en-IN')}</td>
        </tr>
      `).join('');

      const avgDue = data.studentCount > 0 ? Math.round(data.totalOutstandingAmount / data.studentCount) : 0;

      return `
        <div class="summary-grid" style="grid-template-columns:repeat(4,1fr);">
          <div class="stat-card"><div class="stat-label">Total Outstanding</div><div class="stat-val red">₹${(data.totalOutstandingAmount||0).toLocaleString('en-IN')}</div></div>
          <div class="stat-card"><div class="stat-label">Students with Dues</div><div class="stat-val">${data.studentCount||0}</div></div>
          <div class="stat-card"><div class="stat-label">Avg. Dues / Student</div><div class="stat-val">₹${avgDue.toLocaleString('en-IN')}</div></div>
          <div class="stat-card"><div class="stat-label">Dues Aging (1M / 2M / 3M+)</div><div class="stat-val">${data.oneDueCount||0} / ${data.twoDueCount||0} / ${data.threePlusDueCount||0}</div></div>
        </div>
        <table class="data-table">
          <thead><tr>
            <th>S.No</th><th>Code</th><th>Student Name</th><th>Class</th>
            <th>Parent Name</th><th>Mobile</th><th>Overdue</th>
            <th class="right">Edu Dues</th><th class="right">Trans Dues</th><th class="right">Total Due</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      `;
    }

    if (type === 'rte-reconcile') {
      const rows = (data.students || []).map((s: any, idx: number) => `
        <tr style="page-break-inside:avoid;" class="${idx % 2 === 0 ? 'stripe-even' : ''}">
          <td>${idx + 1}</td>
          <td style="font-family:monospace;color:#555;">${s.studentCode || '—'}</td>
          <td style="font-weight:700;color:#1a1a2e;">${s.studentName}</td>
          <td>${s.classInfo || '—'}</td>
          <td>${s.parentName || '—'}</td>
          <td style="color:#666;">${s.parentMobile || '—'}</td>
          <td style="text-align:right;font-weight:800;color:#4338ca;">₹${(s.exemptedAmount||0).toLocaleString('en-IN')}</td>
        </tr>
      `).join('');

      return `
        <div class="summary-grid" style="grid-template-columns:repeat(2,1fr);">
          <div class="stat-card"><div class="stat-label">Total RTE Enrolled</div><div class="stat-val">${data.studentCount||0} Students</div></div>
          <div class="stat-card"><div class="stat-label">Total Exempted Tuition</div><div class="stat-val indigo">₹${(data.totalExemptedAmount||0).toLocaleString('en-IN')}</div></div>
        </div>
        <table class="data-table">
          <thead><tr>
            <th>S.No</th><th>Code</th><th>Student Name</th><th>Class &amp; Section</th>
            <th>Parent Name</th><th>Mobile</th><th class="right">Exempted Amount</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      `;
    }

    return '<p>Unknown report type.</p>';
  })();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    ${BASE_CSS}
    @page {
      size: A4 ${isLandscape ? 'landscape' : 'portrait'};
      margin: 10mm 12mm;
    }
    body { padding: 0; }
    .report-header { page-break-inside: avoid; page-break-after: avoid; }
    .title-bar {
      background: #1b3a6b;
      color: #fff;
      text-align: center;
      padding: 8px 0;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 2px;
      margin-bottom: 14px;
    }
    .summary-grid {
      display: grid;
      gap: 10px;
      margin-bottom: 16px;
      page-break-inside: avoid;
    }
    .stat-card {
      border: 1px solid #dde3ed;
      border-radius: 6px;
      padding: 8px 12px;
      background: #f7f9fc;
    }
    .stat-label { font-size: 9px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-val { font-size: 14px; font-weight: 800; color: #1a1a2e; margin-top: 3px; }
    .stat-val.red { color: #dc2626; }
    .stat-val.indigo { color: #4338ca; }
    .data-table { font-size: 9.5px; }
    .data-table thead tr { background: #1b3a6b; }
    .data-table thead th {
      padding: 7px 8px;
      color: #fff;
      font-weight: 700;
      text-align: left;
      white-space: nowrap;
    }
    .data-table thead th.right { text-align: right; }
    .data-table tbody td { padding: 6px 8px; border-bottom: 1px solid #e8edf5; color: #333; }
    .data-table tbody tr:hover { background: #f0f4ff; }
    .stripe-even { background: rgba(0,0,0,0.018); }
    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
    .footer-box {
      margin-top: 24px;
      border-top: 1px solid #dde3ed;
      padding-top: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 9px;
      color: #888;
      page-break-inside: avoid;
    }
    .sig-line {
      width: 150px;
      border-top: 1px solid #aaa;
      padding-top: 4px;
      text-align: center;
      font-size: 9px;
      color: #555;
    }
  </style>
</head>
<body>
  <div class="report-header">
    ${brandedHeader(logoUrl())}
    <div class="title-bar">${title.toUpperCase()}</div>
    <div style="font-size:9px;color:#888;text-align:right;margin-top:-10px;margin-bottom:12px;">Generated: ${todayStr}</div>
  </div>

  ${reportBody}

  <div class="footer-box">
    <div>
      <div style="font-weight:700;color:#555;">Sunrise Connect Administration System</div>
      <div style="font-size:8px;color:#aaa;">Securely verified via Digital Ledger Access Protocol</div>
    </div>
    <div class="sig-line">
      Authorised Signature<br/>
      <span style="font-size:8px;color:#aaa;">Office of the School Principal</span>
    </div>
  </div>
</body>
</html>`;
}

// ─── iframe print engine ──────────────────────────────────────────────────────

/**
 * Injects HTML into a hidden iframe and calls print().
 * The iframe is removed automatically after printing.
 */
export function printHTML(html: string): void {
  // Remove any stale iframe
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

  // Wait for images to load before printing
  const imgs = doc.querySelectorAll('img');
  const imgCount = imgs.length;

  if (imgCount === 0) {
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => iframe.remove(), 1000);
    }, 100);
  } else {
    let loaded = 0;
    const tryPrint = () => {
      loaded++;
      if (loaded >= imgCount) {
        setTimeout(() => {
          iframe.contentWindow?.print();
          setTimeout(() => iframe.remove(), 1000);
        }, 100);
      }
    };
    imgs.forEach(img => {
      if (img.complete) {
        tryPrint();
      } else {
        img.addEventListener('load', tryPrint);
        img.addEventListener('error', tryPrint); // print even if logo fails
      }
    });
  }
}
