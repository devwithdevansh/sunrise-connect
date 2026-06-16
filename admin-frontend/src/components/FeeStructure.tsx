import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../store';
import { AlertCircle, Layers, Bus, ChevronDown, Award, Calendar, HelpCircle } from 'lucide-react';

export const FeeStructure: React.FC = () => {
  const { feeStructures, transportFeeStructures } = useApp();
  const [selectedStandard, setSelectedStandard] = useState<string>('1');

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

    const monthlyEdu = eduParts > 0 ? Math.round(annual / eduParts) : 0;
    const termFee = termParts > 0 ? Math.round(annual / termParts) : 0;
    const admission = Math.round(annual * 0.07);
    const bagKit = Math.round(annual * 0.05);

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
          <p className="text-xs font-semibold text-slate-400">Database-driven standard configurations & pricing rules</p>
        </div>

        {/* Dropdown Container */}
        <div className="flex items-center gap-3">
          <label htmlFor="standard-select" className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
            Select Standard:
          </label>
          <div className="relative">
            <select
              id="standard-select"
              value={selectedStandard}
              onChange={(e) => setSelectedStandard(e.target.value)}
              className="appearance-none bg-white border border-slate-200 text-slate-700 font-extrabold text-sm rounded-xl py-2 pl-4 pr-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer min-w-[120px] transition-all"
            >
              {standards.map((std) => (
                <option key={std} value={std}>
                  Standard {std}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none stroke-[2.5]" />
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
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Column 1: English Medium */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-200">Medium of Instruction</span>
                <h4 className="font-black text-lg tracking-tight mt-0.5">English Medium</h4>
              </div>
              <span className="text-xs font-bold bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">Std {selectedStandard}</span>
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
                    <span className="text-[10px] text-slate-400 font-semibold">Calculated as {englishDetails.termParts} equal parts</span>
                  </div>
                  <span className="text-sm font-black text-slate-800">₹{englishDetails.termFee.toLocaleString('en-IN')} /term</span>
                </div>
                <div className="flex justify-between items-center px-5 py-4 hover:bg-slate-50/30 transition-colors">
                  <div>
                    <span className="text-sm font-bold text-slate-500 block">Admission Fee</span>
                    <span className="text-[10px] text-slate-400 font-semibold">New student registration (7% of Annual)</span>
                  </div>
                  <span className="text-sm font-black text-slate-800">₹{englishDetails.admission.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center px-5 py-4 hover:bg-slate-50/30 transition-colors">
                  <div>
                    <span className="text-sm font-bold text-slate-500 block">Bag & Kit Fee</span>
                    <span className="text-[10px] text-slate-400 font-semibold">Uniform, learning materials & bag (5% of Annual)</span>
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

        {/* Column 2: Gujarati Medium */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-700 to-teal-600 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-teal-200">Medium of Instruction</span>
                <h4 className="font-black text-lg tracking-tight mt-0.5">Gujarati Medium</h4>
              </div>
              <span className="text-xs font-bold bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">Std {selectedStandard}</span>
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
                    <span className="text-[10px] text-slate-400 font-semibold">Calculated as {gujaratiDetails.termParts} equal parts</span>
                  </div>
                  <span className="text-sm font-black text-slate-800">₹{gujaratiDetails.termFee.toLocaleString('en-IN')} /term</span>
                </div>
                <div className="flex justify-between items-center px-5 py-4 hover:bg-slate-50/30 transition-colors">
                  <div>
                    <span className="text-sm font-bold text-slate-500 block">Admission Fee</span>
                    <span className="text-[10px] text-slate-400 font-semibold">New student registration (7% of Annual)</span>
                  </div>
                  <span className="text-sm font-black text-slate-800">₹{gujaratiDetails.admission.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center px-5 py-4 hover:bg-slate-50/30 transition-colors">
                  <div>
                    <span className="text-sm font-bold text-slate-500 block">Bag & Kit Fee</span>
                    <span className="text-[10px] text-slate-400 font-semibold">Uniform, learning materials & bag (5% of Annual)</span>
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
        <div className="flex items-center gap-2">
          <Bus className="h-5 w-5 text-indigo-500" />
          <h3 className="font-extrabold text-base text-slate-800">Transport Rate Configurations</h3>
        </div>
        <p className="text-xs font-semibold text-slate-400 mt-1">
          Standard monthly charge based on student's registered pickup zone/route
        </p>

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
              <div className="text-right">
                <span className="text-base font-black text-slate-800">₹{trans.amount.toLocaleString('en-IN')}</span>
                <span className="text-[10px] text-slate-400 font-bold block">/month</span>
              </div>
            </div>
          ))}
          {transportFeeStructures.length === 0 && (
            <p className="text-xs font-semibold text-slate-400 py-4 col-span-2 text-center">No transport routes config loaded from database.</p>
          )}
        </div>
      </section>
    </div>
  );
};

