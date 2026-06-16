import React, { useState } from 'react';
import { useApp } from '../store';

import { Search, ChevronDown, Plus, X } from 'lucide-react';

export const Students: React.FC = () => {
  const { students, addStudent, setScreen } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('All Classes');
  const [divFilter, setDivFilter] = useState('All Divisions');
  const [medFilter, setMedFilter] = useState('All Mediums');
  
  // Quick filter chips: 'ALL' | 'RTE' | 'TRANSPORT'
  const [chipFilter, setChipFilter] = useState<'ALL' | 'RTE' | 'TRANSPORT'>('ALL');
  
  // Add Student Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSName, setNewSName] = useState('');
  const [newSParentMobile, setNewSParentMobile] = useState('');
  const [newSParentName, setNewSParentName] = useState('');
  const [newSMedium, setNewSMedium] = useState<'English' | 'Gujarati'>('English');
  const [newSStandard, setNewSStandard] = useState('5');
  const [newSDivision, setNewSDivision] = useState('A');
  const [newSTransport, setNewSTransport] = useState<'Railnagar' | 'Outside Railnagar' | 'None'>('None');
  const [newSIsRTE, setNewSIsRTE] = useState(false);

  const filteredStudents = students.filter((s) => {
    // Quick filter chips
    if (chipFilter === 'RTE' && !s.isRTE) return false;
    if (chipFilter === 'TRANSPORT' && s.transportType === 'None') return false;

    // Dropdown filters
    if (classFilter !== 'All Classes' && s.standard !== classFilter.replace('Class ', '')) return false;
    if (divFilter !== 'All Divisions' && s.division !== divFilter.replace('Division ', '')) return false;
    if (medFilter !== 'All Mediums' && s.medium !== medFilter.replace(' Medium', '')) return false;

    // Search query filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        s.studentName.toLowerCase().includes(q) ||
        s.studentCode.toLowerCase().includes(q) ||
        s.parentMobile.includes(q)
      );
    }
    return true;
  });



  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSName || !newSParentMobile || !newSParentName) return;

    addStudent({
      studentCode: `STU${Date.now()}`,
      studentName: newSName,
      parentName: newSParentName,
      parentMobile: newSParentMobile,
      medium: newSMedium,
      standard: newSStandard,
      division: newSDivision,
      transportType: newSTransport,
      isRTE: newSIsRTE,
      isActive: true
    });

    // Reset states
    setNewSName('');
    setNewSParentMobile('');
    setNewSParentName('');
    setNewSMedium('English');
    setNewSStandard('5');
    setNewSDivision('A');
    setNewSTransport('None');
    setNewSIsRTE(false);
    setIsModalOpen(false);
  };

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Top Header Bar */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Students</h2>
          <p className="text-xs font-semibold text-slate-400">Sunday, June 7, 2026</p>
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
            Collect Fee
          </button>
        </div>
      </header>

      {/* Filter Options & Quick Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-100 pb-4">
        {/* Dropdown selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Class Selector */}
          <div className="relative">
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-xl py-2 pl-3 pr-8 text-xs font-semibold text-slate-600 focus:outline-none hover:border-slate-300 shadow-sm"
            >
              <option value="All Classes">All Classes</option>
              <option value="Class 3">Class 3</option>
              <option value="Class 5">Class 5</option>
              <option value="Class 6">Class 6</option>
              <option value="Class 7">Class 7</option>
              <option value="Class 8">Class 8</option>
              <option value="Class 9">Class 9</option>
              <option value="Class 10">Class 10</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Division Selector */}
          <div className="relative">
            <select
              value={divFilter}
              onChange={(e) => setDivFilter(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-xl py-2 pl-3 pr-8 text-xs font-semibold text-slate-600 focus:outline-none hover:border-slate-300 shadow-sm"
            >
              <option value="All Divisions">All Divisions</option>
              <option value="Division A">Division A</option>
              <option value="Division B">Division B</option>
              <option value="Division C">Division C</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Medium Selector */}
          <div className="relative">
            <select
              value={medFilter}
              onChange={(e) => setMedFilter(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-xl py-2 pl-3 pr-8 text-xs font-semibold text-slate-600 focus:outline-none hover:border-slate-300 shadow-sm"
            >
              <option value="All Mediums">All Mediums</option>
              <option value="English Medium">English</option>
              <option value="Gujarati Medium">Gujarati</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Quick Chip Filters & Add Student Trigger */}
        <div className="flex items-center justify-between lg:justify-end gap-3">
          <div className="bg-slate-100 p-0.5 rounded-lg border border-slate-200/50 flex">
            <button
              onClick={() => setChipFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
                chipFilter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setChipFilter('RTE')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
                chipFilter === 'RTE'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              RTE Only
            </button>
            <button
              onClick={() => setChipFilter('TRANSPORT')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
                chipFilter === 'TRANSPORT'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              With Transport
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md shadow-blue-500/10 transition-all active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5 stroke-[3]" />
            Add Student
          </button>
        </div>
      </div>

      {/* Student Card Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredStudents.length === 0 ? (
          <div className="col-span-2 text-center text-xs text-slate-400 py-10">
            No students found matching your criteria.
          </div>
        ) : (
          filteredStudents.map((s) => {
            const initials = (s.studentName ?? '')
              .split(' ')
              .map((n) => n[0])
              .join('');
            const isRTE = s.isRTE;

            // Backend does not provide a `status` field; default to empty string.
            const status = s.status ?? '';
            let badgeStyle = 'bg-emerald-50 text-emerald-600 border border-emerald-200';
            if (status === '2 DUE') badgeStyle = 'bg-red-50 text-red-500 border border-red-200';
            else if (status === '1 DUE') badgeStyle = 'bg-blue-50 text-blue-500 border border-blue-200';
            else if (status === '3+ DUE') badgeStyle = 'bg-red-100 text-red-700 border border-red-300';
            else if (status === 'PARTIAL') badgeStyle = 'bg-amber-50 text-amber-500 border border-amber-200';
            else if (status === 'RTE') badgeStyle = 'bg-purple-50 text-purple-600 border border-purple-200';

            return (
              <div
                key={s._id}
                className="bg-white border border-slate-100 rounded-2xl p-5 flex items-start justify-between shadow-sm hover:shadow-md transition-all duration-300 relative"
              >
                <div className="flex items-start gap-4">
                  {/* Initials bubble */}
                  <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 font-bold text-base flex items-center justify-center border border-amber-100 uppercase shrink-0">
                    {initials}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-slate-800 text-base">{s.studentName}</h4>
                      {isRTE && (
                        <span className="bg-purple-100 text-purple-600 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
                          RTE
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs text-slate-500">
                      Std {s.standard} · Division {s.division} ·{' '}
                      <span className="font-medium">{s.medium} Medium</span>
                    </p>
                    
                    <span className="text-slate-400 text-[10px] block font-mono">
                      {s.studentCode}
                    </span>
                    
                    <div className="pt-1.5 flex flex-wrap gap-2 items-center">
                      <span className="text-[10px] text-slate-400 font-semibold">
                        Parent: {s.parentMobile ?? 'N/A'}
                      </span>
                      {s.transportType !== 'None' && (
                        <>
                          <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                          <span className="text-[10px] text-blue-500 font-bold tracking-wide uppercase">
                            {s.transportType} Transport
                          </span>
                        </>
                      )}
                      {isRTE && (
                        <>
                          <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                          <span className="text-[10px] text-purple-500 font-bold uppercase">Govt pays</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side stats & buttons */}
                <div className="flex flex-col items-end justify-between h-full gap-8">
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${badgeStyle}`}>
                    {s.status === '3+ DUE' ? '3+ DUE' : s.status}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setScreen('receipts')}
                      className="bg-white border border-slate-200 hover:border-slate-300 text-slate-500 font-bold px-3.5 py-1.5 rounded-xl text-xs shadow-sm transition-all"
                    >
                      View
                    </button>
                    {!isRTE && (
                      <button
                        onClick={() => setScreen('collect-fee')}
                        className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold px-3.5 py-1.5 rounded-xl text-xs shadow-sm transition-all"
                      >
                        Collect
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Add Student Modal Panel */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-100 shadow-2xl p-6 relative overflow-hidden animate-scale-up">
            {/* Top title bar */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <h3 className="text-base font-extrabold text-slate-800">Add New Student Profile</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Student Name</label>
                  <input
                    type="text"
                    required
                    value={newSName}
                    onChange={(e) => setNewSName(e.target.value)}
                    placeholder="Enter student's full name"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Parent Name</label>
                  <input
                    type="text"
                    required
                    value={newSParentName}
                    onChange={(e) => setNewSParentName(e.target.value)}
                    placeholder="Enter parent's full name"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Parent Mobile</label>
                  <input
                    type="text"
                    required
                    value={newSParentMobile}
                    onChange={(e) => setNewSParentMobile(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Medium of Instruction</label>
                  <select
                    value={newSMedium}
                    onChange={(e) => setNewSMedium(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="English">English Medium</option>
                    <option value="Gujarati">Gujarati Medium</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Standard</label>
                  <select
                    value={newSStandard}
                    onChange={(e) => setNewSStandard(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  >
                    {['3', '5', '6', '7', '8', '9', '10'].map((std) => (
                      <option key={std} value={std}>Std {std}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Division</label>
                  <select
                    value={newSDivision}
                    onChange={(e) => setNewSDivision(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="A">Division A</option>
                    <option value="B">Division B</option>
                    <option value="C">Division C</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Transport Zone</label>
                  <select
                    value={newSTransport}
                    onChange={(e) => setNewSTransport(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="None">None</option>
                    <option value="Railnagar">Railnagar (+₹600)</option>
                    <option value="Outside Railnagar">Outside Railnagar (+₹900)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="rteCheckbox"
                  checked={newSIsRTE}
                  onChange={(e) => setNewSIsRTE(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded cursor-pointer"
                />
                <label htmlFor="rteCheckbox" className="text-xs font-bold text-slate-600 cursor-pointer select-none">
                  Student admitted under RTE (Right to Education) quota
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-4 py-2 rounded-xl text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-md shadow-blue-500/10 transition-all"
                >
                  Create Student Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
