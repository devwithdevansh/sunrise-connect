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
  buyBagKit?: boolean;
  admissionMonth?: string;
  transportStartMonth?: string;
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
  feeType: 'EDUCATION' | 'TERM' | 'TRANSPORT' | 'ADMISSION' | 'BAG_KIT' | 'OTHER';
  totalAmount: number;
  paidAmount: number;
  concessionAmount: number;
  remainingAmount: number;
  dueDate: string;
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'CANCELLED';
  academicYear?: string; // e.g. "2025-26" — used for year-scoped ledger lookup
}


export interface PaymentTransaction {
  _id?: string;
  id: string;
  receiptNumber?: number;
  ledgerId: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  classInfo: string; // e.g. "7 - A Gujarati"
  feeType: string; // e.g. "Education Fee - June"
  amount: number;
  concessionAmount?: number; // concession applied in this payment record
  method: string;
  time: string; // e.g. "9:42 AM"
  status: 'PAID' | 'PARTIAL' | 'RTE' | 'REVERSED' | 'PARTIALLY_REVERSED' | 'PENDING';
  date: string; // e.g. "2026-06-11"
  remark?: string;
  subItems?: { id?: string; description: string; amount: number; concessionAmount: number; method?: string; status?: string; academicYear?: string }[];
  reversalIds?: string;
  paymentBreakdown?: { method: string; amount: number }[];
  isDeleted?: boolean;
  academicYear?: string;
}


export interface FeeStructureItem {
  category: string;
  englishVal: string;
  gujaratiVal: string;
  isHeader?: boolean;
}
