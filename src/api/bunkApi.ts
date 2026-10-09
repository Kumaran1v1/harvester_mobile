import apiClient from './client';
import { FuelRecord } from '../types';

export const bunkApi = {
  getRecords: async (): Promise<FuelRecord[]> => {
    const res = await apiClient.get<FuelRecord[]>('/bunk-details');
    return res.data;
  },

  saveRecord: async (data: Partial<FuelRecord>): Promise<FuelRecord> => {
    const res = await apiClient.post<FuelRecord>('/bunk-details', data);
    return res.data;
  },

  updateRecord: async (id: number | string, data: Partial<FuelRecord>): Promise<FuelRecord> => {
    const res = await apiClient.put<FuelRecord>(`/bunk-details/${id}`, data);
    return res.data;
  },

  deleteRecord: async (id: number | string): Promise<{ success: boolean }> => {
    const res = await apiClient.delete<{ success: boolean }>(`/bunk-details/${id}`);
    return res.data;
  },
};
