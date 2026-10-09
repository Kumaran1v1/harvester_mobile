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
import { Bill } from '../../types';

interface BillFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => Promise<void>;
  initialData?: Bill | null;
  machineType: 'CLASS' | 'KARTAR';
}

export const BillFormModal: React.FC<BillFormModalProps> = ({
  visible,
  onClose,
  onSubmit,
  initialData,
  machineType,
}) => {
  const { colors } = useTheme();

  const [date, setDate] = useState('');
  const [place, setPlace] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [timeHours, setTimeHours] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [advance, setAdvance] = useState('');
  const [balance, setBalance] = useState('0');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setDate(
        initialData.date
          ? new Date(initialData.date).toISOString().split('T')[0]
          : ''
      );
      setPlace(initialData.place || '');
      setCustomerName(initialData.customerName || '');
      setContactNumber(initialData.contactNumber || '');
      setTimeHours(String(initialData.timeHours || ''));
      setTotalAmount(String(initialData.totalAmount || ''));
      setAdvance(String(initialData.advance || ''));
      setBalance(String(initialData.balance || '0'));
      setRemarks(initialData.remarks || '');
    } else {
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
      setPlace('');
      setCustomerName('');
      setContactNumber('');
      setTimeHours('');
      setTotalAmount('');
      setAdvance('');
      setBalance('0');
      setRemarks('');
    }
  }, [initialData, visible]);

  // Real-time balance calculation
  useEffect(() => {
    const total = parseFloat(totalAmount) || 0;
    const adv = parseFloat(advance) || 0;
    const bal = Math.max(0, total - adv);
    setBalance(String(bal));
  }, [totalAmount, advance]);

  const handleSave = async () => {
    if (!customerName.trim()) {
      Alert.alert('Required', 'Please enter customer name');
      return;
    }
    if (!place.trim()) {
      Alert.alert('Required', 'Please enter village / place');
      return;
    }
    if (!contactNumber.trim() || contactNumber.length < 10) {
      Alert.alert('Required', 'Please enter a valid 10-digit mobile number');
      return;
    }
    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      Alert.alert('Required', 'Please enter total bill amount');
      return;
    }

    try {
      setSaving(true);
      await onSubmit({
        date: date || new Date().toISOString().split('T')[0],
        place: place.trim(),
        customerName: customerName.trim(),
        contactNumber: contactNumber.trim(),
        timeHours: parseFloat(timeHours) || 0,
        totalAmount: parseFloat(totalAmount) || 0,
        advance: parseFloat(advance) || 0,
        balance: parseFloat(balance) || 0,
        remarks: remarks.trim() || null,
      });
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save bill');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: colors.cardBorder }]}>
            <View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {initialData ? 'Edit Bill' : `Create New ${machineType} Bill`}
              </Text>
              <Text style={[styles.modalSub, { color: colors.primary }]}>
                {machineType} Harvester Machine
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={{ fontSize: 18, color: colors.textMuted }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Date & Place */}
            <View style={styles.inputRow}>
              <View style={styles.flexHalf}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>DATE (YYYY-MM-DD)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  value={date}
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.flexHalf}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>PLACE / VILLAGE *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  value={place}
                  onChangeText={setPlace}
                  placeholder="e.g. Madurai"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            {/* Customer Name & Mobile */}
            <View style={styles.inputRow}>
              <View style={styles.flexHalf}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>FARMER / CUSTOMER *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  value={customerName}
                  onChangeText={setCustomerName}
                  placeholder="Customer Name"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.flexHalf}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>CONTACT NUMBER *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  value={contactNumber}
                  onChangeText={setContactNumber}
                  keyboardType="phone-pad"
                  placeholder="10-digit mobile"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            {/* Time / Hours Worked & Total Amount */}
            <View style={styles.inputRow}>
              <View style={styles.flexHalf}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>WORK TIME (HOURS)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  value={timeHours}
                  onChangeText={setTimeHours}
                  keyboardType="numeric"
                  placeholder="e.g. 2.5"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.flexHalf}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>TOTAL AMOUNT (₹) *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  value={totalAmount}
                  onChangeText={setTotalAmount}
                  keyboardType="numeric"
                  placeholder="₹ Total"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            {/* Advance & Computed Balance */}
            <View style={styles.inputRow}>
              <View style={styles.flexHalf}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>ADVANCE RECEIVED (₹)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  value={advance}
                  onChangeText={setAdvance}
                  keyboardType="numeric"
                  placeholder="₹ 0"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.flexHalf}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>BALANCE DUE (₹)</Text>
                <View
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.chipBg,
                      borderColor: colors.cardBorder,
                      justifyContent: 'center',
                    },
                  ]}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '800',
                      color: parseFloat(balance) > 0 ? '#ef4444' : '#10b981',
                    }}>
                    ₹{parseFloat(balance).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Remarks */}
            <View style={{ marginTop: 6, marginBottom: 16 }}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>REMARKS / NOTES</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                    height: 64,
                    textAlignVertical: 'top',
                  },
                ]}
                value={remarks}
                onChangeText={setRemarks}
                multiline
                placeholder="Field location, acres cut, operator notes..."
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={[styles.actionsRow, { borderTopColor: colors.cardBorder }]}>
            <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.cardBorder }]} onPress={onClose}>
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              onPress={handleSave}
              disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.saveText}>{initialData ? 'Update Bill' : 'Save Bill'}</Text>
              )}
            </TouchableOpacity>
          </View>
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
    maxHeight: '90%',
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
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
  closeBtn: {
    padding: 6,
  },
  formScroll: {
    paddingTop: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  flexHalf: {
    flex: 1,
  },
  fieldLabel: {
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
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
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
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
