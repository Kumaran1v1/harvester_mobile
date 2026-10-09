import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/authApi';
import { UserProfile, OwnerDocument } from '../../types';
import { YouTubeHeader } from '../../components/YouTubeHeader';

export const ProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, logout, updateUserProfile } = useAuth();

  const [profile, setProfile] = useState<UserProfile>(
    user || {
      name: '',
      email: '',
      mobile: '',
    }
  );

  const [documents, setDocuments] = useState<OwnerDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Edit Profile Modal
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editForm, setEditForm] = useState<UserProfile>(profile);
  const [savingProfile, setSavingProfile] = useState(false);

  // Upload Document Modal
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState('PERSONAL');
  const [docUrl, setDocUrl] = useState('');
  const [savingDoc, setSavingDoc] = useState(false);

  const fetchProfileAndDocs = useCallback(async () => {
    try {
      const p = await authApi.getProfile();
      setProfile(p);
      setEditForm(p);
    } catch {}

    try {
      setLoadingDocs(true);
      const docs = await authApi.getDocuments();
      setDocuments(docs || []);
    } catch {
      setDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    fetchProfileAndDocs();
  }, [fetchProfileAndDocs]);

  const handleSaveProfile = async () => {
    if (!editForm.name.trim()) {
      Alert.alert('Required', 'Please enter your name');
      return;
    }
    try {
      setSavingProfile(true);
      await updateUserProfile(editForm);
      setProfile(editForm);
      setIsEditProfileOpen(false);
      Alert.alert('Success', 'Profile details updated successfully');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddDocument = async () => {
    if (!docTitle.trim()) {
      Alert.alert('Required', 'Please enter document title');
      return;
    }
    try {
      setSavingDoc(true);
      await authApi.uploadDocument({
        title: docTitle.trim(),
        category: docCategory,
        fileUrl: docUrl.trim() || 'https://placeholder.file',
        fileName: `${docTitle.trim().toLowerCase().replace(/\s+/g, '_')}.pdf`,
        fileType: 'pdf',
      });
      setDocTitle('');
      setDocUrl('');
      setIsDocModalOpen(false);
      fetchProfileAndDocs();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to upload document');
    } finally {
      setSavingDoc(false);
    }
  };

  const handleDeleteDocument = (docId: number) => {
    Alert.alert('Delete Document', 'Are you sure you want to remove this document?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await authApi.deleteDocument(docId);
            fetchProfileAndDocs();
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to delete document');
          }
        },
      },
    ]);
  };

  const initials = (profile.name || 'Owner')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <YouTubeHeader
        title="Personal Details"
        subtitle="Owner Profile & Specs"
        onNavigateTab={(tab) => navigation.navigate(tab)}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 60 },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Profile Card Header */}
        <View style={[styles.profileHero, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <Text style={[styles.ownerName, { color: colors.text }]}>{profile.name || 'Owner'}</Text>
          <Text style={[styles.companyText, { color: colors.primary }]}>
            {profile.companyName || 'Harvester Fleet Operations'}
          </Text>

          <View style={[styles.roleBadge, { backgroundColor: colors.chipBg }]}>
            <Text style={[styles.roleText, { color: colors.textSecondary }]}>
              ENTERPRISE OWNER PORTAL
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.editBtn, { backgroundColor: colors.chipBg }]}
            onPress={() => {
              setEditForm(profile);
              setIsEditProfileOpen(true);
            }}>
            <Text style={[styles.editBtnText, { color: colors.primary }]}>✏️ Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Section 1: Contact & Personal Details */}
        <View style={[styles.detailsCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>👤 Personal Details</Text>

          <View style={styles.detailRow}>
            <Text style={[styles.detailKey, { color: colors.textSecondary }]}>Primary Mobile</Text>
            <Text style={[styles.detailVal, { color: colors.text }]}>{profile.mobile || 'Not set'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailKey, { color: colors.textSecondary }]}>Secondary Mobile</Text>
            <Text style={[styles.detailVal, { color: colors.text }]}>
              {profile.secondaryMobile || '—'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailKey, { color: colors.textSecondary }]}>Email Address</Text>
            <Text style={[styles.detailVal, { color: colors.text }]}>{profile.email || '—'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailKey, { color: colors.textSecondary }]}>Education</Text>
            <Text style={[styles.detailVal, { color: colors.text }]}>{profile.education || '—'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailKey, { color: colors.textSecondary }]}>City / District</Text>
            <Text style={[styles.detailVal, { color: colors.text }]}>{profile.city || '—'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailKey, { color: colors.textSecondary }]}>Address</Text>
            <Text style={[styles.detailVal, { color: colors.text }]}>{profile.address || '—'}</Text>
          </View>
        </View>

        {/* Section 2: Machine & Business Specs */}
        <View style={[styles.detailsCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>🚜 Machine & Fleet Specs</Text>

          <View style={styles.detailRow}>
            <Text style={[styles.detailKey, { color: colors.textSecondary }]}>Machine Name</Text>
            <Text style={[styles.detailVal, { color: colors.primary, fontWeight: '800' }]}>
              {profile.machineName || 'Harvester'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailKey, { color: colors.textSecondary }]}>Machine Model</Text>
            <Text style={[styles.detailVal, { color: colors.text }]}>
              {profile.machineModel || '—'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailKey, { color: colors.textSecondary }]}>Registration Number</Text>
            <Text style={[styles.detailVal, { color: colors.text, fontWeight: '800' }]}>
              {profile.registrationNo || '—'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailKey, { color: colors.textSecondary }]}>GSTIN / Tax ID</Text>
            <Text style={[styles.detailVal, { color: colors.text }]}>{profile.gstin || '—'}</Text>
          </View>
        </View>

        {/* Section 3: Owner Document Drive */}
        <View style={[styles.detailsCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              📁 Document Drive ({documents.length})
            </Text>
            <TouchableOpacity
              style={[styles.addDocBtn, { backgroundColor: colors.primary }]}
              onPress={() => setIsDocModalOpen(true)}>
              <Text style={styles.addDocBtnText}>+ Add Document</Text>
            </TouchableOpacity>
          </View>

          {loadingDocs ? (
            <ActivityIndicator style={{ marginVertical: 14 }} color={colors.primary} />
          ) : documents.length === 0 ? (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                No documents uploaded yet (e.g. RC Book, Insurance, Permits).
              </Text>
            </View>
          ) : (
            documents.map((d) => (
              <View
                key={d.id}
                style={[styles.docItem, { backgroundColor: colors.chipBg, borderColor: colors.cardBorder }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.docTitle, { color: colors.text }]}>📄 {d.title}</Text>
                  <Text style={[styles.docCat, { color: colors.primary }]}>
                    {d.category} • {new Date(d.createdAt).toLocaleDateString('en-IN')}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteDocument(d.id)} style={{ padding: 6 }}>
                  <Text style={{ fontSize: 15 }}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Preferences & Sign Out */}
        <View style={[styles.detailsCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>⚙️ App Preferences</Text>

          <TouchableOpacity style={styles.settingRow} onPress={toggleTheme}>
            <Text style={[styles.settingText, { color: colors.text }]}>
              {isDark ? '☀️ Switch to Light Mode' : '🌙 Switch to Dark Mode'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingRow, { borderTopWidth: 1, borderTopColor: colors.cardBorder }]}
            onPress={logout}>
            <Text style={[styles.settingText, { color: '#ef4444', fontWeight: '800' }]}>
              🚪 Sign Out of Portal
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* MODAL 1: Edit Profile */}
      <Modal visible={isEditProfileOpen} transparent animationType="slide" onRequestClose={() => setIsEditProfileOpen(false)}>
        <View style={styles.backdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Personal Details</Text>
            <ScrollView style={{ maxHeight: 380, marginTop: 12 }} showsVerticalScrollIndicator={false}>
              <View style={styles.modalInputGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>NAME *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  value={editForm.name}
                  onChangeText={(v) => setEditForm({ ...editForm, name: v })}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>COMPANY NAME</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  value={editForm.companyName}
                  onChangeText={(v) => setEditForm({ ...editForm, companyName: v })}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>PRIMARY MOBILE *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  value={editForm.mobile}
                  onChangeText={(v) => setEditForm({ ...editForm, mobile: v })}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>SECONDARY MOBILE</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  value={editForm.secondaryMobile}
                  onChangeText={(v) => setEditForm({ ...editForm, secondaryMobile: v })}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>EMAIL</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  value={editForm.email}
                  onChangeText={(v) => setEditForm({ ...editForm, email: v })}
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>HARVESTER MACHINE NAME</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  value={editForm.machineName}
                  onChangeText={(v) => setEditForm({ ...editForm, machineName: v })}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>MACHINE MODEL</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  value={editForm.machineModel}
                  onChangeText={(v) => setEditForm({ ...editForm, machineModel: v })}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>REGISTRATION NO</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  value={editForm.registrationNo}
                  onChangeText={(v) => setEditForm({ ...editForm, registrationNo: v })}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>CITY</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  value={editForm.city}
                  onChangeText={(v) => setEditForm({ ...editForm, city: v })}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>ADDRESS</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  value={editForm.address}
                  onChangeText={(v) => setEditForm({ ...editForm, address: v })}
                />
              </View>
            </ScrollView>

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.cardBorder }]}
                onPress={() => setIsEditProfileOpen(false)}>
                <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleSaveProfile}
                disabled={savingProfile}>
                {savingProfile ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Add Document */}
      <Modal visible={isDocModalOpen} transparent animationType="slide" onRequestClose={() => setIsDocModalOpen(false)}>
        <View style={styles.backdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Document to Drive</Text>

            <View style={{ gap: 10, marginTop: 14 }}>
              <View>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>DOCUMENT TITLE *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  value={docTitle}
                  onChangeText={setDocTitle}
                  placeholder="e.g. RC Book 2026, Machine Insurance"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>CATEGORY</Text>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                  {['PERSONAL', 'MACHINE', 'RC', 'INSURANCE'].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.catPill,
                        {
                          backgroundColor: docCategory === cat ? colors.primary : colors.chipBg,
                        },
                      ]}
                      onPress={() => setDocCategory(cat)}>
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '800',
                          color: docCategory === cat ? '#ffffff' : colors.textSecondary,
                        }}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>FILE URL / REFERENCE</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  value={docUrl}
                  onChangeText={setDocUrl}
                  placeholder="https://... or doc note"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.cardBorder }]}
                onPress={() => setIsDocModalOpen(false)}>
                <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleAddDocument}
                disabled={savingDoc}>
                {savingDoc ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Document</Text>
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
    gap: 14,
  },
  profileHero: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
  },
  ownerName: {
    fontSize: 18,
    fontWeight: '800',
  },
  companyText: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 8,
  },
  roleText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  editBtn: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  detailsCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailKey: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  addDocBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  addDocBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  docTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  docCat: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  settingRow: {
    paddingVertical: 12,
  },
  settingText: {
    fontSize: 13,
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
  modalInputGroup: {
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  input: {
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 13,
  },
  catPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modalBtns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
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
