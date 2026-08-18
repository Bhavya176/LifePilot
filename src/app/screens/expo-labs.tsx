import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Updates from 'expo-updates';
import * as Battery from 'expo-battery';
import * as Device from 'expo-device';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../context/ThemeContext';
import { useSecurity } from '../../context/SecurityContext';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { Header } from '../../components/ui/Header';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { HapticsService } from '../../services/hapticsService';
import { SecureStoreService } from '../../services/secureStoreService';
import { LocalNotificationService } from '../../services/localNotificationService';
import { s, vs, ms, fs } from '../../utils/responsive';

export default function ExpoLabsScreen() {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? COLORS.dark : COLORS.light;
  const { authenticateWithBiometrics } = useSecurity();

  // EAS & Updates State
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string>('Idle');

  // Battery & Device State
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [batteryState, setBatteryState] = useState<string>('Unknown');
  const [isLowPower, setIsLowPower] = useState<boolean>(false);

  // SecureStore State
  const [secureKey, setSecureKey] = useState('auth_secret_token');
  const [secureValue, setSecureValue] = useState('SuperSecretValue123!@#');
  const [retrievedValue, setRetrievedValue] = useState<string | null>(null);

  // Clipboard State
  const [clipboardText, setClipboardText] = useState<string>('');

  useEffect(() => {
    loadHardwareDiagnostics();
  }, []);

  const loadHardwareDiagnostics = async () => {
    try {
      if (Platform.OS !== 'web') {
        const level = await Battery.getBatteryLevelAsync();
        setBatteryLevel(level !== -1 ? Math.round(level * 100) : null);

        const state = await Battery.getBatteryStateAsync();
        const stateMap: Record<number, string> = {
          [Battery.BatteryState.UNKNOWN]: 'Unknown',
          [Battery.BatteryState.UNPLUGGED]: 'Unplugged (On Battery)',
          [Battery.BatteryState.CHARGING]: 'Charging ⚡',
          [Battery.BatteryState.FULL]: '100% Fully Charged',
        };
        setBatteryState(stateMap[state] || 'Unknown');

        const lowPower = await Battery.isLowPowerModeEnabledAsync();
        setIsLowPower(lowPower);
      }
    } catch (e) {
      console.warn('Battery diagnostics error:', e);
    }
  };

  // --- EAS OTA Update Handler ---
  const handleCheckUpdate = async () => {
    await HapticsService.medium();
    setCheckingUpdate(true);
    setUpdateStatus('Checking for EAS update...');

    try {
      if (!Updates.isEnabled) {
        setUpdateStatus('Updates disabled in Development / Expo Go mode.');
        Alert.alert(
          'EAS Update Info',
          'EAS OTA updates run in standalone builds (preview APK / production IPA). In development mode, changes load via hot reload automatically.',
          [{ text: 'OK' }]
        );
        setCheckingUpdate(false);
        return;
      }

      const check = await Updates.checkForUpdateAsync();
      if (check.isAvailable) {
        setUpdateStatus('New update found! Downloading...');
        await Updates.fetchUpdateAsync();
        setUpdateStatus('Update downloaded! Ready to reload.');
        await HapticsService.success();
        Alert.alert(
          'Update Ready 🚀',
          'A new OTA update has been downloaded. Restart the app now to apply changes?',
          [
            { text: 'Later', style: 'cancel' },
            {
              text: 'Restart Now',
              onPress: async () => {
                await Updates.reloadAsync();
              },
            },
          ]
        );
      } else {
        setUpdateStatus('App is already up to date!');
        await HapticsService.success();
        Alert.alert('Up to Date', 'You are running the latest version of LifePilot.');
      }
    } catch (err: any) {
      setUpdateStatus(`Check failed: ${err.message}`);
      await HapticsService.error();
      Alert.alert('Update Error', err.message || 'Unable to check for updates.');
    } finally {
      setCheckingUpdate(false);
    }
  };

  // --- SecureStore Handlers ---
  const handleSaveSecure = async () => {
    await HapticsService.medium();
    if (!secureKey || !secureValue) {
      Alert.alert('Input Required', 'Please provide both key and value.');
      return;
    }
    const success = await SecureStoreService.setItem(secureKey, secureValue);
    if (success) {
      await HapticsService.success();
      Alert.alert('Saved to KeyStore', `Encrypted "${secureKey}" saved into hardware storage.`);
    } else {
      await HapticsService.error();
      Alert.alert('Error', 'Failed to write to secure storage.');
    }
  };

  const handleReadSecure = async () => {
    await HapticsService.medium();
    const val = await SecureStoreService.getItem(secureKey);
    setRetrievedValue(val);
    if (val !== null) {
      await HapticsService.success();
      Alert.alert('Decrypted Value', `Found value for "${secureKey}":\n\n${val}`);
    } else {
      await HapticsService.warning();
      Alert.alert('Not Found', `No secure entry found for "${secureKey}".`);
    }
  };

  const handleDeleteSecure = async () => {
    await HapticsService.heavy();
    const success = await SecureStoreService.deleteItem(secureKey);
    if (success) {
      setRetrievedValue(null);
      await HapticsService.success();
      Alert.alert('Deleted', `Entry "${secureKey}" was safely deleted from KeyStore.`);
    }
  };

  // --- Local Notifications Handlers ---
  const handleInstantNotification = async () => {
    try {
      await HapticsService.medium();
      await LocalNotificationService.triggerInstantNotification(
        'LifePilot Live Alert 🎯',
        'This is a local hardware notification tested with Expo SDK 57!',
        { type: 'test' }
      );
      await HapticsService.success();
      Alert.alert('Notification Sent', 'Check your device notification tray.');
    } catch (e: any) {
      await HapticsService.error();
      Alert.alert('Notification Error', e.message || 'Failed to trigger notification.');
    }
  };

  const handleSchedule5sNotification = async () => {
    try {
      await HapticsService.medium();
      await LocalNotificationService.scheduleNotification(
        'LifePilot 5s Alarm ⏰',
        '5 seconds elapsed! Your scheduled notification test was successful.',
        5
      );
      await HapticsService.success();
      Alert.alert('Scheduled ⏰', 'Notification scheduled in 5 seconds. Lock your phone or check tray!');
    } catch (e: any) {
      await HapticsService.error();
      Alert.alert('Notification Error', e.message || 'Failed to schedule notification.');
    }
  };

  // --- Clipboard & Sharing ---
  const handleCopyClipboard = async (text: string) => {
    await HapticsService.light();
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied to Clipboard 📋', text);
  };

  const handleReadClipboard = async () => {
    await HapticsService.light();
    const text = await Clipboard.getStringAsync();
    setClipboardText(text);
    Alert.alert('Clipboard Content', text ? `"${text}"` : 'Clipboard is empty.');
  };

  const handleShareNative = async () => {
    await HapticsService.medium();
    try {
      await Share.share({
        message: 'Exploring LifePilot Expo & EAS Testing Suite on Expo SDK 57! 🚀',
        title: 'LifePilot Diagnostics',
      });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title="Expo & EAS Labs"
        subtitle="Native Features & Testing Hub"
        showBack
        isDarkMode={isDarkMode}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Banner */}
        <View style={[styles.banner, { backgroundColor: theme.primaryLight, borderColor: theme.primary }]}>
          <Ionicons name="flask" size={24} color={theme.primary} />
          <View style={{ flex: 1, marginLeft: s(SPACING.sm) }}>
            <Text style={[styles.bannerTitle, { color: theme.textPrimary }]}>
              Free-Tier Expo & EAS Testing Suite
            </Text>
            <Text style={[styles.bannerSub, { color: theme.textSecondary }]}>
              Test OTA updates, haptics, hardware diagnostics, local notifications & secure storage.
            </Text>
          </View>
        </View>

        {/* SECTION 1: EAS OTA UPDATES */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          🔄 EAS Over-The-Air (OTA) Updates
        </Text>
        <Card isDarkMode={isDarkMode}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>EAS Updates Status</Text>
            <Badge
              label={Updates.isEnabled ? 'Active (OTA Ready)' : 'Dev / Hot-Reload'}
              variant={Updates.isEnabled ? 'success' : 'primary'}
              isDarkMode={isDarkMode}
            />
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Runtime Policy</Text>
            <Text style={[styles.infoVal, { color: theme.textPrimary }]}>
              {Updates.runtimeVersion || 'appVersion (1.0.0)'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Channel / Branch</Text>
            <Text style={[styles.infoVal, { color: theme.textPrimary }]}>
              {Updates.channel || 'development'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Current Update ID</Text>
            <Text
              style={[styles.infoVal, { color: theme.primary, maxWidth: s(150) }]}
              numberOfLines={1}
            >
              {Updates.updateId || 'Embedded Base Binary'}
            </Text>
          </View>

          <View style={styles.statusBox}>
            <Text style={[styles.statusText, { color: theme.textSecondary }]}>
              Status: <Text style={{ color: theme.textPrimary, fontWeight: '700' }}>{updateStatus}</Text>
            </Text>
          </View>

          <Button
            title="Check for EAS OTA Update"
            variant="primary"
            loading={checkingUpdate}
            isDarkMode={isDarkMode}
            icon={<Ionicons name="cloud-download-outline" size={18} color="#FFFFFF" />}
            onPress={handleCheckUpdate}
            style={{ marginTop: vs(SPACING.sm) }}
          />
        </Card>

        {/* SECTION 2: HAPTICS FEEDBACK */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          📳 Haptics & Vibration Laboratory
        </Text>
        <Card isDarkMode={isDarkMode}>
          <Text style={[styles.subLabel, { color: theme.textSecondary }]}>
            Tap any button to feel the physical hardware vibration response:
          </Text>

          <Text style={[styles.groupTitle, { color: theme.textPrimary }]}>Impact Styles</Text>
          <View style={styles.btnRow}>
            <Button
              title="Light"
              size="sm"
              variant="secondary"
              isDarkMode={isDarkMode}
              onPress={() => HapticsService.light()}
              style={styles.flexBtn}
            />
            <Button
              title="Medium"
              size="sm"
              variant="secondary"
              isDarkMode={isDarkMode}
              onPress={() => HapticsService.medium()}
              style={styles.flexBtn}
            />
            <Button
              title="Heavy"
              size="sm"
              variant="secondary"
              isDarkMode={isDarkMode}
              onPress={() => HapticsService.heavy()}
              style={styles.flexBtn}
            />
          </View>

          <Text style={[styles.groupTitle, { color: theme.textPrimary, marginTop: vs(SPACING.sm) }]}>
            Notification Vibrations
          </Text>
          <View style={styles.btnRow}>
            <Button
              title="Success"
              size="sm"
              variant="success"
              isDarkMode={isDarkMode}
              onPress={() => HapticsService.success()}
              style={styles.flexBtn}
            />
            <Button
              title="Warning"
              size="sm"
              variant="secondary"
              isDarkMode={isDarkMode}
              onPress={() => HapticsService.warning()}
              style={styles.flexBtn}
            />
            <Button
              title="Error"
              size="sm"
              variant="danger"
              isDarkMode={isDarkMode}
              onPress={() => HapticsService.error()}
              style={styles.flexBtn}
            />
          </View>
        </Card>

        {/* SECTION 3: DEVICE & BATTERY SENSORS */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          🔋 Live Device & Hardware Diagnostics
        </Text>
        <Card isDarkMode={isDarkMode}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Device Name / Model</Text>
            <Text style={[styles.infoVal, { color: theme.textPrimary }]}>
              {Device.modelName || Device.deviceName || 'Simulator / Dev Device'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>OS & Version</Text>
            <Text style={[styles.infoVal, { color: theme.textPrimary }]}>
              {Device.osName} {Device.osVersion}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Physical Hardware</Text>
            <Badge
              label={Device.isDevice ? 'Real Device' : 'Simulator / Emulator'}
              variant={Device.isDevice ? 'success' : 'primary'}
              isDarkMode={isDarkMode}
            />
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Battery Level</Text>
            <Text style={[styles.infoVal, { color: theme.primary, fontWeight: '700' }]}>
              {batteryLevel !== null ? `${batteryLevel}%` : 'N/A (Simulator)'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Battery State</Text>
            <Text style={[styles.infoVal, { color: theme.textPrimary }]}>{batteryState}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Low Power Mode</Text>
            <Badge
              label={isLowPower ? 'ON (Saving)' : 'OFF (Normal)'}
              variant={isLowPower ? 'danger' : 'primary'}
              isDarkMode={isDarkMode}
            />
          </View>

          <Button
            title="Refresh Diagnostics"
            size="sm"
            variant="outline"
            isDarkMode={isDarkMode}
            icon={<Ionicons name="refresh" size={16} color={theme.primary} />}
            onPress={loadHardwareDiagnostics}
            style={{ marginTop: vs(SPACING.sm) }}
          />
        </Card>

        {/* SECTION 4: HARDWARE KEYSTORE (SECURE STORE) */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          🔐 Hardware SecureStore (iOS Keychain / Android KeyStore)
        </Text>
        <Card isDarkMode={isDarkMode}>
          <Text style={[styles.subLabel, { color: theme.textSecondary }]}>
            Values are encrypted with device hardware-backed keys.
          </Text>

          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Storage Key:</Text>
          <TextInput
            value={secureKey}
            onChangeText={setSecureKey}
            placeholder="Key name"
            placeholderTextColor={theme.textMuted}
            style={[styles.input, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.inputBg }]}
          />

          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Secret Value to Encrypt:</Text>
          <TextInput
            value={secureValue}
            onChangeText={setSecureValue}
            placeholder="Secret value"
            placeholderTextColor={theme.textMuted}
            style={[styles.input, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.inputBg }]}
          />

          <View style={styles.btnRow}>
            <Button
              title="Save Encrypted"
              size="sm"
              variant="primary"
              isDarkMode={isDarkMode}
              onPress={handleSaveSecure}
              style={styles.flexBtn}
            />
            <Button
              title="Read Value"
              size="sm"
              variant="outline"
              isDarkMode={isDarkMode}
              onPress={handleReadSecure}
              style={styles.flexBtn}
            />
            <Button
              title="Delete"
              size="sm"
              variant="danger"
              isDarkMode={isDarkMode}
              onPress={handleDeleteSecure}
              style={styles.flexBtn}
            />
          </View>

          {retrievedValue !== null && (
            <View style={[styles.resultBox, { backgroundColor: theme.primaryLight }]}>
              <Text style={[styles.resultLabel, { color: theme.primary }]}>Decrypted Output:</Text>
              <Text style={[styles.resultVal, { color: theme.textPrimary }]}>{retrievedValue}</Text>
            </View>
          )}
        </Card>

        {/* SECTION 5: LOCAL NOTIFICATIONS & BIOMETRICS */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          🔔 Notifications & Biometrics Sandbox
        </Text>
        <Card isDarkMode={isDarkMode}>
          <Text style={[styles.subLabel, { color: theme.textSecondary }]}>
            Test hardware local alerts without needing an external notification server:
          </Text>

          <View style={{ gap: vs(SPACING.xs + 2), marginTop: vs(SPACING.xs) }}>
            <Button
              title="Trigger Instant Local Alert"
              variant="secondary"
              isDarkMode={isDarkMode}
              icon={<Ionicons name="notifications-outline" size={18} color={theme.textPrimary} />}
              onPress={handleInstantNotification}
            />
            <Button
              title="Schedule 5s Delay Notification"
              variant="outline"
              isDarkMode={isDarkMode}
              icon={<Ionicons name="timer-outline" size={18} color={theme.primary} />}
              onPress={handleSchedule5sNotification}
            />
            <Button
              title="Prompt Biometrics (Face ID / Fingerprint)"
              variant="primary"
              isDarkMode={isDarkMode}
              icon={<Ionicons name="finger-print-outline" size={18} color="#FFFFFF" />}
              onPress={async () => {
                await HapticsService.medium();
                const authed = await authenticateWithBiometrics('Testing Face ID / Fingerprint Prompt');
                if (authed) {
                  await HapticsService.success();
                  Alert.alert('Authenticated! ✅', 'Biometric identity successfully verified.');
                } else {
                  await HapticsService.error();
                  Alert.alert('Not Authenticated', 'Biometric check cancelled or failed.');
                }
              }}
            />
          </View>
        </Card>

        {/* SECTION 6: SYSTEM CLIPBOARD & NATIVE SHARE */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          📋 Native Clipboard & System Share
        </Text>
        <Card isDarkMode={isDarkMode}>
          <View style={styles.btnRow}>
            <Button
              title="Copy Sample Text"
              size="sm"
              variant="secondary"
              isDarkMode={isDarkMode}
              onPress={() => handleCopyClipboard('LifePilot Token: ' + Date.now())}
              style={styles.flexBtn}
            />
            <Button
              title="Read Clipboard"
              size="sm"
              variant="secondary"
              isDarkMode={isDarkMode}
              onPress={handleReadClipboard}
              style={styles.flexBtn}
            />
            <Button
              title="Native Share"
              size="sm"
              variant="primary"
              isDarkMode={isDarkMode}
              onPress={handleShareNative}
              style={styles.flexBtn}
            />
          </View>
        </Card>

        <View style={{ height: vs(SPACING.xxl) }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: s(SPACING.md),
    paddingBottom: vs(SPACING.xl),
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: s(SPACING.md),
    borderRadius: ms(RADIUS.lg),
    borderWidth: 1,
    marginVertical: vs(SPACING.sm),
  },
  bannerTitle: {
    fontSize: fs(15),
    fontWeight: '700',
  },
  bannerSub: {
    fontSize: fs(12),
    marginTop: vs(2),
  },
  sectionTitle: {
    fontSize: fs(15),
    fontWeight: '700',
    marginTop: vs(SPACING.md),
    marginBottom: vs(SPACING.xs),
    letterSpacing: 0.2,
  },
  subLabel: {
    fontSize: fs(13),
    marginBottom: vs(SPACING.sm),
    lineHeight: fs(18),
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: vs(SPACING.xs + 2),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.15)',
  },
  infoLabel: {
    fontSize: fs(13),
    fontWeight: '500',
  },
  infoVal: {
    fontSize: fs(13),
    fontWeight: '600',
  },
  statusBox: {
    paddingVertical: vs(SPACING.xs + 2),
    marginTop: vs(SPACING.xs),
  },
  statusText: {
    fontSize: fs(13),
  },
  groupTitle: {
    fontSize: fs(13),
    fontWeight: '600',
    marginBottom: vs(SPACING.xs),
  },
  btnRow: {
    flexDirection: 'row',
    gap: s(SPACING.xs),
    marginVertical: vs(SPACING.xs),
  },
  flexBtn: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: fs(12),
    fontWeight: '600',
    marginTop: vs(SPACING.xs),
    marginBottom: vs(4),
  },
  input: {
    borderWidth: 1,
    borderRadius: ms(RADIUS.md),
    paddingHorizontal: s(SPACING.sm + 4),
    paddingVertical: vs(SPACING.xs + 4),
    fontSize: fs(13),
    marginBottom: vs(SPACING.xs),
  },
  resultBox: {
    marginTop: vs(SPACING.sm),
    padding: s(SPACING.sm),
    borderRadius: ms(RADIUS.md),
  },
  resultLabel: {
    fontSize: fs(12),
    fontWeight: '700',
  },
  resultVal: {
    fontSize: fs(13),
    fontWeight: '600',
    marginTop: vs(2),
  },
});
