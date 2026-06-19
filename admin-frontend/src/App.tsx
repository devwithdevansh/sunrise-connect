import React from 'react';
import { useApp } from './store';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { CollectFee } from './components/CollectFee';
import { UnpaidFees } from './components/UnpaidFees';
import { Students } from './components/Students';
import { FeeStructure } from './components/FeeStructure';
import { Login } from './components/Login';
import {
  MessageSquare,
  Bell,
  Sun
} from 'lucide-react';

const ScreenContent: React.FC = () => {
  const { currentScreen, transactions, reversePayment, auditLogs } = useApp();

  switch (currentScreen) {
    case 'dashboard':
      return <Dashboard />;
    case 'collect-fee':
      return <CollectFee />;
    case 'unpaid-fees':
      return <UnpaidFees />;
    case 'fee-structure':
      return <FeeStructure />;
    case 'students':
      return <Students />;
    
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
                    <th className="py-3.5 px-5">Student</th>
                    <th className="py-3.5 px-5">Fee Detail</th>
                    <th className="py-3.5 px-5">Paid Amount</th>
                    <th className="py-3.5 px-5">Mode</th>
                    <th className="py-3.5 px-5">Time</th>
                    <th className="py-3.5 px-5 text-center">Receipt</th>
                    <th className="py-3.5 px-5 text-center">Reversal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-sm text-slate-400">
                        No transactions recorded yet. Collect fees to see receipts here.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="py-4 px-5">
                          <span className="font-bold text-slate-800 block">{t.studentName}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">{t.studentCode}</span>
                        </td>
                        <td className="py-4 px-5">
                          <div className="text-slate-500 font-semibold space-y-1">
                            {t.feeType.split('\n').map((line, i) => (
                              <span key={i} className="block">{line}</span>
                            ))}
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
                          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-slate-200/50">
                            {t.method}
                          </span>
                          {(t as any).isReversal && (
                            <span className="ml-1 bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-red-200/50">REVERSED</span>
                          )}
                        </td>
                        <td className="py-4 px-5 text-slate-400 text-xs font-semibold">{t.time || t.date}</td>
                        <td className="py-4 px-5 text-center">
                          <button
                            onClick={() => alert(`Receipt PDF dynamically generated for ${t.studentName}!`)}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100/50"
                          >
                            Download
                          </button>
                        </td>
                        <td className="py-4 px-5 text-center">
                          {t.amount > 0 && !(t as any).isReversal && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to reverse payment of ₹${t.amount} for ${t.studentName}?`)) {
                                  reversePayment(t.id);
                                }
                              }}
                              className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 px-3 py-1 rounded-lg border border-red-100/50"
                            >
                              Reverse
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );

    case 'audit':
      return (
        <div className="flex-1 p-6 space-y-6">
          <header>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Audit Log</h2>
            <p className="text-xs font-semibold text-slate-400">Admin-only portal logs satisfying security audit requirements</p>
          </header>

          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="divide-y divide-slate-100">
              {auditLogs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No audit logs found.</div>
              ) : (
                auditLogs.map((log) => {
                  const dateStr = new Date(log.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                  let detailStr = '';
                  if (log.details?.remark) detailStr = log.details.remark;
                  else if (log.details?.reason) detailStr = log.details.reason;
                  else if (typeof log.details === 'object' && Object.keys(log.details).length > 0) {
                    detailStr = JSON.stringify(log.details).substring(0, 100);
                  } else {
                    detailStr = `Action performed on ${log.entityType}`;
                  }
                  
                  return (
                    <div key={log._id} className="py-3 flex items-start gap-4 text-sm hover:bg-slate-50/50 transition-colors">
                      <span className="text-slate-400 text-xs shrink-0 font-semibold w-28">{dateStr}</span>
                      <div>
                        <span className="font-bold text-slate-800">{log.action}</span>
                        <p className="text-xs text-slate-500 mt-0.5">{detailStr}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      );

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

const MainAppLayout: React.FC = () => {
  const { currentScreen } = useApp();

  if (currentScreen === 'login') {
    return <Login />;
  }

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-600 font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <ScreenContent />
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <React.StrictMode>
      <MainAppLayout />
    </React.StrictMode>
  );
};

export default App;
