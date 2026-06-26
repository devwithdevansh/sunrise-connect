// June to May (All 12 months unpaid): jun to may
// July to May (June is paid; July onwards unpaid): jul to may
// August to May (June and July paid; August onwards unpaid): aug to may
// September to May (June to August paid; September onwards unpaid): sep to may
// October to May (June to September paid; October onwards unpaid): oct to may
// November to May (June to October paid; November onwards unpaid): nov to may
// December to May (June to November paid; December onwards unpaid): dec to may
// January to May (June to December paid; January onwards unpaid): jan to may
// February to May (June to December + Jan paid; February onwards unpaid): feb to may
// March to May (June to December + Jan and Feb paid; March onwards unpaid): mar to may
// April to May (June to December + Jan to Mar paid; April and May unpaid): apr to may
// May only unpaid (June to April paid; only May unpaid): may to may


import React, { useState, useRef } from 'react';
import { useApp } from '../store';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  Database,
  Info
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExcelRow {
  studentName: string;
  medium: string;
  standard: string;
  division: string;
  parentName: string;
  parentMobile: string;
  parentSecondaryMobile: string;
  transportType: string;
  isRTE: boolean | string;
  isNewAdmission: boolean | string;
  pendingFees?: Record<string, string>;
}

export const ImportExcel: React.FC = () => {
  const { importStudents, setScreen } = useApp();

  const [previewData, setPreviewData] = useState<ExcelRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successReport, setSuccessReport] = useState<{
    successCount: number;
    failCount: number;
    results: any[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fieldsSchema = [
    { name: 'Student Name', dbName: 'studentName', required: true, example: 'Rahul Sharma', desc: 'Full name of the student' },
    { name: 'Medium', dbName: 'medium', required: true, example: 'English', desc: 'Must be "English" or "Gujarati"' },
    { name: 'Standard', dbName: 'standard', required: true, example: '5', desc: 'Class standard (e.g. 3, 5, 6, 7, 8, 9, 10)' },
    { name: 'Division', dbName: 'division', required: true, example: 'A', desc: 'Section/division code (e.g. A, B, C)' },
    { name: 'Parent Name', dbName: 'parentName', required: true, example: 'Amit Sharma', desc: 'Full name of parent' },
    { name: 'Parent Mobile', dbName: 'parentMobile', required: true, example: '9876543210', desc: '10-digit Indian mobile number' },
    { name: 'Parent Secondary Mobile', dbName: 'parentSecondaryMobile', required: false, example: '9876543211', desc: 'Optional backup contact' },
    { name: 'Transport Type', dbName: 'transportType', required: false, example: 'Railnagar', desc: '"Railnagar", "Outside Railnagar", or "None"' },
    { name: 'Is RTE', dbName: 'isRTE', required: false, example: 'No', desc: 'Right to Education quota ("Yes", "No", true, false)' },
    { name: 'Is New Admission', dbName: 'isNewAdmission', required: false, example: 'Yes', desc: 'Applies admission charges ("Yes", "No", true, false)' },
    { name: 'Year YYYY-YY (e.g. Year 2025-26)', dbName: 'pendingFees', required: false, example: 'oct to may', desc: 'Set payment status: "paid", "gov paid", or a range like "oct to may", "term-2 to may"' },
  ];

  const downloadTemplate = () => {
    const sampleData = [
      {
        "Student Name": "Rahul Amit Sharma",
        "Medium": "English",
        "Standard": "5",
        "Division": "A",
        "Parent Name": "Amit Sharma",
        "Parent Mobile": "9876543210",
        "Parent Secondary Mobile": "9876543211",
        "Transport Type": "Railnagar",
        "Is RTE": "No",
        "Is New Admission": "Yes",
        "Year 2025-26": "oct to may"
      },
      {
        "Student Name": "Ketan Patel",
        "Medium": "Gujarati",
        "Standard": "6",
        "Division": "B",
        "Parent Name": "Manish Patel",
        "Parent Mobile": "9988776655",
        "Parent Secondary Mobile": "",
        "Transport Type": "None",
        "Is RTE": "Yes",
        "Is New Admission": "No",
        "Year 2025-26": "gov paid"
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students Import Template");

    // Auto fit column widths
    const maxLens = sampleData.reduce((acc, row) => {
      Object.keys(row).forEach((key) => {
        const val = String((row as any)[key] || '');
        acc[key] = Math.max(acc[key] || 10, val.length, key.length);
      });
      return acc;
    }, {} as Record<string, number>);
    worksheet["!cols"] = Object.keys(maxLens).map(key => ({ wch: maxLens[key] + 3 }));

    XLSX.writeFile(workbook, "sunrise_students_import_template.xlsx");
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
      setErrorMsg("Invalid file type. Please upload an Excel sheet (.xlsx, .xls) or CSV file.");
      return;
    }

    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawJson = XLSX.utils.sheet_to_json(ws);

        if (rawJson.length === 0) {
          setErrorMsg("The selected file is empty.");
          return;
        }

        const mapped: ExcelRow[] = rawJson.map((row: any) => {
          // Normalize boolean inputs from strings
          const parseRTE = row["Is RTE"] !== undefined ? row["Is RTE"] : row["isRTE"];
          const parseNew = row["Is New Admission"] !== undefined ? row["Is New Admission"] : row["isNewAdmission"];

          // Parse any dynamic academic year columns (e.g. Year 2025-26)
          const pendingFees: Record<string, string> = {};
          Object.keys(row).forEach(key => {
            const match = key.match(/^year\s+(\d{4}-\d{2})$/i);
            if (match) {
              const year = match[1];
              pendingFees[year] = String(row[key] || '').trim();
            }
          });

          return {
            studentName: row["Student Name"] || row["studentName"] || "",
            medium: row["Medium"] || row["medium"] || "",
            standard: String(row["Standard"] || row["standard"] || ""),
            division: String(row["Division"] || row["division"] || ""),
            parentName: row["Parent Name"] || row["parentName"] || "",
            parentMobile: String(row["Parent Mobile"] || row["parentMobile"] || ""),
            parentSecondaryMobile: String(row["Parent Secondary Mobile"] || row["parentSecondaryMobile"] || ""),
            transportType: row["Transport Type"] || row["transportType"] || "None",
            isRTE: parseRTE,
            isNewAdmission: parseNew,
            pendingFees,
          };
        });

        setPreviewData(mapped);
      } catch (err: any) {
        console.error(err);
        setErrorMsg("Failed to parse the Excel file. Make sure columns are formatted correctly.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleImportSubmit = async () => {
    if (previewData.length === 0) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const report = await importStudents(previewData);
      setSuccessReport(report);
      setPreviewData([]);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred during import.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setPreviewData([]);
    setSuccessReport(null);
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Basic row-level validation warnings displayed directly in frontend preview table
  const validateRow = (row: ExcelRow) => {
    const errors: string[] = [];
    if (!row.studentName.trim()) errors.push("Name missing");
    if (!row.medium || !['English', 'Gujarati'].includes(row.medium)) errors.push("Medium must be English/Gujarati");
    if (!row.standard.trim()) errors.push("Standard missing");
    if (!row.division.trim()) errors.push("Division missing");
    if (!row.parentName.trim()) errors.push("Parent name missing");

    const mobileClean = row.parentMobile.replace(/\D/g, '');
    if (!mobileClean) {
      errors.push("Primary mobile missing");
    } else if (!/^[6-9]\d{9}$/.test(mobileClean)) {
      errors.push("Invalid Indian mobile (needs 10 digits)");
    }

    if (row.parentSecondaryMobile) {
      const secMobile = row.parentSecondaryMobile.replace(/\D/g, '');
      if (secMobile && !/^[6-9]\d{9}$/.test(secMobile)) {
        errors.push("Invalid backup mobile");
      }
    }

    if (row.transportType && !['Railnagar', 'Outside Railnagar', 'None'].includes(row.transportType)) {
      errors.push("Invalid transport type");
    }

    if (row.pendingFees) {
      Object.keys(row.pendingFees).forEach(year => {
        const val = row.pendingFees![year].toLowerCase();
        if (val && val !== 'paid' && val !== 'gov paid') {
          if (!/^[a-z0-9\- ]+ to may$/i.test(val)) {
            errors.push(`Invalid ${year} status (e.g. "oct to may")`);
          }
        }
      });
    }

    return errors;
  };

  return (
    <div className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <button
            onClick={() => setScreen('students')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-wider mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Students
          </button>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="h-7 w-7 text-blue-600" />
            Import Excel Spreadsheet
          </h2>
          <p className="text-xs font-semibold text-slate-400">
            Import student profiles and automatically register parents & create fee structures.
          </p>
        </div>

        <button
          onClick={downloadTemplate}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-md shadow-blue-500/10 transition-all hover:scale-[1.01] active:scale-[0.99] shrink-0"
        >
          <Download className="h-4 w-4" />
          Download Excel Template
        </button>
      </header>

      {/* Main Section */}
      {!successReport ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Instructions and Database Schema Alignment */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-5 lg:col-span-1">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Database className="h-5 w-5 text-blue-600" />
              <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Fields Schema Mapping</h3>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                To guarantee clean data inserts, your Excel file columns must align exactly with the school database fields. Use the visual guide below:
              </p>

              <div className="space-y-3.5 overflow-y-auto max-h-[380px] pr-1.5 custom-scrollbar">
                {fieldsSchema.map((field) => (
                  <div key={field.name} className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-700">{field.name}</span>
                      {field.required ? (
                        <span className="text-[9px] font-bold bg-red-50 text-red-500 border border-red-100 px-1.5 py-0.2 rounded uppercase">Required</span>
                      ) : (
                        <span className="text-[9px] font-bold bg-slate-100 text-slate-400 px-1.5 py-0.2 rounded uppercase">Optional</span>
                      )}
                    </div>
                    <span className="text-[10px] block font-mono text-blue-600 mt-1">Schema ID: {field.dbName}</span>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1.5">{field.desc}</p>
                    <div className="mt-1 bg-white border border-slate-200/50 rounded px-2 py-0.5 inline-block text-[9px] text-slate-500">
                      Example: <strong className="font-bold text-slate-600">{field.example}</strong>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3.5 flex gap-2.5">
                <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
                  <strong>Parent Sync Logic:</strong> If the primary phone number already exists in the system, the imported student will be automatically linked to that existing parent (registering them as siblings).
                </p>
              </div>
            </div>
          </div>

          {/* Upload and Live Preview Section */}
          <div className="lg:col-span-2 space-y-6">
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs font-bold flex items-start gap-2.5 animate-shake">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {previewData.length === 0 ? (
              /* Drag & Drop Area */
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`bg-white border-2 border-dashed rounded-3xl p-12 text-center transition-all flex flex-col items-center justify-center space-y-4 cursor-pointer min-h-[360px] shadow-sm ${isDragging
                    ? 'border-blue-500 bg-blue-50/20'
                    : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50/30'
                  }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="bg-blue-50 text-blue-600 p-5 rounded-full border border-blue-100">
                  <Upload className="h-8 w-8 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-extrabold text-slate-800">Drag & drop student Excel sheet here</h4>
                  <p className="text-xs text-slate-400 font-semibold">Supports .xlsx, .xls, and .csv formats</p>
                </div>
                <span className="text-xs font-bold text-slate-400 py-1.5 px-4 bg-slate-100 rounded-full">Or browse local files</span>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                />
              </div>
            ) : (
              /* Live Preview Table */
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Spreadsheet Preview</h3>
                    <p className="text-[10px] text-slate-400 font-semibold">Loaded {previewData.length} records. Review columns before finalizing import.</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleReset}
                      disabled={isLoading}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-4 py-2 rounded-xl text-xs transition-all disabled:opacity-50"
                    >
                      Clear File
                    </button>
                    <button
                      onClick={handleImportSubmit}
                      disabled={isLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-md shadow-blue-500/10 transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isLoading ? "Importing..." : "Finalize & Import Dues"}
                      {!isLoading && <ChevronRight className="h-4 w-4 stroke-[3]" />}
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-100 rounded-xl max-h-[420px] custom-scrollbar">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[9px] bg-slate-50">
                        <th className="py-3 px-4">Row</th>
                        <th className="py-3 px-4">Student Info</th>
                        <th className="py-3 px-4">Medium/Class</th>
                        <th className="py-3 px-4">Parent Details</th>
                        <th className="py-3 px-4">Other Flags</th>
                        <th className="py-3 px-4 text-center">Validation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {previewData.map((row, idx) => {
                        const rowErrors = validateRow(row);
                        const hasErrors = rowErrors.length > 0;
                        return (
                          <tr key={idx} className={`hover:bg-slate-50/50 transition-colors ${hasErrors ? 'bg-amber-50/20' : ''}`}>
                            <td className="py-3 px-4 font-mono font-bold text-slate-400">{idx + 1}</td>
                            <td className="py-3 px-4">
                              <span className="font-extrabold text-slate-800 block">{row.studentName || <span className="text-red-400 italic">Empty</span>}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-semibold text-slate-600 block">Std {row.standard || '-'}-{row.division || '-'}</span>
                              <span className="text-[10px] text-slate-400">{row.medium}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-slate-700 block">{row.parentName || '-'}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{row.parentMobile || '-'}</span>
                            </td>
                            <td className="py-3 px-4 space-y-1">
                              <div className="flex gap-1.5 flex-wrap">
                                {row.transportType && row.transportType !== 'None' && (
                                  <span className="bg-blue-50 text-blue-600 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">Transport: {row.transportType}</span>
                                )}
                                {(String(row.isRTE).toLowerCase() === 'yes' || row.isRTE === 'true' || row.isRTE === true) && (
                                  <span className="bg-purple-50 text-purple-600 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">RTE</span>
                                )}
                                {(String(row.isNewAdmission).toLowerCase() === 'yes' || row.isNewAdmission === 'true' || row.isNewAdmission === true) && (
                                  <span className="bg-emerald-50 text-emerald-600 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">New</span>
                                )}
                                {row.pendingFees && Object.keys(row.pendingFees).map(yr => (
                                  <span key={yr} className="bg-amber-50 text-amber-700 border border-amber-200 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">
                                    {yr}: {row.pendingFees?.[yr]}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {hasErrors ? (
                                <div className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-bold bg-amber-50 border border-amber-100 rounded-lg py-1 px-2.5 text-left max-w-[200px]" title={rowErrors.join(', ')}>
                                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                  <span className="truncate">{rowErrors[0]}</span>
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 rounded-lg py-1 px-2.5">
                                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                  Ready
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Report Dashboard */
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6 max-w-4xl mx-auto">
          {/* Summary KPIs */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-center">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-1">Total Imported</span>
              <strong className="text-2xl font-extrabold text-slate-800">{successReport.successCount + successReport.failCount}</strong>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 text-center">
              <span className="text-emerald-500 font-bold uppercase tracking-wider text-[10px] block mb-1">Success</span>
              <strong className="text-2xl font-extrabold text-emerald-600">{successReport.successCount}</strong>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-center">
              <span className="text-red-400 font-bold uppercase tracking-wider text-[10px] block mb-1">Failed</span>
              <strong className="text-2xl font-extrabold text-red-500">{successReport.failCount}</strong>
            </div>
          </div>

          {/* Detailed results logs */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Import Status Details</h3>
            <div className="border border-slate-100 rounded-xl overflow-x-auto max-h-[300px] custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[9px] bg-slate-50">
                    <th className="py-2.5 px-4">Row</th>
                    <th className="py-2.5 px-4">Student</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {successReport.results.map((res: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/30">
                      <td className="py-2.5 px-4 font-mono text-slate-400">{res.row}</td>
                      <td className="py-2.5 px-4 font-extrabold text-slate-800">{res.studentName}</td>
                      <td className="py-2.5 px-4">
                        {res.status === 'success' ? (
                          <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold text-[9px] border border-emerald-100 uppercase tracking-wider">Success</span>
                        ) : (
                          <span className="text-red-500 bg-red-50 px-2 py-0.5 rounded-full font-bold text-[9px] border border-red-100 uppercase tracking-wider">Failed</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-xs font-semibold">
                        {res.status === 'success' ? (
                          <span className="text-slate-400 font-mono">Assigned Code: {res.studentCode}</span>
                        ) : (
                          <span className="text-red-500 flex items-center gap-1">
                            <XCircle className="h-3.5 w-3.5 shrink-0" />
                            {res.error}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={handleReset}
              className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-5 py-2.5 rounded-xl text-xs transition-all"
            >
              Import Another File
            </button>
            <button
              onClick={() => setScreen('students')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-md shadow-blue-500/10 transition-all"
            >
              Go to Students Screen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
