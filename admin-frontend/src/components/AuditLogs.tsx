import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../store';
import { Activity, Search, Filter, Calendar, User as UserIcon } from 'lucide-react';

interface AuditLogEntry {
  _id: string;
  action: string;
  performedBy?: { _id: string; name: string; role: string };
  createdAt: string;
  details: any;
}

export const AuditLogs: React.FC = () => {
  const { authFetch } = useApp();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [staffList, setStaffList] = useState<{ _id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchVal, setSearchVal] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [selectedStaff, setSelectedStaff] = useState('ALL');
  const [dateRange, setDateRange] = useState('ALL');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

  // Debounce search query updates by 200ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(searchVal);
    }, 200);
    return () => clearTimeout(handler);
  }, [searchVal]);

  // Reset pagination on filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedAction, selectedStaff, dateRange]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [auditRes, staffRes] = await Promise.all([
          authFetch('/api/v1/audit?limit=500'), // Get more logs for filtering
          authFetch('/api/v1/users')
        ]);
        
        const auditData = await auditRes.json();
        const staffData = await staffRes.json();

        setLogs(auditData.data || []);
        setStaffList(staffData.data || []);
      } catch (err) {
        console.error('Failed to fetch audit logs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [authFetch]);

  // Derived unique actions for the filter dropdown
  const uniqueActions = useMemo(() => {
    const actions = new Set(logs.map(log => log.action));
    return Array.from(actions).sort();
  }, [logs]);

  // Apply filters locally (in a real prod app with massive logs, this would be server-side)
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // 1. Staff Filter
      if (selectedStaff !== 'ALL') {
        const actorId = log.performedBy?._id || 'SYSTEM';
        if (selectedStaff === 'SYSTEM' && log.performedBy) return false;
        if (selectedStaff !== 'SYSTEM' && actorId !== selectedStaff) return false;
      }

      // 2. Action Filter
      if (selectedAction !== 'ALL' && log.action !== selectedAction) return false;

      // 3. Date Filter
      if (dateRange !== 'ALL') {
        const logDate = new Date(log.createdAt);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - logDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (dateRange === 'TODAY' && diffDays > 1) return false;
        if (dateRange === 'WEEK' && diffDays > 7) return false;
        if (dateRange === 'MONTH' && diffDays > 30) return false;
      }

      // 4. Search Filter (searches details payload or action name)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const actionMatch = log.action.toLowerCase().includes(query);
        const detailsMatch = JSON.stringify(log.details || {}).toLowerCase().includes(query);
        const staffMatch = log.performedBy?.name.toLowerCase().includes(query) || false;
        if (!actionMatch && !detailsMatch && !staffMatch) return false;
      }

      return true;
    });
  }, [logs, selectedStaff, selectedAction, dateRange, searchQuery]);

  const totalPages = Math.ceil(filteredLogs.length / PAGE_SIZE);
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredLogs.slice(start, start + PAGE_SIZE);
  }, [filteredLogs, currentPage]);

  // Helper to format the action string (e.g. LEDGER_PAYMENT_ADDED -> Payment Added)
  const formatActionName = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase());
  };

  // Helper to generate a readable summary from the details JSON
  const getLogSummary = (log: AuditLogEntry) => {
    if (log.action === 'PAYMENT_CREATED' || log.action === 'LEDGER_PAYMENT_ADDED') {
      return `Collected ₹${log.details?.amount || 0} via ${log.details?.method || 'unknown'}`;
    }
    if (log.action === 'PAYMENT_REVERSED') {
      return `Reversed transaction of ₹${log.details?.amount || 0}`;
    }
    if (log.action === 'STUDENT_CREATED') {
      return `Registered new student: ${log.details?.name || 'Unknown'}`;
    }
    if (log.action === 'STUDENTS_PROMOTED') {
      return `Promoted ${log.details?.promotedCount || 0} students to ${log.details?.newStandard || 'next year'}`;
    }
    if (log.action === 'STAFF_CREATED') {
      return `Created staff account: ${log.details?.email || 'Unknown'}`;
    }
    
    // Fallback: render keys
    const keys = Object.keys(log.details || {});
    if (keys.length > 0) {
      return `Updated: ${keys.join(', ')}`;
    }
    return 'System action executed';
  };

  return (
    <div className="flex-1 p-6 space-y-6 max-w-7xl mx-auto">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Activity className="h-6 w-6 text-indigo-500" /> Audit Logs
          </h2>
          <p className="text-slate-500 text-sm mt-1">Track and filter all administrative and financial actions.</p>
        </div>
      </header>

      {/* Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap gap-4 items-center">
        {/* Search Box */}
        <div className="flex-1 min-w-[200px] relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search details or names..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <option value="ALL">All Actions</option>
            {uniqueActions.map(act => (
              <option key={act} value={act}>{formatActionName(act)}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <UserIcon className="h-4 w-4 text-slate-400" />
          <select
            value={selectedStaff}
            onChange={(e) => setSelectedStaff(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <option value="ALL">All Staff/Admins</option>
            <option value="SYSTEM">System Automations</option>
            {staffList.map(staff => (
              <option key={staff._id} value={staff._id}>{staff.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <option value="ALL">All Time</option>
            <option value="TODAY">Last 24 Hours</option>
            <option value="WEEK">Last 7 Days</option>
            <option value="MONTH">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-semibold animate-pulse">Loading audit trail...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center">
            <Activity className="h-10 w-10 text-slate-200 mb-3" />
            <p className="font-bold text-slate-500">No logs found matching filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Performed By</th>
                  <th className="p-4 w-full">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedLogs.map(log => {
                  const isFinancial = log.action.includes('PAYMENT') || log.action.includes('LEDGER');
                  const isDestructive = log.action.includes('REVERSED') || log.action.includes('DELETED');
                  
                  return (
                    <tr key={log._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 text-slate-500 font-medium">
                        {new Date(log.createdAt).toLocaleString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit', hour12: true
                        })}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          isDestructive ? 'bg-red-50 text-red-700 border-red-200' :
                          isFinancial ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4">
                        {log.performedBy ? (
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-[10px] font-bold">
                              {log.performedBy.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-700 leading-tight">{log.performedBy.name}</p>
                              <p className="text-[9px] text-slate-400 font-semibold">{log.performedBy.role}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs font-semibold">System</span>
                        )}
                      </td>
                      <td className="p-4">
                        <p className="text-slate-700 font-medium truncate max-w-md" title={JSON.stringify(log.details)}>
                          {getLogSummary(log)}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">
            Showing <span className="font-extrabold text-slate-800">{Math.min(filteredLogs.length, (currentPage - 1) * PAGE_SIZE + 1)}</span> to{' '}
            <span className="font-extrabold text-slate-800">{Math.min(filteredLogs.length, currentPage * PAGE_SIZE)}</span> of{' '}
            <span className="font-extrabold text-slate-850">{filteredLogs.length}</span> logs
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-650 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => {
                return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
              })
              .map((page, index, arr) => {
                const showEllipsis = index > 0 && page - arr[index - 1] > 1;
                return (
                  <React.Fragment key={page}>
                    {showEllipsis && <span className="text-slate-400 px-1 text-xs">...</span>}
                    <button
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        currentPage === page
                          ? 'bg-blue-600 border border-blue-600 text-white shadow-md shadow-blue-500/10'
                          : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                );
              })}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-650 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
