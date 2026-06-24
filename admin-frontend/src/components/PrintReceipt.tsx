import React from 'react';
import type { PaymentTransaction } from '../mockData';

// ─── helpers ────────────────────────────────────────────────────────────────

function toWords(amount: number): string {
  if (amount === 0) return 'Zero Rupees Only';

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
  ];

  function convert(n: number): string {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000)
      return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
    if (n < 100000)
      return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000)
      return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  }

  const rupees = Math.floor(Math.abs(amount));
  const paise = Math.round((Math.abs(amount) - rupees) * 100);

  let result = 'Rupees ' + convert(rupees);
  if (paise > 0) result += ' and ' + convert(paise) + ' Paise';
  result += ' Only';
  return result;
}

/**
 * Parses the payment method string into individual parts.
 * Supports: "Online", "Cash", "Cash + Online", "Cash + Cheque", etc.
 */
function parsePaymentMethods(method: string): string[] {
  return method
    .split(/\+|,|&/)
    .map((m) => m.trim())
    .filter(Boolean);
}

// ─── types ───────────────────────────────────────────────────────────────────

interface PrintReceiptProps {
  transaction: PaymentTransaction | null;
}

// ─── component ───────────────────────────────────────────────────────────────

export const PrintReceipt: React.FC<PrintReceiptProps> = ({ transaction }) => {
  if (!transaction) return null;

  const totalAmount = Math.abs(transaction.amount);
  const amountInWords = toWords(totalAmount);
  const paymentMethods = parsePaymentMethods(transaction.method ?? 'N/A');
  const isMixed = paymentMethods.length > 1;

  // Derive a period label from subItems if available, else fall back to feeType
  const periodLabel = (() => {
    if (transaction.subItems && transaction.subItems.length > 0) {
      const descriptions = transaction.subItems.map((i) => i.description);
      // e.g. ["December (Transport)", "January (Transport)"] → "December – January (2 Months)"
      if (descriptions.length === 1) return descriptions[0];
      const first = descriptions[0].replace(/\s*\(.*?\)\s*/g, '').trim();
      const last = descriptions[descriptions.length - 1].replace(/\s*\(.*?\)\s*/g, '').trim();
      return `${first} – ${last} (${descriptions.length} Months)`;
    }
    return transaction.feeType ?? '';
  })();

  // ── inline styles ── (all in one place so they're easy to tweak)
  const NAVY = '#1a3557';
  const AMBER = '#e8a020';
  const LIGHT_BLUE_BG = '#eaf2fb';
  const BORDER_COLOR = '#d0dce8';

  const styles: Record<string, React.CSSProperties> = {
    page: {
      display: 'none',
      fontFamily: "'Arial', 'Helvetica', sans-serif",
      fontSize: 13,
      color: '#1a1a1a',
      background: '#fff',
      padding: '32px 40px',
      maxWidth: 700,
      margin: '0 auto',
      boxSizing: 'border-box',
    },

    // ── header ──
    headerRow: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 16,
      paddingBottom: 12,
      borderBottom: `2px solid ${AMBER}`,
      marginBottom: 4,
    },
    logoBox: {
      width: 64,
      height: 64,
      flexShrink: 0,
    },
    schoolName: {
      fontSize: 22,
      fontWeight: 700,
      color: NAVY,
      margin: 0,
      lineHeight: 1.2,
    },
    schoolTagline: {
      fontSize: 12,
      fontWeight: 700,
      color: AMBER,
      margin: '2px 0 4px',
    },
    schoolMeta: {
      fontSize: 11,
      color: '#555',
      margin: 0,
      lineHeight: 1.6,
    },
    dividerStripe: {
      height: 3,
      background: `linear-gradient(to right, ${NAVY} 60%, ${AMBER} 100%)`,
      marginBottom: 20,
    },

    // ── receipt title banner ──
    titleBanner: {
      background: NAVY,
      color: '#fff',
      textAlign: 'center',
      padding: '10px 0',
      fontSize: 16,
      fontWeight: 700,
      letterSpacing: 1.5,
      textTransform: 'uppercase' as const,
      marginBottom: 20,
      borderRadius: 2,
    },

    // ── info grid ──
    infoTable: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      marginBottom: 20,
    },
    infoRow: {
      background: LIGHT_BLUE_BG,
    },
    infoRowAlt: {
      background: '#fff',
    },
    infoLabel: {
      fontWeight: 700,
      color: NAVY,
      fontSize: 12,
      padding: '7px 12px',
      width: '30%',
      border: `1px solid ${BORDER_COLOR}`,
    },
    infoColon: {
      fontWeight: 700,
      color: NAVY,
      fontSize: 12,
      padding: '7px 4px',
      width: 12,
      border: `1px solid ${BORDER_COLOR}`,
      textAlign: 'center' as const,
    },
    infoValue: {
      fontSize: 12,
      padding: '7px 12px',
      border: `1px solid ${BORDER_COLOR}`,
      color: '#333',
    },

    // ── payment method badges ──
    methodBadgeRow: {
      display: 'flex',
      gap: 6,
      flexWrap: 'wrap' as const,
    },
    methodBadge: {
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 3,
      fontSize: 11,
      fontWeight: 700,
      background: NAVY,
      color: '#fff',
      textTransform: 'uppercase' as const,
    },
    methodBadgeMixed: {
      background: AMBER,
      color: NAVY,
    },

    // ── fee table ──
    feeTable: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      marginBottom: 12,
    },
    feeTheadTh: {
      background: NAVY,
      color: '#fff',
      fontSize: 12,
      fontWeight: 700,
      padding: '8px 12px',
      border: `1px solid ${NAVY}`,
    },
    feeTbodyTd: {
      padding: '7px 12px',
      fontSize: 12,
      border: `1px solid ${BORDER_COLOR}`,
      color: '#333',
    },
    feeTbodyTdAlt: {
      background: LIGHT_BLUE_BG,
    },
    concessionTd: {
      fontSize: 11,
      color: '#888',
      fontStyle: 'italic' as const,
    },
    totalRow: {
      background: NAVY,
    },
    totalLabelTd: {
      padding: '10px 12px',
      fontWeight: 700,
      fontSize: 13,
      color: '#fff',
      border: `1px solid ${NAVY}`,
      textAlign: 'right' as const,
    },
    totalAmountTd: {
      padding: '10px 12px',
      fontWeight: 700,
      fontSize: 15,
      color: '#fff',
      border: `1px solid ${NAVY}`,
      textAlign: 'right' as const,
      whiteSpace: 'nowrap' as const,
    },

    // ── amount in words ──
    amountWords: {
      fontSize: 12,
      marginBottom: 24,
      color: '#333',
    },
    amountWordsBold: {
      fontWeight: 700,
      color: NAVY,
    },

    // ── signature section ──
    signatureRow: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: 20,
      marginTop: 32,
    },
    signatureBlock: {
      width: '44%',
    },
    signatureLine: {
      borderTop: '1px solid #aaa',
      marginBottom: 6,
    },
    signatureLabel: {
      fontSize: 11,
      color: '#555',
      fontWeight: 700,
    },
    signatureSub: {
      fontSize: 10,
      color: '#999',
      marginTop: 2,
    },

    // ── footer note ──
    footerNote: {
      borderLeft: `3px solid ${AMBER}`,
      background: '#fffbf2',
      padding: '8px 12px',
      fontSize: 10,
      color: '#666',
      fontStyle: 'italic' as const,
      lineHeight: 1.6,
    },
  };

  return (
    <div
      className="hidden print:block"
      style={styles.page}
    >
      {/* ── School Header ── */}
      <div style={styles.headerRow}>
        <div style={styles.logoBox}>
          <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" width={64} height={64}>
            <circle cx="32" cy="32" r="30" fill={NAVY} />
            <text x="32" y="38" textAnchor="middle" fill={AMBER} fontSize="22" fontWeight="bold" fontFamily="Arial">S</text>
          </svg>
        </div>
        <div>
          <p style={styles.schoolName}>SUNRISE SCHOOL</p>
          <p style={styles.schoolTagline}>English &amp; Gujarati Medium</p>
          <p style={styles.schoolMeta}>
            Railnagar, Rajkot, Gujarat<br />
            Ph: +91 XXXXX XXXXX &nbsp;|&nbsp; Email: info@sunriseschool.in
          </p>
        </div>
      </div>

      <div style={styles.dividerStripe} />

      <div style={styles.titleBanner}>Payment Receipt</div>

      <table style={styles.infoTable}>
        <tbody>
          {[
            { label: 'Receipt No.', value: transaction.id?.slice(-16).toUpperCase() ?? 'N/A', alt: false },
            { label: 'Student Name', value: transaction.studentName, alt: true },
            ...(transaction.classInfo
              ? [{ label: 'Class / Code', value: `${transaction.classInfo}  |  ${transaction.studentCode}`, alt: false }]
              : [{ label: 'Student Code', value: transaction.studentCode, alt: false }]),
            ...(periodLabel ? [{ label: 'Period', value: periodLabel, alt: true }] : []),
            {
              label: 'Payment Date',
              value: `${transaction.date ?? new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}, ${transaction.time ?? new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`,
              alt: !periodLabel,
            },
            { label: 'Payment Mode', value: '__METHOD__', alt: !!periodLabel },
          ].map((row, i) => (
            <tr key={i} style={row.alt ? styles.infoRow : styles.infoRowAlt}>
              <td style={styles.infoLabel}>{row.label}</td>
              <td style={styles.infoColon}>:</td>
              <td style={styles.infoValue}>
                {row.value === '__METHOD__' ? (
                  isMixed ? (
                    <div style={styles.methodBadgeRow}>
                      {paymentMethods.map((m, idx) => (
                        <span
                          key={idx}
                          style={{ ...styles.methodBadge, ...(idx > 0 ? styles.methodBadgeMixed : {}) }}
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={styles.methodBadge}>{paymentMethods[0]}</span>
                  )
                ) : (
                  row.value
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <table style={styles.feeTable}>
        <thead>
          <tr>
            <th style={{ ...styles.feeTheadTh, width: 36, textAlign: 'center' }}>#</th>
            <th style={{ ...styles.feeTheadTh, textAlign: 'left' }}>Description</th>
            <th style={{ ...styles.feeTheadTh, textAlign: 'right', width: 140, whiteSpace: 'nowrap' }}>
              Amount (₹)
            </th>
          </tr>
        </thead>
        <tbody>
          {transaction.subItems && transaction.subItems.length > 0 ? (
            transaction.subItems.map((item, i) => (
              <tr key={i}>
                <td style={{ ...styles.feeTbodyTd, textAlign: 'center', ...(i % 2 === 1 ? styles.feeTbodyTdAlt : {}) }}>
                  {i + 1}
                </td>
                <td style={{ ...styles.feeTbodyTd, ...(i % 2 === 1 ? styles.feeTbodyTdAlt : {}) }}>
                  {item.description}
                  {item.concessionAmount > 0 && (
                    <span style={styles.concessionTd}>
                      {' '}(- ₹{item.concessionAmount.toLocaleString('en-IN')} concession)
                    </span>
                  )}
                </td>
                <td style={{ ...styles.feeTbodyTd, textAlign: 'right', ...(i % 2 === 1 ? styles.feeTbodyTdAlt : {}) }}>
                  {Math.abs(item.amount).toLocaleString('en-IN')}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td style={{ ...styles.feeTbodyTd, textAlign: 'center' }}>1</td>
              <td style={styles.feeTbodyTd}>
                {transaction.feeType ?? 'Fee Collection'}
                {transaction.concessionAmount && transaction.concessionAmount > 0 ? (
                  <span style={styles.concessionTd}>
                    {' '}(- ₹{transaction.concessionAmount.toLocaleString('en-IN')} concession)
                  </span>
                ) : null}
              </td>
              <td style={{ ...styles.feeTbodyTd, textAlign: 'right' }}>
                {totalAmount.toLocaleString('en-IN')}
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr style={styles.totalRow}>
            <td colSpan={2} style={styles.totalLabelTd}>Total Paid</td>
            <td style={styles.totalAmountTd}>₹ {totalAmount.toLocaleString('en-IN')}</td>
          </tr>
        </tfoot>
      </table>

      <p style={styles.amountWords}>
        <span style={styles.amountWordsBold}>Amount in Words: </span>
        <em>{amountInWords}</em>
      </p>

      {isMixed && transaction.paymentBreakdown && (
        <table style={{ ...styles.feeTable, marginTop: -8, marginBottom: 16 }}>
          <thead>
            <tr>
              <th
                colSpan={2}
                style={{ ...styles.feeTheadTh, background: AMBER, color: NAVY, textAlign: 'left' }}
              >
                Payment Breakdown
              </th>
            </tr>
          </thead>
          <tbody>
            {transaction.paymentBreakdown.map((pb, i) => (
              <tr key={i}>
                <td style={{ ...styles.feeTbodyTd, ...(i % 2 === 1 ? styles.feeTbodyTdAlt : {}) }}>
                  <span style={{ ...styles.methodBadge, fontSize: 10, padding: '1px 8px' }}>{pb.method}</span>
                </td>
                <td style={{ ...styles.feeTbodyTd, textAlign: 'right', ...(i % 2 === 1 ? styles.feeTbodyTdAlt : {}) }}>
                  ₹ {Math.abs(pb.amount).toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={styles.signatureRow}>
        <div style={styles.signatureBlock}>
          <p style={{ fontSize: 11, color: '#555', marginBottom: 32 }}>Received by:</p>
          <div style={styles.signatureLine} />
          <p style={styles.signatureLabel}>Authorised Signatory</p>
        </div>
        <div style={{ ...styles.signatureBlock, textAlign: 'right' }}>
          <p style={{ fontSize: 11, color: '#555', marginBottom: 32 }}>School Stamp:</p>
          <div style={styles.signatureLine} />
          <p style={styles.signatureLabel}>Principal / Administrator</p>
        </div>
      </div>

      <div style={styles.footerNote}>
        This is a computer-generated receipt and does not require a physical signature.<br />
        For queries, contact: Sunrise School, Railnagar, Rajkot, Gujarat.
      </div>
    </div>
  );
};