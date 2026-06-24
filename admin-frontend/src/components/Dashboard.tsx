import React, { useState, useMemo } from 'react';
import { useApp } from '../store';
import {
  Search,
  Plus,
  Coins,
  Smartphone,
  FileText,
  CreditCard,
  Globe,
  Users,
  AlertTriangle,
  Bus,
  GraduationCap,
  Loader2
} from 'lucide-react';

const DashboardSkeleton: React.FC = () => {
  return (
    <div className="flex-1 p-6 space-y-6 animate-pulse">
      {/* Top Header Bar Skeleton */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 bg-slate-200 rounded-lg w-48"></div>
          <div className="h-4 bg-slate-150 rounded-md w-36"></div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="h-10 bg-slate-200 rounded-xl w-full md:w-64"></div>
          <div className="h-10 bg-slate-200 rounded-xl w-32 shrink-0"></div>
        </div>
      </header>

      {/* Main Banner Card Skeleton */}
      <div className="bg-gradient-to-r from-blue-900/10 to-blue-700/10 border border-slate-200/50 rounded-2xl p-6 min-h-[160px] flex flex-col justify-between">
        <div className="space-y-2">
          <div className="h-4 bg-slate-250 rounded-md w-32"></div>
          <div className="h-10 bg-slate-200 rounded-lg w-60"></div>
        </div>
        <div className="flex gap-4 mt-4">
          <div className="h-7 bg-slate-200 rounded-full w-36"></div>
          <div className="h-7 bg-slate-200 rounded-full w-36"></div>
          <div className="h-7 bg-slate-200 rounded-full w-36"></div>
        </div>
      </div>

      {/* Payment Modes Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm space-y-3">
            <div className="w-10 h-10 bg-slate-150 rounded-xl"></div>
            <div className="h-3 bg-slate-200 rounded w-16"></div>
            <div className="h-5 bg-slate-200 rounded w-20"></div>
          </div>
        ))}
      </div>

      {/* Summary Statistics Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-start justify-between space-y-2">
            <div className="space-y-2 w-3/4">
              <div className="h-3 bg-slate-250 rounded w-20"></div>
              <div className="h-7 bg-slate-200 rounded w-14"></div>
              <div className="h-4 bg-slate-150 rounded w-full"></div>
            </div>
            <div className="w-10 h-10 bg-slate-100 rounded-xl border border-slate-100 shrink-0"></div>
          </div>
        ))}
      </div>

      {/* Recent Payments Section Skeleton */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 bg-slate-200 rounded w-36"></div>
          <div className="h-7 bg-slate-200 rounded-lg w-20"></div>
        </div>
        <div className="space-y-3 pt-2">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-50">
              <div className="space-y-2 w-1/4">
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-3 bg-slate-150 rounded w-1/2"></div>
              </div>
              <div className="h-4 bg-slate-200 rounded w-16"></div>
              <div className="h-4 bg-slate-200 rounded w-24"></div>
              <div className="h-4 bg-slate-200 rounded w-16"></div>
              <div className="h-6 bg-slate-150 rounded-lg w-20"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const { students, ledgerEntries, transactions, setScreen, isLoadingDetails } = useApp();

  if (isLoadingDetails && students.length === 0) {
    return <DashboardSkeleton />;
  }
  const [searchQuery, setSearchQuery] = useState('');

  // Define today's date string matching the format in store.tsx (YYYY-MM-DD)
  const todayString = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  // Filter transactions for today
  const todayTransactions = useMemo(() => {
    return transactions.filter(t => t.date === todayString && t.status !== 'REVERSED');
  }, [transactions, todayString]);

  // Today's Collection totals
  const totalCollection = useMemo(() => {
    return todayTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [todayTransactions]);

  const englishCol = useMemo(() => {
    return todayTransactions
      .filter((t) => t.classInfo.toLowerCase().includes('english'))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [todayTransactions]);

  const gujaratiCol = useMemo(() => {
    return todayTransactions
      .filter((t) => t.classInfo.toLowerCase().includes('gujarati'))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [todayTransactions]);

  // Today's Concession – summed directly from payment records stored in DB
  const todayConcession = useMemo(() => {
    return todayTransactions.reduce((sum, t) => sum + (t.concessionAmount || 0), 0);
  }, [todayTransactions]);

  // Payment mode stats for today
  const getModeSum = (method: string) => {
    if (method === 'ONLINE') {
      return todayTransactions
        .filter((t) => t.method === 'ONLINE' || t.method === 'UPI')
        .reduce((sum, t) => sum + t.amount, 0);
    }
    return todayTransactions
      .filter((t) => t.method === method)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const paymentModes = [
    { label: 'CASH', value: getModeSum('CASH').toLocaleString('en-IN'), icon: Coins, bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
    { label: 'ONLINE', value: getModeSum('ONLINE').toLocaleString('en-IN'), icon: Smartphone, bg: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
    { label: 'CHEQUE', value: getModeSum('CHEQUE').toLocaleString('en-IN'), icon: FileText, bg: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' },
    { label: 'CARD', value: getModeSum('CARD').toLocaleString('en-IN'), icon: CreditCard, bg: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
    { label: 'NET BANKING', value: getModeSum('NET BANKING').toLocaleString('en-IN'), icon: Globe, bg: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' },
  ];

  // Overall student & ledger statistics
  const totalStudents = students.length;
  const englishStudents = students.filter(s => s.medium.toLowerCase() === 'english').length;
  const gujaratiStudents = students.filter(s => s.medium.toLowerCase() === 'gujarati').length;

  const transportStudents = students.filter(s => s.transportType && s.transportType !== 'None').length;
  const railnagarStudents = students.filter(s => s.transportType === 'Railnagar').length;
  const outsideStudents = students.filter(s => s.transportType === 'Outside Railnagar').length;

  const rteStudents = students.filter(s => s.isRTE).length;

  // Outstanding / Unpaid Calculation from ledger entries
  const unpaidLedgers = ledgerEntries.filter(l => l.status !== 'PAID');
  const totalOutstanding = unpaidLedgers.reduce((sum, l) => sum + l.remainingAmount, 0);

  const stats = [
    {
      title: 'TOTAL STUDENTS',
      value: totalStudents.toLocaleString('en-IN'),
      subtitle: `English: ${englishStudents} · Gujarati: ${gujaratiStudents}`,
      icon: Users,
      color: 'border-t-4 border-t-teal-500'
    },
    {
      title: 'UNPAID LEDGERS',
      value: unpaidLedgers.length.toLocaleString('en-IN'),
      subtitle: `₹${totalOutstanding.toLocaleString('en-IN')} outstanding`,
      icon: AlertTriangle,
      color: 'border-t-4 border-t-red-500'
    },
    {
      title: 'TRANSPORT STUDENTS',
      value: transportStudents.toLocaleString('en-IN'),
      subtitle: `Railnagar: ${railnagarStudents} · Outside: ${outsideStudents}`,
      icon: Bus,
      color: 'border-t-4 border-t-amber-500'
    },
    {
      title: 'RTE STUDENTS',
      value: rteStudents.toLocaleString('en-IN'),
      subtitle: 'Govt pays · No reminders sent',
      icon: GraduationCap,
      color: 'border-t-4 border-t-indigo-500'
    }
  ];

  const filteredTransactions = useMemo(() => {
    if (!searchQuery) return transactions;
    return transactions.filter(
      (tx) =>
        tx.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.studentCode.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [transactions, searchQuery]);

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Top Header Bar */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Today's Dashboard</h2>
            {isLoadingDetails && (
              <span className="flex items-center gap-1.5 bg-amber-50 text-[#F59E0B] text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-100 animate-pulse">
                <Loader2 className="animate-spin h-3 w-3 text-[#F59E0B]" strokeWidth={3} />
                Syncing...
              </span>
            )}
          </div>
          <p className="text-xs font-semibold text-slate-400">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search student name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
            />
          </div>
          <button
            onClick={() => setScreen('collect-fee')}
            className="flex items-center gap-1.5 bg-[#F59E0B] hover:bg-amber-600 text-slate-900 font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-amber-500/10 active:scale-[0.98] text-sm shrink-0"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            Collect Fee
          </button>
        </div>
      </header>

      {/* Main Banner Card */}
      <section className="bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] text-white rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[160px] border border-blue-400/20">
        {/* Abstract shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-blue-300/10 rounded-full translate-y-1/2 pointer-events-none"></div>
        
        <div>
          <span className="text-[10px] font-bold tracking-widest text-blue-200 uppercase">Today's Total Collection</span>
          <h3 className="text-4xl md:text-5xl font-extrabold mt-1 flex items-baseline">
            ₹{totalCollection.toLocaleString('en-IN')}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-blue-100 mt-4">
          <div className="flex items-center gap-2 bg-blue-900/40 px-3 py-1.5 rounded-full border border-blue-400/30">
            <span className="h-2 w-2 rounded-full bg-[#F59E0B]"></span>
            <span>English Medium: <strong className="text-white">₹{englishCol.toLocaleString('en-IN')}</strong></span>
          </div>
          <div className="flex items-center gap-2 bg-blue-900/40 px-3 py-1.5 rounded-full border border-blue-400/30">
            <span className="h-2 w-2 rounded-full bg-teal-400"></span>
            <span>Gujarati Medium: <strong className="text-white">₹{gujaratiCol.toLocaleString('en-IN')}</strong></span>
          </div>
          <div className="flex items-center gap-2 bg-blue-900/40 px-3 py-1.5 rounded-full border border-blue-400/30">
            <span className="h-2 w-2 rounded-full bg-pink-400"></span>
            <span>Concessions Given: <strong className="text-white">₹{todayConcession.toLocaleString('en-IN')}</strong></span>
          </div>
        </div>
      </section>

      {/* Payment Modes Grid */}
      <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {paymentModes.map((mode) => {
          const Icon = mode.icon;
          return (
            <div
              key={mode.label}
              className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className={`p-2.5 rounded-xl border mb-3 ${mode.bg}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">{mode.label}</span>
              <strong className="text-slate-800 text-lg font-bold mt-1">₹{mode.value}</strong>
            </div>
          );
        })}
      </section>

      {/* Summary Statistics Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className={`bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex items-start justify-between border border-slate-100 ${stat.color}`}
            >
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 tracking-wider block">{stat.title}</span>
                <strong className="text-2xl font-bold text-slate-800 block">{stat.value}</strong>
                <span className="text-xs text-slate-500 font-medium block">{stat.subtitle}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-400">
                <Icon className="h-5 w-5" />
              </div>
            </div>
          );
        })}
      </section>

      {/* Recent Payments Section */}
      <section className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h4 className="text-base font-bold text-slate-800">Recent Payments</h4>
          <button
            onClick={() => setScreen('receipts')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-all"
          >
            View All
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase">
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Fee Type</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
              {filteredTransactions.slice(0, 5).map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-slate-800">{tx.studentName}</span>
                      {tx.status === 'RTE' && (
                        <span className="bg-purple-100 text-purple-600 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">RTE</span>
                      )}
                    </div>
                    <span className="text-slate-400 text-[10px] block font-mono">{tx.studentCode}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-semibold">{tx.classInfo}</td>
                  <td className="py-3.5 px-4 text-slate-600 font-semibold">{tx.feeType}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    {tx.amount === 0 ? (
                      '₹0'
                    ) : tx.amount === 1500 ? (
                      <span>
                        ₹1,500 <span className="text-[10px] text-slate-400 font-normal">of ₹3,500</span>
                      </span>
                    ) : (
                      `₹${tx.amount.toLocaleString('en-IN')}`
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                      tx.method === 'ONLINE' || tx.method === 'UPI'
                        ? 'bg-blue-50 text-blue-600 border border-blue-100'
                        : tx.method === 'CASH'
                        ? 'bg-slate-100 text-slate-600'
                        : tx.method === 'CARD'
                        ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                        : 'bg-purple-50 text-purple-600 border border-purple-100'
                    }`}>
                      {tx.method}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 text-xs font-semibold">{tx.time}</td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      tx.status === 'PAID'
                        ? 'bg-emerald-100 text-emerald-600'
                        : tx.status === 'PARTIAL'
                        ? 'bg-amber-100 text-amber-600'
                        : 'bg-purple-100 text-purple-600'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
