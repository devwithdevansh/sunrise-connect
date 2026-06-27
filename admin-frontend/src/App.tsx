import React, { useState, useEffect } from 'react';
import { useApp } from './store';
import type { PaymentTransaction } from './mockData';
import { ScreenSkeleton } from './components/ScreenSkeleton';
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
  Sun
} from 'lucide-react';
import { PrintReceipt } from './components/PrintReceipt';
import { Reports } from './components/Reports';
import { PrintReport } from './components/PrintReport';
import { Receipts } from './components/Receipts';

const ScreenContent: React.FC<{ onPrint: (tx: PaymentTransaction) => void, onPrintReport: (report: any) => void }> = ({ onPrint, onPrintReport }) => {
  const { currentScreen } = useApp();

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
      return <Receipts onPrint={onPrint} />;

    case 'audit-log':
      return <AuditLogs />;

    case 'reports':
      return <Reports onPrintReport={onPrintReport} />;

    default:
      return <Dashboard />;
  }
};

const MainAppLayout: React.FC<{ onPrint: (tx: PaymentTransaction) => void, onPrintReport: (report: any) => void }> = ({ onPrint, onPrintReport }) => {
  const { currentScreen, isScreenLoading } = useApp();

  if (currentScreen === 'login') {
    return <Login />;
  }

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-600 font-sans print:hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        {isScreenLoading ? (
          <ScreenSkeleton />
        ) : (
          <ScreenContent onPrint={onPrint} onPrintReport={onPrintReport} />
        )}
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  const [printingTx, setPrintingTx] = useState<PaymentTransaction | null>(null);
  const [printingReport, setPrintingReport] = useState<any | null>(null);

  const handlePrint = (tx: PaymentTransaction) => {
    setPrintingTx(tx);
    // Give react time to render the print view before opening print dialog
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handlePrintReport = (report: any) => {
    setPrintingReport(report);
    // Give react time to render the print view before opening print dialog
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Listen for afterprint to hide the receipt again (optional, it's hidden by CSS print:block anyway)
  useEffect(() => {
    const afterPrint = () => {
      setPrintingTx(null);
      setPrintingReport(null);
    };
    window.addEventListener('afterprint', afterPrint);
    return () => window.removeEventListener('afterprint', afterPrint);
  }, []);

  return (
    <React.StrictMode>
      {/* The main app is hidden during print via print:hidden */}
      <MainAppLayout onPrint={handlePrint} onPrintReport={handlePrintReport} />

      {/* The receipt is only visible during print via print:block */}
      {printingTx && <PrintReceipt transaction={printingTx} />}
      {printingReport && <PrintReport report={printingReport} />}
    </React.StrictMode>
  );
};

export default App;
