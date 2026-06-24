import React from 'react';
import type { PaymentTransaction } from '../mockData';

interface PrintReceiptProps {
  transaction: PaymentTransaction | null;
}

// Converts a number to Indian English words
function toIndianWords(num: number): string {
  if (num === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertBelow100(n: number): string {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  }

  function convertBelow1000(n: number): string {
    if (n < 100) return convertBelow100(n);
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertBelow100(n % 100) : '');
  }

  let result = '';
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const rest = num;

  if (crore) result += convertBelow1000(crore) + ' Crore ';
  if (lakh) result += convertBelow1000(lakh) + ' Lakh ';
  if (thousand) result += convertBelow1000(thousand) + ' Thousand ';
  if (rest) result += convertBelow1000(rest);

  return result.trim();
}

export const PrintReceipt: React.FC<PrintReceiptProps> = ({ transaction }) => {
  if (!transaction) return null;

  const totalAmount = Math.abs(transaction.amount);
  const amountInWords = `Rupees ${toIndianWords(totalAmount)} Only`;

  return (
    <div
      className="hidden print:block"
      style={{
        width: '100%',
        maxWidth: '780px',
        margin: '0 auto',
        padding: '32px 40px',
        backgroundColor: '#ffffff',
        color: '#1a1a2e',
        fontFamily: "'Segoe UI', Arial, sans-serif",
        fontSize: '13px',
      }}
    >
      {/* ── HEADER: Logo + School Info ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '12px', gap: '20px' }}>
        {/* Logo placeholder circle */}
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            border: '3px solid #1b3a6b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          {/* If you have a logo image, replace this with <img src="..." /> */}
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#1b3a6b', textAlign: 'center', lineHeight: 1.2 }}>
            SUNRISE<br />SCHOOL
          </span>
        </div>

        <div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#1b3a6b', letterSpacing: '0.5px' }}>
            SUNRISE SCHOOL
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#e8a020', marginTop: '1px' }}>
            English &amp; Gujarati Medium
          </div>
          <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>
            Railnagar, Rajkot, Gujarat
          </div>
          <div style={{ fontSize: '12px', color: '#555' }}>
            Ph: +91 XXXXX XXXXX &nbsp;|&nbsp; Email: info@sunriseschool.in
          </div>
        </div>
      </div>

      {/* Horizontal gold + navy double rule */}
      <div style={{ height: '4px', backgroundColor: '#e8a020', marginBottom: '3px' }} />
      <div style={{ height: '2px', backgroundColor: '#1b3a6b', marginBottom: '20px' }} />

      {/* ── PAYMENT RECEIPT TITLE BAR ── */}
      <div
        style={{
          backgroundColor: '#1b3a6b',
          color: '#ffffff',
          textAlign: 'center',
          padding: '10px 0',
          fontSize: '16px',
          fontWeight: 700,
          letterSpacing: '2px',
          textTransform: 'uppercase',
          marginBottom: '24px',
        }}
      >
        PAYMENT RECEIPT
      </div>

      {/* ── META INFO TABLE ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
        <tbody>
          {[
            { label: 'Receipt No.', value: (transaction.id?.slice(-16).toUpperCase() || 'N/A') },
            { label: 'Student Name', value: transaction.studentName },
            {
              label: 'Period',
              value: transaction.subItems && transaction.subItems.length > 0
                ? (() => {
                  const months = transaction.subItems.map(i => i.description.split(' ')[0]);
                  return months.length > 1
                    ? `${months[0]} – ${months[months.length - 1]} (${months.length} Months)`
                    : months[0];
                })()
                : (transaction.feeType || 'N/A'),
            },
            {
              label: 'Payment Date',
              value: `${transaction.date || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}, ${transaction.time || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`,
            },
            { label: 'Payment Mode', value: transaction.method?.charAt(0).toUpperCase() + transaction.method?.slice(1) || 'N/A' },
            ...(transaction.classInfo ? [{ label: 'Class', value: transaction.classInfo }] : []),
            ...(transaction.studentCode ? [{ label: 'Student Code', value: transaction.studentCode }] : []),
          ].map((row, i) => (
            <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#f0f4fb' : '#ffffff' }}>
              <td
                style={{
                  padding: '8px 14px',
                  fontWeight: 700,
                  color: '#1b3a6b',
                  width: '180px',
                  fontSize: '13px',
                }}
              >
                {row.label}
              </td>
              <td style={{ padding: '8px 4px', color: '#333', fontWeight: 600, fontSize: '13px' }}>
                :
              </td>
              <td style={{ padding: '8px 14px', color: '#333', fontSize: '13px' }}>
                {row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── FEE DETAILS TABLE ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px' }}>
        <thead>
          <tr style={{ backgroundColor: '#1b3a6b', color: '#ffffff' }}>
            <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '13px', fontWeight: 700, width: '50px' }}>#</th>
            <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '13px', fontWeight: 700 }}>Description</th>
            <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '13px', fontWeight: 700 }}>Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          {transaction.subItems && transaction.subItems.length > 0 ? (
            transaction.subItems.map((item, i) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#f9f9f9' : '#ffffff', borderBottom: '1px solid #e0e6f0' }}>
                <td style={{ padding: '9px 14px', color: '#444', fontSize: '13px' }}>{i + 1}</td>
                <td style={{ padding: '9px 14px', color: '#444', fontSize: '13px' }}>
                  {item.description}
                  {item.concessionAmount > 0 && (
                    <span style={{ color: '#888', fontSize: '11px', marginLeft: '8px' }}>
                      (- ₹{item.concessionAmount.toLocaleString('en-IN')} concession)
                    </span>
                  )}
                </td>
                <td style={{ padding: '9px 14px', textAlign: 'right', color: '#444', fontSize: '13px' }}>
                  {Math.abs(item.amount).toLocaleString('en-IN')}
                </td>
              </tr>
            ))
          ) : (
            <tr style={{ backgroundColor: '#f9f9f9', borderBottom: '1px solid #e0e6f0' }}>
              <td style={{ padding: '9px 14px', color: '#444', fontSize: '13px' }}>1</td>
              <td style={{ padding: '9px 14px', color: '#444', fontSize: '13px' }}>
                {transaction.feeType || 'Fee Collection'}
              </td>
              <td style={{ padding: '9px 14px', textAlign: 'right', color: '#444', fontSize: '13px' }}>
                {totalAmount.toLocaleString('en-IN')}
              </td>
            </tr>
          )}
          {/* Concession row (top-level, when no sub-items) */}
          {!transaction.subItems && transaction.concessionAmount ? (
            <tr style={{ backgroundColor: '#fff8f0', borderBottom: '1px solid #e0e6f0' }}>
              <td style={{ padding: '9px 14px', color: '#888', fontSize: '13px' }}></td>
              <td style={{ padding: '9px 14px', color: '#888', fontSize: '13px', fontStyle: 'italic' }}>
                Concession Applied
              </td>
              <td style={{ padding: '9px 14px', textAlign: 'right', color: '#888', fontSize: '13px' }}>
                - {transaction.concessionAmount.toLocaleString('en-IN')}
              </td>
            </tr>
          ) : null}
        </tbody>
        <tfoot>
          <tr style={{ backgroundColor: '#1b3a6b', color: '#ffffff' }}>
            <td colSpan={2} style={{ padding: '11px 14px', fontWeight: 800, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              TOTAL PAID
            </td>
            <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 800, fontSize: '16px' }}>
              ₹ {totalAmount.toLocaleString('en-IN')}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* ── AMOUNT IN WORDS ── */}
      <div style={{ marginBottom: '36px', fontSize: '12px', color: '#333' }}>
        <strong>Amount in Words:</strong>{' '}
        <em>{amountInWords}</em>
      </div>

      {/* ── SIGNATURES ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
        <div>
          <p style={{ fontSize: '12px', color: '#555', marginBottom: '28px' }}>Received by:</p>
          <div style={{ width: '160px', borderTop: '1px solid #999', paddingTop: '4px' }}>
            <p style={{ fontSize: '11px', color: '#555' }}>Authorised Signatory</p>
          </div>
        </div>
        <div>
          <p style={{ fontSize: '12px', color: '#555', marginBottom: '28px' }}>School Stamp:</p>
          <div style={{ width: '160px', borderTop: '1px solid #999', paddingTop: '4px' }}>
            <p style={{ fontSize: '11px', color: '#555' }}>Principal / Administrator</p>
          </div>
        </div>
      </div>

      {/* ── FOOTER NOTE ── */}
      <div
        style={{
          marginTop: '28px',
          borderLeft: '4px solid #e8a020',
          padding: '10px 14px',
          backgroundColor: '#fffaf0',
          fontSize: '11px',
          color: '#666',
          fontStyle: 'italic',
        }}
      >
        This is a computer-generated receipt and does not require a physical signature.<br />
        For queries, contact: Sunrise School, Railnagar, Rajkot, Gujarat.
      </div>
    </div>
  );
};