import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import type {
  Student,
  LedgerEntry,
  PaymentTransaction
} from './mockData';
import { isPeriodOverdue } from './utils';

const API_BASE = import.meta.env.VITE_API_URL || 'https://linen-weasel-242678.hostingersite.com';

export type ScreenType =
  | 'dashboard'
  | 'setup'
  | 'students'
  | 'collect-fee'
  | 'unpaid-fees'
  | 'fee-structure'
  | 'promote-students'
  | 'staff-management'
  | 'whatsapp'
  | 'login'
  | 'parent-app'
  | 'notifications'
  | 'reports'
  | 'receipts'
  | 'import-excel'
  | 'audit-log';

export interface AcademicYearData {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface FeeCategoryData {
  _id: string;
  name: string;
  type: string;
  description: string;
  isActive: boolean;
}

export interface FeeStructureData {
  _id: string;
  academicYear?: string;
  medium: string;
  standard: string;
  annualFee: number;
  educationPartCount: number;
  termPartCount: number;
  admissionFee?: number;
  bagKitFee?: number;
  termFee?: number;
  isActive: boolean;
}

export interface TransportFeeStructureData {
  _id: string;
  academicYear?: string;
  transportType: string;
  amount: number;
  frequency: string;
  isActive: boolean;
}

export interface AuditLog {
  _id: string;
  action: string;
  entityType: string;
  entityId: string;
  performedBy: string;
  details: any;
  createdAt: string;
}

interface AppContextType {
  currentScreen: ScreenType;
  setScreen: (screen: ScreenType) => void;
  students: Student[];
  ledgerEntries: LedgerEntry[];
  transactions: PaymentTransaction[];
  feeStructures: FeeStructureData[];
  transportFeeStructures: TransportFeeStructureData[];
  academicYears: AcademicYearData[];
  feeCategories: FeeCategoryData[];
  auditLogs: AuditLog[];
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
  addStudent: (student: Omit<Student, 'id' | 'status'>) => void;
  recordPayment: (
    studentId: string,
    lineItems: {
      category: string;
      period: string;
      ledgerId?: string;
      totalAmount: number;
      paymentAmount: number;
      concessionAmount: number;
      paymentMethod: string;
      remark: string;
    }[]
  ) => void;
  applyConcession: (ledgerId: string, amount: number) => void;
  reversePayment: (paymentId: string) => Promise<boolean>;
  updateFeeStructure: (id: string, data: Partial<FeeStructureData>) => Promise<boolean>;
  updateTransportFeeStructure: (id: string, data: Partial<TransportFeeStructureData>) => Promise<boolean>;
  deleteFeeStructure: (id: string) => Promise<boolean>;
  deleteTransportFeeStructure: (id: string) => Promise<boolean>;
  createFeeStructure: (data: Partial<FeeStructureData>) => Promise<boolean>;
  createTransportFeeStructure: (data: Partial<TransportFeeStructureData>) => Promise<boolean>;
  createAcademicYear: (data: Partial<AcademicYearData>) => Promise<boolean>;
  updateAcademicYear: (id: string, data: Partial<AcademicYearData>) => Promise<boolean>;
  deleteAcademicYear: (id: string) => Promise<boolean>;
  activateAcademicYear: (id: string) => Promise<boolean>;
  createFeeCategory: (data: Partial<FeeCategoryData>) => Promise<boolean>;
  updateFeeCategory: (id: string, data: Partial<FeeCategoryData>) => Promise<boolean>;
  deleteFeeCategory: (id: string) => Promise<boolean>;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  checkMobile: (primary: string, secondary: string) => Promise<any>;
  deleteStudent: (id: string) => Promise<boolean>;
  restoreStudent: (id: string) => Promise<boolean>;
  updateStudent: (id: string, updates: Partial<Student> & { transportMonths?: number }) => Promise<{ success: boolean; error?: string }>;
  regenerateLedgers: (id: string) => Promise<boolean>;
  addCustomFee: (id: string, feeName: string, amount: number) => Promise<boolean>;
  importStudents: (students: any[]) => Promise<any>;
  autoPromoteBatch: (studentIds: string[]) => Promise<any>;
  fixTransportLedgers: (studentIds: string[], transportStartMonth: string) => Promise<any>;
  copyFeeStructures: (fromYear: string, toYear: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  selectedStudentIdForFee: string | null;
  setSelectedStudentIdForFee: (id: string | null) => void;
  currentUser: { name: string; role: 'ADMIN' | 'STAFF' } | null;
  isLoadingDetails: boolean;
  isScreenLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<{ name: string; role: 'ADMIN' | 'STAFF' } | null>(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [currentScreen, setScreenState] = useState<ScreenType>(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? 'dashboard' : 'login';
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructureData[]>([]);
  const [transportFeeStructures, setTransportFeeStructures] = useState<TransportFeeStructureData[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYearData[]>([]);
  const [feeCategories, setFeeCategories] = useState<FeeCategoryData[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<number>(0);
  const [selectedStudentIdForFee, setSelectedStudentIdForFee] = useState<string | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(() => {
    return localStorage.getItem('currentUser') !== null;
  });
  const [isScreenLoading, setIsScreenLoading] = useState<boolean>(false);

  // Authenticated fetch wrapper that appends Bearer token and handles auto-refresh on 401
  const authFetch = useCallback(async (url: string, options: RequestInit = {}): Promise<Response> => {
    const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
    let token = localStorage.getItem('accessToken');
    const headers = {
      ...(options.headers || {}),
    } as Record<string, string>;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    let res = await fetch(fullUrl, { ...options, headers });
    if (res.status === 401) {
      const savedRefreshToken = localStorage.getItem('refreshToken');
      const userId = localStorage.getItem('userId');
      if (savedRefreshToken && userId) {
        try {
          const lockKey = 'auth_refresh_lock';
          const dataKey = 'auth_refresh_data';
          const now = Date.now();
          let tokens: { accessToken: string; refreshToken: string } | null = null;

          const lockVal = localStorage.getItem(lockKey);
          if (lockVal && (now - parseInt(lockVal, 10) < 10000)) {
            // Lock is active in another tab, wait for the refreshed token
            tokens = await new Promise<{ accessToken: string; refreshToken: string } | null>((resolve) => {
              let attempts = 0;
              const interval = setInterval(() => {
                attempts++;
                const savedData = localStorage.getItem(dataKey);
                if (savedData) {
                  clearInterval(interval);
                  try {
                    resolve(JSON.parse(savedData));
                  } catch {
                    resolve(null);
                  }
                  return;
                }
                const currentLock = localStorage.getItem(lockKey);
                if (!currentLock || attempts > 50) { // 5s timeout
                  clearInterval(interval);
                  resolve(null);
                }
              }, 100);
            });
          }

          if (!tokens) {
            // Acquire lock and refresh token
            localStorage.setItem(lockKey, Date.now().toString());
            localStorage.removeItem(dataKey);

            try {
              const refreshRes = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  domain: 'user',
                  userId,
                  refreshToken: savedRefreshToken
                })
              });
              if (refreshRes.ok) {
                const refreshData = await refreshRes.json();
                const newTokens = refreshData.data; // { accessToken, refreshToken }
                localStorage.setItem('accessToken', newTokens.accessToken);
                localStorage.setItem('refreshToken', newTokens.refreshToken);
                localStorage.setItem(dataKey, JSON.stringify(newTokens));
                tokens = newTokens;
              }
            } catch (refreshErr) {
              console.error('Failed to auto-refresh token inside lock:', refreshErr);
            } finally {
              localStorage.removeItem(lockKey);
            }
          }

          if (tokens) {
            headers['Authorization'] = `Bearer ${tokens.accessToken}`;
            res = await fetch(url, { ...options, headers });
            return res;
          }
        } catch (refreshErr) {
          console.error('Failed to auto-refresh token:', refreshErr);
        }
      }
      logout();
      throw new Error('Session expired. Please log in again.');
    }
    return res;
  }, []);

  const fetchTimeoutRef = useRef<number | null>(null);
  const activeFetchRef = useRef<Promise<void> | null>(null);
  const lastSyncCheckTimeRef = useRef<number>(0);

  // Fetch data from backend on mount and after mutations
  const fetchAll = useCallback(async () => {
    if (activeFetchRef.current) {
      return activeFetchRef.current;
    }

    const promise = (async () => {
      setIsLoadingDetails(true);
      try {
        const initRes = await authFetch('/api/v1/dashboard/init');
        if (!initRes.ok) {
          throw new Error(`Failed request: ${initRes.status} ${initRes.statusText}`);
        }

        const initData = await initRes.json();
        const data = initData.data || {};

        const rawStudents = data.students || [];
        const rawLedgers = data.ledgers || [];
        const rawTransactions = data.transactions || [];

        // Fee structures
        setFeeStructures(data.feeStructures || []);
        setTransportFeeStructures(data.transportStructures || []);

        // Audit logs
        const rawAuditLogs = data.auditLogs || [];
        setAuditLogs(rawAuditLogs);
        if (rawAuditLogs.length > 0) {
          const latestTime = new Date(rawAuditLogs[0].createdAt).getTime();
          setLastSyncTimestamp(latestTime);
        }

        // Academic Years and Fee Categories
        setAcademicYears(data.academicYears || []);
        setFeeCategories(data.feeCategories || []);

        // Map ledgers (inject id)
        const mappedLedgers = rawLedgers.map((l: any) => ({
          ...l,
          id: l._id
        }));

        // Map students (calculate status and populate parent info from parentId object)
        const activeAcademicYear = (data.academicYears || []).find((y: any) => y.isActive)?.name || (data.academicYears || [])[0]?.name || '';

        const mappedStudents = rawStudents.map((s: any) => {
          const overdueLedgers = mappedLedgers.filter((l: any) => {
            if (l.studentId !== s._id || l.status === 'PAID') return false;
            if (l.remainingAmount <= 0) return false;
            return isPeriodOverdue(l.feePeriod, l.academicYear, activeAcademicYear);
          });

          const uniquePeriods = new Set(
            overdueLedgers.map((l: any) => `${l.academicYear || activeAcademicYear}_${l.feePeriod}`)
          );
          const dueCount = uniquePeriods.size;

          let status = 'PAID';
          if (s.isRTE) {
            status = 'RTE';
          } else if (dueCount === 1) {
            status = '1 DUE';
          } else if (dueCount === 2) {
            status = '2 DUE';
          } else if (dueCount >= 3) {
            status = '3+ DUE';
          }

          return {
            ...s,
            id: s._id,
            parentName: s.parentId?.parentName || '',
            parentMobile: s.parentId?.primaryMobileNumber || '',
            parentSecondaryMobile: s.parentId?.secondaryMobileNumber || '',
            transportStartMonth: s.transportStartMonth || 'June',
            status
          };
        });

        // Map transactions to fit PaymentTransaction interface
        const mappedLedgersMap = new Map<string, any>(mappedLedgers.map((l: any) => [l._id || l.id, l]));
        const mappedStudentsMap = new Map<string, any>(mappedStudents.map((s: any) => [s._id || s.id, s]));

        const getFeeTypeFormatted = (ledger: any) => {
          if (!ledger) return 'General Fee';
          const type = ledger.feeType;
          let formatted = type;
          if (type === 'EDUCATION') formatted = 'Education';
          else if (type === 'TRANSPORT') formatted = 'Transport';
          else if (type === 'TERM') formatted = 'Term';
          else if (type === 'ADMISSION') formatted = 'Admission';
          else if (type === 'BAG_KIT') formatted = 'Bag & Kit';
          else formatted = type.charAt(0) + type.slice(1).toLowerCase();
          return `${formatted} Fee - ${ledger.feePeriod}`;
        };

        const groupedTxns = new Map<string, any[]>();
        rawTransactions.forEach((tx: any) => {
          const groupId = tx.details?.transactionId || tx._id;
          if (!groupedTxns.has(groupId)) {
            groupedTxns.set(groupId, []);
          }
          groupedTxns.get(groupId)!.push(tx);
        });

        const reversedIds = new Set(
          rawTransactions
            .filter((tx: any) => tx.isReversal && tx.details?.reversalOf)
            .map((tx: any) => String(tx.details.reversalOf))
        );

        const mappedTransactions: any[] = [];
        groupedTxns.forEach((txGroup, groupId) => {
          let totalAmount = 0;
          let totalConcession = 0;
          const subItems: any[] = [];
          const feeTypes: string[] = [];
          const reversalIds: string[] = [];

          let firstTx = txGroup[0];
          let student: any = null;

          txGroup.forEach((tx: any) => {
            totalAmount += tx.amount || 0;
            totalConcession += tx.concessionAmount || 0;
            reversalIds.push(tx._id);

            const ledger = mappedLedgersMap.get(tx.ledgerId);
            if (!student && ledger) {
              student = mappedStudentsMap.get(ledger.studentId);
            }
            const desc = getFeeTypeFormatted(ledger);
            feeTypes.push(desc);

            const isReversed = tx.isReversal || reversedIds.has(tx._id?.toString()) || reversedIds.has(tx.id?.toString());
            const status = isReversed ? 'REVERSED' : (ledger?.status || 'PAID');

            subItems.push({
              id: tx._id,
              description: desc,
              amount: tx.amount || 0,
              concessionAmount: tx.concessionAmount || 0,
              method: tx.method,
              status: status,
              academicYear: ledger ? ledger.academicYear : undefined
            });
          });

          // Build payment breakdown: one entry per unique method with summed amounts
          const breakdownMap = new Map<string, number>();
          txGroup.forEach((tx: any) => {
            if (tx.method) {
              breakdownMap.set(tx.method, (breakdownMap.get(tx.method) || 0) + (tx.amount || 0));
            }
          });
          const paymentBreakdown = Array.from(breakdownMap.entries()).map(([method, amount]) => ({ method, amount }));
          const uniqueMethods = Array.from(breakdownMap.keys());
          const joinedMethod = uniqueMethods.join(' + ');

          const groupIsReversal = firstTx.isReversal || txGroup.every(tx => reversedIds.has(tx._id?.toString()) || reversedIds.has(tx.id?.toString()));
          const groupIsPartiallyReversed = !groupIsReversal && txGroup.some(tx => reversedIds.has(tx._id?.toString()) || reversedIds.has(tx.id?.toString()));
          const status = groupIsReversal ? 'REVERSED' : groupIsPartiallyReversed ? 'PARTIALLY_REVERSED' : (mappedLedgersMap.get(firstTx.ledgerId)?.status || 'PAID');

          // Extract primary academic year from the first subItem
          const primaryAcademicYear = subItems.length > 0 ? subItems[0].academicYear : undefined;

          // We want to get the student's name, standard, and medium from the ledger's snapshot!
          const primaryLedger = mappedLedgersMap.get(firstTx.ledgerId);
          let studentName = 'Unknown';
          let studentCode = 'N/A';
          let classInfo = 'N/A';
          let isDeleted = false;

          if (student) {
            studentName = student.studentName;
            studentCode = student.studentCode || 'N/A';
            isDeleted = student.isActive === false;
            // Get standard from snapshot if available, otherwise fallback to current student
            const std = primaryLedger?.snapshot?.standard || student.standard;
            const div = primaryLedger?.snapshot?.division || student.division;
            const med = primaryLedger?.snapshot?.medium || student.medium;
            classInfo = `${std} - ${div} ${med}`;
          } else if (primaryLedger && primaryLedger.snapshot) {
            // Student might have been hard-deleted, but we have the snapshot!
            studentName = primaryLedger.snapshot.studentName || 'Unknown';
            studentCode = 'N/A'; 
            const std = primaryLedger.snapshot.standard || 'N/A';
            const div = primaryLedger.snapshot.division || 'N/A';
            const med = primaryLedger.snapshot.medium || 'N/A';
            classInfo = `${std} - ${div} ${med}`;
            isDeleted = true;
          }

          mappedTransactions.push({
            id: groupId,
            studentId: student ? student.id : (primaryLedger?.studentId || ''),
            studentName: studentName,
            studentCode: studentCode,
            classInfo: classInfo,
            feeType: feeTypes.join('\n'),
            amount: totalAmount,
            concessionAmount: totalConcession,
            method: joinedMethod || firstTx.method || 'N/A',
            time: firstTx.createdAt ? new Date(firstTx.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '',
            status: status,
            date: firstTx.createdAt ? firstTx.createdAt.split('T')[0] : '',
            remark: firstTx.details?.remark || firstTx.details?.reason || '',
            subItems: subItems,
            reversalIds: reversalIds.join(','),
            paymentBreakdown: paymentBreakdown,
            academicYear: primaryAcademicYear,
            isDeleted: isDeleted
          });
        });

        setStudents(mappedStudents);
        setLedgerEntries(mappedLedgers);
        setTransactions(mappedTransactions);
      } catch (err) {
        console.error('Failed to fetch data from backend', err);
      } finally {
        setIsLoadingDetails(false);
        activeFetchRef.current = null;
      }
    })();

    activeFetchRef.current = promise;
    return promise;
  }, [authFetch]);

  const debouncedFetchAll = useCallback(() => {
    if (fetchTimeoutRef.current) {
      window.clearTimeout(fetchTimeoutRef.current);
    }
    fetchTimeoutRef.current = window.setTimeout(() => {
      fetchAll();
    }, 400); // 400ms debounce to prevent WAF hits on back-to-back mutations
  }, [fetchAll]);

  const setScreen = useCallback(async (screen: ScreenType) => {
    setScreenState(screen);
    if (!currentUser || screen === 'login') return;

    const now = Date.now();
    if (now - lastSyncCheckTimeRef.current < 15000) {
      // Throttle sync state checks to at most once per 15 seconds
      return;
    }
    lastSyncCheckTimeRef.current = now;

    try {
      const res = await authFetch('/api/v1/dashboard/sync-state');
      if (!res.ok) return;
      const data = await res.json();
      if (data.data?.timestamp && data.data.timestamp > lastSyncTimestamp) {
        console.log(`[Sync] Screen navigation detected newer data. Showing skeleton...`);
        setIsScreenLoading(true);
        await fetchAll();
        setIsScreenLoading(false);
      }
    } catch (err) {
      console.error('[Sync] Screen check failed:', err);
    }
  }, [currentUser, lastSyncTimestamp, authFetch, fetchAll]);

  useEffect(() => {
    if (currentUser) {
      fetchAll();
    }
  }, [currentUser, fetchAll]);

  useEffect(() => {
    if (!currentUser) return;

    let isSubscribed = true;

    const checkSync = async () => {
      const now = Date.now();
      if (now - lastSyncCheckTimeRef.current < 15000) {
        return;
      }
      lastSyncCheckTimeRef.current = now;

      try {
        const res = await authFetch('/api/v1/dashboard/sync-state');
        if (!res.ok) return;
        const data = await res.json();
        if (!isSubscribed) return;

        if (data.data?.timestamp && data.data.timestamp > lastSyncTimestamp) {
          console.log(`[Sync] Local state out of sync (local: ${lastSyncTimestamp}, server: ${data.data.timestamp}). Fetching latest data...`);
          await fetchAll();
        }
      } catch (err) {
        console.error('[Sync] Failed to verify sync state:', err);
      }
    };

    // Stagger background polling with jitter (80s to 100s) so multi-tabs don't poll at once
    const jitter = Math.random() * 20000 - 10000;
    const interval = setInterval(checkSync, 90000 + jitter);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [currentUser, lastSyncTimestamp, authFetch, fetchAll]);

  // Sync logouts across multiple browser tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'currentUser' && !e.newValue) {
        setCurrentUser(null);
        setScreenState('login');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/portal/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });

      // Handle rate-limit (429) before trying to parse JSON
      if (res.status === 429) {
        return { success: false, error: 'Too many login attempts. Please wait a moment and try again.' };
      }

      // Safely parse JSON — Hostinger WAF may return HTML on errors
      let data: any = {};
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json().catch(() => ({}));
      }

      if (!res.ok) {
        return { success: false, error: data?.message || 'Invalid email or password.' };
      }
      if (!data || !data.data || !data.data.accessToken) {
        return { success: false, error: 'Invalid response from server' };
      }
      const { accessToken, refreshToken, user: userInfo } = data.data;

      // Decode JWT to get user ID
      let userId = '';
      let role = '';
      try {
        const payloadBase64 = accessToken.split('.')[1];
        let base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
          base64 += '=';
        }
        const payload = JSON.parse(atob(base64));
        userId = payload.id;
        role = payload.role;
      } catch (decodeErr) {
        console.error('Failed to decode token:', decodeErr);
        return { success: false, error: 'Invalid token format returned by server' };
      }

      // Use the real name and role from the server response
      const name = userInfo?.name || email.split('@')[0];
      const actualRole = userInfo?.role || role;

      const userObj = { name, role: actualRole };
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('userId', userId);
      localStorage.setItem('currentUser', JSON.stringify(userObj));

      setCurrentUser(userObj);
      setScreen('dashboard');
      return { success: true };
    } catch (err: any) {
      console.error('Login error:', err);
      return { success: false, error: err.message || 'Failed to connect to server. Please check your network connection.' };
    }
  };

  const logout = () => {
    const token = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    // Clear local state instantly for snappy UX
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    setScreen('login');

    // Fire backend logout in the background
    if (token && refreshToken) {
      fetch(`${API_BASE}/api/v1/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ refreshToken })
      }).catch(err => {
        console.error('Logout request failed:', err);
      });
    }
  };

  const addStudent = async (newS: Omit<Student, 'id' | 'status'>) => {
    try {
      const payload = newS;
      const res = await authFetch('/api/v1/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        console.error('Failed to add student:', errBody);
        return;
      }
      // Refresh data
      debouncedFetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  const recordPayment = async (
    _studentId: string,
    lineItems: {
      category: string;
      period: string;
      ledgerId?: string;
      totalAmount: number;
      paymentAmount: number;
      concessionAmount: number;
      paymentMethod: string;
      remark: string;
    }[]
  ) => {
    try {
      // Filter out fees without a valid ledgerId
      const validFees = lineItems.filter(f => f.ledgerId);

      const paymentsPayload = validFees.map(fee => {
        let methodMapped = fee.paymentMethod;
        if (methodMapped === 'CARD' || methodMapped === 'NET BANKING') {
          methodMapped = 'ONLINE';
        } else if (methodMapped === 'GOVT') {
          methodMapped = 'CASH';
        }

        return {
          ledgerId: fee.ledgerId!,
          amount: fee.paymentAmount,
          concessionAmount: fee.concessionAmount,
          method: methodMapped as 'CASH' | 'CHEQUE' | 'ONLINE' | 'UPI' | 'REVERSAL',
          remark: fee.remark
        };
      }).filter(p => p.amount > 0 || p.concessionAmount > 0);

      if (paymentsPayload.length === 0) return;

      const idempotencyKey = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `batch-pay-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      const res = await authFetch('/api/v1/payments/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify({ payments: paymentsPayload })
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        console.error('Failed to record batch payment:', errBody);
        alert(errBody.message || 'Failed to record payments. Please try again.');
      } else {
        debouncedFetchAll();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const applyConcession = async (ledgerId: string, amount: number) => {
    try {
      const res = await authFetch(`/api/v1/ledgers/${ledgerId}/concession`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, reason: 'Applied concession manually' })
      });
      if (!res.ok) throw new Error('Failed to apply concession');
      debouncedFetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  // Reverse a payment by calling the backend API
  const reversePayment = async (paymentId: string): Promise<boolean> => {
    try {
      const res = await authFetch(`/api/v1/payments/${paymentId}/reverse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Manual reversal by admin' })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.message || `Failed to reverse payment ${paymentId}`);
        return false;
      }
      await fetchAll();
      return true;
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Network error occurred during reversal');
      return false;
    }
  };

  // Update a standard fee structure
  const updateFeeStructure = async (id: string, data: Partial<FeeStructureData>): Promise<boolean> => {
    try {
      const res = await authFetch(`/api/v1/fee-structures/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to update fee structure');
      debouncedFetchAll();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const deleteFeeStructure = async (id: string): Promise<boolean> => {
    try {
      const res = await authFetch(`/api/v1/fee-structures/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete fee structure');
      debouncedFetchAll();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // Update a transport fee structure
  const updateTransportFeeStructure = async (id: string, data: Partial<TransportFeeStructureData>): Promise<boolean> => {
    try {
      const res = await authFetch(`/api/v1/fee-structures/transport/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to update transport fee structure');
      debouncedFetchAll();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const deleteTransportFeeStructure = async (id: string): Promise<boolean> => {
    try {
      const res = await authFetch(`/api/v1/fee-structures/transport/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete transport fee structure');
      debouncedFetchAll();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const createFeeStructure = async (data: Partial<FeeStructureData>): Promise<boolean> => {
    try {
      const res = await authFetch('/api/v1/fee-structures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to create fee structure');
      debouncedFetchAll();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const createTransportFeeStructure = async (data: Partial<TransportFeeStructureData>): Promise<boolean> => {
    try {
      const res = await authFetch('/api/v1/fee-structures/transport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to create transport fee structure');
      debouncedFetchAll();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const copyFeeStructures = async (fromYear: string, toYear: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const res = await authFetch('/api/v1/fee-structures/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromYear, toYear })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Copy failed');
      debouncedFetchAll();
      return { success: true, message: data.message };
    } catch (err: any) {
      console.error(err);
      return { success: false, error: err.message };
    }
  };

  const createAcademicYear = async (data: Partial<AcademicYearData>): Promise<boolean> => {
    try {
      const res = await authFetch('/api/v1/academic-years', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to create academic year');
      debouncedFetchAll();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const activateAcademicYear = async (id: string): Promise<boolean> => {
    try {
      const res = await authFetch(`/api/v1/academic-years/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true })
      });
      if (!res.ok) throw new Error('Failed to activate academic year');
      debouncedFetchAll();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const createFeeCategory = async (data: Partial<FeeCategoryData>): Promise<boolean> => {
    try {
      const res = await authFetch('/api/v1/fee-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        console.error('[createFeeCategory] error:', errBody?.message || res.status);
        return false;
      }
      debouncedFetchAll();
      return true;
    } catch (err) {
      console.error('[createFeeCategory] network error:', err);
      return false;
    }
  };

  const updateAcademicYear = async (id: string, data: Partial<AcademicYearData>): Promise<boolean> => {
    try {
      const res = await authFetch(`/api/v1/academic-years/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to update academic year');
      debouncedFetchAll();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const deleteAcademicYear = async (id: string): Promise<boolean> => {
    try {
      const res = await authFetch(`/api/v1/academic-years/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete academic year');
      debouncedFetchAll();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const updateFeeCategory = async (id: string, data: Partial<FeeCategoryData>): Promise<boolean> => {
    try {
      const res = await authFetch(`/api/v1/fee-categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to update fee category');
      debouncedFetchAll();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const deleteFeeCategory = async (id: string): Promise<boolean> => {
    try {
      const res = await authFetch(`/api/v1/fee-categories/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete fee category');
      debouncedFetchAll();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const checkMobile = async (primary: string, secondary: string) => {
    try {
      const params = new URLSearchParams();
      if (primary) params.append('primaryMobile', primary);
      if (secondary) params.append('secondaryMobile', secondary);

      const res = await authFetch(`/api/v1/parents/check-mobile?${params.toString()}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.data; // { exists: boolean, parent: object | null }
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      const res = await authFetch(`/api/v1/students/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        console.error('Failed to delete student');
        return false;
      }
      debouncedFetchAll();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const restoreStudent = async (id: string) => {
    try {
      const res = await authFetch(`/api/v1/students/${id}/restore`, {
        method: 'POST'
      });
      if (!res.ok) {
        console.error('Failed to restore student');
        return false;
      }
      debouncedFetchAll();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const updateStudent = async (id: string, updates: Partial<Student> & { transportMonths?: number }): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await authFetch(`/api/v1/students/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error('Failed to update student:', data);
        return { success: false, error: data.message || 'Failed to update student' };
      }
      debouncedFetchAll();
      return { success: true };
    } catch (err: any) {
      console.error(err);
      return { success: false, error: err.message || 'Network error occurred' };
    }
  };

  const regenerateLedgers = async (id: string): Promise<boolean> => {
    try {
      const res = await authFetch(`/api/v1/students/${id}/regenerate-ledgers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error('Failed to regenerate ledgers');
      debouncedFetchAll();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const addCustomFee = async (id: string, feeName: string, amount: number): Promise<boolean> => {
    try {
      const res = await authFetch(`/api/v1/students/${id}/custom-fee`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feeName, amount })
      });
      if (!res.ok) throw new Error('Failed to add custom fee');
      debouncedFetchAll();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const importStudents = async (studentsList: any[]) => {
    try {
      const res = await authFetch('/api/v1/students/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: studentsList })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Import failed');
      }
      debouncedFetchAll();
      return data.data;
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  const autoPromoteBatch = async (studentIds: string[]) => {
    try {
      const res = await authFetch(`${API_BASE}/api/v1/students/auto-promote-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds })
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Auto-promotion failed');
      }
      const data = await res.json();
      debouncedFetchAll();
      return data.data;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const fixTransportLedgers = async (studentIds: string[], transportStartMonth: string) => {
    try {
      const res = await authFetch('/api/v1/students/fix-transport', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds, transportStartMonth })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Fix failed');
      debouncedFetchAll();
      return data.data;
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentScreen,
        setScreen,
        students,
        ledgerEntries,
        transactions,
        feeStructures,
        transportFeeStructures,
        academicYears,
        feeCategories,
        auditLogs,
        authFetch,
        addStudent,
        recordPayment,
        applyConcession,
        reversePayment,
        updateFeeStructure,
        updateTransportFeeStructure,
        deleteFeeStructure,
        deleteTransportFeeStructure,
        createFeeStructure,
        createTransportFeeStructure,
        createAcademicYear,
        updateAcademicYear,
        deleteAcademicYear,
        activateAcademicYear,
        createFeeCategory,
        updateFeeCategory,
        deleteFeeCategory,
        currentUser,
        login,
        logout,
        checkMobile,
        deleteStudent,
        restoreStudent,
        updateStudent,
        regenerateLedgers,
        addCustomFee,
        importStudents,
        autoPromoteBatch,
        fixTransportLedgers,
        copyFeeStructures,
        selectedStudentIdForFee,
        setSelectedStudentIdForFee,
        isLoadingDetails,
        isScreenLoading
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default useApp;
