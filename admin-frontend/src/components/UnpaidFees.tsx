import React, { useState } from 'react';
import { useApp } from '../store';

import {
  Search,
  ChevronDown,
  FileSpreadsheet,
  MessageSquare,
  CheckSquare,
  Square
} from 'lucide-react';

export const UnpaidFees: React.FC = () => {
  const { students, ledgerEntries, setScreen } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [dueFilter, setDueFilter] = useState<'ALL' | '1_DUE' | '2_DUE' | '3_DUE'>('ALL');
  
  // Selection states for WhatsApp bulk sending
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Class filters dropdown state
  const [classFilter, setClassFilter] = useState('All Classes');
  const [mediumFilter, setMediumFilter] = useState('All Mediums');
  const [zoneFilter, setZoneFilter] = useState('All Zones');

  // Hardcoded counts matching the UI wireframe
  const counts = {
    all: 233,
    oneMonth: 142,
    twoMonths: 68,
    threeMonths: 23
  };

  // Map students to overdue profiles matching the wireframe rows
  const unpaidStudents = students.filter((s) => {
    // Exclude paid and RTE students
    if (s.status === 'PAID' || s.status === 'RTE') return false;

    // Filter by tab selection
    if (dueFilter === '1_DUE' && s.status !== '1 DUE') return false;
    if (dueFilter === '2_DUE' && s.status !== '2 DUE') return false;
    if (dueFilter === '3_DUE' && s.status !== '3+ DUE') return false;

    // Filter by dropdown selectors
    if (classFilter !== 'All Classes' && `${s.standard} - ${s.division}` !== classFilter) return false;
    if (mediumFilter !== 'All Mediums' && s.medium !== mediumFilter.split(' ')[0]) return false;
    if (zoneFilter !== 'All Zones') {
      const zoneType = zoneFilter.split(' ')[0];
      if (zoneType === 'Railnagar' && s.transportType !== 'Railnagar') return false;
      if (zoneType === 'Outside' && s.transportType !== 'Outside Railnagar') return false;
      if (zoneType === 'None' && s.transportType !== 'None') return false;
    }

    // Filter by Search Query
    if (searchQuery) {
      return s.studentName.toLowerCase().includes(searchQuery.toLowerCase());
    }

    return true;
  });

  const getOutstandingAmount = (studentId: string) => {
    return ledgerEntries
      .filter((l) => l.studentId === studentId && l.status !== 'PAID')
      .reduce((sum, l) => sum + l.remainingAmount, 0);
  };

  const getLastPaidMonth = (studentId: string) => {
    // Mock last paid mapping
    if (studentId === 's2') return 'April 2026';
    if (studentId === 's6') return 'March 2026';
    return 'May 2026';
  };

  const handleSelectAll = () => {
    if (selectedStudentIds.length === unpaidStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(unpaidStudents.map((s) => s._id));
    }
  };

  const handleSelectRow = (studentId: string) => {
    if (selectedStudentIds.includes(studentId)) {
      setSelectedStudentIds((prev) => prev.filter((id) => id !== studentId));
    } else {
      setSelectedStudentIds((prev) => [...prev, studentId]);
    }
  };

  const handleCollectClick = () => {
    // Set screen to collect-fee
    setScreen('collect-fee');
  };

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Top Header Bar */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Unpaid Fees</h2>
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

      {/* Filter Tabs & Quick Action Buttons */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 border-b border-slate-100 pb-4">
        {/* Due Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setDueFilter('ALL')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              dueFilter === 'ALL'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white border border-slate-100 hover:bg-slate-50 text-slate-500'
            }`}
          >
            All <span className="opacity-85 font-semibold ml-1">{counts.all}</span>
          </button>
          <button
            onClick={() => setDueFilter('1_DUE')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              dueFilter === '1_DUE'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white border border-slate-100 hover:bg-slate-50 text-slate-500'
            }`}
          >
            1 Month Due <span className="opacity-85 font-semibold ml-1">{counts.oneMonth}</span>
          </button>
          <button
            onClick={() => setDueFilter('2_DUE')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              dueFilter === '2_DUE'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white border border-slate-100 hover:bg-slate-50 text-slate-500'
            }`}
          >
            2 Months Due <span className="opacity-85 font-semibold ml-1">{counts.twoMonths}</span>
          </button>
          <button
            onClick={() => setDueFilter('3_DUE')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              dueFilter === '3_DUE'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white border border-slate-100 hover:bg-slate-50 text-slate-500'
            }`}
          >
            3+ Months Due <span className="opacity-85 font-semibold ml-1">{counts.threeMonths}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 self-end xl:self-auto">
          {/* Dropdown Filters */}
          <div className="flex items-center gap-2">
            {/* Class */}
            <div className="relative">
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="appearance-none bg-white border border-slate-200 rounded-xl py-2 pl-3 pr-8 text-xs font-semibold text-slate-600 focus:outline-none hover:border-slate-300 shadow-sm"
              >
                <option value="All Classes">All Classes</option>
                <option value="5 - B">Class 5-B</option>
                <option value="7 - A">Class 7-A</option>
                <option value="8 - A">Class 8-A</option>
                <option value="3 - C">Class 3-C</option>
                <option value="10 - B">Class 10-B</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>

            {/* Medium */}
            <div className="relative">
              <select
                value={mediumFilter}
                onChange={(e) => setMediumFilter(e.target.value)}
                className="appearance-none bg-white border border-slate-200 rounded-xl py-2 pl-3 pr-8 text-xs font-semibold text-slate-600 focus:outline-none hover:border-slate-300 shadow-sm"
              >
                <option value="All Mediums">All Mediums</option>
                <option value="English Medium">English</option>
                <option value="Gujarati Medium">Gujarati</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>

            {/* Zones / Transport */}
            <div className="relative">
              <select
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value)}
                className="appearance-none bg-white border border-slate-200 rounded-xl py-2 pl-3 pr-8 text-xs font-semibold text-slate-600 focus:outline-none hover:border-slate-300 shadow-sm"
              >
                <option value="All Zones">All Zones</option>
                <option value="Railnagar Zone">Railnagar</option>
                <option value="Outside Zone">Outside Railnagar</option>
                <option value="None Zone">No Transport</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <button className="flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold px-3 py-2 rounded-xl text-xs shadow-sm transition-all">
            <FileSpreadsheet className="h-3.5 w-3.5 text-slate-400" />
            Export Excel
          </button>
          <button
            disabled={selectedStudentIds.length === 0}
            className={`flex items-center gap-1.5 font-bold px-3 py-2 rounded-xl text-xs transition-all shadow-sm ${
              selectedStudentIds.length === 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Send WhatsApp
          </button>
        </div>
      </div>

      {/* Main Student Overdue Table Grid */}
      <section className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase bg-slate-50/50">
                <th className="py-3.5 px-4 w-12 text-center">
                  <button onClick={handleSelectAll} className="text-slate-400 hover:text-slate-600 transition-colors">
                    {selectedStudentIds.length === unpaidStudents.length && unpaidStudents.length > 0 ? (
                      <CheckSquare className="h-4 w-4 text-blue-600 fill-blue-50/20" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Class</th>
                <th className="py-3.5 px-4">Months Overdue</th>
                <th className="py-3.5 px-4">Outstanding</th>
                <th className="py-3.5 px-4">Last Paid</th>
                <th className="py-3.5 px-4">Transport</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {unpaidStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-slate-400">
                    No overdue students match the filter criteria.
                  </td>
                </tr>
              ) : (
                unpaidStudents.map((s) => {
                  const isChecked = selectedStudentIds.includes(s._id!);
                  const isThreePlus = s.status === '3+ DUE';
                  const isTwo = s.status === '2 DUE';

                  let badgeColor = 'bg-yellow-50 text-yellow-600 border border-yellow-100';
                  if (isThreePlus) badgeColor = 'bg-red-50 text-red-600 border border-red-100';
                  else if (isTwo) badgeColor = 'bg-amber-50 text-amber-600 border border-amber-100';

                  return (
                    <tr key={s._id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="py-4 px-4 text-center">
                        <button onClick={() => handleSelectRow(s._id!)} className="text-slate-400 hover:text-slate-600 transition-colors">
                          {isChecked ? (
                            <CheckSquare className="h-4 w-4 text-blue-600 fill-blue-50/20" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-bold text-slate-800 block">{s.studentName}</span>
                        <span className="text-slate-400 text-[10px] block font-semibold mt-0.5">
                          Parent: {s.parentMobile}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-500 font-semibold">
                        {s.standard} - {s.division} - {s.medium}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${badgeColor}`}>
                          {s.status === '3+ DUE' ? '3+ MONTHS' : s.status === '2 DUE' ? '2 MONTHS' : '1 MONTH'}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-800">
                        ₹{getOutstandingAmount(s._id!).toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 px-4 text-slate-400 text-xs font-semibold">
                        {getLastPaidMonth(s._id!)}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                          s.transportType === 'Railnagar'
                            ? 'bg-blue-100 text-blue-600'
                            : s.transportType === 'Outside Railnagar'
                            ? 'bg-indigo-100 text-indigo-600'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {s.transportType === 'Railnagar' ? 'RAILNAGAR' : s.transportType === 'Outside Railnagar' ? 'OUTSIDE' : 'NONE'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleCollectClick()}
                          className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold px-4 py-1.5 rounded-xl text-xs shadow-sm active:scale-95 transition-all"
                        >
                          Collect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
