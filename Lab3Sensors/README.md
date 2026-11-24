# Lab 3 — Sensors in React Native with Turbo Native Modules

> **CSW434 · Advanced Mobile Programming**  
> **Student:** _(fill in your name & ID)_

## Exercises

| # | Screen | Native Module | Sensor Used |
|---|--------|--------------|------------|
| 1 | NFC Tag Reader | `NfcModule.kt` | NFC Adapter |
| 2 | Compass | `CompassModule.kt` | Magnetometer + Accelerometer |

---

## Prerequisites

| Tool | Required Version |
|------|----------------|
| Node.js | ≥ 18 |
| JDK | 17 |
| Android Studio | Hedgehog or later |
| Android SDK | API 35 |
| Physical Android Device | NFC-capable (for Exercise 1) |

---

## Setup & Run

```bash
# 1. Install JS dependencies
cd Lab3Sensors
npm install

# 2. Connect Android device (or start emulator for Exercise 2 only)
adb devices

# 3. Start Metro bundler
npm start

# 4. Build & install on device (in a new terminal)
npm run android
```

---

## Project Structure

```
Lab3Sensors/
├── App.tsx                              ← Root navigation (Home → NFC / Compass)
├── index.js                             ← AppRegistry entry point
├── src/
│   ├── specs/
│   │   ├── NativeNfcModule.ts           ← Turbo Module spec (Codegen)
│   │   └── NativeCompassModule.ts       ← Turbo Module spec (Codegen)
│   └── screens/
│       ├── NfcScreen.tsx                ← Exercise 1 UI
│       └── CompassScreen.tsx            ← Exercise 2 UI
└── android/app/src/main/java/com/lab3sensors/
    ├── MainActivity.kt                  ← Hosts NFC foreground dispatch
    ├── MainApplication.kt               ← Registers SensorsPackage
    ├── SensorsPackage.kt                ← ReactPackage with both modules
    ├── NfcModule.kt                     ← Turbo Module: NFC reader
    └── CompassModule.kt                 ← Turbo Module: Magnetometer compass
```

---

## Architecture — How Turbo Modules Work

```
React Native (JS/TS)
        │
        │  TurboModuleRegistry.getEnforcing('NfcModule')
        ▼
  JS Spec file (NativeNfcModule.ts)
        │  Codegen generates C++ bridge
        ▼
  NfcModule.kt / CompassModule.kt    ←── Kotlin native code
        │
        ▼
  Android Hardware APIs (NfcAdapter / SensorManager)
```

**Key points:**
- `newArchEnabled=true` in `gradle.properties` activates New Architecture + Turbo Modules
- Each module's `getName()` must match the string in `TurboModuleRegistry.getEnforcing<Spec>('...')`
- Events travel back to JS via `DeviceEventManagerModule.RCTDeviceEventEmitter`

---

## Exercise 1 — NFC Details

- Uses **foreground dispatch** (`NfcAdapter.enableForegroundDispatch`) set up in `MainActivity`
- Supports NDEF Text records, URI records, MIME media, and raw hex fallback
- `NfcModule.handleNfcIntent()` is called from `MainActivity.onNewIntent()`

> ⚠️ **NFC does NOT work on Android Emulator.** A physical NFC-capable device is required.

---

## Exercise 2 — Compass Details

- Fuses **TYPE_ACCELEROMETER** + **TYPE_MAGNETIC_FIELD** via `SensorManager.getRotationMatrix()`
- Applies a **low-pass filter** (α = 0.15) to reduce noise
- Throttled at 20 Hz (50 ms intervals) to avoid flooding the JS bridge
- Uses `Animated.spring` for smooth needle rotation with shortest-path interpolation

---

## References

- [React Native New Architecture Guide](https://reactnative.dev/docs/new-architecture-intro)
- [Android NfcAdapter docs](https://developer.android.com/reference/android/nfc/NfcAdapter)
- [Android SensorManager docs](https://developer.android.com/reference/android/hardware/SensorManager)
- [NDEF Record Type Definition — NFC Forum](https://nfc-forum.org/specs/)
