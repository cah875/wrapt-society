// Bottom tab navigator (Home, Library, Inventory, Calculator, Profile) with a
// stack navigator per tab. Param lists are exported for typed navigation.

import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import HomeScreen from '../screens/home/HomeScreen';
import LibraryScreen from '../screens/library/LibraryScreen';
import PeptideDetailScreen from '../screens/library/PeptideDetailScreen';
import InventoryScreen from '../screens/inventory/InventoryScreen';
import AddVialScreen from '../screens/inventory/AddVialScreen';
import VialDetailScreen from '../screens/inventory/VialDetailScreen';
import CalculatorScreen from '../screens/calculator/CalculatorScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

import { colors } from '../theme/colors';
import { fontFamily } from '../theme/typography';

// ── Param lists ───────────────────────────────────────────────────────────

export interface AddVialPrefill {
  peptideId?: string;
  peptideName?: string;
  vialSizeMg?: number;
  bacWaterMl?: number;
  status?: 'powder' | 'reconstituted';
}

export type HomeStackParamList = { Home: undefined };
export type LibraryStackParamList = {
  Library: undefined;
  PeptideDetail: { peptideId: string };
};
export type InventoryStackParamList = {
  Inventory: undefined;
  AddVial: { prefill?: AddVialPrefill } | undefined;
  VialDetail: { vialId: string };
};
export type CalculatorStackParamList = { Calculator: undefined };
export type ProfileStackParamList = { Profile: undefined };

export type RootTabParamList = {
  HomeTab: undefined;
  LibraryTab: undefined;
  InventoryTab: { screen?: keyof InventoryStackParamList; params?: any } | undefined;
  CalculatorTab: undefined;
  ProfileTab: undefined;
};

// ── Shared stack header styling ──────────────────────────────────────────

const stackScreenOptions = {
  headerStyle: { backgroundColor: colors.background },
  headerTintColor: colors.textPrimary,
  headerTitleStyle: { fontFamily: fontFamily.bold, fontSize: 18 },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.background },
};

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={stackScreenOptions}>
      <HomeStack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
    </HomeStack.Navigator>
  );
}

const LibraryStack = createNativeStackNavigator<LibraryStackParamList>();
function LibraryStackNavigator() {
  return (
    <LibraryStack.Navigator screenOptions={stackScreenOptions}>
      <LibraryStack.Screen
        name="Library"
        component={LibraryScreen}
        options={{ headerShown: false }}
      />
      <LibraryStack.Screen
        name="PeptideDetail"
        component={PeptideDetailScreen}
        options={{ title: '', headerBackTitle: 'Library' }}
      />
    </LibraryStack.Navigator>
  );
}

const InventoryStack = createNativeStackNavigator<InventoryStackParamList>();
function InventoryStackNavigator() {
  return (
    <InventoryStack.Navigator screenOptions={stackScreenOptions}>
      <InventoryStack.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{ headerShown: false }}
      />
      <InventoryStack.Screen
        name="AddVial"
        component={AddVialScreen}
        options={{ title: 'Add Vial' }}
      />
      <InventoryStack.Screen
        name="VialDetail"
        component={VialDetailScreen}
        options={{ title: 'Vial Details' }}
      />
    </InventoryStack.Navigator>
  );
}

const CalculatorStack = createNativeStackNavigator<CalculatorStackParamList>();
function CalculatorStackNavigator() {
  return (
    <CalculatorStack.Navigator screenOptions={stackScreenOptions}>
      <CalculatorStack.Screen
        name="Calculator"
        component={CalculatorScreen}
        options={{ headerShown: false }}
      />
    </CalculatorStack.Navigator>
  );
}

const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={stackScreenOptions}>
      <ProfileStack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
    </ProfileStack.Navigator>
  );
}

// ── Tabs ─────────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<RootTabParamList>();

const TAB_ICONS: Record<
  keyof RootTabParamList,
  keyof typeof MaterialCommunityIcons.glyphMap
> = {
  HomeTab: 'home-variant',
  LibraryTab: 'book-open-variant',
  InventoryTab: 'flask-outline',
  CalculatorTab: 'calculator-variant',
  ProfileTab: 'account-circle-outline',
};

const TAB_LABELS: Record<keyof RootTabParamList, string> = {
  HomeTab: 'Home',
  LibraryTab: 'Library',
  InventoryTab: 'Inventory',
  CalculatorTab: 'Calculator',
  ProfileTab: 'Profile',
};

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primaryAccent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.cardSurface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 86 : 64,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
        },
        tabBarLabelStyle: { fontFamily: fontFamily.medium, fontSize: 11 },
        tabBarLabel: TAB_LABELS[route.name],
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons
            name={TAB_ICONS[route.name]}
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} />
      <Tab.Screen name="LibraryTab" component={LibraryStackNavigator} />
      <Tab.Screen name="InventoryTab" component={InventoryStackNavigator} />
      <Tab.Screen name="CalculatorTab" component={CalculatorStackNavigator} />
      <Tab.Screen name="ProfileTab" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
}
