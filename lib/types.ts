// Database Models Types

export interface Class extends Record<string, unknown> {
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

export interface Student extends Record<string, unknown> {
  id: number;
  name: string;
  fatherName: string;
  dateOfBirth?: string;
  classId: number;
  class?: Class;
  rollNumber: string;
  phoneNumber: string;
  address?: string;
  admissionDate: string;
  isActive: boolean;
  tuitionFee?: number;
  labFee?: number;
  libraryFee?: number;
  sportsFee?: number;
  examFee?: number;
  otherFee?: number;
  totalMonthlyFee?: number;
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

export interface FeeRecord extends Record<string, unknown> {
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
  dateOfBirth?: string;
  classId: number;
  rollNumber: string;
  phoneNumber: string;
  address?: string;
  admissionDate?: string;
}

export interface UpdateStudentData {
  name?: string;
  fatherName?: string;
  dateOfBirth?: string;
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

// Authentication & User Types

export type Role = 'ADMIN' | 'TEACHER';

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  teacher?: Teacher;
  createdAt: string;
  updatedAt: string;
}

export interface Teacher extends Record<string, unknown> {
  id: number;
  userId: number;
  user?: User;
  employeeId: string;
  phoneNumber: string;
  address?: string;
  qualification?: string;
  joiningDate: string;
  classTeachers?: ClassTeacher[];
  createdAt: string;
  updatedAt: string;
  _count?: {
    attendances: number;
  };
}

export interface ClassTeacher {
  id: number;
  teacherId: number;
  teacher?: Teacher;
  classId: number;
  class?: Class;
  subject?: string;
  isPrimary: boolean;
  createdAt: string;
}

// Attendance Types

export type AttendanceStatus = 'PRESENT' | 'ABSENT';

export interface Attendance {
  id: number;
  studentId: number;
  student?: Student;
  date: string;
  status: AttendanceStatus;
  markedBy: number;
  teacher?: Teacher;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  percentage: number;
}

export interface StudentAttendanceSummary {
  summary: AttendanceSummary;
  records: Attendance[];
}

export interface ClassAttendanceReport {
  studentId: number;
  name: string;
  rollNumber: string;
  total: number;
  present: number;
  absent: number;
  percentage: number;
}

// Auth Form Types

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface CreateTeacherData {
  email: string;
  password: string;
  name: string;
  employeeId: string;
  phoneNumber: string;
  address?: string;
  qualification?: string;
  joiningDate?: string;
}

export interface UpdateTeacherData {
  name?: string;
  phoneNumber?: string;
  address?: string;
  qualification?: string;
  isActive?: boolean;
}

export interface AssignClassData {
  classId: number;
  subject?: string;
  isPrimary?: boolean;
}

export interface MarkAttendanceData {
  studentId: number;
  date: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface BulkAttendanceRecord {
  studentId: number;
  status: AttendanceStatus;
  remarks?: string;
}

export interface BulkMarkAttendanceData {
  classId?: number;
  date: string;
  records?: BulkAttendanceRecord[];
  attendanceRecords?: BulkAttendanceRecord[];
}
