import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

interface AppDrawerProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (tabName: string) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.78, 300);

export const AppDrawer: React.FC<AppDrawerProps> = ({
  visible,
  onClose,
  onNavigate,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim]);

  if (!visible) return null;

  const companyName = user?.companyName || 'Cable Network';
  const userName = user?.name || 'Administrator';
  const rawRole = typeof user?.role === 'object' ? user?.role?.roleCode : user?.role;
  const userRole = (rawRole || 'ADMIN').toUpperCase();
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const handleSelectTab = (tabName: string) => {
    onClose();
    onNavigate(tabName);
  };

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Backdrop Fade */}
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>

        {/* Sliding Drawer Panel */}
        <Animated.View
          style={[
            styles.drawerContainer,
            {
              width: DRAWER_WIDTH,
              backgroundColor: isDark ? '#0f172a' : '#ffffff',
              borderRightColor: colors.cardBorder,
              paddingTop: Math.max(insets.top, 16),
              paddingBottom: Math.max(insets.bottom, 16),
              transform: [{ translateX: slideAnim }],
            },
          ]}>
          {/* Brand Header */}
          <View style={[styles.drawerHeader, { borderBottomColor: colors.cardBorder }]}>
            <View style={styles.brandRow}>
              <View style={styles.brandBadge}>
                <Text style={styles.brandIcon}>🚜</Text>
              </View>
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={[styles.brandTitle, { color: colors.text }]} numberOfLines={1}>
                  {companyName}
                </Text>
                <Text style={[styles.brandSubtitle, { color: colors.primary }]}>
                  Owner Control Center
                </Text>
              </View>
            </View>

            {/* User Profile Mini Card */}
            <View style={[styles.profileCard, { backgroundColor: colors.chipBg }]}>
              <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={[styles.profileName, { color: colors.text }]} numberOfLines={1}>
                  {userName}
                </Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>{userRole}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Drawer Navigation List */}
          <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
            <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
              MAIN MENU
            </Text>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleSelectTab('DashboardTab')}
              activeOpacity={0.7}>
              <Text style={styles.menuItemIcon}>📊</Text>
              <Text style={[styles.menuItemText, { color: colors.text }]}>Dashboard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleSelectTab('ProfileTab')}
              activeOpacity={0.7}>
              <Text style={styles.menuItemIcon}>👤</Text>
              <Text style={[styles.menuItemText, { color: colors.text }]}>Personal Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleSelectTab('BillsTab')}
              activeOpacity={0.7}>
              <Text style={styles.menuItemIcon}>📄</Text>
              <Text style={[styles.menuItemText, { color: colors.text }]}>Bills</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleSelectTab('PendingBillsTab')}
              activeOpacity={0.7}>
              <Text style={styles.menuItemIcon}>💳</Text>
              <Text style={[styles.menuItemText, { color: colors.text }]}>Pending Bills</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleSelectTab('OperatorsTab')}
              activeOpacity={0.7}>
              <Text style={styles.menuItemIcon}>👥</Text>
              <Text style={[styles.menuItemText, { color: colors.text }]}>Operator Records</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleSelectTab('BunkDetailsTab')}
              activeOpacity={0.7}>
              <Text style={styles.menuItemIcon}>⛽</Text>
              <Text style={[styles.menuItemText, { color: colors.text }]}>Bunk Details</Text>
            </TouchableOpacity>

            <View style={[styles.menuDivider, { backgroundColor: colors.cardBorder }]} />

            <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
              PREFERENCES
            </Text>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={toggleTheme}
              activeOpacity={0.7}>
              <Text style={styles.menuItemIcon}>{isDark ? '☀️' : '🌙'}</Text>
              <Text style={[styles.menuItemText, { color: colors.text }]}>
                {isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Drawer Footer: Logout */}
          <View style={[styles.drawerFooter, { borderTopColor: colors.cardBorder }]}>
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={handleLogout}
              activeOpacity={0.8}>
              <Text style={styles.logoutIcon}>🚪</Text>
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  drawerContainer: {
    height: '100%',
    borderRightWidth: 1,
    elevation: 16,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowOffset: { width: 4, height: 0 },
    shadowRadius: 12,
  },
  drawerHeader: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  brandBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#0d9488',
  },
  brandIcon: {
    fontSize: 18,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  profileName: {
    fontSize: 13,
    fontWeight: '700',
  },
  roleBadge: {
    backgroundColor: 'rgba(45, 212, 191, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  roleText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0d9488',
  },
  menuScroll: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginVertical: 8,
    paddingHorizontal: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  menuItemIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '600',
  },
  menuDivider: {
    height: 1,
    marginVertical: 10,
  },
  drawerFooter: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  logoutIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '700',
  },
});
