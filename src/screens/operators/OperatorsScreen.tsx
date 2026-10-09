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
  Linking,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { operatorsApi } from '../../api/operatorsApi';
import { Operator, AttendanceLog, OperatorPaymentHistory } from '../../types';
import { YouTubeHeader } from '../../components/YouTubeHeader';
import { ShimmerBlock } from '../../components/YouTubeSkeleton';

export const OperatorsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();

  // Tab State: 0 = Attendance Matrix, 1 = Salary & Wages
  const [activeTab, setActiveTab] = useState<0 | 1>(0);

  // View Mode: 'WEEK' (7 Days) vs 'MONTH' (30 Days)
  const [viewMode, setViewMode] = useState<'WEEK' | 'MONTH'>('WEEK');

  const [operators, setOperators] = useState<Operator[]>([]);
  const [attendances, setAttendances] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 7-day rolling dates
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = last week

  // Add Operator Modal
  const [isAddOpOpen, setIsAddOpOpen] = useState(false);
  const [newOpName, setNewOpName] = useState('');
  const [newOpMobile, setNewOpMobile] = useState('');
  const [newOpSalary, setNewOpSalary] = useState('');
  const [submittingOp, setSubmittingOp] = useState(false);

  // Quick Attendance Mark Modal
  const [selectedCell, setSelectedCell] = useState<{
    operator: any;
    dateStr: string;
    existingAtt?: AttendanceLog;
  } | null>(null);
  const [dailyWageInput, setDailyWageInput] = useState('');
  const [savingAtt, setSavingAtt] = useState(false);

  // Salary Payment Modal
  const [payModalOp, setPayModalOp] = useState<Operator | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payRemarks, setPayRemarks] = useState('');
  const [submittingPay, setSubmittingPay] = useState(false);

  // Payment History Modal
  const [historyModalOp, setHistoryModalOp] = useState<Operator | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<OperatorPaymentHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Calculate 7-day dates
  const dateColumns = useMemo(() => {
    const dates: string[] = [];
    const count = viewMode === 'WEEK' ? 7 : 14;
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + weekOffset * 7);

    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }, [viewMode, weekOffset]);

  const startDateStr = dateColumns[0];
  const endDateStr = dateColumns[dateColumns.length - 1];

  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const [opsData, gridData] = await Promise.all([
          operatorsApi.getOperators(searchQuery.trim() || undefined),
          operatorsApi.getAttendanceGrid(startDateStr, endDateStr),
        ]);
        setOperators(opsData);
        setAttendances(gridData.attendances || []);
      } catch (err: any) {
        Alert.alert('Error', err?.message || 'Failed to load operators');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [searchQuery, startDateStr, endDateStr]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Create Operator
  const handleCreateOperator = async () => {
    if (!newOpName.trim()) {
      Alert.alert('Required', 'Please enter operator name');
      return;
    }
    if (!newOpMobile.trim() || newOpMobile.length < 10) {
      Alert.alert('Required', 'Please enter a valid 10-digit mobile number');
      return;
    }

    try {
      setSubmittingOp(true);
      await operatorsApi.createOperator({
        operatorName: newOpName.trim(),
        mobile: newOpMobile.trim(),
        salary: parseFloat(newOpSalary) || 0,
      });
      setNewOpName('');
      setNewOpMobile('');
      setNewOpSalary('');
      setIsAddOpOpen(false);
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to add operator');
    } finally {
      setSubmittingOp(false);
    }
  };

  // Handle Mark Attendance
  const handleMarkAttendance = async (status: 'PRESENT' | 'ABSENT' | 'UNMARKED') => {
    if (!selectedCell) return;
    try {
      setSavingAtt(true);
      await operatorsApi.saveAttendance({
        operatorId: selectedCell.operator.id,
        date: selectedCell.dateStr,
        status,
        dailyWage: status === 'PRESENT' ? parseFloat(dailyWageInput) || null : null,
      });
      setSelectedCell(null);
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update attendance');
    } finally {
      setSavingAtt(false);
    }
  };

  // Handle Add Salary Payment
  const handleAddPayment = async () => {
    if (!payModalOp) return;
    const amt = parseFloat(payAmount);
    if (!amt || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter payment amount');
      return;
    }

    try {
      setSubmittingPay(true);
      await operatorsApi.addPayment(payModalOp.id, {
        amount: amt,
        remarks: payRemarks.trim() || undefined,
      });
      setPayAmount('');
      setPayRemarks('');
      setPayModalOp(null);
      fetchData();
      Alert.alert('Success', 'Payment recorded successfully');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to record payment');
    } finally {
      setSubmittingPay(false);
    }
  };

  // Open Payment History
  const handleOpenHistory = async (op: Operator) => {
    setHistoryModalOp(op);
    try {
      setLoadingHistory(true);
      const data = await operatorsApi.getPaymentHistory(op.id);
      setPaymentHistory(data);
    } catch {
      setPaymentHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDeleteOperator = (op: Operator) => {
    Alert.alert('Delete Operator', `Remove "${op.operatorName}" and all attendance records?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await operatorsApi.deleteOperator(op.id);
            fetchData();
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to delete operator');
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <YouTubeHeader
        title="Operator Records"
        subtitle="Attendance & Wages"
        onNavigateTab={(tab) => navigation.navigate(tab)}
      />

      {/* Main Mode Tabs */}
      <View style={[styles.tabsRow, { backgroundColor: colors.card, borderBottomColor: colors.cardBorder }]}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 0 && { borderBottomColor: colors.primary, borderBottomWidth: 3 }]}
          onPress={() => setActiveTab(0)}>
          <Text style={[styles.tabBtnText, { color: activeTab === 0 ? colors.primary : colors.textMuted }]}>
            📅 ATTENDANCE MATRIX
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 1 && { borderBottomColor: colors.primary, borderBottomWidth: 3 }]}
          onPress={() => setActiveTab(1)}>
          <Text style={[styles.tabBtnText, { color: activeTab === 1 ? colors.primary : colors.textMuted }]}>
            💰 SALARY & WAGES
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search & Actions Header */}
      <View style={styles.controlsRow}>
        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={{ fontSize: 13 }}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search operator..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity
          style={[styles.addOpBtn, { backgroundColor: colors.primary }]}
          onPress={() => setIsAddOpOpen(true)}>
          <Text style={styles.addOpText}>+ Add Operator</Text>
        </TouchableOpacity>
      </View>

      {/* TAB 0: ATTENDANCE GRID */}
      {activeTab === 0 && (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchData(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 60 }}>
          {/* Week Nav Controller */}
          <View style={[styles.navBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <TouchableOpacity
              style={[styles.arrowBtn, { backgroundColor: colors.chipBg }]}
              onPress={() => setWeekOffset((prev) => prev - 1)}>
              <Text style={[styles.arrowText, { color: colors.primary }]}>‹</Text>
            </TouchableOpacity>

            <View style={{ alignItems: 'center' }}>
              <Text style={[styles.navDateText, { color: colors.text }]}>
                {new Date(startDateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} -{' '}
                {new Date(endDateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
              <Text style={[styles.navSub, { color: colors.textSecondary }]}>
                {weekOffset === 0 ? 'Current Week' : `${Math.abs(weekOffset)} week(s) ago`}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.arrowBtn, { backgroundColor: colors.chipBg }, weekOffset >= 0 && styles.disabledArrow]}
              onPress={() => setWeekOffset((prev) => prev + 1)}
              disabled={weekOffset >= 0}>
              <Text style={[styles.arrowText, { color: weekOffset >= 0 ? colors.textMuted : colors.primary }]}>
                ›
              </Text>
            </TouchableOpacity>
          </View>

          {/* Matrix Card */}
          <View style={[styles.matrixCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            {loading && !refreshing ? (
              <View style={{ padding: 20 }}>
                <ActivityIndicator color={colors.primary} size="large" />
              </View>
            ) : operators.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={{ fontSize: 36 }}>👥</Text>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No Operators Registered</Text>
                <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                  Tap + Add Operator above to register tractor & harvester drivers.
                </Text>
              </View>
            ) : (
              operators.map((op) => (
                <View key={op.id} style={[styles.opRow, { borderBottomColor: colors.cardBorder }]}>
                  {/* Operator Info */}
                  <View style={styles.opHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.opName, { color: colors.text }]}>{op.operatorName}</Text>
                      <TouchableOpacity onPress={() => Linking.openURL(`tel:${op.mobile}`)}>
                        <Text style={[styles.opPhone, { color: colors.primary }]}>📞 {op.mobile}</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.opBadgeRow}>
                      <View style={[styles.badgeP, { backgroundColor: '#052e16' }]}>
                        <Text style={{ color: '#22c55e', fontSize: 11, fontWeight: '800' }}>
                          P: {op.presentDays}
                        </Text>
                      </View>
                      <View style={[styles.badgeP, { backgroundColor: '#450a0a' }]}>
                        <Text style={{ color: '#ef4444', fontSize: 11, fontWeight: '800' }}>
                          A: {op.absentDays}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Day Cells Scroll */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cellsScroll}>
                    {dateColumns.map((dStr) => {
                      const dayAtt = attendances.find(
                        (a) =>
                          String(a.operatorId) === String(op.id) &&
                          new Date(a.date).toISOString().split('T')[0] === dStr
                      );
                      const isPres = dayAtt?.status === 'PRESENT';
                      const isAbs = dayAtt?.status === 'ABSENT';

                      const dateObj = new Date(dStr);
                      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'narrow' });
                      const dayNum = dateObj.getDate();

                      return (
                        <TouchableOpacity
                          key={dStr}
                          style={[
                            styles.cellBtn,
                            {
                              backgroundColor: isPres ? '#052e16' : isAbs ? '#450a0a' : colors.chipBg,
                              borderColor: isPres ? '#22c55e' : isAbs ? '#ef4444' : colors.cardBorder,
                            },
                          ]}
                          onPress={() => {
                            setSelectedCell({
                              operator: op,
                              dateStr: dStr,
                              existingAtt: dayAtt,
                            });
                            setDailyWageInput(dayAtt?.dailyWage ? String(dayAtt.dailyWage) : '');
                          }}
                          activeOpacity={0.7}>
                          <Text style={[styles.cellDayName, { color: colors.textMuted }]}>{dayName}</Text>
                          <Text style={[styles.cellDayNum, { color: colors.textSecondary }]}>{dayNum}</Text>
                          <Text
                            style={[
                              styles.cellStatus,
                              {
                                color: isPres ? '#22c55e' : isAbs ? '#ef4444' : colors.textMuted,
                              },
                            ]}>
                            {isPres ? 'P' : isAbs ? 'A' : '—'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      {/* TAB 1: SALARY & WAGES SUMMARY */}
      {activeTab === 1 && (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchData(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: Math.max(insets.bottom, 24) + 60 }}>
          {operators.map((op) => (
            <View
              key={op.id}
              style={[styles.salaryCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              {/* Operator info header */}
              <View style={styles.salaryHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.opName, { color: colors.text }]}>{op.operatorName}</Text>
                  <Text style={[styles.opPhone, { color: colors.textSecondary }]}>📱 {op.mobile}</Text>
                </View>
                <TouchableOpacity
                  style={styles.delOpBtn}
                  onPress={() => handleDeleteOperator(op)}>
                  <Text style={{ fontSize: 16 }}>🗑️</Text>
                </TouchableOpacity>
              </View>

              {/* Attendance & Salary Stats */}
              <View style={[styles.salaryStatsRow, { backgroundColor: colors.chipBg }]}>
                <View style={styles.salCol}>
                  <Text style={[styles.salLabel, { color: colors.textSecondary }]}>PRESENT DAYS</Text>
                  <Text style={[styles.salVal, { color: '#10b981' }]}>{op.presentDays} Days</Text>
                </View>

                <View style={styles.salCol}>
                  <Text style={[styles.salLabel, { color: colors.textSecondary }]}>ABSENT DAYS</Text>
                  <Text style={[styles.salVal, { color: '#ef4444' }]}>{op.absentDays} Days</Text>
                </View>

                <View style={styles.salCol}>
                  <Text style={[styles.salLabel, { color: colors.textSecondary }]}>SALARY PAID</Text>
                  <Text style={[styles.salVal, { color: colors.primary }]}>
                    ₹{(op.totalSalaryPaid || 0).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={[styles.salaryFooter, { borderTopColor: colors.cardBorder }]}>
                <TouchableOpacity
                  style={[styles.payAdvanceBtn, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    setPayModalOp(op);
                    setPayAmount('');
                    setPayRemarks('');
                  }}>
                  <Text style={styles.payBtnText}>+ Pay Advance / Salary</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.historyBtn, { backgroundColor: colors.chipBg }]}
                  onPress={() => handleOpenHistory(op)}>
                  <Text style={[styles.historyBtnText, { color: colors.text }]}>📜 History</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* MODAL 1: Add Operator */}
      <Modal visible={isAddOpOpen} transparent animationType="slide" onRequestClose={() => setIsAddOpOpen(false)}>
        <View style={styles.backdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Register New Operator</Text>
            <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
              Harvester Driver & Field Assistant
            </Text>

            <View style={{ gap: 10, marginTop: 14 }}>
              <View>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>FULL NAME *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  value={newOpName}
                  onChangeText={setNewOpName}
                  placeholder="e.g. Ramesh Kumar"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>MOBILE NUMBER *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  value={newOpMobile}
                  onChangeText={setNewOpMobile}
                  keyboardType="phone-pad"
                  placeholder="10-digit mobile"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>DAILY WAGE / BATA (₹)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  value={newOpSalary}
                  onChangeText={setNewOpSalary}
                  keyboardType="numeric"
                  placeholder="e.g. 500"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.cardBorder }]}
                onPress={() => setIsAddOpOpen(false)}>
                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleCreateOperator}
                disabled={submittingOp}>
                {submittingOp ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Register Operator</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Quick Mark Attendance */}
      <Modal visible={!!selectedCell} transparent animationType="fade" onRequestClose={() => setSelectedCell(null)}>
        <View style={styles.backdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Mark Attendance</Text>
            <Text style={[styles.modalSub, { color: colors.primary }]}>
              {selectedCell?.operator?.operatorName} • {selectedCell?.dateStr}
            </Text>

            <View style={{ marginTop: 12 }}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>DAILY BATA / WAGE FOR THIS DAY (₹)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                value={dailyWageInput}
                onChangeText={setDailyWageInput}
                keyboardType="numeric"
                placeholder="e.g. 500"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
              <TouchableOpacity
                style={[styles.markChoiceBtn, { backgroundColor: '#10b981' }]}
                onPress={() => handleMarkAttendance('PRESENT')}
                disabled={savingAtt}>
                <Text style={styles.markChoiceText}>✓ Present</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.markChoiceBtn, { backgroundColor: '#ef4444' }]}
                onPress={() => handleMarkAttendance('ABSENT')}
                disabled={savingAtt}>
                <Text style={styles.markChoiceText}>✕ Absent</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.markChoiceBtn, { backgroundColor: colors.chipBg }]}
                onPress={() => handleMarkAttendance('UNMARKED')}
                disabled={savingAtt}>
                <Text style={[styles.markChoiceText, { color: colors.textSecondary }]}>Clear</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.cancelBtn, { marginTop: 12, borderColor: colors.cardBorder, alignItems: 'center' }]}
              onPress={() => setSelectedCell(null)}>
              <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: Pay Salary Advance */}
      <Modal visible={!!payModalOp} transparent animationType="slide" onRequestClose={() => setPayModalOp(null)}>
        <View style={styles.backdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Pay Operator Advance</Text>
            <Text style={[styles.modalSub, { color: colors.primary }]}>
              {payModalOp?.operatorName}
            </Text>

            <View style={{ gap: 10, marginTop: 14 }}>
              <View>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>PAYMENT AMOUNT (₹) *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  value={payAmount}
                  onChangeText={setPayAmount}
                  keyboardType="numeric"
                  placeholder="₹ Amount"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>NOTES / REMARKS</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  value={payRemarks}
                  onChangeText={setPayRemarks}
                  placeholder="e.g. Festival advance / Bata"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.cardBorder }]}
                onPress={() => setPayModalOp(null)}>
                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleAddPayment}
                disabled={submittingPay}>
                {submittingPay ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Confirm Payment</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 4: Payment History */}
      <Modal visible={!!historyModalOp} transparent animationType="slide" onRequestClose={() => setHistoryModalOp(null)}>
        <View style={styles.backdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Payment Log History</Text>
            <Text style={[styles.modalSub, { color: colors.primary }]}>
              {historyModalOp?.operatorName}
            </Text>

            {loadingHistory ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 30 }} />
            ) : paymentHistory.length === 0 ? (
              <View style={{ padding: 30, alignItems: 'center' }}>
                <Text style={{ color: colors.textMuted }}>No payments recorded yet.</Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 250, marginTop: 12 }}>
                {paymentHistory.map((p) => (
                  <View
                    key={p.id}
                    style={[styles.historyRow, { backgroundColor: colors.chipBg, borderColor: colors.cardBorder }]}>
                    <View>
                      <Text style={{ color: '#10b981', fontWeight: '800', fontSize: 14 }}>
                        ₹{p.amount.toLocaleString('en-IN')}
                      </Text>
                      <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>
                        {new Date(p.paymentDate).toLocaleDateString('en-IN')}
                        {p.remarks ? ` • ${p.remarks}` : ''}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity
              style={[styles.cancelBtn, { marginTop: 14, borderColor: colors.cardBorder, alignItems: 'center' }]}
              onPress={() => setHistoryModalOp(null)}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>Close</Text>
            </TouchableOpacity>
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
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 40,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  addOpBtn: {
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addOpText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  navBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
  },
  arrowBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledArrow: {
    opacity: 0.3,
  },
  arrowText: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 24,
  },
  navDateText: {
    fontSize: 13,
    fontWeight: '800',
  },
  navSub: {
    fontSize: 10,
    marginTop: 2,
  },
  matrixCard: {
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  emptyBox: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
  },
  opRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  opHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  opName: {
    fontSize: 14,
    fontWeight: '800',
  },
  opPhone: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '700',
  },
  opBadgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  badgeP: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cellsScroll: {
    flexDirection: 'row',
  },
  cellBtn: {
    width: 44,
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  cellDayName: {
    fontSize: 9,
    fontWeight: '700',
  },
  cellDayNum: {
    fontSize: 11,
    fontWeight: '800',
    marginVertical: 1,
  },
  cellStatus: {
    fontSize: 13,
    fontWeight: '800',
  },
  salaryCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  salaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  delOpBtn: {
    padding: 4,
  },
  salaryStatsRow: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  salCol: {
    flex: 1,
    alignItems: 'center',
  },
  salLabel: {
    fontSize: 9,
    fontWeight: '800',
  },
  salVal: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  salaryFooter: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  payAdvanceBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  payBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  historyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  historyBtnText: {
    fontSize: 12,
    fontWeight: '700',
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
  markChoiceBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  markChoiceText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  historyRow: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 6,
  },
});
