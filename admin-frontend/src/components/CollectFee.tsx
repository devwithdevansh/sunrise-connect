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
  Check
} from 'lucide-react';

// Full 12-month academic year
const MONTHS_CONFIG = [
  { label: 'Jun', year: '26', value: 'June' },
  { label: 'Jul', year: '26', value: 'July' },
  { label: 'Aug', year: '26', value: 'August' },
  { label: 'Sep', year: '26', value: 'September' },
  { label: 'Oct', year: '26', value: 'October' },
  { label: 'Nov', year: '26', value: 'November' },
  { label: 'Dec', year: '26', value: 'December' },
  { label: 'Jan', year: '27', value: 'January' },
  { label: 'Feb', year: '27', value: 'February' },
  { label: 'Mar', year: '27', value: 'March' },
  { label: 'Apr', year: '27', value: 'April' },
  { label: 'May', year: '27', value: 'May' },
];

// Term fee periods — only 2
const TERM_CONFIG = [
  { label: 'Term 1', sublabel: 'Due before June', value: 'Term 1' },
  { label: 'Term 2', sublabel: 'Due before December', value: 'Term 2' },
];

export const CollectFee: React.FC = () => {
  const { students, ledgerEntries, recordPayment, feeStructures, transportFeeStructures } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Fee collection form states
  const [feeCategory, setFeeCategory] = useState<'EDUCATION' | 'TERM' | 'TRANSPORT' | 'ADMISSION' | 'BAG_KIT'>('EDUCATION');
  const [selectedFees, setSelectedFees] = useState<{ category: string; period: string }[]>([]);
  const [concessionType, setConcessionType] = useState<'None' | 'Fixed' | 'Percentage'>('None');
  const [concessionVal, setConcessionVal] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CHEQUE' | 'ONLINE' | 'CARD' | 'NET BANKING'>('CASH');
  const [chequeNo, setChequeNo] = useState('');
  const [bankName, setBankName] = useState('');
  const [payingNow, setPayingNow] = useState(0);
  const [remark, setRemark] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Default select first student
  useEffect(() => {
    if (students.length > 0 && !selectedStudent) {
      setSelectedStudent(students[0]);
    }
  }, [students, selectedStudent]);

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
    // selectedStudent may have _id (from DB) or id (from mock). Match either.
    const sId = selectedStudent?._id || selectedStudent?.id;
    return ledgerEntries.find(
      (l) =>
        (l.studentId === sId) &&
        l.feeType === category &&
        l.feePeriod === period
    );
  };

  /** Amount still due for a period (0 if fully paid or no ledger = fresh) */
  const getDueAmount = (category: string, period: string): number => {
    const entry = getLedger(category, period);
    if (!entry) return getStandardAmount(category, period); // no ledger yet → full amount due
    return entry.remainingAmount;
  };

  // -------------------------------------------------------------------
  // Period selection
  // -------------------------------------------------------------------

  const periods = feeCategory === 'TERM' ? TERM_CONFIG.map((t) => t.value) : MONTHS_CONFIG.map((m) => m.value);

  const handlePeriodToggle = (period: string) => {
    const entry = getLedger(feeCategory, period);
    // Don't toggle already fully PAID periods
    if (entry && entry.status === 'PAID') return;
    
    setSelectedFees((prev) => {
      const exists = prev.find((p) => p.category === feeCategory && p.period === period);
      if (exists) {
        return prev.filter((p) => !(p.category === feeCategory && p.period === period));
      } else {
        return [...prev, { category: feeCategory, period }];
      }
    });
  };

  // Select All Pending = all periods with remaining > 0
  const selectAllPending = () => {
    const pending = periods.filter((p) => getDueAmount(feeCategory, p) > 0);
    setSelectedFees((prev) => {
      const otherCategories = prev.filter((p) => p.category !== feeCategory);
      const newSelections = pending.map((period) => ({ category: feeCategory, period }));
      return [...otherCategories, ...newSelections];
    });
  };

  const selectNextNMonths = (n: number) => {
    if (feeCategory !== 'EDUCATION' && feeCategory !== 'TRANSPORT') return;
    const pending = periods.filter((p) => getDueAmount(feeCategory, p) > 0);
    const toSelect = pending.slice(0, n);
    setSelectedFees((prev) => {
      const otherCategories = prev.filter((p) => p.category !== feeCategory);
      const newSelections = toSelect.map((period) => ({ category: feeCategory, period }));
      return [...otherCategories, ...newSelections];
    });
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

    await recordPayment(selectedStudent._id, feesToPay, payingNow, paymentMethod, finalConcession, finalRemark);

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
                  }}
                  className={`p-4 border rounded-2xl cursor-pointer transition-all duration-200 ${
                    isSelected
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
            className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-all"
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

              {/* Category Tabs */}
              <div className="flex bg-slate-200/50 p-0.5 rounded-lg border border-slate-200/20 flex-wrap">
                {(['EDUCATION', 'TERM', 'TRANSPORT', 'ADMISSION', 'BAG_KIT'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => { 
                      setFeeCategory(cat); 
                    }}
                    className={`px-3 py-1.5 rounded-md text-[11px] font-bold tracking-wider uppercase transition-all ${
                      feeCategory === cat
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {cat === 'BAG_KIT' ? 'BAG & KIT' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* ── EDUCATION / TRANSPORT: Full 12-month grid ─────── */}
            {(feeCategory === 'EDUCATION' || feeCategory === 'TRANSPORT') && (
              <div className={`border rounded-xl p-5 border-l-4 ${feeCategory === 'EDUCATION' ? 'border-blue-100 bg-blue-50/30 border-l-blue-500' : 'border-emerald-100 bg-emerald-50/30 border-l-emerald-500'}`}>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <span className={`font-bold flex items-center gap-2 ${feeCategory === 'EDUCATION' ? 'text-blue-700' : 'text-emerald-700'}`}>
                      {feeCategory === 'EDUCATION' ? '📚 Education Fee' : '🚌 Transport Fee'}
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
                    <button type="button" onClick={() => selectNextNMonths(1)} className="hover:underline">1M</button>
                    <span>·</span>
                    <button type="button" onClick={() => selectNextNMonths(3)} className="hover:underline">3M</button>
                    <span>·</span>
                    <button type="button" onClick={() => selectNextNMonths(6)} className="hover:underline">6M</button>
                    <span>·</span>
                    <button type="button" onClick={selectAllPending} className="hover:underline">Select All Due</button>
                    <span>·</span>
                    <button type="button" onClick={() => setSelectedFees((prev) => prev.filter(p => p.category !== feeCategory))} className="hover:underline">Clear</button>
                  </div>
                </div>

                {/* No transport warning */}
                {feeCategory === 'TRANSPORT' && selectedStudent.transportType === 'None' && (
                  <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs font-semibold text-amber-700">
                    This student has no transport subscription. Transport fee does not apply.
                  </div>
                )}

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                  {MONTHS_CONFIG.map((month) => {
                    const entry = getLedger(feeCategory, month.value);
                    const isPaid = entry?.status === 'PAID';
                    const isPending = entry && entry.status !== 'PAID';
                    const isNew = !entry; // no ledger yet
                    const isSelected = selectedFees.some(f => f.category === feeCategory && f.period === month.value);
                    const dueAmt = getDueAmount(feeCategory, month.value);

                    let btnStyle = 'border-slate-200 bg-white text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/30';
                    if (isPaid) {
                      btnStyle = 'bg-emerald-50 border-emerald-200 text-emerald-600 cursor-not-allowed';
                    } else if (isSelected) {
                      btnStyle = 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20';
                    } else if (isPending) {
                      btnStyle = 'border-amber-300 text-amber-700 bg-amber-50/40 hover:border-amber-400';
                    } else if (isNew) {
                      btnStyle = 'border-slate-200 bg-white text-slate-400 hover:border-blue-300 hover:bg-blue-50/20';
                    }

                    return (
                      <button
                        key={month.value}
                        type="button"
                        disabled={isPaid || (feeCategory === 'TRANSPORT' && selectedStudent.transportType === 'None')}
                        onClick={() => handlePeriodToggle(month.value)}
                        className={`border rounded-xl py-2.5 text-center flex flex-col items-center justify-center transition-all relative select-none ${btnStyle}`}
                      >
                        {isSelected && (
                          <Check className="absolute top-1 right-1 h-2.5 w-2.5 stroke-[3]" />
                        )}
                        <span className="text-xs font-bold tracking-wide">{month.label}</span>
                        <span className="text-[9px] mt-0.5 opacity-70">'{month.year}</span>
                        <span className="text-[8px] font-extrabold uppercase mt-1 tracking-wide">
                          {isPaid ? 'PAID' : isPending ? `₹${dueAmt.toLocaleString('en-IN')}` : isNew ? 'NEW' : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>

              </div>
            )}

            {/* ── TERM: 2 fixed buttons only ─────────────────────── */}
            {feeCategory === 'TERM' && (
              <div className="border border-purple-100 bg-purple-50/30 rounded-xl p-5 border-l-4 border-l-purple-500">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <span className="font-bold flex items-center gap-2 text-purple-700">
                      📝 Term Fee
                    </span>
                  </div>
                  <span className="font-extrabold text-lg text-purple-600">
                    ₹{studentFeeConfig.term.toLocaleString('en-IN')}/term
                  </span>
                </div>

                <p className="text-xs text-slate-500 mb-4">
                  Term 1 is due before June · Term 2 is due before December
                </p>

                <div className="grid grid-cols-2 gap-4">
                  {TERM_CONFIG.map((term) => {
                    const entry = getLedger(feeCategory, term.value);
                    const isPaid = entry?.status === 'PAID';
                    const isPending = entry && entry.status !== 'PAID';
                    const isSelected = selectedFees.some(f => f.category === feeCategory && f.period === term.value);
                    const dueAmt = getDueAmount(feeCategory, term.value);

                    let cardStyle = 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50/20';
                    if (isPaid) {
                      cardStyle = 'border-emerald-200 bg-emerald-50 text-emerald-600 cursor-not-allowed';
                    } else if (isSelected) {
                      cardStyle = 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-500/20';
                    } else if (isPending) {
                      cardStyle = 'border-amber-300 bg-amber-50/40 text-amber-700 hover:border-amber-400';
                    }

                    return (
                      <button
                        key={term.value}
                        type="button"
                        disabled={isPaid}
                        onClick={() => handlePeriodToggle(term.value)}
                        className={`relative border-2 rounded-2xl p-5 flex flex-col items-start transition-all ${cardStyle}`}
                      >
                        {isSelected && (
                          <span className="absolute top-3 right-3 bg-white/20 rounded-full p-0.5">
                            <Check className="h-4 w-4 stroke-[3]" />
                          </span>
                        )}
                        <span className="text-base font-extrabold">{term.label}</span>
                        <span className={`text-xs mt-0.5 font-medium ${isSelected ? 'text-blue-100' : 'opacity-60'}`}>
                          {term.sublabel}
                        </span>
                        <div className="mt-4 flex items-center justify-between w-full">
                          <span className="text-xl font-extrabold">
                            ₹{(isPending ? dueAmt : studentFeeConfig.term).toLocaleString('en-IN')}
                          </span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-700'
                              : isPending
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {isPaid ? 'PAID' : isPending ? 'DUE' : 'UNPAID'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

              </div>
            )}

            {/* ── ADMISSION / BAG_KIT ─────────────────────── */}
            {(feeCategory === 'ADMISSION' || feeCategory === 'BAG_KIT') && (
              <div className="space-y-6">
                {getDueAmount(feeCategory, 'One-time') === 0 && (
                  <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-sm font-bold text-center">
                    {feeCategory === 'ADMISSION' ? 'Admission' : 'Bag & Kit'} fee has already been paid for this student.
                  </div>
                )}
                
                <div className={`border rounded-xl p-5 border-l-4 ${
                  feeCategory === 'ADMISSION' 
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
                        onClick={() => handlePeriodToggle('One-time')}
                        className={`px-4 py-2 rounded-lg font-bold transition-all shadow-sm ${
                          selectedFees.some(f => f.category === feeCategory && f.period === 'One-time')
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
                      className={`border rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                        isActive
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
              className={`w-full py-3.5 rounded-xl font-bold tracking-wide transition-all text-center flex items-center justify-center gap-2 ${
                selectedFees.length === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-[#F59E0B] hover:bg-amber-600 text-slate-900 shadow-lg shadow-amber-500/10 hover:scale-[1.01] active:scale-[0.99]'
              }`}
            >
              {selectedFees.length === 0
                ? 'Select a fee above to collect'
                : `Collect ₹${payingNow.toLocaleString('en-IN')} & Generate Receipt`}
            </button>

          </form>
        ) : (
          <div className="text-center text-slate-400 py-20 text-sm">
            Select a student from the left panel to begin
          </div>
        )}
      </section>
    </div>
  );
};
