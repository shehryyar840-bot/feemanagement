// Database Models Types

export interface Class {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  students?: Student[];
  feeStructure?: FeeStructure;
  _count?: {
    students: number;
  };
}

export interface Student {
  id: number;
  name: string;
  fatherName: string;
  classId: number;
  class?: Class;
  rollNumber: string;
  phoneNumber: string;
  address?: string;
  admissionDate: string;
  isActive: boolean;
  feeRecords?: FeeRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface FeeStructure {
  id: number;
  classId: number;
  class?: Class;
  tuitionFee: number;
  labFee: number;
  libraryFee: number;
  sportsFee: number;
  examFee: number;
  otherFee: number;
  totalMonthlyFee: number;
  createdAt: string;
  updatedAt: string;
}

export interface FeeRecord {
  id: number;
  studentId: number;
  student?: Student;
  month: string;
  year: number;
  tuitionFee: number;
  labFee: number;
  libraryFee: number;
  sportsFee: number;
  examFee: number;
  otherFee: number;
  totalFee: number;
  amountPaid: number;
  balance: number;
  status: 'Paid' | 'Pending' | 'Overdue';
  paymentDate?: string;
  paymentMode?: 'Cash' | 'Online' | 'Cheque';
  dueDate: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

// Dashboard Stats Types

export interface DashboardSummary {
  totalStudents: number;
  totalCollected: number;
  totalPending: number;
  totalOverdue: number;
}

export interface StatusBreakdown {
  paid: number;
  pending: number;
  overdue: number;
}

export interface DashboardStats {
  summary: DashboardSummary;
  statusBreakdown: StatusBreakdown;
  recentOverdue: FeeRecord[];
}

export interface MonthlyTrend {
  month: string;
  collected: number;
  expected: number;
  pending: number;
}

export interface ClassWiseStats {
  className: string;
  totalStudents: number;
  totalCollected: number;
  totalExpected: number;
  totalPending: number;
  monthlyFee: number;
}

export interface PaymentModeStats {
  mode: string;
  totalAmount: number;
  transactionCount: number;
}

// API Response Types

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form Types

export interface CreateClassData {
  name: string;
  description?: string;
}

export interface CreateStudentData {
  name: string;
  fatherName: string;
  classId: number;
  rollNumber: string;
  phoneNumber: string;
  address?: string;
  admissionDate?: string;
}

export interface UpdateStudentData {
  name?: string;
  fatherName?: string;
  classId?: number;
  phoneNumber?: string;
  address?: string;
  isActive?: boolean;
}

export interface CreateFeeStructureData {
  classId: number;
  tuitionFee: number;
  labFee?: number;
  libraryFee?: number;
  sportsFee?: number;
  examFee?: number;
  otherFee?: number;
}

export interface RecordPaymentData {
  amountPaid: number;
  paymentMode: 'Cash' | 'Online' | 'Cheque';
  remarks?: string;
}
