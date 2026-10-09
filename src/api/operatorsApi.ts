import apiClient from './client';
import { Operator, AttendanceLog, OperatorPaymentHistory } from '../types';

export const operatorsApi = {
  getOperators: async (search?: string): Promise<Operator[]> => {
    const url = search ? `/operators?search=${encodeURIComponent(search)}` : '/operators';
    const res = await apiClient.get<Operator[]>(url);
    return res.data;
  },

  createOperator: async (data: { operatorName: string; mobile: string; salary?: number }): Promise<Operator> => {
    const res = await apiClient.post<Operator>('/operators', data);
    return res.data;
  },

  updateOperator: async (id: number | string, data: { operatorName?: string; mobile?: string }): Promise<Operator> => {
    const res = await apiClient.patch<Operator>(`/operators/${id}`, data);
    return res.data;
  },

  deleteOperator: async (id: number | string): Promise<{ success: boolean }> => {
    const res = await apiClient.delete<{ success: boolean }>(`/operators/${id}`);
    return res.data;
  },

  getAttendanceGrid: async (startDate: string, endDate: string): Promise<{ operators: any[]; attendances: AttendanceLog[] }> => {
    const res = await apiClient.get<{ operators: any[]; attendances: AttendanceLog[] }>(
      `/operators/attendance-grid?startDate=${startDate}&endDate=${endDate}`
    );
    return res.data;
  },

  saveAttendance: async (data: {
    operatorId: number | string;
    date: string;
    status: 'PRESENT' | 'ABSENT' | 'UNMARKED';
    dailyWage?: number | null;
  }): Promise<any> => {
    const res = await apiClient.post('/operators/attendance', data);
    return res.data;
  },

  getPaymentHistory: async (operatorId: number | string): Promise<OperatorPaymentHistory[]> => {
    const res = await apiClient.get<OperatorPaymentHistory[]>(`/operators/${operatorId}/payments`);
    return res.data;
  },

  addPayment: async (
    operatorId: number | string,
    data: { amount: number; paymentDate?: string; remarks?: string }
  ): Promise<OperatorPaymentHistory> => {
    const res = await apiClient.post<OperatorPaymentHistory>(`/operators/${operatorId}/payments`, data);
    return res.data;
  },
};
