const fs = require('fs');
const file = 'admin-frontend/src/components/CollectFee.tsx';
let c = fs.readFileSync(file, 'utf8');

const startStr = '          </button>\n        </div>';
const sIdx = c.indexOf(startStr) + startStr.length;
const endStr = '        )}\n      </section>';
const eIdx = c.indexOf(endStr);
const jsx = c.substring(sIdx, eIdx) + '\n        )}';

const blockStart = c.indexOf('  return (\n    <div className="flex-grow flex');

const newR = `  const renderPaymentDetails = () => (
    <>
      <div className="flex items-center justify-between md:mb-6 mb-4">
        <h3 className="text-base font-bold text-slate-800 hidden md:block">2. Payment Details</h3>
        <div className="md:hidden"></div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); if (selectedStudent) setIsCustomFeeModalOpen(true); }}
          disabled={!selectedStudent}
          className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-3.5 w-3.5 stroke-[3]" />
          Add Custom Fee
        </button>
      </div>
${jsx}
    </>
  );

  return (
    <div className="flex-grow flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100 min-h-0 h-screen overflow-hidden">
      <StudentSidebar
        filteredStudents={filteredStudents}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedStudent={selectedStudent}
        onSelectStudent={(student) => {
          if (selectedStudent?._id === student._id) {
            setSelectedStudent(null);
          } else {
            setSelectedStudent(student);
            setSelectedFees([]);
            setFeeCategory('EDUCATION');
            setSelectedYear(activeYearName);
          }
        }}
        activeYearName={activeYearName}
        renderMobilePaymentDetails={renderPaymentDetails}
      />

      <section className="hidden md:block flex-grow p-6 overflow-y-auto">
        {renderPaymentDetails()}
      </section>
`;

c = c.substring(0, blockStart) + newR + c.substring(eIdx + endStr.length);
fs.writeFileSync(file, c);
console.log('success');
