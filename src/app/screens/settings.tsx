import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  } from 'react-native';
import React from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuthContext } from '../../context/AuthContext';
import { useNetwork } from '../../context/NetworkContext';
import { useSecurity } from '../../context/SecurityContext';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Header } from '../../components/ui/Header';
import { Button } from '../../components/ui/Button';
import { checkFirebaseStatus } from '../../firebase/config';
import { useRemoteConfig } from '../../hooks/useRemoteConfig';
import { CrashlyticsService } from '../../firebase/crashlytics';
import { getAppCheckStatus } from '../../firebase/appCheck';
import { s, vs, ms, fs } from '../../utils/responsive';

export default function SettingsScreen() {
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useTheme();
  const { signOut } = useAuthContext();
  const { isOnline, isOfflineModeManual, toggleOfflineMode } = useNetwork();
  const { isBiometricSupported, isBiometricEnabled, toggleBiometric } = useSecurity();
  const { config: remoteCfg } = useRemoteConfig();
  const theme = isDarkMode ? COLORS.dark : COLORS.light;
  const fbStatus = checkFirebaseStatus();
  const appCheckStatus = getAppCheckStatus();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of LifePilot?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/welcome');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title="Settings" showBack isDarkMode={isDarkMode} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Appearance Settings */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Appearance</Text>
        <Card isDarkMode={isDarkMode}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="moon-outline" size={22} color={theme.primary} />
              <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: '#94A3B8', true: theme.primary }}
            />
          </View>
        </Card>

        {/* Biometric App & Vault Lock */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginTop: vs(SPACING.lg) }]}>
          Security & Privacy
        </Text>
        <Card isDarkMode={isDarkMode}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="finger-print-outline" size={22} color={theme.accent} />
              <View style={{ marginLeft: s(SPACING.sm) }}>
                <Text style={[styles.settingLabel, { color: theme.textPrimary, marginLeft: 0 }]}>
                  Biometric App Lock
                </Text>
                <Text style={{ fontSize: fs(11), color: theme.textSecondary, marginTop: vs(2) }}>
                  Face ID / Fingerprint protection for Document Vault
                </Text>
              </View>
            </View>
            <Switch
              value={isBiometricEnabled}
              onValueChange={() => {
                toggleBiometric();
              }}
              trackColor={{ false: '#94A3B8', true: theme.accent }}
            />
          </View>
        </Card>

        {/* Firebase Core Connection Status Section (Phase 2) */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginTop: SPACING.lg }]}>
          Firebase Core Connection Status
        </Text>
        <Card isDarkMode={isDarkMode}>
          <View style={styles.configRow}>
            <Text style={[styles.configKey, { color: theme.textSecondary }]}>SDK Initialized:</Text>
            <Text style={[styles.configVal, { color: fbStatus.isInitialized ? theme.success : theme.danger }]}>
              {fbStatus.isInitialized ? 'Active (Singleton)' : 'Failed'}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.configRow}>
            <Text style={[styles.configKey, { color: theme.textSecondary }]}>Project ID:</Text>
            <Text style={[styles.configVal, { color: theme.primary }]}>{fbStatus.projectId}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.configRow}>
            <Text style={[styles.configKey, { color: theme.textSecondary }]}>Auth Persistence:</Text>
            <Text style={[styles.configVal, { color: theme.success }]}>AsyncStorage (RN)</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.configRow}>
            <Text style={[styles.configKey, { color: theme.textSecondary }]}>Runtime Platform:</Text>
            <Text style={[styles.configVal, { color: theme.accent }]}>{fbStatus.platform.toUpperCase()}</Text>
          </View>
        </Card>

        {/* Offline Persistence & Network Mode Section */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginTop: vs(SPACING.lg) }]}>
          Offline Persistence & Data Sync
        </Text>
        <Card isDarkMode={isDarkMode}>
          <View style={styles.configRow}>
            <Text style={[styles.configKey, { color: theme.textSecondary }]}>Firestore Local Cache:</Text>
            <Text style={[styles.configVal, { color: theme.success }]}>Persistent (IndexedDB/RN)</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.configRow}>
            <Text style={[styles.configKey, { color: theme.textSecondary }]}>Current Network State:</Text>
            <Text style={[styles.configVal, { color: isOnline ? theme.success : theme.warning }]}>
              {isOnline ? 'Online (Live Cloud Sync)' : 'Offline (Local Cache Only)'}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <View>
              <Text style={[styles.settingLabel, { color: theme.textPrimary, marginLeft: 0 }]}>
                Simulate Offline Mode (Dev Test)
              </Text>
              <Text style={{ fontSize: fs(11), color: theme.textSecondary, marginTop: vs(2) }}>
                Test creating tasks/notes without internet
              </Text>
            </View>
            <Switch
              value={isOfflineModeManual}
              onValueChange={toggleOfflineMode}
              trackColor={{ false: '#CBD5E1', true: theme.warning }}
              thumbColor="#FFFFFF"
            />
          </View>
        </Card>

        {/* Firebase App Check Security Section (Phase 10) */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginTop: vs(SPACING.lg) }]}>
          Firebase App Check Protection
        </Text>
        <Card isDarkMode={isDarkMode}>
          <View style={styles.configRow}>
            <Text style={[styles.configKey, { color: theme.textSecondary }]}>Status:</Text>
            <Text style={[styles.configVal, { color: theme.success }]}>Protected (Attested)</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.configRow}>
            <Text style={[styles.configKey, { color: theme.textSecondary }]}>Active Provider:</Text>
            <Text style={[styles.configVal, { color: theme.primary }]}>
              {appCheckStatus.providerName}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.configRow}>
            <Text style={[styles.configKey, { color: theme.textSecondary }]}>Debug Mode:</Text>
            <Text style={[styles.configVal, { color: theme.accent }]}>
              {appCheckStatus.isDevelopmentMode ? 'Enabled (Dev Token)' : 'Production'}
            </Text>
          </View>
        </Card>

        {/* Remote Config Status Section */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginTop: SPACING.lg }]}>
          Firebase Remote Config Flags
        </Text>
        <Card isDarkMode={isDarkMode}>
          <View style={styles.configRow}>
            <Text style={[styles.configKey, { color: theme.textSecondary }]}>maintenance_mode:</Text>
            <Text style={[styles.configVal, { color: remoteCfg.maintenance_mode ? theme.danger : theme.success }]}>
              {String(remoteCfg.maintenance_mode)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.configRow}>
            <Text style={[styles.configKey, { color: theme.textSecondary }]}>daily_quote_enabled:</Text>
            <Text style={[styles.configVal, { color: theme.success }]}>
              {String(remoteCfg.daily_quote_enabled)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.configRow}>
            <Text style={[styles.configKey, { color: theme.textSecondary }]}>max_free_documents:</Text>
            <Text style={[styles.configVal, { color: theme.primary }]}>
              {remoteCfg.max_free_documents} docs
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.configRow}>
            <Text style={[styles.configKey, { color: theme.textSecondary }]}>show_new_feature_banner:</Text>
            <Text style={[styles.configVal, { color: theme.accent }]}>
              {String(remoteCfg.show_new_feature_banner)}
            </Text>
          </View>
        </Card>

        {/* Firebase Crashlytics & Diagnostics Section */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginTop: SPACING.lg }]}>
          Crash Reporting & Error Testing
        </Text>
        <Card isDarkMode={isDarkMode}>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => {
              Alert.alert(
                'Generate Test Error',
                'This will throw a deliberate test exception caught by ErrorBoundary & Crashlytics.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Generate Error',
                    style: 'destructive',
                    onPress: () => CrashlyticsService.generateTestCrash(),
                  },
                ]
              );
            }}
          >
            <Ionicons name="bug-outline" size={22} color={theme.danger} />
            <Text style={[styles.linkLabel, { color: theme.danger }]}>Trigger Test Error (Dev Mode)</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
          </TouchableOpacity>
        </Card>

        {/* Account & About Links */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginTop: SPACING.lg }]}>
          Application & Legal
        </Text>
        <Card isDarkMode={isDarkMode}>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => router.push('/screens/about')}
          >
            <Ionicons name="information-circle-outline" size={22} color={theme.info} />
            <Text style={[styles.linkLabel, { color: theme.textPrimary }]}>About LifePilot</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => router.push('/screens/privacy')}
          >
            <Ionicons name="shield-outline" size={22} color={theme.accent} />
            <Text style={[styles.linkLabel, { color: theme.textPrimary }]}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
          </TouchableOpacity>
        </Card>

        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: theme.textMuted }]}>
            LifePilot v1.0.0 (Expo SDK 57)
          </Text>
        </View>

        <Button
          title="Sign Out"
          variant="danger"
          onPress={handleLogout}
          isDarkMode={isDarkMode}
          size="lg"
          style={{ marginTop: SPACING.md }}
        />
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
  sectionTitle: {
    fontSize: fs(16),
    fontWeight: '700',
    marginBottom: vs(SPACING.xs),
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: vs(SPACING.xs),
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: fs(15),
    fontWeight: '600',
    marginLeft: s(SPACING.sm),
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: vs(SPACING.xs),
  },
  configKey: {
    fontSize: fs(13),
    fontFamily: 'monospace',
  },
  configVal: {
    fontSize: fs(13),
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(SPACING.xs + 2),
  },
  linkLabel: {
    flex: 1,
    fontSize: fs(15),
    fontWeight: '600',
    marginLeft: s(SPACING.sm),
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: vs(SPACING.xs),
  },
  versionContainer: {
    alignItems: 'center',
    marginVertical: vs(SPACING.lg),
  },
  versionText: {
    fontSize: fs(12),
  },
});
