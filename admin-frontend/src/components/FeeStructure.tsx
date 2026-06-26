import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../store';
import type { FeeStructureData, TransportFeeStructureData } from '../store';
import { AlertCircle, Bus, ChevronDown, Award, Pencil, X, Check, Loader2, Plus, Trash2 } from 'lucide-react';

/* ─── Create Modal for Standard Fee ───────────────────────────────── */
interface CreateFeeModalProps {
  onClose: () => void;
  onSave: (data: Partial<FeeStructureData>) => Promise<boolean>;
}

const CreateFeeModal: React.FC<CreateFeeModalProps> = ({ onClose, onSave }) => {
  const [standard, setStandard] = useState('1');
  const [medium, setMedium] = useState('English');
  const [annualFee, setAnnualFee] = useState<number | ''>('');
  const [admissionFee, setAdmissionFee] = useState<number | ''>('');
  const [bagKitFee, setBagKitFee] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Fixed 14-part system: 12 education months + 2 term fees
  const EDUCATION_PARTS = 12;
  const TERM_PARTS = 2;
  const monthlyEdu = Math.round((Number(annualFee) || 0) / (EDUCATION_PARTS + TERM_PARTS));

  const handleSave = async () => {
    if (!standard.trim()) { setError('Standard is required'); return; }
    if (annualFee === '' || Number(annualFee) < 0) { setError('Annual fee cannot be negative'); return; }
    if (admissionFee !== '' && Number(admissionFee) < 0) { setError('Admission fee cannot be negative'); return; }
    if (bagKitFee !== '' && Number(bagKitFee) < 0) { setError('Bag & Kit fee cannot be negative'); return; }
    setError('');
    setSaving(true);
    const ok = await onSave({
      annualFee: Number(annualFee),
      educationPartCount: EDUCATION_PARTS,
      termPartCount: TERM_PARTS,
      termFee: monthlyEdu,
      admissionFee: Number(admissionFee),
      bagKitFee: Number(bagKitFee),
    });
    setSaving(false);
    if (ok) onClose(); else setError('Failed to create. Standard may already exist for this medium.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-blue-900 to-indigo-800 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-200">New Fee Structure</span>
            <h3 className="font-black text-lg tracking-tight mt-0.5">Add New Standard</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6 space-y-5">
          {/* Standard + Medium */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Standard</label>
              <input type="text" value={standard} onChange={e => setStandard(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" placeholder="e.g. Nursery, LKG, 1" />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Medium</label>
              <select value={medium} onChange={e => setMedium(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
                <option value="English">English</option>
                <option value="Gujarati">Gujarati</option>
              </select>
            </div>
          </div>

          {/* Annual Fee */}
          <div>
            <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Annual Tuition Fee (₹)</label>
            <input type="number" value={annualFee} onChange={e => setAnnualFee(e.target.value === '' ? '' : Number(e.target.value))} min={0} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
          </div>

          {/* Admission + Bag & Kit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Admission Fee (₹)</label>
              <input type="number" value={admissionFee} onChange={e => setAdmissionFee(e.target.value === '' ? '' : Number(e.target.value))} min={0} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Bag & Kit Fee (₹)</label>
              <input type="number" value={bagKitFee} onChange={e => setBagKitFee(e.target.value === '' ? '' : Number(e.target.value))} min={0} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
            </div>
          </div>

          {/* Live Preview */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Live Preview</p>
            <div className="flex justify-between text-xs text-slate-600"><span>Monthly Education:</span><span className="font-bold text-slate-800">₹{monthlyEdu.toLocaleString('en-IN')} /mo</span></div>
            <div className="flex justify-between text-xs text-slate-600"><span>Term Fee:</span><span className="font-bold text-slate-800">₹{monthlyEdu.toLocaleString('en-IN')} /term</span></div>
            <div className="flex justify-between text-xs text-slate-600"><span>Admission Fee:</span><span className="font-bold text-slate-800">₹{admissionFee.toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between text-xs text-slate-600"><span>Bag & Kit Fee:</span><span className="font-bold text-slate-800">₹{bagKitFee.toLocaleString('en-IN')}</span></div>
          </div>

          {error && <div className="text-red-500 text-xs font-bold">{error}</div>}
        </div>
        <div className="px-6 py-4 border-t flex justify-end gap-3 bg-slate-50">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 flex items-center gap-2">
            {saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving...</> : <><Check className="h-3.5 w-3.5" />Create</>}
          </button>
        </div>
      </div>
    </div>
  );
};



/* ─── Create Modal for Transport Fee ──────────────────────────────── */
interface CreateTransportModalProps {
  onClose: () => void;
  onSave: (data: Partial<TransportFeeStructureData>) => Promise<boolean>;
}

const CreateTransportModal: React.FC<CreateTransportModalProps> = ({ onClose, onSave }) => {
  const [transportType, setTransportType] = useState('Railnagar');
  const [amount, setAmount] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (amount === '' || Number(amount) < 0) { setError('Amount cannot be negative'); return; }
    setError('');
    setSaving(true);
    const ok = await onSave({ transportType, amount: Number(amount), frequency: 'MONTHLY' });
    setSaving(false);
    if (ok) onClose(); else setError('Failed to create. Zone may already exist.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-600 text-white px-6 py-4 flex items-center justify-between">
          <h3 className="font-black text-lg tracking-tight">Add Transport Zone</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Zone Name</label>
            <select value={transportType} onChange={e => setTransportType(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800">
              <option value="Railnagar">Railnagar</option>
              <option value="Outside Railnagar">Outside Railnagar</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Monthly Fee (₹)</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))} className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800" />
          </div>
          {error && <div className="text-red-500 text-xs font-bold">{error}</div>}
        </div>
        <div className="px-6 py-4 border-t flex justify-end gap-3 bg-slate-50">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600">{saving ? 'Saving...' : 'Create'}</button>
        </div>
      </div>
    </div>
  );
};

/* ─── Edit Modal for Standard Fee ─────────────────────────────────── */
interface EditFeeModalProps {
  structure: FeeStructureData;
  onClose: () => void;
  onSave: (id: string, data: Partial<FeeStructureData>) => Promise<boolean>;
}

const EditFeeModal: React.FC<EditFeeModalProps> = ({ structure, onClose, onSave }) => {
  const [annualFee, setAnnualFee] = useState<number | ''>(structure.annualFee);
  const [admissionFee, setAdmissionFee] = useState<number | ''>(
    (structure.admissionFee !== undefined && structure.admissionFee > 0)
      ? structure.admissionFee
      : Math.round(structure.annualFee * 0.07)
  );
  const [bagKitFee, setBagKitFee] = useState<number | ''>(
    (structure.bagKitFee !== undefined && structure.bagKitFee > 0)
      ? structure.bagKitFee
      : Math.round(structure.annualFee * 0.05)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Fixed 14-part system: 12 education months + 2 term fees
  const EDUCATION_PARTS = 12;
  const TERM_PARTS = 2;
  const monthlyEdu = Math.round((Number(annualFee) || 0) / (EDUCATION_PARTS + TERM_PARTS));

  const handleSave = async () => {
    if (annualFee === '' || Number(annualFee) < 0) { setError('Annual fee cannot be negative'); return; }
    if (admissionFee !== '' && Number(admissionFee) < 0) { setError('Admission fee cannot be negative'); return; }
    if (bagKitFee !== '' && Number(bagKitFee) < 0) { setError('Bag & Kit fee cannot be negative'); return; }
    setError('');
    setSaving(true);
    const ok = await onSave(structure._id, {
      annualFee: Number(annualFee),
      educationPartCount: EDUCATION_PARTS,
      termPartCount: TERM_PARTS,
      termFee: monthlyEdu,
      admissionFee: Number(admissionFee),
      bagKitFee: Number(bagKitFee),
    });
    setSaving(false);
    if (ok) {
      setSuccess(true);
      setTimeout(() => onClose(), 900);
    } else {
      setError('Failed to save. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md mx-4 overflow-hidden animate-[fadeIn_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-800 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-200">Edit Fee Structure</span>
            <h3 className="font-black text-lg tracking-tight mt-0.5">
              {structure.medium} Medium — Std {structure.standard}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          {/* Annual Fee */}
          <div>
            <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
              Annual Tuition Fee (₹)
            </label>
            <input
              type="number"
              value={annualFee}
              onChange={(e) => setAnnualFee(e.target.value === '' ? '' : Number(e.target.value))}
              min={0}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Admission + Bag & Kit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Admission Fee (₹)</label>
              <input type="number" value={admissionFee} onChange={(e) => setAdmissionFee(e.target.value === '' ? '' : Number(e.target.value))} min={0} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Bag & Kit Fee (₹)</label>
              <input type="number" value={bagKitFee} onChange={(e) => setBagKitFee(e.target.value === '' ? '' : Number(e.target.value))} min={0} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
            </div>
          </div>

          {/* Live Preview */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Live Preview</span>
            <div className="grid grid-cols-2 gap-y-2 text-xs font-semibold mt-2">
              <span className="text-slate-500">Monthly Education:</span>
              <span className="text-right text-slate-800 font-bold">₹{monthlyEdu.toLocaleString('en-IN')} /mo</span>
              <span className="text-slate-500">Term Fee:</span>
              <span className="text-right text-slate-800 font-bold">₹{monthlyEdu.toLocaleString('en-IN')} /term</span>
              <span className="text-slate-500">Admission Fee:</span>
              <span className="text-right text-slate-800 font-bold">₹{admissionFee.toLocaleString('en-IN')}</span>
              <span className="text-slate-500">Bag & Kit Fee:</span>
              <span className="text-right text-slate-800 font-bold">₹{bagKitFee.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Error / Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-xs font-bold text-red-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-xs font-bold text-emerald-600 flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0" /> Saved successfully! Refreshing data...
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || success}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-500/20 transition-all flex items-center gap-2"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};


/* ─── Edit Modal for Transport Fee ────────────────────────────────── */
interface EditTransportModalProps {
  structure: TransportFeeStructureData;
  onClose: () => void;
  onSave: (id: string, data: Partial<TransportFeeStructureData>) => Promise<boolean>;
}

const EditTransportModal: React.FC<EditTransportModalProps> = ({ structure, onClose, onSave }) => {
  const [amount, setAmount] = useState<number | ''>(structure.amount);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    if (amount === '' || Number(amount) < 0) { setError('Amount cannot be negative'); return; }
    setError('');
    setSaving(true);
    const ok = await onSave(structure._id, { amount: Number(amount) });
    setSaving(false);
    if (ok) {
      setSuccess(true);
      setTimeout(() => onClose(), 900);
    } else {
      setError('Failed to save. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md mx-4 overflow-hidden animate-[fadeIn_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-600 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">Edit Transport Rate</span>
            <h3 className="font-black text-lg tracking-tight mt-0.5">{structure.transportType} Zone</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
              Monthly Amount (₹)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
              min={0}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs font-semibold text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Preview</span>
            Frequency: <strong className="text-slate-700">{structure.frequency}</strong> &middot; New Rate: <strong className="text-indigo-600">₹{amount.toLocaleString('en-IN')}/month</strong>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-xs font-bold text-red-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-xs font-bold text-emerald-600 flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0" /> Saved successfully!
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || success}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-indigo-500/20 transition-all flex items-center gap-2"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Component ──────────────────────────────────────────────── */
export const FeeStructure: React.FC = () => {
  const { feeStructures, transportFeeStructures, updateFeeStructure, updateTransportFeeStructure, deleteFeeStructure, deleteTransportFeeStructure, createFeeStructure, createTransportFeeStructure } = useApp();
  const [selectedStandard, setSelectedStandard] = useState<string>('1');
  const [editingFee, setEditingFee] = useState<FeeStructureData | null>(null);
  const [editingTransport, setEditingTransport] = useState<TransportFeeStructureData | null>(null);
  const [isCreatingFee, setIsCreatingFee] = useState(false);
  const [isCreatingTransport, setIsCreatingTransport] = useState(false);

  const handleDeleteFee = async (structure: FeeStructureData) => {
    if (window.confirm(`Are you sure you want to delete the fee structure for Standard ${structure.standard} (${structure.medium} Medium)?\nThis action cannot be undone.`)) {
      const ok = await deleteFeeStructure(structure._id);
      if (!ok) alert("Failed to delete fee structure.");
    }
  };

  const handleDeleteTransport = async (trans: TransportFeeStructureData) => {
    if (window.confirm(`Are you sure you want to delete the transport rate for ${trans.transportType} zone?\nThis action cannot be undone.`)) {
      const ok = await deleteTransportFeeStructure(trans._id);
      if (!ok) alert("Failed to delete transport rate.");
    }
  };

  // Get unique sorted standards
  const standards = useMemo(() => {
    const stdSet = new Set(feeStructures.map((f) => f.standard));
    return Array.from(stdSet).sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }, [feeStructures]);

  // Sync selected standard when standards list is fetched
  useEffect(() => {
    if (standards.length > 0 && !standards.includes(selectedStandard)) {
      setSelectedStandard(standards[0]);
    }
  }, [standards, selectedStandard]);

  // Find structures for selected standard
  const englishStructure = useMemo(() => {
    return feeStructures.find(
      (f) => f.standard === selectedStandard && f.medium.toLowerCase() === 'english' && f.isActive
    );
  }, [feeStructures, selectedStandard]);

  const gujaratiStructure = useMemo(() => {
    return feeStructures.find(
      (f) => f.standard === selectedStandard && f.medium.toLowerCase() === 'gujarati' && f.isActive
    );
  }, [feeStructures, selectedStandard]);

  // Helper to construct fee parts
  const getFeeDetails = (structure: any) => {
    if (!structure) return null;
    const annual = structure.annualFee;
    const eduParts = structure.educationPartCount || 12;
    const termParts = structure.termPartCount || 2;
    const totalParts = eduParts + termParts;

    // Calculate monthly education fee based on 14-part division
    const monthlyEdu = totalParts > 0 ? Math.round(annual / totalParts) : 0;

    // Use exact DB values — 0 is a valid admin-set amount
    const termFee = structure.termFee ?? 0;
    const admission = structure.admissionFee ?? 0;
    const bagKit = structure.bagKitFee ?? 0;

    return {
      annual,
      monthlyEdu,
      eduParts,
      termFee,
      termParts,
      admission,
      bagKit,
    };
  };

  const englishDetails = getFeeDetails(englishStructure);
  const gujaratiDetails = getFeeDetails(gujaratiStructure);

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-screen">
      {/* Top Header Bar */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Master Fee Configuration</h2>
          <p className="text-xs font-semibold text-slate-400">Database-driven standard configurations & pricing rules · Click edit to modify</p>
        </div>

        {/* Dropdown Container & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <button
            onClick={() => setIsCreatingFee(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm shadow-blue-500/20"
          >
            <Plus className="h-4 w-4" /> Add Standard
          </button>
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1">
            <label htmlFor="standard-select" className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Select:
            </label>
            <div className="relative">
              <select
                id="standard-select"
                value={selectedStandard}
                onChange={(e) => setSelectedStandard(e.target.value)}
                className="appearance-none bg-transparent text-slate-700 font-extrabold text-sm py-1.5 pl-2 pr-8 focus:outline-none cursor-pointer min-w-[100px] transition-all"
              >
                {standards.length === 0 && <option value="">No Standards</option>}
                {standards.map((std) => (
                  <option key={std} value={std}>
                    Standard {std}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none stroke-[2.5]" />
            </div>
          </div>
        </div>
      </header>

      {/* Info Warning Banner */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-xs font-semibold text-indigo-700 flex items-start sm:items-center gap-3 shadow-sm transition-all hover:bg-indigo-100/50">
        <AlertCircle className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5 sm:mt-0" />
        <span>
          Selected Class: <strong className="font-extrabold">Standard {selectedStandard}</strong>. All ledger generation, new student setup, and collection routines utilize these rates dynamically based on the student's registered medium.
        </span>
      </div>

      {/* Twin Columns Fee Comparison Grid */}
      <section className={`grid grid-cols-1 ${selectedStandard === '11' || selectedStandard === '12' ? 'lg:max-w-3xl mx-auto w-full' : 'lg:grid-cols-2'} gap-6`}>
        
        {/* Column 1: English Medium */}
        {selectedStandard !== '11' && selectedStandard !== '12' && (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-200">Medium of Instruction</span>
                <h4 className="font-black text-lg tracking-tight mt-0.5">English Medium</h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">Std {selectedStandard}</span>
                {englishStructure && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingFee(englishStructure)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 transition-all group"
                      title="Edit Fee Structure"
                    >
                      <Pencil className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                    </button>
                    <button
                      onClick={() => handleDeleteFee(englishStructure)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-red-600/30 hover:text-red-200 border border-white/10 transition-all group"
                      title="Delete Fee Structure"
                    >
                      <Trash2 className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {englishDetails ? (
              <div className="divide-y divide-slate-100">
                <div className="flex justify-between items-center px-5 py-4 hover:bg-slate-50/30 transition-colors">
                  <span className="text-sm font-bold text-slate-500">Annual Tuition Fee (Total)</span>
                  <span className="text-base font-extrabold text-blue-700">₹{englishDetails.annual.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center px-5 py-4 hover:bg-slate-50/30 transition-colors">
                  <div>
                    <span className="text-sm font-bold text-slate-500 block">Education Fee (Monthly)</span>
                    <span className="text-[10px] text-slate-400 font-semibold">Calculated as {englishDetails.eduParts} equal parts</span>
                  </div>
                  <span className="text-sm font-black text-slate-800">₹{englishDetails.monthlyEdu.toLocaleString('en-IN')} /mo</span>
                </div>
                <div className="flex justify-between items-center px-5 py-4 hover:bg-slate-50/30 transition-colors">
                  <div>
                    <span className="text-sm font-bold text-slate-500 block">Term Fee (2 parts/year)</span>
                    <span className="text-[10px] text-slate-400 font-semibold">Configured fee charged per term</span>
                  </div>
                  <span className="text-sm font-black text-slate-800">₹{englishDetails.termFee.toLocaleString('en-IN')} /term</span>
                </div>
                <div className="flex justify-between items-center px-5 py-4 hover:bg-slate-50/30 transition-colors">
                  <div>
                    <span className="text-sm font-bold text-slate-500 block">Admission Fee</span>
                    <span className="text-[10px] text-slate-400 font-semibold">One-time registration fee for new admissions</span>
                  </div>
                  <span className="text-sm font-black text-slate-800">₹{englishDetails.admission.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center px-5 py-4 hover:bg-slate-50/30 transition-colors">
                  <div>
                    <span className="text-sm font-bold text-slate-500 block">Bag & Kit Fee</span>
                    <span className="text-[10px] text-slate-400 font-semibold">One-time uniform, books, and study materials fee</span>
                  </div>
                  <span className="text-sm font-black text-slate-800">₹{englishDetails.bagKit.toLocaleString('en-IN')}</span>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400">
                <p className="text-sm font-semibold">No English medium fee structure defined for Standard {selectedStandard}.</p>
              </div>
            )}
          </div>
          {englishDetails && (
            <div className="bg-slate-50/50 p-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-slate-400">
              <Award className="h-4 w-4 text-blue-500" />
              <span>Includes 12 months Education & 2 Term periods</span>
            </div>
          )}
        </div>
        )}

        {/* Column 2: Gujarati Medium */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-700 to-teal-600 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-teal-200">Medium of Instruction</span>
                <h4 className="font-black text-lg tracking-tight mt-0.5">Gujarati Medium</h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">Std {selectedStandard}</span>
                {gujaratiStructure && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingFee(gujaratiStructure)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 transition-all group"
                      title="Edit Fee Structure"
                    >
                      <Pencil className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                    </button>
                    <button
                      onClick={() => handleDeleteFee(gujaratiStructure)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-red-600/30 hover:text-red-200 border border-white/10 transition-all group"
                      title="Delete Fee Structure"
                    >
                      <Trash2 className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {gujaratiDetails ? (
              <div className="divide-y divide-slate-100">
                <div className="flex justify-between items-center px-5 py-4 hover:bg-slate-50/30 transition-colors">
                  <span className="text-sm font-bold text-slate-500">Annual Tuition Fee (Total)</span>
                  <span className="text-base font-extrabold text-teal-700">₹{gujaratiDetails.annual.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center px-5 py-4 hover:bg-slate-50/30 transition-colors">
                  <div>
                    <span className="text-sm font-bold text-slate-500 block">Education Fee (Monthly)</span>
                    <span className="text-[10px] text-slate-400 font-semibold">Calculated as {gujaratiDetails.eduParts} equal parts</span>
                  </div>
                  <span className="text-sm font-black text-slate-800">₹{gujaratiDetails.monthlyEdu.toLocaleString('en-IN')} /mo</span>
                </div>
                <div className="flex justify-between items-center px-5 py-4 hover:bg-slate-50/30 transition-colors">
                  <div>
                    <span className="text-sm font-bold text-slate-500 block">Term Fee (2 parts/year)</span>
                    <span className="text-[10px] text-slate-400 font-semibold">Configured fee charged per term</span>
                  </div>
                  <span className="text-sm font-black text-slate-800">₹{gujaratiDetails.termFee.toLocaleString('en-IN')} /term</span>
                </div>
                <div className="flex justify-between items-center px-5 py-4 hover:bg-slate-50/30 transition-colors">
                  <div>
                    <span className="text-sm font-bold text-slate-500 block">Admission Fee</span>
                    <span className="text-[10px] text-slate-400 font-semibold">One-time registration fee for new admissions</span>
                  </div>
                  <span className="text-sm font-black text-slate-800">₹{gujaratiDetails.admission.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center px-5 py-4 hover:bg-slate-50/30 transition-colors">
                  <div>
                    <span className="text-sm font-bold text-slate-500 block">Bag & Kit Fee</span>
                    <span className="text-[10px] text-slate-400 font-semibold">One-time uniform, books, and study materials fee</span>
                  </div>
                  <span className="text-sm font-black text-slate-800">₹{gujaratiDetails.bagKit.toLocaleString('en-IN')}</span>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400">
                <p className="text-sm font-semibold">No Gujarati medium fee structure defined for Standard {selectedStandard}.</p>
              </div>
            )}
          </div>
          {gujaratiDetails && (
            <div className="bg-slate-50/50 p-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-slate-400">
              <Award className="h-4 w-4 text-teal-500" />
              <span>Includes 12 months Education & 2 Term periods</span>
            </div>
          )}
        </div>

      </section>

      {/* Transport Fee Structures Table */}
      <section className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bus className="h-5 w-5 text-indigo-500" />
            <div>
              <h3 className="font-extrabold text-base text-slate-800">Transport Rate Configurations</h3>
              <p className="text-[10px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">
                Standard monthly charge based on student's registered pickup zone
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCreatingTransport(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Add Zone
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          {transportFeeStructures.map((trans) => (
            <div
              key={trans._id}
              className="border border-slate-100 hover:border-slate-200 rounded-xl p-4 flex justify-between items-center hover:bg-slate-50/40 transition-all"
            >
              <div>
                <strong className="block text-slate-700 text-sm font-bold">{trans.transportType} Zone</strong>
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">{trans.frequency} frequency</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-base font-black text-slate-800">₹{trans.amount.toLocaleString('en-IN')}</span>
                  <span className="text-[10px] text-slate-400 font-bold block">/month</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setEditingTransport(trans)}
                    className="p-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-600 transition-all group"
                    title="Edit Transport Rate"
                  >
                    <Pencil className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                  </button>
                  <button
                    onClick={() => handleDeleteTransport(trans)}
                    className="p-2 rounded-lg bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 transition-all group"
                    title="Delete Transport Rate"
                  >
                    <Trash2 className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {transportFeeStructures.length === 0 && (
            <p className="text-xs font-semibold text-slate-400 py-4 col-span-2 text-center">No transport routes config loaded from database.</p>
          )}
        </div>
      </section>

      {/* Edit Modals */}
      {editingFee && (
        <EditFeeModal
          structure={editingFee}
          onClose={() => setEditingFee(null)}
          onSave={updateFeeStructure}
        />
      )}
      {editingTransport && (
        <EditTransportModal
          structure={editingTransport}
          onClose={() => setEditingTransport(null)}
          onSave={updateTransportFeeStructure}
        />
      )}
      
      {/* Create Modals */}
      {isCreatingFee && (
        <CreateFeeModal
          onClose={() => setIsCreatingFee(false)}
          onSave={createFeeStructure}
        />
      )}
      {isCreatingTransport && (
        <CreateTransportModal
          onClose={() => setIsCreatingTransport(false)}
          onSave={createTransportFeeStructure}
        />
      )}
    </div>
  );
};
