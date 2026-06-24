import React from 'react';
import type { PaymentTransaction } from '../mockData';

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
  const crore = Math.floor(num / 10_000_000); num %= 10_000_000;
  const lakh = Math.floor(num / 100_000); num %= 100_000;
  const thousand = Math.floor(num / 1_000); num %= 1_000;

  if (crore) result += below1000(crore) + ' Crore ';
  if (lakh) result += below1000(lakh) + ' Lakh ';
  if (thousand) result += below1000(thousand) + ' Thousand ';
  if (num) result += below1000(num);

  return result.trim();
}

/* ─── Payment-mode config (Cash vs Online + any future types) ───── */
type PaymentMode = 'cash' | 'online' | 'cheque' | 'upi' | 'neft' | string;

interface ModeStyle {
  label: string;
  color: string;
  border: string;
  badgeBg: string;
}

function getModeStyle(method: PaymentMode): ModeStyle {
  const m = (method || '').toLowerCase();
  if (m === 'cash') return {
    label: 'Cash',
    color: '#166534', border: '#bbf7d0', badgeBg: '#dcfce7',
  };
  if (m === 'online' || m === 'upi') return {
    label: m === 'upi' ? 'UPI / Online' : 'Online',
    color: '#1d4ed8', border: '#bfdbfe', badgeBg: '#dbeafe',
  };
  if (m === 'cheque') return {
    label: 'Cheque',
    color: '#854d0e', border: '#fde68a', badgeBg: '#fef9c3',
  };
  if (m === 'neft' || m === 'rtgs' || m === 'imps') return {
    label: m.toUpperCase(),
    color: '#5b21b6', border: '#ddd6fe', badgeBg: '#ede9fe',
  };
  return {
    label: method ? method.charAt(0).toUpperCase() + method.slice(1) : 'N/A',
    color: '#334155', border: '#cbd5e1', badgeBg: '#f1f5f9',
  };
}

/* ─── Component ─────────────────────────────────────────────────── */
export const PrintReceipt: React.FC<PrintReceiptProps> = ({ transaction }) => {
  if (!transaction) return null;

  const totalAmount = Math.abs(transaction.amount);
  const amountInWords = `Rupees ${toIndianWords(totalAmount)} Only`;
  const mode = getModeStyle(transaction.method || '');

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

  const metaRows = [
    { label: 'Receipt No.', value: (transaction.id?.slice(-16).toUpperCase() || 'N/A'), mono: true },
    { label: 'Student Name', value: transaction.studentName },
    ...(transaction.studentCode ? [{ label: 'Student Code', value: transaction.studentCode, mono: true }] : []),
    ...(transaction.classInfo ? [{ label: 'Class', value: transaction.classInfo }] : []),
    { label: 'Period', value: period },
    {
      label: 'Payment Date',
      value: `${transaction.date || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })},  ${transaction.time || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`,
    },
    { label: 'Payment Mode', value: '__MODE_BADGE__' },   // sentinel → replaced by badge
  ];

  /* ── Inline styles (no Tailwind needed in print) ── */
  const S = {
    page: {
      width: '100%', maxWidth: '800px', margin: '0 auto',
      padding: '36px 44px 28px',
      backgroundColor: '#ffffff', color: '#1a1a2e',
      fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
      fontSize: '13px', lineHeight: 1.5,
    } as React.CSSProperties,

    headerRow: { display: 'flex', alignItems: 'flex-start', gap: '18px', marginBottom: '14px' } as React.CSSProperties,

    logoCircle: {
      width: '76px', height: '76px', borderRadius: '50%',
      border: '3px solid #1b3a6b', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    } as React.CSSProperties,

    schoolName: { fontSize: '28px', fontWeight: 800, color: '#1b3a6b', letterSpacing: '0.4px' } as React.CSSProperties,
    schoolMedium: { fontSize: '13px', fontWeight: 700, color: '#e8a020', marginTop: '1px' } as React.CSSProperties,
    schoolAddr: { fontSize: '12px', color: '#555', marginTop: '3px' } as React.CSSProperties,

    ruleGold: { height: '4px', backgroundColor: '#e8a020', marginBottom: '3px' } as React.CSSProperties,
    ruleNavy: { height: '2px', backgroundColor: '#1b3a6b', marginBottom: '22px' } as React.CSSProperties,

    titleBar: {
      backgroundColor: '#1b3a6b', color: '#fff',
      textAlign: 'center' as const, padding: '11px 0',
      fontSize: '16px', fontWeight: 700, letterSpacing: '2.5px',
      marginBottom: '24px',
    } as React.CSSProperties,

    metaTable: { width: '100%', borderCollapse: 'collapse' as const, marginBottom: '24px' } as React.CSSProperties,

    modeBadge: {
      display: 'inline-block',
      padding: '2px 10px', borderRadius: '20px',
      backgroundColor: mode.badgeBg, color: mode.color,
      border: `1.5px solid ${mode.border}`,
      fontWeight: 700, fontSize: '12px',
    } as React.CSSProperties,

    feeTable: { width: '100%', borderCollapse: 'collapse' as const, marginBottom: '6px' } as React.CSSProperties,

    thCell: (align: 'left' | 'right' = 'left'): React.CSSProperties => ({
      padding: '10px 14px', textAlign: align,
      fontSize: '13px', fontWeight: 700, color: '#fff',
      backgroundColor: '#1b3a6b',
    }),

    tdNum: { padding: '9px 14px', color: '#444', fontSize: '13px', width: '42px' } as React.CSSProperties,
    tdDesc: { padding: '9px 14px', color: '#333', fontSize: '13px' } as React.CSSProperties,
    tdAmt: { padding: '9px 14px', textAlign: 'right' as const, color: '#333', fontSize: '13px', fontWeight: 600 } as React.CSSProperties,

    totalRow: { backgroundColor: '#1b3a6b', color: '#fff' } as React.CSSProperties,
    totalLabel: { padding: '12px 14px', fontWeight: 800, fontSize: '14px', letterSpacing: '1px' } as React.CSSProperties,
    totalAmt: { padding: '12px 14px', textAlign: 'right' as const, fontWeight: 800, fontSize: '17px' } as React.CSSProperties,

    words: { marginBottom: '32px', fontSize: '12.5px', color: '#333', marginTop: '10px' } as React.CSSProperties,

    sigRow: { display: 'flex', justifyContent: 'space-between', marginTop: '4px' } as React.CSSProperties,
    sigBox: { textAlign: 'center' as const } as React.CSSProperties,
    sigLine: { width: '160px', borderTop: '1px solid #aaa', paddingTop: '5px', margin: '0 auto' } as React.CSSProperties,
    sigLabel: { fontSize: '11px', color: '#555', marginTop: '2px' } as React.CSSProperties,

    footer: {
      marginTop: '26px', borderLeft: '4px solid #e8a020',
      padding: '9px 14px', backgroundColor: '#fffaf0',
      fontSize: '11px', color: '#666', fontStyle: 'italic' as const,
    } as React.CSSProperties,
  };

  return (
    <div className="hidden print:block" style={S.page}>

      {/* ── HEADER ── */}
      <div style={S.headerRow}>
        <div style={S.logoCircle}>
          <span style={{ fontSize: '9px', fontWeight: 800, color: '#1b3a6b', textAlign: 'center', lineHeight: 1.3 }}>
            SUNRISE<br />SCHOOL
          </span>
        </div>
        <div>
          <div style={S.schoolName}>SUNRISE SCHOOL</div>
          <div style={S.schoolMedium}>English &amp; Gujarati Medium</div>
          <div style={S.schoolAddr}>Railnagar, Rajkot, Gujarat</div>
          <div style={S.schoolAddr}>Ph: +91 XXXXX XXXXX &nbsp;|&nbsp; Email: info@sunriseschool.in</div>
        </div>
      </div>

      {/* ── DIVIDER ── */}
      <div style={S.ruleGold} />
      <div style={S.ruleNavy} />

      {/* ── TITLE BAR ── */}
      <div style={S.titleBar}>PAYMENT RECEIPT</div>

      {/* ── META INFO TABLE ── */}
      <table style={S.metaTable}>
        <tbody>
          {metaRows.map((row, i) => (
            <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#f0f4fb' : '#ffffff' }}>
              <td style={{ padding: '8px 14px', fontWeight: 700, color: '#1b3a6b', width: '170px', fontSize: '13px', whiteSpace: 'nowrap' }}>
                {row.label}
              </td>
              <td style={{ padding: '8px 4px', fontWeight: 700, color: '#555', width: '14px' }}>:</td>
              <td style={{ padding: '8px 14px', color: '#333', fontSize: '13px', fontFamily: (row as any).mono ? 'monospace' : 'inherit' }}>
                {row.value === '__MODE_BADGE__' ? (
                  <span style={S.modeBadge}>{mode.label}</span>
                ) : row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── FEE TABLE ── */}
      <table style={S.feeTable}>
        <thead>
          <tr>
            <th style={S.thCell('left')}>#</th>
            <th style={S.thCell('left')}>Description</th>
            <th style={S.thCell('left')}>Mode</th>
            <th style={S.thCell('right')}>Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          {transaction.subItems && transaction.subItems.length > 0 ? (
            transaction.subItems.map((item, i) => {
              const itemMode = getModeStyle(item.method || transaction.method || '');
              return (
                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#f7f9fd' : '#ffffff', borderBottom: '1px solid #e4eaf4' }}>
                  <td style={S.tdNum}>{i + 1}</td>
                  <td style={S.tdDesc}>
                    {item.description}
                    {item.concessionAmount > 0 && (
                      <span style={{ color: '#e8a020', fontSize: '11px', marginLeft: '8px', fontWeight: 600 }}>
                        (−₹{item.concessionAmount.toLocaleString('en-IN')} concession)
                      </span>
                    )}
                  </td>
                  <td style={S.tdDesc}>
                    <span style={{
                      display: 'inline-block', padding: '1px 9px', borderRadius: '20px',
                      backgroundColor: itemMode.badgeBg, color: itemMode.color,
                      border: `1px solid ${itemMode.border}`,
                      fontWeight: 700, fontSize: '11px', whiteSpace: 'nowrap',
                    }}>
                      {itemMode.label}
                    </span>
                  </td>
                  <td style={S.tdAmt}>{Math.abs(item.amount).toLocaleString('en-IN')}</td>
                </tr>
              );
            })
          ) : (
            <tr style={{ backgroundColor: '#f7f9fd', borderBottom: '1px solid #e4eaf4' }}>
              <td style={S.tdNum}>1</td>
              <td style={S.tdDesc}>{transaction.feeType || 'Fee Collection'}</td>
              <td style={S.tdDesc}>
                <span style={{
                  display: 'inline-block', padding: '1px 9px', borderRadius: '20px',
                  backgroundColor: mode.badgeBg, color: mode.color,
                  border: `1px solid ${mode.border}`,
                  fontWeight: 700, fontSize: '11px',
                }}>
                  {mode.label}
                </span>
              </td>
              <td style={S.tdAmt}>{totalAmount.toLocaleString('en-IN')}</td>
            </tr>
          )}

          {/* Top-level concession row */}
          {!transaction.subItems && transaction.concessionAmount ? (
            <tr style={{ backgroundColor: '#fff8f0', borderBottom: '1px solid #e4eaf4' }}>
              <td style={S.tdNum}></td>
              <td style={{ ...S.tdDesc, color: '#e8a020', fontStyle: 'italic' }}>Concession Applied</td>
              <td style={S.tdDesc}></td>
              <td style={{ ...S.tdAmt, color: '#e8a020' }}>
                −{transaction.concessionAmount.toLocaleString('en-IN')}
              </td>
            </tr>
          ) : null}
        </tbody>

        <tfoot>
          <tr style={S.totalRow}>
            <td colSpan={3} style={S.totalLabel}>TOTAL PAID</td>
            <td style={S.totalAmt}>₹ {totalAmount.toLocaleString('en-IN')}</td>
          </tr>
        </tfoot>
      </table>

      {/* ── AMOUNT IN WORDS ── */}
      <div style={S.words}>
        <strong>Amount in Words:</strong>&nbsp;
        <em>{amountInWords}</em>
      </div>



      {/* ── SIGNATURES ── */}
      <div style={S.sigRow}>
        <div style={S.sigBox}>
          <p style={{ fontSize: '12px', color: '#555', marginBottom: '30px', margin: '0 0 30px 0' }}>Received by:</p>
          <div style={S.sigLine}>
            <p style={S.sigLabel}>Authorised Signatory</p>
          </div>
        </div>
        <div style={S.sigBox}>
          <p style={{ fontSize: '12px', color: '#555', marginBottom: '30px', margin: '0 0 30px 0' }}>School Stamp:</p>
          <div style={S.sigLine}>
            <p style={S.sigLabel}>Principal / Administrator</p>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={S.footer}>
        This is a computer-generated receipt and does not require a physical signature.<br />
        For queries, contact: Sunrise School, Railnagar, Rajkot, Gujarat.
      </div>

    </div>
  );
};