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

  if (crore) result += below1000(crore) + ' Crore ';
  if (lakh) result += below1000(lakh) + ' Lakh ';
  if (thousand) result += below1000(thousand) + ' Thousand ';
  if (n) result += below1000(n);

  return result.trim();
}

/* ─── Payment-mode label ─────────────────────────────────────────── */
type PaymentMode = 'cash' | 'online' | 'cheque' | 'upi' | 'neft' | string;

function getModeLabel(method: PaymentMode): string {
  const m = (method || '').toLowerCase();
  if (m === 'cash') return 'Cash';
  if (m === 'upi') return 'UPI / Online';
  if (m === 'online') return 'Online';
  if (m === 'cheque') return 'Cheque';
  if (m === 'neft' || m === 'rtgs' || m === 'imps') return m.toUpperCase();
  return method ? method.charAt(0).toUpperCase() + method.slice(1) : 'N/A';
}

/* ─── Component ─────────────────────────────────────────────────── */
export const PrintReceipt: React.FC<PrintReceiptProps> = ({ transaction }) => {
  const { currentUser } = useApp();

  if (!transaction) return null;

  const totalAmount = Math.abs(transaction.amount);
  const amountInWords = `${toIndianWords(totalAmount)} Rupees Only`;
  const modeLabel = getModeLabel(transaction.method || '');

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

  /* ── Print-only page style injected once ── */
  const printPageStyle = `
    @media print {
      @page {
        size: A4;
        margin: 0;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  `;

  /* ── Inline styles ── */
  const S = {
    page: {
      width: '210mm',
      minHeight: '297mm',
      maxHeight: '297mm',
      margin: '0 auto',
      padding: '80px 36px 20px',
      backgroundColor: '#ffffff',
      color: '#1a1a2e',
      fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
      fontSize: '12px',
      lineHeight: 1.45,
      boxSizing: 'border-box' as const,
      overflow: 'hidden',
      position: 'relative' as const,
    } as React.CSSProperties,

    /* Header */
    headerRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '18px',
      marginBottom: '10px',
    } as React.CSSProperties,

    logoCircle: {
      width: '210px',
      // height: '210px',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    } as React.CSSProperties,

    schoolName: {
      fontSize: '26px',
      fontWeight: 800,
      color: '#1b3a6b',
      letterSpacing: '0.5px',
      lineHeight: 1.1,
    } as React.CSSProperties,

    schoolMedium: {
      fontSize: '12.5px',
      fontWeight: 700,
      color: '#d08c16ff',
      marginTop: '2px',
    } as React.CSSProperties,

    schoolAddr: {
      fontSize: '11.5px',
      color: '#555',
      marginTop: '2px',
    } as React.CSSProperties,

    /* Dividers */
    ruleGold: {
      height: '4px',
      backgroundColor: '#e8a020',
      marginBottom: '3px',
    } as React.CSSProperties,

    ruleNavy: {
      height: '2px',
      backgroundColor: '#1b3a6b',
      marginBottom: '16px',
    } as React.CSSProperties,

    /* Title bar */
    titleBar: {
      backgroundColor: '#1b3a6b',
      color: '#fff',
      textAlign: 'center' as const,
      padding: '10px 0',
      fontSize: '16px',
      fontWeight: 700,
      letterSpacing: '3px',
      marginBottom: '18px',
    } as React.CSSProperties,

    /* Meta table */
    metaTable: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      marginBottom: '18px',
    } as React.CSSProperties,

    metaTdLabel: {
      padding: '7px 12px',
      fontWeight: 700,
      color: '#1b3a6b',
      width: '160px',
      fontSize: '12px',
      whiteSpace: 'nowrap' as const,
    } as React.CSSProperties,

    metaTdColon: {
      padding: '7px 4px',
      fontWeight: 700,
      color: '#555',
      width: '12px',
    } as React.CSSProperties,

    metaTdValue: {
      padding: '7px 12px',
      color: '#333',
      fontSize: '12px',
      fontWeight: 600,
    } as React.CSSProperties,

    /* Payment details section header */
    sectionHeader: {
      color: '#1b3a6b',
      fontWeight: 800,
      fontSize: '12.5px',
      letterSpacing: '0.5px',
      marginBottom: '6px',
      borderBottom: '2px solid #1b3a6b',
      paddingBottom: '4px',
    } as React.CSSProperties,

    /* Fee table */
    feeTable: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      marginBottom: '6px',
    } as React.CSSProperties,

    thLeft: {
      padding: '9px 12px',
      textAlign: 'left' as const,
      fontSize: '12px',
      fontWeight: 700,
      color: '#fff',
      backgroundColor: '#516f9eff',
    } as React.CSSProperties,

    thRight: {
      padding: '9px 12px',
      textAlign: 'right' as const,
      fontSize: '12px',
      fontWeight: 700,
      color: '#fff',
      backgroundColor: '#516f9eff',
    } as React.CSSProperties,

    tdNum: {
      padding: '8px 12px',
      color: '#444',
      fontSize: '12px',
      width: '36px',
    } as React.CSSProperties,

    tdDesc: {
      padding: '8px 12px',
      color: '#333',
      fontSize: '12px',
    } as React.CSSProperties,

    tdAmt: {
      padding: '8px 12px',
      textAlign: 'right' as const,
      color: '#333',
      fontSize: '12px',
      fontWeight: 600,
    } as React.CSSProperties,

    totalRow: {
      backgroundColor: '#1b3a6b',
      color: '#fff',
    } as React.CSSProperties,

    totalLabel: {
      padding: '10px 12px',
      fontWeight: 800,
      fontSize: '13px',
      letterSpacing: '1px',
      color: '#fff',
    } as React.CSSProperties,

    totalAmt: {
      padding: '10px 12px',
      textAlign: 'right' as const,
      fontWeight: 800,
      fontSize: '15px',
      color: '#fff',
    } as React.CSSProperties,

    /* Amount in words */
    words: {
      margin: '10px 0 20px',
      fontSize: '12px',
      color: '#333',
    } as React.CSSProperties,

    /* Signatures */
    sigRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginTop: '6px',
      marginBottom: '18px',
    } as React.CSSProperties,

    sigLeft: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '0',
    } as React.CSSProperties,

    sigReceivedBy: {
      fontSize: '11px',
      color: '#555',
      marginBottom: '28px',
    } as React.CSSProperties,

    sigLine: {
      width: '170px',
      borderTop: '1.5px solid #888',
      paddingTop: '4px',
    } as React.CSSProperties,

    sigLineLabel: {
      fontSize: '11px',
      color: '#444',
      fontWeight: 600,
      marginTop: '2px',
    } as React.CSSProperties,

    stampBox: {
      width: '160px',
      height: '70px',
      border: '1.5px solid #bbb',
      borderRadius: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    } as React.CSSProperties,

    stampLabel: {
      fontSize: '11px',
      color: '#aaa',
      fontStyle: 'italic' as const,
    } as React.CSSProperties,

    stampTitle: {
      fontSize: '11px',
      color: '#555',
      marginBottom: '6px',
    } as React.CSSProperties,

    /* Footer */
    footer: {
      borderLeft: '4px solid #e8a020',
      padding: '8px 12px',
      backgroundColor: '#fffaf0',
      fontSize: '10.5px',
      color: '#666',
      fontStyle: 'italic' as const,
    } as React.CSSProperties,
  };

  return (
    <>
      {/* Inject print page styles */}
      <style dangerouslySetInnerHTML={{ __html: printPageStyle }} />

      <div className="hidden print:block" style={S.page}>

        {/* ── WATERMARK ── */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: 0.14,
          pointerEvents: 'none',
          zIndex: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <img src={watermarkLogoPath} alt="Watermark" style={{ width: '450px', height: 'auto', objectFit: 'contain' }} />
        </div>

        {/* ── HEADER ── */}
        <div style={S.headerRow}>
          {/* Logo */}
          <div style={S.logoCircle}>
            <img src={logoPath} alt="Sunrise School Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>

          <div>
            {/* <div style={S.schoolName}>SUNRISE SCHOOL</div> */}
            <div style={S.schoolMedium}>English &amp; Gujarati Medium</div>
            <div style={S.schoolAddr}>Railnagar, Rajkot, Gujarat</div>
            <div style={S.schoolAddr}>Ph: +91 XXXXX XXXXX &nbsp;|&nbsp; Email: info@sunriseschool.in</div>
          </div>
        </div>

        {/* ── DIVIDERS ── */}
        <div style={S.ruleGold} />
        <div style={S.ruleNavy} />

        {/* ── TITLE BAR ── */}
        <div style={S.titleBar}>PAYMENT RECEIPT</div>

        {/* ── META INFO TABLE ── */}
        <table style={S.metaTable}>
          <tbody>
            {metaRows.map((row, i) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'transparent' }}>
                <td style={S.metaTdLabel}>{row.label}</td>
                <td style={S.metaTdColon}>:</td>
                <td style={S.metaTdValue}>{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── PAYMENT DETAILS SECTION HEADER ── */}
        <div style={S.sectionHeader}>PAYMENT DETAILS</div>

        {/* ── FEE TABLE ── */}
        <table style={S.feeTable}>
          <thead>
            <tr>
              <th style={{ ...S.thLeft, width: '36px' }}>#</th>
              <th style={S.thLeft}>Description</th>
              <th style={S.thLeft}>Mode</th>
              <th style={S.thRight}>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {transaction.subItems && transaction.subItems.length > 0 ? (
              transaction.subItems.map((item, i) => (
                <tr
                  key={i}
                  style={{
                    backgroundColor: i % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'transparent',
                    borderBottom: '1px solid #e4eaf4',
                  }}
                >
                  <td style={S.tdNum}>{i + 1}</td>
                  <td style={S.tdDesc}>
                    {item.description}
                    {item.concessionAmount > 0 && (
                      <span style={{ color: '#e8a020', fontSize: '10.5px', marginLeft: '8px', fontWeight: 600 }}>
                        (−₹{item.concessionAmount.toLocaleString('en-IN')} concession)
                      </span>
                    )}
                  </td>
                  <td style={S.tdDesc}>{getModeLabel(item.method || transaction.method || '')}</td>
                  <td style={S.tdAmt}>{Math.abs(item.amount).toLocaleString('en-IN')}</td>
                </tr>
              ))
            ) : (
              <tr style={{ backgroundColor: 'rgba(0,0,0,0.02)', borderBottom: '1px solid #e4eaf4' }}>
                <td style={S.tdNum}>1</td>
                <td style={S.tdDesc}>{transaction.feeType || 'Fee Collection'}</td>
                <td style={S.tdDesc}>{getModeLabel(transaction.method || '')}</td>
                <td style={S.tdAmt}>{totalAmount.toLocaleString('en-IN')}</td>
              </tr>
            )}

            {/* Top-level concession row */}
            {!transaction.subItems && transaction.concessionAmount ? (
              <tr style={{ backgroundColor: 'rgba(232, 160, 32, 0.05)', borderBottom: '1px solid #e4eaf4' }}>
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

        {transaction.remark && (
          <div style={{ ...S.words, marginTop: '-10px' }}>
            <strong>Remark:</strong>&nbsp;
            <em>{transaction.remark}</em>
          </div>
        )}

        {/* ── SIGNATURES ── */}
        <div style={{ ...S.sigRow, justifyContent: 'flex-end' }}>
          {/* Right: Received by + signature line */}
          <div style={{ ...S.sigLeft, alignItems: 'center' }}>
            {/* <div style={{ ...S.sigReceivedBy, marginBottom: '40px' }}>Received by:</div> */}

            <div style={{ ...S.sigLineLabel, textAlign: 'center' as const }}>
              {currentUser?.name ? currentUser.name.toUpperCase() : 'AUTHORISED SIGNATORY'}
            </div>
            <div style={S.sigLine}>
              {currentUser?.name && (
                <div style={{ textAlign: 'center', fontSize: '9.5px', color: '#666', marginTop: '2px' }}>
                  Authorised Signatory
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div style={S.footer}>
          This is a computer-generated receipt and does not require a physical signature.<br />
          For queries, contact: Sunrise Convent School, Railnagar, Rajkot, Gujarat.
        </div>

      </div>
    </>
  );
};