import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  RefreshControl,
  Modal,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { bunkApi } from '../../api/bunkApi';
import { FuelRecord, PurchaseItem, PaymentItem } from '../../types';
import { YouTubeHeader } from '../../components/YouTubeHeader';
import { ShimmerBlock } from '../../components/YouTubeSkeleton';

export const BunkDetailsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const [records, setRecords] = useState<FuelRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Add Purchase Modal
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchaseAmt, setPurchaseAmt] = useState('');
  const [purchaseTime, setPurchaseTime] = useState('');

  // Add Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmt, setPaymentAmt] = useState('');
  const [paymentTime, setPaymentTime] = useState('');
  const [paymentRemarks, setPaymentRemarks] = useState('');

  const [savingAction, setSavingAction] = useState(false);

  const fetchRecords = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await bunkApi.getRecords();
      setRecords(data);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to load fuel records');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Current day's record
  const activeRecord = useMemo(() => {
    return (
      records.find(
        (r) => new Date(r.date).toISOString().split('T')[0] === selectedDate
      ) || null
    );
  }, [records, selectedDate]);

  // Parsed itemized purchases
  const activePurchases: PurchaseItem[] = useMemo(() => {
    if (!activeRecord?.purchasesJson) return [];
    try {
      const parsed = JSON.parse(activeRecord.purchasesJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [activeRecord]);

  // Parsed itemized payments
  const activePayments: PaymentItem[] = useMemo(() => {
    if (!activeRecord?.paymentsJson) return [];
    try {
      const parsed = JSON.parse(activeRecord.paymentsJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [activeRecord]);

  // Date Navigator Shift
  const handleShiftDate = (direction: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + direction);
    const newStr = d.toISOString().split('T')[0];
    if (direction > 0 && newStr > todayStr) return;
    setSelectedDate(newStr);
  };

  const getCurrentTimeString = () => {
    return new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Add Itemized Purchase
  const handleAddPurchase = async () => {
    const amt = parseFloat(purchaseAmt);
    if (!amt || amt <= 0) {
      Alert.alert('Required', 'Please enter fuel purchase amount');
      return;
    }

    const newItem: PurchaseItem = {
      id: String(Date.now()),
      amount: amt,
      time: purchaseTime || getCurrentTimeString(),
    };

    const updatedPurchases = [...activePurchases, newItem];
    const totalFuel = updatedPurchases.reduce((s, p) => s + p.amount, 0);
    const totalPaid = activePayments.reduce((s, p) => s + p.amount, 0);
    const balance = Math.max(0, totalFuel - totalPaid);

    try {
      setSavingAction(true);
      await bunkApi.saveRecord({
        date: selectedDate,
        fuelAmount: totalFuel,
        paidAmount: totalPaid,
        balance,
        paymentStatus: balance <= 0 ? 'PAID' : 'PENDING',
        purchasesJson: JSON.stringify(updatedPurchases),
        paymentsJson: JSON.stringify(activePayments),
      });
      setIsPurchaseModalOpen(false);
      setPurchaseAmt('');
      fetchRecords();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save purchase');
    } finally {
      setSavingAction(false);
    }
  };

  // Add Itemized Payment
  const handleAddPayment = async () => {
    const amt = parseFloat(paymentAmt);
    if (!amt || amt <= 0) {
      Alert.alert('Required', 'Please enter payment amount');
      return;
    }

    const newItem: PaymentItem = {
      id: String(Date.now()),
      amount: amt,
      time: paymentTime || getCurrentTimeString(),
      remarks: paymentRemarks.trim() || undefined,
    };

    const updatedPayments = [...activePayments, newItem];
    const totalFuel = activePurchases.reduce((s, p) => s + p.amount, 0);
    const totalPaid = updatedPayments.reduce((s, p) => s + p.amount, 0);
    const balance = Math.max(0, totalFuel - totalPaid);

    try {
      setSavingAction(true);
      await bunkApi.saveRecord({
        date: selectedDate,
        fuelAmount: totalFuel,
        paidAmount: totalPaid,
        balance,
        paymentStatus: balance <= 0 ? 'PAID' : 'PENDING',
        purchasesJson: JSON.stringify(activePurchases),
        paymentsJson: JSON.stringify(updatedPayments),
      });
      setIsPaymentModalOpen(false);
      setPaymentAmt('');
      setPaymentRemarks('');
      fetchRecords();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to record payment');
    } finally {
      setSavingAction(false);
    }
  };

  // Delete Purchase Item
  const handleDeletePurchase = async (itemId: string) => {
    const updated = activePurchases.filter((p) => p.id !== itemId);
    const totalFuel = updated.reduce((s, p) => s + p.amount, 0);
    const totalPaid = activePayments.reduce((s, p) => s + p.amount, 0);
    const balance = Math.max(0, totalFuel - totalPaid);

    try {
      await bunkApi.saveRecord({
        date: selectedDate,
        fuelAmount: totalFuel,
        paidAmount: totalPaid,
        balance,
        paymentStatus: balance <= 0 ? 'PAID' : 'PENDING',
        purchasesJson: JSON.stringify(updated),
        paymentsJson: JSON.stringify(activePayments),
      });
      fetchRecords();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to remove purchase');
    }
  };

  // Delete Payment Item
  const handleDeletePayment = async (itemId: string) => {
    const updated = activePayments.filter((p) => p.id !== itemId);
    const totalFuel = activePurchases.reduce((s, p) => s + p.amount, 0);
    const totalPaid = updated.reduce((s, p) => s + p.amount, 0);
    const balance = Math.max(0, totalFuel - totalPaid);

    try {
      await bunkApi.saveRecord({
        date: selectedDate,
        fuelAmount: totalFuel,
        paidAmount: totalPaid,
        balance,
        paymentStatus: balance <= 0 ? 'PAID' : 'PENDING',
        purchasesJson: JSON.stringify(activePurchases),
        paymentsJson: JSON.stringify(updated),
      });
      fetchRecords();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to remove payment');
    }
  };

  const totalFuelVal = activeRecord?.fuelAmount || 0;
  const totalPaidVal = activeRecord?.paidAmount || 0;
  const balanceVal = activeRecord?.balance || 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <YouTubeHeader
        title="Bunk Fuel Tracker"
        subtitle="Diesel & Petrol Expenses"
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
            onRefresh={() => fetchRecords(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }>
        {/* Date Navigator Banner */}
        <View style={[styles.dateNavCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <TouchableOpacity
            style={[styles.arrowBtn, { backgroundColor: colors.chipBg }]}
            onPress={() => handleShiftDate(-1)}>
            <Text style={[styles.arrowText, { color: colors.primary }]}>‹</Text>
          </TouchableOpacity>

          <View style={{ alignItems: 'center' }}>
            <Text style={[styles.dateText, { color: colors.text }]}>
              {new Date(selectedDate).toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
            <Text style={[styles.dateSub, { color: colors.textSecondary }]}>
              {selectedDate === todayStr ? 'Today (Active Day)' : 'Historical Log'}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.arrowBtn,
              { backgroundColor: colors.chipBg },
              selectedDate >= todayStr && styles.disabledArrow,
            ]}
            onPress={() => handleShiftDate(1)}
            disabled={selectedDate >= todayStr}>
            <Text
              style={[
                styles.arrowText,
                { color: selectedDate >= todayStr ? colors.textMuted : colors.primary },
              ]}>
              ›
            </Text>
          </TouchableOpacity>
        </View>

        {/* Daily Summary Highlights */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.sumCol}>
            <Text style={[styles.sumLabel, { color: colors.textSecondary }]}>FUEL BOUGHT</Text>
            <Text style={[styles.sumVal, { color: colors.text }]}>
              ₹{totalFuelVal.toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={[styles.sumDivider, { backgroundColor: colors.cardBorder }]} />

          <View style={styles.sumCol}>
            <Text style={[styles.sumLabel, { color: colors.textSecondary }]}>PAID TO BUNK</Text>
            <Text style={[styles.sumVal, { color: '#10b981' }]}>
              ₹{totalPaidVal.toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={[styles.sumDivider, { backgroundColor: colors.cardBorder }]} />

          <View style={styles.sumCol}>
            <Text style={[styles.sumLabel, { color: colors.textSecondary }]}>BALANCE DUE</Text>
            <Text style={[styles.sumVal, { color: balanceVal > 0 ? '#ef4444' : '#10b981' }]}>
              ₹{balanceVal.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* Section 1: Itemized Fuel Purchases */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                ⛽ Fuel Purchases ({activePurchases.length})
              </Text>
              <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
                Diesel / Petrol loaded into harvesters
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.addItemBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                setPurchaseAmt('');
                setPurchaseTime(getCurrentTimeString());
                setIsPurchaseModalOpen(true);
              }}>
              <Text style={styles.addItemBtnText}>+ Fill Fuel</Text>
            </TouchableOpacity>
          </View>

          {activePurchases.length === 0 ? (
            <View style={styles.emptyItemsBox}>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                No fuel purchases logged for this date.
              </Text>
            </View>
          ) : (
            activePurchases.map((p) => (
              <View
                key={p.id}
                style={[styles.itemRow, { backgroundColor: colors.chipBg, borderColor: colors.cardBorder }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemAmt, { color: colors.text }]}>
                    ₹{p.amount.toLocaleString('en-IN')}
                  </Text>
                  <Text style={[styles.itemTime, { color: colors.textSecondary }]}>
                    ⏰ Filled at {p.time}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDeletePurchase(p.id)} style={{ padding: 6 }}>
                  <Text style={{ fontSize: 15 }}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Section 2: Payments Made to Bunk */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                💵 Bunk Payments ({activePayments.length})
              </Text>
              <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
                Cash / UPI settlements made to fuel station
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.addItemBtn, { backgroundColor: '#10b981' }]}
              onPress={() => {
                setPaymentAmt('');
                setPaymentTime(getCurrentTimeString());
                setPaymentRemarks('');
                setIsPaymentModalOpen(true);
              }}>
              <Text style={styles.addItemBtnText}>+ Pay Bunk</Text>
            </TouchableOpacity>
          </View>

          {activePayments.length === 0 ? (
            <View style={styles.emptyItemsBox}>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                No payments recorded to bunk on this date.
              </Text>
            </View>
          ) : (
            activePayments.map((p) => (
              <View
                key={p.id}
                style={[styles.itemRow, { backgroundColor: colors.chipBg, borderColor: colors.cardBorder }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemAmt, { color: '#10b981' }]}>
                    + ₹{p.amount.toLocaleString('en-IN')}
                  </Text>
                  <Text style={[styles.itemTime, { color: colors.textSecondary }]}>
                    ⏰ Paid at {p.time}
                    {p.remarks ? ` • ${p.remarks}` : ''}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDeletePayment(p.id)} style={{ padding: 6 }}>
                  <Text style={{ fontSize: 15 }}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Historical Bunk Entries Feed */}
        <Text style={[styles.historyHeading, { color: colors.textSecondary }]}>
          RECENT BUNK HISTORY
        </Text>

        {records.slice(0, 5).map((r) => (
          <TouchableOpacity
            key={r.id}
            style={[
              styles.histCard,
              {
                backgroundColor: colors.card,
                borderColor:
                  new Date(r.date).toISOString().split('T')[0] === selectedDate
                    ? colors.primary
                    : colors.cardBorder,
              },
            ]}
            onPress={() =>
              setSelectedDate(new Date(r.date).toISOString().split('T')[0])
            }>
            <View style={{ flex: 1 }}>
              <Text style={[styles.histDate, { color: colors.text }]}>
                📅 {new Date(r.date).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
              <Text style={[styles.histSub, { color: colors.textSecondary }]}>
                Bought: ₹{r.fuelAmount.toLocaleString('en-IN')} • Paid: ₹{r.paidAmount.toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text
                style={[
                  styles.histBal,
                  { color: r.balance > 0 ? '#ef4444' : '#10b981' },
                ]}>
                {r.balance > 0 ? `₹${r.balance} Due` : 'Settled'}
              </Text>
              <Text style={{ fontSize: 10, color: colors.primary, fontWeight: '700', marginTop: 2 }}>
                View Log ›
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* MODAL 1: Add Fuel Purchase */}
      <Modal visible={isPurchaseModalOpen} transparent animationType="slide" onRequestClose={() => setIsPurchaseModalOpen(false)}>
        <View style={styles.backdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Fuel Purchase</Text>
            <Text style={[styles.modalSub, { color: colors.primary }]}>{selectedDate}</Text>

            <View style={{ gap: 10, marginTop: 14 }}>
              <View>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>FUEL AMOUNT (₹) *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  value={purchaseAmt}
                  onChangeText={setPurchaseAmt}
                  keyboardType="numeric"
                  placeholder="₹ 0"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>TIME OF FILLING</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  value={purchaseTime}
                  onChangeText={setPurchaseTime}
                  placeholder="e.g. 09:30 AM"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.cardBorder }]}
                onPress={() => setIsPurchaseModalOpen(false)}>
                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleAddPurchase}
                disabled={savingAction}>
                {savingAction ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Purchase</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Add Bunk Payment */}
      <Modal visible={isPaymentModalOpen} transparent animationType="slide" onRequestClose={() => setIsPaymentModalOpen(false)}>
        <View style={styles.backdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Record Bunk Payment</Text>
            <Text style={[styles.modalSub, { color: colors.primary }]}>{selectedDate}</Text>

            <View style={{ gap: 10, marginTop: 14 }}>
              <View>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>PAYMENT AMOUNT (₹) *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  value={paymentAmt}
                  onChangeText={setPaymentAmt}
                  keyboardType="numeric"
                  placeholder="₹ 0"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>TIME</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  value={paymentTime}
                  onChangeText={setPaymentTime}
                  placeholder="e.g. 10:15 AM"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>NOTE / REMARKS</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  value={paymentRemarks}
                  onChangeText={setPaymentRemarks}
                  placeholder="e.g. Paid via PhonePe / Cash"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.cardBorder }]}
                onPress={() => setIsPaymentModalOpen(false)}>
                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: '#10b981' }]}
                onPress={handleAddPayment}
                disabled={savingAction}>
                {savingAction ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Payment</Text>
                )}
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
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  dateNavCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
  },
  arrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledArrow: {
    opacity: 0.35,
  },
  arrowText: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 24,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '800',
  },
  dateSub: {
    fontSize: 10,
    marginTop: 2,
  },
  summaryCard: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  sumCol: {
    flex: 1,
    alignItems: 'center',
  },
  sumDivider: {
    width: 1,
    height: 32,
  },
  sumLabel: {
    fontSize: 9,
    fontWeight: '800',
  },
  sumVal: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  sectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  sectionSub: {
    fontSize: 10,
    marginTop: 2,
  },
  addItemBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addItemBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  emptyItemsBox: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 6,
  },
  itemAmt: {
    fontSize: 13,
    fontWeight: '800',
  },
  itemTime: {
    fontSize: 11,
    marginTop: 2,
  },
  historyHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 8,
  },
  histCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 4,
  },
  histDate: {
    fontSize: 13,
    fontWeight: '700',
  },
  histSub: {
    fontSize: 11,
    marginTop: 2,
  },
  histBal: {
    fontSize: 13,
    fontWeight: '800',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalSub: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  input: {
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 13,
  },
  modalBtns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '700',
  },
  saveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
