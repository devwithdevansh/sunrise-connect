import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../store';
import type { Student, PaymentTransaction } from '../mockData';
import { isPeriodOverdue } from '../utils';
import {
  Search,
  Plus,
  Check,
  X,
  History,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react';

// Build EDU+TERM config dynamically based on academic year (e.g. "2025-26" → first half '25, second half '26)
const buildEduTermConfig = (academicYearName: string) => {
  // Parse year labels: "2025-26" → firstYr = '25', secondYr = '26'
  const parts = academicYearName?.split('-') || [];
  const firstYr = parts[0]?.slice(-2) || '25';
  const secondYr = parts[1]?.slice(-2) || String(Number(firstYr) + 1).padStart(2, '0');
  return [
    { type: 'TERM',      label: 'Term 1', sublabel: 'Due before June',     year: '',        value: 'Term 1' },
    { type: 'EDUCATION', label: 'Jun',    sublabel: '',                     year: firstYr,   value: 'June' },
    { type: 'EDUCATION', label: 'Jul',    sublabel: '',                     year: firstYr,   value: 'July' },
    { type: 'EDUCATION', label: 'Aug',    sublabel: '',                     year: firstYr,   value: 'August' },
    { type: 'EDUCATION', label: 'Sep',    sublabel: '',                     year: firstYr,   value: 'September' },
    { type: 'EDUCATION', label: 'Oct',    sublabel: '',                     year: firstYr,   value: 'October' },
    { type: 'EDUCATION', label: 'Nov',    sublabel: '',                     year: firstYr,   value: 'November' },
    { type: 'TERM',      label: 'Term 2', sublabel: 'Due before December',  year: '',        value: 'Term 2' },
    { type: 'EDUCATION', label: 'Dec',    sublabel: '',                     year: firstYr,   value: 'December' },
    { type: 'EDUCATION', label: 'Jan',    sublabel: '',                     year: secondYr,  value: 'January' },
    { type: 'EDUCATION', label: 'Feb',    sublabel: '',                     year: secondYr,  value: 'February' },
    { type: 'EDUCATION', label: 'Mar',    sublabel: '',                     year: secondYr,  value: 'March' },
    { type: 'EDUCATION', label: 'Apr',    sublabel: '',                     year: secondYr,  value: 'April' },
    { type: 'EDUCATION', label: 'May',    sublabel: '',                     year: secondYr,  value: 'May' },
  ];
};

// Static month config (period values only) — used for transport and general lookups
const ALL_MONTH_VALUES = ['June','July','August','September','October','November','December','January','February','March','April','May'];
const STANDARD_MONTH_PERIODS = new Set(ALL_MONTH_VALUES);

// ── Payment History Sub-Component (Grouped by fee category) ─────
interface TxItem {
  id: string; feeType: string; amount: number; concessionAmount?: number;
  status: string; method: string; remark?: string; date: string; time: string;
}

const CATEGORY_GROUPS = [
  {
    key: 'other',
    label: 'Other Fees',
    dotColor: 'bg-amber-400',
    headerBg: 'bg-amber-50',
    headerBorder: 'border-amber-200',
    headerText: 'text-amber-700',
    match: (ft: string) => !ft.startsWith('Education Fee') && !ft.startsWith('Term Fee') && !ft.startsWith('Transport Fee'),
  },
  {
    key: 'eduTerm',
    label: 'Education & Term Fees',
    dotColor: 'bg-blue-400',
    headerBg: 'bg-blue-50',
    headerBorder: 'border-blue-200',
    headerText: 'text-blue-700',
    match: (ft: string) => ft.startsWith('Education Fee') || ft.startsWith('Term Fee'),
  },
  {
    key: 'transport',
    label: 'Transport Fees',
    dotColor: 'bg-emerald-400',
    headerBg: 'bg-emerald-50',
    headerBorder: 'border-emerald-200',
    headerText: 'text-emerald-700',
    match: (ft: string) => ft.startsWith('Transport Fee'),
  },
] as const;

const PaymentHistoryPanel: React.FC<{
  allTxs: TxItem[];
  totalCollected: number;
  reversePayment: (txId: string) => void;
}> = ({ allTxs, totalCollected, reversePayment }) => {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const methodBadge = (method: string) => {
    if (method === 'CASH') return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (method === 'CHEQUE') return 'bg-purple-50 text-purple-600 border-purple-100';
    if (method === 'ONLINE' || method === 'UPI') return 'bg-blue-50 text-blue-600 border-blue-100';
    if (method === 'CARD') return 'bg-amber-50 text-amber-600 border-amber-100';
    return 'bg-slate-100 text-slate-500 border-slate-200';
  };

  // Categorize transactions into groups
  const grouped: { group: typeof CATEGORY_GROUPS[number]; items: TxItem[] }[] = [];
  for (const group of CATEGORY_GROUPS) {
    const matched = allTxs.filter(tx => group.match(tx.feeType));
    if (matched.length > 0) {
      grouped.push({ group, items: matched });
    }
  }

  return (
    <div className="mt-8 border-t border-slate-100 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-blue-500" />
          <h4 className="text-sm font-extrabold text-slate-800">Fee Collection History</h4>
          <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200">
            {allTxs.length} records
          </span>
        </div>
        {allTxs.length > 0 && (
          <div className="text-xs text-slate-500 font-semibold">
            Total Collected:&nbsp;
            <span className="text-emerald-600 font-extrabold">₹{totalCollected.toLocaleString('en-IN')}</span>
          </div>
        )}
      </div>

      {allTxs.length === 0 ? (
        <div className="bg-slate-50 border border-slate-100 rounded-2xl py-10 text-center">
          <History className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400 font-semibold">No payment history yet</p>
          <p className="text-xs text-slate-300 mt-1">Payments collected will appear here</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {grouped.map(({ group, items }) => {
            const isOpen = expandedGroup === group.key;
            const groupTotal = items.filter(t => t.status !== 'REVERSED').reduce((s, t) => s + t.amount, 0);
            const groupConcession = items.reduce((s, t) => s + (t.concessionAmount || 0), 0);
            const allReversed = items.every(t => t.status === 'REVERSED');

            return (
              <div
                key={group.key}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  allReversed
                    ? 'bg-red-50/30 border-red-100 opacity-60'
                    : isOpen
                    ? `bg-white ${group.headerBorder} shadow-sm ring-1 ring-blue-500/5`
                    : 'bg-white border-slate-100 hover:border-slate-200'
                }`}
              >
                {/* Accordion Header */}
                <button
                  type="button"
                  onClick={() => setExpandedGroup(isOpen ? null : group.key)}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-left gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-2.5 w-2.5 rounded-full ${group.dotColor} shrink-0`}></div>
                    <div className="min-w-0">
                      <p className={`font-bold text-sm ${allReversed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                        {group.label}
                      </p>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {items.length} record{items.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className={`font-extrabold text-base ${allReversed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                        ₹{groupTotal.toLocaleString('en-IN')}
                      </div>
                      {groupConcession > 0 && (
                        <div className="text-[10px] text-purple-500 font-semibold">-₹{groupConcession.toLocaleString('en-IN')} off</div>
                      )}
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                      allReversed ? 'bg-red-50 text-red-500 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                      {allReversed ? 'REVERSED' : 'PAID'}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Table */}
                {isOpen && (
                  <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-slate-400 font-bold uppercase tracking-wider text-[9px] border-b border-slate-200/60">
                          <th className="py-1.5 pr-2">Date</th>
                          <th className="py-1.5 pr-3">Fee</th>
                          <th className="py-1.5 px-2 text-right">Amount</th>
                          <th className="py-1.5 px-2 text-center">Method</th>
                          <th className="py-1.5 px-2 text-center">Status</th>
                          <th className="py-1.5 pl-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {items.map(tx => {
                          const isReversed = tx.status === 'REVERSED';
                          const d = new Date(tx.date);
                          const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                          return (
                            <tr key={tx.id} className="hover:bg-slate-100/50 transition-colors">
                              <td className="py-2 pr-2 text-slate-400 font-semibold whitespace-nowrap">
                                {dateStr}
                              </td>
                              <td className={`py-2 pr-3 font-semibold ${isReversed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                {tx.feeType.split(' - ')[1] || tx.feeType}
                                {tx.remark && <span className="text-slate-400 italic font-normal ml-1">({tx.remark})</span>}
                              </td>
                              <td className={`py-2 px-2 text-right font-bold ${isReversed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                ₹{tx.amount.toLocaleString('en-IN')}
                              </td>
                              <td className="py-2 px-2 text-center">
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${methodBadge(tx.method)} uppercase tracking-wider`}>
                                  {tx.method}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-center">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                                  isReversed ? 'bg-red-50 text-red-500 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                }`}>{tx.status}</span>
                              </td>
                              <td className="py-2 pl-2 text-right">
                                {!isReversed && tx.method !== 'GOVT' ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (window.confirm(`Reverse ₹${tx.amount.toLocaleString('en-IN')} for ${tx.feeType}?\nThis will restore the balance.`)) {
                                        reversePayment(tx.id);
                                      }
                                    }}
                                    className="inline-flex items-center gap-1 text-red-400 hover:text-red-600 hover:bg-red-50 border border-red-100 hover:border-red-200 font-bold px-2 py-1 rounded-lg text-[9px] transition-all"
                                  >
                                    <RotateCcw className="h-2.5 w-2.5" />
                                    Reverse
                                  </button>
                                ) : (
                                  <span className="text-slate-300 text-[9px] italic">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const CollectFee: React.FC = () => {
  const {
    students,
    ledgerEntries,
    transactions,
    recordPayment,
    feeStructures,
    transportFeeStructures,
    academicYears,
    regenerateLedgers,
    addCustomFee,
    selectedStudentIdForFee,
    setSelectedStudentIdForFee,
    reversePayment
  } = useApp();

  // Academic year helpers
  const activeYear = academicYears.find(y => y.isActive);
  const activeYearName = activeYear?.name || '';
  const sortedYears = [...academicYears].sort((a, b) => b.name.localeCompare(a.name)); // newest first

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  // Which academic year is being viewed in the payment panel (defaults to active)
  const [selectedYear, setSelectedYear] = useState<string>(activeYearName);

  // Fee collection form states
  const [feeCategory, setFeeCategory] = useState<'EDUCATION' | 'TRANSPORT' | 'ADMISSION' | 'BAG_KIT' | 'OTHER'>('EDUCATION');
  const [selectedFees, setSelectedFees] = useState<{ category: string; period: string }[]>([]);
  
  interface LineItemConfig {
    paymentAmount: number;
    concessionAmount: number;
    paymentMethod: 'CASH' | 'CHEQUE' | 'ONLINE' | 'CARD' | 'NET BANKING' | 'CONCESSION';
    remark: string;
  }
  const [lineItems, setLineItems] = useState<Record<string, LineItemConfig>>({});

  const [chequeNo, setChequeNo] = useState('');
  const [bankName, setBankName] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [autoSyncSignature, setAutoSyncSignature] = useState<string>('');

  // Custom Fee Modal
  const [isCustomFeeModalOpen, setIsCustomFeeModalOpen] = useState(false);
  const [customFeeName, setCustomFeeName] = useState('');
  const [customFeeAmount, setCustomFeeAmount] = useState('');
  const [isSubmittingCustomFee, setIsSubmittingCustomFee] = useState(false);

  // Sync selectedYear when academicYears loads
  useEffect(() => {
    if (activeYearName && !selectedYear) setSelectedYear(activeYearName);
  }, [activeYearName]);

  // Handle student pre-selection if redirected from Students page
  useEffect(() => {
    if (selectedStudentIdForFee && students.length > 0) {
      const found = students.find(s => s._id === selectedStudentIdForFee || s.id === selectedStudentIdForFee);
      if (found) {
        setSelectedStudent(found);
        setSelectedYear(activeYearName); // reset to active year
        setSelectedStudentIdForFee(null);
      }
    } else if (students.length > 0 && !selectedStudent) {
      setSelectedStudent(students[0]);
    }
  }, [students, selectedStudent, selectedStudentIdForFee, setSelectedStudentIdForFee]);

  // Sync selected student when students list is refreshed
  useEffect(() => {
    if (selectedStudent && students.length > 0) {
      const updated = students.find(s => s._id === selectedStudent._id || s.id === selectedStudent.id);
      if (updated) {
        setSelectedStudent(updated);
      }
    }
  }, [students]);

  // -------------------------------------------------------------------
  // Dynamic fee amounts derived from DB-backed feeStructures
  // -------------------------------------------------------------------
  const studentFeeConfig = useMemo(() => {
    if (!selectedStudent) return { education: 0, term: 0, transport: 0, admission: 0, bagKit: 0 };

    // Find the fee structure for this student's medium + standard
    const fs = feeStructures.find(
      (f) => f.medium === selectedStudent.medium && f.standard === selectedStudent.standard
    );

    const annualFee = fs?.annualFee ?? 0;
    const eduParts = fs?.educationPartCount ?? 12;
    const termParts = fs?.termPartCount ?? 2;
    const totalParts = eduParts + termParts; // 14 total parts

    // Annual fee divided into totalParts equal parts (e.g., 35000/14 = 2500 per part)
    // Both education months AND term fees are equal shares of the annual fee
    const perPart = totalParts > 0 ? Math.round(annualFee / totalParts) : 0;
    const education = perPart;

    // Term fee: use the explicitly stored termFee from DB if it's > 0;
    // otherwise fall back to the same per-part amount (annualFee / totalParts)
    const term = (fs?.termFee !== undefined && fs.termFee > 0) ? fs.termFee : perPart;

    // Use stored admissionFee and bagKitFee (set by admin), fallback 0
    const admission = fs?.admissionFee ?? 0;
    const bagKit = fs?.bagKitFee ?? 0;

    // Transport
    const tfs = transportFeeStructures.find(
      (t) => t.transportType === selectedStudent.transportType
    );
    const transport = tfs?.amount ?? 0;

    return { education, term, transport, admission, bagKit };
  }, [selectedStudent, feeStructures, transportFeeStructures]);

  // --- Dynamic config for selected year ---
  const COMBINED_EDU_TERM_CONFIG = useMemo(() => buildEduTermConfig(selectedYear), [selectedYear]);
  const MONTHS_CONFIG = useMemo(() => COMBINED_EDU_TERM_CONFIG.filter(c => c.type === 'EDUCATION'), [COMBINED_EDU_TERM_CONFIG]);

  // Mid-year transport ledgers: TRANSPORT entries that don't map to a standard month slot, for selected year
  const midYearTransportLedgers = useMemo(() => {
    if (!selectedStudent) return [];
    const sId = selectedStudent._id || selectedStudent.id;
    return ledgerEntries.filter(
      (l) =>
        l.studentId === sId &&
        l.feeType === 'TRANSPORT' &&
        !STANDARD_MONTH_PERIODS.has(l.feePeriod) &&
        (l.academicYear === selectedYear || (!l.academicYear && selectedYear === activeYearName))
    );
  }, [selectedStudent, ledgerEntries, selectedYear, activeYearName, COMBINED_EDU_TERM_CONFIG]);

  // -------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------

  /** Get the standard amount for a month/period regardless of ledger state */
  const getStandardAmount = (category: string, _period: string): number => {
    if (!selectedStudent) return 0;
    if (category === 'EDUCATION') return studentFeeConfig.education;
    if (category === 'TERM') return studentFeeConfig.term;
    if (category === 'TRANSPORT') return studentFeeConfig.transport;
    if (category === 'ADMISSION') return studentFeeConfig.admission;
    if (category === 'BAG_KIT') return studentFeeConfig.bagKit;
    return 0;
  };

  /** What ledger entry exists for this student + category + period — SCOPED to selectedYear */
  const getLedger = (category: string, period: string) => {
    const sId = selectedStudent?._id || selectedStudent?.id;
    // For one-time fees, also match legacy feePeriod names stored in DB
    const legacyPeriods: Record<string, string[]> = {
      ADMISSION: ['One-time', 'Admission'],
      BAG_KIT: ['One-time', 'Bag & Kit'],
    };
    const periodsToMatch = legacyPeriods[category] ?? [period];

    return ledgerEntries.find(
      (l) =>
        (l.studentId === sId) &&
        l.feeType === category &&
        periodsToMatch.includes(l.feePeriod) &&
        // Year scoping: match explicit academicYear OR fall back for legacy entries with no year
        (l.academicYear === selectedYear || (!l.academicYear && selectedYear === activeYearName))
    );
  };

  const STANDARD_TERM_PERIODS = new Set(['Term 1', 'Term 2']);

  // ── Date-gate helpers ────────────────────────────────────────────

  /** Is this period genuinely overdue right now?
   *  Uses period-name based mapping (Term 1 → June 1, Term 2 → Dec 1, etc.)
   *  Past year → always. Current year → only if the period's 1st has arrived. */
  const isOverdue = (_category: string, period: string): boolean => {
    const entry = getLedger(_category, period);
    if (entry?.status === 'PAID') return false;
    return isPeriodOverdue(period, selectedYear, activeYearName);
  };


  /** Amount still due for a period (0 if fully paid) */
  const getDueAmount = (category: string, period: string): number => {
    const entry = getLedger(category, period);
    if (!entry) {
      if (STANDARD_MONTH_PERIODS.has(period) || STANDARD_TERM_PERIODS.has(period) || period === 'One-time') {
        return getStandardAmount(category, period);
      }
      return 0;
    }
    return entry.remainingAmount;
  };

  // -------------------------------------------------------------------
  // Period selection
  // -------------------------------------------------------------------

  const getApplicablePeriods = (config: ReturnType<typeof buildEduTermConfig>) => {
    // For past years, show ALL periods (the year is already over — no admission-month gating)
    if (selectedYear !== activeYearName) return config;
    if (!selectedStudent || !selectedStudent.admissionMonth) return config;
    const allMonths = ['June','July','August','September','October','November','December','January','February','March','April','May'];
    const startIdx = allMonths.indexOf(selectedStudent.admissionMonth);
    if (startIdx <= 0) return config;
    return config.filter(item => {
      if (item.type === 'EDUCATION' || item.type === 'TRANSPORT') {
        return allMonths.indexOf(item.value) >= startIdx;
      }
      if (item.type === 'TERM') {
        if (item.value === 'Term 1') return startIdx <= 5;
        if (item.value === 'Term 2') return true;
      }
      return true;
    });
  };

  const handlePeriodToggle = (category: string, period: string) => {
    const entry = getLedger(category, period);
    // Don't toggle already fully PAID periods
    if (entry && entry.status === 'PAID') return;

    if (category === 'ADMISSION' || category === 'BAG_KIT' || category === 'OTHER') {
      setSelectedFees((prev) => {
        const exists = prev.find((p) => p.category === category && p.period === period);
        if (exists) {
          return prev.filter((p) => !(p.category === category && p.period === period));
        } else {
          return [...prev, { category, period }];
        }
      });
      return;
    }

    // Determine the ordered list for sequential enforcement
    const configList = getApplicablePeriods(category === 'EDUCATION' || category === 'TERM'
      ? COMBINED_EDU_TERM_CONFIG
      : MONTHS_CONFIG);

    const clickedIndex = configList.findIndex(c => c.value === period);

    setSelectedFees((prev) => {
      const isCurrentlySelected = prev.some((p) => p.category === category && p.period === period);
      let newSelections = [...prev];

      if (isCurrentlySelected) {
        // Deselecting: also deselect any unpaid periods AFTER this one in the sequence
        configList.forEach((c, idx) => {
          if (idx >= clickedIndex) {
            const cat = (category === 'EDUCATION' || category === 'TERM') ? c.type : category;
            newSelections = newSelections.filter(p => !(p.category === cat && p.period === c.value));
          }
        });
      } else {
        // Selecting: also select any unpaid periods BEFORE this one in the sequence
        configList.forEach((c, idx) => {
          if (idx <= clickedIndex) {
            const cat = (category === 'EDUCATION' || category === 'TERM') ? c.type : category;
            const checkEntry = getLedger(cat, c.value);
            const isPaid = checkEntry?.status === 'PAID';
            const alreadySelected = newSelections.some(p => p.category === cat && p.period === c.value);

            if (!isPaid && !alreadySelected) {
              newSelections.push({ category: cat, period: c.value });
            }
          }
        });
      }
      return newSelections;
    });
  };

  // Select All Pending = all periods with remaining > 0
  const selectAllPending = () => {
    if (feeCategory === 'EDUCATION') {
      const pending = getApplicablePeriods(COMBINED_EDU_TERM_CONFIG).filter((p) => getDueAmount(p.type, p.value) > 0);
      setSelectedFees((prev) => {
        const otherCategories = prev.filter((p) => p.category !== 'EDUCATION' && p.category !== 'TERM');
        const newSelections = pending.map((p) => ({ category: p.type, period: p.value }));
        return [...otherCategories, ...newSelections];
      });
    } else {
      const periods = getApplicablePeriods(MONTHS_CONFIG).map((m) => m.value);
      const pending = periods.filter((p) => getDueAmount(feeCategory, p) > 0);
      setSelectedFees((prev) => {
        const otherCategories = prev.filter((p) => p.category !== feeCategory);
        const newSelections = pending.map((period) => ({ category: feeCategory, period }));
        return [...otherCategories, ...newSelections];
      });
    }
  };

  const selectNextNMonths = (n: number) => {
    if (feeCategory === 'EDUCATION') {
      const pendingItems = getApplicablePeriods(COMBINED_EDU_TERM_CONFIG).filter(c => getDueAmount(c.type, c.value) > 0);
      const toSelect = pendingItems.slice(0, n);
      setSelectedFees((prev) => {
        const otherCategories = prev.filter((p) => p.category !== 'EDUCATION' && p.category !== 'TERM');
        const newSelections = toSelect.map((p) => ({ category: p.type, period: p.value }));
        return [...otherCategories, ...newSelections];
      });
    } else if (feeCategory === 'TRANSPORT') {
      const periods = getApplicablePeriods(MONTHS_CONFIG).map((m) => m.value);
      const pending = periods.filter((p) => getDueAmount(feeCategory, p) > 0);
      const toSelect = pending.slice(0, n);
      setSelectedFees((prev) => {
        const otherCategories = prev.filter((p) => p.category !== feeCategory);
        const newSelections = toSelect.map((period) => ({ category: feeCategory, period }));
        return [...otherCategories, ...newSelections];
      });
    }
  };

  // -------------------------------------------------------------------
  // Initialize lineItems when selectedFees changes
  // -------------------------------------------------------------------
  useEffect(() => {
    if (!selectedStudent) return;
    setLineItems((prev) => {
      const next: Record<string, LineItemConfig> = {};
      selectedFees.forEach((f) => {
        const key = `${f.category}|${f.period}`;
        if (prev[key]) {
          next[key] = prev[key];
        } else {
          // Initialize new item
          const due = getDueAmount(f.category, f.period);
          next[key] = {
            paymentAmount: due,
            concessionAmount: 0,
            paymentMethod: 'CASH',
            remark: ''
          };
        }
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFees, selectedStudent, ledgerEntries]);

  // Derived totals
  const totalPayingNow = Object.values(lineItems).reduce((sum, item) => sum + item.paymentAmount, 0);

  // -------------------------------------------------------------------
  // Search filter
  // -------------------------------------------------------------------
  const filteredStudents = students.filter(
    (s) =>
      s.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.studentCode ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Student list: due amount = only genuinely overdue (period-based, consistent with store)
  const getStudentDueAmount = (studentId: string) => {
    return ledgerEntries
      .filter((l) => {
        if (l.studentId !== studentId || l.status === 'PAID' || l.remainingAmount <= 0) return false;
        return isPeriodOverdue(l.feePeriod, l.academicYear, activeYearName);
      })
      .reduce((sum, l) => sum + l.remainingAmount, 0);
  };


  const getStudentDueLabel = (student: Student) => {
    const amount = getStudentDueAmount(student._id || student.id);
    if (amount === 0) return { text: 'BALANCE', color: 'text-emerald-600 bg-emerald-50' };
    if (student.status === '2 DUE') return { text: `₹${amount.toLocaleString('en-IN')} DUE (2 MONTHS)`, color: 'text-amber-600 bg-amber-50' };
    if (student.status === '3+ DUE') return { text: `₹${amount.toLocaleString('en-IN')} DUE (3+ MONTHS)`, color: 'text-red-600 bg-red-50' };
    if (amount > 0) return { text: `₹${amount.toLocaleString('en-IN')} DUE`, color: 'text-blue-600 bg-blue-50 font-bold' };
    return { text: 'BALANCE', color: 'text-emerald-600 bg-emerald-50' };
  };

  // -------------------------------------------------------------------
  // Submit
  // -------------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || selectedFees.length === 0) return;

    // Prepare fees to pay
    const lineItemsArray = selectedFees.map((f) => {
      const entry = getLedger(f.category, f.period);
      const key = `${f.category}|${f.period}`;
      const config = lineItems[key];

      let finalRemark = config.remark;
      if (config.paymentMethod === 'CHEQUE' && (chequeNo || bankName)) {
        const chequeInfo = [chequeNo && `No: ${chequeNo}`, bankName && `Bank: ${bankName}`].filter(Boolean).join(', ');
        finalRemark = config.remark ? `${config.remark} (Cheque - ${chequeInfo})` : `Cheque - ${chequeInfo}`;
      }

      return {
        category: f.category,
        period: f.period,
        ledgerId: entry?.id || entry?._id,
        totalAmount: getStandardAmount(f.category, f.period),
        paymentAmount: config.paymentAmount,
        concessionAmount: config.concessionAmount,
        paymentMethod: config.paymentMethod,
        remark: finalRemark
      };
    });

    const feesWithLedger = lineItemsArray.filter(f => f.ledgerId);
    if (feesWithLedger.length === 0) {
      setSuccessMsg('⚠ No valid ledger entries found for selected fees. Please refresh and try again.');
      setTimeout(() => setSuccessMsg(''), 5000);
      return;
    }

    await recordPayment(selectedStudent._id || selectedStudent.id, lineItemsArray);

    setSuccessMsg(`✓ Collected ₹${totalPayingNow.toLocaleString('en-IN')} for ${selectedStudent.studentName}`);
    setSelectedFees([]);
    setLineItems({});
    setChequeNo('');
    setBankName('');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // -------------------------------------------------------------------
  // Auto-Sync Mismatched or Missing Ledgers
  // -------------------------------------------------------------------
  useEffect(() => {
    if (!selectedStudent || isRegenerating) return;

    const fs = feeStructures.find(f => f.medium === selectedStudent.medium && f.standard === selectedStudent.standard);
    const ts = transportFeeStructures.find(t => t.transportType === selectedStudent.transportType);
    const currentSignature = `${selectedStudent._id || selectedStudent.id}-${JSON.stringify(fs || {})}-${JSON.stringify(ts || {})}`;

    if (autoSyncSignature === currentSignature) return;

    let needsSync = false;

    // Check Education/Term
    const eduConfig = getApplicablePeriods(COMBINED_EDU_TERM_CONFIG);
    for (const item of eduConfig) {
      const entry = getLedger(item.type, item.value);
      if (!entry) { needsSync = true; break; }
      if (entry.status === 'PENDING' && !selectedStudent.isRTE && entry.totalAmount !== getStandardAmount(item.type, item.value)) { needsSync = true; break; }
    }

    // Check Transport
    if (!needsSync && selectedStudent.transportType !== 'None') {
      const transConfig = getApplicablePeriods(MONTHS_CONFIG);
      for (const item of transConfig) {
        const entry = getLedger('TRANSPORT', item.value);
        if (!entry) { needsSync = true; break; }
        if (entry.status === 'PENDING' && !selectedStudent.isRTE && entry.totalAmount !== getStandardAmount('TRANSPORT', item.value)) { needsSync = true; break; }
      }
    }

    // Check Admission/Bag Kit
    if (!needsSync && selectedStudent.isNewAdmission) {
      for (const cat of ['ADMISSION', 'BAG_KIT']) {
        const entry = getLedger(cat, 'One-time');
        const stdAmt = getStandardAmount(cat, 'One-time');
        if (!entry && stdAmt > 0) { needsSync = true; break; }
        if (entry && entry.status === 'PENDING' && stdAmt > 0 && entry.totalAmount !== stdAmt) { needsSync = true; break; }
      }
    }

    if (needsSync) {
      setAutoSyncSignature(currentSignature);
      const doSync = async () => {
        setIsRegenerating(true);
        await regenerateLedgers(selectedStudent._id || selectedStudent.id);
        setIsRegenerating(false);
      };
      doSync();
    } else {
      setAutoSyncSignature(currentSignature);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudent, feeStructures, transportFeeStructures, ledgerEntries, isRegenerating, autoSyncSignature]);

  // -------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------
  return (
    <div className="flex-grow flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100 min-h-0 h-screen overflow-hidden">

      {/* ── LEFT: Student Finder ─────────────────────────────── */}
      <section className="w-full md:w-96 p-6 flex flex-col bg-[#FAFBFD] shrink-0">
        <h3 className="text-base font-bold text-slate-800 mb-4">1. Find Student</h3>

        <div className="relative mb-5">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Type student name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:border-blue-500 shadow-sm"
          />
        </div>

        <div className="flex-grow overflow-y-auto space-y-3 pr-1">
          {filteredStudents.length === 0 ? (
            <div className="text-center text-xs text-slate-400 py-10">No students found</div>
          ) : (
            filteredStudents.map((student) => {
              const isSelected = selectedStudent?._id === student._id;
              const dueInfo = getStudentDueLabel(student);
              return (
                <div
                  key={student._id}
                  onClick={() => {
                    setSelectedStudent(student);
                    setSelectedFees([]);
                    setFeeCategory('EDUCATION');
                    setSelectedYear(activeYearName); // reset to current year on student change
                  }}
                  className={`p-4 border rounded-2xl cursor-pointer transition-all duration-200 ${isSelected
                      ? 'bg-blue-50/50 border-blue-500 shadow-sm ring-1 ring-blue-500/20'
                      : 'bg-white border-slate-100 shadow-sm hover:border-slate-200'
                    }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-bold text-slate-800 text-sm">{student.studentName}</h4>
                        {student.isRTE && (
                          <span className="bg-blue-50 text-blue-600 text-[8px] font-extrabold px-1.5 py-0.5 rounded border border-blue-200 uppercase tracking-wider scale-95 origin-left shrink-0">
                            RTE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Std {student.standard} · {student.division} · {student.medium}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                        {student.studentCode}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 ${dueInfo.color}`}>
                      {dueInfo.text}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* ── RIGHT: Payment Details ───────────────────────────── */}
      <section className="flex-grow p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-bold text-slate-800">2. Payment Details</h3>
          <button
            type="button"
            onClick={() => {
              if (selectedStudent) setIsCustomFeeModalOpen(true);
            }}
            disabled={!selectedStudent}
            className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-3.5 w-3.5 stroke-[3]" />
            Add Custom Fee
          </button>
        </div>

        {successMsg && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm py-3 px-4 rounded-xl flex items-center gap-2">
            <Check className="h-4 w-4 bg-emerald-500 text-white rounded-full p-0.5 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        {selectedStudent ? (
          <>
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Student banner + Year Tabs + Category Tabs */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-wrap gap-4 items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Paying For</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <h4 className="text-base font-extrabold text-slate-800">{selectedStudent.studentName}</h4>
                  {selectedStudent.isRTE && (
                    <span className="bg-blue-50 text-blue-600 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200 uppercase tracking-wider">
                      RTE Quota
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Std {selectedStudent.standard}-{selectedStudent.division} · {selectedStudent.medium} Medium · {selectedStudent.parentName}
                </p>
                {selectedStudent.transportType !== 'None' && (
                  <span className="text-[10px] font-bold text-blue-500 mt-1 block">
                    Transport: {selectedStudent.transportType} (₹{studentFeeConfig.transport.toLocaleString('en-IN')}/month)
                  </span>
                )}
              </div>

              <div className="flex bg-slate-200/50 p-0.5 rounded-lg border border-slate-200/20 flex-wrap">
                {(['EDUCATION', 'TRANSPORT', 'ADMISSION', 'BAG_KIT', 'OTHER'] as const)
                  .filter((cat) => {
                    if ((cat === 'ADMISSION' || cat === 'BAG_KIT') && !selectedStudent.isNewAdmission) return false;
                    return true;
                  })
                  .map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFeeCategory(cat)}
                      className={`px-3 py-1.5 rounded-md text-[11px] font-bold tracking-wider uppercase transition-all ${
                        feeCategory === cat ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {cat === 'EDUCATION' ? 'EDUCATION & TERM' : cat === 'BAG_KIT' ? 'BAG & KIT' : cat}
                    </button>
                  ))}
              </div>
            </div>

            {/* ── Academic Year Tabs — shown only when student has past-year dues ── */}
            {(() => {
              const sId = selectedStudent._id || selectedStudent.id;
              const studentYears = [...new Set(
                ledgerEntries
                  .filter(l => (l.studentId === sId) && l.status !== 'PAID' && l.remainingAmount > 0 && l.academicYear)
                  .map(l => l.academicYear!)
              )];
              const hasPastYearDues = studentYears.some(y => y !== activeYearName);
              if (!hasPastYearDues && sortedYears.length <= 1) return null;
              // Show only years with pending ledgers OR the active year
              const yearsToShow = sortedYears.filter(y =>
                y.name === activeYearName || studentYears.includes(y.name)
              );
              if (yearsToShow.length <= 1) return null;
              return (
                <div className="flex gap-2 flex-wrap">
                  {yearsToShow.map(y => {
                    const yearPendingAmt = ledgerEntries
                      .filter(l => l.studentId === sId && l.academicYear === y.name && l.status !== 'PAID' && l.remainingAmount > 0)
                      .reduce((s, l) => s + l.remainingAmount, 0);
                    const isPast = y.name !== activeYearName;
                    const isSelected = selectedYear === y.name;
                    return (
                      <button
                        key={y._id}
                        type="button"
                        onClick={() => { setSelectedYear(y.name); setSelectedFees([]); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all ${
                          isSelected
                            ? isPast
                              ? 'bg-red-600 border-red-600 text-white shadow-md'
                              : 'bg-blue-600 border-blue-600 text-white shadow-md'
                            : isPast
                              ? 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'
                        }`}
                      >
                        {isPast && <span className="text-[10px]">⚠</span>}
                        {y.name}
                        {isPast && yearPendingAmt > 0 && (
                          <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-red-100 text-red-700'
                          }`}>
                            ₹{yearPendingAmt.toLocaleString('en-IN')}
                          </span>
                        )}
                        {!isPast && <span className={`ml-1 text-[9px] ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>Current</span>}
                      </button>
                    );
                  })}
                </div>
              );
            })()}

            {/* ── EDUCATION / TRANSPORT: Full 12-month grid ─────── */}
            {(feeCategory === 'EDUCATION' || feeCategory === 'TRANSPORT') && (() => {
              // Check if this student has missing ledgers for the current tab
              // For transport, skip showing the grid entirely if no transport AND no mid-year ledgers
              const skipTransportGrid = feeCategory === 'TRANSPORT' && selectedStudent.transportType === 'None' && midYearTransportLedgers.length === 0;

              return (
                <div className={`border rounded-xl p-5 border-l-4 ${feeCategory === 'EDUCATION' ? 'border-blue-100 bg-blue-50/30 border-l-blue-500' : 'border-emerald-100 bg-emerald-50/30 border-l-emerald-500'}`}>
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                      <span className={`font-bold flex items-center gap-2 ${feeCategory === 'EDUCATION' ? 'text-blue-700' : 'text-emerald-700'}`}>
                        {feeCategory === 'EDUCATION' ? '📚 Education & Term Fee' : '🚌 Transport Fee'}
                      </span>
                    </div>
                    <span className={`font-extrabold text-lg ${feeCategory === 'EDUCATION' ? 'text-blue-600' : 'text-emerald-600'}`}>
                      {feeCategory === 'EDUCATION' && selectedStudent.isRTE ? (
                        <span className="flex items-center gap-2">
                          <span className="line-through text-slate-400 font-semibold text-sm">
                            ₹{studentFeeConfig.education.toLocaleString('en-IN')}/month
                          </span>
                          <span className="text-[10px] font-extrabold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-200 uppercase tracking-wider">
                            RTE Waived
                          </span>
                        </span>
                      ) : (
                        `₹${(feeCategory === 'EDUCATION'
                          ? studentFeeConfig.education
                          : studentFeeConfig.transport
                        ).toLocaleString('en-IN')}/month`
                      )}
                    </span>
                  </div>

                  {feeCategory === 'EDUCATION' && selectedStudent.isRTE && (
                    <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                      <span className="text-lg leading-none mt-0.5">🎓</span>
                      <div>
                        <h5 className="font-extrabold text-blue-800 text-xs uppercase tracking-wide">RTE Quota Student</h5>
                        <p className="text-xs text-blue-600/90 mt-1 leading-relaxed font-semibold">
                          This student is enrolled under the Right to Education (RTE) quota. Annual tuition and term fees are fully waived/covered.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center mb-4">
                    <p className="text-xs text-slate-500">
                      Select any month(s) — paid months are greyed, due months are highlighted
                    </p>
                    <div className="flex gap-3 text-[10px] uppercase font-bold text-blue-600 shrink-0">
                      <button type="button" onClick={() => selectNextNMonths(1)} className="hover:underline">1 Pay</button>
                      <span>·</span>
                      <button type="button" onClick={() => selectNextNMonths(3)} className="hover:underline">3 Pay</button>
                      <span>·</span>
                      <button type="button" onClick={() => selectNextNMonths(6)} className="hover:underline">6 Pay</button>
                      <span>·</span>
                      <button type="button" onClick={selectAllPending} className="hover:underline">Select All Due</button>
                      <span>·</span>
                      <button type="button" onClick={() => setSelectedFees((prev) => prev.filter(p => feeCategory === 'EDUCATION' ? (p.category !== 'EDUCATION' && p.category !== 'TERM') : p.category !== feeCategory))} className="hover:underline">Clear</button>
                    </div>
                  </div>

                  {/* Auto-syncing banner */}
                  {isRegenerating && !skipTransportGrid && (
                    <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center justify-center gap-2 text-blue-700">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-xs font-semibold">Automatically syncing fee amounts...</span>
                    </div>
                  )}

                  {/* No transport warning */}
                  {feeCategory === 'TRANSPORT' && selectedStudent.transportType === 'None' && midYearTransportLedgers.length === 0 && (
                    <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs font-semibold text-amber-700">
                      This student has no transport subscription. Transport fee does not apply.
                    </div>
                  )}

                  {/* Mid-year transport ledgers (lump-sum, custom period) */}
                  {feeCategory === 'TRANSPORT' && midYearTransportLedgers.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Mid-Year Transport</p>
                      <div className="flex flex-col gap-2">
                        {midYearTransportLedgers.map((ledger) => {
                          const isPaid = ledger.status === 'PAID';
                          const isSelected = selectedFees.some(f => f.category === 'TRANSPORT' && f.period === ledger.feePeriod);
                          return (
                            <button
                              key={ledger._id || ledger.id}
                              type="button"
                              disabled={isPaid}
                              onClick={() => {
                                if (isPaid) return;
                                setSelectedFees(prev => {
                                  const exists = prev.some(f => f.category === 'TRANSPORT' && f.period === ledger.feePeriod);
                                  if (exists) return prev.filter(f => !(f.category === 'TRANSPORT' && f.period === ledger.feePeriod));
                                  return [...prev, { category: 'TRANSPORT', period: ledger.feePeriod }];
                                });
                              }}
                              className={`w-full flex items-center justify-between px-4 py-3 border rounded-xl transition-all ${isPaid
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600 cursor-not-allowed'
                                  : isSelected
                                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                                    : 'bg-amber-50/40 border-amber-300 text-amber-700 hover:border-amber-400'
                                }`}
                            >
                              <div className="flex items-center gap-2">
                                {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                                <span className="text-sm font-bold">{ledger.feePeriod}</span>
                              </div>
                              <span className="text-sm font-extrabold">
                                {isPaid ? 'PAID' : `₹${ledger.remainingAmount.toLocaleString('en-IN')} DUE`}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Standard monthly transport grid — only show if student has active transport subscription */}
                  {feeCategory === 'TRANSPORT' && selectedStudent.transportType === 'None' ? null : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                      {getApplicablePeriods(feeCategory === 'EDUCATION' ? COMBINED_EDU_TERM_CONFIG : MONTHS_CONFIG).map((item) => {
                        const activeCat = feeCategory === 'EDUCATION' ? item.type : feeCategory;
                        const entry = getLedger(activeCat, item.value);
                        const isPaid = entry?.status === 'PAID';
                        const isPending = entry && entry.status !== 'PAID';
                        const isNew = !entry; // no ledger yet
                        const isSelected = selectedFees.some(f => f.category === activeCat && f.period === item.value);
                        const dueAmt = getDueAmount(activeCat, item.value);

                        // Three states for unpaid periods:
                        // 🔴 OVERDUE  = past year OR current year where dueDate ≤ today
                        // 🟡 UPCOMING = current year where dueDate > today (payable in advance)
                        const overdue = !isPaid && isPending && isOverdue(activeCat, item.value);
                        const upcoming = !isPaid && isPending && !overdue;

                        let btnStyle = 'border-slate-200 bg-white text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/30';
                        if (isPaid) {
                          btnStyle = selectedStudent.isRTE && (activeCat === 'EDUCATION' || activeCat === 'TERM')
                            ? 'bg-blue-50 border-blue-200 text-blue-600 cursor-not-allowed'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-600 cursor-not-allowed';
                        } else if (isSelected) {
                          btnStyle = activeCat === 'TERM'
                            ? 'bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-500/20'
                            : 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20';
                        } else if (overdue) {
                          btnStyle = 'border-red-300 text-red-700 bg-red-50/60 hover:border-red-400 hover:bg-red-50';
                        } else if (upcoming) {
                          btnStyle = 'border-amber-200 text-amber-600 bg-amber-50/30 hover:border-amber-300';
                        } else if (isNew) {
                          btnStyle = 'border-slate-200 bg-white text-slate-400 hover:border-blue-300 hover:bg-blue-50/20';
                        }

                        return (
                          <button
                            key={item.value}
                            type="button"
                            disabled={isPaid || isNew || (activeCat === 'TRANSPORT' && selectedStudent.transportType === 'None')}
                            onClick={() => handlePeriodToggle(activeCat, item.value)}
                            className={`border rounded-xl py-2.5 text-center flex flex-col items-center justify-center transition-all relative select-none ${btnStyle} ${activeCat === 'TERM' ? 'col-span-1 md:col-span-2' : ''}`}
                          >
                            {isSelected && <Check className="absolute top-1 right-1 h-2.5 w-2.5 stroke-[3]" />}
                            <span className={`font-bold tracking-wide ${activeCat === 'TERM' ? 'text-sm' : 'text-xs'}`}>{item.label}</span>
                            {item.year ? (
                              <span className="text-[9px] mt-0.5 opacity-70">'{item.year}</span>
                            ) : (
                              <span className="text-[9px] mt-0.5 opacity-70 px-1">{item.sublabel}</span>
                            )}
                            <span className={`text-[8px] font-extrabold uppercase mt-1 tracking-wide ${
                              overdue && !isSelected ? 'text-red-600' : upcoming && !isSelected ? 'text-amber-500' : ''
                            }`}>
                              {isPaid ? (selectedStudent.isRTE && (activeCat === 'EDUCATION' || activeCat === 'TERM') ? 'RTE' : 'PAID') : overdue ? `₹${dueAmt.toLocaleString('en-IN')}` : upcoming ? `₹${dueAmt.toLocaleString('en-IN')}` : isNew ? 'NEW' : ''}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                </div>
              );
            })()}



            {/* ── ADMISSION / BAG_KIT ─────────────────────── */}
            {(feeCategory === 'ADMISSION' || feeCategory === 'BAG_KIT') && (
              <div className="space-y-6">
                {(() => { const l = getLedger(feeCategory, 'One-time'); return l && l.status === 'PAID'; })() && (
                  <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-sm font-bold text-center">
                    {feeCategory === 'ADMISSION' ? 'Admission' : 'Bag & Kit'} fee has already been paid for this student.
                  </div>
                )}
                {/* Auto-syncing banner for one-time fees */}
                {isRegenerating && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center justify-center gap-2 text-blue-700 mb-6">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-xs font-semibold">Automatically syncing fee amounts...</span>
                  </div>
                )}

                <div className={`border rounded-xl p-5 border-l-4 ${feeCategory === 'ADMISSION'
                    ? 'border-orange-100 bg-orange-50/50 border-l-orange-500'
                    : 'border-slate-200 bg-slate-50 border-l-slate-600'
                  }`}>
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                      <span className={`font-bold flex items-center gap-2 ${feeCategory === 'ADMISSION' ? 'text-orange-600' : 'text-slate-700'}`}>
                        {feeCategory === 'ADMISSION' ? '🎓 Admission' : '🎒 Bag & Kit'}
                      </span>
                    </div>
                    <span className={`font-extrabold text-lg ${feeCategory === 'ADMISSION' ? 'text-orange-500' : 'text-slate-700'}`}>
                      ₹{getStandardAmount(feeCategory, 'One-time').toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <label className="text-slate-500 text-sm w-24 text-right">Amount:</label>
                      <input
                        type="number"
                        readOnly
                        className="border border-slate-200 rounded-lg px-3 py-1.5 w-40 bg-white font-bold text-slate-800 outline-none"
                        value={getStandardAmount(feeCategory, 'One-time')}
                      />
                      <span className="text-slate-400 text-sm">(one-time)</span>
                    </div>

                    <div className="flex items-center gap-4 mt-6">
                      <label className="text-slate-500 text-sm w-24 text-right">Action:</label>
                      <button
                        type="button"
                        onClick={() => handlePeriodToggle(feeCategory, 'One-time')}
                        className={`px-4 py-2 rounded-lg font-bold transition-all shadow-sm ${selectedFees.some(f => f.category === feeCategory && f.period === 'One-time')
                            ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                            : 'bg-blue-600 text-white border border-blue-600 hover:bg-blue-700'
                          }`}
                      >
                        {selectedFees.some(f => f.category === feeCategory && f.period === 'One-time')
                          ? 'Remove from Payment'
                          : 'Add to Payment'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── CUSTOM FEES (OTHER) ─────────────────────── */}
            {feeCategory === 'OTHER' && (
              <div className="space-y-4">
                {ledgerEntries
                  .filter(l => (l.studentId === selectedStudent._id || l.studentId === selectedStudent.id) && l.feeType === 'OTHER')
                  .length === 0 ? (
                  <div className="bg-slate-50 border border-slate-200 text-slate-500 p-6 rounded-xl text-center text-sm font-bold">
                    No custom fees found for this student. Click "+ Add Custom Fee" to create one.
                  </div>
                ) : (
                  ledgerEntries
                    .filter(l => (l.studentId === selectedStudent._id || l.studentId === selectedStudent.id) && l.feeType === 'OTHER')
                    .map(ledger => {
                      const isPaid = ledger.status === 'PAID';
                      const isSelected = selectedFees.some(f => f.category === 'OTHER' && f.period === ledger.feePeriod);

                      return (
                        <div key={ledger._id} className="border border-slate-200 bg-white rounded-xl p-5 flex items-center justify-between shadow-sm">
                          <div>
                            <span className="font-bold text-slate-700 flex items-center gap-2">
                              🏷️ {ledger.feePeriod}
                            </span>
                            <span className="text-xs text-slate-400 mt-1 block">
                              Total: ₹{ledger.totalAmount.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className={`font-extrabold text-lg ${isPaid ? 'text-emerald-500' : 'text-amber-500'}`}>
                              {isPaid ? 'PAID' : `₹${ledger.remainingAmount.toLocaleString('en-IN')} DUE`}
                            </span>
                            {!isPaid && (
                              <button
                                type="button"
                                onClick={() => handlePeriodToggle('OTHER', ledger.feePeriod)}
                                className={`px-4 py-2 rounded-lg font-bold transition-all shadow-sm ${isSelected
                                    ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                                    : 'bg-blue-600 text-white border border-blue-600 hover:bg-blue-700'
                                  }`}
                              >
                                {isSelected ? 'Remove' : 'Add to Payment'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            )}

            {/* ── LINE ITEM FEE SUMMARY ─────────────────────── */}
            <div className="mt-8 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-5 py-4">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Fee Summary & Payment</h4>
              </div>

              {selectedFees.length === 0 ? (
                <div className="p-8 text-center text-slate-500 font-semibold text-sm">
                  No fees selected. Please select fees above.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                        <th className="px-4 py-3">Fee Name (Total Due)</th>
                        <th className="px-4 py-3 w-40">Payment (₹)</th>
                        <th className="px-4 py-3 w-32">Concession (₹)</th>
                        <th className="px-4 py-3">Payment Mode</th>
                        <th className="px-4 py-3">Remark</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedFees.map((f) => {
                        const key = `${f.category}|${f.period}`;
                        const due = getDueAmount(f.category, f.period);
                        const config = lineItems[key];
                        if (!config) return null;

                        return (
                          <tr key={key} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-semibold text-slate-700">
                              <div className="flex flex-col">
                                <span>{f.category === 'BAG_KIT' ? 'BAG & KIT' : f.category} - {f.period}</span>
                                <span className="text-xs text-amber-600">Due: ₹{due.toLocaleString('en-IN')}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min="0"
                                value={config.paymentAmount === 0 ? '' : config.paymentAmount}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setLineItems(prev => ({
                                    ...prev,
                                    [key]: { ...prev[key], paymentAmount: val }
                                  }));
                                }}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                placeholder="0"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min="0"
                                value={config.concessionAmount === 0 ? '' : config.concessionAmount}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setLineItems(prev => ({
                                    ...prev,
                                    [key]: { ...prev[key], concessionAmount: val }
                                  }));
                                }}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                placeholder="0"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-4 text-xs font-semibold">
                                {['CASH', 'CHEQUE', 'ONLINE', 'CARD'].map((mode) => (
                                  <label key={mode} className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`mode-${key}`}
                                      value={mode}
                                      checked={config.paymentMethod === mode}
                                      onChange={() => {
                                        setLineItems(prev => ({
                                          ...prev,
                                          [key]: { ...prev[key], paymentMethod: mode as any }
                                        }));
                                      }}
                                      className="accent-blue-600"
                                    />
                                    {mode}
                                  </label>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={config.remark}
                                onChange={(e) => {
                                  setLineItems(prev => ({
                                    ...prev,
                                    [key]: { ...prev[key], remark: e.target.value }
                                  }));
                                }}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                placeholder="Optional remark"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-[#1E3A5F] text-white">
                      <tr>
                        <td className="px-4 py-4 font-bold text-right" colSpan={1}>Total Payable</td>
                        <td className="px-4 py-4 font-extrabold text-lg">₹{totalPayingNow.toLocaleString('en-IN')}</td>
                        <td colSpan={3}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* Global Cheque Info if any line item has CHEQUE selected */}
            {Object.values(lineItems).some(item => item.paymentMethod === 'CHEQUE') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 p-4 bg-purple-50 border border-purple-100 rounded-xl">
                <div>
                  <label className="block text-xs font-bold text-purple-600 uppercase tracking-wide mb-2">Global Cheque No.</label>
                  <input
                    type="text"
                    value={chequeNo}
                    onChange={(e) => setChequeNo(e.target.value)}
                    placeholder="123456"
                    className="w-full bg-white border border-purple-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-purple-600 uppercase tracking-wide mb-2">Global Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="SBI, HDFC..."
                    className="w-full bg-white border border-purple-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 shadow-sm"
                  />
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={selectedFees.length === 0}
              className={`w-full py-3.5 rounded-xl font-bold tracking-wide transition-all text-center flex items-center justify-center gap-2 ${selectedFees.length === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-[#F59E0B] hover:bg-amber-600 text-slate-900 shadow-lg shadow-amber-500/10 hover:scale-[1.01] active:scale-[0.99]'
                }`}
            >
              {selectedFees.length === 0
                ? 'Select a fee above to collect'
                : `Collect Payment of ₹${totalPayingNow.toLocaleString('en-IN')}`}
            </button>

          </form>

          {/* ── PAYMENT HISTORY (Grouped by fee category) ─────── */}
          {selectedStudent && (() => {
            const studentId = selectedStudent._id || selectedStudent.id;
            const studentTxs = transactions
              .filter(tx => tx.studentId === studentId)
              .flatMap((tx): TxItem[] => {
                if (tx.subItems && tx.subItems.length > 0) {
                  return tx.subItems.map(sub => ({
                    id: sub.id || tx.id,
                    feeType: sub.description,
                    amount: sub.amount,
                    concessionAmount: sub.concessionAmount,
                    method: (sub.method as PaymentTransaction['method']) || tx.method,
                    status: sub.status || tx.status,
                    remark: tx.remark,
                    date: tx.date,
                    time: tx.time
                  }));
                }
                return [{
                  id: tx.id,
                  feeType: tx.feeType,
                  amount: tx.amount,
                  concessionAmount: tx.concessionAmount || 0,
                  method: tx.method,
                  status: tx.status,
                  remark: tx.remark,
                  date: tx.date,
                  time: tx.time
                }];
              })
              .sort((a, b) => {
                const dateCompare = b.date.localeCompare(a.date);
                if (dateCompare !== 0) return dateCompare;
                return b.time.localeCompare(a.time);
              });

            const totalCollected = studentTxs
              .filter(tx => tx.status !== 'REVERSED')
              .reduce((sum, tx) => sum + tx.amount, 0);

            return (
              <PaymentHistoryPanel
                allTxs={studentTxs}
                totalCollected={totalCollected}
                reversePayment={reversePayment}
              />
            );
          })()}

          </>
        ) : (
          <div className="text-center text-slate-400 py-20 text-sm">
            Select a student from the left panel to begin
          </div>
        )}
      </section>

      {/* ── CUSTOM FEE MODAL ───────────────────────── */}
      {isCustomFeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                <Plus className="h-5 w-5 text-blue-600" />
                Add Custom Fee
              </h3>
              <button
                type="button"
                onClick={() => setIsCustomFeeModalOpen(false)}
                className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Fee Name / Description
                </label>
                <input
                  type="text"
                  placeholder="e.g., Annual Event, Late Fine, Transport Damage"
                  value={customFeeName}
                  onChange={(e) => setCustomFeeName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  min="1"
                  value={customFeeAmount}
                  onChange={(e) => setCustomFeeAmount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-sm font-semibold"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCustomFeeModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingCustomFee || !customFeeName.trim() || !customFeeAmount || Number(customFeeAmount) <= 0}
                onClick={async () => {
                  if (selectedStudent && customFeeName && customFeeAmount) {
                    setIsSubmittingCustomFee(true);
                    const ok = await addCustomFee(selectedStudent.id || selectedStudent._id || '', customFeeName.trim(), Number(customFeeAmount));
                    setIsSubmittingCustomFee(false);
                    if (ok) {
                      setSuccessMsg(`✓ Custom fee '${customFeeName}' added successfully.`);
                      setIsCustomFeeModalOpen(false);
                      setCustomFeeName('');
                      setCustomFeeAmount('');
                      setFeeCategory('OTHER');
                      setTimeout(() => setSuccessMsg(''), 4000);
                    } else {
                      alert('Failed to add custom fee. Please try again.');
                    }
                  }
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmittingCustomFee ? 'Saving...' : 'Save Fee'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
