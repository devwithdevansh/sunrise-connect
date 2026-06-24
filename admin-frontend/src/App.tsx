import React, { useState, useEffect } from 'react';
import { useApp } from './store';
import type { PaymentTransaction } from './mockData';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { CollectFee } from './components/CollectFee';
import { UnpaidFees } from './components/UnpaidFees';
import { Students } from './components/Students';
import { FeeStructure } from './components/FeeStructure';
import { Setup } from './components/Setup';
import { Login } from './components/Login';
import { PromoteStudents } from './components/PromoteStudents';
import { StaffManagement } from './components/StaffManagement';
import { AuditLogs } from './components/AuditLogs';
import { ImportExcel } from './components/ImportExcel';
import {
  MessageSquare,
  Bell,
  Sun,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from 'lucide-react';
import { PrintReceipt } from './components/PrintReceipt';

const ScreenContent: React.FC<{ onPrint: (tx: PaymentTransaction) => void }> = ({ onPrint }) => {
  const { currentScreen, transactions, reversePayment } = useApp();
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

  switch (currentScreen) {
    case 'dashboard':
      return <Dashboard />;
    case 'collect-fee':
      return <CollectFee />;
    case 'unpaid-fees':
      return <UnpaidFees />;
    case 'fee-structure':
      return <FeeStructure />;
    case 'setup':
      return <Setup />;
    case 'students':
      return <Students />;
    case 'promote-students':
      return <PromoteStudents />;
    case 'import-excel':
      return <ImportExcel />;
    case 'staff-management':
      return <StaffManagement />;

    // Fallback views with high-fidelity polish
    case 'whatsapp':
      return (
        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4">
          <div className="bg-emerald-100 text-emerald-600 p-4 rounded-2xl border border-emerald-200">
            <MessageSquare className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">WhatsApp Messaging Engine</h3>
          <p className="text-sm text-slate-500 max-w-sm">
            Automated alerts, receipts distribution, and due reminders are successfully queued. Integration active with WhatsApp Business API API Gateway.
          </p>
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs font-semibold text-slate-500 max-w-md w-full">
            <div className="flex justify-between border-b border-slate-200/50 pb-2 mb-2">
              <span>API Connection Status:</span>
              <span className="text-emerald-600 font-bold">ACTIVE</span>
            </div>
            <div className="flex justify-between">
              <span>Messages Sent Today:</span>
              <strong className="text-slate-800">142 Messages</strong>
            </div>
          </div>
        </div>
      );

    case 'notifications':
      return (
        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4">
          <div className="bg-blue-100 text-blue-600 p-4 rounded-2xl border border-blue-200">
            <Bell className="h-8 w-8 animate-bounce" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">System Notifications</h3>
          <p className="text-sm text-slate-500 max-w-sm">
            Check logs and alerts for automated fee invoices, unpaid ledgers generated monthly, and staff collection shift logs.
          </p>
        </div>
      );

    case 'parent-app':
      return (
        <div className="flex-1 p-6 flex items-center justify-center bg-slate-50">
          <div className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-2xl max-w-sm w-full border-t-8 border-t-slate-800 border-b-8 border-b-slate-800 relative">
            {/* Phone speaker/camera bar */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 h-4 w-24 bg-slate-800 rounded-full"></div>

            <div className="pt-4 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="bg-[#F59E0B] p-1.5 rounded-lg text-slate-900 shrink-0">
                  <Sun className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-800">Sunrise Parent App</h4>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Demo Preview</p>
                </div>
              </div>

              {/* Student info */}
              <div className="bg-blue-50/50 border border-blue-100/50 rounded-xl p-3 text-left">
                <h5 className="font-bold text-xs text-slate-800">Priya Shah</h5>
                <p className="text-[10px] text-slate-500">English Medium · Std 5</p>

                <div className="mt-3 pt-2 border-t border-blue-100/50 flex justify-between">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Pending Due</span>
                  <span className="text-xs font-bold text-red-500">₹5,600</span>
                </div>
              </div>

              {/* Invoices list stub */}
              <div className="space-y-2 text-left">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Pending Invoices</span>
                <div className="border border-slate-100 rounded-lg p-2.5 flex justify-between items-center text-xs">
                  <div>
                    <strong className="block text-slate-800 font-bold text-[11px]">Education Fee - June</strong>
                    <span className="text-[9px] text-slate-400">Due: June 15, 2026</span>
                  </div>
                  <span className="font-bold text-red-500 text-xs">₹2,800</span>
                </div>
                <div className="border border-slate-100 rounded-lg p-2.5 flex justify-between items-center text-xs">
                  <div>
                    <strong className="block text-slate-800 font-bold text-[11px]">Education Fee - July</strong>
                    <span className="text-[9px] text-slate-400">Due: July 15, 2026</span>
                  </div>
                  <span className="font-bold text-red-500 text-xs">₹2,800</span>
                </div>
              </div>

              <button className="w-full bg-[#1E3A8A] text-white font-bold py-2 rounded-xl text-xs shadow-md shadow-blue-500/10 transition-all">
                Pay Now via UPI
              </button>
            </div>
          </div>
        </div>
      );

    case 'receipts':
      return (
        <div className="flex-1 p-6 space-y-6">
          <header>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Receipt Center</h2>
            <p className="text-xs font-semibold text-slate-400">Manage transaction histories, print receipts or trigger reversals</p>
          </header>

          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase bg-slate-50/50">
                    <th className="py-3.5 px-5 w-[10px]"></th>
                    <th className="py-3.5 px-5">Student</th>
                    <th className="py-3.5 px-5">Fee Detail Summary</th>
                    <th className="py-3.5 px-5">Paid Amount</th>
                    <th className="py-3.5 px-5">Mode</th>
                    <th className="py-3.5 px-5">Time</th>
                    <th className="py-3.5 px-5 text-center">Receipt</th>
                    <th className="py-3.5 px-5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-sm text-slate-400">
                        No transactions recorded yet. Collect fees to see receipts here.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((t) => {
                      const isExpanded = expandedTxId === t.id;
                      return (
                        <React.Fragment key={t.id}>
                          <tr className="hover:bg-slate-50/30 transition-colors">
                            <td className="py-4 px-5">
                              <button
                                onClick={() => setExpandedTxId(isExpanded ? null : t.id)}
                                className="p-1 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4 text-slate-500" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-slate-500" />
                                )}
                              </button>
                            </td>
                            <td className="py-4 px-5">
                              <span className="font-bold text-slate-800 block">{t.studentName}</span>
                              <span className="text-[10px] text-slate-400 block font-mono">{t.studentCode} · {t.classInfo}</span>
                            </td>
                            <td className="py-4 px-5">
                              <div className="text-slate-500 font-semibold text-xs max-w-[200px] truncate">
                                {t.feeType.split('\n').join(', ')}
                              </div>
                            </td>
                            <td className="py-4 px-5 font-bold text-slate-800">
                              {t.amount < 0 ? (
                                <span className="text-red-500">-₹{Math.abs(t.amount).toLocaleString('en-IN')}</span>
                              ) : (
                                <span>₹{t.amount.toLocaleString('en-IN')}</span>
                              )}
                            </td>
                            <td className="py-4 px-5">
                              <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-slate-200/50 uppercase">
                                {t.method}
                              </span>
                            </td>
                            <td className="py-4 px-5 text-slate-400 text-xs font-semibold">{t.time || t.date}</td>
                            <td className="py-4 px-5 text-center">
                              <button
                                onClick={() => onPrint(t)}
                                className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100/50"
                              >
                                Print Receipt
                              </button>
                            </td>
                            <td className="py-4 px-5 text-center">
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${t.status === 'REVERSED' ? 'bg-red-50 text-red-500 border-red-100' :
                                  t.status === 'PARTIALLY_REVERSED' ? 'bg-amber-50 text-amber-500 border-amber-100' :
                                    'bg-emerald-50 text-emerald-600 border-emerald-100'
                                }`}>
                                {t.status}
                              </span>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-slate-50/50">
                              <td colSpan={8} className="py-4 px-8 border-t border-b border-slate-100/80">
                                <div className="bg-white border border-slate-200/60 rounded-xl p-4 shadow-sm">
                                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                                    <span>Receipt Line Items</span>
                                    <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full border border-slate-200">{(t.subItems || []).length} fee item{(t.subItems || []).length !== 1 ? 's' : ''}</span>
                                  </h4>
                                  <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                      <tr className="border-b border-slate-200/60 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                                        <th className="py-2 px-3">Fee Type Details</th>
                                        <th className="py-2 px-3 text-right">Amount (₹)</th>
                                        <th className="py-2 px-3 text-right">Concession (₹)</th>
                                        <th className="py-2 px-3 text-center">Method</th>
                                        <th className="py-2 px-3 text-center">Status</th>
                                        <th className="py-2 px-3 text-right">Reversal Action</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                      {(t.subItems || []).map((sub: any) => (
                                        <tr key={sub.id} className="hover:bg-slate-50/30 transition-colors">
                                          <td className="py-3 px-3 font-bold text-slate-800">{sub.description}</td>
                                          <td className="py-3 px-3 text-right font-extrabold text-slate-800">₹{sub.amount.toLocaleString('en-IN')}</td>
                                          <td className="py-3 px-3 text-right font-semibold text-purple-600">₹{(sub.concessionAmount || 0).toLocaleString('en-IN')}</td>
                                          <td className="py-3 px-3 text-center">
                                            <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded border border-slate-200/50 uppercase">
                                              {sub.method}
                                            </span>
                                          </td>
                                          <td className="py-3 px-3 text-center">
                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${sub.status === 'REVERSED' ? 'bg-red-50 text-red-500 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                              }`}>
                                              {sub.status}
                                            </span>
                                          </td>
                                          <td className="py-3 px-3 text-right">
                                            {sub.status !== 'REVERSED' && sub.method !== 'GOVT' ? (
                                              <button
                                                onClick={async () => {
                                                  if (window.confirm(`Are you sure you want to reverse payment of ₹${sub.amount.toLocaleString('en-IN')} for ${sub.description}? This will restore the balance back to the ledger.`)) {
                                                    await reversePayment(sub.id);
                                                  }
                                                }}
                                                className="inline-flex items-center gap-1 text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-200/50 hover:border-red-300 font-bold px-2.5 py-1 rounded-lg text-[9px] tracking-wide transition-all shadow-sm active:scale-[0.98]"
                                              >
                                                <RotateCcw className="h-2.5 w-2.5" />
                                                Reverse Item
                                              </button>
                                            ) : (
                                              <span className="text-slate-300 text-[9px] italic pr-2 font-medium">Not reversible</span>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );

    case 'audit-log':
      return <AuditLogs />;

    case 'reports':
      return (
        <div className="flex-1 p-6 space-y-6">
          <header>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Reports & Analytical Invoices</h2>
            <p className="text-xs font-semibold text-slate-400">Generate pdf collection lists, standard revenue splits, and transport due lists</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-2">
              <h4 className="font-bold text-slate-800 text-sm">Daily Collections Report</h4>
              <p className="text-xs text-slate-500">Summary of today's collections categorized by cash, cheques, and online modes.</p>
              <button
                onClick={() => alert('Daily Collections Report downloaded successfully!')}
                className="mt-4 w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl text-xs"
              >
                Generate PDF
              </button>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-2">
              <h4 className="font-bold text-slate-800 text-sm">Outstanding Due Balance</h4>
              <p className="text-xs text-slate-500">List of all active students with remaining dues, divided into 1/2/3+ overdue months.</p>
              <button
                onClick={() => alert('Due Balance Report exported to Excel!')}
                className="mt-4 w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl text-xs"
              >
                Export Excel
              </button>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-2">
              <h4 className="font-bold text-slate-800 text-sm">RTE Reconcile Sheet</h4>
              <p className="text-xs text-slate-500">Track RTE quota exemptions to submit for state government reimbursement files.</p>
              <button
                onClick={() => alert('RTE Reimbursement log generated!')}
                className="mt-4 w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl text-xs"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      );

    default:
      return <Dashboard />;
  }
};

const MainAppLayout: React.FC<{ onPrint: (tx: PaymentTransaction) => void }> = ({ onPrint }) => {
  const { currentScreen } = useApp();

  if (currentScreen === 'login') {
    return <Login />;
  }

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-600 font-sans print:hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <ScreenContent onPrint={onPrint} />
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  const [printingTx, setPrintingTx] = useState<PaymentTransaction | null>(null);

  const handlePrint = (tx: PaymentTransaction) => {
    setPrintingTx(tx);
    // Give react time to render the print view before opening print dialog
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Listen for afterprint to hide the receipt again (optional, it's hidden by CSS print:block anyway)
  useEffect(() => {
    const afterPrint = () => setPrintingTx(null);
    window.addEventListener('afterprint', afterPrint);
    return () => window.removeEventListener('afterprint', afterPrint);
  }, []);

  return (
    <React.StrictMode>
      {/* The main app is hidden during print via print:hidden */}
      <MainAppLayout onPrint={handlePrint} />

      {/* The receipt is only visible during print via print:block */}
      {printingTx && <PrintReceipt transaction={printingTx} />}
    </React.StrictMode>
  );
};

export default App;
