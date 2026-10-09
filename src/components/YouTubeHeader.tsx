import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { AppDrawer } from './AppDrawer';

interface YouTubeHeaderProps {
  onNavigateTab?: (tabName: string) => void;
  title?: string;
  subtitle?: string;
  showMonthNavigator?: boolean;
  selectedMonth?: string;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  canNextMonth?: boolean;
}

export const YouTubeHeader: React.FC<YouTubeHeaderProps> = ({
  onNavigateTab,
  title,
  subtitle,
  showMonthNavigator,
  selectedMonth,
  onPrevMonth,
  onNextMonth,
  canNextMonth = false,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const userName = user?.name || 'Administrator';
  const rawRole = typeof user?.role === 'object' ? user?.role?.roleCode : user?.role;
  const userRole = (rawRole || 'ADMIN').toUpperCase();
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const handleOpenProfileTab = () => {
    setProfileMenuOpen(false);
    if (onNavigateTab) {
      onNavigateTab('ProfileTab');
    }
  };

  const handleLogout = async () => {
    setProfileMenuOpen(false);
    await logout();
  };

  return (
    <>
      <View
        style={[
          styles.container,
          {
            paddingTop: Math.max(insets.top, 12),
            backgroundColor: colors.headerBg,
            borderBottomColor: colors.cardBorder,
          },
        ]}>
        {/* Main YouTube-Style App Bar */}
        <View style={styles.topRow}>
          {/* Left: Hamburger Menu + Logo Badge */}
          <View style={styles.leftGroup}>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: colors.chipBg }]}
              onPress={() => setDrawerOpen(true)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[styles.hamburgerIcon, { color: colors.text }]}>☰</Text>
            </TouchableOpacity>

            <View style={styles.brandContainer}>
              <View style={styles.brandIconBox}>
                <Text style={styles.brandIcon}>🚜</Text>
              </View>
              <View style={{ marginLeft: 8 }}>
                <View style={styles.titleRow}>
                  <Text style={[styles.brandTitle, { color: colors.text }]}>
                    {title || (user?.companyName ? user.companyName.toUpperCase() : 'HARVESTER')}
                  </Text>
                  {!title && !user?.companyName && (
                    <Text style={[styles.brandTitleAccent, { color: colors.primary }]}>
                      MS
                    </Text>
                  )}
                </View>
                {subtitle && (
                  <Text style={[styles.brandSubtitle, { color: colors.textSecondary }]}>
                    {subtitle}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Right: Theme Toggle + Profile Avatar */}
          <View style={styles.rightGroup}>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: colors.chipBg }]}
              onPress={toggleTheme}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={{ fontSize: 16 }}>{isDark ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.avatarButton,
                { borderColor: colors.primary, backgroundColor: colors.primary },
              ]}
              onPress={() => setProfileMenuOpen(true)}
              activeOpacity={0.8}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.avatarButtonText}>{initials}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Optional Secondary Month Navigation Bar (When on Dashboard / Collections) */}
        {showMonthNavigator && (
          <View style={[styles.monthNavRow, { borderTopColor: colors.cardBorder }]}>
            <TouchableOpacity
              style={[styles.monthNavArrow, { backgroundColor: colors.chipBg }]}
              onPress={onPrevMonth}
              activeOpacity={0.7}>
              <Text style={[styles.monthNavArrowText, { color: colors.primary }]}>‹</Text>
            </TouchableOpacity>

            <View style={styles.monthTitleBox}>
              <Text style={[styles.monthText, { color: colors.text }]}>{title}</Text>
              <Text style={[styles.monthSubText, { color: colors.textSecondary }]}>
                Tap arrows to change billing cycle
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.monthNavArrow,
                { backgroundColor: colors.chipBg },
                !canNextMonth && styles.monthNavArrowDisabled,
              ]}
              onPress={onNextMonth}
              disabled={!canNextMonth}
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.monthNavArrowText,
                  { color: canNextMonth ? colors.primary : colors.textMuted },
                ]}>
                ›
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Slide-out Sidebar Drawer */}
      <AppDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onNavigate={(tab) => onNavigateTab && onNavigateTab(tab)}
      />

      {/* YouTube-Style Profile Quick Account Modal */}
      {profileMenuOpen && (
        <Modal
          visible={profileMenuOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setProfileMenuOpen(false)}>
          <TouchableWithoutFeedback onPress={() => setProfileMenuOpen(false)}>
            <View style={styles.modalBackdrop}>
              <TouchableWithoutFeedback>
                <View
                  style={[
                    styles.profilePopupCard,
                    {
                      top: Math.max(insets.top, 16) + 48,
                      backgroundColor: colors.card,
                      borderColor: colors.cardBorder,
                    },
                  ]}>
                  {/* Account Header */}
                  <View style={styles.popupHeader}>
                    <View style={[styles.popupAvatar, { backgroundColor: colors.primary }]}>
                      <Text style={styles.popupAvatarText}>{initials}</Text>
                    </View>
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={[styles.popupName, { color: colors.text }]} numberOfLines={1}>
                        {userName}
                      </Text>
                      <View style={styles.popupRoleBadge}>
                        <Text style={styles.popupRoleText}>{userRole}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.popupDivider, { backgroundColor: colors.cardBorder }]} />

                  {/* Actions */}
                  <TouchableOpacity
                    style={styles.popupMenuItem}
                    onPress={handleOpenProfileTab}
                    activeOpacity={0.7}>
                    <Text style={styles.popupMenuIcon}>👤</Text>
                    <Text style={[styles.popupMenuText, { color: colors.text }]}>
                      My Profile & Settings
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.popupMenuItem}
                    onPress={toggleTheme}
                    activeOpacity={0.7}>
                    <Text style={styles.popupMenuIcon}>{isDark ? '☀️' : '🌙'}</Text>
                    <Text style={[styles.popupMenuText, { color: colors.text }]}>
                      {isDark ? 'Light Theme' : 'Dark Theme'}
                    </Text>
                  </TouchableOpacity>

                  <View style={[styles.popupDivider, { backgroundColor: colors.cardBorder }]} />

                  <TouchableOpacity
                    style={styles.popupLogoutItem}
                    onPress={handleLogout}
                    activeOpacity={0.7}>
                    <Text style={styles.popupMenuIcon}>🚪</Text>
                    <Text style={styles.popupLogoutText}>Sign Out</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    height: 52,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hamburgerIcon: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 22,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  brandIconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandIcon: {
    fontSize: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  brandTitleAccent: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginLeft: 3,
  },
  brandSubtitle: {
    fontSize: 10,
    marginTop: -1,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  avatarButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  monthNavArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavArrowDisabled: {
    opacity: 0.3,
  },
  monthNavArrowText: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 26,
  },
  monthTitleBox: {
    alignItems: 'center',
  },
  monthText: {
    fontSize: 15,
    fontWeight: '700',
  },
  monthSubText: {
    fontSize: 10,
    marginTop: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  profilePopupCard: {
    position: 'absolute',
    right: 16,
    width: 250,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
  },
  popupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  popupAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupAvatarText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  popupName: {
    fontSize: 14,
    fontWeight: '700',
  },
  popupRoleBadge: {
    backgroundColor: 'rgba(45, 212, 191, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 3,
  },
  popupRoleText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0d9488',
  },
  popupDivider: {
    height: 1,
    marginVertical: 10,
  },
  popupMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  popupMenuIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  popupMenuText: {
    fontSize: 13,
    fontWeight: '600',
  },
  popupLogoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  popupLogoutText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '700',
  },
});
