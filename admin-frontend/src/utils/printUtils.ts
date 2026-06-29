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

import type { PaymentTransaction } from "../mockData";

// ─── Image → Base64 ───────────────────────────────────────────────────────────

/**
 * Fetch any URL (Vite-resolved asset path) and return a base64 data URI.
 * Returns empty string on failure so print still works without the logo.
 */
export async function fetchAsBase64(url: string): Promise<string> {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return "";
    const blob = await resp.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
}

// ─── Text helpers ─────────────────────────────────────────────────────────────

function toIndianWords(amount: number): string {
  const parts = amount.toFixed(2).split(".");
  const rupees = parseInt(parts[0], 10);
  const paise = parseInt(parts[1], 10);

  const convertPart = (num: number): string => {
    if (num === 0) return "";
    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];
    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    const below100 = (n: number): string =>
      n < 20
        ? ones[n]
        : tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");

    const below1000 = (n: number): string =>
      n < 100
        ? below100(n)
        : ones[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 ? " " + below100(n % 100) : "");

    let result = "";
    let n = num;
    const crore = Math.floor(n / 10_000_000);
    n %= 10_000_000;
    const lakh = Math.floor(n / 100_000);
    n %= 100_000;
    const thousand = Math.floor(n / 1_000);
    n %= 1_000;

    if (crore) result += below1000(crore) + " Crore ";
    if (lakh) result += below1000(lakh) + " Lakh ";
    if (thousand) result += below1000(thousand) + " Thousand ";
    if (n) result += below1000(n);

    return result.trim();
  };

  if (rupees === 0 && paise === 0) return "Zero Rupees Only";

  let words = "";
  if (rupees > 0) {
    words += convertPart(rupees) + " Rupees";
  }
  if (paise > 0) {
    if (rupees > 0) words += " and ";
    words += convertPart(paise) + " Paise";
  }
  return words + " Only";
}

function modeLabel(method: string): string {
  const m = (method || "").toLowerCase();
  if (m === "cash") return "Cash";
  if (m === "upi") return "UPI / Online";
  if (m === "online") return "Online Transfer";
  if (m === "cheque") return "Cheque";
  if (["neft", "rtgs", "imps"].includes(m)) return m.toUpperCase();
  return method ? method.charAt(0).toUpperCase() + method.slice(1) : "N/A";
}

function inr(n: number): string {
  return Math.abs(n).toLocaleString("en-IN");
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
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
    "January",
    "February",
    "March",
  ];

  const groups: { [key: string]: { items: SubItem[]; months: string[] } } = {};

  for (const item of items) {
    const match = item.description.match(
      /^(.+?)\s*-\s*(January|February|March|April|May|June|July|August|September|October|November|December)$/i,
    );
    if (match) {
      const rawPrefix = match[1].trim();
      const rawMonth =
        match[2].charAt(0).toUpperCase() + match[2].slice(1).toLowerCase();
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
      const totalConcession = g.items.reduce(
        (sum, x) => sum + x.concessionAmount,
        0,
      );
      const first = g.items[0];

      const description =
        startMonth === endMonth
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
        const totalConcession = g.items.reduce(
          (sum, x) => sum + x.concessionAmount,
          0,
        );
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
  name: "SUNRISE SCHOOL RAJKOT",
  medium: "English &amp; Gujarati Medium",
  address: "Railnagar, Rajkot, Gujarat — 360 001",
  phone: "+91 97236 55151",
  email: "info@sunriseschoolrajkot.com",
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
  opts: {
    currentUserName?: string;
    logoBase64?: string;
    watermarkBase64?: string;
  },
): string {
  const { currentUserName, logoBase64 = "", watermarkBase64 = "" } = opts;

  const totalAmount = Math.abs(transaction.amount);
  const words = toIndianWords(totalAmount);
  const mode = modeLabel(transaction.method || "");
  const receiptNo = transaction.id?.slice(-12).toUpperCase() || "N/A";

  const period = (() => {
    if (transaction.studentCode) {
      const match = transaction.studentCode.match(/\/(\d{4})-(\d{2})\//);
      if (match) {
        const startYear = match[1];
        const endYear = startYear.slice(0, 2) + match[2];
        return `${startYear} – ${endYear}`;
      }
    }
    const yearPart = transaction.date
      ? new Date(transaction.date).getFullYear()
      : new Date().getFullYear();
    return `${yearPart} – ${yearPart + 1}`;
  })();

  const dateStr = transaction.date
    ? new Date(transaction.date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

  const timeStr =
    transaction.time ||
    new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const navy = '#1b3a6b';
  const gold = '#e8a020';
  const gold2 = '#d97706';
  const white = '#ffffff';

  // Fee rows
  const feeRows = (() => {
    if (transaction.subItems?.length) {
      const grouped = groupSubItems(transaction.subItems);
      return grouped
        .map(
          (item, i) => `
        <tr style="background:${i % 2 === 0 ? "rgba(248,250,253,0.75)" : white};border-bottom:1px solid #e8edf8;page-break-inside:avoid;">
          <td style="padding:5px 7px;color:#64748b;text-align:center;font-family:'JetBrains Mono', monospace;font-size:8px;border-right:1px solid #e2e8f4;">${i + 1}</td>
          <td style="padding:5px 7px;color:#1e293b;font-weight:600;font-size:8.5px;border-right:1px solid #e2e8f4;">
            ${item.description}
            ${item.concessionAmount > 0 ? `<span style="display:inline-block;margin-left:5px;font-size:7px;color:#b45309;background:rgba(254,243,199,0.9);border:1px solid rgba(252,211,77,0.5);padding:1px 5px;border-radius:9999px;font-weight:700;font-family:'Inter', sans-serif;">−${item.concessionAmount.toLocaleString("en-IN")} ₹ off</span>` : ""}
          </td>
          <td style="padding:5px 7px;color:#475569;text-align:center;font-size:8px;border-right:1px solid #e2e8f4;">${modeLabel(item.method || transaction.method || "")}</td>
          <td style="padding:5px 7px;text-align:right;color:${navy};font-weight:700;font-family:'JetBrains Mono', monospace;font-size:8.5px;white-space:nowrap;">${inr(item.amount)} ₹</td>
        </tr>
      `,
        )
        .join("");
    }
    return `
      <tr style="background:rgba(248,250,253,0.75);page-break-inside:avoid;">
        <td style="padding:5px 7px;color:#64748b;text-align:center;font-family:'JetBrains Mono', monospace;font-size:8px;border-right:1px solid #e2e8f4;">1</td>
        <td style="padding:5px 7px;color:#1e293b;font-weight:600;font-size:8.5px;border-right:1px solid #e2e8f4;">${transaction.feeType || "Fee Collection"}</td>
        <td style="padding:5px 7px;color:#475569;text-align:center;font-size:8px;border-right:1px solid #e2e8f4;">${mode}</td>
        <td style="padding:5px 7px;text-align:right;color:${navy};font-weight:700;font-family:'JetBrains Mono', monospace;font-size:8.5px;white-space:nowrap;">${inr(totalAmount)} ₹</td>
      </tr>
    `;
  })();

  const concessionRow =
    !transaction.subItems && transaction.concessionAmount
      ? `
    <tr style="background:rgba(255,251,235,0.75);page-break-inside:avoid;">
      <td style="padding:5px 7px;border-right:1px solid #e2e8f4;"></td>
      <td style="padding:5px 7px;color:#b45309;font-style:italic;font-weight:700;font-size:8px;border-right:1px solid #e2e8f4;">
        ✦ Concession Applied
      </td>
      <td style="border-right:1px solid #e2e8f4;"></td>
      <td style="padding:5px 7px;text-align:right;color:#b45309;font-weight:700;font-family:'JetBrains Mono', monospace;font-size:8.5px;white-space:nowrap;">−${(transaction.concessionAmount || 0).toLocaleString("en-IN")} ₹</td>
    </tr>
  `
      : "";

  const signerName = currentUserName
    ? currentUserName.toUpperCase()
    : "AUTHORISED SIGNATORY";

  const logoImg = logoBase64
    ? `<img src="${logoBase64}" alt="Logo" style="width:100%;height:100%;object-fit:contain;" />`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Payment Receipt — ${transaction.studentName}</title>
  <style>
    ${BASE_CSS}
    @page { size: A5 portrait; margin: 0; }

    html, body {
      width: 100%;
      height: 100%;
    }

    body {
      padding: 0;
      margin: 0;
      background-color: ${white};
    }

    .page {
      width: 148mm;
      height: 210mm;
      overflow: hidden;
      display: flex;
      flex-direction: row;
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 9px;
      color: #1e293b;
      box-sizing: border-box;
      position: relative;
    }
  </style>
</head>
<body>
  <div class="page">
  <!-- ══════════ LEFT NAVY PANEL (56 mm) ══════════ -->
  <div style="width: 56mm; flex-shrink: 0; background-color: ${navy}; display: flex; flex-direction: column; position: relative; overflow: hidden;">
    <!-- Subtle diagonal accent strip at top-right of left panel -->
    <div style="position: absolute; top: 0; right: 0; width: 30px; height: 140px; background: linear-gradient(to bottom-left, rgba(232,160,32,0.18), transparent); pointer-events: none;"></div>

    <!-- ── Logo + School Name Header ── -->
    <div style="padding: 14px 14px 10px; border-bottom: 1px solid rgba(255,255,255,0.10); display: flex; align-items: center; gap: 9px;">
      <div style="width: 46px; height: 46px; border-radius: 50%; background-color: ${white}; padding: 4px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 3px 10px rgba(0,0,0,0.28);">
        ${logoImg}
      </div>
      <div>
        <div style="font-family: 'Outfit', sans-serif; font-size: 10px; font-weight: 900; color: ${white}; line-height: 1.2; letter-spacing: 0.3px;">
          SUNRISE SCHOOL<br />RAJKOT
        </div>
        <div style="font-family: 'Outfit', sans-serif; font-size: 7px; font-weight: 700; color: #fcd34d; margin-top: 3px;">
          English &amp; Gujarati Medium
        </div>
        <div style="font-size: 6.5px; color: rgba(226,232,240,0.75); margin-top: 2px; line-height: 1.5;">
          ${SCH.address}
        </div>
      </div>
    </div>

    <!-- ── Receipt Badge ── -->
    <div style="margin: 10px 14px 0; background-color: ${gold}; border-radius: 6px; padding: 7px 11px;">
      <div style="font-family: 'Outfit', sans-serif; font-size: 15px; font-weight: 900; color: ${white}; letter-spacing: 3px; line-height: 1; text-transform: uppercase; text-shadow: 1px 1px 2px rgba(0,0,0,0.15);">
        RECEIPT
      </div>
      <div style="font-family: 'JetBrains Mono', monospace; font-size: 7.5px; font-weight: 700; color: ${navy}; background-color: rgba(255,255,255,0.90); padding: 2px 6px; border-radius: 3px; margin-top: 5px; display: inline-block; letter-spacing: 0.4px;">
        NO: ${receiptNo}
      </div>
    </div>

    <!-- ── Student Information ── -->
    <div style="padding: 10px 14px 0; flex: 1;">
      <div style="font-family: 'Outfit', sans-serif; font-size: 6.5px; font-weight: 800; color: #fcd34d; text-transform: uppercase; letter-spacing: 1.2px; border-bottom: 1px solid rgba(232,160,32,0.35); padding-bottom: 3px; margin-bottom: 7px;">
        Student Information
      </div>

      <div style="display: flex; gap: 5px; margin-bottom: 5px; align-items: baseline;">
        <span style="font-family: 'Outfit', sans-serif; font-size: 6px; font-weight: 700; color: rgba(148,163,184,0.85); text-transform: uppercase; letter-spacing: 0.6px; width: 40px; flex-shrink: 0;">Name</span>
        <span style="font-size: 10px; font-weight: 800; color: ${white}; flex: 1;">${transaction.studentName}</span>
      </div>
      ${transaction.classInfo ? `<div style="display: flex; gap: 5px; margin-bottom: 5px; align-items: baseline;">
        <span style="font-family: 'Outfit', sans-serif; font-size: 6px; font-weight: 700; color: rgba(148,163,184,0.85); text-transform: uppercase; letter-spacing: 0.6px; width: 40px; flex-shrink: 0;">Class</span>
        <span style="font-size: 8px; font-weight: 600; color: ${white}; flex: 1;">${transaction.classInfo}</span>
      </div>` : ""}
      <div style="display: flex; gap: 5px; margin-bottom: 5px; align-items: baseline;">
        <span style="font-family: 'Outfit', sans-serif; font-size: 6px; font-weight: 700; color: rgba(148,163,184,0.85); text-transform: uppercase; letter-spacing: 0.6px; width: 40px; flex-shrink: 0;">Period</span>
        <span style="font-size: 8px; font-weight: 600; color: ${white}; flex: 1;">${period}</span>
      </div>
    </div>

    <!-- ── Left Footer (Gold) ── -->
    <div style="background-color: ${gold}; padding: 8px 14px;">
      <div style="font-family: 'Outfit', sans-serif; font-size: 8.5px; font-weight: 900; color: ${navy}; letter-spacing: 1.5px; text-transform: uppercase;">
        Thank You
      </div>
      <div style="font-size: 6px; color: rgba(27,58,107,0.72); margin-top: 1px;">
        ${SCH.phone} · ${SCH.email}
      </div>
    </div>
  </div>

  <!-- ══════════ RIGHT WHITE PANEL ══════════ -->
  <div style="flex: 1; display: flex; flex-direction: column; padding: 12px 13px 10px; background-color: ${white}; position: relative; overflow: hidden;">
    
    <!-- Watermark -->
    ${watermarkBase64 ? `
    <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 0; pointer-events: none; display: flex; align-items: center; justify-content: center; overflow: hidden;">
      <img src="${watermarkBase64}" alt="" style="width: 200px; height: 200px; opacity: 0.06; transform: rotate(-10deg); object-fit: contain;" />
    </div>` : ""}

    <!-- All right-panel content sits above watermark -->
    <div style="position: relative; z-index: 1; flex: 1; display: flex; flex-direction: column;">
      
      <!-- ── Date / Time / Status strip ── -->
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 5px; margin-bottom: 9px;">
        <div style="background-color: rgba(248,250,253,0.85); border: 1px solid rgba(226,232,240,0.80); border-radius: 5px; padding: 5px 7px;">
          <div style="font-family: 'Outfit', sans-serif; font-size: 6px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.6px;">Date</div>
          <div style="font-size: 7.5px; font-weight: 600; color: #1e293b; margin-top: 2px;">${dateStr}</div>
        </div>
        <div style="background-color: rgba(248,250,253,0.85); border: 1px solid rgba(226,232,240,0.80); border-radius: 5px; padding: 5px 7px;">
          <div style="font-family: 'Outfit', sans-serif; font-size: 6px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.6px;">Time</div>
          <div style="font-size: 7.5px; font-weight: 600; color: #1e293b; margin-top: 2px;">${timeStr}</div>
        </div>
        <div style="background-color: rgba(248,250,253,0.85); border: 1px solid rgba(226,232,240,0.80); border-radius: 5px; padding: 5px 7px;">
          <div style="font-family: 'Outfit', sans-serif; font-size: 6px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.6px;">Status</div>
          <div style="font-size: 7.5px; font-weight: 600; color: #16a34a; margin-top: 2px;">Payment Received</div>
        </div>
      </div>

      <!-- ── Section Header: Payment Details ── -->
      <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
        <div style="width: 3px; height: 11px; background-color: ${gold}; border-radius: 2px; flex-shrink: 0;"></div>
        <div style="font-family: 'Outfit', sans-serif; font-size: 7.5px; font-weight: 800; color: ${navy}; letter-spacing: 0.8px; text-transform: uppercase;">
          Payment Details
        </div>
      </div>

      <!-- ── Fee Table ── -->
      <table style="width: 100%; border-collapse: collapse; border: 1px solid rgba(226,232,240,0.80); border-radius: 5px; overflow: hidden; margin-bottom: 0;">
        <thead>
          <tr style="background: linear-gradient(135deg, ${navy} 0%, #2a5298 100%);">
            <th style="padding: 5px 7px; color: ${white}; font-size: 6.5px; font-weight: 700; text-align: center; width: 22px; letter-spacing: 0.8px; text-transform: uppercase; font-family: 'Outfit', sans-serif;">#</th>
            <th style="padding: 5px 7px; color: ${white}; font-size: 6.5px; font-weight: 700; text-align: left; letter-spacing: 0.8px; text-transform: uppercase; font-family: 'Outfit', sans-serif;">Description</th>
            <th style="padding: 5px 7px; color: ${white}; font-size: 6.5px; font-weight: 700; text-align: center; width: 72px; letter-spacing: 0.8px; text-transform: uppercase; font-family: 'Outfit', sans-serif;">Mode</th>
            <th style="padding: 5px 7px; color: ${white}; font-size: 6.5px; font-weight: 700; text-align: right; width: 78px; letter-spacing: 0.8px; text-transform: uppercase; font-family: 'Outfit', sans-serif;">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${feeRows}
          ${concessionRow}
        </tbody>
        <tfoot>
          <tr style="background: linear-gradient(to right, ${gold}, ${gold2});">
            <td colspan="3" style="padding: 6px 8px; color: ${navy}; font-weight: 800; font-family: 'Outfit', sans-serif; font-size: 7.5px; letter-spacing: 2px; text-transform: uppercase;">
              TOTAL PAID
            </td>
            <td style="padding: 6px 8px; text-align: right; color: ${navy}; font-weight: 800; font-family: 'JetBrains Mono', monospace; font-size: 12px; white-space: nowrap;">
              ${inr(totalAmount)} ₹
            </td>
          </tr>
        </tfoot>
      </table>

      <!-- ── Amount in Words ── -->
      <div style="background-color: rgba(255,251,240,0.85); padding: 5px 9px; border-radius: 0 4px 4px 0; font-size: 7.5px; color: #334155; margin-top: 7px; border: 1px solid rgba(226,232,240,0.3); border-left: 3px solid ${gold};">
        <strong>Amount in Words:</strong>&nbsp;<em>${words}</em>
      </div>

      <!-- ── Remark (optional) ── -->
      ${transaction.remark ? `
      <div style="background-color: rgba(248,250,253,0.85); padding: 5px 9px; border-radius: 0 4px 4px 0; font-size: 7.5px; color: #475569; font-style: italic; margin-top: 5px; border: 1px solid rgba(226,232,240,0.3); border-left: 3px solid #94a3b8;">
        <strong>Remark:</strong>&nbsp;<em>${transaction.remark}</em>
      </div>` : ""}

      <!-- ── Signature ── -->
      <div style="display: flex; justify-content: flex-end; align-items: flex-end; margin-top: auto; padding-top: 10px;">
        <div style="text-align: center;">
          <div style="font-family: 'Outfit', sans-serif; font-size: 8px; font-weight: 700; color: ${navy}; margin-bottom: 16px; letter-spacing: 0.4px;">
            ${signerName}
          </div>
          <div style="width: 120px; border-top: 1px solid #94a3b8; padding-top: 4px;">
            <div style="font-family: 'Outfit', sans-serif; font-size: 6.5px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px;">
              Authorised Signatory
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
  </div>
</body>
</html>`;
}

// ─── Premium Report HTML ──────────────────────────────────────────────────────

export function generateReportHTML(
  report: { type: string; title: string; data: any },
  opts: { logoBase64?: string } = {},
): string {
  const { type, title, data } = report;
  const { logoBase64 = "" } = opts;

  const isLandscape = type === "outstanding-dues";
  const todayStr = new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const logoImg = logoBase64
    ? `<img src="${logoBase64}" alt="Logo" style="width:100%;height:100%;object-fit:contain;" />`
    : "";

  const headerHTML = `
    <div style="display:flex;align-items:center;gap:0;margin-bottom:0;page-break-inside:avoid;">
      <div style="width:90px;height:68px;flex-shrink:0;display:flex;align-items:center;justify-content:center;padding:4px 8px 4px 0;">
        ${logoImg}
      </div>
      <div style="width:3px;background:linear-gradient(to bottom,#e8a020,#1b3a6b);align-self:stretch;margin:3px 12px;border-radius:2px;"></div>
      <div style="flex:1;">
        <div style="font-size:20px;font-weight:900;color:#1b3a6b;letter-spacing:1px;">${SCH.name}</div>
        <div style="font-size:9.5px;font-weight:700;color:#b45309;margin-top:2px;">${SCH.medium}</div>
        <div style="font-size:9px;color:#64748b;margin-top:1px;">${SCH.address}</div>
      </div>
    </div>
    <div style="height:3px;background:linear-gradient(to right,#e8a020,#d08c16,#e8a020);margin:8px 0 2px;"></div>
    <div style="height:1.5px;background:#1b3a6b;margin-bottom:12px;"></div>
    <div style="background:linear-gradient(135deg,#1b3a6b 0%,#2a5298 100%);padding:9px 14px;border-radius:4px;display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
      <div style="font-size:13px;font-weight:800;color:#fff;letter-spacing:3px;text-transform:uppercase;">${title}</div>
      <div style="font-size:8.5px;color:rgba(255,255,255,0.75);">Generated: ${todayStr}</div>
    </div>
  `;

  const statCard = (label: string, val: string, color = "#1a1a2e") => `
    <div style="border:1px solid #dde4f0;border-radius:6px;padding:8px 12px;background:#f8fafd;">
      <div style="font-size:8px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;">${label}</div>
      <div style="font-size:14px;font-weight:800;color:${color};margin-top:3px;">${val}</div>
    </div>
  `;

  const thStyle = `padding:8px 9px;background:linear-gradient(135deg,#1b3a6b 0%,#2a5298 100%);color:#fff;font-size:9px;font-weight:700;text-align:left;white-space:nowrap;`;
  const thRStyle = `${thStyle}text-align:right;`;
  const tdStyle = `padding:6px 9px;border-bottom:1px solid #e8edf8;font-size:9.5px;color:#334155;`;
  const tdRStyle = `${tdStyle}text-align:right;font-weight:700;`;

  const footerHTML = `
    <div style="margin-top:20px;border-top:1px solid #e2e8f0;padding-top:10px;display:flex;justify-content:space-between;align-items:flex-end;page-break-inside:avoid;">
      <div style="font-size:8.5px;color:#94a3b8;font-style:italic;">
        <strong style="color:#1b3a6b;">Sunrise Connect</strong> — School Administration System<br/>
        This report is system-generated. Verify figures with the school office.
      </div>
      <div style="width:140px;border-top:1px solid #94a3b8;padding-top:5px;text-align:center;font-size:8.5px;color:#64748b;">
        Authorised Signature<br/><span style="font-size:7.5px;color:#94a3b8;">Office of the School Principal</span>
      </div>
    </div>
  `;

  let bodyHTML = "";

  if (type === "daily-collections") {
    const rows = (data.transactions || [])
      .map(
        (t: any, i: number) => `
      <tr style="background:${i % 2 === 0 ? "#f8fafd" : "#fff"};page-break-inside:avoid;">
        <td style="${tdStyle}color:#94a3b8;text-align:center;">${i + 1}</td>
        <td style="${tdStyle}font-family:monospace;font-size:9px;color:#64748b;">${t.studentCode || "—"}</td>
        <td style="${tdStyle}font-weight:700;">${t.studentName}</td>
        <td style="${tdStyle}">${t.classInfo || "—"}</td>
        <td style="${tdStyle}">${(t.feeType || "").replace(/\n/g, ", ")}</td>
        <td style="${tdStyle}font-weight:700;text-transform:uppercase;">${t.method || "—"}</td>
        <td style="${tdStyle}color:#64748b;">${t.time || "—"}</td>
        <td style="${tdRStyle}color:#1b3a6b;">₹${(t.amount || 0).toLocaleString("en-IN")}</td>
      </tr>
    `,
      )
      .join("");

    bodyHTML = `
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px;">
        ${statCard("Total Collected", `₹${(data.totalCollected || 0).toLocaleString("en-IN")}`, "#1b3a6b")}
        ${statCard("Cash", `₹${(data.cashCollected || 0).toLocaleString("en-IN")}`)}
        ${statCard("Online / UPI", `₹${(data.onlineCollected || 0).toLocaleString("en-IN")}`)}
        ${statCard("Cheque", `₹${(data.chequeCollected || 0).toLocaleString("en-IN")}`)}
      </div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #dde4f0;border-radius:6px;overflow:hidden;">
        <thead><tr>
          <th style="${thStyle}width:32px;text-align:center;">#</th>
          <th style="${thStyle}">Code</th><th style="${thStyle}">Student Name</th>
          <th style="${thStyle}">Class</th><th style="${thStyle}">Fee Category</th>
          <th style="${thStyle}">Method</th><th style="${thStyle}">Time</th>
          <th style="${thRStyle}">Amount</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  if (type === "outstanding-dues") {
    const avg =
      data.studentCount > 0
        ? Math.round(data.totalOutstandingAmount / data.studentCount)
        : 0;
    const rows = (data.students || [])
      .map(
        (s: any, i: number) => `
      <tr style="background:${i % 2 === 0 ? "#f8fafd" : "#fff"};page-break-inside:avoid;">
        <td style="${tdStyle}color:#94a3b8;text-align:center;">${i + 1}</td>
        <td style="${tdStyle}font-family:monospace;font-size:9px;color:#64748b;">${s.studentCode || "—"}</td>
        <td style="${tdStyle}font-weight:700;">${s.studentName}</td>
        <td style="${tdStyle}">${s.classInfo || "—"}</td>
        <td style="${tdStyle}">${s.parentName || "—"}</td>
        <td style="${tdStyle}color:#64748b;">${s.parentMobile || "—"}</td>
        <td style="${tdStyle}font-weight:700;color:#64748b;">${s.overdueCount} Months</td>
        <td style="${tdRStyle}color:#ea580c;">₹${(s.educationDue || 0).toLocaleString("en-IN")}</td>
        <td style="${tdRStyle}color:#d97706;">₹${(s.transportDue || 0).toLocaleString("en-IN")}</td>
        <td style="${tdRStyle}color:#1b3a6b;font-size:10px;">₹${(s.totalDue || 0).toLocaleString("en-IN")}</td>
      </tr>
    `,
      )
      .join("");

    bodyHTML = `
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px;">
        ${statCard("Total Outstanding", `₹${(data.totalOutstandingAmount || 0).toLocaleString("en-IN")}`, "#dc2626")}
        ${statCard("Students with Dues", `${data.studentCount || 0}`)}
        ${statCard("Avg. Due / Student", `₹${avg.toLocaleString("en-IN")}`)}
        ${statCard("Aging 1M / 2M / 3M+", `${data.oneDueCount || 0} / ${data.twoDueCount || 0} / ${data.threePlusDueCount || 0}`)}
      </div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #dde4f0;overflow:hidden;">
        <thead><tr>
          <th style="${thStyle}width:30px;text-align:center;">#</th>
          <th style="${thStyle}">Code</th><th style="${thStyle}">Student Name</th>
          <th style="${thStyle}">Class</th><th style="${thStyle}">Parent</th>
          <th style="${thStyle}">Mobile</th><th style="${thStyle}">Overdue</th>
          <th style="${thRStyle}">Edu Dues</th><th style="${thRStyle}">Trans Dues</th>
          <th style="${thRStyle}">Total Due</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  if (type === "rte-reconcile") {
    const rows = (data.students || [])
      .map(
        (s: any, i: number) => `
      <tr style="background:${i % 2 === 0 ? "#f8fafd" : "#fff"};page-break-inside:avoid;">
        <td style="${tdStyle}color:#94a3b8;text-align:center;">${i + 1}</td>
        <td style="${tdStyle}font-family:monospace;font-size:9px;color:#64748b;">${s.studentCode || "—"}</td>
        <td style="${tdStyle}font-weight:700;">${s.studentName}</td>
        <td style="${tdStyle}">${s.classInfo || "—"}</td>
        <td style="${tdStyle}">${s.parentName || "—"}</td>
        <td style="${tdStyle}color:#64748b;">${s.parentMobile || "—"}</td>
        <td style="${tdRStyle}color:#4338ca;font-size:10px;">₹${(s.exemptedAmount || 0).toLocaleString("en-IN")}</td>
      </tr>
    `,
      )
      .join("");

    bodyHTML = `
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:14px;">
        ${statCard("Total RTE Enrolled", `${data.studentCount || 0} Students`)}
        ${statCard("Total Exempted Tuition", `₹${(data.totalExemptedAmount || 0).toLocaleString("en-IN")}`, "#4338ca")}
      </div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #dde4f0;overflow:hidden;">
        <thead><tr>
          <th style="${thStyle}width:30px;text-align:center;">#</th>
          <th style="${thStyle}">Code</th><th style="${thStyle}">Student Name</th>
          <th style="${thStyle}">Class &amp; Section</th>
          <th style="${thStyle}">Parent Name</th><th style="${thStyle}">Mobile</th>
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
    @page { size: A4 ${isLandscape ? "landscape" : "portrait"}; }
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
  const existing = document.getElementById("__sunrise-print-frame");
  if (existing) existing.remove();

  const iframe = document.createElement("iframe");
  iframe.id = "__sunrise-print-frame";
  iframe.style.cssText =
    "position:fixed;top:0;left:0;width:0;height:0;border:0;visibility:hidden;";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) return;
  doc.open();
  doc.write(html);
  doc.close();

  // Wait for all images (now base64 — should be instant, but guard anyway)
  const imgs = Array.from(doc.querySelectorAll("img"));
  if (imgs.length === 0) {
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => iframe.remove(), 1500);
    }, 120);
    return;
  }

  let loaded = 0;
  const tryPrint = () => {
    if (++loaded >= imgs.length) {
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => iframe.remove(), 1500);
      }, 120);
    }
  };
  imgs.forEach((img) => {
    if (img.complete) tryPrint();
    else {
      img.addEventListener("load", tryPrint);
      img.addEventListener("error", tryPrint);
    }
  });
}
