import React, { useState, useMemo } from 'react';
import { useApp } from '../store';
import { FileSpreadsheet, Printer, Calendar, Filter, Users, DollarSign, Award, ArrowUpRight, Search } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ReportsProps {
  onPrintReport: (report: { type: string; title: string; data: any }) => void;
}

export const Reports: React.FC<ReportsProps> = ({ onPrintReport }) => {
  const { students, ledgerEntries, transactions } = useApp();
  
  const [activeTab, setActiveTab] = useState<'daily' | 'outstanding' | 'rte'>('daily');
  
  // Daily Collections State
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [dailySearchQuery, setDailySearchQuery] = useState('');

  // Outstanding Dues State
  const [outstandingClassFilter, setOutstandingClassFilter] = useState('All Classes');
  const [outstandingMediumFilter, setOutstandingMediumFilter] = useState('All Mediums');
  const [outstandingSearchQuery, setOutstandingSearchQuery] = useState('');

  // RTE Reconcile State
  const [rteClassFilter, setRteClassFilter] = useState('All Classes');
  const [rteSearchQuery, setRteSearchQuery] = useState('');

  // Available filters from data
  const classes = useMemo(() => {
    const stds = new Set(students.map(s => s.standard));
    return ['All Classes', ...Array.from(stds).sort((a, b) => parseInt(a) - parseInt(b)).map(std => `Class ${std}`)];
  }, [students]);

  const mediums = ['All Mediums', 'English Medium', 'Gujarati Medium'];

  // ==========================================
  // 1. DAILY COLLECTIONS REPORT CALCULATION
  // ==========================================
  const dailyReportData = useMemo(() => {
    // Filter transactions by selected date (YYYY-MM-DD)
    const filteredTxns = transactions.filter(t => {
      if (!t.date || t.status === 'REVERSED') return false; // Ignore reversed txns
      const matchesDate = t.date === selectedDate;
      if (!matchesDate) return false;
      
      if (dailySearchQuery) {
        const q = dailySearchQuery.toLowerCase();
        return (
          t.studentName.toLowerCase().includes(q) ||
          t.studentCode.toLowerCase().includes(q) ||
          t.feeType.toLowerCase().includes(q)
        );
      }
      return true;
    });

    // Summary calculations
    let totalCollected = 0;
    let cashCollected = 0;
    let onlineCollected = 0;
    let chequeCollected = 0;

    filteredTxns.forEach(t => {
      totalCollected += t.amount;
      const method = t.method?.toUpperCase();
      if (method === 'CASH') cashCollected += t.amount;
      else if (method === 'ONLINE') onlineCollected += t.amount;
      else if (method === 'CHEQUE') chequeCollected += t.amount;
    });

    return {
      transactions: filteredTxns,
      totalCollected,
      cashCollected,
      onlineCollected,
      chequeCollected
    };
  }, [transactions, selectedDate, dailySearchQuery]);

  // ==========================================
  // 2. OUTSTANDING DUES REPORT CALCULATION
  // ==========================================
  const outstandingReportData = useMemo(() => {
    // 1. Calculate dues per student from unpaid ledger entries
    const studentDuesMap = new Map<string, { totalDue: number; count: number }>();
    
    ledgerEntries.forEach(l => {
      if (l.status !== 'PAID') {
        const remaining = (l.totalAmount || 0) - (l.paidAmount || 0) - (l.concessionAmount || 0);
        if (remaining > 0) {
          const prev = studentDuesMap.get(l.studentId) || { totalDue: 0, count: 0 };
          studentDuesMap.set(l.studentId, {
            totalDue: prev.totalDue + remaining,
            count: prev.count + 1
          });
        }
      }
    });

    // 2. Map back to students with filters
    const list = students
      .filter(s => {
        // Active status
        if (!s.isActive) return false;

        // Class Filter
        if (outstandingClassFilter !== 'All Classes') {
          const std = outstandingClassFilter.replace('Class ', '');
          if (s.standard !== std) return false;
        }

        // Medium Filter
        if (outstandingMediumFilter !== 'All Mediums') {
          const med = outstandingMediumFilter.replace(' Medium', '');
          if (s.medium !== med) return false;
        }

        // Search Filter
        if (outstandingSearchQuery) {
          const q = outstandingSearchQuery.toLowerCase();
          return (
            s.studentName.toLowerCase().includes(q) ||
            s.studentCode.toLowerCase().includes(q) ||
            s.parentMobile.includes(q)
          );
        }

        return true;
      })
      .map(s => {
        const dues = studentDuesMap.get(s.id) || { totalDue: 0, count: 0 };
        return {
          id: s.id,
          studentCode: s.studentCode,
          studentName: s.studentName,
          classInfo: `Class ${s.standard} - ${s.division} (${s.medium})`,
          parentName: s.parentName,
          parentMobile: s.parentMobile,
          overdueCount: dues.count,
          totalDue: dues.totalDue
        };
      })
      .filter(s => s.totalDue > 0) // Only show students with actual dues
      .sort((a, b) => b.totalDue - a.totalDue);

    // Dues Buckets
    let oneDueCount = 0;
    let twoDueCount = 0;
    let threePlusDueCount = 0;
    let totalOutstandingAmount = 0;

    list.forEach(s => {
      totalOutstandingAmount += s.totalDue;
      if (s.overdueCount === 1) oneDueCount++;
      else if (s.overdueCount === 2) twoDueCount++;
      else if (s.overdueCount >= 3) threePlusDueCount++;
    });

    return {
      students: list,
      totalOutstandingAmount,
      studentCount: list.length,
      oneDueCount,
      twoDueCount,
      threePlusDueCount
    };
  }, [students, ledgerEntries, outstandingClassFilter, outstandingMediumFilter, outstandingSearchQuery]);

  // ==========================================
  // 3. RTE RECONCILE REPORT CALCULATION
  // ==========================================
  const rteReportData = useMemo(() => {
    // 1. Calculate total concession (exempted fees) for RTE students
    const studentExemptionsMap = new Map<string, number>();

    ledgerEntries.forEach(l => {
      if (l.concessionAmount > 0) {
        const prev = studentExemptionsMap.get(l.studentId) || 0;
        studentExemptionsMap.set(l.studentId, prev + l.concessionAmount);
      }
    });

    const list = students
      .filter(s => {
        if (!s.isRTE) return false;

        // Class Filter
        if (rteClassFilter !== 'All Classes') {
          const std = rteClassFilter.replace('Class ', '');
          if (s.standard !== std) return false;
        }

        // Search Filter
        if (rteSearchQuery) {
          const q = rteSearchQuery.toLowerCase();
          return (
            s.studentName.toLowerCase().includes(q) ||
            s.studentCode.toLowerCase().includes(q) ||
            s.parentMobile.includes(q)
          );
        }

        return true;
      })
      .map(s => {
        const exemptedAmount = studentExemptionsMap.get(s.id) || 0;
        return {
          id: s.id,
          studentCode: s.studentCode,
          studentName: s.studentName,
          classInfo: `Class ${s.standard} - ${s.division} (${s.medium})`,
          parentName: s.parentName,
          parentMobile: s.parentMobile,
          exemptedAmount: exemptedAmount
        };
      })
      .sort((a, b) => b.exemptedAmount - a.exemptedAmount);

    const totalExemptedAmount = list.reduce((sum, item) => sum + item.exemptedAmount, 0);

    return {
      students: list,
      totalExemptedAmount,
      studentCount: list.length
    };
  }, [students, ledgerEntries, rteClassFilter, rteSearchQuery]);

  // ==========================================
  // EXCEL EXPORTS USING XLSX LIBRARY
  // ==========================================
  const exportDailyExcel = () => {
    const data = dailyReportData.transactions.map((t, idx) => ({
      'S.No': idx + 1,
      'Student Code': t.studentCode,
      'Student Name': t.studentName,
      'Class Details': t.classInfo,
      'Fee Description': t.feeType.replace(/\n/g, ', '),
      'Payment Method': t.method,
      'Time': t.time,
      'Amount (₹)': t.amount,
      'Remarks': t.remark || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Fit column widths
    const maxLens = [{ wch: 6 }, { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 30 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 25 }];
    worksheet['!cols'] = maxLens;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Collections");
    XLSX.writeFile(workbook, `daily_collections_${selectedDate}.xlsx`);
  };

  const exportOutstandingExcel = () => {
    const data = outstandingReportData.students.map((s, idx) => ({
      'S.No': idx + 1,
      'Student Code': s.studentCode,
      'Student Name': s.studentName,
      'Class Details': s.classInfo,
      'Parent Name': s.parentName,
      'Parent Mobile': s.parentMobile,
      'Overdue Ledger Count': s.overdueCount,
      'Total Outstanding (₹)': s.totalDue
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet['!cols'] = [{ wch: 6 }, { wch: 15 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 20 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Outstanding Dues");
    XLSX.writeFile(workbook, `outstanding_dues_report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportRteExcel = () => {
    const data = rteReportData.students.map((s, idx) => ({
      'S.No': idx + 1,
      'Student Code': s.studentCode,
      'Student Name': s.studentName,
      'Class Details': s.classInfo,
      'Parent Name': s.parentName,
      'Parent Mobile': s.parentMobile,
      'Exempted Tuition Fee (₹)': s.exemptedAmount
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet['!cols'] = [{ wch: 6 }, { wch: 15 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 22 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "RTE Reimbursements");
    XLSX.writeFile(workbook, `rte_exemption_sheet_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Reports & Analytics</h2>
          <p className="text-xs font-semibold text-slate-400">Generate collections audits, class dues trackers, and government RTE reconcile statements</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'daily' && (
            <>
              <button
                onClick={exportDailyExcel}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 border border-emerald-100 transition-all active:scale-[0.98]"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Export Excel</span>
              </button>
              <button
                onClick={() => onPrintReport({ type: 'daily-collections', title: `Daily Collections Report - ${selectedDate}`, data: dailyReportData })}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all active:scale-[0.98]"
              >
                <Printer className="h-4 w-4" />
                <span>Print PDF</span>
              </button>
            </>
          )}
          {activeTab === 'outstanding' && (
            <>
              <button
                onClick={exportOutstandingExcel}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 border border-emerald-100 transition-all active:scale-[0.98]"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Export Excel</span>
              </button>
              <button
                onClick={() => onPrintReport({ type: 'outstanding-dues', title: 'Outstanding Due Balance Report', data: outstandingReportData })}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all active:scale-[0.98]"
              >
                <Printer className="h-4 w-4" />
                <span>Print PDF</span>
              </button>
            </>
          )}
          {activeTab === 'rte' && (
            <>
              <button
                onClick={exportRteExcel}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 border border-emerald-100 transition-all active:scale-[0.98]"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Export Excel</span>
              </button>
              <button
                onClick={() => onPrintReport({ type: 'rte-reconcile', title: 'RTE Quota Reconcile Sheet', data: rteReportData })}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all active:scale-[0.98]"
              >
                <Printer className="h-4 w-4" />
                <span>Print PDF</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 gap-6">
        <button
          onClick={() => setActiveTab('daily')}
          className={`pb-3 font-bold text-sm flex items-center gap-2 transition-all border-b-2 -mb-[2px] ${
            activeTab === 'daily'
              ? 'border-amber-500 text-slate-800'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Daily Collections</span>
        </button>
        <button
          onClick={() => setActiveTab('outstanding')}
          className={`pb-3 font-bold text-sm flex items-center gap-2 transition-all border-b-2 -mb-[2px] ${
            activeTab === 'outstanding'
              ? 'border-amber-500 text-slate-800'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Outstanding Dues</span>
        </button>
        <button
          onClick={() => setActiveTab('rte')}
          className={`pb-3 font-bold text-sm flex items-center gap-2 transition-all border-b-2 -mb-[2px] ${
            activeTab === 'rte'
              ? 'border-amber-500 text-slate-800'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Award className="h-4 w-4" />
          <span>RTE Reconcile</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. DAILY COLLECTIONS TAB */}
      {/* ======================================================== */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center gap-4 animate-fadeIn">
              <div className="bg-amber-50 text-amber-500 p-3 rounded-xl">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Total Collections</span>
                <h3 className="text-xl font-bold text-slate-800">₹{dailyReportData.totalCollected.toLocaleString()}</h3>
              </div>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center gap-4 animate-fadeIn">
              <div className="bg-emerald-50 text-emerald-500 p-3 rounded-xl">
                <ArrowUpRight className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Cash Payments</span>
                <h3 className="text-xl font-bold text-slate-800">₹{dailyReportData.cashCollected.toLocaleString()}</h3>
              </div>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center gap-4 animate-fadeIn">
              <div className="bg-blue-50 text-blue-500 p-3 rounded-xl">
                <ArrowUpRight className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Online Transfers</span>
                <h3 className="text-xl font-bold text-slate-800">₹{dailyReportData.onlineCollected.toLocaleString()}</h3>
              </div>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center gap-4 animate-fadeIn">
              <div className="bg-purple-50 text-purple-500 p-3 rounded-xl">
                <ArrowUpRight className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Cheque Deposits</span>
                <h3 className="text-xl font-bold text-slate-800">₹{dailyReportData.chequeCollected.toLocaleString()}</h3>
              </div>
            </div>
          </div>

          {/* Filters Panel */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search student or code..."
                  value={dailySearchQuery}
                  onChange={(e) => setDailySearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-800 focus:outline-none focus:border-amber-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Calendar className="h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-50 border border-slate-150 rounded-xl py-2 px-3 text-xs text-slate-800 font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="py-4 px-6">Student Info</th>
                    <th className="py-4 px-6">Fee Description</th>
                    <th className="py-4 px-6">Method</th>
                    <th className="py-4 px-6">Time</th>
                    <th className="py-4 px-6 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {dailyReportData.transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 font-semibold">
                        No collections recorded on this date matching the criteria.
                      </td>
                    </tr>
                  ) : (
                    dailyReportData.transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-800">{t.studentName}</div>
                          <div className="text-[10px] text-slate-450 font-semibold">{t.studentCode} | {t.classInfo}</div>
                        </td>
                        <td className="py-4 px-6 whitespace-pre-line text-slate-500 font-medium">{t.feeType}</td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            t.method?.toUpperCase() === 'CASH' ? 'bg-emerald-50 text-emerald-600' :
                            t.method?.toUpperCase() === 'ONLINE' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                          }`}>
                            {t.method}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-400 font-semibold">{t.time}</td>
                        <td className="py-4 px-6 text-right font-extrabold text-slate-800">₹{t.amount.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. OUTSTANDING DUES TAB */}
      {/* ======================================================== */}
      {activeTab === 'outstanding' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center gap-4 animate-fadeIn">
              <div className="bg-red-50 text-red-500 p-3 rounded-xl">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Total Outstanding</span>
                <h3 className="text-xl font-bold text-slate-800">₹{outstandingReportData.totalOutstandingAmount.toLocaleString()}</h3>
              </div>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center gap-4 animate-fadeIn">
              <div className="bg-slate-50 text-slate-500 p-3 rounded-xl">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Students with Dues</span>
                <h3 className="text-xl font-bold text-slate-800">{outstandingReportData.studentCount} Students</h3>
              </div>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center gap-4 animate-fadeIn">
              <div className="bg-amber-50 text-amber-500 p-3 rounded-xl">
                <Filter className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Avg. Due Per Student</span>
                <h3 className="text-xl font-bold text-slate-800">
                  ₹{outstandingReportData.studentCount > 0
                    ? Math.round(outstandingReportData.totalOutstandingAmount / outstandingReportData.studentCount).toLocaleString()
                    : 0}
                </h3>
              </div>
            </div>
            {/* Visual Mini Chart */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col justify-center animate-fadeIn">
              <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 mb-2">Dues Aging (Overdue Months)</span>
              <div className="flex items-end gap-3 h-10">
                <div className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-amber-400 rounded-t-sm" 
                    style={{ 
                      height: `${outstandingReportData.studentCount > 0 ? (outstandingReportData.oneDueCount / outstandingReportData.studentCount) * 100 : 0}%`,
                      minHeight: outstandingReportData.oneDueCount > 0 ? '4px' : '0px'
                    }}
                  ></div>
                  <span className="text-[8px] text-slate-400 font-bold mt-1">1M ({outstandingReportData.oneDueCount})</span>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-orange-400 rounded-t-sm" 
                    style={{ 
                      height: `${outstandingReportData.studentCount > 0 ? (outstandingReportData.twoDueCount / outstandingReportData.studentCount) * 100 : 0}%`,
                      minHeight: outstandingReportData.twoDueCount > 0 ? '4px' : '0px'
                    }}
                  ></div>
                  <span className="text-[8px] text-slate-400 font-bold mt-1">2M ({outstandingReportData.twoDueCount})</span>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-red-400 rounded-t-sm" 
                    style={{ 
                      height: `${outstandingReportData.studentCount > 0 ? (outstandingReportData.threePlusDueCount / outstandingReportData.studentCount) * 100 : 0}%`,
                      minHeight: outstandingReportData.threePlusDueCount > 0 ? '4px' : '0px'
                    }}
                  ></div>
                  <span className="text-[8px] text-slate-400 font-bold mt-1">3M+ ({outstandingReportData.threePlusDueCount})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Filters Panel */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search student name/code..."
                value={outstandingSearchQuery}
                onChange={(e) => setOutstandingSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-150 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-800 focus:outline-none focus:border-amber-500 transition-all placeholder:text-slate-400"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <select
                value={outstandingClassFilter}
                onChange={(e) => setOutstandingClassFilter(e.target.value)}
                className="bg-slate-50 border border-slate-150 rounded-xl py-2 px-3 text-xs text-slate-800 font-bold focus:outline-none focus:border-amber-500 w-full sm:w-auto"
              >
                {classes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                value={outstandingMediumFilter}
                onChange={(e) => setOutstandingMediumFilter(e.target.value)}
                className="bg-slate-50 border border-slate-150 rounded-xl py-2 px-3 text-xs text-slate-800 font-bold focus:outline-none focus:border-amber-500 w-full sm:w-auto"
              >
                {mediums.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="py-4 px-6">Student Info</th>
                    <th className="py-4 px-6">Parent Info</th>
                    <th className="py-4 px-6">Overdue Items</th>
                    <th className="py-4 px-6 text-right">Outstanding Dues</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {outstandingReportData.students.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 font-semibold">
                        No outstanding dues found matching the filters.
                      </td>
                    </tr>
                  ) : (
                    outstandingReportData.students.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-800">{s.studentName}</div>
                          <div className="text-[10px] text-slate-450 font-semibold">{s.studentCode} | {s.classInfo}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-semibold text-slate-650">{s.parentName}</div>
                          <div className="text-[10px] text-slate-400 font-bold">{s.parentMobile}</div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                            s.overdueCount >= 3 ? 'bg-red-50 text-red-650' :
                            s.overdueCount === 2 ? 'bg-orange-50 text-orange-655' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {s.overdueCount} Months Overdue
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right font-extrabold text-red-500">₹{s.totalDue.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. RTE RECONCILE TAB */}
      {/* ======================================================== */}
      {activeTab === 'rte' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center gap-4 animate-fadeIn">
              <div className="bg-indigo-50 text-indigo-500 p-3 rounded-xl">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Total RTE Enrolled</span>
                <h3 className="text-xl font-bold text-slate-800">{rteReportData.studentCount} Students</h3>
              </div>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center gap-4 animate-fadeIn">
              <div className="bg-emerald-50 text-emerald-500 p-3 rounded-xl">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Total Exempted Tuition Fees</span>
                <h3 className="text-xl font-bold text-slate-800">₹{rteReportData.totalExemptedAmount.toLocaleString()}</h3>
              </div>
            </div>
          </div>

          {/* Filters Panel */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search RTE student name/code..."
                value={rteSearchQuery}
                onChange={(e) => setRteSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-150 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-800 focus:outline-none focus:border-amber-500 transition-all placeholder:text-slate-400"
              />
            </div>
            <div className="w-full sm:w-auto">
              <select
                value={rteClassFilter}
                onChange={(e) => setRteClassFilter(e.target.value)}
                className="bg-slate-50 border border-slate-150 rounded-xl py-2 px-3 text-xs text-slate-800 font-bold focus:outline-none focus:border-amber-500 w-full"
              >
                {classes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="py-4 px-6">Student Info</th>
                    <th className="py-4 px-6">Parent Info</th>
                    <th className="py-4 px-6">Exemption Status</th>
                    <th className="py-4 px-6 text-right">Total Exempted Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {rteReportData.students.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 font-semibold">
                        No RTE students found matching the filter.
                      </td>
                    </tr>
                  ) : (
                    rteReportData.students.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-800">{s.studentName}</div>
                          <div className="text-[10px] text-slate-450 font-semibold">{s.studentCode} | {s.classInfo}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-semibold text-slate-655">{s.parentName}</div>
                          <div className="text-[10px] text-slate-400 font-bold">{s.parentMobile}</div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-650">
                            100% RTE Exempted
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right font-extrabold text-indigo-600">₹{s.exemptedAmount.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
