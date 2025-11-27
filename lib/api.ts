import axios from 'axios';
import type {
  ApiResponse,
  Class,
  Student,
  FeeStructure,
  FeeRecord,
  DashboardStats,
  MonthlyTrend,
  ClassWiseStats,
  PaymentModeStats,
  CreateClassData,
  CreateStudentData,
  UpdateStudentData,
  CreateFeeStructureData,
  RecordPaymentData,
  LoginData,
  LoginResponse,
  User,
  Teacher,
  CreateTeacherData,
  UpdateTeacherData,
  AssignClassData,
  ClassTeacher,
  Attendance,
  MarkAttendanceData,
  BulkMarkAttendanceData,
  StudentAttendanceSummary,
  ClassAttendanceReport,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true', // Skip ngrok browser warning
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Authentication API
export const authApi = {
  login: async (credentials: LoginData): Promise<LoginResponse> => {
    const { data } = await api.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
    if (!data.data) throw new Error('Login failed');
    return data.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  getProfile: async (): Promise<User> => {
    const { data } = await api.get<ApiResponse<User>>('/auth/profile');
    if (!data.data) throw new Error('Failed to fetch profile');
    return data.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await api.post('/auth/change-password', { currentPassword, newPassword });
  },

  register: async (userData: CreateTeacherData): Promise<User> => {
    const { data } = await api.post<ApiResponse<User>>('/auth/register', {
      ...userData,
      role: 'TEACHER',
      teacherData: {
        employeeId: userData.employeeId,
        phoneNumber: userData.phoneNumber,
        address: userData.address,
        qualification: userData.qualification,
        joiningDate: userData.joiningDate,
      },
    });
    if (!data.data) throw new Error('Failed to register user');
    return data.data;
  },
};

// Teachers API
export const teachersApi = {
  getAll: async (): Promise<Teacher[]> => {
    const { data } = await api.get<ApiResponse<Teacher[]>>('/teachers');
    return data.data || [];
  },

  getById: async (id: number): Promise<Teacher> => {
    const { data } = await api.get<ApiResponse<Teacher>>(`/teachers/${id}`);
    if (!data.data) throw new Error('Teacher not found');
    return data.data;
  },

  create: async (teacherData: CreateTeacherData): Promise<User> => {
    const { data } = await api.post<ApiResponse<User>>('/teachers', teacherData);
    if (!data.data) throw new Error('Failed to create teacher');
    return data.data;
  },

  update: async (id: number, teacherData: UpdateTeacherData): Promise<Teacher> => {
    const { data } = await api.put<ApiResponse<Teacher>>(`/teachers/${id}`, teacherData);
    if (!data.data) throw new Error('Failed to update teacher');
    return data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/teachers/${id}`);
  },

  assignToClass: async (id: number, assignData: AssignClassData): Promise<ClassTeacher> => {
    const { data } = await api.post<ApiResponse<ClassTeacher>>(`/teachers/${id}/assign-class`, assignData);
    if (!data.data) throw new Error('Failed to assign teacher to class');
    return data.data;
  },

  removeFromClass: async (id: number, classId: number): Promise<void> => {
    await api.delete(`/teachers/${id}/remove-class/${classId}`);
  },

  getAssignedClasses: async (id: number): Promise<ClassTeacher[]> => {
    const { data } = await api.get<ApiResponse<ClassTeacher[]>>(`/teachers/${id}/classes`);
    return data.data || [];
  },

  getMyClasses: async (): Promise<ClassTeacher[]> => {
    const { data } = await api.get<ApiResponse<ClassTeacher[]>>('/teachers/my-classes');
    return data.data || [];
  },
};

// Attendance API
export const attendanceApi = {
  getAll: async (params?: {
    classId?: number;
    studentId?: number;
    date?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Attendance[]> => {
    const { data } = await api.get<ApiResponse<Attendance[]>>('/attendance', { params });
    return data.data || [];
  },

  getClassAttendance: async (classId: number, date: string): Promise<Student[]> => {
    const { data } = await api.get<ApiResponse<Student[]>>(`/attendance/class/${classId}/date/${date}`);
    return data.data || [];
  },

  markAttendance: async (attendanceData: MarkAttendanceData): Promise<Attendance> => {
    const { data } = await api.post<ApiResponse<Attendance>>('/attendance/mark', attendanceData);
    if (!data.data) throw new Error('Failed to mark attendance');
    return data.data;
  },

  bulkMarkAttendance: async (bulkData: BulkMarkAttendanceData): Promise<Attendance[]> => {
    const { data } = await api.post<ApiResponse<Attendance[]>>('/attendance/bulk-mark', bulkData);
    return data.data || [];
  },

  bulkMark: async (bulkData: BulkMarkAttendanceData): Promise<Attendance[]> => {
    return attendanceApi.bulkMarkAttendance(bulkData);
  },

  getStudentSummary: async (studentId: number, startDate?: string, endDate?: string): Promise<StudentAttendanceSummary> => {
    const { data } = await api.get<ApiResponse<StudentAttendanceSummary>>(`/attendance/student/${studentId}/summary`, {
      params: { startDate, endDate },
    });
    if (!data.data) throw new Error('Failed to fetch student summary');
    return data.data;
  },

  getClassReport: async (classId: number, startDate?: string, endDate?: string): Promise<ClassAttendanceReport[]> => {
    const { data } = await api.get<ApiResponse<ClassAttendanceReport[]>>(`/attendance/class/${classId}/report`, {
      params: { startDate, endDate },
    });
    return data.data || [];
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/attendance/${id}`);
  },
};

// Classes API
export const classesApi = {
  getAll: async (): Promise<Class[]> => {
    const { data } = await api.get<ApiResponse<Class[]>>('/classes');
    return data.data || [];
  },

  getById: async (id: number): Promise<Class> => {
    const { data } = await api.get<ApiResponse<Class>>(`/classes/${id}`);
    if (!data.data) throw new Error('Class not found');
    return data.data;
  },

  create: async (classData: CreateClassData): Promise<Class> => {
    const { data } = await api.post<ApiResponse<Class>>('/classes', classData);
    if (!data.data) throw new Error('Failed to create class');
    return data.data;
  },

  update: async (id: number, classData: Partial<CreateClassData>): Promise<Class> => {
    const { data } = await api.put<ApiResponse<Class>>(`/classes/${id}`, classData);
    if (!data.data) throw new Error('Failed to update class');
    return data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/classes/${id}`);
  },
};

// Students API
export const studentsApi = {
  getAll: async (params?: { classId?: number; isActive?: boolean }): Promise<Student[]> => {
    const { data } = await api.get<ApiResponse<Student[]>>('/students', { params });
    return data.data || [];
  },

  getById: async (id: number): Promise<Student> => {
    const { data } = await api.get<ApiResponse<Student>>(`/students/${id}`);
    if (!data.data) throw new Error('Student not found');
    return data.data;
  },

  create: async (studentData: CreateStudentData): Promise<Student> => {
    const { data } = await api.post<ApiResponse<Student>>('/students', studentData);
    if (!data.data) throw new Error('Failed to create student');
    return data.data;
  },

  update: async (id: number, studentData: UpdateStudentData): Promise<Student> => {
    const { data } = await api.put<ApiResponse<Student>>(`/students/${id}`, studentData);
    if (!data.data) throw new Error('Failed to update student');
    return data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/students/${id}`);
  },

  permanentDelete: async (id: number): Promise<void> => {
    await api.delete(`/students/${id}/permanent`);
  },
};

// Fee Structures API
export const feeStructuresApi = {
  getAll: async (): Promise<FeeStructure[]> => {
    const { data } = await api.get<ApiResponse<FeeStructure[]>>('/fee-structures');
    return data.data || [];
  },

  getByClassId: async (classId: number): Promise<FeeStructure> => {
    const { data } = await api.get<ApiResponse<FeeStructure>>(`/fee-structures/class/${classId}`);
    if (!data.data) throw new Error('Fee structure not found');
    return data.data;
  },

  create: async (feeData: CreateFeeStructureData): Promise<FeeStructure> => {
    const { data } = await api.post<ApiResponse<FeeStructure>>('/fee-structures', feeData);
    if (!data.data) throw new Error('Failed to create fee structure');
    return data.data;
  },

  update: async (id: number, feeData: Partial<CreateFeeStructureData>): Promise<FeeStructure> => {
    const { data } = await api.put<ApiResponse<FeeStructure>>(`/fee-structures/${id}`, feeData);
    if (!data.data) throw new Error('Failed to update fee structure');
    return data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/fee-structures/${id}`);
  },
};

// Fee Records API
export const feeRecordsApi = {
  getAll: async (params?: {
    studentId?: number;
    month?: string;
    year?: number;
    status?: string;
  }): Promise<FeeRecord[]> => {
    const { data } = await api.get<ApiResponse<FeeRecord[]>>('/fee-records', { params });
    return data.data || [];
  },

  getById: async (id: number): Promise<FeeRecord> => {
    const { data} = await api.get<ApiResponse<FeeRecord>>(`/fee-records/${id}`);
    if (!data.data) throw new Error('Fee record not found');
    return data.data;
  },

  getOverdue: async (): Promise<FeeRecord[]> => {
    const { data } = await api.get<ApiResponse<FeeRecord[]>>('/fee-records/overdue');
    return data.data || [];
  },

  getPending: async (): Promise<FeeRecord[]> => {
    const { data } = await api.get<ApiResponse<FeeRecord[]>>('/fee-records/pending');
    return data.data || [];
  },

  recordPayment: async (id: number, paymentData: RecordPaymentData): Promise<FeeRecord> => {
    const { data } = await api.post<ApiResponse<FeeRecord>>(`/fee-records/${id}/payment`, paymentData);
    if (!data.data) throw new Error('Failed to record payment');
    return data.data;
  },

  updateStatus: async (id: number, status: string): Promise<FeeRecord> => {
    const { data } = await api.put<ApiResponse<FeeRecord>>(`/fee-records/${id}/status`, { status });
    if (!data.data) throw new Error('Failed to update status');
    return data.data;
  },

  updateOverdue: async (): Promise<void> => {
    await api.post('/fee-records/update-overdue');
  },

  generateMonthlyFees: async (data: {
    month: string;
    year: number;
    classId?: number;
    studentIds?: number[];
    dueDate?: string;
    examFee?: number;
    otherFee?: number;
  }): Promise<{ created: FeeRecord[]; skipped: any[] }> => {
    const response = await api.post<ApiResponse<{ created: FeeRecord[]; skipped: any[] }>>('/fee-records/generate', data);
    if (!response.data.data) throw new Error('Failed to generate fee records');
    return response.data.data;
  },

  addOneTimeFees: async (id: number, data: {
    examFee?: number;
    otherFee?: number;
    remarks?: string;
  }): Promise<FeeRecord> => {
    const response = await api.post<ApiResponse<FeeRecord>>(`/fee-records/${id}/add-fees`, data);
    if (!response.data.data) throw new Error('Failed to add one-time fees');
    return response.data.data;
  },
};

// Dashboard API
export const dashboardApi = {
  getStats: async (year?: number): Promise<DashboardStats> => {
    const { data } = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats', {
      params: { year },
    });
    if (!data.data) throw new Error('Failed to fetch dashboard stats');
    return data.data;
  },

  getMonthlyTrend: async (year?: number): Promise<MonthlyTrend[]> => {
    const { data } = await api.get<ApiResponse<MonthlyTrend[]>>('/dashboard/monthly-trend', {
      params: { year },
    });
    return data.data || [];
  },

  getClassWiseStats: async (year?: number): Promise<ClassWiseStats[]> => {
    const { data } = await api.get<ApiResponse<ClassWiseStats[]>>('/dashboard/class-wise', {
      params: { year },
    });
    return data.data || [];
  },

  getPaymentModeStats: async (year?: number): Promise<PaymentModeStats[]> => {
    const { data } = await api.get<ApiResponse<PaymentModeStats[]>>('/dashboard/payment-modes', {
      params: { year },
    });
    return data.data || [];
  },
};

export default api;
