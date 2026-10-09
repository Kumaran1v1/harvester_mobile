import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { storage } from '../services/storage';

export interface ThemeColors {
  background: string;
  card: string;
  cardBorder: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryLight: string;
  success: string;
  successBg: string;
  danger: string;
  dangerBg: string;
  warning: string;
  warningBg: string;
  inputBg: string;
  inputBorder: string;
  headerBg: string;
  tabBarBg: string;
  chipBg: string;
  chipActiveBg: string;
}

export const lightTheme: ThemeColors = {
  background: '#f1f5f9',
  card: '#ffffff',
  cardBorder: '#e2e8f0',
  text: '#111827',
  textSecondary: '#4b5563',
  textMuted: '#9ca3af',
  border: '#d1d5db',
  primary: '#0d9488',
  primaryLight: '#ccfbf1',
  success: '#10b981',
  successBg: '#d1fae5',
  danger: '#ef4444',
  dangerBg: '#fee2e2',
  warning: '#f59e0b',
  warningBg: '#fef3c7',
  inputBg: '#ffffff',
  inputBorder: '#cbd5e1',
  headerBg: '#ffffff',
  tabBarBg: '#ffffff',
  chipBg: '#e2e8f0',
  chipActiveBg: '#0d9488',
};

export const darkTheme: ThemeColors = {
  background: '#0b0f19',
  card: '#111827',
  cardBorder: '#1f2937',
  text: '#f3f4f6',
  textSecondary: '#9ca3af',
  textMuted: '#6b7280',
  border: '#374151',
  primary: '#0d9488',
  primaryLight: '#134e4a',
  success: '#10b981',
  successBg: '#064e3b',
  danger: '#ef4444',
  dangerBg: '#450a0a',
  warning: '#f59e0b',
  warningBg: '#451a03',
  inputBg: '#1f2937',
  inputBorder: '#374151',
  headerBg: '#0b0f19',
  tabBarBg: '#111827',
  chipBg: '#1f2937',
  chipActiveBg: '#0d9488',
};

interface ThemeContextType {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
  setScheme: (mode: 'light' | 'dark') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState<boolean>(systemScheme === 'dark');

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const setScheme = (mode: 'light' | 'dark') => {
    setIsDark(mode === 'dark');
  };

  const colors = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleTheme, setScheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
