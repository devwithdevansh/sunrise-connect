/**
 * PrintReceipt.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Screen-preview component rendered inside a modal/slide-in panel.
 * Layout: A5 portrait (148 × 210 mm) — two-panel design
 *   LEFT  : navy sidebar  — logo · school name · receipt badge · student info
 *   RIGHT : white panel   — date/time/status strip · fee table · signature
 *
 * Actual printing is handled by printUtils.ts → generateReceiptA5HTML()
 * via an iframe so that @page size rules apply correctly.
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
    if (crore) result += below1000(crore) + ' Crore ';
    if (lakh) result += below1000(lakh) + ' Lakh ';
    if (thousand) result += below1000(thousand) + ' Thousand ';
    if (n) result += below1000(n);
    return result.trim();
  };

  if (rupees === 0 && paise === 0) return 'Zero Rupees Only';
  let words = '';
  if (rupees > 0) words += convertPart(rupees) + ' Rupees';
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
  if (m === 'cash') return 'Cash';
  if (m === 'upi') return 'UPI / Online';
  if (m === 'online') return 'Online Transfer';
  if (m === 'cheque') return 'Cheque';
  if (m === 'neft' || m === 'rtgs' || m === 'imps') return m.toUpperCase();
  return method ? method.charAt(0).toUpperCase() + method.slice(1) : 'N/A';
}

/* ─── SubItem grouping (unchanged logic) ─────────────────────────── */
interface SubItem {
  id?: string;
  description: string;
  amount: number;
  concessionAmount: number;
  method?: string;
  status?: string;
}
function groupSubItems(items: SubItem[]): SubItem[] {
  if (!items || items.length === 0) return [];
  const MONTH_ORDER = [
    'April', 'May', 'June', 'July', 'August', 'September',
    'October', 'November', 'December', 'January', 'February', 'March',
  ];
  const groups: { [key: string]: { items: SubItem[]; months: string[] } } = {};
  for (const item of items) {
    const match = item.description.match(
      /^(.+?)\s*-\s*(January|February|March|April|May|June|July|August|September|October|November|December)$/i
    );
    if (match) {
      const rawPrefix = match[1].trim();
      const rawMonth = match[2].charAt(0).toUpperCase() + match[2].slice(1).toLowerCase();
      if (!groups[rawPrefix]) groups[rawPrefix] = { items: [], months: [] };
      groups[rawPrefix].items.push(item);
      groups[rawPrefix].months.push(rawMonth);
    } else {
      const desc = item.description.trim();
      if (!groups[desc]) groups[desc] = { items: [], months: [] };
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
      const totalAmt = g.items.reduce((s, x) => s + x.amount, 0);
      const totalConcession = g.items.reduce((s, x) => s + x.concessionAmount, 0);
      const first = g.items[0];
      result.push({
        description: startMonth === endMonth
          ? `${key} - ${startMonth}`
          : `${key} - ${startMonth} to ${endMonth}`,
        amount: totalAmt,
        concessionAmount: totalConcession,
        method: first.method,
        status: first.status,
      });
    } else {
      if (g.items.length === 1) {
        result.push(g.items[0]);
      } else {
        const totalAmt = g.items.reduce((s, x) => s + x.amount, 0);
        const totalConcession = g.items.reduce((s, x) => s + x.concessionAmount, 0);
        const first = g.items[0];
        result.push({ description: key, amount: totalAmt, concessionAmount: totalConcession, method: first.method, status: first.status });
      }
    }
  }
  return result;
}

/* ─── Component ─────────────────────────────────────────────────── */
export const PrintReceipt: React.FC<PrintReceiptProps> = ({ transaction }) => {
  const { currentUser } = useApp();

  if (!transaction) return null;

  const totalAmount = Math.abs(transaction.amount);
  const amountInWords = toIndianWords(totalAmount);
  const modeLabel = getModeLabel(transaction.method || '');
  const receiptNo = (transaction.id?.slice(-12).toUpperCase() || 'N/A');
  const signerName = currentUser?.name ? currentUser.name.toUpperCase() : 'ADMIN';

  /* Academic period */
  const period = (() => {
    if (transaction.studentCode) {
      const match = transaction.studentCode.match(/\/(\d{4})-(\d{2})\//);
      if (match) return `${match[1]} – ${match[1].slice(0, 2) + match[2]}`;
    }
    const y = transaction.date ? new Date(transaction.date).getFullYear() : new Date().getFullYear();
    return `${y} – ${y + 1}`;
  })();

  const dateStr = transaction.date
    ? new Date(transaction.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  const timeStr = transaction.time
    || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  /* Fee rows */
  const groupedItems = transaction.subItems?.length
    ? groupSubItems(transaction.subItems)
    : null;

  /* ── Shared colour tokens ── */
  const navy = '#1b3a6b';
  const gold = '#e8a020';
  const gold2 = '#d97706';
  const white = '#ffffff';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600;700&display=swap');
      `}</style>

      {/*
        ══════════════════════════════════════════════════
        A5 PORTRAIT  148 × 210 mm
        Split into LEFT navy panel (56 mm) + RIGHT white panel (flex)
        ══════════════════════════════════════════════════
      */}
      <div style={{
        width: '148mm',
        height: '210mm',
        display: 'flex',
        flexDirection: 'row',
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: '9px',
        color: '#1e293b',
        backgroundColor: white,
        boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
        borderRadius: '4px',
        overflow: 'hidden',
        margin: '0 auto',
        boxSizing: 'border-box',
        position: 'relative',
      }}>

        {/* ══════════ LEFT NAVY PANEL (56 mm) ══════════ */}
        <div style={{
          width: '56mm',
          flexShrink: 0,
          backgroundColor: navy,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
        }}>

          {/* Subtle diagonal accent strip at top-right of left panel */}
          <div style={{
            position: 'absolute', top: 0, right: 0,
            width: '30px', height: '140px',
            background: 'linear-gradient(to bottom-left, rgba(232,160,32,0.18), transparent)',
            pointerEvents: 'none',
          }} />

          {/* ── Logo + School Name Header ── */}
          <div style={{
            padding: '14px 14px 10px',
            borderBottom: `1px solid rgba(255,255,255,0.10)`,
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
          }}>
            {/* Logo circle */}
            <div style={{
              width: '46px', height: '46px',
              borderRadius: '50%',
              backgroundColor: white,
              padding: '4px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 3px 10px rgba(0,0,0,0.28)',
            }}>
              <img
                src={logoPath}
                alt="Sunrise School Logo"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            {/* School name */}
            <div>
              <div style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: '10px', fontWeight: 900, color: white,
                lineHeight: 1.2, letterSpacing: '0.3px',
              }}>
                SUNRISE SCHOOL<br />RAJKOT
              </div>
              <div style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: '7px', fontWeight: 700,
                color: '#fcd34d', marginTop: '3px',
              }}>
                English &amp; Gujarati Medium
              </div>
              <div style={{ fontSize: '6.5px', color: 'rgba(226,232,240,0.75)', marginTop: '2px', lineHeight: 1.5 }}>
                Railnagar, Rajkot — 360 001
              </div>
            </div>
          </div>

          {/* ── Receipt Badge ── */}
          <div style={{
            margin: '10px 14px 0',
            backgroundColor: gold,
            borderRadius: '6px',
            padding: '7px 11px',
          }}>
            <div style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '15px', fontWeight: 900, color: white,
              letterSpacing: '3px', lineHeight: 1,
              textTransform: 'uppercase',
              textShadow: '1px 1px 2px rgba(0,0,0,0.15)',
            }}>
              RECEIPT
            </div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '7.5px', fontWeight: 700,
              color: navy,
              backgroundColor: 'rgba(255,255,255,0.90)',
              padding: '2px 6px', borderRadius: '3px',
              marginTop: '5px',
              display: 'inline-block',
              letterSpacing: '0.4px',
            }}>
              NO: {receiptNo}
            </div>
          </div>

          {/* ── Student Information ── */}
          <div style={{ padding: '10px 14px 0', flex: 1 }}>
            <div style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '6.5px', fontWeight: 800,
              color: '#fcd34d',
              textTransform: 'uppercase', letterSpacing: '1.2px',
              borderBottom: '1px solid rgba(232,160,32,0.35)',
              paddingBottom: '3px', marginBottom: '7px',
            }}>
              Student Information
            </div>

            {/* Name */}
            <div style={{ display: 'flex', gap: '5px', marginBottom: '5px', alignItems: 'baseline' }}>
              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '6px', fontWeight: 700, color: 'rgba(148,163,184,0.85)', textTransform: 'uppercase', letterSpacing: '0.6px', width: '40px', flexShrink: 0 }}>Name</span>
              <span style={{ fontSize: '10px', fontWeight: 800, color: white, flex: 1 }}>{transaction.studentName}</span>
            </div>
            {/* Class */}
            {transaction.classInfo && (
              <div style={{ display: 'flex', gap: '5px', marginBottom: '5px', alignItems: 'baseline' }}>
                <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '6px', fontWeight: 700, color: 'rgba(148,163,184,0.85)', textTransform: 'uppercase', letterSpacing: '0.6px', width: '40px', flexShrink: 0 }}>Class</span>
                <span style={{ fontSize: '8px', fontWeight: 600, color: white, flex: 1 }}>{transaction.classInfo}</span>
              </div>
            )}
            {/* Period */}
            <div style={{ display: 'flex', gap: '5px', marginBottom: '5px', alignItems: 'baseline' }}>
              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '6px', fontWeight: 700, color: 'rgba(148,163,184,0.85)', textTransform: 'uppercase', letterSpacing: '0.6px', width: '40px', flexShrink: 0 }}>Period</span>
              <span style={{ fontSize: '8px', fontWeight: 600, color: white, flex: 1 }}>{period}</span>
            </div>
          </div>

          {/* ── Left Footer (Gold) ── */}
          <div style={{
            backgroundColor: gold,
            padding: '8px 14px',
          }}>
            <div style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '8.5px', fontWeight: 900,
              color: navy, letterSpacing: '1.5px',
              textTransform: 'uppercase',
            }}>
              Thank You
            </div>
            <div style={{ fontSize: '6px', color: 'rgba(27,58,107,0.72)', marginTop: '1px' }}>
              +91 97236 55151 · info@sunriseschoolrajkot.com
            </div>
          </div>
        </div>
        {/* ══════════ END LEFT PANEL ══════════ */}


        {/* ══════════ RIGHT WHITE PANEL ══════════ */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '12px 13px 10px',
          backgroundColor: white,
          position: 'relative',
          overflow: 'hidden',
        }}>

          {/* Watermark */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 0, pointerEvents: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          }}>
            <img
              src={watermarkLogoPath}
              alt=""
              style={{ width: '200px', height: '200px', opacity: 0.06, transform: 'rotate(-10deg)', objectFit: 'contain' }}
            />
          </div>

          {/* All right-panel content sits above watermark */}
          <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>

            {/* ── Date / Time / Status strip ── */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
              gap: '5px', marginBottom: '9px',
            }}>
              {[
                { label: 'Date', value: dateStr, valueStyle: {} },
                { label: 'Time', value: timeStr, valueStyle: {} },
                { label: 'Status', value: 'Payment Received', valueStyle: { color: '#16a34a', fontWeight: 700 } },
              ].map(({ label, value, valueStyle }) => (
                <div key={label} style={{
                  backgroundColor: 'rgba(248,250,253,0.85)',
                  border: '1px solid rgba(226,232,240,0.80)',
                  borderRadius: '5px', padding: '5px 7px',
                }}>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '6px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{label}</div>
                  <div style={{ fontSize: '7.5px', fontWeight: 600, color: '#1e293b', marginTop: '2px', ...valueStyle }}>{value}</div>
                </div>
              ))}
            </div>

            {/* ── Section Header: Payment Details ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <div style={{ width: '3px', height: '11px', backgroundColor: gold, borderRadius: '2px', flexShrink: 0 }} />
              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '7.5px', fontWeight: 800, color: navy, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                Payment Details
              </div>
            </div>

            {/* ── Fee Table ── */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid rgba(226,232,240,0.80)', borderRadius: '5px', overflow: 'hidden', marginBottom: 0 }}>
              <thead>
                <tr style={{ background: `linear-gradient(135deg, ${navy} 0%, #2a5298 100%)` }}>
                  <th style={{ padding: '5px 7px', color: white, fontSize: '6.5px', fontWeight: 700, textAlign: 'center', width: '22px', letterSpacing: '0.8px', textTransform: 'uppercase', fontFamily: "'Outfit', sans-serif" }}>#</th>
                  <th style={{ padding: '5px 7px', color: white, fontSize: '6.5px', fontWeight: 700, textAlign: 'left', letterSpacing: '0.8px', textTransform: 'uppercase', fontFamily: "'Outfit', sans-serif" }}>Description</th>
                  <th style={{ padding: '5px 7px', color: white, fontSize: '6.5px', fontWeight: 700, textAlign: 'center', width: '72px', letterSpacing: '0.8px', textTransform: 'uppercase', fontFamily: "'Outfit', sans-serif" }}>Mode</th>
                  <th style={{ padding: '5px 7px', color: white, fontSize: '6.5px', fontWeight: 700, textAlign: 'right', width: '78px', letterSpacing: '0.8px', textTransform: 'uppercase', fontFamily: "'Outfit', sans-serif" }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {groupedItems ? (
                  groupedItems.map((item, i) => (
                    <tr key={i} style={{ backgroundColor: i % 2 === 0 ? 'rgba(248,250,253,0.75)' : white, borderBottom: '1px solid #e8edf8' }}>
                      <td style={{ padding: '5px 7px', color: '#64748b', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: '8px', borderRight: '1px solid #e2e8f4' }}>{i + 1}</td>
                      <td style={{ padding: '5px 7px', color: '#1e293b', fontWeight: 600, fontSize: '8.5px', borderRight: '1px solid #e2e8f4' }}>
                        {item.description}
                        {item.concessionAmount > 0 && (
                          <span style={{
                            display: 'inline-block', marginLeft: '5px',
                            fontSize: '7px', color: '#b45309',
                            backgroundColor: 'rgba(254,243,199,0.9)',
                            border: '1px solid rgba(252,211,77,0.5)',
                            padding: '1px 5px', borderRadius: '9999px',
                            fontWeight: 700, fontFamily: "'Inter', sans-serif",
                          }}>
                            −{item.concessionAmount.toLocaleString('en-IN')} ₹ off
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '5px 7px', color: '#475569', textAlign: 'center', fontSize: '8px', borderRight: '1px solid #e2e8f4' }}>{getModeLabel(item.method || transaction.method || '')}</td>
                      <td style={{ padding: '5px 7px', textAlign: 'right', color: navy, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", fontSize: '8.5px', whiteSpace: 'nowrap' }}>{Math.abs(item.amount).toLocaleString('en-IN')} ₹</td>
                    </tr>
                  ))
                ) : (
                  <tr style={{ backgroundColor: 'rgba(248,250,253,0.75)' }}>
                    <td style={{ padding: '5px 7px', color: '#64748b', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: '8px', borderRight: '1px solid #e2e8f4' }}>1</td>
                    <td style={{ padding: '5px 7px', color: '#1e293b', fontWeight: 600, fontSize: '8.5px', borderRight: '1px solid #e2e8f4' }}>{transaction.feeType || 'Fee Collection'}</td>
                    <td style={{ padding: '5px 7px', color: '#475569', textAlign: 'center', fontSize: '8px', borderRight: '1px solid #e2e8f4' }}>{modeLabel}</td>
                    <td style={{ padding: '5px 7px', textAlign: 'right', color: navy, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", fontSize: '8.5px', whiteSpace: 'nowrap' }}>{totalAmount.toLocaleString('en-IN')} ₹</td>
                  </tr>
                )}

                {/* Top-level concession row (no subItems) */}
                {!transaction.subItems && transaction.concessionAmount ? (
                  <tr style={{ backgroundColor: 'rgba(255,251,235,0.75)' }}>
                    <td style={{ padding: '5px 7px', borderRight: '1px solid #e2e8f4' }} />
                    <td style={{ padding: '5px 7px', color: '#b45309', fontStyle: 'italic', fontWeight: 700, fontSize: '8px', borderRight: '1px solid #e2e8f4' }}>✦ Concession Applied</td>
                    <td style={{ borderRight: '1px solid #e2e8f4' }} />
                    <td style={{ padding: '5px 7px', textAlign: 'right', color: '#b45309', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", fontSize: '8.5px', whiteSpace: 'nowrap' }}>
                      −{(transaction.concessionAmount || 0).toLocaleString('en-IN')} ₹
                    </td>
                  </tr>
                ) : null}
              </tbody>

              {/* Total row */}
              <tfoot>
                <tr style={{ background: `linear-gradient(to right, ${gold}, ${gold2})` }}>
                  <td colSpan={3} style={{ padding: '6px 8px', color: navy, fontWeight: 800, fontFamily: "'Outfit', sans-serif", fontSize: '7.5px', letterSpacing: '2px', textTransform: 'uppercase' }}>
                    TOTAL PAID
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: navy, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', whiteSpace: 'nowrap' }}>
                    {totalAmount.toLocaleString('en-IN')} ₹
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* ── Amount in Words ── */}
            <div style={{
              backgroundColor: 'rgba(255,251,240,0.85)',
              padding: '5px 9px',
              borderRadius: '0 4px 4px 0',
              fontSize: '7.5px', color: '#334155',
              marginTop: '7px',
              border: '1px solid rgba(226,232,240,0.3)',
              borderLeft: `3px solid ${gold}`,
            }}>
              <strong>Amount in Words:</strong>&nbsp;<em>{amountInWords}</em>
            </div>

            {/* ── Remark (optional) ── */}
            {transaction.remark && (
              <div style={{
                backgroundColor: 'rgba(248,250,253,0.85)',
                padding: '5px 9px',
                borderRadius: '0 4px 4px 0',
                fontSize: '7.5px', color: '#475569', fontStyle: 'italic',
                marginTop: '5px',
                border: '1px solid rgba(226,232,240,0.3)',
                borderLeft: '3px solid #94a3b8',
              }}>
                <strong>Remark:</strong>&nbsp;<em>{transaction.remark}</em>
              </div>
            )}

            {/* ── Signature ── */}
            <div style={{
              display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end',
              marginTop: 'auto', paddingTop: '10px',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: '8px', fontWeight: 700, color: navy,
                  marginBottom: '16px', letterSpacing: '0.4px',
                }}>
                  {signerName}
                </div>
                <div style={{ width: '120px', borderTop: '1px solid #94a3b8', paddingTop: '4px' }}>
                  <div style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: '6.5px', color: '#94a3b8', fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.4px',
                  }}>
                    Authorised Signatory
                  </div>
                </div>
              </div>
            </div>

          </div>
          {/* end relative zIndex wrapper */}
        </div>
        {/* ══════════ END RIGHT PANEL ══════════ */}

      </div>
    </>
  );
};