import React from 'react';

interface PrintReportProps {
  report: {
    type: string;
    title: string;
    data: any;
  };
}

export const PrintReport: React.FC<PrintReportProps> = ({ report }) => {
  const { type, title, data } = report;
  const todayStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="hidden print:block p-8 bg-white text-slate-800 font-sans min-h-screen text-xs w-full">
      {/* Printable Header */}
      <div className="border-b-2 border-slate-300 pb-4 mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">SUNRISE PUBLIC SCHOOL</h1>
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Sunrise Connect Administration Portal</p>
        </div>
        <div className="text-right">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest">{title}</h2>
          <p className="text-[9px] text-slate-400 font-semibold mt-1">Generated: {todayStr}</p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. DAILY COLLECTIONS PRINT VIEW */}
      {/* ======================================================== */}
      {type === 'daily-collections' && (
        <div className="space-y-6">
          {/* Summary Panel */}
          <div className="grid grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Collected</div>
              <div className="text-lg font-extrabold text-slate-800">₹{data.totalCollected.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Cash Mode</div>
              <div className="text-sm font-bold text-slate-800">₹{data.cashCollected.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Online Mode</div>
              <div className="text-sm font-bold text-slate-800">₹{data.onlineCollected.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Cheque Mode</div>
              <div className="text-sm font-bold text-slate-800">₹{data.chequeCollected.toLocaleString()}</div>
            </div>
          </div>

          {/* Table */}
          <table className="w-full text-left border-collapse border border-slate-200">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-350 text-[10px] uppercase font-bold text-slate-700">
                <th className="py-2.5 px-3 border-r border-slate-200">S.No</th>
                <th className="py-2.5 px-3 border-r border-slate-200">Student Code</th>
                <th className="py-2.5 px-3 border-r border-slate-200">Student Name</th>
                <th className="py-2.5 px-3 border-r border-slate-200">Class & Medium</th>
                <th className="py-2.5 px-3 border-r border-slate-200">Fee Category</th>
                <th className="py-2.5 px-3 border-r border-slate-200">Method</th>
                <th className="py-2.5 px-3 border-r border-slate-200">Time</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.transactions.map((t: any, idx: number) => (
                <tr key={t.id} className="text-[10px]">
                  <td className="py-2 px-3 border-r border-slate-200 font-semibold text-slate-400">{idx + 1}</td>
                  <td className="py-2 px-3 border-r border-slate-200 font-mono text-slate-500">{t.studentCode}</td>
                  <td className="py-2 px-3 border-r border-slate-200 font-bold text-slate-850">{t.studentName}</td>
                  <td className="py-2 px-3 border-r border-slate-200 font-medium text-slate-600">{t.classInfo}</td>
                  <td className="py-2 px-3 border-r border-slate-200 text-slate-500 font-medium">{t.feeType.replace(/\n/g, ', ')}</td>
                  <td className="py-2 px-3 border-r border-slate-200 font-bold uppercase text-slate-700">{t.method}</td>
                  <td className="py-2 px-3 border-r border-slate-200 font-semibold text-slate-400">{t.time}</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-800">₹{t.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. OUTSTANDING DUES PRINT VIEW */}
      {/* ======================================================== */}
      {type === 'outstanding-dues' && (
        <div className="space-y-6">
          {/* Summary Panel */}
          <div className="grid grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Outstanding Dues</div>
              <div className="text-lg font-extrabold text-red-650">₹{data.totalOutstandingAmount.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Students with Dues</div>
              <div className="text-sm font-bold text-slate-800">{data.studentCount}</div>
            </div>
            <div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Avg. Dues/Student</div>
              <div className="text-sm font-bold text-slate-800">
                ₹{data.studentCount > 0 ? Math.round(data.totalOutstandingAmount / data.studentCount).toLocaleString() : 0}
              </div>
            </div>
            <div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Dues Aging (1M/2M/3M+)</div>
              <div className="text-sm font-bold text-slate-850">
                {data.oneDueCount} / {data.twoDueCount} / {data.threePlusDueCount}
              </div>
            </div>
          </div>

          {/* Table */}
          <table className="w-full text-left border-collapse border border-slate-200">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-350 text-[10px] uppercase font-bold text-slate-700">
                <th className="py-2.5 px-3 border-r border-slate-200">S.No</th>
                <th className="py-2.5 px-3 border-r border-slate-200">Student Code</th>
                <th className="py-2.5 px-3 border-r border-slate-200">Student Name</th>
                <th className="py-2.5 px-3 border-r border-slate-200">Class Info</th>
                <th className="py-2.5 px-3 border-r border-slate-200">Parent Name</th>
                <th className="py-2.5 px-3 border-r border-slate-200">Parent Mobile</th>
                <th className="py-2.5 px-3 border-r border-slate-200">Overdue Items</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-right">Edu Dues</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-right">Trans Dues</th>
                <th className="py-2.5 px-3 text-right">Outstanding Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.students.map((s: any, idx: number) => (
                <tr key={s.id} className="text-[10px]">
                  <td className="py-2 px-3 border-r border-slate-200 font-semibold text-slate-400">{idx + 1}</td>
                  <td className="py-2 px-3 border-r border-slate-200 font-mono text-slate-500">{s.studentCode}</td>
                  <td className="py-2 px-3 border-r border-slate-200 font-bold text-slate-850">{s.studentName}</td>
                  <td className="py-2 px-3 border-r border-slate-200 font-medium text-slate-650">{s.classInfo}</td>
                  <td className="py-2 px-3 border-r border-slate-200 font-medium text-slate-600">{s.parentName}</td>
                  <td className="py-2 px-3 border-r border-slate-200 font-semibold text-slate-400">{s.parentMobile}</td>
                  <td className="py-2 px-3 border-r border-slate-200 font-bold text-slate-650">{s.overdueCount} Months</td>
                  <td className="py-2 px-3 border-r border-slate-200 text-right font-extrabold text-orange-500">₹{s.educationDue.toLocaleString()}</td>
                  <td className="py-2 px-3 border-r border-slate-200 text-right font-extrabold text-amber-500">₹{s.transportDue.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right font-extrabold text-slate-800">₹{s.totalDue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. RTE RECONCILE PRINT VIEW */}
      {/* ======================================================== */}
      {type === 'rte-reconcile' && (
        <div className="space-y-6">
          {/* Summary Panel */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total RTE Enrolled Students</div>
              <div className="text-base font-extrabold text-slate-800">{data.studentCount} Students</div>
            </div>
            <div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Exempted Tuition Fee Reimbursement</div>
              <div className="text-base font-extrabold text-indigo-700">₹{data.totalExemptedAmount.toLocaleString()}</div>
            </div>
          </div>

          {/* Table */}
          <table className="w-full text-left border-collapse border border-slate-200">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-350 text-[10px] uppercase font-bold text-slate-700">
                <th className="py-2.5 px-3 border-r border-slate-200">S.No</th>
                <th className="py-2.5 px-3 border-r border-slate-200">Student Code</th>
                <th className="py-2.5 px-3 border-r border-slate-200">Student Name</th>
                <th className="py-2.5 px-3 border-r border-slate-200">Class & Section</th>
                <th className="py-2.5 px-3 border-r border-slate-200">Parent Name</th>
                <th className="py-2.5 px-3 border-r border-slate-200">Parent Mobile</th>
                <th className="py-2.5 px-3 text-right">Exempted Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.students.map((s: any, idx: number) => (
                <tr key={s.id} className="text-[10px]">
                  <td className="py-2 px-3 border-r border-slate-200 font-semibold text-slate-400">{idx + 1}</td>
                  <td className="py-2 px-3 border-r border-slate-200 font-mono text-slate-500">{s.studentCode}</td>
                  <td className="py-2 px-3 border-r border-slate-200 font-bold text-slate-850">{s.studentName}</td>
                  <td className="py-2 px-3 border-r border-slate-200 font-medium text-slate-650">{s.classInfo}</td>
                  <td className="py-2 px-3 border-r border-slate-200 font-medium text-slate-600">{s.parentName}</td>
                  <td className="py-2 px-3 border-r border-slate-200 font-semibold text-slate-400">{s.parentMobile}</td>
                  <td className="py-2 px-3 text-right font-extrabold text-indigo-650">₹{s.exemptedAmount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer / Signatures */}
      <div className="mt-16 pt-8 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400 font-semibold">
        <div>
          <p>Sunrise Connect Administration System</p>
          <p className="text-[8px] text-slate-350">Securely verified via Digital Ledger Access Protocol</p>
        </div>
        <div className="w-48 text-center border-t border-slate-300 pt-2 text-slate-600">
          <p>Authorized Signature</p>
          <p className="text-[8px] text-slate-400 mt-0.5">Office of the School Principal</p>
        </div>
      </div>
    </div>
  );
};