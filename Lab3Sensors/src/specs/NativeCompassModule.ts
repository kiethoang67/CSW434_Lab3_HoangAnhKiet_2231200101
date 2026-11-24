/**
 * NativeCompassModule.ts — TypeScript specification for the Compass Turbo Native Module.
 */

import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  /**
   * Begin reading the magnetometer + accelerometer sensors.
   * Emits 'CompassUpdate' events.
   */
  startCompass(): void;

  /**
   * Stop reading sensor data and unregister the listener.
   */
  stopCompass(): void;

  /**
   * Feed a target heading angle (0..360) into the native Kotlin SensorManager
   * rotation matrix calculator and emit 'CompassUpdate'.
   */
  simulateDirection(targetDegrees: number): void;

  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('CompassModule');
