import React from 'react';

/* ─── Types ────────────────────────────────────────────────────────── */
interface ReceiptLineItem {
  id: number;
  description: string;
  mode: string;
  amount: number;
}

interface PrintReceiptProps {
  receiptNo: string;
  studentName: string;
  studentClass: string;
  period: string;
  date: string;
  time: string;
  status?: string;
  lineItems: ReceiptLineItem[];
  totalPaid: number;
  amountInWords: string;
  schoolName?: string;
  schoolAddress?: string;
  schoolPhone?: string;
  schoolEmail?: string;
  schoolWebsite?: string;
  schoolTagline?: string;
}

/* ─── Styles (injected once) ───────────────────────────────────────── */
const RECEIPT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

  .receipt-root * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .receipt-root {
    font-family: 'Inter', sans-serif;
    background: #ffffff;
    width: 794px;          /* A4 width at 96 dpi */
    min-height: 1123px;    /* A4 height */
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  /* ── Header ─────────────────────────────────────── */
  .rcp-header {
    background: #003366;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 28px;
    gap: 16px;
  }

  .rcp-logo-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
  }

  .rcp-logo-circle {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;
  }

  .rcp-logo-circle img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .rcp-logo-placeholder {
    font-size: 10px;
    font-weight: 900;
    color: #003366;
    text-align: center;
    line-height: 1.1;
  }

  .rcp-school-name {
    font-size: 20px;
    font-weight: 900;
    letter-spacing: 0.03em;
    line-height: 1.15;
  }

  .rcp-school-tagline {
    font-size: 9.5px;
    font-weight: 500;
    color: #fbbf24;
    margin-top: 2px;
    letter-spacing: 0.05em;
  }

  .rcp-school-meta {
    font-size: 8.5px;
    color: #cbd5e1;
    margin-top: 4px;
    line-height: 1.5;
  }

  .rcp-receipt-badge {
    background: #f59e0b;
    color: #fff;
    border-radius: 8px;
    padding: 10px 20px;
    text-align: center;
    flex-shrink: 0;
  }

  .rcp-receipt-badge-label {
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 0.15em;
    line-height: 1;
  }

  .rcp-receipt-badge-no {
    font-size: 10px;
    font-weight: 700;
    margin-top: 4px;
    letter-spacing: 0.05em;
  }

  /* ── Info Section ────────────────────────────────── */
  .rcp-info-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    border-bottom: 1px solid #e2e8f0;
    margin: 0 28px;
    padding: 16px 0;
  }

  .rcp-info-col {
    padding: 0 8px;
  }

  .rcp-info-col:first-child {
    padding-left: 0;
    border-right: 1px solid #e2e8f0;
    padding-right: 24px;
  }

  .rcp-info-col:last-child {
    padding-left: 24px;
    padding-right: 0;
  }

  .rcp-info-heading {
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #003366;
    border-bottom: 2px solid #f59e0b;
    padding-bottom: 5px;
    margin-bottom: 10px;
    display: inline-block;
  }

  .rcp-info-grid {
    display: grid;
    grid-template-columns: auto 1fr;
    row-gap: 5px;
    column-gap: 12px;
    font-size: 10px;
  }

  .rcp-info-label {
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    font-size: 8.5px;
    letter-spacing: 0.06em;
    white-space: nowrap;
    align-self: center;
  }

  .rcp-info-value {
    font-weight: 700;
    color: #1e293b;
    font-size: 10.5px;
  }

  .rcp-info-value.status-paid {
    color: #16a34a;
    font-weight: 800;
  }

  /* ── Payment Details Table ───────────────────────── */
  .rcp-table-section {
    margin: 0 28px;
    padding: 16px 0;
    flex: 1;
  }

  .rcp-table-heading {
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #003366;
    border-bottom: 2px solid #f59e0b;
    padding-bottom: 5px;
    margin-bottom: 12px;
    display: inline-block;
  }

  .rcp-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10.5px;
  }

  .rcp-table thead tr {
    background: #003366;
    color: #fff;
  }

  .rcp-table thead th {
    padding: 8px 12px;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    text-align: left;
  }

  .rcp-table thead th:last-child {
    text-align: right;
  }

  .rcp-table tbody tr {
    border-bottom: 1px solid #f1f5f9;
  }

  .rcp-table tbody tr:nth-child(even) {
    background: #f8fafc;
  }

  .rcp-table tbody td {
    padding: 9px 12px;
    color: #334155;
    font-weight: 500;
  }

  .rcp-table tbody td:first-child {
    color: #94a3b8;
    font-weight: 600;
    font-size: 10px;
    width: 32px;
  }

  .rcp-table tbody td:last-child {
    text-align: right;
    font-weight: 700;
    color: #1e293b;
  }

  /* ── Total Row ───────────────────────────────────── */
  .rcp-total-row {
    background: #003366;
    color: #fff;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    margin-top: 0;
    border-radius: 0 0 6px 6px;
  }

  .rcp-total-label {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .rcp-total-amount {
    font-size: 14px;
    font-weight: 900;
    color: #fbbf24;
    letter-spacing: 0.02em;
  }

  /* ── Words & Signature ───────────────────────────── */
  .rcp-words-sig {
    margin: 0 28px;
    padding: 14px 0 0;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 24px;
    border-top: 1px solid #e2e8f0;
  }

  .rcp-words {
    flex: 1;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px 14px;
  }

  .rcp-words-label {
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #94a3b8;
    margin-bottom: 4px;
  }

  .rcp-words-text {
    font-size: 10px;
    font-weight: 600;
    color: #334155;
    font-style: italic;
    line-height: 1.4;
  }

  .rcp-sig {
    text-align: center;
    min-width: 130px;
  }

  .rcp-sig-name {
    font-size: 11px;
    font-weight: 800;
    color: #1e293b;
    letter-spacing: 0.05em;
  }

  .rcp-sig-line {
    border-top: 1.5px solid #334155;
    margin-top: 36px;
    padding-top: 6px;
  }

  .rcp-sig-sub {
    font-size: 7.5px;
    font-weight: 600;
    color: #94a3b8;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  /* ── Watermark ───────────────────────────────────── */
  .rcp-watermark {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 220px;
    height: 220px;
    opacity: 0.045;
    pointer-events: none;
    z-index: 0;
  }

  .rcp-watermark svg {
    width: 100%;
    height: 100%;
  }

  /* ── Footer ──────────────────────────────────────── */
  .rcp-footer {
    background: #003366;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 28px;
    gap: 12px;
    margin-top: auto;
  }

  .rcp-footer-thank {
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #fbbf24;
    white-space: nowrap;
  }

  .rcp-footer-contacts {
    display: flex;
    align-items: center;
    gap: 20px;
    font-size: 8.5px;
    font-weight: 600;
    color: #cbd5e1;
  }

  .rcp-footer-contact-item {
    display: flex;
    align-items: center;
    gap: 5px;
    white-space: nowrap;
  }

  .rcp-footer-contact-icon {
    width: 14px;
    height: 14px;
    background: #f59e0b;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 7px;
    flex-shrink: 0;
  }

  /* ── Utilities ───────────────────────────────────── */
  .rcp-content {
    position: relative;
    z-index: 1;
    flex: 1;
    display: flex;
    flex-direction: column;
  }
`;

/* ─── Component ────────────────────────────────────────────────────── */
export const PrintReceipt: React.FC<PrintReceiptProps> = ({
  receiptNo,
  studentName,
  studentClass,
  period,
  date,
  time,
  status = 'Payment Received',
  lineItems,
  totalPaid,
  amountInWords,
  schoolName = 'SUNRISE SCHOOL RAJKOT',
  schoolTagline = 'English & Gujarati Medium',
  schoolAddress = 'Railnagar, Rajkot, Gujarat — 360 001',
  schoolPhone = '+91 XXXXX XXXXX',
  schoolEmail = 'info@sunriseschool.in',
  schoolWebsite = 'www.sunriseschool.in',
}) => {
  return (
    <>
      <style>{RECEIPT_STYLES}</style>

      <div className="receipt-root">
        {/* Watermark */}
        <div className="rcp-watermark" aria-hidden="true">
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="96" stroke="#003366" strokeWidth="4" />
            <circle cx="100" cy="100" r="78" stroke="#003366" strokeWidth="2" />
            <text x="100" y="90" textAnchor="middle" fontSize="22" fontWeight="900" fill="#003366" fontFamily="Inter,sans-serif">SUNRISE</text>
            <text x="100" y="114" textAnchor="middle" fontSize="12" fontWeight="700" fill="#003366" fontFamily="Inter,sans-serif">SCHOOL</text>
            <text x="100" y="130" textAnchor="middle" fontSize="9" fontWeight="600" fill="#f59e0b" fontFamily="Inter,sans-serif">RAJKOT</text>
            {/* Sun rays */}
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i * 30 * Math.PI) / 180;
              const x1 = 100 + 56 * Math.cos(angle);
              const y1 = 100 + 56 * Math.sin(angle);
              const x2 = 100 + 68 * Math.cos(angle);
              const y2 = 100 + 68 * Math.sin(angle);
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#003366" strokeWidth="2" strokeLinecap="round" />;
            })}
          </svg>
        </div>

        <div className="rcp-content">
          {/* ── Header ── */}
          <div className="rcp-header">
            <div className="rcp-logo-wrap">
              <div className="rcp-logo-circle">
                <span className="rcp-logo-placeholder">☀️</span>
              </div>
              <div>
                <div className="rcp-school-name">{schoolName}</div>
                <div className="rcp-school-tagline">{schoolTagline}</div>
                <div className="rcp-school-meta">
                  {schoolAddress}<br />
                  Ph: {schoolPhone} &nbsp;·&nbsp; {schoolEmail}
                </div>
              </div>
            </div>
            <div className="rcp-receipt-badge">
              <div className="rcp-receipt-badge-label">RECEIPT</div>
              <div className="rcp-receipt-badge-no">No: {receiptNo}</div>
            </div>
          </div>

          {/* ── Student & Payment Info ── */}
          <div className="rcp-info-row">
            {/* Left: Student */}
            <div className="rcp-info-col">
              <div className="rcp-info-heading">Student Information</div>
              <div className="rcp-info-grid">
                <span className="rcp-info-label">Name</span>
                <span className="rcp-info-value">{studentName}</span>
                <span className="rcp-info-label">Class</span>
                <span className="rcp-info-value">{studentClass}</span>
                <span className="rcp-info-label">Period</span>
                <span className="rcp-info-value">{period}</span>
              </div>
            </div>

            {/* Right: Payment */}
            <div className="rcp-info-col">
              <div className="rcp-info-heading">Payment Information</div>
              <div className="rcp-info-grid">
                <span className="rcp-info-label">Date</span>
                <span className="rcp-info-value">{date}</span>
                <span className="rcp-info-label">Time</span>
                <span className="rcp-info-value">{time}</span>
                <span className="rcp-info-label">Status</span>
                <span className="rcp-info-value status-paid">{status}</span>
              </div>
            </div>
          </div>

          {/* ── Payment Details Table ── */}
          <div className="rcp-table-section">
            <div className="rcp-table-heading">Payment Details</div>

            <table className="rcp-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Description</th>
                  <th>Mode</th>
                  <th>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.description}</td>
                    <td>{item.mode}</td>
                    <td>
                      {item.amount.toLocaleString('en-IN')} &nbsp;₹
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total */}
            <div className="rcp-total-row">
              <span className="rcp-total-label">Total Paid</span>
              <span className="rcp-total-amount">
                {totalPaid.toLocaleString('en-IN')} ₹
              </span>
            </div>
          </div>

          {/* ── Amount in Words + Signature ── */}
          <div className="rcp-words-sig">
            <div className="rcp-words">
              <div className="rcp-words-label">Amount in Words</div>
              <div className="rcp-words-text">{amountInWords}</div>
            </div>
            <div className="rcp-sig">
              <div className="rcp-sig-line">
                <div className="rcp-sig-name">ADMIN</div>
                <div className="rcp-sig-sub">Authorised Signatory</div>
              </div>
            </div>
          </div>

          {/* Spacer to push footer down */}
          <div style={{ flex: 1, minHeight: 28 }} />

          {/* ── Footer ── */}
          <div className="rcp-footer">
            <div className="rcp-footer-thank">Thank You</div>
            <div className="rcp-footer-contacts">
              <div className="rcp-footer-contact-item">
                <div className="rcp-footer-contact-icon">📞</div>
                {schoolPhone}
              </div>
              <div className="rcp-footer-contact-item">
                <div className="rcp-footer-contact-icon">✉</div>
                {schoolEmail}
              </div>
              <div className="rcp-footer-contact-item">
                <div className="rcp-footer-contact-icon">🌐</div>
                {schoolWebsite}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

/* ─── Usage Example ─────────────────────────────────────────────────
import { PrintReceipt } from './PrintReceipt';

<PrintReceipt
  receiptNo="7651657_3FYK"
  studentName="Danav"
  studentClass="2 - A Gujarati"
  period="2026 - 2027"
  date="28 June 2026"
  time="08:10 PM"
  status="Payment Received"
  lineItems={[
    { id: 1, description: 'Term Fee - Term 2', mode: 'Cash', amount: 714 },
    { id: 2, description: 'Education Fee - June to November', mode: 'Cash', amount: 4284 },
    { id: 3, description: 'Term Fee - Term 1', mode: 'Cash', amount: 714 },
  ]}
  totalPaid={5712}
  amountInWords="Five Thousand Seven Hundred Twelve Rupees Only"
/>
─────────────────────────────────────────────────────────────────── */