import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { billsApi } from '../../api/billsApi';
import { Bill, BillPayment } from '../../types';

interface BillPaymentsModalProps {
  visible: boolean;
  onClose: () => void;
  bill: Bill | null;
  machineType: 'CLASS' | 'KARTAR';
  onPaymentsUpdated: () => void;
}

export const BillPaymentsModal: React.FC<BillPaymentsModalProps> = ({
  visible,
  onClose,
  bill,
  machineType,
  onPaymentsUpdated,
}) => {
  const { colors } = useTheme();

  const [payments, setPayments] = useState<BillPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');

  const fetchPayments = async () => {
    if (!bill) return;
    try {
      setLoading(true);
      const data = await billsApi.getPayments(machineType, bill.id);
      setPayments(data);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to load payments history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && bill) {
      setAmount('');
      setRemarks('');
      fetchPayments();
    }
  }, [visible, bill]);

  if (!bill) return null;

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const currentBalance = Math.max(0, bill.totalAmount - totalPaid);

  const handleAddPayment = async () => {
    const payAmt = parseFloat(amount);
    if (!payAmt || payAmt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payment amount');
      return;
    }

    try {
      setSubmitting(true);
      await billsApi.addPayment(machineType, bill.id, {
        amount: payAmt,
        remarks: remarks.trim() || undefined,
      });
      setAmount('');
      setRemarks('');
      await fetchPayments();
      onPaymentsUpdated();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePayment = (paymentId: number) => {
    Alert.alert('Confirm Delete', 'Delete this payment record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await billsApi.deletePayment(machineType, paymentId);
            await fetchPayments();
            onPaymentsUpdated();
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to delete payment');
          }
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: colors.cardBorder }]}>
            <View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Payment History</Text>
              <Text style={[styles.modalSub, { color: colors.primary }]}>
                {bill.customerName} • {bill.place}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={{ fontSize: 18, color: colors.textMuted }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Balance Tracker Summary */}
          <View style={[styles.summaryBox, { backgroundColor: colors.chipBg }]}>
            <View style={styles.sumCol}>
              <Text style={[styles.sumLabel, { color: colors.textSecondary }]}>TOTAL BILL</Text>
              <Text style={[styles.sumVal, { color: colors.text }]}>
                ₹{bill.totalAmount.toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={styles.sumCol}>
              <Text style={[styles.sumLabel, { color: colors.textSecondary }]}>PAID SO FAR</Text>
              <Text style={[styles.sumVal, { color: '#10b981' }]}>
                ₹{totalPaid.toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={styles.sumCol}>
              <Text style={[styles.sumLabel, { color: colors.textSecondary }]}>BALANCE DUE</Text>
              <Text style={[styles.sumVal, { color: currentBalance > 0 ? '#ef4444' : '#10b981' }]}>
                ₹{currentBalance.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          {/* Add Payment Form */}
          <View style={[styles.addPaySection, { borderColor: colors.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Record New Payment</Text>
            <View style={styles.payInputRow}>
              <TextInput
                style={[
                  styles.inputAmt,
                  { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text },
                ]}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="₹ Amount"
                placeholderTextColor={colors.textMuted}
              />
              <TextInput
                style={[
                  styles.inputRemark,
                  { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text },
                ]}
                value={remarks}
                onChangeText={setRemarks}
                placeholder="Note / GPay / Cash"
                placeholderTextColor={colors.textMuted}
              />
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: colors.primary }]}
                onPress={handleAddPayment}
                disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.addBtnText}>+ Add</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Payments Log */}
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 12 }]}>
            Installment Logs ({payments.length})
          </Text>

          {loading ? (
            <ActivityIndicator style={{ marginVertical: 20 }} color={colors.primary} />
          ) : payments.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No payments recorded yet.
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
              {payments.map((p) => (
                <View
                  key={p.id}
                  style={[
                    styles.paymentItem,
                    { backgroundColor: colors.chipBg, borderColor: colors.cardBorder },
                  ]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.payAmount, { color: '#10b981' }]}>
                      + ₹{p.amount.toLocaleString('en-IN')}
                    </Text>
                    <Text style={[styles.payDate, { color: colors.textMuted }]}>
                      {new Date(p.paymentDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                      {p.remarks ? ` • ${p.remarks}` : ''}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.delBtn}
                    onPress={() => handleDeletePayment(p.id)}>
                    <Text style={{ fontSize: 16 }}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: colors.chipBg }]}
            onPress={onClose}>
            <Text style={[styles.doneText, { color: colors.text }]}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    borderRadius: 16,
    borderWidth: 1,
    maxHeight: '85%',
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalSub: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  summaryBox: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
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
  addPaySection: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  payInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inputAmt: {
    width: 90,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    fontSize: 13,
    fontWeight: '700',
  },
  inputRemark: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    fontSize: 12,
  },
  addBtn: {
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  historyList: {
    maxHeight: 180,
    marginTop: 6,
  },
  emptyBox: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
  },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 6,
  },
  payAmount: {
    fontSize: 13,
    fontWeight: '800',
  },
  payDate: {
    fontSize: 11,
    marginTop: 2,
  },
  delBtn: {
    padding: 6,
  },
  doneBtn: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
