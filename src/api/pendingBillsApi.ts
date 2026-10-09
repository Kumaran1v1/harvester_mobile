import apiClient from './client';
import { PendingBill } from '../types';

export interface PendingBillsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  month?: number;
  year?: number;
}

export const pendingBillsApi = {
  getPendingBills: async (
    params: PendingBillsQueryParams
  ): Promise<{ data: PendingBill[]; total: number }> => {
    const query = new URLSearchParams();

    if (params.page !== undefined) query.append('page', params.page.toString());
    if (params.limit !== undefined) query.append('limit', params.limit.toString());
    if (params.search) query.append('search', params.search);
    if (params.month !== undefined) query.append('month', params.month.toString());
    if (params.year !== undefined) query.append('year', params.year.toString());

    const queryString = query.toString();
    const url = queryString ? `/pending-bills?${queryString}` : '/pending-bills';
    const res = await apiClient.get<{ data: PendingBill[]; total: number }>(url);
    return res.data;
  },
};
