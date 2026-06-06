// Searchable peptide selector with a manual-entry fallback. Opens a modal
// list filtered by name/alias; selecting sets a peptideId, or the user can
// type a custom name (peptideId = null).

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  FlatList,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { peptideDatabase } from '../data/peptideDatabase';
import { colors } from '../theme/colors';
import { fontFamily } from '../theme/typography';

interface Props {
  label?: string;
  peptideId: string | null;
  peptideName: string;
  onChange: (peptideId: string | null, name: string) => void;
  allowManual?: boolean;
}

export default function PeptidePicker({
  label = 'Peptide',
  peptideId,
  peptideName,
  onChange,
  allowManual = true,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [manual, setManual] = useState(false);
  const [manualName, setManualName] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return peptideDatabase;
    return peptideDatabase.filter((p) =>
      [p.name, ...p.aliases].join(' ').toLowerCase().includes(q),
    );
  }, [query]);

  const confirmManual = () => {
    const name = manualName.trim();
    if (!name) return;
    onChange(null, name);
    setOpen(false);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.field} onPress={() => setOpen(true)}>
        <MaterialCommunityIcons
          name="flask-outline"
          size={18}
          color={colors.primaryAccent}
        />
        <Text style={[styles.fieldText, !peptideName && styles.placeholder]}>
          {peptideName || 'Select a peptide…'}
        </Text>
        <MaterialCommunityIcons
          name="chevron-down"
          size={20}
          color={colors.textSecondary}
        />
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <View style={styles.handleBar} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Peptide</Text>
              <Pressable onPress={() => setOpen(false)}>
                <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>

            {allowManual && (
              <View style={styles.toggleRow}>
                <Pressable
                  onPress={() => setManual(false)}
                  style={[styles.toggleBtn, !manual && styles.toggleActive]}
                >
                  <Text style={[styles.toggleText, !manual && styles.toggleTextActive]}>
                    From database
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setManual(true)}
                  style={[styles.toggleBtn, manual && styles.toggleActive]}
                >
                  <Text style={[styles.toggleText, manual && styles.toggleTextActive]}>
                    Manual entry
                  </Text>
                </Pressable>
              </View>
            )}

            {manual ? (
              <View style={styles.manualBox}>
                <Text style={styles.label}>Peptide name</Text>
                <TextInput
                  value={manualName}
                  onChangeText={setManualName}
                  placeholder="Enter custom name"
                  placeholderTextColor={colors.textSecondary}
                  style={styles.input}
                  autoFocus
                />
                <Pressable style={styles.confirmBtn} onPress={confirmManual}>
                  <Text style={styles.confirmText}>Use this name</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <View style={styles.searchBar}>
                  <MaterialCommunityIcons name="magnify" size={18} color={colors.textSecondary} />
                  <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search…"
                    placeholderTextColor={colors.textSecondary}
                    style={styles.searchInput}
                  />
                </View>
                <FlatList
                  data={results}
                  keyExtractor={(p) => p.id}
                  keyboardShouldPersistTaps="handled"
                  style={{ maxHeight: 360 }}
                  renderItem={({ item }) => {
                    const selected = item.id === peptideId;
                    return (
                      <Pressable
                        style={styles.row}
                        onPress={() => {
                          onChange(item.id, item.name);
                          setOpen(false);
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.rowName}>{item.name}</Text>
                          {item.aliases.length > 0 && (
                            <Text style={styles.rowAlias} numberOfLines={1}>
                              {item.aliases.slice(0, 3).join(', ')}
                            </Text>
                          )}
                        </View>
                        {selected && (
                          <MaterialCommunityIcons
                            name="check-circle"
                            size={20}
                            color={colors.primaryAccent}
                          />
                        )}
                      </Pressable>
                    );
                  }}
                  ListEmptyComponent={
                    <Text style={styles.noResults}>No matches.</Text>
                  }
                />
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 7,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  fieldText: { flex: 1, fontFamily: fontFamily.medium, fontSize: 15, color: colors.textPrimary },
  placeholder: { color: colors.textSecondary },
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.cardSurface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    maxHeight: '85%',
  },
  handleBar: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginBottom: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: { fontFamily: fontFamily.bold, fontSize: 18, color: colors.textPrimary },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 4,
    marginBottom: 14,
  },
  toggleBtn: { flex: 1, paddingVertical: 9, borderRadius: 7, alignItems: 'center' },
  toggleActive: { backgroundColor: colors.primaryAccent },
  toggleText: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.textSecondary },
  toggleTextActive: { color: colors.background },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  searchInput: { flex: 1, fontFamily: fontFamily.regular, fontSize: 15, color: colors.textPrimary, padding: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowName: { fontFamily: fontFamily.semiBold, fontSize: 15, color: colors.textPrimary },
  rowAlias: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  noResults: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 24,
  },
  manualBox: { paddingTop: 4 },
  input: {
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
  confirmBtn: {
    backgroundColor: colors.primaryAccent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  confirmText: { fontFamily: fontFamily.bold, fontSize: 15, color: colors.background },
});
