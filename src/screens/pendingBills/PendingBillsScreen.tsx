import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  RefreshControl,
  Linking,
  Alert,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { pendingBillsApi } from '../../api/pendingBillsApi';
import { PendingBill } from '../../types';
import { YouTubeHeader } from '../../components/YouTubeHeader';
import { MonthFilterBar, MonthFilterState } from '../../components/MonthFilterBar';
import { ShimmerBlock } from '../../components/YouTubeSkeleton';

export const PendingBillsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  const [pendingBills, setPendingBills] = useState<PendingBill[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [machineFilter, setMachineFilter] = useState<'ALL' | 'CLASS' | 'KARTAR'>('ALL');

  const [filterState, setFilterState] = useState<MonthFilterState>({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    isOverall: true,
  });

  const fetchPendingBills = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const params: any = {
          limit: 100,
          search: searchQuery.trim() || undefined,
        };
        if (!filterState.isOverall) {
          params.month = filterState.month;
          params.year = filterState.year;
        }

        const res = await pendingBillsApi.getPendingBills(params);
        setPendingBills(res.data);
        setTotalCount(res.total);
      } catch (err: any) {
        Alert.alert('Error', err?.message || 'Failed to load pending bills');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [searchQuery, filterState]
  );

  useEffect(() => {
    fetchPendingBills();
  }, [fetchPendingBills]);

  // Client-side filter by machine type if selected
  const filteredList = useMemo(() => {
    if (machineFilter === 'ALL') return pendingBills;
    return pendingBills.filter((b) => b.machineType === machineFilter);
  }, [pendingBills, machineFilter]);

  // Aggregate pending balance
  const totalPendingBalance = useMemo(() => {
    return filteredList.reduce((sum, b) => sum + Number(b.balanceAmount || 0), 0);
  }, [filteredList]);

  const handleSendReminder = (item: PendingBill) => {
    const company = user?.companyName || 'HARVESTER SERVICE';
    const text =
      `*PAYMENT REMINDER - ${company}*\n` +
      `---------------------------------\n` +
      `Dear *${item.customerName}*,\n\n` +
      `This is a gentle reminder regarding the harvester work done at *${item.place}* on ${new Date(item.date).toLocaleDateString('en-IN')}.\n\n` +
      `*Total Amount:* ₹${item.totalAmount.toLocaleString('en-IN')}\n` +
      `*Advance Paid:* ₹${item.advance.toLocaleString('en-IN')}\n` +
      `*Pending Balance:* ₹${item.balanceAmount.toLocaleString('en-IN')}\n\n` +
      `Kindly arrange the settlement at your earliest convenience.\n` +
      `Thank you!`;

    const phone = item.contactNumber.replace(/[^0-9]/g, '');
    const cleanPhone = phone.length === 10 ? `91${phone}` : phone;
    const url = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) Linking.openURL(url);
        else Alert.alert('WhatsApp Unavailable', 'WhatsApp application is not installed on this device.');
      })
      .catch(() => Alert.alert('Error', 'Unable to launch WhatsApp'));
  };

  const renderPendingCard = ({ item }: { item: PendingBill }) => {
    return (
      <View
        style={[
          styles.pendingCard,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
        ]}>
        {/* Top Header */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={[styles.custName, { color: colors.text }]} numberOfLines={1}>
                {item.customerName}
              </Text>
              <View
                style={[
                  styles.machineBadge,
                  {
                    backgroundColor:
                      item.machineType === 'CLASS'
                        ? 'rgba(13, 148, 136, 0.15)'
                        : 'rgba(245, 158, 11, 0.15)',
                  },
                ]}>
                <Text
                  style={[
                    styles.machineBadgeText,
                    {
                      color:
                        item.machineType === 'CLASS' ? colors.primary : '#f59e0b',
                    },
                  ]}>
                  {item.machineType}
                </Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                📍 {item.place}
              </Text>
              <Text style={[styles.metaText, { color: colors.textMuted }]}>
                📅 {new Date(item.date).toLocaleDateString('en-IN')}
              </Text>
              {item.timeHours > 0 && (
                <Text style={[styles.metaText, { color: colors.primary }]}>
                  ⏱ {item.timeHours} hrs
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Balance Highlight Box */}
        <View style={[styles.balanceBox, { backgroundColor: '#450a0a20', borderColor: '#ef444440' }]}>
          <View style={styles.balCol}>
            <Text style={[styles.balSub, { color: colors.textSecondary }]}>TOTAL BILLED</Text>
            <Text style={[styles.balSmall, { color: colors.text }]}>
              ₹{item.totalAmount.toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={styles.balCol}>
            <Text style={[styles.balSub, { color: colors.textSecondary }]}>ADVANCE PAID</Text>
            <Text style={[styles.balSmall, { color: '#10b981' }]}>
              ₹{item.advance.toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={styles.balCol}>
            <Text style={[styles.balSub, { color: '#ef4444' }]}>BALANCE DUE</Text>
            <Text style={[styles.balBig, { color: '#ef4444' }]}>
              ₹{item.balanceAmount.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* Footer Actions */}
        <View style={[styles.cardFooter, { borderTopColor: colors.cardBorder }]}>
          {/* Call Customer */}
          <TouchableOpacity
            style={[styles.callBtn, { backgroundColor: colors.chipBg }]}
            onPress={() => Linking.openURL(`tel:${item.contactNumber}`)}
            activeOpacity={0.7}>
            <Text style={{ fontSize: 13 }}>📞</Text>
            <Text style={[styles.callText, { color: colors.text }]}>
              {item.contactNumber}
            </Text>
          </TouchableOpacity>

          {/* WhatsApp Reminder Button */}
          <TouchableOpacity
            style={[styles.reminderBtn, { backgroundColor: '#16a34a' }]}
            onPress={() => handleSendReminder(item)}
            activeOpacity={0.8}>
            <Text style={styles.reminderIcon}>💬</Text>
            <Text style={styles.reminderText}>Send Reminder</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <YouTubeHeader
        title="Pending Collections"
        subtitle="Outstanding Balances"
        onNavigateTab={(tab) => navigation.navigate(tab)}
      />

      {/* Machine Filter Pills */}
      <View style={[styles.filterPillsRow, { backgroundColor: colors.card, borderBottomColor: colors.cardBorder }]}>
        <TouchableOpacity
          style={[styles.pillBtn, machineFilter === 'ALL' && { backgroundColor: colors.primary }]}
          onPress={() => setMachineFilter('ALL')}>
          <Text style={[styles.pillText, { color: machineFilter === 'ALL' ? '#ffffff' : colors.textSecondary }]}>
            All ({pendingBills.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pillBtn, machineFilter === 'KARTAR' && { backgroundColor: colors.primary }]}
          onPress={() => setMachineFilter('KARTAR')}>
          <Text style={[styles.pillText, { color: machineFilter === 'KARTAR' ? '#ffffff' : colors.textSecondary }]}>
            🌾 KARTAR
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pillBtn, machineFilter === 'CLASS' && { backgroundColor: colors.primary }]}
          onPress={() => setMachineFilter('CLASS')}>
          <Text style={[styles.pillText, { color: machineFilter === 'CLASS' ? '#ffffff' : colors.textSecondary }]}>
            🚜 CLASS
          </Text>
        </TouchableOpacity>
      </View>

      {/* Month Filter Bar */}
      <MonthFilterBar filterState={filterState} onChange={setFilterState} />

      {/* Search Input */}
      <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <Text style={{ fontSize: 14 }}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search pending by customer, village, phone..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={{ fontSize: 14, color: colors.textMuted }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Outstanding Metrics Banner */}
      <View style={[styles.metricBanner, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={styles.metricCol}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
            UNPAID ACCOUNTS
          </Text>
          <Text style={[styles.metricVal, { color: colors.text }]}>
            {filteredList.length}
          </Text>
        </View>

        <View style={[styles.metricDivider, { backgroundColor: colors.cardBorder }]} />

        <View style={styles.metricCol}>
          <Text style={[styles.metricLabel, { color: '#ef4444' }]}>
            TOTAL PENDING BALANCE
          </Text>
          <Text style={[styles.metricVal, { color: '#ef4444' }]}>
            ₹{totalPendingBalance.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      {/* List */}
      {loading && !refreshing ? (
        <View style={{ padding: 16, gap: 12 }}>
          <ShimmerBlock height={130} borderRadius={14} />
          <ShimmerBlock height={130} borderRadius={14} />
          <ShimmerBlock height={130} borderRadius={14} />
        </View>
      ) : (
        <FlatList
          data={filteredList}
          keyExtractor={(item) => String(item.id || item.dbId)}
          renderItem={renderPendingCard}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 60 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchPendingBills(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={{ fontSize: 40 }}>🎉</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No Pending Bills!
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                All customer bills for this period are fully settled.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterPillsRow: {
    flexDirection: 'row',
    padding: 10,
    gap: 8,
    borderBottomWidth: 1,
  },
  pillBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  metricBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 32,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  pendingCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  custName: {
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
  },
  machineBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  machineBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
  },
  balanceBox: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginVertical: 8,
  },
  balCol: {
    flex: 1,
    alignItems: 'center',
  },
  balSub: {
    fontSize: 9,
    fontWeight: '800',
  },
  balSmall: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  balBig: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  callText: {
    fontSize: 11,
    fontWeight: '700',
  },
  reminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  reminderIcon: {
    fontSize: 13,
    color: '#ffffff',
  },
  reminderText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
  },
});
