/**
 * App.tsx — CSW 434 Practice Assignment 3:
 * Using Sensors in React Native with Turbo Modules
 *
 * Student: Hoang Anh Kiet (ID: 2231200101)
 * Eastern International University
 */

import React, { useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import NfcScreen from './src/screens/NfcScreen';
import CompassScreen from './src/screens/CompassScreen';

type ActiveScreen = 'Home' | 'NFC' | 'Compass';

const App: React.FC = () => {
  const [screen, setScreen] = useState<ActiveScreen>('Home');

  const isLightScreen = screen === 'Compass';

  return (
    <SafeAreaView
      style={[
        styles.root,
        { backgroundColor: isLightScreen ? '#F4F7FC' : '#0F172A' },
      ]}>
      <StatusBar
        barStyle={isLightScreen ? 'dark-content' : 'light-content'}
        backgroundColor={isLightScreen ? '#F4F7FC' : '#0F172A'}
      />

      <View style={styles.body}>
        {screen === 'Home' && (
          <View style={styles.homeContainer}>
            {/* University & Student Header */}
            <View style={styles.headerCard}>
              <Text style={styles.uniTag}>
                EASTERN INTERNATIONAL UNIVERSITY
              </Text>
              <Text style={styles.title}>Practice Assignment 3</Text>
              <Text style={styles.subtitle}>
                Using Sensors in React Native with Turbo Modules
              </Text>
              <View style={styles.studentRow}>
                <Text style={styles.studentBadge}>
                  👤 Hoàng Anh Kiệt · ID: 2231200101
                </Text>
                <Text style={styles.courseBadge}>CSW 434</Text>
              </View>
            </View>

            {/* Exercise 1 Card */}
            <TouchableOpacity
              style={[styles.card, styles.cardNfc]}
              activeOpacity={0.85}
              onPress={() => setScreen('NFC')}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardEmoji}>📡</Text>
                <View style={styles.cardTag}>
                  <Text style={styles.cardTagText}>Exercise 1</Text>
                </View>
              </View>
              <Text style={styles.cardTitle}>
                Using NFC to Read Data from an NFC Tag
              </Text>
              <Text style={styles.cardDesc}>
                Reads NDEF records and tag metadata using a custom Android
                Kotlin Turbo Native Module (NfcModule.kt) without third-party
                NFC libraries.
              </Text>
              <View style={styles.moduleFooter}>
                <Text style={styles.moduleCode}>
                  TurboModuleRegistry.getEnforcing(&apos;NfcModule&apos;)
                </Text>
                <Text style={styles.openLink}>Open ›</Text>
              </View>
            </TouchableOpacity>

            {/* Exercise 2 Card */}
            <TouchableOpacity
              style={[styles.card, styles.cardCompass]}
              activeOpacity={0.85}
              onPress={() => setScreen('Compass')}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardEmoji}>🧭</Text>
                <View style={[styles.cardTag, styles.cardTagCompass]}>
                  <Text style={styles.cardTagText}>Exercise 2 · Screen 1</Text>
                </View>
              </View>
              <Text style={styles.cardTitle}>
                Using a Compass to Determine Direction
              </Text>
              <Text style={styles.cardDesc}>
                Reads Magnetometer & Accelerometer sensors via a custom Turbo
                Native Module (CompassModule.kt) and renders the Screen 1
                neumorphic rotating compass.
              </Text>
              <View style={styles.moduleFooter}>
                <Text style={styles.moduleCode}>
                  TurboModuleRegistry.getEnforcing(&apos;CompassModule&apos;)
                </Text>
                <Text style={styles.openLink}>Open ›</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {screen === 'NFC' && <NfcScreen onBack={() => setScreen('Home')} />}
        {screen === 'Compass' && (
          <CompassScreen onBack={() => setScreen('Home')} />
        )}
      </View>

      {/* Bottom Quick-Switch Tab Bar */}
      <View
        style={[
          styles.tabBar,
          isLightScreen && styles.tabBarLight,
        ]}>
        <TouchableOpacity
          style={[styles.tabItem, screen === 'Home' && styles.tabItemActive]}
          onPress={() => setScreen('Home')}>
          <Text
            style={[
              styles.tabText,
              isLightScreen && styles.tabTextLight,
              screen === 'Home' && styles.tabTextActive,
            ]}>
            🏠 Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, screen === 'NFC' && styles.tabItemActive]}
          onPress={() => setScreen('NFC')}>
          <Text
            style={[
              styles.tabText,
              isLightScreen && styles.tabTextLight,
              screen === 'NFC' && styles.tabTextActive,
            ]}>
            📡 Ex 1: NFC Reader
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, screen === 'Compass' && styles.tabItemActive]}
          onPress={() => setScreen('Compass')}>
          <Text
            style={[
              styles.tabText,
              isLightScreen && styles.tabTextLight,
              screen === 'Compass' && styles.tabTextActive,
            ]}>
            🧭 Ex 2: Compass
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  homeContainer: {
    flex: 1,
    padding: 18,
    justifyContent: 'center',
  },
  headerCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  uniTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  studentBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  courseBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    backgroundColor: '#38BDF8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },

  card: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
  },
  cardNfc: {
    backgroundColor: '#0C233B',
    borderColor: '#1E4976',
  },
  cardCompass: {
    backgroundColor: '#0F2922',
    borderColor: '#1D5B47',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardEmoji: {
    fontSize: 30,
  },
  cardTag: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cardTagCompass: {
    backgroundColor: '#065F46',
  },
  cardTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  cardDesc: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 6,
    lineHeight: 18,
  },
  moduleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  moduleCode: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#38BDF8',
  },
  openLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  tabBarLight: {
    backgroundColor: '#FFFFFF',
    borderTopColor: '#E2E8F0',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabItemActive: {
    backgroundColor: '#2563EB',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  tabTextLight: {
    color: '#475569',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
});

export default App;
