import apiClient from './client';
import { Bill, BillPayment } from '../types';

export interface BillQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  month?: number;
  year?: number;
}

export const billsApi = {
  getBills: async (
    machineType: 'CLASS' | 'KARTAR',
    params: BillQueryParams
  ): Promise<{ data: Bill[]; total: number }> => {
    const endpoint = machineType === 'CLASS' ? '/class-bills' : '/kartar-bills';
    const query = new URLSearchParams();

    if (params.page !== undefined) query.append('page', params.page.toString());
    if (params.limit !== undefined) query.append('limit', params.limit.toString());
    if (params.search) query.append('search', params.search);
    if (params.month !== undefined) query.append('month', params.month.toString());
    if (params.year !== undefined) query.append('year', params.year.toString());

    const queryString = query.toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    const res = await apiClient.get<{ data: Bill[]; total: number }>(url);
    return res.data;
  },

  createBill: async (
    machineType: 'CLASS' | 'KARTAR',
    billData: Partial<Bill>
  ): Promise<Bill> => {
    const endpoint = machineType === 'CLASS' ? '/class-bills' : '/kartar-bills';
    const res = await apiClient.post<Bill>(endpoint, billData);
    return res.data;
  },

  updateBill: async (
    machineType: 'CLASS' | 'KARTAR',
    id: number,
    billData: Partial<Bill>
  ): Promise<Bill> => {
    const endpoint = machineType === 'CLASS' ? `/class-bills/${id}` : `/kartar-bills/${id}`;
    const res = await apiClient.put<Bill>(endpoint, billData);
    return res.data;
  },

  deleteBill: async (
    machineType: 'CLASS' | 'KARTAR',
    id: number
  ): Promise<{ success: boolean }> => {
    const endpoint = machineType === 'CLASS' ? `/class-bills/${id}` : `/kartar-bills/${id}`;
    const res = await apiClient.delete<{ success: boolean }>(endpoint);
    return res.data;
  },

  updateBillStatus: async (
    machineType: 'CLASS' | 'KARTAR',
    id: number,
    status: number
  ): Promise<Bill> => {
    const endpoint = machineType === 'CLASS' ? `/class-bills/${id}/status` : `/kartar-bills/${id}/status`;
    const res = await apiClient.patch<Bill>(endpoint, { status });
    return res.data;
  },

  getPayments: async (
    machineType: 'CLASS' | 'KARTAR',
    billId: number
  ): Promise<BillPayment[]> => {
    const endpoint = machineType === 'CLASS' ? `/class-bills/payments/${billId}` : `/kartar-bills/payments/${billId}`;
    const res = await apiClient.get<BillPayment[]>(endpoint);
    return res.data;
  },

  addPayment: async (
    machineType: 'CLASS' | 'KARTAR',
    billId: number,
    payment: { amount: number; remarks?: string }
  ): Promise<BillPayment> => {
    const endpoint = machineType === 'CLASS' ? `/class-bills/payments/${billId}` : `/kartar-bills/payments/${billId}`;
    const res = await apiClient.post<BillPayment>(endpoint, payment);
    return res.data;
  },

  deletePayment: async (
    machineType: 'CLASS' | 'KARTAR',
    paymentId: number
  ): Promise<{ success: boolean }> => {
    const endpoint = machineType === 'CLASS' ? `/class-bills/payments/${paymentId}` : `/kartar-bills/payments/${paymentId}`;
    const res = await apiClient.delete<{ success: boolean }>(endpoint);
    return res.data;
  },
};
