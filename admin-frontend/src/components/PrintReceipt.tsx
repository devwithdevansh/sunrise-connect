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

    if (crore)    result += below1000(crore)    + ' Crore ';
    if (lakh)     result += below1000(lakh)     + ' Lakh ';
    if (thousand) result += below1000(thousand) + ' Thousand ';
    if (n)        result += below1000(n);

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
  const amountInWords  = toIndianWords(totalAmount);
  const modeLabel      = getModeLabel(transaction.method || '');

  /* Build period string as fees year */
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
      padding: '5px 8px',
      color: '#444',
      fontSize: '11px',
      width: '34px',
    } as React.CSSProperties,

    tdDesc: {
      padding: '5px 8px',
      color: '#333',
      fontSize: '11px',
    } as React.CSSProperties,

    tdAmt: {
      padding: '5px 8px',
      textAlign: 'right' as const,
      color: '#333',
      fontSize: '11px',
      fontWeight: 600,
      whiteSpace: 'nowrap' as const,
    } as React.CSSProperties,

    totalRow: {
      backgroundColor: '#1b3a6b',
      color: '#fff',
    } as React.CSSProperties,

    totalLabel: {
      padding: '7px 8px',
      fontWeight: 800,
      fontSize: '12px',
      letterSpacing: '1px',
      color: '#fff',
    } as React.CSSProperties,

    totalAmt: {
      padding: '7px 8px',
      textAlign: 'right' as const,
      fontWeight: 800,
      fontSize: '13px',
      color: '#fff',
      whiteSpace: 'nowrap' as const,
    } as React.CSSProperties,

    wordsBox: {
      borderLeft: '4px solid #e8a020',
      padding: '7px 12px',
      background: '#fffbf0',
      margin: '12px 0 16px',
      fontSize: '11px',
    } as React.CSSProperties,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600;700&display=swap');
      `}</style>

      {/* Screen-preview — visible on screen, hidden when printing (print handled by iframe) */}
      <div style={{ ...S.page, padding: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '297mm', fontFamily: "'Inter', sans-serif", color: '#1e293b' }}>

        {/* ── WATERMARK ── */}
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '210mm', height: '297mm',
          zIndex: 1, pointerEvents: 'none',
          display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
        }}>
          <img src={watermarkLogoPath} alt="Watermark" style={{ width: '440px', height: '440px', opacity: 0.08, transform: 'rotate(-12deg)', objectFit: 'contain' }} />
        </div>

        {/* ════ HEADER WITH WAVE/CURVED BLOCK OVERLAPS ════ */}
        <div className="header-container" style={{ position: 'relative', height: '110px', width: '100%', overflow: 'hidden', background: '#fff', borderBottom: '3px solid #1b3a6b' }}>
          {/* Right Gold Block (Shorter, tucked behind) */}
          <div style={{ position: 'absolute', top: 0, right: 0, width: '48%', height: '80px', background: '#e8a020', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', paddingRight: '25px', color: '#fff' }}>
            <div style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase', color: '#fff', lineHeight: 1, textShadow: '1px 1px 2px rgba(0,0,0,0.15)', fontFamily: "'Outfit', sans-serif" }}>RECEIPT</div>
            <div style={{ fontSize: '9px', color: '#1b3a6b', fontWeight: 700, marginTop: '4px', textAlign: 'right', background: 'rgba(255,255,255,0.9)', padding: '2px 6px', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              NO: <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', fontWeight: 900, color: '#1b3a6b', letterSpacing: '0.5px' }}>{(transaction.id?.slice(-12).toUpperCase() || 'N/A')}</span>
            </div>
          </div>

          {/* Left Navy Block (Full height, overlapping, with bottom-right curve) */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '60%', height: '110px', background: '#1b3a6b', zIndex: 2, borderBottomRightRadius: '35px', display: 'flex', alignItems: 'center', paddingLeft: '20px', color: '#fff' }}>
            <div style={{ width: '58px', height: '58px', borderRadius: '50%', background: '#fff', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.15)', marginRight: '12px', flexShrink: 0 }}>
              <img src={logoPath} alt="Sunrise School Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <div style={{ fontSize: '17px', fontWeight: 900, letterSpacing: '0.5px', lineHeight: 1.1, color: '#fff', fontFamily: "'Outfit', sans-serif" }}>SUNRISE CONVENT SCHOOL</div>
              <div style={{ fontSize: '8.5px', fontWeight: 700, color: '#fcd34d', marginTop: '2px', letterSpacing: '0.3px', fontFamily: "'Outfit', sans-serif" }}>English &amp; Gujarati Medium</div>
              <div style={{ fontSize: '8px', color: '#e2e8f0', marginTop: '2px', lineHeight: 1.25 }}>
                Railnagar, Rajkot, Gujarat — 360 001<br/>
                Ph: +91 XXXXX XXXXX &nbsp;·&nbsp; info@sunriseschool.in
              </div>
            </div>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box', padding: '0 14mm 0', background: 'transparent' }}>
          <div style={{ flex: 1, paddingTop: '10px' }}>
            
            {/* ════ INFO GRID ════ */}
            <div style={{ ...S.metaTable, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', border: 'none', overflow: 'visible', marginBottom: '10px' }}>
              <div style={{ padding: '8px 12px', border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: '6px', background: 'rgba(248, 250, 253, 0.65)' }}>
                <div style={{ fontSize: '8.5px', fontWeight: 800, color: '#1b3a6b', letterSpacing: '1.2px', textTransform: 'uppercase', borderBottom: '2px solid #e8a020', paddingBottom: '4px', marginBottom: '6px', fontFamily: "'Outfit', sans-serif" }}>Student Information</div>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '4px', alignItems: 'baseline' }}><span style={{ fontSize: '8px', fontWeight: 700, color: '#64748b', width: '90px', flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.8px', fontFamily: "'Outfit', sans-serif" }}>Name</span><span style={{ fontSize: '12px', fontWeight: 700, color: '#1b3a6b', flex: 1 }}>{transaction.studentName}</span></div>
                {transaction.classInfo && <div style={{ display: 'flex', gap: '6px', marginBottom: '4px', alignItems: 'baseline' }}><span style={{ fontSize: '8px', fontWeight: 700, color: '#64748b', width: '90px', flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.8px', fontFamily: "'Outfit', sans-serif" }}>Class</span><span style={{ fontSize: '10px', fontWeight: 600, color: '#1e293b', flex: 1 }}>{transaction.classInfo}</span></div>}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '4px', alignItems: 'baseline' }}><span style={{ fontSize: '8px', fontWeight: 700, color: '#64748b', width: '90px', flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.8px', fontFamily: "'Outfit', sans-serif" }}>Period</span><span style={{ fontSize: '10px', fontWeight: 600, color: '#1e293b', flex: 1 }}>{period}</span></div>
              </div>
              <div style={{ padding: '8px 12px', border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.65)' }}>
                <div style={{ fontSize: '8.5px', fontWeight: 800, color: '#1b3a6b', letterSpacing: '1.2px', textTransform: 'uppercase', borderBottom: '2px solid #e8a020', paddingBottom: '4px', marginBottom: '6px', fontFamily: "'Outfit', sans-serif" }}>Payment Information</div>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '4px', alignItems: 'baseline' }}><span style={{ fontSize: '8px', fontWeight: 700, color: '#64748b', width: '90px', flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.8px', fontFamily: "'Outfit', sans-serif" }}>Date</span><span style={{ fontSize: '9.5px', fontWeight: 600, color: '#1e293b', flex: 1, fontFamily: "'JetBrains Mono', monospace" }}>{dateStr}</span></div>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '4px', alignItems: 'baseline' }}><span style={{ fontSize: '8px', fontWeight: 700, color: '#64748b', width: '90px', flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.8px', fontFamily: "'Outfit', sans-serif" }}>Time</span><span style={{ fontSize: '9.5px', fontWeight: 600, color: '#1e293b', flex: 1, fontFamily: "'JetBrains Mono', monospace" }}>{timeStr}</span></div>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '4px', alignItems: 'baseline' }}><span style={{ fontSize: '8px', fontWeight: 700, color: '#64748b', width: '90px', flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.8px', fontFamily: "'Outfit', sans-serif" }}>Status</span><span style={{ fontSize: '10px', fontWeight: 700, color: '#16a34a', flex: 1 }}>Payment Received</span></div>
              </div>
            </div>

            {/* ════ PAYMENT DETAILS SECTION HEADER ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ width: '4px', height: '16px', background: '#e8a020', borderRadius: '2px' }}></div>
              <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#1b3a6b', letterSpacing: '0.8px', textTransform: 'uppercase', fontFamily: "'Outfit', sans-serif" }}>Payment Details</div>
            </div>

            {/* ── FEE TABLE ── */}
            <table style={{ ...S.feeTable, border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: '8px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #1b3a6b 0%, #2a5298 100%)' }}>
                  <th style={{ padding: '10px 12px', color: '#fff', fontSize: '9.5px', fontWeight: 700, textAlign: 'center', width: '36px', letterSpacing: '0.8px', textTransform: 'uppercase', fontFamily: "'Outfit', sans-serif" }}>#</th>
                  <th style={{ padding: '10px 12px', color: '#fff', fontSize: '9.5px', fontWeight: 700, textAlign: 'left', letterSpacing: '0.8px', textTransform: 'uppercase', fontFamily: "'Outfit', sans-serif" }}>Description</th>
                  <th style={{ padding: '10px 12px', color: '#fff', fontSize: '9.5px', fontWeight: 700, textAlign: 'center', width: '110px', letterSpacing: '0.8px', textTransform: 'uppercase', fontFamily: "'Outfit', sans-serif" }}>Mode</th>
                  <th style={{ padding: '10px 12px', color: '#fff', fontSize: '9.5px', fontWeight: 700, textAlign: 'right', width: '110px', letterSpacing: '0.8px', textTransform: 'uppercase', fontFamily: "'Outfit', sans-serif" }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {transaction.subItems && transaction.subItems.length > 0 ? (
                  transaction.subItems.map((item, i) => (
                    <tr
                      key={i}
                      style={{
                        backgroundColor: i % 2 === 0 ? 'rgba(248, 250, 253, 0.7)' : 'rgba(255, 255, 255, 0.75)',
                        borderBottom: '1px solid #e8edf8',
                      }}
                    >
                      <td style={{ ...S.tdNum, textAlign: 'center', borderRight: '1px solid #e2e8f4', fontFamily: "'JetBrains Mono', monospace" }}>{i + 1}</td>
                      <td style={{ ...S.tdDesc, fontWeight: 600, borderRight: '1px solid #e2e8f4' }}>
                        {item.description}
                        {item.concessionAmount > 0 && (
                          <span style={{ display: 'inline-block', marginLeft: '8px', fontSize: '9px', color: '#b45309', background: 'rgba(254, 243, 199, 0.85)', border: '1px solid rgba(252, 211, 77, 0.5)', padding: '2px 8px', borderRadius: '9999px', fontWeight: 700, fontFamily: "'Inter', sans-serif" }}>
                            -₹{item.concessionAmount.toLocaleString('en-IN')} off
                          </span>
                        )}
                      </td>
                      <td style={{ ...S.tdDesc, textAlign: 'center', borderRight: '1px solid #e2e8f4' }}>{getModeLabel(item.method || transaction.method || '')}</td>
                      <td style={{ ...S.tdAmt, color: '#1b3a6b', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{Math.abs(item.amount).toLocaleString('en-IN')} ₹</td>
                    </tr>
                  ))
                ) : (
                  <tr style={{ backgroundColor: 'rgba(248, 250, 253, 0.7)' }}>
                    <td style={{ ...S.tdNum, textAlign: 'center', borderRight: '1px solid #e2e8f4', fontFamily: "'JetBrains Mono', monospace" }}>1</td>
                    <td style={{ ...S.tdDesc, fontWeight: 600, borderRight: '1px solid #e2e8f4' }}>{transaction.feeType || 'Fee Collection'}</td>
                    <td style={{ ...S.tdDesc, textAlign: 'center', borderRight: '1px solid #e2e8f4' }}>{modeLabel}</td>
                    <td style={{ ...S.tdAmt, color: '#1b3a6b', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{totalAmount.toLocaleString('en-IN')} ₹</td>
                  </tr>
                )}

                {/* Top-level concession row */}
                {!transaction.subItems && transaction.concessionAmount ? (
                  <tr style={{ backgroundColor: 'rgba(255, 251, 235, 0.7)' }}>
                    <td style={{ borderRight: '1px solid #e2e8f4', fontFamily: "'JetBrains Mono', monospace" }}></td>
                    <td style={{ ...S.tdDesc, color: '#b45309', fontStyle: 'italic', fontWeight: 700, borderRight: '1px solid #e2e8f4' }}>
                      ✦ Concession Applied
                    </td>
                    <td style={{ borderRight: '1px solid #e2e8f4' }}></td>
                    <td style={{ ...S.tdAmt, color: '#b45309', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                      −{(transaction.concessionAmount || 0).toLocaleString('en-IN')} ₹
                    </td>
                  </tr>
                ) : null}
              </tbody>

              <tfoot>
                <tr style={{ background: 'linear-gradient(to bottom, #e8a020, #d97706)' }}>
                  <td colSpan={3} style={{ ...S.totalLabel, borderBottom: '3px double #1b3a6b' }}>TOTAL PAID</td>
                  <td style={{ ...S.totalAmt, borderBottom: '3px double #1b3a6b', fontSize: '14px' }}>{totalAmount.toLocaleString('en-IN')} ₹</td>
                </tr>
              </tfoot>
            </table>

            {/* ── AMOUNT IN WORDS ── */}
            <div style={{ borderLeft: '4px solid #e8a020', background: 'linear-gradient(to right, rgba(255, 251, 240, 0.85), rgba(255, 255, 255, 0.85))', padding: '10px 14px', borderRadius: '0 6px 6px 0', fontSize: '10px', color: '#334155', marginTop: '12px', borderTop: '1px solid rgba(226, 232, 240, 0.3)', borderBottom: '1px solid rgba(226, 232, 240, 0.3)', borderRight: '1px solid rgba(226, 232, 240, 0.3)' }}>
              <strong>Amount in Words:</strong>&nbsp;
              <em>{amountInWords}</em>
            </div>

            {transaction.remark && (
              <div style={{ borderLeft: '4px solid #94a3b8', background: 'rgba(248, 250, 253, 0.85)', padding: '8px 14px', borderRadius: '0 6px 6px 0', fontSize: '9.5px', color: '#475569', fontStyle: 'italic', marginTop: '8px', borderTop: '1px solid rgba(226, 232, 240, 0.3)', borderBottom: '1px solid rgba(226, 232, 240, 0.3)', borderRight: '1px solid rgba(226, 232, 240, 0.3)' }}>
                <strong>Remark:</strong>&nbsp;
                <em>{transaction.remark}</em>
              </div>
            )}

            {/* ── SIGNATURES ── */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', marginTop: '25px', marginBottom: '16px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#1b3a6b', marginBottom: '28px', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.5px' }}>
                  {currentUser?.name ? currentUser.name.toUpperCase() : 'AUTHORISED SIGNATORY'}
                </div>
                <div style={{ width: '170px', borderTop: '1.5px solid #94a3b8', paddingTop: '5px' }}>
                  <div style={{ fontSize: '8.5px', color: '#94a3b8', fontWeight: 600, fontFamily: "'Outfit', sans-serif", textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Authorised Signatory
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ════ FOOTER WITH WAVE/CURVED BLOCK OVERLAPS ════ */}
        <div className="footer-container" style={{ position: 'relative', height: '60px', width: '100%', overflow: 'hidden', background: '#fff', zIndex: 10 }}>
          {/* Left Gold Block (Shorter, tucked behind) */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '45%', height: '45px', background: '#e8a020', zIndex: 1, display: 'flex', alignItems: 'center', paddingLeft: '20px', color: '#1b3a6b' }}>
            <span style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase' }}>THANK YOU</span>
          </div>

          {/* Right Navy Block (Full height, overlapping, with top-left curve) */}
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '70%', height: '60px', background: '#1b3a6b', zIndex: 2, borderTopLeftRadius: '35px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '25px', color: '#fff', fontSize: '9.5px' }}>
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