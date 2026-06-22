import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type {
  Student,
  LedgerEntry,
  PaymentTransaction
} from './mockData';
// Removed static mock data imports – data now loaded from backend

export type ScreenType =
  | 'dashboard'
  | 'collect-fee'
  | 'unpaid-fees'
  | 'fee-structure'
  | 'students'
  | 'promote-students'
  | 'staff-management'
  | 'whatsapp'
  | 'notifications'
  | 'parent-app'
  | 'receipts'
  | 'audit'
  | 'reports'
  | 'setup'
  | 'login';

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
    feesToPay: { category: string; period: string; ledgerId?: string; totalAmount: number }[],
    amountPaid: number,
    paymentMethod: PaymentTransaction['method'],
    concessionAmount: number,
    remark: string
  ) => void;
  applyConcession: (ledgerId: string, amount: number) => void;
  reversePayment: (transactionId: string) => void;
  updateFeeStructure: (id: string, data: Partial<FeeStructureData>) => Promise<boolean>;
  updateTransportFeeStructure: (id: string, data: Partial<TransportFeeStructureData>) => Promise<boolean>;
  createFeeStructure: (data: Partial<FeeStructureData>) => Promise<boolean>;
  createTransportFeeStructure: (data: Partial<TransportFeeStructureData>) => Promise<boolean>;
  createAcademicYear: (data: Partial<AcademicYearData>) => Promise<boolean>;
  updateAcademicYear: (id: string, data: Partial<AcademicYearData>) => Promise<boolean>;
  deleteAcademicYear: (id: string) => Promise<boolean>;
  activateAcademicYear: (id: string) => Promise<boolean>;
  createFeeCategory: (data: Partial<FeeCategoryData>) => Promise<boolean>;
  updateFeeCategory: (id: string, data: Partial<FeeCategoryData>) => Promise<boolean>;
  deleteFeeCategory: (id: string) => Promise<boolean>;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  checkMobile: (primary: string, secondary: string) => Promise<any>;
  deleteStudent: (id: string) => Promise<boolean>;
  updateStudent: (id: string, updates: Partial<Student> & { transportMonths?: number }) => Promise<boolean>;
  regenerateLedgers: (id: string) => Promise<boolean>;
  addCustomFee: (id: string, feeName: string, amount: number) => Promise<boolean>;
  selectedStudentIdForFee: string | null;
  setSelectedStudentIdForFee: (id: string | null) => void;
  currentUser: { name: string; role: 'ADMIN' | 'STAFF' } | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<{ name: string; role: 'ADMIN' | 'STAFF' } | null>(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [currentScreen, setScreen] = useState<ScreenType>(() => {
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
  const [selectedStudentIdForFee, setSelectedStudentIdForFee] = useState<string | null>(null);

  // Authenticated fetch wrapper that appends Bearer token and handles auto-refresh on 401
  const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    let token = localStorage.getItem('accessToken');
    const headers = {
      ...(options.headers || {}),
    } as Record<string, string>;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    let res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      const savedRefreshToken = localStorage.getItem('refreshToken');
      const userId = localStorage.getItem('userId');
      if (savedRefreshToken && userId) {
        try {
          const refreshRes = await fetch('/api/v1/auth/refresh', {
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
            const { accessToken: newAccessToken, refreshToken: newRefreshToken } = refreshData.data;
            localStorage.setItem('accessToken', newAccessToken);
            localStorage.setItem('refreshToken', newRefreshToken);
            headers['Authorization'] = `Bearer ${newAccessToken}`;
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
  };

  // Fetch data from backend on mount and after mutations
  const fetchAll = async () => {
    try {
      const [studRes, ledRes, txRes, feeRes, auditRes, ayRes, fcRes] = await Promise.all([
        authFetch('/api/v1/students?limit=1000'),
        authFetch('/api/v1/ledgers?limit=1000'),
        authFetch('/api/v1/payments?limit=1000'),
        authFetch('/api/v1/fee-structures'),
        authFetch('/api/v1/audit?limit=100'),
        authFetch('/api/v1/academic-years'),
        authFetch('/api/v1/fee-categories')
      ]);
      const [studResp, ledResp, txResp, feeResp, auditResp, ayResp, fcResp] = await Promise.all([
        studRes.json(),
        ledRes.json(),
        txRes.json(),
        feeRes.json(),
        auditRes.json(),
        ayRes.json(),
        fcRes.json()
      ]);
      
      const rawStudents = studResp.data || [];
      const rawLedgers = ledResp.data || [];
      const rawTransactions = txResp.data || [];

      // Fee structures
      const feeData = feeResp.data || {};
      setFeeStructures(feeData.feeStructures || []);
      setTransportFeeStructures(feeData.transportStructures || []);

      // Audit logs
      setAuditLogs(auditResp.data?.logs || []);

      // Academic Years and Fee Categories
      setAcademicYears(ayResp.data || []);
      setFeeCategories(fcResp.data || []);


      // Map ledgers (inject id)
      const mappedLedgers = rawLedgers.map((l: any) => ({
        ...l,
        id: l._id
      }));

      // Map students (calculate status and populate parent info from parentId object)
      const mappedStudents = rawStudents.map((s: any) => {
        const studentLedgers = mappedLedgers.filter((l: any) => l.studentId === s._id && l.status !== 'PAID');
        const dueCount = studentLedgers.length;
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
          status
        };
      });

      // Map transactions to fit PaymentTransaction interface
      const mappedTransactions = rawTransactions.map((tx: any) => {
        const ledger = mappedLedgers.find((l: any) => l._id === tx.ledgerId);
        const student = ledger ? mappedStudents.find((s: any) => s._id === ledger.studentId) : null;
        
        return {
          id: tx._id,
          studentId: student ? student.id : '',
          studentName: student ? student.studentName : 'Unknown',
          studentCode: student ? student.studentCode : 'N/A',
          classInfo: student ? `${student.standard} - ${student.division} ${student.medium}` : 'N/A',
          feeType: ledger
            ? (() => {
                const type = ledger.feeType;
                let formatted = type;
                if (type === 'EDUCATION') formatted = 'Education';
                else if (type === 'TRANSPORT') formatted = 'Transport';
                else if (type === 'TERM') formatted = 'Term';
                else if (type === 'ADMISSION') formatted = 'Admission';
                else if (type === 'BAG_KIT') formatted = 'Bag & Kit';
                else formatted = type.charAt(0) + type.slice(1).toLowerCase();
                return `${formatted} Fee - ${ledger.feePeriod}`;
              })()
            : 'General Fee',
          amount: tx.amount,
          concessionAmount: tx.concessionAmount || 0,
          method: tx.method,
          time: tx.createdAt ? new Date(tx.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '',
          status: tx.isReversal ? 'REVERSED' : (ledger?.status || 'PAID'),
          date: tx.createdAt ? tx.createdAt.split('T')[0] : '',
          remark: tx.details?.remark || tx.details?.reason || ''
        };
      });

      setStudents(mappedStudents);
      setLedgerEntries(mappedLedgers);
      setTransactions(mappedTransactions);
    } catch (err) {
      console.error('Failed to fetch data from backend', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchAll();
    }
  }, [currentUser]);

  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/v1/auth/portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });
      if (!res.ok) {
        return false;
      }
      const data = await res.json();
      const { accessToken, refreshToken, user: userInfo } = data.data;

      // Decode JWT to get user ID
      const payloadBase64 = accessToken.split('.')[1];
      const payload = JSON.parse(atob(payloadBase64));
      const userId = payload.id;

      // Use the real name and role from the server response
      const name = userInfo?.name || email.split('@')[0];
      const role = userInfo?.role || payload.role;

      const userObj = { name, role };
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('userId', userId);
      localStorage.setItem('currentUser', JSON.stringify(userObj));

      setCurrentUser(userObj);
      setScreen('dashboard');
      return true;
    } catch (err) {
      console.error('Login error:', err);
      return false;
    }
  };

  const logout = async () => {
    const token = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    if (token && refreshToken) {
      try {
        await fetch('/api/v1/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ refreshToken })
        });
      } catch (err) {
        console.error('Logout request failed:', err);
      }
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    setScreen('login');
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
      await fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  const recordPayment = async (
    _studentId: string,
    feesToPay: { category: string; period: string; ledgerId?: string; totalAmount: number }[],
    amountPaid: number,
    paymentMethod: PaymentTransaction['method'],
    concessionAmount: number,
    remark: string
  ) => {
    try {
      let concessionRemaining = concessionAmount;
      let paymentRemaining = amountPaid;

      // Map paymentMethod to allowed backend values
      let methodMapped = paymentMethod;
      if ((methodMapped as string) === 'CARD' || (methodMapped as string) === 'NET BANKING') {
        methodMapped = 'ONLINE';
      } else if ((methodMapped as string) === 'GOVT') {
        methodMapped = 'CASH';
      }

      // Filter out fees without a valid ledgerId
      const validFees = feesToPay.filter(f => f.ledgerId);

      for (const fee of validFees) {
        const ledgerId = fee.ledgerId!;
        const ledger = ledgerEntries.find(l => l.id === ledgerId || l._id === ledgerId);
        if (!ledger) continue;

        const currentRemaining = ledger.remainingAmount;

        // Calculate concession for this ledger slot
        let concessionApplied = 0;
        if (concessionRemaining > 0) {
          concessionApplied = Math.min(currentRemaining, concessionRemaining);
          concessionRemaining -= concessionApplied;
        }

        // Calculate payment after concession
        const remainingAfterConcession = currentRemaining - concessionApplied;
        let paymentApplied = 0;
        if (paymentRemaining > 0 && remainingAfterConcession > 0) {
          paymentApplied = Math.min(remainingAfterConcession, paymentRemaining);
          paymentRemaining -= paymentApplied;
        }

        if (paymentApplied > 0) {
          // Case A: Payment (with optional embedded concession) - single Payment record that stores concessionAmount
          const idempotencyKey = crypto.randomUUID ? crypto.randomUUID() : `pay-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
          const payRes = await authFetch('/api/v1/payments', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Idempotency-Key': idempotencyKey
            },
            body: JSON.stringify({
              ledgerId,
              amount: paymentApplied,
              concessionAmount: concessionApplied,
              method: methodMapped,
              details: { remark }
            })
          });
          if (!payRes.ok) {
            console.error(`Failed to record payment for ledger ${ledgerId}`);
          }
        } else if (concessionApplied > 0) {
          // Case B: Concession only (no payment portion) - use standalone concession endpoint
          const concRes = await authFetch(`/api/v1/ledgers/${ledgerId}/concession`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: concessionApplied, reason: remark || 'Concession applied' })
          });
          if (!concRes.ok) {
            console.error(`Failed to apply concession for ledger ${ledgerId}`);
          }
        }
      }

      await fetchAll();
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
      await fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  // Reverse a payment by calling the backend API
  const reversePayment = async (transactionId: string) => {
    try {
      const res = await authFetch(`/api/v1/payments/${transactionId}/reverse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Manual reversal by admin' })
      });
      if (!res.ok) throw new Error('Failed to reverse payment');
      // Refresh all data after reversal
      await fetchAll();
    } catch (err) {
      console.error(err);
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
      await fetchAll();
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
      await fetchAll();
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
      await fetchAll();
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
      await fetchAll();
      return true;
    } catch (err) {
      console.error(err);
      return false;
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
      await fetchAll();
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
      await fetchAll();
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
      if (!res.ok) return false;
      await fetchAll();
      return true;
    } catch (err) {
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
      await fetchAll();
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
      await fetchAll();
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
      await fetchAll();
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
      await fetchAll();
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
      await fetchAll();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const updateStudent = async (id: string, updates: Partial<Student> & { transportMonths?: number }) => {
    try {
      const res = await authFetch(`/api/v1/students/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!res.ok) {
        console.error('Failed to update student');
        return false;
      }
      await fetchAll();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const regenerateLedgers = async (id: string): Promise<boolean> => {
    try {
      const res = await authFetch(`/api/v1/students/${id}/regenerate-ledgers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error('Failed to regenerate ledgers');
      await fetchAll();
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
      await fetchAll();
      return true;
    } catch (err) {
      console.error(err);
      return false;
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
        updateStudent,
        regenerateLedgers,
        addCustomFee,
        selectedStudentIdForFee,
        setSelectedStudentIdForFee
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
