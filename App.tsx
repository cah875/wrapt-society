// PeptideVault root: fonts, providers, and the first-launch gate
// (disclaimer → profile creation → main app).

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import {
  Provider as PaperProvider,
  MD3DarkTheme,
} from 'react-native-paper';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import AppNavigator from './src/navigation/AppNavigator';
import { AppProvider, useApp } from './src/context/AppContext';
import DisclaimerModal from './src/components/DisclaimerModal';
import HexBackground from './src/components/HexBackground';
import {
  getDisclaimerAccepted,
  setDisclaimerAccepted,
} from './src/utils/storageUtils';
import { colors } from './src/theme/colors';
import { fontFamily } from './src/theme/typography';

const paperTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primaryAccent,
    secondary: colors.secondaryAccent,
    background: colors.background,
    surface: colors.cardSurface,
    error: colors.danger,
    onPrimary: colors.background,
    onBackground: colors.textPrimary,
    onSurface: colors.textPrimary,
  },
};

const navTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primaryAccent,
    background: colors.background,
    card: colors.cardSurface,
    text: colors.textPrimary,
    border: colors.border,
    notification: colors.primaryAccent,
  },
};

function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primaryAccent} />
    </View>
  );
}

// Inline onboarding profile-creation screen.
function Onboarding() {
  const { createProfile } = useApp();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const start = async () => {
    setBusy(true);
    await createProfile(name.trim() || 'Researcher');
    // AppProvider state updates -> gate re-renders into the main app.
  };

  return (
    <View style={styles.onboard}>
      <HexBackground />
      <View style={styles.onboardInner}>
        <View style={styles.logoCircle}>
          <MaterialCommunityIcons
            name="flask-outline"
            size={44}
            color={colors.primaryAccent}
          />
        </View>
        <Text style={styles.brand}>PeptideVault</Text>
        <Text style={styles.tagline}>
          Track, calculate, and manage your research peptides — all offline.
        </Text>

        <Text style={styles.label}>What should we call you?</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          autoFocus
        />

        <Pressable
          style={[styles.cta, busy && styles.ctaDisabled]}
          onPress={start}
          disabled={busy}
        >
          <Text style={styles.ctaText}>Get Started</Text>
        </Pressable>
      </View>
    </View>
  );
}

// Decides which screen to show based on disclaimer + profile state.
function RootGate() {
  const { loading, profiles } = useApp();
  const [disclaimerChecked, setDisclaimerChecked] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    (async () => {
      setAccepted(await getDisclaimerAccepted());
      setDisclaimerChecked(true);
    })();
  }, []);

  const acceptDisclaimer = async () => {
    await setDisclaimerAccepted(true);
    setAccepted(true);
  };

  if (!disclaimerChecked || loading) return <Loading />;

  if (!accepted) {
    return <DisclaimerModal visible onAccept={acceptDisclaimer} />;
  }

  if (profiles.length === 0) {
    return <Onboarding />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      <AppNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primaryAccent} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={paperTheme}>
          <AppProvider>
            <StatusBar style="light" />
            <RootGate />
          </AppProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onboard: { flex: 1, backgroundColor: colors.background },
  onboardInner: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
  },
  logoCircle: {
    alignSelf: 'center',
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primaryAccentDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  brand: {
    fontFamily: fontFamily.bold,
    fontSize: 32,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  tagline: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontFamily: fontFamily.medium,
    fontSize: 17,
    color: colors.textPrimary,
  },
  cta: {
    backgroundColor: colors.primaryAccent,
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 28,
  },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { fontFamily: fontFamily.bold, fontSize: 16, color: colors.background },
});
