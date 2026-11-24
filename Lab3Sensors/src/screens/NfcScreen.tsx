/**
 * NfcScreen.tsx — Exercise 1: Using NFC to Read Data from an NFC Tag
 *
 * Requirements fulfilled:
 * 1. Uses custom Turbo Native Module (NfcModule.kt) on Android.
 * 2. Automatically registers an NFC event listener ('NfcTagDetected') when the app/screen starts.
 * 3. Displays the retrieved NFC tag ID, technologies, and NDEF records on the screen.
 * 4. Supports both hardware NFC tags, ADB NDEF intents, and Native Android NdefMessage simulation.
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
import NfcModule from '../specs/NativeNfcModule';

interface NdefRecord {
  type: string;
  id: string;
  payload: string;
  tnf: string;
  byteLength?: number;
}

interface NdefData {
  records: NdefRecord[];
  maxSize: number;
  isWritable: boolean;
}

interface NfcTagData {
  tagId: string;
  techList: string;
  source?: string;
  ndef: NdefData | null;
}

interface NfcScreenProps {
  onBack?: () => void;
}

const NATIVE_NDEF_PRESETS = [
  { key: 'text', label: '📝 NDEF Text Record', desc: 'RTD_TEXT (Student Info)' },
  { key: 'uri', label: '🔗 NDEF URI Record', desc: 'RTD_URI (Android NFC Docs)' },
  { key: 'multi', label: '📦 Multi-Record Tag', desc: 'Text + URI + JSON MIME' },
  { key: 'vcard', label: '🪪 Smart vCard Tag', desc: 'text/vcard MIME Record' },
];

const NfcScreen: React.FC<NfcScreenProps> = ({ onBack }) => {
  const [isListening, setIsListening] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState('text');
  const [tagData, setTagData] = useState<NfcTagData | null>(null);
  const [lastTimestamp, setLastTimestamp] = useState<string>('');

  const pulseAnim = useRef(new Animated.Value(1)).current;

  const startPulse = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.12,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseAnim]);

  // Step 2 of Exercise 1: Register an NFC event listener when the app starts
  useEffect(() => {
    const sub: EmitterSubscription = DeviceEventEmitter.addListener(
      'NfcTagDetected',
      (data: NfcTagData) => {
        setTagData(data);
        const now = new Date();
        setLastTimestamp(now.toLocaleTimeString());
      },
    );

    // Start native NFC listener immediately on mount
    NfcModule.startNfcScan();
    setIsListening(true);
    startPulse();

    return () => {
      sub.remove();
      NfcModule.stopNfcScan();
    };
  }, [startPulse]);

  const handleToggleScan = () => {
    if (isListening) {
      NfcModule.stopNfcScan();
      setIsListening(false);
    } else {
      NfcModule.startNfcScan();
      setIsListening(true);
    }
  };

  // Calls Kotlin NfcModule.simulateNfcTag() which builds a real Android NdefMessage
  const handleSimulateNativeTag = (presetKey: string) => {
    setSelectedPreset(presetKey);
    NfcModule.simulateNfcTag(presetKey);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.headerRow}>
        {onBack && (
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backBtnText}>‹ Back</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>NFC Tag Reader</Text>
          <Text style={styles.subtitle}>
            Exercise 1 — Turbo Native Module (NfcModule.kt)
          </Text>
        </View>
      </View>

      {/* Active Listener Status Banner */}
      <View style={styles.statusCard}>
        <Animated.View
          style={[styles.radarCircle, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.radarIcon}>📡</Text>
        </Animated.View>
        <View style={styles.statusInfo}>
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.dot,
                { backgroundColor: isListening ? '#22C55E' : '#94A3B8' },
              ]}
            />
            <Text style={styles.statusHeading}>
              {isListening
                ? 'NFC Event Listener Active'
                : 'NFC Listener Paused'}
            </Text>
          </View>
          <Text style={styles.statusSub}>
            {isListening
              ? 'Ready to receive NFC tag taps or Native NdefMessage events.'
              : 'Tap Resume to re-enable NfcModule listener.'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.scanToggleBtn, !isListening && styles.scanResumeBtn]}
          onPress={handleToggleScan}>
          <Text style={styles.scanToggleText}>
            {isListening ? 'Pause' : 'Resume'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Native Android NdefMessage Trigger (for Emulator & Demo Verification) */}
      <View style={styles.simCard}>
        <Text style={styles.simTitle}>
          🧪 Native Android NdefMessage & NdefRecord Simulator
        </Text>
        <Text style={styles.simDesc}>
          Invokes NfcModule.simulateNfcTag() in Kotlin to construct an official
          android.nfc.NdefMessage, parse its NdefRecords, and emit
          &quot;NfcTagDetected&quot; to React Native:
        </Text>

        <View style={styles.presetGrid}>
          {NATIVE_NDEF_PRESETS.map(p => {
            const active = selectedPreset === p.key;
            return (
              <TouchableOpacity
                key={p.key}
                style={[styles.presetBtn, active && styles.presetBtnActive]}
                onPress={() => handleSimulateNativeTag(p.key)}>
                <Text
                  style={[
                    styles.presetLabel,
                    active && styles.presetLabelActive,
                  ]}>
                  {p.label}
                </Text>
                <Text style={styles.presetSub}>{p.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Retrieved NFC Tag Data Display */}
      {tagData ? (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>🏷️ NFC Tag Data Retrieved</Text>
            {lastTimestamp ? (
              <Text style={styles.timestamp}>{lastTimestamp}</Text>
            ) : null}
          </View>

          <InfoRow label="Tag UID" value={tagData.tagId} mono />
          <InfoRow
            label="Source"
            value={tagData.source || 'Turbo Native Module (NfcModule)'}
          />
          <InfoRow label="Tech List" value={tagData.techList} mono />

          {tagData.ndef ? (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionHeader}>
                NDEF Message ({tagData.ndef.records.length} Record
                {tagData.ndef.records.length > 1 ? 's' : ''})
              </Text>
              <InfoRow
                label="Capacity"
                value={`${tagData.ndef.maxSize} bytes`}
              />
              <InfoRow
                label="Writable"
                value={tagData.ndef.isWritable ? 'Yes (Read/Write)' : 'Read-Only'}
              />

              {tagData.ndef.records.map((rec, index) => (
                <View key={index} style={styles.recordBox}>
                  <View style={styles.recordHeaderRow}>
                    <Text style={styles.recordTitle}>
                      NDEF Record #{index + 1}
                    </Text>
                    {rec.byteLength !== undefined && (
                      <Text style={styles.byteBadge}>
                        {rec.byteLength} bytes
                      </Text>
                    )}
                  </View>
                  <InfoRow label="TNF" value={rec.tnf} mono />
                  <InfoRow label="Record Type" value={rec.type || '(empty)'} mono />
                  <InfoRow
                    label="Decoded Payload"
                    value={rec.payload}
                    mono
                    highlight
                  />
                </View>
              ))}
            </>
          ) : (
            <Text style={styles.emptyNdef}>
              No NDEF message found on this tag.
            </Text>
          )}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📲</Text>
          <Text style={styles.emptyTitle}>Waiting for NFC Tag...</Text>
          <Text style={styles.emptyDesc}>
            Place an NFC tag near the phone, inject an NDEF_DISCOVERED intent
            via ADB, or tap one of the Native NdefMessage presets above.
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const InfoRow: React.FC<{
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}> = ({ label, value, mono, highlight }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}:</Text>
    <Text
      selectable
      style={[
        styles.infoValue,
        mono && styles.monoText,
        highlight && styles.highlightText,
      ]}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    padding: 16,
    paddingBottom: 36,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  backBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  backBtnText: {
    color: '#E2E8F0',
    fontWeight: '700',
    fontSize: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  subtitle: {
    fontSize: 12,
    color: '#38BDF8',
    marginTop: 2,
  },

  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 14,
  },
  radarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0F172A',
    borderWidth: 2,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radarIcon: {
    fontSize: 24,
  },
  statusInfo: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  statusSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 3,
    lineHeight: 16,
  },
  scanToggleBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  scanResumeBtn: {
    backgroundColor: '#16A34A',
  },
  scanToggleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  simCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 14,
  },
  simTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#38BDF8',
    marginBottom: 4,
  },
  simDesc: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
    marginBottom: 12,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetBtn: {
    width: '48%',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  presetBtnActive: {
    borderColor: '#38BDF8',
    backgroundColor: '#0C2D48',
  },
  presetLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  presetLabelActive: {
    color: '#38BDF8',
  },
  presetSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },

  resultCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4ADE80',
  },
  timestamp: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: 'monospace',
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 10,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38BDF8',
    marginBottom: 8,
  },
  recordBox: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  recordHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  recordTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38BDF8',
  },
  byteBadge: {
    fontSize: 10,
    color: '#94A3B8',
    backgroundColor: '#1E293B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  infoLabel: {
    width: 112,
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  infoValue: {
    flex: 1,
    fontSize: 12,
    color: '#F1F5F9',
  },
  monoText: {
    fontFamily: 'monospace',
  },
  highlightText: {
    color: '#4ADE80',
    fontWeight: '700',
  },
  emptyNdef: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 8,
  },

  emptyCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E2E8F0',
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default NfcScreen;
