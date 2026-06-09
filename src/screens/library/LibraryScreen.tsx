// Library: searchable, category-filterable list of all peptides.

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../../components/Screen';
import PeptideCard from '../../components/PeptideCard';
import { peptideDatabase, PeptideEntry } from '../../data/peptideDatabase';
import { LibraryStackParamList } from '../../navigation/AppNavigator';
import { colors } from '../../theme/colors';
import { fontFamily } from '../../theme/typography';

// Chip -> category substrings it matches (lowercased). null = match all.
const CHIPS: { key: string; match: string[] | null }[] = [
  { key: 'All', match: null },
  { key: 'Recovery & Repair', match: ['recovery'] },
  { key: 'GH Secretagogue', match: ['gh secretagogue'] },
  { key: 'GLP-1 / Metabolic', match: ['glp-1', 'metabolic'] },
  { key: 'Cognitive', match: ['cognitive'] },
  { key: 'Longevity', match: ['longevity'] },
  { key: 'Mitochondrial', match: ['mitochondrial'] },
  { key: 'Sexual Health', match: ['sexual'] },
  { key: 'Immune', match: ['immune'] },
  { key: 'Sleep', match: ['sleep'] },
  { key: 'Other', match: ['other', 'antimicrobial', 'skin', 'cardio'] },
];

export default function LibraryScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<LibraryStackParamList>>();
  const [query, setQuery] = useState('');
  const [activeChip, setActiveChip] = useState('All');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const chip = CHIPS.find((c) => c.key === activeChip);
    return peptideDatabase.filter((p) => {
      // category filter
      if (chip?.match) {
        const inCat = p.category.some((cat) =>
          chip.match!.some((m) => cat.toLowerCase().includes(m)),
        );
        if (!inCat) return false;
      }
      // search filter (name or any alias)
      if (q) {
        const haystack = [p.name, ...p.aliases].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [query, activeChip]);

  const openDetail = (p: PeptideEntry) =>
    navigation.navigate('PeptideDetail', { peptideId: p.id });

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Library</Text>
        <Text style={styles.subtitle}>{peptideDatabase.length} compounds</Text>

        {/* Search */}
        <View style={styles.searchBar}>
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color={colors.textSecondary}
          />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search name or alias…"
            placeholderTextColor={colors.textSecondary}
            style={styles.searchInput}
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <MaterialCommunityIcons
                name="close-circle"
                size={18}
                color={colors.textSecondary}
              />
            </Pressable>
          )}
        </View>

        {/* Category chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {CHIPS.map((chip) => {
            const active = chip.key === activeChip;
            return (
              <Pressable
                key={chip.key}
                onPress={() => setActiveChip(chip.key)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {chip.key}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PeptideCard peptide={item} onPress={() => openDetail(item)} />
        )}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons
              name="magnify-close"
              size={42}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>No peptides found</Text>
            <Text style={styles.emptySub}>Try a different search or category.</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 8 },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 30,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.cardSurface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 15,
    color: colors.textPrimary,
    padding: 0,
  },
  chipRow: { gap: 8, paddingVertical: 14, paddingRight: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primaryAccent,
    borderColor: colors.primaryAccent,
  },
  chipText: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  chipTextActive: { color: colors.background, fontFamily: fontFamily.semiBold },
  list: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 28 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  emptySub: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textSecondary,
  },
});
