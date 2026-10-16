import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, LoginRequest } from '../types';
import { authApi } from '../api/authApi';
import { storage } from '../services/storage';
import apiClient, { setAuthToken } from '../api/client';
import { getFCMToken, syncDeviceWithBackend } from '../services/notificationService';


interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on app boot
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedToken = await storage.getToken();
        const storedUser = await storage.getUser();
        if (storedToken && storedUser) {
          setAuthToken(storedToken);
          setToken(storedToken);
          setUser(storedUser);
        }
      } catch (e) {
        console.error('Session restoration failed', e);
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = async (credentials: LoginRequest) => {
    const res = await authApi.login(credentials);
    if (res && res.token) {
      // 1. Immediately cache token in memory so all immediate subsequent API calls are authorized
      setAuthToken(res.token);
      // 2. Persist to storage
      await storage.saveToken(res.token);
      await storage.saveUser(res.user);
      // 3. Update React context state
      setToken(res.token);
      setUser(res.user);

      // 4. Sync FCM device token with backend
      getFCMToken().then((fcmToken) => {
        if (fcmToken) syncDeviceWithBackend(fcmToken);
      }).catch(() => {});
    } else {
      throw new Error(res.message || 'Login failed');
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    const updated = await authApi.updateProfile(updates);
    const merged = { ...user, ...updated };
    await storage.saveUser(merged);
    setUser(merged as UserProfile);
  };

  const logout = async () => {
    try {
      const deviceId = await storage.getDeviceId();
      await apiClient.post('/device/unregister', { deviceId }).catch(() => {});
    } catch {}
    setAuthToken(null);
    await storage.clear();
    setToken(null);
    setUser(null);
  };


  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, setUser, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
