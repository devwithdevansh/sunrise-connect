import React, { useState, useEffect } from 'react';
import { useApp } from '../store';
import { Users, ArrowRight, CheckCircle } from 'lucide-react';

export const PromoteStudents: React.FC = () => {
  const { students, setScreen } = useApp();
  const [sourceClass, setSourceClass] = useState('5');
  const [sourceDiv, setSourceDiv] = useState('A');
  const [targetClass, setTargetClass] = useState('6');
  const [targetDiv, setTargetDiv] = useState('A');
  const [targetYear, setTargetYear] = useState('2026-27');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (sourceClass) {
      const next = parseInt(sourceClass) + 1;
      setTargetClass(next <= 12 ? next.toString() : sourceClass);
      setTargetDiv(sourceDiv);
    }
  }, [sourceClass, sourceDiv]);

  const eligibleStudents = students.filter(s => 
    s.standard === sourceClass && 
    s.division === sourceDiv &&
    (searchQuery === '' || s.studentName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toggleAll = () => {
    if (selectedStudentIds.length === eligibleStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(eligibleStudents.map(s => s._id || s.id));
    }
  };

  const toggleStudent = (id: string) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(prev => prev.filter(sid => sid !== id));
    } else {
      setSelectedStudentIds(prev => [...prev, id]);
    }
  };

  const handlePromote = async () => {
    if (selectedStudentIds.length === 0) return;
    if (!window.confirm(`Promote ${selectedStudentIds.length} students to Std ${targetClass}-${targetDiv} for ${targetYear}?`)) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/v1/students/promote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentIds: selectedStudentIds,
          targetStandard: targetClass,
          targetDivision: targetDiv,
          targetAcademicYear: targetYear
        })
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setScreen('students');
        }, 2000);
      } else {
        alert('Failed to promote students');
      }
    } catch (err) {
      alert('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 max-w-7xl mx-auto">
      <header>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <ArrowRight className="h-6 w-6 text-indigo-500" /> Bulk Student Promotion
        </h2>
        <p className="text-slate-500 text-sm mt-1">Move students to their next academic year standard.</p>
      </header>

      {success && (
        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl flex items-center gap-3 font-bold border border-emerald-200">
          <CheckCircle className="h-5 w-5" /> Students successfully promoted! Redirecting...
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Source Configuration */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Users className="h-4 w-4" /> Source Class
          </h3>
          <div className="flex gap-4">
            <select value={sourceClass} onChange={e => setSourceClass(e.target.value)} className="w-full bg-slate-50 border p-2 rounded-lg">
              {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
            </select>
            <select value={sourceDiv} onChange={e => setSourceDiv(e.target.value)} className="w-full bg-slate-50 border p-2 rounded-lg">
              {['A', 'B', 'C', 'D'].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        {/* Target Configuration */}
        <div className="bg-indigo-50 p-5 rounded-2xl shadow-sm border border-indigo-100 space-y-4">
          <h3 className="font-bold text-indigo-900 flex items-center gap-2">
            <ArrowRight className="h-4 w-4" /> Target Class
          </h3>
          <div className="flex gap-3">
            <select value={targetClass} onChange={e => setTargetClass(e.target.value)} className="w-full border p-2 rounded-lg font-bold">
              {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
            </select>
            <select value={targetDiv} onChange={e => setTargetDiv(e.target.value)} className="w-full border p-2 rounded-lg font-bold">
              {['A', 'B', 'C', 'D'].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={targetYear} onChange={e => setTargetYear(e.target.value)} className="w-full border p-2 rounded-lg font-bold">
              <option value="2025-26">2025-26</option>
              <option value="2026-27">2026-27</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[400px]">
        <div className="p-4 border-b flex items-center justify-between bg-slate-50">
          <input type="text" placeholder="Search students..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="border p-2 rounded-lg w-64 text-sm" />
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">{selectedStudentIds.length} selected</span>
            <button 
              onClick={handlePromote} disabled={selectedStudentIds.length === 0 || loading}
              className={`px-5 py-2 rounded-lg font-bold text-sm text-white ${selectedStudentIds.length > 0 && !loading ? 'bg-indigo-600' : 'bg-slate-300'}`}
            >
              {loading ? 'Promoting...' : `Promote ${selectedStudentIds.length} Students`}
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 sticky top-0">
              <tr className="border-b font-bold text-xs uppercase text-slate-500">
                <th className="p-4 w-12 text-center"><input type="checkbox" checked={eligibleStudents.length > 0 && selectedStudentIds.length === eligibleStudents.length} onChange={toggleAll} /></th>
                <th className="p-4">Student Name</th>
                <th className="p-4">Student ID</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {eligibleStudents.map(student => {
                const sId = student._id || student.id;
                const isSelected = selectedStudentIds.includes(sId);
                return (
                  <tr key={sId} onClick={() => toggleStudent(sId)} className={`cursor-pointer ${isSelected ? 'bg-indigo-50/50' : ''}`}>
                    <td className="p-4 text-center"><input type="checkbox" checked={isSelected} readOnly /></td>
                    <td className="p-4 font-bold">{student.studentName}</td>
                    <td className="p-4 font-mono">{student.studentCode}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
