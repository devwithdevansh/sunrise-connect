/**
 * PrintReceipt.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * This component is kept as a React screen-preview only.
 * Actual printing is handled by printUtils.ts via an iframe.
 *
 * It renders a visual preview of the receipt inside the app UI
 * (e.g. inside a modal or slide-in panel) when needed.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import type { PaymentTransaction } from '../mockData';
import { useApp } from '../store';
import logoPath from '../assets/sunrise-logo.png';
import watermarkLogoPath from '../assets/sunrise-round-logo.png';

interface PrintReceiptProps {
  transaction: PaymentTransaction | null;
}

/* ─── Indian number-to-words ─────────────────────────────────────── */
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

  if (crore)    result += below1000(crore)    + ' Crore ';
  if (lakh)     result += below1000(lakh)     + ' Lakh ';
  if (thousand) result += below1000(thousand) + ' Thousand ';
  if (n)        result += below1000(n);

  return result.trim();
}

/* ─── Payment-mode label ─────────────────────────────────────────── */
type PaymentMode = 'cash' | 'online' | 'cheque' | 'upi' | 'neft' | string;

function getModeLabel(method: PaymentMode): string {
  const m = (method || '').toLowerCase();
  if (m === 'cash')   return 'Cash';
  if (m === 'upi')    return 'UPI / Online';
  if (m === 'online') return 'Online';
  if (m === 'cheque') return 'Cheque';
  if (m === 'neft' || m === 'rtgs' || m === 'imps') return m.toUpperCase();
  return method ? method.charAt(0).toUpperCase() + method.slice(1) : 'N/A';
}

/* ─── Component ─────────────────────────────────────────────────── */
export const PrintReceipt: React.FC<PrintReceiptProps> = ({ transaction }) => {
  const { currentUser } = useApp();

  if (!transaction) return null;

  const totalAmount    = Math.abs(transaction.amount);
  const amountInWords  = `${toIndianWords(totalAmount)} Rupees Only`;
  const modeLabel      = getModeLabel(transaction.method || '');

  /* Build period string from subItems */
  const period = (() => {
    if (transaction.subItems && transaction.subItems.length > 0) {
      const months = transaction.subItems.map(i => i.description.split(' ')[0]);
      return months.length > 1
        ? `${months[0]} – ${months[months.length - 1]} (${months.length} Months)`
        : months[0];
    }
    return transaction.feeType || '—';
  })();

  const dateStr = transaction.date
    ? new Date(transaction.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  const timeStr = transaction.time || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  /* ── Inline styles (screen preview — uses mm-based width for A4 feel) ── */
  const S = {
    page: {
      width: '210mm',
      minHeight: '297mm',
      margin: '0 auto',
      padding: '20mm 12mm 14mm',
      backgroundColor: '#ffffff',
      color: '#1a1a2e',
      fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
      fontSize: '11px',
      lineHeight: 1.45,
      boxSizing: 'border-box' as const,
      position: 'relative' as const,
    } as React.CSSProperties,

    headerRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      marginBottom: '8px',
    } as React.CSSProperties,

    logoCircle: {
      width: '190px',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    } as React.CSSProperties,

    schoolName: {
      fontSize: '22px',
      fontWeight: 800,
      color: '#1b3a6b',
      letterSpacing: '0.5px',
      lineHeight: 1.1,
    } as React.CSSProperties,

    schoolMedium: {
      fontSize: '11px',
      fontWeight: 700,
      color: '#d08c16',
      marginTop: '3px',
    } as React.CSSProperties,

    schoolAddr: {
      fontSize: '10.5px',
      color: '#555',
      marginTop: '2px',
    } as React.CSSProperties,

    ruleGold: {
      height: '4px',
      backgroundColor: '#e8a020',
      marginBottom: '3px',
    } as React.CSSProperties,

    ruleNavy: {
      height: '2px',
      backgroundColor: '#1b3a6b',
      marginBottom: '14px',
    } as React.CSSProperties,

    titleBar: {
      backgroundColor: '#1b3a6b',
      color: '#fff',
      textAlign: 'center' as const,
      padding: '9px 0',
      fontSize: '15px',
      fontWeight: 700,
      letterSpacing: '3px',
      marginBottom: '16px',
    } as React.CSSProperties,

    metaTable: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      marginBottom: '16px',
    } as React.CSSProperties,

    metaTdLabel: {
      padding: '6px 12px',
      fontWeight: 700,
      color: '#1b3a6b',
      width: '155px',
      fontSize: '11px',
      whiteSpace: 'nowrap' as const,
    } as React.CSSProperties,

    metaTdColon: {
      padding: '6px 4px',
      fontWeight: 700,
      color: '#555',
      width: '12px',
    } as React.CSSProperties,

    metaTdValue: {
      padding: '6px 12px',
      color: '#333',
      fontSize: '11px',
      fontWeight: 600,
    } as React.CSSProperties,

    sectionHeader: {
      color: '#1b3a6b',
      fontWeight: 800,
      fontSize: '11.5px',
      letterSpacing: '0.5px',
      marginBottom: '5px',
      borderBottom: '2px solid #1b3a6b',
      paddingBottom: '3px',
    } as React.CSSProperties,

    feeTable: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      marginBottom: '6px',
    } as React.CSSProperties,

    thLeft: {
      padding: '8px 10px',
      textAlign: 'left' as const,
      fontSize: '11px',
      fontWeight: 700,
      color: '#fff',
      backgroundColor: '#516f9e',
    } as React.CSSProperties,

    thRight: {
      padding: '8px 10px',
      textAlign: 'right' as const,
      fontSize: '11px',
      fontWeight: 700,
      color: '#fff',
      backgroundColor: '#516f9e',
    } as React.CSSProperties,

    tdNum: {
      padding: '7px 10px',
      color: '#444',
      fontSize: '11px',
      width: '34px',
    } as React.CSSProperties,

    tdDesc: {
      padding: '7px 10px',
      color: '#333',
      fontSize: '11px',
    } as React.CSSProperties,

    tdAmt: {
      padding: '7px 10px',
      textAlign: 'right' as const,
      color: '#333',
      fontSize: '11px',
      fontWeight: 600,
    } as React.CSSProperties,

    totalRow: {
      backgroundColor: '#1b3a6b',
      color: '#fff',
    } as React.CSSProperties,

    totalLabel: {
      padding: '9px 10px',
      fontWeight: 800,
      fontSize: '12px',
      letterSpacing: '1px',
      color: '#fff',
    } as React.CSSProperties,

    totalAmt: {
      padding: '9px 10px',
      textAlign: 'right' as const,
      fontWeight: 800,
      fontSize: '13px',
      color: '#fff',
    } as React.CSSProperties,

    wordsBox: {
      borderLeft: '4px solid #e8a020',
      padding: '7px 12px',
      background: '#fffbf0',
      margin: '12px 0 16px',
      fontSize: '11px',
      color: '#333',
    } as React.CSSProperties,

    sigRow: {
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'flex-end',
      margin: '10px 0 18px',
    } as React.CSSProperties,

    sigLine: {
      width: '170px',
      borderTop: '1.5px solid #888',
      paddingTop: '4px',
      textAlign: 'center' as const,
    } as React.CSSProperties,

    footer: {
      borderLeft: '4px solid #e8a020',
      padding: '7px 12px',
      backgroundColor: '#fffaf0',
      fontSize: '10px',
      color: '#666',
      fontStyle: 'italic' as const,
    } as React.CSSProperties,
  };

  return (
    <>
      {/* Screen-preview — visible on screen, hidden when printing (print handled by iframe) */}
      <div style={{ ...S.page, padding: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '297mm' }}>

        {/* ── WATERMARK ── */}
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '210mm', height: '297mm',
          zIndex: 0, pointerEvents: 'none',
          display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
        }}>
          <img src={watermarkLogoPath} alt="Watermark" style={{ width: '440px', height: '440px', opacity: 0.055, transform: 'rotate(-12deg)', objectFit: 'contain' }} />
        </div>

        {/* ════ HEADER WITH WAVE/CURVED SVG SHAPES ════ */}
        <div className="header-container" style={{ position: 'relative', height: '130px', width: '100%', overflow: 'hidden', background: '#fff', borderBottom: '3px solid #1b3a6b' }}>
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }} viewBox="0 0 718 130" preserveAspectRatio="none">
            {/* Gold curved banner on the right */}
            <path d="M 370 0 L 718 0 L 718 95 C 670 130, 520 130, 420 130 C 460 95, 450 45, 370 0 Z" fill="#e8a020" />
            {/* Navy curved banner on the left (overlapping) */}
            <path d="M 0 0 L 440 0 C 420 85, 380 130, 300 130 L 0 130 Z" fill="#1b3a6b" />
          </svg>
          
          {/* Left side content: Logo and School details inside the Navy area */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '58%', height: '130px', zIndex: 2, display: 'flex', alignItems: 'center', paddingLeft: '20px', color: '#fff' }}>
            <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#fff', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.15)', marginRight: '15px', flexShrink: 0 }}>
              <img src={logoPath} alt="Sunrise School Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <div style={{ fontSize: '19px', fontWeight: 900, letterSpacing: '0.5px', lineHeight: 1.1, color: '#fff' }}>SUNRISE CONVENT SCHOOL</div>
              <div style={{ fontSize: '9px', fontWeight: 700, color: '#fcd34d', marginTop: '3px', letterSpacing: '0.3px' }}>English &amp; Gujarati Medium</div>
              <div style={{ fontSize: '8.5px', color: '#e2e8f0', marginTop: '3px', lineHeight: 1.3 }}>
                Railnagar, Rajkot, Gujarat — 360 001<br/>
                Ph: +91 XXXXX XXXXX &nbsp;·&nbsp; info@sunriseschool.in
              </div>
            </div>
          </div>

          {/* Right side content: RECEIPT title and Receipt No inside the Gold area */}
          <div style={{ position: 'absolute', top: 0, right: 0, width: '42%', height: '115px', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', paddingRight: '25px', color: '#fff' }}>
            <div style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase', color: '#fff', lineHeight: 1, textShadow: '1px 1px 2px rgba(0,0,0,0.15)' }}>RECEIPT</div>
            <div style={{ fontSize: '10px', color: '#1b3a6b', fontWeight: 700, marginTop: '6px', textAlign: 'right', background: 'rgba(255,255,255,0.9)', padding: '3px 8px', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              NO: <span style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 900, color: '#1b3a6b', letterSpacing: '0.5px' }}>{(transaction.id?.slice(-12).toUpperCase() || 'N/A')}</span>
            </div>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box', padding: '0 14mm 0' }}>
          <div style={{ flex: 1, paddingTop: '10px' }}>
            
            {/* ════ INFO GRID ════ */}
            <div style={{ ...S.metaTable, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, border: '1px solid #dde4f0', borderRadius: '6px', overflow: 'hidden', marginBottom: '14px' }}>
              <div style={{ padding: '12px 14px', borderRight: '1px solid #dde4f0', background: '#f8fafd' }}>
                <div style={{ fontSize: '8.5px', fontWeight: 800, color: '#1b3a6b', letterSpacing: '1.5px', textTransform: 'uppercase', borderBottom: '2px solid #e8a020', paddingBottom: '5px', marginBottom: '8px' }}>Student Information</div>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '5px' }}><span style={{ fontSize: '9.5px', fontWeight: 700, color: '#94a3b8', width: '90px', flexShrink: 0 }}>Name</span><span style={{ fontSize: '10px', fontWeight: 600, color: '#1e293b', flex: 1 }}>{transaction.studentName}</span></div>
                {transaction.studentCode && <div style={{ display: 'flex', gap: '6px', marginBottom: '5px' }}><span style={{ fontSize: '9.5px', fontWeight: 700, color: '#94a3b8', width: '90px', flexShrink: 0 }}>Student Code</span><span style={{ fontSize: '10px', fontWeight: 600, color: '#1e293b', flex: 1, fontFamily: 'monospace' }}>{transaction.studentCode}</span></div>}
                {transaction.classInfo && <div style={{ display: 'flex', gap: '6px', marginBottom: '5px' }}><span style={{ fontSize: '9.5px', fontWeight: 700, color: '#94a3b8', width: '90px', flexShrink: 0 }}>Class</span><span style={{ fontSize: '10px', fontWeight: 600, color: '#1e293b', flex: 1 }}>{transaction.classInfo}</span></div>}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '5px' }}><span style={{ fontSize: '9.5px', fontWeight: 700, color: '#94a3b8', width: '90px', flexShrink: 0 }}>Period</span><span style={{ fontSize: '10px', fontWeight: 600, color: '#1e293b', flex: 1 }}>{period}</span></div>
              </div>
              <div style={{ padding: '12px 14px', background: '#fff' }}>
                <div style={{ fontSize: '8.5px', fontWeight: 800, color: '#1b3a6b', letterSpacing: '1.5px', textTransform: 'uppercase', borderBottom: '2px solid #e8a020', paddingBottom: '5px', marginBottom: '8px' }}>Payment Information</div>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '5px' }}><span style={{ fontSize: '9.5px', fontWeight: 700, color: '#94a3b8', width: '90px', flexShrink: 0 }}>Date</span><span style={{ fontSize: '10px', fontWeight: 600, color: '#1e293b', flex: 1 }}>{dateStr}</span></div>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '5px' }}><span style={{ fontSize: '9.5px', fontWeight: 700, color: '#94a3b8', width: '90px', flexShrink: 0 }}>Time</span><span style={{ fontSize: '10px', fontWeight: 600, color: '#1e293b', flex: 1 }}>{timeStr}</span></div>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '5px' }}><span style={{ fontSize: '9.5px', fontWeight: 700, color: '#94a3b8', width: '90px', flexShrink: 0 }}>Mode</span><span style={{ fontSize: '10px', fontWeight: 600, color: '#1e293b', flex: 1 }}>{modeLabel}</span></div>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '5px' }}><span style={{ fontSize: '9.5px', fontWeight: 700, color: '#94a3b8', width: '90px', flexShrink: 0 }}>Status</span><span style={{ fontSize: '10px', fontWeight: 700, color: '#16a34a', flex: 1 }}>✓ Payment Received</span></div>
              </div>
            </div>

            {/* ════ PAYMENT DETAILS SECTION HEADER ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ width: '4px', height: '16px', background: '#e8a020', borderRadius: '2px' }}></div>
              <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#1b3a6b', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Payment Details</div>
            </div>

            {/* ── FEE TABLE ── */}
            <table style={{ ...S.feeTable, border: '1px solid #dde4f0', borderRadius: '6px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #1b3a6b 0%, #2a5298 100%)' }}>
                  <th style={{ padding: '9px 10px', color: '#fff', fontSize: '10px', fontWeight: 700, textAlign: 'center', width: '36px' }}>#</th>
                  <th style={{ padding: '9px 10px', color: '#fff', fontSize: '10px', fontWeight: 700, textAlign: 'left' }}>Description</th>
                  <th style={{ padding: '9px 10px', color: '#fff', fontSize: '10px', fontWeight: 700, textAlign: 'center', width: '110px' }}>Mode</th>
                  <th style={{ padding: '9px 10px', color: '#fff', fontSize: '10px', fontWeight: 700, textAlign: 'right', width: '110px' }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {transaction.subItems && transaction.subItems.length > 0 ? (
                  transaction.subItems.map((item, i) => (
                    <tr
                      key={i}
                      style={{
                        backgroundColor: i % 2 === 0 ? '#f8fafd' : '#ffffff',
                        borderBottom: '1px solid #e8edf8',
                      }}
                    >
                      <td style={{ ...S.tdNum, textAlign: 'center', borderRight: '1px solid #e2e8f4' }}>{i + 1}</td>
                      <td style={{ ...S.tdDesc, fontWeight: 500, borderRight: '1px solid #e2e8f4' }}>
                        {item.description}
                        {item.concessionAmount > 0 && (
                          <span style={{ display: 'inline-block', marginLeft: '8px', fontSize: '9.5px', color: '#b45309', background: '#fef3c7', padding: '1px 6px', borderRadius: '3px', fontWeight: 600 }}>
                            -₹{item.concessionAmount.toLocaleString('en-IN')} off
                          </span>
                        )}
                      </td>
                      <td style={{ ...S.tdDesc, textAlign: 'center', borderRight: '1px solid #e2e8f4' }}>{getModeLabel(item.method || transaction.method || '')}</td>
                      <td style={{ ...S.tdAmt, color: '#1b3a6b', fontWeight: 700 }}>₹{Math.abs(item.amount).toLocaleString('en-IN')}</td>
                    </tr>
                  ))
                ) : (
                  <tr style={{ backgroundColor: '#f8fafd' }}>
                    <td style={{ ...S.tdNum, textAlign: 'center', borderRight: '1px solid #e2e8f4' }}>1</td>
                    <td style={{ ...S.tdDesc, fontWeight: 500, borderRight: '1px solid #e2e8f4' }}>{transaction.feeType || 'Fee Collection'}</td>
                    <td style={{ ...S.tdDesc, textAlign: 'center', borderRight: '1px solid #e2e8f4' }}>{modeLabel}</td>
                    <td style={{ ...S.tdAmt, color: '#1b3a6b', fontWeight: 700 }}>₹{totalAmount.toLocaleString('en-IN')}</td>
                  </tr>
                )}

                {/* Top-level concession row */}
                {!transaction.subItems && transaction.concessionAmount ? (
                  <tr style={{ backgroundColor: '#fffbeb' }}>
                    <td style={{ borderRight: '1px solid #e2e8f4' }}></td>
                    <td style={{ ...S.tdDesc, color: '#b45309', fontStyle: 'italic', fontWeight: 600, borderRight: '1px solid #e2e8f4' }}>
                      ✦ Concession Applied
                    </td>
                    <td style={{ borderRight: '1px solid #e2e8f4' }}></td>
                    <td style={{ ...S.tdAmt, color: '#b45309', fontWeight: 700 }}>
                      −₹{(transaction.concessionAmount || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ) : null}
              </tbody>

              <tfoot>
                <tr style={{ background: 'linear-gradient(135deg, #e8a020 0%, #d08c16 100%)' }}>
                  <td colSpan={3} style={{ padding: '11px 12px', color: '#1b3a6b', fontWeight: 800, fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase' }}>TOTAL PAID</td>
                  <td style={{ padding: '11px 12px', color: '#1b3a6b', fontWeight: 800, fontSize: '16px', textAlign: 'right' }}>₹ {totalAmount.toLocaleString('en-IN')}</td>
                </tr>
              </tfoot>
            </table>

            {/* ── AMOUNT IN WORDS ── */}
            <div style={{ ...S.wordsBox, borderLeft: '4px solid #e8a020', background: 'linear-gradient(to right, #fffbf0, #fff)', padding: '9px 14px', borderRadius: '0 4px 4px 0', fontSize: '10.5px', color: '#334155', marginTop: '12px' }}>
              <strong>Amount in Words:</strong>&nbsp;
              <em>{amountInWords}</em>
            </div>

            {transaction.remark && (
              <div style={{ borderLeft: '4px solid #94a3b8', background: '#f8fafd', padding: '7px 14px', borderRadius: '0 4px 4px 0', fontSize: '10px', color: '#475569', fontStyle: 'italic', marginTop: '8px' }}>
                <strong>Remark:</strong>&nbsp;
                <em>{transaction.remark}</em>
              </div>
            )}

            {/* ── SIGNATURES ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '20px', marginBottom: '16px' }}>
              <div style={{ width: '100px', height: '70px', border: '1.5px dashed #cbd5e1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: '8px', fontWeight: 600, textAlign: 'center', lineHeight: '1.4' }}>
                SCHOOL<br/>SEAL
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#1b3a6b', marginBottom: '28px' }}>
                  {currentUser?.name ? currentUser.name.toUpperCase() : 'AUTHORISED SIGNATORY'}
                </div>
                <div style={{ ...S.sigLine, borderTop: '1.5px solid #94a3b8', paddingTop: '5px' }}>
                  <div style={{ fontSize: '8.5px', color: '#94a3b8', fontWeight: 600 }}>
                    Authorised Signatory
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ════ FOOTER WITH CURVED SVG SHAPES ════ */}
        <div className="footer-container" style={{ position: 'relative', height: '75px', width: '100%', overflow: 'hidden', background: '#fff', zIndex: 10 }}>
          <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }} viewBox="0 0 718 75" preserveAspectRatio="none">
            {/* Gold curved block on the bottom left (underneath) */}
            <path d="M 0 30 L 220 30 C 180 65, 140 75, 100 75 L 0 75 Z" fill="#e8a020" />
            {/* Navy curved block on the bottom right (overlapping) */}
            <path d="M 180 30 L 718 30 L 718 75 L 130 75 C 160 75, 160 45, 180 30 Z" fill="#1b3a6b" />
          </svg>
          
          {/* Left side text (Gold block) */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '22%', height: '45px', zIndex: 2, display: 'flex', alignItems: 'center', paddingLeft: '20px', color: '#1b3a6b' }}>
            <span style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase' }}>THANK YOU</span>
          </div>

          {/* Right side text (Navy block) */}
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '78%', height: '45px', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '25px', color: '#fff', fontSize: '9.5px' }}>
            <div style={{ display: 'flex', gap: '18px', fontWeight: 600, alignItems: 'center', letterSpacing: '0.5px' }}>
              <span>📞 +91 XXXXX XXXXX</span>
              <span style={{ opacity: 0.4 }}>|</span>
              <span>✉️ info@sunriseschool.in</span>
              <span style={{ opacity: 0.4 }}>|</span>
              <span>🌐 www.sunriseschool.in</span>
            </div>
          </div>
        </div>

      </div>
    </>
  );
};