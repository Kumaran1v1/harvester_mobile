import apiClient from './client';
import { LoginRequest, LoginResponse, UserProfile, OwnerDocument } from '../types';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const res = await apiClient.post<LoginResponse>('/auth/login', credentials);
    return res.data;
  },

  getProfile: async (): Promise<UserProfile> => {
    const res = await apiClient.get<UserProfile>('/auth/profile');
    return res.data;
  },

  updateProfile: async (data: Partial<UserProfile>): Promise<UserProfile> => {
    const res = await apiClient.put<UserProfile>('/auth/profile', data);
    return res.data;
  },

  getDocuments: async (): Promise<OwnerDocument[]> => {
    const res = await apiClient.get<OwnerDocument[]>('/auth/documents');
    return res.data;
  },

  uploadDocument: async (doc: Partial<OwnerDocument>): Promise<OwnerDocument> => {
    const res = await apiClient.post<OwnerDocument>('/auth/documents', doc);
    return res.data;
  },

  deleteDocument: async (id: number): Promise<{ success: boolean }> => {
    const res = await apiClient.delete<{ success: boolean }>(`/auth/documents/${id}`);
    return res.data;
  },
};
