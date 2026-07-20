import React, { useState, useEffect, useMemo } from 'react';
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
  Loader2,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { formatTransactions } from '../utils/transactionHelpers';

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
  const { students, activeStudents, setScreen, isLoadingDetails, transactions: globalTransactions, unpaidData } = useApp();

  // Define today's date string matching the format in store.tsx (YYYY-MM-DD)
  const todayString = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  const [selectedDate, setSelectedDate] = useState(todayString);
  const [searchVal, setSearchVal] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const rawTxData = useMemo(() => {
    return globalTransactions.filter((tx: any) => {
      const txDate = new Date(tx.createdAt).toISOString().split('T')[0];
      return txDate === selectedDate;
    });
  }, [globalTransactions, selectedDate]);

  const metrics = useMemo(() => {
    let totalAmount = 0;
    let cashAmount = 0;
    let bankAmount = 0;
    let totalConcessions = 0;

    rawTxData.forEach((tx: any) => {
      const amount = tx.amount || 0;
      totalAmount += amount;
      
      // Concessions are only counted for the original payment to avoid double counting or negative concessions
      if (!tx.isReversal) {
        totalConcessions += tx.concessionAmount || 0;
      }

      if (tx.method?.toUpperCase() === 'CASH') {
        cashAmount += amount;
      } else {
        bankAmount += amount;
      }
    });

    // Unpaid count: number of students in unpaidData with a non-empty pendingLedgers array
    const unpaidCount = unpaidData.filter((u: any) => u.pendingLedgers && u.pendingLedgers.length > 0).length;

    return { totalAmount, cashAmount, bankAmount, totalConcessions, unpaidCount };
  }, [rawTxData, unpaidData]);

  const [dailyTransactions, setDailyTransactions] = useState<any[]>([]);

  // Format transactions whenever raw data or students change
  useEffect(() => {
    if (rawTxData.length > 0 && students.length > 0) {
      setDailyTransactions(formatTransactions(rawTxData, students));
    } else {
      setDailyTransactions([]);
    }
  }, [rawTxData, students]);

  // Debounce search input by 200ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(searchVal);
    }, 200);
    return () => clearTimeout(handler);
  }, [searchVal]);

  // Reset page when date or search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDate, searchQuery]);

  // Timezone-safe day navigation helpers
  const handlePrevDay = () => {
    const parts = selectedDate.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const dateObj = new Date(year, month, day);
      dateObj.setDate(dateObj.getDate() - 1);

      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      setSelectedDate(`${yyyy}-${mm}-${dd}`);
    }
  };

  const handleNextDay = () => {
    const parts = selectedDate.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const dateObj = new Date(year, month, day);
      dateObj.setDate(dateObj.getDate() + 1);

      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      setSelectedDate(`${yyyy}-${mm}-${dd}`);
    }
  };

  const handleToday = () => {
    setSelectedDate(todayString);
  };

  const formattedSelectedDate = useMemo(() => {
    const parts = selectedDate.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const dateObj = new Date(year, month, day);
      return dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
    return selectedDate;
  }, [selectedDate]);

  // Filter transactions for selected date
  const selectedDateTransactions = dailyTransactions;

  // Collection totals for selected date
  const totalCollection = metrics.totalAmount;

  const englishCol = useMemo(() => {
    return selectedDateTransactions
      .filter((t) => t.classInfo.toLowerCase().includes('english'))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [selectedDateTransactions]);

  const gujaratiCol = useMemo(() => {
    return selectedDateTransactions
      .filter((t) => t.classInfo.toLowerCase().includes('gujarati'))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [selectedDateTransactions]);

  // Concession for selected date
  const todayConcession = metrics.totalConcessions;

  // Payment mode stats for selected date (Dynamic)
  const paymentModesData = useMemo(() => {
    const totals = new Map<string, number>();

    // Helper to normalize method names to group them correctly
    const normalizeMethod = (m: string) => {
      const upperM = (m || '').trim().toUpperCase();
      if (upperM === 'UPI') return 'ONLINE';
      if (['NEFT', 'RTGS', 'IMPS'].includes(upperM)) return 'NET BANKING';
      return upperM;
    };

    selectedDateTransactions.forEach((t) => {
      if (t.paymentBreakdown && t.paymentBreakdown.length > 0) {
        t.paymentBreakdown.forEach((b: any) => {
          const norm = normalizeMethod(b.method);
          totals.set(norm, (totals.get(norm) || 0) + b.amount);
        });
      } else if (t.method) {
        // Split by '+' in case it's a joined string but without breakdown
        const methods = t.method.split('+').map((m: string) => m.trim());
        if (methods.length === 1) {
          const norm = normalizeMethod(methods[0]);
          totals.set(norm, (totals.get(norm) || 0) + t.amount);
        } else {
          // If multiple methods but no breakdown, we can't accurately split amount,
          // but we shouldn't create a card named "ONLINE + CASH".
          // In the absence of breakdown, just attribute it entirely to the first method as a fallback.
          const norm = normalizeMethod(methods[0]);
          totals.set(norm, (totals.get(norm) || 0) + t.amount);
        }
      }
    });

    // Ensure we always show the base 5 methods even if 0, matching the photo
    const baseMethods = ['CASH', 'ONLINE', 'CHEQUE', 'CARD', 'NET BANKING'];
    baseMethods.forEach(m => {
      if (!totals.has(m)) totals.set(m, 0);
    });

    const config: Record<string, { icon: React.ElementType, bg: string }> = {
      'CASH': { icon: Coins, bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
      'ONLINE': { icon: Smartphone, bg: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
      'CHEQUE': { icon: FileText, bg: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' },
      'CARD': { icon: CreditCard, bg: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
      'NET BANKING': { icon: Globe, bg: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' },
      'GOVT': { icon: GraduationCap, bg: 'bg-purple-500/10 text-purple-600 border-purple-500/20' }
    };

    const fallbackConfig = { icon: Coins, bg: 'bg-slate-500/10 text-slate-600 border-slate-500/20' };

    return Array.from(totals.entries()).map(([label, value]) => {
      const conf = config[label] || fallbackConfig;
      return {
        label,
        value: value.toLocaleString('en-IN'),
        ...conf
      };
    }).sort((a, b) => {
      // Keep base methods first
      const aIdx = baseMethods.indexOf(a.label);
      const bIdx = baseMethods.indexOf(b.label);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return a.label.localeCompare(b.label);
    });
  }, [selectedDateTransactions]);

  // Overall student & ledger statistics
  const totalStudents = activeStudents.length;
  const englishStudents = activeStudents.filter(s => s.medium.toLowerCase() === 'english').length;
  const gujaratiStudents = activeStudents.filter(s => s.medium.toLowerCase() === 'gujarati').length;

  const transportStudents = activeStudents.filter(s => s.transportType && s.transportType !== 'None').length;

  const rteStudents = activeStudents.filter(s => s.isRTE).length;

  // Outstanding / Unpaid Calculation from ledger entries
  const unpaidCount = metrics.unpaidCount;

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
      value: unpaidCount.toLocaleString('en-IN'),
      subtitle: `Action required`,
      icon: AlertTriangle,
      color: 'border-t-4 border-t-red-500'
    },
    {
      title: 'TRANSPORT STUDENTS',
      value: transportStudents.toLocaleString('en-IN'),
      subtitle: `Multiple active zones`,
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

  // Filter daily transactions by search query
  const filteredTransactions = useMemo(() => {
    const daily = dailyTransactions;
    if (!searchQuery) return daily;
    const q = searchQuery.toLowerCase();
    return daily.filter(
      (tx) =>
        tx.studentName.toLowerCase().includes(q) ||
        tx.studentCode.toLowerCase().includes(q)
    );
  }, [dailyTransactions, searchQuery]);

  // Paginate transactions
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredTransactions.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredTransactions, currentPage]);

  const totalPages = Math.ceil(filteredTransactions.length / PAGE_SIZE);

  if (isLoadingDetails && students.length === 0) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Top Header Bar */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              {selectedDate === todayString ? "Today's Dashboard" : "Daily Collection Dashboard"}
            </h2>
            {isLoadingDetails && (
              <span className="flex items-center gap-1.5 bg-amber-50 text-[#F59E0B] text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-100 animate-pulse">
                <Loader2 className="animate-spin h-3 w-3 text-[#F59E0B]" strokeWidth={3} />
                Syncing...
              </span>
            )}
          </div>
          <p className="text-xs font-semibold text-slate-400">
            {formattedSelectedDate}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search payments..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full md:w-48 bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm placeholder:text-slate-400 placeholder:font-normal"
            />
          </div>

          <button
            onClick={() => setScreen('collect-fee')}
            className="flex items-center gap-1.5 bg-[#F59E0B] hover:bg-amber-600 text-slate-900 font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-amber-500/10 active:scale-[0.98] text-xs shrink-0"
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
          <span className="text-[10px] font-bold tracking-widest text-blue-200 uppercase">
            {selectedDate === todayString ? "Today's Total Collection" : `Total Collection on ${selectedDate}`}
          </span>
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
        {paymentModesData.map((mode) => {
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
      <section className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/10">
          <div>
            <h4 className="text-base font-bold text-slate-800">
              Payments on {selectedDate === todayString ? "Today" : selectedDate}
            </h4>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Showing payment history logs matching selection.
            </p>
          </div>

          {/* Dynamic Date Picker & Browsing Controls inside the payments card */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1 shadow-sm shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={handlePrevDay}
              className="p-1 hover:bg-slate-105 rounded-lg text-slate-500 transition-colors"
              title="Previous Day"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            <div className="relative flex items-center">
              <Calendar className="h-3.5 w-3.5 text-slate-400 absolute left-2 pointer-events-none" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent pl-7 pr-2.5 py-0.5 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              />
            </div>

            {selectedDate !== todayString && (
              <button
                type="button"
                onClick={handleToday}
                className="px-2 py-0.5 text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-650 font-extrabold rounded-lg transition-colors border border-indigo-100"
                title="Go to Today"
              >
                Today
              </button>
            )}

            <button
              type="button"
              onClick={handleNextDay}
              className="p-1 hover:bg-slate-105 rounded-lg text-slate-500 transition-colors"
              title="Next Day"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase bg-slate-50/50">
                <th className="py-3 px-5">Student</th>
                <th className="py-3 px-5">Class</th>
                <th className="py-3 px-5">Fee Type</th>
                <th className="py-3 px-5">Amount</th>
                <th className="py-3 px-5">Method</th>
                <th className="py-3 px-5">Time</th>
                <th className="py-3 px-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-medium text-slate-750">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    No transactions recorded for this date.
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-slate-800">{tx.studentName}</span>
                        {tx.status === 'RTE' && (
                          <span className="bg-purple-100 text-purple-600 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">RTE</span>
                        )}
                      </div>
                      <span className="text-slate-400 text-[10px] block font-mono">{tx.studentCode}</span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 font-semibold">{tx.classInfo}</td>
                    <td className="py-3.5 px-5 text-slate-600 font-semibold">{tx.feeType}</td>
                    <td className="py-3.5 px-5 font-bold text-slate-800">
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
                    <td className="py-3.5 px-5">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${tx.method === 'ONLINE' || tx.method === 'UPI'
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
                    <td className="py-3.5 px-5 text-slate-400 text-xs font-semibold">{tx.time}</td>
                    <td className="py-3.5 px-5">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${tx.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          : tx.status === 'PARTIAL'
                            ? 'bg-amber-50 text-amber-600 border-amber-100'
                            : 'bg-purple-50 text-purple-600 border-purple-100'
                        }`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Panel */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border-t border-slate-100 p-4">
            <span className="text-xs font-semibold text-slate-500">
              Showing <span className="font-extrabold text-slate-800">{Math.min(filteredTransactions.length, (currentPage - 1) * PAGE_SIZE + 1)}</span> to{' '}
              <span className="font-extrabold text-slate-800">{Math.min(filteredTransactions.length, currentPage * PAGE_SIZE)}</span> of{' '}
              <span className="font-extrabold text-slate-800">{filteredTransactions.length}</span> payments
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                .map((page, index, arr) => {
                  const showEllipsis = index > 0 && page - arr[index - 1] > 1;
                  return (
                    <React.Fragment key={page}>
                      {showEllipsis && <span className="text-slate-400 px-1 text-xs">...</span>}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${currentPage === page
                            ? 'bg-blue-600 border border-blue-600 text-white shadow-md shadow-blue-500/10'
                            : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                })}
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
