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
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
