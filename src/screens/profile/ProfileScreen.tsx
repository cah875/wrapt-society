// Profile management: edit active name, switch profiles, create (max 5),
// and delete with a data-loss confirmation.

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../../components/Screen';
import { useApp } from '../../context/AppContext';
import { MAX_PROFILES } from '../../utils/storageUtils';
import { colors } from '../../theme/colors';
import { fontFamily, cardStyle } from '../../theme/typography';

export default function ProfileScreen() {
  const {
    profiles,
    activeProfileId,
    activeProfile,
    switchProfile,
    renameProfile,
    createProfile,
    removeProfile,
    canAddProfile,
  } = useApp();

  const [nameDraft, setNameDraft] = useState(activeProfile?.name ?? '');
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  // Keep the draft in sync when the active profile changes.
  React.useEffect(() => {
    setNameDraft(activeProfile?.name ?? '');
    setEditing(false);
  }, [activeProfileId, activeProfile?.name]);

  const saveName = () => {
    if (activeProfileId && nameDraft.trim()) {
      renameProfile(activeProfileId, nameDraft.trim());
    }
    setEditing(false);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const created = await createProfile(newName.trim());
    if (!created) {
      Alert.alert('Limit reached', `You can have at most ${MAX_PROFILES} profiles.`);
    }
    setNewName('');
    setCreating(false);
  };

  const confirmDelete = (id: string, name: string) => {
    if (profiles.length <= 1) {
      Alert.alert('Cannot delete', 'You must keep at least one profile.');
      return;
    }
    Alert.alert(
      `Delete "${name}"?`,
      'All inventory data for this profile will be permanently lost. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => removeProfile(id) },
      ],
    );
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Profile</Text>

          {/* Active profile card */}
          <View style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(activeProfile?.name ?? '?').charAt(0).toUpperCase()}
              </Text>
            </View>

            {editing ? (
              <View style={styles.editRow}>
                <TextInput
                  value={nameDraft}
                  onChangeText={setNameDraft}
                  style={styles.nameInput}
                  autoFocus
                  placeholder="Your name"
                  placeholderTextColor={colors.textSecondary}
                />
                <Pressable style={styles.iconBtn} onPress={saveName}>
                  <MaterialCommunityIcons name="check" size={20} color={colors.background} />
                </Pressable>
              </View>
            ) : (
              <Pressable style={styles.nameRow} onPress={() => setEditing(true)}>
                <Text style={styles.activeName}>{activeProfile?.name ?? 'No profile'}</Text>
                <MaterialCommunityIcons
                  name="pencil-outline"
                  size={18}
                  color={colors.primaryAccent}
                />
              </Pressable>
            )}
            {activeProfile && (
              <Text style={styles.created}>
                Created {new Date(activeProfile.createdAt).toLocaleDateString()}
              </Text>
            )}
          </View>

          {/* Switch profiles */}
          <Text style={styles.sectionTitle}>
            Profiles ({profiles.length}/{MAX_PROFILES})
          </Text>
          {profiles.map((p) => {
            const active = p.id === activeProfileId;
            return (
              <View key={p.id} style={[styles.profileRow, active && styles.profileRowActive]}>
                <Pressable
                  style={styles.profileMain}
                  onPress={() => switchProfile(p.id)}
                >
                  <MaterialCommunityIcons
                    name={active ? 'check-circle' : 'circle-outline'}
                    size={22}
                    color={active ? colors.primaryAccent : colors.textSecondary}
                  />
                  <Text style={styles.profileName}>{p.name}</Text>
                </Pressable>
                <Pressable onPress={() => confirmDelete(p.id, p.name)} hitSlop={8}>
                  <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={20}
                    color={colors.danger}
                  />
                </Pressable>
              </View>
            );
          })}

          {/* Create profile */}
          {creating ? (
            <View style={styles.card}>
              <Text style={styles.label}>New profile name</Text>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                style={styles.input}
                placeholder="Enter a name"
                placeholderTextColor={colors.textSecondary}
                autoFocus
              />
              <View style={styles.createActions}>
                <Pressable style={styles.createBtn} onPress={handleCreate}>
                  <Text style={styles.createText}>Create</Text>
                </Pressable>
                <Pressable style={styles.cancelBtn} onPress={() => setCreating(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              style={[styles.addProfile, !canAddProfile && styles.disabled]}
              onPress={() => canAddProfile && setCreating(true)}
              disabled={!canAddProfile}
            >
              <MaterialCommunityIcons
                name="account-plus-outline"
                size={20}
                color={colors.primaryAccent}
              />
              <Text style={styles.addProfileText}>
                {canAddProfile ? 'Add Profile' : `Maximum ${MAX_PROFILES} profiles`}
              </Text>
            </Pressable>
          )}

          <View style={styles.footer}>
            <MaterialCommunityIcons
              name="shield-lock-outline"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={styles.footerText}>
              All data is stored locally on this device. No account, no cloud
              sync. Research use only.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40 },
  title: { fontFamily: fontFamily.bold, fontSize: 30, color: colors.textPrimary, marginBottom: 18 },
  card: { ...cardStyle, alignItems: 'center', marginBottom: 22 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryAccentDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { fontFamily: fontFamily.bold, fontSize: 30, color: colors.primaryAccent },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  activeName: { fontFamily: fontFamily.bold, fontSize: 22, color: colors.textPrimary },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%' },
  nameInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontFamily: fontFamily.semiBold,
    fontSize: 18,
    color: colors.textPrimary,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primaryAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  created: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.textSecondary, marginTop: 8 },
  sectionTitle: { fontFamily: fontFamily.bold, fontSize: 16, color: colors.textPrimary, marginBottom: 12 },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardSurface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileRowActive: { borderColor: colors.primaryAccent },
  profileMain: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  profileName: { fontFamily: fontFamily.medium, fontSize: 16, color: colors.textPrimary },
  label: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.textSecondary, marginBottom: 7, alignSelf: 'flex-start' },
  input: {
    width: '100%',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontFamily: fontFamily.medium,
    fontSize: 16,
    color: colors.textPrimary,
  },
  createActions: { flexDirection: 'row', gap: 12, marginTop: 14, width: '100%' },
  createBtn: {
    flex: 1,
    backgroundColor: colors.primaryAccent,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  createText: { fontFamily: fontFamily.bold, fontSize: 15, color: colors.background },
  cancelBtn: { paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center' },
  cancelText: { fontFamily: fontFamily.medium, fontSize: 15, color: colors.textSecondary },
  addProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primaryAccentDim,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 4,
  },
  disabled: { opacity: 0.5 },
  addProfileText: { fontFamily: fontFamily.semiBold, fontSize: 15, color: colors.primaryAccent },
  footer: { flexDirection: 'row', gap: 8, marginTop: 28, paddingHorizontal: 4 },
  footerText: { flex: 1, fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 18, color: colors.textSecondary },
});
