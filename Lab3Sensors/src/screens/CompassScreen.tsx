/**
 * CompassScreen.tsx — Exercise 2: Using a Compass to Determine Direction (Screen 1)
 *
 * Uses the CompassModule Turbo Native Module to read Magnetometer sensor data,
 * calculate the device orientation relative to North, and display the Screen 1
 * neumorphic compass interface with a dynamically rotating indicator/needle.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  DeviceEventEmitter,
  EmitterSubscription,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import CompassModule from '../specs/NativeCompassModule';

interface CompassData {
  angle: number;
  cardinal: string;
  pitch: number;
  roll: number;
  magX?: number;
  magY?: number;
  magZ?: number;
}

interface CompassScreenProps {
  onBack?: () => void;
}

const DIAL_SIZE = 256;
const DIAL_RADIUS = DIAL_SIZE / 2;
const OUTER_RING_SIZE = 332;

const DEGREE_MARKS = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
const QUICK_ANGLES = [
  { label: '0° N', deg: 0 },
  { label: '45° NE', deg: 45 },
  { label: '90° E', deg: 90 },
  { label: '180° S', deg: 180 },
  { label: '260° W', deg: 260 },
  { label: '315° NW', deg: 315 },
];

const CompassScreen: React.FC<CompassScreenProps> = ({ onBack }) => {
  const [isActive, setIsActive] = useState(true);
  const [compassData, setCompassData] = useState<CompassData>({
    angle: 260,
    cardinal: 'W',
    pitch: 0,
    roll: 0,
    magX: 44.3,
    magY: -7.8,
    magZ: -15.0,
  });

  const animatedAngle = useRef(new Animated.Value(260)).current;
  const prevAngleRef = useRef(260);

  // Smooth shortest-path rotation animation when angle changes
  useEffect(() => {
    let delta = compassData.angle - (prevAngleRef.current % 360);
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    const nextTarget = prevAngleRef.current + delta;
    prevAngleRef.current = nextTarget;

    Animated.spring(animatedAngle, {
      toValue: nextTarget,
      friction: 7,
      tension: 45,
      useNativeDriver: true,
    }).start();
  }, [compassData.angle, animatedAngle]);

  const startSensor = useCallback(() => {
    setIsActive(true);
    CompassModule.startCompass();
  }, []);

  const stopSensor = useCallback(() => {
    setIsActive(false);
    CompassModule.stopCompass();
  }, []);

  const triggerNativeAngle = useCallback((deg: number) => {
    CompassModule.simulateDirection(deg);
  }, []);

  useEffect(() => {
    const sub: EmitterSubscription = DeviceEventEmitter.addListener(
      'CompassUpdate',
      (data: CompassData) => {
        setCompassData(data);
      },
    );

    startSensor();
    // Initialize with 260° through the native Turbo Module to match Screen 1 on launch
    setTimeout(() => {
      CompassModule.simulateDirection(260);
    }, 150);

    return () => {
      sub.remove();
      CompassModule.stopCompass();
    };
  }, [startSensor]);

  // Indicator dot rotates around the center according to heading angle
  const indicatorRotation = animatedAngle.interpolate({
    inputRange: [-360, 0, 360],
    outputRange: ['-360deg', '0deg', '360deg'],
    extrapolate: 'extend',
  });

  const roundedAngle = Math.round(compassData.angle) % 360;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      {/* Top Header matching Screen 1 */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backTab}
          activeOpacity={0.8}
          onPress={onBack}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Compass</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      {/* Main Compass Dial Area (Screen 1 design) */}
      <View style={styles.compassStage}>
        {/* Soft Outer Ring */}
        <View style={styles.outerRing}>
          {/* Cardinal labels outside the dial */}
          <Text style={[styles.cardinalOuter, styles.cardinalN]}>N</Text>
          <Text style={[styles.cardinalOuter, styles.cardinalE]}>E</Text>
          <Text style={[styles.cardinalOuter, styles.cardinalS]}>S</Text>
          <Text style={[styles.cardinalOuter, styles.cardinalW]}>W</Text>

          {/* Red cardinal tick lines bridging outer ring and inner dial */}
          <View style={[styles.cardinalTick, styles.tickTop]} />
          <View style={[styles.cardinalTickHorizontal, styles.tickRight]} />
          <View style={[styles.cardinalTick, styles.tickBottom]} />
          <View style={[styles.cardinalTickHorizontal, styles.tickLeft]} />

          {/* Neumorphic White Dial */}
          <View style={styles.innerDial}>
            {/* Degree ticks and labels every 30° */}
            {DEGREE_MARKS.map(deg => {
              const isCardinal = deg % 90 === 0;
              return (
                <View
                  key={deg}
                  pointerEvents="none"
                  style={[
                    styles.degreeRay,
                    { transform: [{ rotate: `${deg}deg` }] },
                  ]}>
                  <View
                    style={[
                      styles.minorTick,
                      isCardinal && styles.majorTick,
                    ]}
                  />
                  <Text
                    style={[
                      styles.degreeLabel,
                      isCardinal && styles.degreeLabelBold,
                    ]}>
                    {deg}°
                  </Text>
                </View>
              );
            })}

            {/* Rotating Needle / Orange Indicator Dot (Screen 1) */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.needleOverlay,
                { transform: [{ rotate: indicatorRotation }] },
              ]}>
              {/* Orange-red indicator sphere positioned along the inner track */}
              <View style={styles.orangeDot}>
                <View style={styles.orangeDotHighlight} />
              </View>
              {/* Subtle direction pointer line toward center */}
              <View style={styles.needleLine} />
            </Animated.View>

            {/* Center Neumorphic Readout Circle */}
            <View style={styles.centerWellOuter}>
              <View style={styles.centerWellInner}>
                <View style={styles.degreeRow}>
                  <Text style={styles.centerDegreeText}>{roundedAngle}</Text>
                  <Text style={styles.centerDegreeSymbol}>°</Text>
                </View>
                <Text style={styles.centerCardinalText}>
                  {compassData.cardinal}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Native Magnetometer Sensor Telemetry & Interactive Verification Panel */}
      <View style={styles.sensorCard}>
        <View style={styles.sensorHeaderRow}>
          <View style={styles.statusBadge}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isActive ? '#16A34A' : '#94A3B8' },
              ]}
            />
            <Text style={styles.statusLabel}>
              TurboModule: CompassModule.kt ({isActive ? 'Active' : 'Paused'})
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.toggleBtn, !isActive && styles.toggleBtnStart]}
            onPress={isActive ? stopSensor : startSensor}>
            <Text style={styles.toggleBtnText}>
              {isActive ? 'Pause' : 'Resume'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Live Magnetometer Vector Readout */}
        <View style={styles.telemetryRow}>
          <View style={styles.telemetryBox}>
            <Text style={styles.telemetryLabel}>Bx (μT)</Text>
            <Text style={styles.telemetryVal}>
              {(compassData.magX ?? 0).toFixed(1)}
            </Text>
          </View>
          <View style={styles.telemetryBox}>
            <Text style={styles.telemetryLabel}>By (μT)</Text>
            <Text style={styles.telemetryVal}>
              {(compassData.magY ?? 0).toFixed(1)}
            </Text>
          </View>
          <View style={styles.telemetryBox}>
            <Text style={styles.telemetryLabel}>Bz (μT)</Text>
            <Text style={styles.telemetryVal}>
              {(compassData.magZ ?? 0).toFixed(1)}
            </Text>
          </View>
          <View style={styles.telemetryBox}>
            <Text style={styles.telemetryLabel}>Heading</Text>
            <Text style={[styles.telemetryVal, { color: '#E53935' }]}>
              {roundedAngle}° {compassData.cardinal}
            </Text>
          </View>
        </View>

        {/* Quick Native Angle Presets for Emulator Demo */}
        <Text style={styles.presetTitle}>
          Test Native Magnetometer Rotation (CompassModule.simulateDirection):
        </Text>
        <View style={styles.presetRow}>
          {QUICK_ANGLES.map(item => {
            const selected = Math.abs(roundedAngle - item.deg) <= 3;
            return (
              <TouchableOpacity
                key={item.deg}
                style={[styles.presetBtn, selected && styles.presetBtnActive]}
                onPress={() => triggerNativeAngle(item.deg)}>
                <Text
                  style={[
                    styles.presetBtnText,
                    selected && styles.presetBtnTextActive,
                  ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F7FC',
  },
  scrollContent: {
    paddingBottom: 28,
    alignItems: 'center',
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 10,
    paddingRight: 20,
  },
  backTab: {
    width: 44,
    height: 54,
    backgroundColor: '#373D49',
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  backArrow: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '600',
    marginTop: -2,
    marginRight: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2D3139',
    letterSpacing: 0.4,
  },
  headerRightSpacer: {
    width: 44,
  },

  // Compass stage matching Screen 1
  compassStage: {
    marginVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    width: OUTER_RING_SIZE,
    height: OUTER_RING_SIZE,
    borderRadius: OUTER_RING_SIZE / 2,
    borderWidth: 2,
    borderColor: '#E3EAF7',
    backgroundColor: '#F7FAFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  cardinalOuter: {
    position: 'absolute',
    fontSize: 20,
    fontWeight: '600',
    color: '#4F5665',
  },
  cardinalN: {
    top: 10,
    color: '#E53935',
    fontWeight: '700',
  },
  cardinalE: {
    right: 12,
  },
  cardinalS: {
    bottom: 10,
  },
  cardinalW: {
    left: 10,
  },
  cardinalTick: {
    position: 'absolute',
    width: 2.5,
    height: 15,
    backgroundColor: '#E8553E',
    zIndex: 10,
  },
  cardinalTickHorizontal: {
    position: 'absolute',
    width: 15,
    height: 2.5,
    backgroundColor: '#E8553E',
    zIndex: 10,
  },
  tickTop: {
    top: 38,
  },
  tickBottom: {
    bottom: 38,
  },
  tickLeft: {
    left: 38,
  },
  tickRight: {
    right: 38,
  },

  innerDial: {
    width: DIAL_SIZE,
    height: DIAL_SIZE,
    borderRadius: DIAL_RADIUS,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#8FA5CC',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    borderWidth: 1,
    borderColor: '#EBF0FA',
  },
  degreeRay: {
    position: 'absolute',
    width: 44,
    height: DIAL_SIZE,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 6,
  },
  minorTick: {
    width: 1.5,
    height: 10,
    backgroundColor: '#A0AEC0',
    marginBottom: 3,
  },
  majorTick: {
    width: 2,
    height: 12,
    backgroundColor: '#4A5568',
  },
  degreeLabel: {
    fontSize: 10,
    color: '#718096',
    fontWeight: '600',
  },
  degreeLabelBold: {
    fontSize: 11,
    color: '#1A202C',
    fontWeight: '800',
  },

  // Rotating needle & orange dot matching Screen 1
  needleOverlay: {
    position: 'absolute',
    width: DIAL_SIZE,
    height: DIAL_SIZE,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  orangeDot: {
    marginTop: 42,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F06430',
    borderWidth: 2,
    borderColor: '#FF8A5B',
    elevation: 6,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    padding: 3,
  },
  orangeDotHighlight: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#FFB088',
  },
  needleLine: {
    width: 2,
    height: 14,
    backgroundColor: '#F06430',
    opacity: 0.5,
  },

  // Center neumorphic readout circle
  centerWellOuter: {
    width: 124,
    height: 124,
    borderRadius: 62,
    backgroundColor: '#E9EFFB',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  centerWellInner: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#F7F9FE',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  degreeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginLeft: 6,
  },
  centerDegreeText: {
    fontSize: 34,
    fontWeight: '800',
    color: '#48505E',
    letterSpacing: 0.5,
  },
  centerDegreeSymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: '#48505E',
    marginTop: 2,
  },
  centerCardinalText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4F5665',
    marginTop: 2,
    letterSpacing: 1,
  },

  // Bottom telemetry & controls card
  sensorCard: {
    width: '92%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 3,
  },
  sensorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  toggleBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  toggleBtnStart: {
    backgroundColor: '#DCFCE7',
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
  },
  telemetryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 10,
  },
  telemetryBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  telemetryLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  telemetryVal: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '700',
    marginTop: 2,
  },
  presetTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  presetBtnActive: {
    backgroundColor: '#2563EB',
    borderColor: '#1D4ED8',
  },
  presetBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  presetBtnTextActive: {
    color: '#FFFFFF',
  },
});

export default CompassScreen;
