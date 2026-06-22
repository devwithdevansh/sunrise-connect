import React from 'react';
import type { PaymentTransaction } from '../mockData';

interface PrintReceiptProps {
  transaction: PaymentTransaction | null;
}

export const PrintReceipt: React.FC<PrintReceiptProps> = ({ transaction }) => {
  if (!transaction) return null;

  return (
    <div className="hidden print:block w-full max-w-3xl mx-auto p-8 bg-white text-black font-sans">
      {/* Header */}
      <div className="border-b-2 border-slate-800 pb-4 mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold uppercase tracking-tight text-slate-900">Sunrise Connect</h1>
          <p className="text-sm font-semibold text-slate-600 mt-1">School Fee Receipt</p>
          <p className="text-xs text-slate-500">123 Education Lane, Sunrise City, 12345</p>
          <p className="text-xs text-slate-500">Phone: +91 98765 43210 | Email: admin@sunrise.edu</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-slate-800">Receipt No: <span className="font-mono text-slate-600">{transaction.id?.slice(-8).toUpperCase() || 'N/A'}</span></p>
          <p className="text-xs font-bold text-slate-600 mt-1">Date: {transaction.date || new Date().toLocaleDateString()}</p>
          <p className="text-xs font-bold text-slate-600">Time: {transaction.time || new Date().toLocaleTimeString()}</p>
        </div>
      </div>

      {/* Student Info */}
      <div className="flex justify-between items-start mb-8 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Received From</p>
          <h2 className="text-xl font-bold text-slate-900">{transaction.studentName}</h2>
          <p className="text-sm font-semibold text-slate-700 mt-1">Class: {transaction.classInfo || 'N/A'}</p>
          <p className="text-sm font-semibold text-slate-700">Code: <span className="font-mono">{transaction.studentCode}</span></p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Payment Method</p>
          <p className="text-lg font-bold text-slate-800 uppercase">{transaction.method}</p>
        </div>
      </div>

      {/* Payment Details Table */}
      <table className="w-full text-left border-collapse mb-8">
        <thead>
          <tr className="border-b-2 border-slate-800">
            <th className="py-3 font-bold text-sm text-slate-800 uppercase">Description</th>
            <th className="py-3 font-bold text-sm text-slate-800 uppercase text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          <tr>
            <td className="py-4">
              <span className="font-bold text-slate-800 text-base">{transaction.feeType || 'Fee Collection'}</span>
            </td>
            <td className="py-4 text-right font-bold text-slate-800 text-base">
              ₹{Math.abs(transaction.amount).toLocaleString('en-IN')}
            </td>
          </tr>
          {transaction.concessionAmount ? (
            <tr>
              <td className="py-4">
                <span className="font-bold text-slate-600 text-sm">Concession Applied</span>
              </td>
              <td className="py-4 text-right font-bold text-slate-600 text-sm">
                - ₹{transaction.concessionAmount.toLocaleString('en-IN')}
              </td>
            </tr>
          ) : null}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-slate-800">
            <td className="py-4 text-right font-extrabold text-lg text-slate-900 uppercase pr-4">Total Paid</td>
            <td className="py-4 text-right font-extrabold text-2xl text-slate-900">
              ₹{Math.abs(transaction.amount).toLocaleString('en-IN')}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Footer / Signatures */}
      <div className="mt-16 flex justify-between items-end">
        <div className="text-center">
          <div className="w-40 border-t border-slate-400 mb-2"></div>
          <p className="text-xs font-bold text-slate-600">Parent/Guardian Signature</p>
        </div>
        <div className="text-center">
          <div className="w-40 border-t border-slate-400 mb-2"></div>
          <p className="text-xs font-bold text-slate-600">Authorized Signatory</p>
          <p className="text-[10px] text-slate-400 mt-1">Sunrise Connect System Generated</p>
        </div>
      </div>
    </div>
  );
};
