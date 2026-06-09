// Home dashboard: greeting, stat cards, expiring/expired sections, quick
// actions, and a rotating daily tip.

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../../components/Screen';
import VialCard from '../../components/VialCard';
import { useApp } from '../../context/AppContext';
import { getExpiryInfo, summarizeInventory } from '../../utils/notificationUtils';
import { tipForDate } from '../../data/tips';
import { setLastTipDate } from '../../utils/storageUtils';
import { colors } from '../../theme/colors';
import { fontFamily, cardStyle } from '../../theme/typography';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function StatCard({
  value,
  label,
  color,
  icon,
}: {
  value: number;
  label: string;
  color: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}) {
  return (
    <View style={styles.statCard}>
      <MaterialCommunityIcons name={icon} size={22} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { loading, activeProfile, inventory } = useApp();

  const stats = useMemo(() => summarizeInventory(inventory), [inventory]);

  const { expiring, expired } = useMemo(() => {
    const exp: typeof inventory = [];
    const expd: typeof inventory = [];
    for (const v of inventory) {
      const info = getExpiryInfo(v);
      if (!info) continue;
      if (info.status === 'warning') exp.push(v);
      else if (info.status === 'expired') expd.push(v);
    }
    return { expiring: exp, expired: expd };
  }, [inventory]);

  const tip = useMemo(() => {
    setLastTipDate(new Date().toISOString());
    return tipForDate();
  }, []);

  const openVial = (vialId: string) =>
    navigation.navigate('InventoryTab', {
      screen: 'VialDetail',
      params: { vialId },
    });

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
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome */}
        <View style={styles.welcomeCard}>
          <Text style={styles.greeting}>{greeting()},</Text>
          <Text style={styles.profileName}>
            {activeProfile?.name ?? 'Researcher'}
          </Text>
          <Text style={styles.welcomeSub}>
            Here is your peptide overview for today.
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard
            value={stats.active}
            label="Active vials"
            color={colors.primaryAccent}
            icon="flask-outline"
          />
          <StatCard
            value={stats.expiringSoon}
            label="Expiring soon"
            color={colors.warning}
            icon="clock-alert-outline"
          />
          <StatCard
            value={stats.expired}
            label="Expired"
            color={colors.danger}
            icon="alert-octagon-outline"
          />
        </View>

        {/* Expiring Soon */}
        {expiring.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Expiring Soon</Text>
            {expiring.map((v) => (
              <VialCard key={v.id} vial={v} onPress={() => openVial(v.id)} />
            ))}
          </View>
        )}

        {/* Expired */}
        {expired.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.danger }]}>
              Expired
            </Text>
            {expired.map((v) => (
              <VialCard key={v.id} vial={v} onPress={() => openVial(v.id)} />
            ))}
          </View>
        )}

        {inventory.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="flask-empty-outline"
              size={44}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>No vials yet</Text>
            <Text style={styles.emptySub}>
              Add your first vial from the Inventory tab to start tracking.
            </Text>
          </View>
        )}

        {/* Quick actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionRow}>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: colors.primaryAccentDim }]}
              onPress={() => navigation.navigate('CalculatorTab')}
            >
              <MaterialCommunityIcons
                name="calculator-variant"
                size={26}
                color={colors.primaryAccent}
              />
              <Text style={[styles.actionText, { color: colors.primaryAccent }]}>
                Calculator
              </Text>
            </Pressable>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: colors.secondaryAccentDim }]}
              onPress={() => navigation.navigate('LibraryTab')}
            >
              <MaterialCommunityIcons
                name="book-open-variant"
                size={26}
                color={colors.secondaryAccent}
              />
              <Text style={[styles.actionText, { color: colors.secondaryAccent }]}>
                Library
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Tip of the day */}
        <View style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <MaterialCommunityIcons
              name="lightbulb-on-outline"
              size={18}
              color={colors.primaryAccent}
            />
            <Text style={styles.tipTitle}>Tip of the Day</Text>
          </View>
          <Text style={styles.tipBody}>{tip}</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  welcomeCard: { ...cardStyle, marginBottom: 18 },
  greeting: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    color: colors.textSecondary,
  },
  profileName: {
    fontFamily: fontFamily.bold,
    fontSize: 26,
    color: colors.textPrimary,
    marginTop: 2,
  },
  welcomeSub: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
  },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 22 },
  statCard: {
    ...cardStyle,
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    gap: 4,
  },
  statValue: { fontFamily: fontFamily.bold, fontSize: 24 },
  statLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: { marginBottom: 22 },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  emptyState: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  emptySub: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 22,
    alignItems: 'center',
    gap: 8,
  },
  actionText: { fontFamily: fontFamily.semiBold, fontSize: 14 },
  tipCard: {
    ...cardStyle,
    borderLeftWidth: 3,
    borderLeftColor: colors.primaryAccent,
  },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 },
  tipTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: colors.primaryAccent,
  },
  tipBody: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textPrimary,
  },
});
