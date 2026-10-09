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
import { billsApi } from '../../api/billsApi';
import { Bill } from '../../types';
import { YouTubeHeader } from '../../components/YouTubeHeader';
import { MonthFilterBar, MonthFilterState } from '../../components/MonthFilterBar';
import { BillFormModal } from './BillFormModal';
import { BillPaymentsModal } from './BillPaymentsModal';
import { ShimmerBlock } from '../../components/YouTubeSkeleton';

export const BillsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  // Machine Tab: CLASS or KARTAR
  const [machineType, setMachineType] = useState<'CLASS' | 'KARTAR'>('KARTAR');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState<MonthFilterState>({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    isOverall: true,
  });

  const [bills, setBills] = useState<Bill[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [paymentsBill, setPaymentsBill] = useState<Bill | null>(null);

  const fetchBills = useCallback(
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

        const res = await billsApi.getBills(machineType, params);
        setBills(res.data);
        setTotalCount(res.total);
      } catch (err: any) {
        Alert.alert('Error', err?.message || 'Failed to load bills');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [machineType, searchQuery, filterState]
  );

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  // Aggregate Metrics
  const summary = useMemo(() => {
    let totalAmt = 0;
    let totalAdv = 0;
    let totalBal = 0;
    bills.forEach((b) => {
      totalAmt += Number(b.totalAmount || 0);
      totalAdv += Number(b.advance || 0);
      totalBal += Number(b.balance || 0);
    });
    return { totalAmt, totalAdv, totalBal };
  }, [bills]);

  const handleSaveBill = async (formData: any) => {
    if (editingBill) {
      await billsApi.updateBill(machineType, editingBill.id, formData);
    } else {
      await billsApi.createBill(machineType, formData);
    }
    fetchBills();
  };

  const handleDeleteBill = (bill: Bill) => {
    Alert.alert('Delete Bill', `Delete bill for "${bill.customerName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await billsApi.deleteBill(machineType, bill.id);
            fetchBills();
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to delete bill');
          }
        },
      },
    ]);
  };

  const handleShareWhatsApp = (bill: Bill) => {
    const company = user?.companyName || 'HARVESTER SERVICE';
    const text =
      `*${company} - BILL INVOICE*\n` +
      `---------------------------------\n` +
      `*Customer:* ${bill.customerName}\n` +
      `*Place:* ${bill.place}\n` +
      `*Date:* ${new Date(bill.date).toLocaleDateString('en-IN')}\n` +
      `*Hours Worked:* ${bill.timeHours} hrs\n` +
      `---------------------------------\n` +
      `*Total Amount:* ₹${bill.totalAmount.toLocaleString('en-IN')}\n` +
      `*Advance Paid:* ₹${bill.advance.toLocaleString('en-IN')}\n` +
      `*Balance Due:* ₹${bill.balance.toLocaleString('en-IN')}\n` +
      `---------------------------------\n` +
      `Thank you for your business!`;

    const phone = bill.contactNumber.replace(/[^0-9]/g, '');
    const cleanPhone = phone.length === 10 ? `91${phone}` : phone;
    const url = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) Linking.openURL(url);
        else Alert.alert('WhatsApp Unavailable', 'WhatsApp application is not installed');
      })
      .catch(() => Alert.alert('Error', 'Unable to launch WhatsApp'));
  };

  const renderBillCard = ({ item }: { item: Bill }) => {
    const isCompleted = item.balance <= 0 || item.status === 1;

    return (
      <View
        style={[
          styles.billCard,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
        ]}>
        {/* Top Header Row */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={[styles.custName, { color: colors.text }]} numberOfLines={1}>
                {item.customerName}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: isCompleted ? '#052e16' : '#450a0a' },
                ]}>
                <Text
                  style={[
                    styles.statusText,
                    { color: isCompleted ? '#22c55e' : '#ef4444' },
                  ]}>
                  {isCompleted ? 'COMPLETED' : 'PENDING'}
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

        {/* Financial Highlights */}
        <View style={[styles.billAmtRow, { backgroundColor: colors.chipBg }]}>
          <View style={styles.amtCol}>
            <Text style={[styles.amtLabel, { color: colors.textSecondary }]}>TOTAL</Text>
            <Text style={[styles.amtVal, { color: colors.text }]}>
              ₹{item.totalAmount.toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={styles.amtCol}>
            <Text style={[styles.amtLabel, { color: colors.textSecondary }]}>ADVANCE</Text>
            <Text style={[styles.amtVal, { color: '#10b981' }]}>
              ₹{item.advance.toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={styles.amtCol}>
            <Text style={[styles.amtLabel, { color: colors.textSecondary }]}>BALANCE</Text>
            <Text
              style={[
                styles.amtVal,
                { color: item.balance > 0 ? '#ef4444' : '#10b981' },
              ]}>
              ₹{item.balance.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* Remarks Note */}
        {item.remarks ? (
          <Text style={[styles.remarksNote, { color: colors.textMuted }]} numberOfLines={2}>
            📝 {item.remarks}
          </Text>
        ) : null}

        {/* Card Footer Actions */}
        <View style={[styles.cardFooter, { borderTopColor: colors.cardBorder }]}>
          {/* Quick Call */}
          <TouchableOpacity
            style={[styles.footerActionBtn, { backgroundColor: colors.chipBg }]}
            onPress={() => Linking.openURL(`tel:${item.contactNumber}`)}
            activeOpacity={0.7}>
            <Text style={styles.footerActionIcon}>📞</Text>
            <Text style={[styles.footerActionText, { color: colors.text }]}>
              {item.contactNumber}
            </Text>
          </TouchableOpacity>

          {/* Payments Modal */}
          <TouchableOpacity
            style={[styles.footerActionBtn, { backgroundColor: `${colors.primary}20` }]}
            onPress={() => setPaymentsBill(item)}
            activeOpacity={0.7}>
            <Text style={styles.footerActionIcon}>💳</Text>
            <Text style={[styles.footerActionText, { color: colors.primary }]}>Payment</Text>
          </TouchableOpacity>

          {/* WhatsApp Share */}
          <TouchableOpacity
            style={[styles.iconActionBtn, { backgroundColor: '#16a34a20' }]}
            onPress={() => handleShareWhatsApp(item)}
            activeOpacity={0.7}>
            <Text style={{ fontSize: 16 }}>💬</Text>
          </TouchableOpacity>

          {/* Edit */}
          <TouchableOpacity
            style={[styles.iconActionBtn, { backgroundColor: colors.chipBg }]}
            onPress={() => {
              setEditingBill(item);
              setIsFormOpen(true);
            }}
            activeOpacity={0.7}>
            <Text style={{ fontSize: 15 }}>✏️</Text>
          </TouchableOpacity>

          {/* Delete */}
          <TouchableOpacity
            style={[styles.iconActionBtn, { backgroundColor: '#ef444420' }]}
            onPress={() => handleDeleteBill(item)}
            activeOpacity={0.7}>
            <Text style={{ fontSize: 15 }}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* YouTube Top App Header */}
      <YouTubeHeader
        title="Bills Registry"
        subtitle={`${machineType} Harvester`}
        onNavigateTab={(tab) => navigation.navigate(tab)}
      />

      {/* Machine Tabs (CLASS vs KARTAR) */}
      <View style={[styles.tabBarRow, { backgroundColor: colors.card, borderBottomColor: colors.cardBorder }]}>
        <TouchableOpacity
          style={[
            styles.machineTab,
            machineType === 'KARTAR' && { borderBottomColor: colors.primary, borderBottomWidth: 3 },
          ]}
          onPress={() => setMachineType('KARTAR')}
          activeOpacity={0.8}>
          <Text
            style={[
              styles.machineTabText,
              { color: machineType === 'KARTAR' ? colors.primary : colors.textMuted },
            ]}>
            🌾 KARTAR HARVESTER
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.machineTab,
            machineType === 'CLASS' && { borderBottomColor: colors.primary, borderBottomWidth: 3 },
          ]}
          onPress={() => setMachineType('CLASS')}
          activeOpacity={0.8}>
          <Text
            style={[
              styles.machineTabText,
              { color: machineType === 'CLASS' ? colors.primary : colors.textMuted },
            ]}>
            🚜 CLASS HARVESTER
          </Text>
        </TouchableOpacity>
      </View>

      {/* Month Filter Bar */}
      <MonthFilterBar filterState={filterState} onChange={setFilterState} />

      {/* Search Bar */}
      <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <Text style={{ fontSize: 14 }}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search by customer, village, mobile..."
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

      {/* Aggregate Stats Banner */}
      <View style={[styles.summaryBanner, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={styles.sumCol}>
          <Text style={[styles.sumLabel, { color: colors.textSecondary }]}>TOTAL BILLS</Text>
          <Text style={[styles.sumVal, { color: colors.text }]}>{totalCount}</Text>
        </View>

        <View style={styles.sumCol}>
          <Text style={[styles.sumLabel, { color: colors.textSecondary }]}>REVENUE</Text>
          <Text style={[styles.sumVal, { color: '#10b981' }]}>
            ₹{summary.totalAmt.toLocaleString('en-IN')}
          </Text>
        </View>

        <View style={styles.sumCol}>
          <Text style={[styles.sumLabel, { color: colors.textSecondary }]}>COLLECTED</Text>
          <Text style={[styles.sumVal, { color: colors.primary }]}>
            ₹{summary.totalAdv.toLocaleString('en-IN')}
          </Text>
        </View>

        <View style={styles.sumCol}>
          <Text style={[styles.sumLabel, { color: colors.textSecondary }]}>OUTSTANDING</Text>
          <Text style={[styles.sumVal, { color: '#ef4444' }]}>
            ₹{summary.totalBal.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      {/* Bills FlatList */}
      {loading && !refreshing ? (
        <View style={{ padding: 16, gap: 12 }}>
          <ShimmerBlock height={140} borderRadius={14} />
          <ShimmerBlock height={140} borderRadius={14} />
          <ShimmerBlock height={140} borderRadius={14} />
        </View>
      ) : (
        <FlatList
          data={bills}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderBillCard}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 80 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchBills(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={{ fontSize: 40 }}>📄</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Bills Found</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Tap + button below to log a new {machineType} harvester bill.
              </Text>
            </View>
          }
        />
      )}

      {/* Floating Add Bill Button */}
      <TouchableOpacity
        style={[
          styles.fabBtn,
          {
            backgroundColor: colors.primary,
            bottom: Math.max(insets.bottom, 16) + 60,
          },
        ]}
        onPress={() => {
          setEditingBill(null);
          setIsFormOpen(true);
        }}
        activeOpacity={0.85}>
        <Text style={styles.fabIcon}>+ New Bill</Text>
      </TouchableOpacity>

      {/* Add / Edit Bill Form Modal */}
      <BillFormModal
        visible={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSaveBill}
        initialData={editingBill}
        machineType={machineType}
      />

      {/* Payment Installments Modal */}
      <BillPaymentsModal
        visible={!!paymentsBill}
        onClose={() => setPaymentsBill(null)}
        bill={paymentsBill}
        machineType={machineType}
        onPaymentsUpdated={fetchBills}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBarRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  machineTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  machineTabText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
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
  summaryBanner: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
  },
  sumCol: {
    flex: 1,
    alignItems: 'center',
  },
  sumLabel: {
    fontSize: 9,
    fontWeight: '800',
  },
  sumVal: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  billCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
  },
  statusText: {
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
  billAmtRow: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 8,
    marginVertical: 8,
  },
  amtCol: {
    flex: 1,
    alignItems: 'center',
  },
  amtLabel: {
    fontSize: 9,
    fontWeight: '800',
  },
  amtVal: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  remarksNote: {
    fontSize: 11,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  footerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  footerActionIcon: {
    fontSize: 13,
  },
  footerActionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  iconActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
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
  fabBtn: {
    position: 'absolute',
    right: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },
  fabIcon: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
