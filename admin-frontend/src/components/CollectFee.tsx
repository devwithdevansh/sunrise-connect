import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../store';
import type { Student } from '../mockData';
import {
  Search,
  Plus,
  Coins,
  FileText,
  CreditCard,
  Smartphone,
  Globe,
  Check,
  X
} from 'lucide-react';

const COMBINED_EDU_TERM_CONFIG = [
  { type: 'TERM', label: 'Term 1', sublabel: 'Due before June', year: '', value: 'Term 1' },
  { type: 'EDUCATION', label: 'Jun', year: '26', value: 'June' },
  { type: 'EDUCATION', label: 'Jul', year: '26', value: 'July' },
  { type: 'EDUCATION', label: 'Aug', year: '26', value: 'August' },
  { type: 'EDUCATION', label: 'Sep', year: '26', value: 'September' },
  { type: 'EDUCATION', label: 'Oct', year: '26', value: 'October' },
  { type: 'EDUCATION', label: 'Nov', year: '26', value: 'November' },
  { type: 'TERM', label: 'Term 2', sublabel: 'Due before December', year: '', value: 'Term 2' },
  { type: 'EDUCATION', label: 'Dec', year: '26', value: 'December' },
  { type: 'EDUCATION', label: 'Jan', year: '27', value: 'January' },
  { type: 'EDUCATION', label: 'Feb', year: '27', value: 'February' },
  { type: 'EDUCATION', label: 'Mar', year: '27', value: 'March' },
  { type: 'EDUCATION', label: 'Apr', year: '27', value: 'April' },
  { type: 'EDUCATION', label: 'May', year: '27', value: 'May' },
];

const MONTHS_CONFIG = COMBINED_EDU_TERM_CONFIG.filter(c => c.type === 'EDUCATION');
const STANDARD_MONTH_PERIODS = new Set(MONTHS_CONFIG.map(m => m.value));

export const CollectFee: React.FC = () => {
  const { students, ledgerEntries, recordPayment, feeStructures, transportFeeStructures, regenerateLedgers, addCustomFee } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Fee collection form states
  const [feeCategory, setFeeCategory] = useState<'EDUCATION' | 'TRANSPORT' | 'ADMISSION' | 'BAG_KIT' | 'OTHER'>('EDUCATION');
  const [selectedFees, setSelectedFees] = useState<{ category: string; period: string }[]>([]);
  const [concessionType, setConcessionType] = useState<'None' | 'Fixed' | 'Percentage'>('None');
  const [concessionVal, setConcessionVal] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CHEQUE' | 'ONLINE' | 'CARD' | 'NET BANKING'>('CASH');
  const [chequeNo, setChequeNo] = useState('');
  const [bankName, setBankName] = useState('');
  const [payingNow, setPayingNow] = useState(0);
  const [remark, setRemark] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Custom Fee Modal
  const [isCustomFeeModalOpen, setIsCustomFeeModalOpen] = useState(false);
  const [customFeeName, setCustomFeeName] = useState('');
  const [customFeeAmount, setCustomFeeAmount] = useState('');
  const [isSubmittingCustomFee, setIsSubmittingCustomFee] = useState(false);

  // Default select first student
  useEffect(() => {
    if (students.length > 0 && !selectedStudent) {
      setSelectedStudent(students[0]);
    }
  }, [students, selectedStudent]);

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
    const education = totalParts > 0 ? Math.round(annualFee / totalParts) : 0;

    // Use stored termFee (set by admin), fallback 0
    const term = fs?.termFee ?? 0;

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

  // Mid-year transport ledgers: TRANSPORT entries that don't map to a standard month slot
  const midYearTransportLedgers = useMemo(() => {
    if (!selectedStudent) return [];
    const sId = selectedStudent._id || selectedStudent.id;
    return ledgerEntries.filter(
      (l) =>
        l.studentId === sId &&
        l.feeType === 'TRANSPORT' &&
        !STANDARD_MONTH_PERIODS.has(l.feePeriod)
    );
  }, [selectedStudent, ledgerEntries]);

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

  /** What ledger entry exists for this student + category + period (any status) */
  const getLedger = (category: string, period: string) => {
    const sId = selectedStudent?._id || selectedStudent?.id;
    // For one-time fees, also match legacy feePeriod names stored in DB
    const legacyPeriods: Record<string, string[]> = {
      ADMISSION: ['One-time', 'Admission'],
      BAG_KIT: ['One-time', 'Bag & Kit'],
    };
    const periodsToMatch = legacyPeriods[category]
      ? legacyPeriods[category]
      : [period];

    return ledgerEntries.find(
      (l) =>
        (l.studentId === sId) &&
        l.feeType === category &&
        periodsToMatch.includes(l.feePeriod)
    );
  };

  /** Amount still due for a period (0 if fully paid or no ledger = fresh) */
  const getDueAmount = (category: string, period: string): number => {
    const entry = getLedger(category, period);
    // For mid-year / one-time entries the ledger IS the source of truth — never fall back to standard amount
    if (!entry) {
      // Only fall back for standard month slots
      if (STANDARD_MONTH_PERIODS.has(period) || period === 'One-time') {
        return getStandardAmount(category, period);
      }
      return 0;
    }
    return entry.remainingAmount;
  };

  // -------------------------------------------------------------------
  // Period selection
  // -------------------------------------------------------------------

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
    const configList = (category === 'EDUCATION' || category === 'TERM')
      ? COMBINED_EDU_TERM_CONFIG
      : MONTHS_CONFIG;

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
      const pending = COMBINED_EDU_TERM_CONFIG.filter((p) => getDueAmount(p.type, p.value) > 0);
      setSelectedFees((prev) => {
        const otherCategories = prev.filter((p) => p.category !== 'EDUCATION' && p.category !== 'TERM');
        const newSelections = pending.map((p) => ({ category: p.type, period: p.value }));
        return [...otherCategories, ...newSelections];
      });
    } else {
      const periods = MONTHS_CONFIG.map((m) => m.value);
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
      const pendingItems = COMBINED_EDU_TERM_CONFIG.filter(c => getDueAmount(c.type, c.value) > 0);
      const toSelect = pendingItems.slice(0, n);
      setSelectedFees((prev) => {
        const otherCategories = prev.filter((p) => p.category !== 'EDUCATION' && p.category !== 'TERM');
        const newSelections = toSelect.map((p) => ({ category: p.type, period: p.value }));
        return [...otherCategories, ...newSelections];
      });
    } else if (feeCategory === 'TRANSPORT') {
      const periods = MONTHS_CONFIG.map((m) => m.value);
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
  // Auto-calculate payingNow from selected fees
  // -------------------------------------------------------------------
  useEffect(() => {
    if (!selectedStudent) return;
    const rawSum = selectedFees.reduce((sum, f) => sum + getDueAmount(f.category, f.period), 0);
    let total = rawSum;
    if (concessionType === 'Fixed') total = Math.max(0, rawSum - concessionVal);
    else if (concessionType === 'Percentage') total = Math.max(0, rawSum - (rawSum * concessionVal) / 100);
    setPayingNow(Math.round(total));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFees, selectedStudent, concessionType, concessionVal, ledgerEntries]);

  // -------------------------------------------------------------------
  // Search filter
  // -------------------------------------------------------------------
  const filteredStudents = students.filter(
    (s) =>
      s.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.studentCode ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStudentDueAmount = (studentId: string) =>
    ledgerEntries
      .filter((l) => l.studentId === studentId && l.status !== 'PAID')
      .reduce((sum, l) => sum + l.remainingAmount, 0);

  const getStudentDueLabel = (student: Student) => {
    const amount = getStudentDueAmount(student._id || student.id);
    if (amount === 0) return { text: 'BALANCE', color: 'text-emerald-600 bg-emerald-50' };
    if (student.status === '2 DUE') return { text: `₹${amount.toLocaleString('en-IN')} DUE (2 MONTHS)`, color: 'text-amber-600 bg-amber-50' };
    if (student.status === '3+ DUE') return { text: `₹${amount.toLocaleString('en-IN')} DUE (3+ MONTHS)`, color: 'text-red-600 bg-red-50' };
    return { text: `₹${amount.toLocaleString('en-IN')} DUE`, color: 'text-blue-600 bg-blue-50 font-bold' };
  };

  // -------------------------------------------------------------------
  // Submit
  // -------------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || selectedFees.length === 0) return;

    // Prepare fees to pay — only include entries backed by an actual ledger ID
    const feesToPay = selectedFees.map((f) => {
      const entry = getLedger(f.category, f.period);
      return {
        category: f.category,
        period: f.period,
        ledgerId: entry?.id || entry?._id,
        totalAmount: getStandardAmount(f.category, f.period)
      };
    });

    const feesWithLedger = feesToPay.filter(f => f.ledgerId);
    if (feesWithLedger.length === 0) {
      setSuccessMsg('⚠ No valid ledger entries found for selected fees. Please refresh and try again.');
      setTimeout(() => setSuccessMsg(''), 5000);
      return;
    }

    let finalConcession = 0;
    const rawSum = selectedFees.reduce((sum, f) => sum + getDueAmount(f.category, f.period), 0);
    if (concessionType === 'Fixed') finalConcession = concessionVal;
    else if (concessionType === 'Percentage') finalConcession = (rawSum * concessionVal) / 100;

    let finalRemark = remark;
    if (paymentMethod === 'CHEQUE' && (chequeNo || bankName)) {
      const chequeInfo = [chequeNo && `No: ${chequeNo}`, bankName && `Bank: ${bankName}`].filter(Boolean).join(', ');
      finalRemark = remark ? `${remark} (Cheque - ${chequeInfo})` : `Cheque - ${chequeInfo}`;
    }

    await recordPayment(selectedStudent._id || selectedStudent.id, feesToPay, payingNow, paymentMethod, finalConcession, finalRemark);

    setSuccessMsg(`✓ Collected ₹${payingNow.toLocaleString('en-IN')} for ${selectedStudent.studentName}`);
    setSelectedFees([]);
    setRemark('');
    setChequeNo('');
    setBankName('');
    setConcessionVal(0);
    setConcessionType('None');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // -------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------
  return (
    <div className="flex-grow flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100 min-h-0">

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
                  }}
                  className={`p-4 border rounded-2xl cursor-pointer transition-all duration-200 ${isSelected
                      ? 'bg-blue-50/50 border-blue-500 shadow-sm ring-1 ring-blue-500/20'
                      : 'bg-white border-slate-100 shadow-sm hover:border-slate-200'
                    }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{student.studentName}</h4>
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
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Student banner + Category Tabs */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-wrap gap-4 items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Paying For</span>
                <h4 className="text-base font-extrabold text-slate-800 mt-0.5">{selectedStudent.studentName}</h4>
                <p className="text-xs text-slate-500">
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
                    if ((cat === 'ADMISSION' || cat === 'BAG_KIT') && !selectedStudent.isNewAdmission) {
                      return false;
                    }
                    return true;
                  })
                  .map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setFeeCategory(cat);
                      }}
                      className={`px-3 py-1.5 rounded-md text-[11px] font-bold tracking-wider uppercase transition-all ${feeCategory === cat
                          ? 'bg-white text-slate-800 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                      {cat === 'EDUCATION' ? 'EDUCATION & TERM' : cat === 'BAG_KIT' ? 'BAG & KIT' : cat}
                    </button>
                  ))}
              </div>
            </div>

            {/* ── EDUCATION / TRANSPORT: Full 12-month grid ─────── */}
            {(feeCategory === 'EDUCATION' || feeCategory === 'TRANSPORT') && (() => {
              // Check if this student has missing ledgers for the current tab
              const configToCheck = feeCategory === 'EDUCATION' ? COMBINED_EDU_TERM_CONFIG : MONTHS_CONFIG;
              const hasMissing = configToCheck.some(item => {
                const cat = feeCategory === 'EDUCATION' ? item.type : feeCategory;
                return !getLedger(cat, item.value);
              });
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
                      ₹{(feeCategory === 'EDUCATION'
                        ? studentFeeConfig.education
                        : studentFeeConfig.transport
                      ).toLocaleString('en-IN')}/month
                    </span>
                  </div>

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

                  {/* Missing ledgers warning + fix button */}
                  {hasMissing && !skipTransportGrid && (
                    <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between">
                      <span className="text-xs font-semibold text-amber-700">
                        ⚠ Some fee entries are missing for this student. Click "Generate" to create them.
                      </span>
                      <button
                        type="button"
                        disabled={isRegenerating}
                        onClick={async () => {
                          setIsRegenerating(true);
                          const ok = await regenerateLedgers(selectedStudent._id || selectedStudent.id);
                          setIsRegenerating(false);
                          if (ok) {
                            setSuccessMsg('✓ Missing ledgers generated successfully. You can now collect fees.');
                            setTimeout(() => setSuccessMsg(''), 4000);
                          } else {
                            setSuccessMsg('⚠ Failed to generate ledgers. Please try again.');
                            setTimeout(() => setSuccessMsg(''), 5000);
                          }
                        }}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50 shrink-0 ml-3"
                      >
                        {isRegenerating ? 'Generating...' : 'Generate Missing Ledgers'}
                      </button>
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
                      {(feeCategory === 'EDUCATION' ? COMBINED_EDU_TERM_CONFIG : MONTHS_CONFIG).map((item) => {
                        const activeCat = feeCategory === 'EDUCATION' ? item.type : feeCategory;
                        const entry = getLedger(activeCat, item.value);
                        const isPaid = entry?.status === 'PAID';
                        const isPending = entry && entry.status !== 'PAID';
                        const isNew = !entry; // no ledger yet
                        const isSelected = selectedFees.some(f => f.category === activeCat && f.period === item.value);
                        const dueAmt = getDueAmount(activeCat, item.value);

                        let btnStyle = 'border-slate-200 bg-white text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/30';
                        if (isPaid) {
                          btnStyle = 'bg-emerald-50 border-emerald-200 text-emerald-600 cursor-not-allowed';
                        } else if (isSelected) {
                          btnStyle = activeCat === 'TERM'
                            ? 'bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-500/20'
                            : 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20';
                        } else if (isPending) {
                          btnStyle = 'border-amber-300 text-amber-700 bg-amber-50/40 hover:border-amber-400';
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
                            {isSelected && (
                              <Check className="absolute top-1 right-1 h-2.5 w-2.5 stroke-[3]" />
                            )}
                            <span className={`font-bold tracking-wide ${activeCat === 'TERM' ? 'text-sm' : 'text-xs'}`}>{item.label}</span>
                            {item.year ? (
                              <span className="text-[9px] mt-0.5 opacity-70">'{item.year}</span>
                            ) : (
                              <span className="text-[9px] mt-0.5 opacity-70 px-1">{item.sublabel}</span>
                            )}
                            <span className="text-[8px] font-extrabold uppercase mt-1 tracking-wide">
                              {isPaid ? 'PAID' : isPending ? `₹${dueAmt.toLocaleString('en-IN')}` : isNew ? 'NEW' : ''}
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
                {getDueAmount(feeCategory, 'One-time') === 0 && (
                  <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-sm font-bold text-center">
                    {feeCategory === 'ADMISSION' ? 'Admission' : 'Bag & Kit'} fee has already been paid for this student.
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
                  .filter(l => l.studentId === selectedStudent.id && l.feeType === 'OTHER')
                  .length === 0 ? (
                  <div className="bg-slate-50 border border-slate-200 text-slate-500 p-6 rounded-xl text-center text-sm font-bold">
                    No custom fees found for this student. Click "+ Add Custom Fee" to create one.
                  </div>
                ) : (
                  ledgerEntries
                    .filter(l => l.studentId === selectedStudent.id && l.feeType === 'OTHER')
                    .map(ledger => {
                      const isPaid = ledger.status === 'PAID';
                      const isPending = ledger.status !== 'PAID';
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

            {/* Payment Method */}
            <div className="space-y-2.5">
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Payment Method</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {[
                  { id: 'CASH', label: 'Cash', icon: Coins },
                  { id: 'CHEQUE', label: 'Cheque', icon: FileText },
                  { id: 'CARD', label: 'Card', icon: CreditCard },
                  { id: 'ONLINE', label: 'Online/UPI', icon: Smartphone },
                  { id: 'NET BANKING', label: 'Net Banking', icon: Globe }
                ].map((method) => {
                  const Icon = method.icon;
                  const isActive = paymentMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id as typeof paymentMethod)}
                      className={`border rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 transition-all text-center ${isActive
                          ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-500/20'
                          : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200 hover:text-slate-700'
                        }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-[11px] font-bold">{method.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cheque Info */}
            {paymentMethod === 'CHEQUE' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Cheque No.</label>
                  <input
                    type="text"
                    value={chequeNo}
                    onChange={(e) => setChequeNo(e.target.value)}
                    placeholder="123456"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="SBI, HDFC..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 shadow-sm"
                  />
                </div>
              </div>
            )}

            {/* Card Info Banner */}
            {paymentMethod === 'CARD' && (
              <div className="bg-[#FFF9C4] border border-[#FDE047] text-amber-800 text-sm py-3 px-4 rounded-xl flex items-center gap-2">
                <span className="font-semibold">💳 Card charges (2% MDR) added</span>
              </div>
            )}

            {/* Global Concession & Summary Cart */}
            <div className="bg-[#1E3A5F] rounded-2xl p-5 text-white shadow-lg mt-6">
              <div className="pb-4 border-b border-white/10 space-y-3">
                <h4 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4">Fee Summary</h4>

                {selectedFees.length === 0 ? (
                  <div className="text-sm opacity-50 italic">No fees selected</div>
                ) : (
                  <div className="space-y-2">
                    {selectedFees.map((f, i) => (
                      <div key={i} className="flex justify-between items-center text-sm">
                        <span className="opacity-90">{f.category === 'BAG_KIT' ? 'BAG & KIT' : f.category} - {f.period}</span>
                        <span className="font-semibold">₹{getDueAmount(f.category, f.period).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Concession section */}
              <div className="py-4 border-b border-white/10 flex items-center justify-between gap-4">
                <label className="text-slate-300 text-sm font-bold shrink-0">Global Concession:</label>
                <div className="flex gap-2">
                  <select
                    value={concessionType}
                    onChange={(e) => { setConcessionType(e.target.value as 'None' | 'Fixed' | 'Percentage'); setConcessionVal(0); }}
                    className="bg-white/10 border border-white/20 text-white rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-white/40 shadow-sm"
                  >
                    <option value="None" className="text-slate-800">None</option>
                    <option value="Fixed" className="text-slate-800">Fixed Amount</option>
                    <option value="Percentage" className="text-slate-800">Percentage</option>
                  </select>
                  {concessionType !== 'None' && (
                    <input
                      type="number"
                      min="0"
                      value={concessionVal}
                      onChange={(e) => setConcessionVal(parseFloat(e.target.value) || 0)}
                      className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-1.5 w-24 text-sm focus:outline-none focus:border-white/40 shadow-sm placeholder:text-white/30"
                      placeholder="0"
                    />
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <span className="font-bold text-lg">Total Payable</span>
                <span className="font-extrabold text-3xl">₹{payingNow.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Paying Now + Remark */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
                  Paying Now
                </label>
                <input
                  type="number"
                  min="0"
                  value={payingNow}
                  onChange={(e) => setPayingNow(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Remark (Optional)</label>
                <input
                  type="text"
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="e.g. June advance"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 shadow-sm"
                />
              </div>
            </div>

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
                : `Collect Payment of ₹${payingNow.toLocaleString('en-IN')}`}
            </button>

          </form>
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
                    const ok = await addCustomFee(selectedStudent.id || selectedStudent._id, customFeeName.trim(), Number(customFeeAmount));
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
