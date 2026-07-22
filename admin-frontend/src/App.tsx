import React, { useState } from 'react';
import { Menu, RefreshCw } from 'lucide-react';
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

import { Reports } from './components/Reports';
import { Receipts } from './components/Receipts';
import { Notifications } from './components/Notifications';
import { Whatsapp } from './components/Whatsapp';
import { generateReceiptHTML, generateReportHTML, printHTML, fetchAsBase64 } from './utils/printUtils';
import logoPath from './assets/sunrise-logo.png';
import watermarkPath from './assets/sunrise-round-logo.png';

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
      return <Whatsapp />;

    case 'notifications':
      return <Notifications />;

    case 'parent-app':
      return (
        <div className="flex-1 p-6 flex items-center justify-center bg-slate-50">
          <div className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-2xl max-w-sm w-full border-t-8 border-t-slate-800 border-b-8 border-b-slate-800 relative">
            {/* Phone speaker/camera bar */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 h-4 w-24 bg-slate-800 rounded-full"></div>

            <div className="pt-4 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="shrink-0">
                  <img src={watermarkPath} alt="Sunrise Connect" className="h-6 w-6 object-contain" />
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
  const { currentScreen, isScreenLoading, isLoadingDetails } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (currentScreen === 'login') {
    return <Login />;
  }

  return (
    <div className="flex bg-[#F8FAFC] h-screen overflow-hidden text-slate-600 font-sans">
      <Sidebar isMobileOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {isLoadingDetails && !isScreenLoading && (
          <div className="absolute top-4 right-6 bg-blue-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg shadow-blue-500/20 flex items-center gap-2 z-50 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Syncing data...
          </div>
        )}
        
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-slate-100 text-slate-600"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-2">
              <img src={logoPath} alt="Logo" className="h-7 w-7 object-contain" />
              <h1 className="font-bold text-slate-800 text-lg tracking-wide">Sunrise Connect</h1>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto relative">
          {isScreenLoading ? (
            <ScreenSkeleton />
          ) : (
            <ScreenContent onPrint={onPrint} onPrintReport={onPrintReport} />
          )}
        </div>
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  /**
   * Receipt printing — converts logo assets to base64 data URIs first
   * (fixes intermittent missing-logo issue in iframe), then generates
   * a fully self-contained HTML string and prints via hidden iframe.
   */
  const handlePrint = async (tx: PaymentTransaction) => {
    let currentUserName: string | undefined;
    try {
      const saved = localStorage.getItem('currentUser');
      if (saved) currentUserName = JSON.parse(saved)?.name;
    } catch { /* ignore */ }

    // Embed images as base64 so they always load in the iframe
    const [logoBase64, watermarkBase64] = await Promise.all([
      fetchAsBase64(logoPath),
      fetchAsBase64(watermarkPath),
    ]);

    const html = generateReceiptHTML(tx, { currentUserName, logoBase64, watermarkBase64 });
    printHTML(html);
  };

  const handlePrintReport = async (report: any) => {
    const logoBase64 = await fetchAsBase64(logoPath);
    const html = generateReportHTML(report, { logoBase64 });
    printHTML(html);
  };

  return (
    <React.StrictMode>
      <MainAppLayout onPrint={handlePrint} onPrintReport={handlePrintReport} />
    </React.StrictMode>
  );
};

export default App;
