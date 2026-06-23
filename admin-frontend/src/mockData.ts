export interface Student {
  _id?: string;
  id: string;
  studentCode: string;
  studentName: string;
  medium: 'English' | 'Gujarati';
  standard: string;
  division: string;
  transportType: 'Railnagar' | 'Outside Railnagar' | 'None';
  isRTE: boolean;
  isNewAdmission?: boolean;
  admissionMonth?: string;
  isActive: boolean;
  parentId?: string;
  parentName: string;
  parentMobile: string;
  parentSecondaryMobile?: string;
  status: 'PAID' | 'PARTIAL' | '2 DUE' | '1 DUE' | '3+ DUE' | 'RTE';
}

export interface LedgerEntry {
  _id?: string;
  id: string;
  studentId: string;
  feePeriod: string; // e.g. "June", "Term 1", "Term 2", "Transport - June"
  feeType: 'EDUCATION' | 'TERM' | 'TRANSPORT' | 'ADMISSION' | 'OTHER';
  totalAmount: number;
  paidAmount: number;
  concessionAmount: number;
  remainingAmount: number;
  dueDate: string;
  status: 'PENDING' | 'PARTIAL' | 'PAID';
}

export interface PaymentTransaction {
  id: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  classInfo: string; // e.g. "7 - A Gujarati"
  feeType: string; // e.g. "Education Fee - June"
  amount: number;
  concessionAmount?: number; // concession applied in this payment record
  method: 'CASH' | 'CHEQUE' | 'ONLINE' | 'UPI' | 'CARD' | 'NET BANKING' | 'GOVT';
  time: string; // e.g. "9:42 AM"
  status: 'PAID' | 'PARTIAL' | 'RTE' | 'REVERSED';
  date: string; // e.g. "2026-06-11"
  remark?: string;
}

export const initialStudents: Student[] = [
  {
    id: 's1',
    studentCode: 'SCR/2025-26/00342',
    studentName: 'Rahul Mehta',
    medium: 'Gujarati',
    standard: '7',
    division: 'A',
    transportType: 'Railnagar',
    isRTE: false,
    isActive: true,
    parentName: 'Rajesh Mehta',
    parentMobile: '+91 98765 43210',
    status: 'PAID',
  },
  {
    id: 's2',
    studentCode: 'SCR/2025-26/00341',
    studentName: 'Priya Shah',
    medium: 'English',
    standard: '5',
    division: 'B',
    transportType: 'Railnagar',
    isRTE: false,
    isActive: true,
    parentName: 'Sunil Shah',
    parentMobile: '+91 98765 12345',
    status: '2 DUE',
  },
  {
    id: 's3',
    studentCode: 'SCR/2025-26/00340',
    studentName: 'Arjun Patel',
    medium: 'English',
    standard: '9',
    division: 'A',
    transportType: 'Outside Railnagar',
    isRTE: false,
    isActive: true,
    parentName: 'Amit Patel',
    parentMobile: '+91 93456 78901',
    status: 'PARTIAL',
  },
  {
    id: 's4',
    studentCode: 'SCR/2025-26/00339',
    studentName: 'Kavya Desai',
    medium: 'Gujarati',
    standard: '3',
    division: 'C',
    transportType: 'None',
    isRTE: true,
    isActive: true,
    parentName: 'Hitesh Desai',
    parentMobile: '+91 94561 78902',
    status: 'RTE',
  },
  {
    id: 's5',
    studentCode: 'SCR/2025-26/00338',
    studentName: 'Rohan Joshi',
    medium: 'English',
    standard: '6',
    division: 'A',
    transportType: 'Railnagar',
    isRTE: false,
    isActive: true,
    parentName: 'Vikram Joshi',
    parentMobile: '+91 90123 45678',
    status: 'PAID',
  },
  {
    id: 's6',
    studentCode: 'SCR/2025-26/00355',
    studentName: 'Mihir Trivedi',
    medium: 'Gujarati',
    standard: '8',
    division: 'A',
    transportType: 'None',
    isRTE: false,
    isActive: true,
    parentName: 'Manish Trivedi',
    parentMobile: '+91 99001 23456',
    status: '3+ DUE',
  },
  {
    id: 's7',
    studentCode: 'SCR/2025-26/00366',
    studentName: 'Nisha Kapoor',
    medium: 'English',
    standard: '3',
    division: 'C',
    transportType: 'Outside Railnagar',
    isRTE: false,
    isActive: true,
    parentName: 'Sanjay Kapoor',
    parentMobile: '+91 97654 32109',
    status: '1 DUE',
  },
  {
    id: 's8',
    studentCode: 'SCR/2025-26/00377',
    studentName: 'Dev Parmar',
    medium: 'English',
    standard: '10',
    division: 'B',
    transportType: 'None',
    isRTE: false,
    isActive: true,
    parentName: 'Suresh Parmar',
    parentMobile: '+91 93847 56123',
    status: '1 DUE',
  }
];

export const initialLedgerEntries: LedgerEntry[] = [
  // Rahul Mehta (Paid June)
  { id: 'l1', studentId: 's1', feePeriod: 'June', feeType: 'EDUCATION', totalAmount: 2400, paidAmount: 2400, concessionAmount: 0, remainingAmount: 0, dueDate: '2026-06-15', status: 'PAID' },
  { id: 'l2', studentId: 's1', feePeriod: 'June', feeType: 'TRANSPORT', totalAmount: 600, paidAmount: 600, concessionAmount: 0, remainingAmount: 0, dueDate: '2026-06-15', status: 'PAID' },
  { id: 'l3', studentId: 's1', feePeriod: 'July', feeType: 'EDUCATION', totalAmount: 2500, paidAmount: 0, concessionAmount: 0, remainingAmount: 2500, dueDate: '2026-07-15', status: 'PENDING' },
  { id: 'l4', studentId: 's1', feePeriod: 'July', feeType: 'TRANSPORT', totalAmount: 600, paidAmount: 0, concessionAmount: 0, remainingAmount: 600, dueDate: '2026-07-15', status: 'PENDING' },

  // Priya Shah (2 Months Due: June & July)
  { id: 'l5', studentId: 's2', feePeriod: 'Term 2', feeType: 'TERM', totalAmount: 2800, paidAmount: 2800, concessionAmount: 0, remainingAmount: 0, dueDate: '2026-05-15', status: 'PAID' },
  { id: 'l6', studentId: 's2', feePeriod: 'June', feeType: 'EDUCATION', totalAmount: 2800, paidAmount: 0, concessionAmount: 0, remainingAmount: 2800, dueDate: '2026-06-15', status: 'PENDING' },
  { id: 'l7', studentId: 's2', feePeriod: 'July', feeType: 'EDUCATION', totalAmount: 2800, paidAmount: 0, concessionAmount: 0, remainingAmount: 2800, dueDate: '2026-07-15', status: 'PENDING' },

  // Arjun Patel (Partial June)
  { id: 'l8', studentId: 's3', feePeriod: 'June', feeType: 'EDUCATION', totalAmount: 3500, paidAmount: 1500, concessionAmount: 0, remainingAmount: 2000, dueDate: '2026-06-15', status: 'PARTIAL' },
  { id: 'l9', studentId: 's3', feePeriod: 'June', feeType: 'TRANSPORT', totalAmount: 900, paidAmount: 0, concessionAmount: 0, remainingAmount: 900, dueDate: '2026-06-15', status: 'PENDING' },

  // Kavya Desai (RTE Govt paid)
  { id: 'l10', studentId: 's4', feePeriod: 'June', feeType: 'EDUCATION', totalAmount: 2500, paidAmount: 0, concessionAmount: 2500, remainingAmount: 0, dueDate: '2026-06-15', status: 'PAID' },

  // Rohan Joshi (Paid June)
  { id: 'l11', studentId: 's5', feePeriod: 'June', feeType: 'EDUCATION', totalAmount: 3200, paidAmount: 3200, concessionAmount: 0, remainingAmount: 0, dueDate: '2026-06-15', status: 'PAID' },
  { id: 'l12', studentId: 's5', feePeriod: 'June', feeType: 'TRANSPORT', totalAmount: 600, paidAmount: 600, concessionAmount: 0, remainingAmount: 0, dueDate: '2026-06-15', status: 'PAID' },

  // Mihir Trivedi (3+ Months Due)
  { id: 'l13', studentId: 's6', feePeriod: 'Term 1', feeType: 'TERM', totalAmount: 3000, paidAmount: 0, concessionAmount: 0, remainingAmount: 3000, dueDate: '2026-04-15', status: 'PENDING' },
  { id: 'l14', studentId: 's6', feePeriod: 'June', feeType: 'EDUCATION', totalAmount: 3000, paidAmount: 0, concessionAmount: 0, remainingAmount: 3000, dueDate: '2026-06-15', status: 'PENDING' },
  { id: 'l15', studentId: 's6', feePeriod: 'July', feeType: 'EDUCATION', totalAmount: 3000, paidAmount: 0, concessionAmount: 0, remainingAmount: 3000, dueDate: '2026-07-15', status: 'PENDING' },

  // Nisha Kapoor (1 Month Due)
  { id: 'l16', studentId: 's7', feePeriod: 'June', feeType: 'EDUCATION', totalAmount: 2800, paidAmount: 0, concessionAmount: 0, remainingAmount: 2800, dueDate: '2026-06-15', status: 'PENDING' },

  // Dev Parmar (1 Month Due)
  { id: 'l17', studentId: 's8', feePeriod: 'June', feeType: 'EDUCATION', totalAmount: 4200, paidAmount: 0, concessionAmount: 0, remainingAmount: 4200, dueDate: '2026-06-15', status: 'PENDING' },
];

export const initialTransactions: PaymentTransaction[] = [
  {
    id: 't1',
    studentId: 's1',
    studentName: 'Rahul Mehta',
    studentCode: 'SCR/2025-26/00342',
    classInfo: '7 - A Gujarati',
    feeType: 'Education Fee - June',
    amount: 3000,
    method: 'ONLINE',
    time: '9:42 AM',
    status: 'PAID',
    date: '2026-06-11'
  },
  {
    id: 't2',
    studentId: 's2',
    studentName: 'Priya Shah',
    studentCode: 'SCR/2025-26/00341',
    classInfo: '5 - B English',
    feeType: 'Term Fee 2',
    amount: 2800,
    method: 'CASH',
    time: '9:18 AM',
    status: 'PAID',
    date: '2026-06-11'
  },
  {
    id: 't3',
    studentId: 's3',
    studentName: 'Arjun Patel',
    studentCode: 'SCR/2025-26/00340',
    classInfo: '9 - A English',
    feeType: 'Education Fee - June',
    amount: 1500, // Partial: 1500 of 3500
    method: 'CASH',
    time: '8:55 AM',
    status: 'PARTIAL',
    date: '2026-06-11'
  },
  {
    id: 't4',
    studentId: 's4',
    studentName: 'Kavya Desai',
    studentCode: 'SCR/2025-26/00339',
    classInfo: '3 - C Gujarati',
    feeType: 'Education Fee - June',
    amount: 0,
    method: 'GOVT',
    time: '8:30 AM',
    status: 'RTE',
    date: '2026-06-11'
  },
  {
    id: 't5',
    studentId: 's5',
    studentName: 'Rohan Joshi',
    studentCode: 'SCR/2025-26/00338',
    classInfo: '6 - A English',
    feeType: 'Transport + Education',
    amount: 3800, // Education June 3200 + Transport June 600
    method: 'CARD',
    time: '8:12 AM',
    status: 'PAID',
    date: '2026-06-11'
  }
];

export interface FeeStructureItem {
  category: string;
  englishVal: string;
  gujaratiVal: string;
  isHeader?: boolean;
}

export const feeStructureData: FeeStructureItem[] = [
  { category: 'Annual Fee (Total)', englishVal: '₹42,000', gujaratiVal: '₹35,000' },
  { category: 'Monthly (÷14)', englishVal: '₹3,000', gujaratiVal: '₹2,500' },
  { category: 'Term Fee 1 (April)', englishVal: '₹3,000', gujaratiVal: '₹2,500' },
  { category: 'Term Fee 2 (October)', englishVal: '₹3,000', gujaratiVal: '₹2,500' },
  { category: 'Education Fee x 12 months', englishVal: '₹3,000 × 12', gujaratiVal: '₹2,500 × 12' },
  { category: 'Admission Fees (new only)', englishVal: '₹2,500', gujaratiVal: '₹2,000' },
  { category: 'Bag & Kit Fees', englishVal: '₹1,800', gujaratiVal: '₹1,500' },
  { category: '— Transport (separate) —', englishVal: '', gujaratiVal: '', isHeader: true },
  { category: 'Railnagar Zone/month', englishVal: '₹600', gujaratiVal: '₹600' },
  { category: 'Outside Railnagar/month', englishVal: '₹900', gujaratiVal: '₹900' },
];
