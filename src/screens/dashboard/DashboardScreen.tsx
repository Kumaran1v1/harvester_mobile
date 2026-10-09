import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi } from '../../api/dashboardApi';
import { DashboardStats } from '../../types';
import { YouTubeHeader } from '../../components/YouTubeHeader';
import { ShimmerBlock } from '../../components/YouTubeSkeleton';

export const DashboardScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMsg(null);

    try {
      const data = await dashboardApi.getStats();
      setStats(data);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Failed to load metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const userName = stats?.user?.name || user?.name || 'Owner';
  const machineName = stats?.user?.machineName || user?.machineName || 'Harvester Machine';
  const companyName = stats?.user?.companyName || user?.companyName || 'Harvester MS';

  const cards = [
    {
      title: 'Personal Details',
      value: userName,
      sub: `Machine: ${machineName}`,
      icon: '👤',
      color: '#0d9488',
      targetTab: 'ProfileTab',
    },
    {
      title: 'Bills Logs',
      value: `${stats?.totalBills || 0} Bills`,
      sub: `Revenue: ₹${(stats?.totalBilledRevenue || 0).toLocaleString('en-IN')}`,
      icon: '📄',
      color: '#3b82f6',
      targetTab: 'BillsTab',
    },
    {
      title: 'Pending Bills',
      value: `₹${(stats?.totalPendingBalance || 0).toLocaleString('en-IN')}`,
      sub: `${stats?.totalPendingBillsCount || 0} Accounts Pending`,
      icon: '💳',
      color: '#ef4444',
      targetTab: 'PendingBillsTab',
    },
    {
      title: 'Operator Records',
      value: `${stats?.totalOperators || 0} Operators`,
      sub: `Salary Paid: ₹${(stats?.totalOperatorSalaryPaid || 0).toLocaleString('en-IN')}`,
      icon: '👥',
      color: '#f59e0b',
      targetTab: 'OperatorsTab',
    },
    {
      title: 'Bunk Details',
      value: `₹${(stats?.totalFuelAmount || 0).toLocaleString('en-IN')}`,
      sub: `Pending Bunk: ₹${(stats?.totalFuelPending || 0).toLocaleString('en-IN')}`,
      icon: '⛽',
      color: '#a855f7',
      targetTab: 'BunkDetailsTab',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Top App Header with Drawer and Profile Quick modal */}
      <YouTubeHeader
        title={companyName}
        subtitle="Control Center"
        onNavigateTab={(tab) => navigation.navigate(tab)}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 60 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchStats(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }>
        {/* Error Alert */}
        {errorMsg && (
          <View style={[styles.errorBanner, { backgroundColor: colors.dangerBg }]}>
            <Text style={[styles.errorText, { color: colors.danger }]}>⚠️ {errorMsg}</Text>
            <TouchableOpacity onPress={() => fetchStats()}>
              <Text style={[styles.retryText, { color: colors.primary }]}>Tap to Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Financial Summary Card */}
        <View
          style={[
            styles.financialCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}>
          <View style={styles.financialHeader}>
            <Text style={[styles.financialBadge, { color: colors.primary }]}>
              FINANCIAL OVERVIEW
            </Text>
            <Text style={[styles.fleetTitle, { color: colors.text }]}>Active Season Metrics</Text>
          </View>

          <View style={styles.kpiRow}>
            <View style={styles.kpiCol}>
              <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Revenue</Text>
              <Text style={[styles.kpiValue, { color: '#10b981' }]}>
                ₹{(stats?.totalBilledRevenue || 0).toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={[styles.kpiDivider, { backgroundColor: colors.cardBorder }]} />

            <View style={styles.kpiCol}>
              <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Expenses</Text>
              <Text style={[styles.kpiValue, { color: '#ef4444' }]}>
                ₹{(stats?.totalExpenses || 0).toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={[styles.kpiDivider, { backgroundColor: colors.cardBorder }]} />

            <View style={styles.kpiCol}>
              <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Net Profit</Text>
              <Text
                style={[
                  styles.kpiValue,
                  { color: (stats?.netProfit || 0) >= 0 ? '#10b981' : '#ef4444' },
                ]}>
                ₹{(stats?.netProfit || 0).toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>

        {/* Machine Breakdown */}
        <View style={styles.breakdownRow}>
          <View
            style={[
              styles.breakdownChip,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}>
            <Text style={styles.breakdownIcon}>🚜</Text>
            <View style={{ marginLeft: 8 }}>
              <Text style={[styles.breakdownTitle, { color: colors.text }]}>CLASS Machine</Text>
              <Text style={[styles.breakdownSub, { color: colors.textSecondary }]}>
                {stats?.classBillsCount || 0} Bills Logged
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.breakdownChip,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}>
            <Text style={styles.breakdownIcon}>🚜</Text>
            <View style={{ marginLeft: 8 }}>
              <Text style={[styles.breakdownTitle, { color: colors.text }]}>KARTAR Machine</Text>
              <Text style={[styles.breakdownSub, { color: colors.textSecondary }]}>
                {stats?.kartarBillsCount || 0} Bills Logged
              </Text>
            </View>
          </View>
        </View>

        {/* 5 Main Module Navigation Cards */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
          MANAGEMENT MODULES
        </Text>

        {loading && !refreshing ? (
          <View style={{ gap: 12 }}>
            <ShimmerBlock height={80} borderRadius={12} />
            <ShimmerBlock height={80} borderRadius={12} />
            <ShimmerBlock height={80} borderRadius={12} />
            <ShimmerBlock height={80} borderRadius={12} />
            <ShimmerBlock height={80} borderRadius={12} />
          </View>
        ) : (
          cards.map((c, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.moduleCard,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
              onPress={() => navigation.navigate(c.targetTab)}
              activeOpacity={0.75}>
              <View style={[styles.cardIconBox, { backgroundColor: `${c.color}20` }]}>
                <Text style={styles.cardEmoji}>{c.icon}</Text>
              </View>

              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>{c.title}</Text>
                <Text style={[styles.cardValue, { color: colors.text }]}>{c.value}</Text>
                <Text style={[styles.cardSub, { color: colors.textMuted }]}>{c.sub}</Text>
              </View>

              <View style={[styles.cardArrowBox, { backgroundColor: colors.chipBg }]}>
                <Text style={[styles.cardArrow, { color: c.color }]}>›</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  errorBanner: {
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
  },
  retryText: {
    fontSize: 12,
    fontWeight: '800',
  },
  financialCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  financialHeader: {
    marginBottom: 12,
  },
  financialBadge: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  fleetTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  kpiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kpiCol: {
    flex: 1,
    alignItems: 'center',
  },
  kpiDivider: {
    width: 1,
    height: 32,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  kpiValue: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  breakdownRow: {
    flexDirection: 'row',
    gap: 10,
  },
  breakdownChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  breakdownIcon: {
    fontSize: 22,
  },
  breakdownTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  breakdownSub: {
    fontSize: 11,
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 8,
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    elevation: 1,
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmoji: {
    fontSize: 22,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardValue: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 1,
  },
  cardSub: {
    fontSize: 12,
    marginTop: 2,
  },
  cardArrowBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardArrow: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 22,
  },
});
