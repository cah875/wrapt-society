# PeptideVault

A cross-platform (iOS + Android) **React Native / Expo** mobile app for tracking
research peptides, calculating reconstitution & dosing math, and managing an
on-device inventory. **100% offline** — no backend, no authentication, no
network requests. All data lives on the device per local profile via
AsyncStorage.

> **Research Use Only.** PeptideVault is for research and informational
> purposes only and does not constitute medical advice.

## Tech stack

- Expo managed workflow (SDK 51), TypeScript
- React Navigation v6 (bottom tabs + per-tab native stacks)
- AsyncStorage for all persistence
- React Native Paper (dark theme)
- react-native-svg (syringe visual + molecular background)
- Expo Notifications (expiry warnings) + AppState foreground checks
- Inter font via `@expo-google-fonts/inter`

## Getting started

```bash
cd PeptideVault
npm install
npm start          # then press i / a, or scan the QR with Expo Go
```

Other scripts:

```bash
npm run ios        # open iOS simulator
npm run android    # open Android emulator
npm run tsc        # type-check (no emit)
```

## Project structure

```
App.tsx                         # root: fonts, providers, first-launch gate
src/
  components/                    # SyringeVisual, VialCard, PeptideCard,
                                 # ExpiryBadge, DoseLogModal, ReconstitutionModal,
                                 # DisclaimerModal, + shared Screen/HexBackground/
                                 # DateField/PeptidePicker
  screens/
    home/ HomeScreen.tsx
    library/ LibraryScreen.tsx, PeptideDetailScreen.tsx
    inventory/ InventoryScreen.tsx, AddVialScreen.tsx, VialDetailScreen.tsx
    calculator/ CalculatorScreen.tsx
    profile/ ProfileScreen.tsx
  data/ peptideDatabase.ts (43 entries), tips.ts
  types/ index.ts
  utils/ calculatorUtils.ts, storageUtils.ts, notificationUtils.ts
  navigation/ AppNavigator.tsx
  context/ AppContext.tsx        # profiles + inventory state, foreground expiry
  theme/ colors.ts, typography.ts
```

## Core math (U-100 syringe = 100 units / mL)

```
concentration (mg/mL) = vialMg / bacWaterMl
mcg per unit          = concentration * 1000 / 100
units to draw         = doseMcg / mcgPerUnit
volume drawn (mL)     = unitsDrawn / 100
```

## AsyncStorage keys

| Key                  | Value                                  |
| -------------------- | -------------------------------------- |
| `profiles`           | JSON array of `Profile`                |
| `activeProfileId`    | active profile id string               |
| `inventory_<id>`     | JSON array of `VialRecord` for profile |
| `disclaimerAccepted` | boolean                                |
| `lastTipDate`        | ISO date string (rotating daily tip)   |

## Notes

- Supports up to 5 local profiles; deleting a profile wipes its inventory.
- Expiry: powder = `dateReceived + powderDays`; reconstituted =
  `dateReconstituted + reconstitutedFridgeDays`. Warning fires at 80% elapsed.
- App assets in `assets/` are simple generated placeholders — swap in real
  branding before a production build.
