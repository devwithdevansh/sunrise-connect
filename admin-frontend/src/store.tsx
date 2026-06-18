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
  | 'whatsapp'
  | 'notifications'
  | 'parent-app'
  | 'receipts'
  | 'audit'
  | 'reports'
  | 'login';

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

interface AppContextType {
  currentScreen: ScreenType;
  setScreen: (screen: ScreenType) => void;
  students: Student[];
  ledgerEntries: LedgerEntry[];
  transactions: PaymentTransaction[];
  feeStructures: FeeStructureData[];
  transportFeeStructures: TransportFeeStructureData[];
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
  currentUser: { name: string; role: 'ADMIN' | 'STAFF' } | null;
  login: (email: string, pass: string) => boolean;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentScreen, setScreen] = useState<ScreenType>('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructureData[]>([]);
  const [transportFeeStructures, setTransportFeeStructures] = useState<TransportFeeStructureData[]>([]);

  // Fetch data from backend on mount and after mutations
  const fetchAll = async () => {
    try {
      const [studRes, ledRes, txRes, feeRes] = await Promise.all([
        fetch('/api/v1/students?limit=1000'),
        fetch('/api/v1/ledgers?limit=1000'),
        fetch('/api/v1/payments?limit=1000'),
        fetch('/api/v1/fee-structures')
      ]);
      const [studResp, ledResp, txResp, feeResp] = await Promise.all([
        studRes.json(),
        ledRes.json(),
        txRes.json(),
        feeRes.json()
      ]);
      
      const rawStudents = studResp.data || [];
      const rawLedgers = ledResp.data || [];
      const rawTransactions = txResp.data || [];

      // Fee structures
      const feeData = feeResp.data || {};
      setFeeStructures(feeData.feeStructures || []);
      setTransportFeeStructures(feeData.transportStructures || []);


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
    fetchAll();
  }, []);

  const [currentUser, setCurrentUser] = useState<{ name: string; role: 'ADMIN' | 'STAFF' } | null>({
    name: 'Admin User',
    role: 'ADMIN'
  });

  const login = (email: string, pass: string): boolean => {
    if (email === 'admin@school.com' && pass === 'secret123') {
      setCurrentUser({ name: 'Admin User', role: 'ADMIN' });
      setScreen('dashboard');
      return true;
    } else if (email === 'staff@school.com' && pass === 'secret123') {
      setCurrentUser({ name: 'Staff User', role: 'STAFF' });
      setScreen('dashboard');
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    setScreen('login');
  };

  const addStudent = async (newS: Omit<Student, 'id' | 'status'>) => {
    try {
      const payload = newS;
      const res = await fetch('/api/v1/students', {
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
    studentId: string,
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

        // 1. Concession
        let concessionApplied = 0;
        if (concessionRemaining > 0) {
          concessionApplied = Math.min(currentRemaining, concessionRemaining);
          concessionRemaining -= concessionApplied;

          if (concessionApplied > 0) {
            const concRes = await fetch(`/api/v1/ledgers/${ledgerId}/concession`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ amount: concessionApplied, reason: remark || 'Concession applied' })
            });
            if (!concRes.ok) {
              console.error(`Failed to apply concession for ledger ${ledgerId}`);
            }
          }
        }

        // 2. Payment
        const remainingAfterConcession = currentRemaining - concessionApplied;
        let paymentApplied = 0;
        if (paymentRemaining > 0 && remainingAfterConcession > 0) {
          paymentApplied = Math.min(remainingAfterConcession, paymentRemaining);
          paymentRemaining -= paymentApplied;

          if (paymentApplied > 0) {
            const idempotencyKey = crypto.randomUUID ? crypto.randomUUID() : `pay-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
            const payRes = await fetch('/api/v1/payments', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Idempotency-Key': idempotencyKey
              },
              body: JSON.stringify({
                ledgerId,
                amount: paymentApplied,
                method: methodMapped,
                details: { remark }
              })
            });
            if (!payRes.ok) {
              console.error(`Failed to record payment for ledger ${ledgerId}`);
            }
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
      const res = await fetch(`/api/v1/ledgers/${ledgerId}/concession`, {
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
      const res = await fetch(`/api/v1/payments/${transactionId}/reverse`, {
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
      const res = await fetch(`/api/v1/fee-structures/${id}`, {
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
      const res = await fetch(`/api/v1/fee-structures/transport/${id}`, {
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
        addStudent,
        recordPayment,
        applyConcession,
        reversePayment,
        updateFeeStructure,
        updateTransportFeeStructure,
        currentUser,
        login,
        logout
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
