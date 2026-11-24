/**
 * CompassScreen.tsx — Exercise 2: Using a Compass to Determine Direction (Screen 1)
 *
 * Uses the CompassModule Turbo Native Module to read Magnetometer sensor data,
 * calculate the device orientation relative to North, and display the clean
 * Screen 1 neumorphic compass interface.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  DeviceEventEmitter,
  EmitterSubscription,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import CompassModule from '../specs/NativeCompassModule';

interface CompassData {
  angle: number;
  cardinal: string;
}

const DIAL_SIZE = 264;
const DIAL_RADIUS = DIAL_SIZE / 2;
const OUTER_RING_SIZE = 344;

const DEGREE_MARKS = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

const CompassScreen: React.FC = () => {
  const [compassData, setCompassData] = useState<CompassData>({
    angle: 260,
    cardinal: 'NE',
  });

  const animatedAngle = useRef(new Animated.Value(260)).current;
  const prevAngleRef = useRef(260);

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

  useEffect(() => {
    const sub: EmitterSubscription = DeviceEventEmitter.addListener(
      'CompassUpdate',
      (data: CompassData) => {
        setCompassData(data);
      },
    );

    CompassModule.startCompass();

    return () => {
      sub.remove();
      CompassModule.stopCompass();
    };
  }, []);

  const indicatorRotation = animatedAngle.interpolate({
    inputRange: [-360, 0, 360],
    outputRange: ['-360deg', '0deg', '360deg'],
    extrapolate: 'extend',
  });

  const roundedAngle = ((Math.round(compassData.angle) % 360) + 360) % 360;

  return (
    <View style={styles.screen}>
      {/* Top Header matching Screen 1 */}
      <View style={styles.headerRow}>
        <View style={styles.backTab}>
          <Text style={styles.backArrow}>‹</Text>
        </View>
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
              <View style={styles.orangeDot}>
                <View style={styles.orangeDotHighlight} />
              </View>
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
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F7FC',
    alignItems: 'center',
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingRight: 20,
  },
  backTab: {
    width: 44,
    height: 56,
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

  compassStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
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

  needleOverlay: {
    position: 'absolute',
    width: DIAL_SIZE,
    height: DIAL_SIZE,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  orangeDot: {
    marginTop: 44,
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

  centerWellOuter: {
    width: 126,
    height: 126,
    borderRadius: 63,
    backgroundColor: '#E9EFFB',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  centerWellInner: {
    width: 112,
    height: 112,
    borderRadius: 56,
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
    fontSize: 36,
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
});

export default CompassScreen;
