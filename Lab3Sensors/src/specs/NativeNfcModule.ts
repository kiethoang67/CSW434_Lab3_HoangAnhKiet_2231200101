/**
 * NativeNfcModule.ts — TypeScript specification for the NFC Turbo Native Module.
 */

import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  /**
   * Start listening for NFC tag discoveries.
   * Emits 'NfcTagDetected' events via DeviceEventEmitter.
   */
  startNfcScan(): void;

  /**
   * Stop listening for NFC tag discoveries.
   */
  stopNfcScan(): void;

  /**
   * Build and parse a real Android NdefMessage / NdefRecord in Kotlin
   * and emit 'NfcTagDetected' through the Turbo Module bridge.
   * presetType: 'text' | 'uri' | 'multi' | 'vcard'
   */
  simulateNfcTag(presetType: string): void;

  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NfcModule');
