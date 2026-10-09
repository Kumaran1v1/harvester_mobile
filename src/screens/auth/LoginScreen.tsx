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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export const LoginScreen = () => {
  const insets = useSafeAreaInsets();
  const { isDark, toggleTheme } = useTheme();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
        'Unable to connect to server. Check credentials.';
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

      {/* Floating Theme Mode Toggle */}
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
            <Text style={styles.securityText}>Live Render API</Text>
          </View>
        </View>
      </ScrollView>
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
