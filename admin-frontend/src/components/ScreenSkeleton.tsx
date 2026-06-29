import React from 'react';

export const ScreenSkeleton: React.FC = () => {
  return (
    <div className="flex-1 p-6 space-y-6 animate-pulse">
      {/* Header bar */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 bg-slate-200 rounded-lg w-48"></div>
          <div className="h-4 bg-slate-150 rounded-md w-36"></div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="h-10 bg-slate-250 rounded-xl w-full md:w-64"></div>
          <div className="h-10 bg-slate-200 rounded-xl w-32 shrink-0"></div>
        </div>
      </header>

      {/* Main filter / search controls */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="h-10 bg-slate-150 rounded-xl w-full md:w-80"></div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="h-10 bg-slate-150 rounded-xl w-28"></div>
          <div className="h-10 bg-slate-150 rounded-xl w-28"></div>
        </div>
      </div>

      {/* Grid or Table layout skeleton */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="h-5 bg-slate-200 rounded w-32"></div>
          <div className="h-7 bg-slate-200 rounded-lg w-16"></div>
        </div>
        <div className="space-y-4 pt-2">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0">
              <div className="space-y-2 w-1/4">
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-3 bg-slate-150 rounded w-1/2"></div>
              </div>
              <div className="h-4 bg-slate-200 rounded w-16"></div>
              <div className="h-4 bg-slate-200 rounded w-24"></div>
              <div className="h-4 bg-slate-150 rounded w-12"></div>
              <div className="h-7 bg-slate-150 rounded-full w-20"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScreenSkeleton;
