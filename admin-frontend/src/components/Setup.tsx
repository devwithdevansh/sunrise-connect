import React, { useState } from 'react';
import { useApp } from '../store';
import { Calendar, Tag, Layers, Plus, Check, X, Pencil, Trash2 } from 'lucide-react';
import { FeeStructure } from './FeeStructure'; // Reuse existing component for the Fee Structure tab

// ── Edit Academic Year Modal ─────
interface EditAYModalProps {
  ay: any;
  onClose: () => void;
  onSave: (id: string, data: any) => Promise<boolean>;
}

const EditAYModal: React.FC<EditAYModalProps> = ({ ay, onClose, onSave }) => {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const month = '' + (d.getMonth() + 1);
    const day = '' + d.getDate();
    const year = d.getFullYear();
    return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
  };

  const [name, setName] = useState(ay.name);
  const [startDate, setStartDate] = useState(formatDate(ay.startDate));
  const [endDate, setEndDate] = useState(formatDate(ay.endDate));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name || !startDate || !endDate) {
      setError('All fields are required');
      return;
    }
    setError('');
    setSaving(true);
    const ok = await onSave(ay._id, { name, startDate, endDate });
    setSaving(false);
    if (ok) {
      onClose();
    } else {
      setError('Failed to update academic year');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm shadow-2xl" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md mx-4 overflow-hidden shadow-2xl animate-[fadeIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-blue-900 to-indigo-800 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-200">Modify Configuration</span>
            <h3 className="font-extrabold text-lg tracking-tight mt-0.5">Edit Academic Year</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Name (e.g. 2026-2027)</label>
            <input
              type="text"
              className="w-full border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 transition-all outline-none"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Start Date</label>
            <input
              type="date"
              className="w-full border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 transition-all outline-none"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">End Date</label>
            <input
              type="date"
              className="w-full border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 transition-all outline-none"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
          {error && <div className="text-red-500 text-xs font-bold">{error}</div>}
        </div>
        <div className="px-6 py-4 border-t flex justify-end gap-3 bg-slate-50/50">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all border border-slate-200">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </div>
    </div>
  );
};

// ── Edit Fee Category Modal ─────
interface EditFCModalProps {
  cat: any;
  onClose: () => void;
  onSave: (id: string, data: any) => Promise<boolean>;
}

const EditFCModal: React.FC<EditFCModalProps> = ({ cat, onClose, onSave }) => {
  const { academicYears } = useApp();
  const [name, setName] = useState(cat.name);
  const [type, setType] = useState(cat.type);
  const [description, setDescription] = useState(cat.description || '');
  const [academicYear, setAcademicYear] = useState(cat.academicYear || academicYears.find(y => y.isActive)?.name || '2025-26');
  const [isActive, setIsActive] = useState(cat.isActive !== false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name || !type || !academicYear) {
      setError('Name, Type, and Academic Year are required');
      return;
    }
    setError('');
    setSaving(true);
    const ok = await onSave(cat._id, { name, type, description, academicYear, isActive });
    setSaving(false);
    if (ok) {
      onClose();
    } else {
      setError('Failed to update fee category');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm shadow-2xl" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md mx-4 overflow-hidden shadow-2xl animate-[fadeIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-blue-900 to-indigo-800 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-200">Modify Category</span>
            <h3 className="font-extrabold text-lg tracking-tight mt-0.5">Edit Fee Category</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Category Name</label>
            <input
              type="text"
              className="w-full border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 transition-all outline-none"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Monthly Education Fee"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Academic Year</label>
            <select
              className="w-full border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 transition-all outline-none"
              value={academicYear}
              onChange={e => setAcademicYear(e.target.value)}
            >
              {academicYears.map(yr => (
                <option key={yr._id} value={yr.name}>{yr.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">System Type</label>
            <select
              className="w-full border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 transition-all outline-none"
              value={type}
              onChange={e => setType(e.target.value)}
            >
              <option value="EDUCATION">EDUCATION</option>
              <option value="TERM">TERM</option>
              <option value="TRANSPORT">TRANSPORT</option>
              <option value="ADMISSION">ADMISSION</option>
              <option value="OTHER">OTHER</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Description (Optional)</label>
            <input
              type="text"
              className="w-full border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 transition-all outline-none"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="fc-active"
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
              checked={isActive}
              onChange={e => setIsActive(e.target.checked)}
            />
            <label htmlFor="fc-active" className="text-sm font-bold text-slate-700 cursor-pointer select-none">
              Active Category
            </label>
          </div>
          {error && <div className="text-red-500 text-xs font-bold">{error}</div>}
        </div>
        <div className="px-6 py-4 border-t flex justify-end gap-3 bg-slate-50/50">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all border border-slate-200">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </div>
    </div>
  );
};

export const Setup: React.FC = () => {
  const { 
    academicYears, 
    feeCategories, 
    createAcademicYear, 
    updateAcademicYear,
    deleteAcademicYear,
    activateAcademicYear, 
    createFeeCategory,
    updateFeeCategory,
    deleteFeeCategory
  } = useApp();
  
  const [activeTab, setActiveTab] = useState<'academic-year' | 'fee-categories' | 'fee-structure'>('academic-year');

  const activeYearName = React.useMemo(() => academicYears.find(y => y.isActive)?.name || '2025-26', [academicYears]);
  const [selectedYear, setSelectedYear] = useState<string>('');

  const filteredCategories = React.useMemo(() => {
    return feeCategories.filter(cat => cat.academicYear === selectedYear || (!cat.academicYear && selectedYear === activeYearName));
  }, [feeCategories, selectedYear, activeYearName]);

  // Form states
  const [showAYForm, setShowAYForm] = useState(false);
  const [newAY, setNewAY] = useState({ name: '', startDate: '', endDate: '' });

  const [showFCForm, setShowFCForm] = useState(false);
  const [newFC, setNewFC] = useState({ name: '', type: 'EDUCATION', description: '', academicYear: '' });

  React.useEffect(() => {
    if (activeYearName) {
      if (!selectedYear) setSelectedYear(activeYearName);
      setNewFC(prev => ({ ...prev, academicYear: prev.academicYear || activeYearName }));
    }
  }, [activeYearName, selectedYear]);

  // Modal editing states
  const [editingAY, setEditingAY] = useState<any | null>(null);
  const [editingFC, setEditingFC] = useState<any | null>(null);

  const handleCreateAY = async () => {
    if (!newAY.name || !newAY.startDate || !newAY.endDate) return;
    const ok = await createAcademicYear(newAY);
    if (ok) {
      setShowAYForm(false);
      setNewAY({ name: '', startDate: '', endDate: '' });
    }
  };

  const handleActivateAY = async (id: string) => {
    await activateAcademicYear(id);
  };

  const handleDeleteAY = async (ay: any) => {
    if (ay.isActive) {
      alert("You cannot delete the active academic year. Please activate another academic year first.");
      return;
    }
    if (window.confirm(`Are you sure you want to delete academic year "${ay.name}"?\nThis action cannot be undone.`)) {
      const ok = await deleteAcademicYear(ay._id);
      if (!ok) alert("Failed to delete academic year.");
    }
  };

  const handleCreateFC = async () => {
    if (!newFC.name || !newFC.type || !newFC.academicYear) return;
    const ok = await createFeeCategory(newFC);
    if (ok) {
      setShowFCForm(false);
      setNewFC({ name: '', type: 'EDUCATION', description: '', academicYear: activeYearName });
    }
  };

  const handleDeleteFC = async (fc: any) => {
    if (window.confirm(`Are you sure you want to delete fee category "${fc.name}"?\nThis action cannot be undone.`)) {
      const ok = await deleteFeeCategory(fc._id);
      if (!ok) alert("Failed to delete fee category.");
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F8FAFC]">
      <header>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">System Setup</h2>
        <p className="text-xs font-semibold text-slate-400">Configure academic years, fee categories, and master fee structures</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('academic-year')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'academic-year' ? 'border-[#1E3A8A] text-[#1E3A8A]' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Calendar className="w-4 h-4" /> Academic Year
        </button>
        <button
          onClick={() => setActiveTab('fee-categories')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'fee-categories' ? 'border-[#1E3A8A] text-[#1E3A8A]' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Tag className="w-4 h-4" /> Fee Categories
        </button>
        <button
          onClick={() => setActiveTab('fee-structure')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'fee-structure' ? 'border-[#1E3A8A] text-[#1E3A8A]' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Layers className="w-4 h-4" /> Fee Structure
        </button>
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === 'academic-year' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Manage Academic Years</h3>
              <button
                onClick={() => setShowAYForm(true)}
                className="flex items-center gap-1.5 bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold px-4 py-2 rounded-xl transition-all shadow-md active:scale-[0.98] text-sm"
              >
                <Plus className="w-4 h-4" /> Add Year
              </button>
            </div>

            {showAYForm && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mb-6 animate-fade-in-up">
                <h4 className="font-bold text-slate-700 mb-4 text-sm">Create New Academic Year</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Name (e.g. 2026-2027)</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                      value={newAY.name}
                      onChange={e => setNewAY({ ...newAY, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Start Date</label>
                    <input
                      type="date"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                      value={newAY.startDate}
                      onChange={e => setNewAY({ ...newAY, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">End Date</label>
                    <input
                      type="date"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                      value={newAY.endDate}
                      onChange={e => setNewAY({ ...newAY, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button onClick={() => setShowAYForm(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                  <button onClick={handleCreateAY} className="px-4 py-2 bg-[#F59E0B] text-slate-900 font-bold rounded-lg text-sm shadow-sm hover:bg-amber-500">Save</button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {academicYears.map(ay => (
                <div key={ay._id} className={`bg-white rounded-2xl p-5 shadow-sm border flex flex-col justify-between ${ay.isActive ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-slate-200'} transition-all`}>
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-extrabold text-slate-800 text-lg">{ay.name}</h4>
                      {ay.isActive ? (
                        <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <button onClick={() => handleActivateAY(ay._id)} className="text-xs font-bold text-slate-400 hover:text-emerald-600 bg-slate-50 hover:bg-emerald-50 px-2.5 py-1 rounded-full border border-slate-200 transition-colors">
                          Set Active
                        </button>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 space-y-1">
                      <p><strong className="text-slate-700">Start:</strong> {new Date(ay.startDate).toLocaleDateString()}</p>
                      <p><strong className="text-slate-700">End:</strong> {new Date(ay.endDate).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingAY(ay)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Edit Academic Year"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAY(ay)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Delete Academic Year"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'fee-categories' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Fee Categories</h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-xl px-3 py-1">
                  <label htmlFor="year-fc-select" className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                    Year:
                  </label>
                  <select
                    id="year-fc-select"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="bg-transparent text-slate-700 font-extrabold text-sm py-1.5 focus:outline-none cursor-pointer min-w-[100px]"
                  >
                    {academicYears.map((yr) => (
                      <option key={yr._id} value={yr.name}>
                        {yr.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button onClick={() => setShowFCForm(true)} className="flex items-center gap-1.5 bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold px-4 py-2 rounded-xl transition-all shadow-md active:scale-[0.98] text-sm">
                  <Plus className="w-4 h-4" /> Add Category
                </button>
              </div>
            </div>

            {showFCForm && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mb-6 animate-fade-in-up">
                <h4 className="font-bold text-slate-700 mb-4 text-sm">Create New Fee Category</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Name</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                      value={newFC.name}
                      onChange={e => setNewFC({ ...newFC, name: e.target.value })}
                      placeholder="e.g. Monthly Education Fee"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Academic Year</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                      value={newFC.academicYear}
                      onChange={e => setNewFC({ ...newFC, academicYear: e.target.value })}
                    >
                      {academicYears.map(yr => (
                        <option key={yr._id} value={yr.name}>{yr.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">System Type</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                      value={newFC.type}
                      onChange={e => setNewFC({ ...newFC, type: e.target.value })}
                    >
                      <option value="EDUCATION">EDUCATION</option>
                      <option value="TERM">TERM</option>
                      <option value="TRANSPORT">TRANSPORT</option>
                      <option value="ADMISSION">ADMISSION</option>
                      <option value="OTHER">OTHER</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Description (Optional)</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                      value={newFC.description}
                      onChange={e => setNewFC({ ...newFC, description: e.target.value })}
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button onClick={() => setShowFCForm(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                  <button onClick={handleCreateFC} className="px-4 py-2 bg-[#F59E0B] text-slate-900 font-bold rounded-lg text-sm shadow-sm hover:bg-amber-500">Save</button>
                </div>
              </div>
            )}
            
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-xs">
                    <th className="py-3.5 px-5">Category Name</th>
                    <th className="py-3.5 px-5">System Type</th>
                    <th className="py-3.5 px-5">Description</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCategories.map(cat => (
                    <tr key={cat._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-slate-800">{cat.name}</td>
                      <td className="py-3.5 px-5">
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-bold border border-slate-200">{cat.type}</span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-500 text-xs">{cat.description}</td>
                      <td className="py-3.5 px-5">
                        {cat.isActive !== false ? (
                          <span className="text-emerald-500 font-bold text-xs flex items-center gap-1"><Check className="w-3 h-3"/> Active</span>
                        ) : (
                          <span className="text-slate-400 font-bold text-xs flex items-center gap-1"><X className="w-3 h-3"/> Inactive</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right space-x-1 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setEditingFC(cat)}
                          className="inline-flex p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Edit Category"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFC(cat)}
                          className="inline-flex p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete Category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'fee-structure' && (
          <div className="mt-[-24px]">
             {/* Reusing existing FeeStructure logic, just wrapped in tab */}
             <FeeStructure />
          </div>
        )}
      </div>

      {/* Editing Modals */}
      {editingAY && (
        <EditAYModal
          ay={editingAY}
          onClose={() => setEditingAY(null)}
          onSave={updateAcademicYear}
        />
      )}
      {editingFC && (
        <EditFCModal
          cat={editingFC}
          onClose={() => setEditingFC(null)}
          onSave={updateFeeCategory}
        />
      )}
    </div>
  );
};
