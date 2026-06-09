// Inventory list for the active profile. Segmented All/Powder/Reconstituted
// filter, swipe-to-delete on each card, and a FAB to add a vial.

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Alert,
  FlatList,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../../components/Screen';
import VialCard from '../../components/VialCard';
import { useApp } from '../../context/AppContext';
import { VialRecord } from '../../types';
import { InventoryStackParamList } from '../../navigation/AppNavigator';
import { colors } from '../../theme/colors';
import { fontFamily } from '../../theme/typography';

type Filter = 'all' | 'powder' | 'reconstituted';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'powder', label: 'Powder' },
  { key: 'reconstituted', label: 'Reconstituted' },
];

export default function InventoryScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<InventoryStackParamList>>();
  const { loading, activeProfile, inventory, removeVial } = useApp();
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return inventory;
    return inventory.filter((v) => v.status === filter);
  }, [inventory, filter]);

  const confirmDelete = (vial: VialRecord) => {
    Alert.alert(
      'Delete vial?',
      `Remove ${vial.peptideName} (${vial.vialSizeMg} mg) and its dose logs? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeVial(vial.id),
        },
      ],
    );
  };

  const renderRightActions = (vial: VialRecord) => (
    <Pressable style={styles.deleteAction} onPress={() => confirmDelete(vial)}>
      <MaterialCommunityIcons name="trash-can-outline" size={24} color="#fff" />
      <Text style={styles.deleteText}>Delete</Text>
    </Pressable>
  );

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primaryAccent} size="large" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Inventory</Text>
        <Text style={styles.subtitle}>{activeProfile?.name ?? 'No profile'}</Text>

        <View style={styles.segment}>
          {FILTERS.map((f) => (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[styles.segmentBtn, filter === f.key && styles.segmentActive]}
            >
              <Text
                style={[
                  styles.segmentText,
                  filter === f.key && styles.segmentTextActive,
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Swipeable renderRightActions={() => renderRightActions(item)} overshootRight={false}>
            <VialCard
              vial={item}
              onPress={() =>
                navigation.navigate('VialDetail', { vialId: item.id })
              }
            />
          </Swipeable>
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons
              name="flask-empty-outline"
              size={46}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>
              {filter === 'all' ? 'No vials yet' : `No ${filter} vials`}
            </Text>
            <Text style={styles.emptySub}>
              Tap the + button to add your first vial.
            </Text>
          </View>
        }
      />

      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate('AddVial')}
      >
        <MaterialCommunityIcons name="plus" size={28} color={colors.background} />
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 8 },
  title: { fontFamily: fontFamily.bold, fontSize: 30, color: colors.textPrimary },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 16,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.cardSurface,
    borderRadius: 12,
    padding: 4,
  },
  segmentBtn: { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center' },
  segmentActive: { backgroundColor: colors.primaryAccent },
  segmentText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: colors.textSecondary,
  },
  segmentTextActive: { color: colors.background },
  list: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyText: { fontFamily: fontFamily.semiBold, fontSize: 16, color: colors.textPrimary },
  emptySub: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  deleteAction: {
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    width: 90,
    borderRadius: 16,
    marginBottom: 12,
    marginLeft: 10,
    gap: 3,
  },
  deleteText: { fontFamily: fontFamily.semiBold, fontSize: 12, color: '#fff' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primaryAccent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
