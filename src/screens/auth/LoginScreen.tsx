import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getApiBaseUrl, setApiBaseUrl } from '../../api/client';
import { storage } from '../../services/storage';

export const LoginScreen = () => {
  const insets = useSafeAreaInsets();
  const { isDark, toggleTheme } = useTheme();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Server Settings State
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [serverUrl, setServerUrl] = useState(getApiBaseUrl());
  const [testingServer, setTestingServer] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  React.useEffect(() => {
    storage.getServerUrl().then((saved) => {
      if (saved) setServerUrl(saved);
    });
  }, []);

  const handleTestConnection = async () => {
    setTestingServer(true);
    setTestResult(null);
    try {
      const cleanUrl = serverUrl.trim();
      const res = await fetch(cleanUrl.endsWith('/api') ? cleanUrl.replace(/\/api$/, '') : cleanUrl, {
        method: 'GET',
      });
      if (res.status < 500) {
        setTestResult({ ok: true, msg: 'Connected successfully to backend!' });
      } else {
        setTestResult({ ok: false, msg: `Server returned status: ${res.status}` });
      }
    } catch (e: any) {
      setTestResult({
        ok: false,
        msg: `Connection failed: ${e?.message || 'Check IP and Wi-Fi connection'}`,
      });
    } finally {
      setTestingServer(false);
    }
  };

  const handleSaveServerUrl = async () => {
    const cleanUrl = serverUrl.trim();
    if (!cleanUrl) return;
    await storage.saveServerUrl(cleanUrl);
    setApiBaseUrl(cleanUrl);
    setIsServerModalOpen(false);
    setTestResult(null);
  };

  const handleLogin = async () => {
    setErrorMessage(null);

    if (!identifier.trim() || !password) {
      setErrorMessage('Please enter both your identifier and password');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ identifier: identifier.trim(), password });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Unable to connect to server. Check IP & credentials.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Deep Cyber Gradient Background Base - pointerEvents="none" so touches always reach inputs */}
      <View style={styles.deepBg} pointerEvents="none">
        <View style={styles.glowOrbTeal} />
        <View style={styles.glowOrbBlue} />
        <View style={styles.gridOverlay} />
      </View>

      {/* Top Floating Buttons: Server Settings (Left) & Theme (Right) */}
      <TouchableOpacity
        style={[styles.serverSettingsBtn, { top: Math.max(insets.top, 16) }]}
        onPress={() => setIsServerModalOpen(true)}
        activeOpacity={0.8}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.themeIcon}>⚙️</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.themeBtn, { top: Math.max(insets.top, 16) }]}
        onPress={toggleTheme}
        activeOpacity={0.8}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.themeIcon}>{isDark ? '☀️' : '🌙'}</Text>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 24) + 30,
            paddingBottom: Math.max(insets.bottom, 24) + 40,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        removeClippedSubviews={false}
        showsVerticalScrollIndicator={false}>
        {/* Static Card Container - No transform matrices on parent to ensure native Android IME stability */}
        <View style={styles.cardContainer}>
          {/* Brand Emblem */}
          <View style={styles.logoHalo}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoIcon}>🚜</Text>
            </View>
          </View>

          {/* Header Typography */}
          <Text style={styles.appTitle}>Harvester MS</Text>
          <Text style={styles.appSubtitle}>Agricultural Fleet & Billing Portal</Text>

          {/* Error Banner */}
          {errorMessage && (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Input 1: Identifier / Username / Mobile */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>EMAIL OR MOBILE NUMBER</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 9876543210 or user@example.com"
                placeholderTextColor="#64748b"
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
                autoCorrect={false}
                underlineColorAndroid="transparent"
              />
            </View>
          </View>

          {/* Input 2: Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>PASSWORD</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your password"
                placeholderTextColor="#64748b"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                autoCorrect={false}
                underlineColorAndroid="transparent"
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <View style={styles.eyeIconContainer}>
                  <View style={[styles.eyeOuter, showPassword && styles.eyeOuterActive]}>
                    <View style={[styles.eyePupil, showPassword && styles.eyePupilActive]} />
                    {!showPassword && <View style={styles.eyeSlash} />}
                  </View>
                  <Text style={[styles.eyeLabel, showPassword && styles.eyeLabelActive]}>
                    {showPassword ? 'HIDE' : 'SHOW'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleLogin}
            disabled={isSubmitting}
            activeOpacity={0.85}>
            {isSubmitting ? (
              <View style={styles.btnLoadingRow}>
                <ActivityIndicator color="#0f172a" size="small" />
                <Text style={styles.submitButtonTextLoading}>Verifying...</Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>Sign In to Dashboard →</Text>
            )}
          </TouchableOpacity>

          {/* Footer Security Badges */}
          <View style={styles.securityRow}>
            <Text style={styles.securityText}>🔒 256-bit Encrypted Session</Text>
            <Text style={styles.securityDot}>•</Text>
            <TouchableOpacity onPress={() => setIsServerModalOpen(true)}>
              <Text style={[styles.securityText, { color: '#2dd4bf', textDecorationLine: 'underline' }]}>
                ⚙️ Server IP
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Server Settings Modal */}
      <Modal visible={isServerModalOpen} transparent animationType="slide" onRequestClose={() => setIsServerModalOpen(false)}>
        <View style={styles.serverBackdrop}>
          <View style={styles.serverModalCard}>
            <View style={styles.serverModalHeader}>
              <Text style={styles.serverModalTitle}>⚙️ Backend Server Address</Text>
              <TouchableOpacity onPress={() => setIsServerModalOpen(false)} style={{ padding: 4 }}>
                <Text style={{ color: '#94a3b8', fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.serverModalHint}>
              Enter your backend API URL. When running on a physical phone over Wi-Fi, ensure your phone and computer are on the same Wi-Fi network.
            </Text>

            <View style={{ marginTop: 14 }}>
              <Text style={styles.serverInputLabel}>API URL</Text>
              <TextInput
                style={styles.serverInput}
                value={serverUrl}
                onChangeText={setServerUrl}
                placeholder="https://harvester-web-be.onrender.com/api"
                placeholderTextColor="#64748b"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {testResult && (
              <View
                style={[
                  styles.testResultBox,
                  { backgroundColor: testResult.ok ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' },
                ]}>
                <Text style={{ color: testResult.ok ? '#10b981' : '#ef4444', fontSize: 12, fontWeight: '700' }}>
                  {testResult.ok ? '✓ ' : '✕ '} {testResult.msg}
                </Text>
              </View>
            )}

            <View style={styles.serverModalBtns}>
              <TouchableOpacity
                style={styles.testBtn}
                onPress={handleTestConnection}
                disabled={testingServer}>
                {testingServer ? (
                  <ActivityIndicator color="#2dd4bf" size="small" />
                ) : (
                  <Text style={styles.testBtnText}>⚡ Test Connection</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveServerBtn} onPress={handleSaveServerUrl}>
                <Text style={styles.saveServerBtnText}>Save & Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070a12',
  },
  deepBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#070a12',
    overflow: 'hidden',
  },
  glowOrbTeal: {
    position: 'absolute',
    top: -60,
    left: -40,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(13, 148, 136, 0.28)',
  },
  glowOrbBlue: {
    position: 'absolute',
    bottom: -80,
    right: -50,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.05,
    backgroundColor: 'transparent',
  },
  serverSettingsBtn: {
    position: 'absolute',
    left: 20,
    zIndex: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeBtn: {
    position: 'absolute',
    right: 20,
    zIndex: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serverBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  serverModalCard: {
    backgroundColor: '#111827',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.3)',
    padding: 20,
  },
  serverModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serverModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f8fafc',
  },
  serverModalHint: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
    lineHeight: 18,
  },
  serverInputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2dd4bf',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  serverInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: '#1f2937',
    color: '#ffffff',
    paddingHorizontal: 12,
    fontSize: 13,
  },
  testResultBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
  },
  serverModalBtns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  testBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  testBtnText: {
    color: '#2dd4bf',
    fontSize: 12,
    fontWeight: '700',
  },
  saveServerBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#0d9488',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveServerBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  themeIcon: {
    fontSize: 18,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.88)',
    borderRadius: 24,
    padding: 26,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
  },
  logoHalo: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(45, 212, 191, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.3)',
    marginBottom: 16,
  },
  logoBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#2dd4bf',
    elevation: 4,
  },
  logoIcon: {
    fontSize: 26,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorIcon: {
    fontSize: 16,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
    flex: 1,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: '#f8fafc',
    paddingVertical: 0,
  },
  eyeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eyeOuter: {
    width: 20,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.8,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  eyeOuterActive: {
    borderColor: '#2dd4bf',
    backgroundColor: 'rgba(45, 212, 191, 0.12)',
  },
  eyePupil: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#94a3b8',
  },
  eyePupilActive: {
    backgroundColor: '#2dd4bf',
  },
  eyeSlash: {
    position: 'absolute',
    width: 22,
    height: 1.8,
    backgroundColor: '#f43f5e',
    transform: [{ rotate: '-45deg' }],
  },
  eyeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  eyeLabelActive: {
    color: '#2dd4bf',
  },
  submitButton: {
    backgroundColor: '#2dd4bf',
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#2dd4bf',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  btnLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: '#090d16',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  submitButtonTextLoading: {
    color: '#090d16',
    fontSize: 15,
    fontWeight: '700',
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    gap: 8,
  },
  securityText: {
    fontSize: 12,
    color: '#64748b',
  },
  securityDot: {
    color: '#475569',
    fontSize: 10,
  },
});

export default LoginScreen;
