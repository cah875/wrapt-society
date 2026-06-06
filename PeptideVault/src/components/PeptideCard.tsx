// List card for a peptide in the Library. Shows name, color-coded category
// badges, half-life, and a View affordance.

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PeptideEntry } from '../data/peptideDatabase';
import { colors, categoryColor } from '../theme/colors';
import { fontFamily, cardStyle } from '../theme/typography';

interface Props {
  peptide: PeptideEntry;
  onPress: () => void;
}

function CategoryBadge({ category }: { category: string }) {
  const c = categoryColor(category);
  return (
    <View style={[styles.catBadge, { backgroundColor: `${c}22`, borderColor: c }]}>
      <Text style={[styles.catText, { color: c }]} numberOfLines={1}>
        {category}
      </Text>
    </View>
  );
}

export default function PeptideCard({ peptide, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.left}>
        <Text style={styles.name} numberOfLines={1}>
          {peptide.name}
        </Text>
        <View style={styles.badgeRow}>
          {peptide.category.slice(0, 2).map((cat) => (
            <CategoryBadge key={cat} category={cat} />
          ))}
        </View>
        <View style={styles.metaRow}>
          <MaterialCommunityIcons
            name="timer-sand"
            size={13}
            color={colors.textSecondary}
          />
          <Text style={styles.meta} numberOfLines={1}>
            Half-life: {peptide.halfLife}
          </Text>
        </View>
      </View>

      <View style={styles.viewBtn}>
        <Text style={styles.viewText}>View</Text>
        <MaterialCommunityIcons
          name="chevron-right"
          size={16}
          color={colors.primaryAccent}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    ...cardStyle,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pressed: {
    opacity: 0.8,
  },
  left: {
    flex: 1,
    paddingRight: 10,
  },
  name: {
    fontFamily: fontFamily.bold,
    fontSize: 17,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  catBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: 160,
  },
  catText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  meta: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryAccentDim,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  viewText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: colors.primaryAccent,
  },
});
