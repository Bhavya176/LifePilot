import React, { useEffect, useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  BackHandler,
  AppState,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { s, vs, ms, fs } from '../../utils/responsive';
import { HapticsService } from '../../services/hapticsService';
import { useRemoteConfig } from '../../hooks/useRemoteConfig';
import {
  evaluateAppVersion,
  openStorePage,
  UpdateEvaluation,
  getCurrentAppVersion,
} from '../../utils/versionCheck';

interface AppUpdateModalProps {
  /** Optional override for testing in Expo Labs or Settings */
  simulatedEvaluation?: UpdateEvaluation | null;
  onDismissSimulation?: () => void;
}

export const AppUpdateModal: React.FC<AppUpdateModalProps> = ({
  simulatedEvaluation,
  onDismissSimulation,
}) => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? COLORS.dark : COLORS.light;
  const { config, refetchConfig } = useRemoteConfig();

  const [dismissedSoftUpdate, setDismissedSoftUpdate] = useState(false);
  const [retryingMaintenance, setRetryingMaintenance] = useState(false);

  // Evaluate current version vs remote configuration
  const realEvaluation = evaluateAppVersion(config);
  const evaluation = simulatedEvaluation || realEvaluation;

  const isForceUpdate = evaluation.status === 'FORCE_UPDATE';
  const isSoftUpdate = evaluation.status === 'SOFT_UPDATE';
  const isMaintenance = evaluation.status === 'MAINTENANCE';

  const isVisible =
    (isForceUpdate || isMaintenance || (isSoftUpdate && !dismissedSoftUpdate)) &&
    evaluation.status !== 'UP_TO_DATE';

  // Automatically re-check version whenever the app returns from background to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        refetchConfig().catch(() => {});
      }
    });
    return () => subscription.remove();
  }, [refetchConfig]);

  // Prevent Android hardware back button from dismissing a Force Update or Maintenance modal
  useEffect(() => {
    if (isVisible && (isForceUpdate || isMaintenance)) {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        HapticsService.warning().catch(() => {});
        return true; // Block hardware back button
      });
      return () => backHandler.remove();
    }
  }, [isVisible, isForceUpdate, isMaintenance]);

  const handleUpdatePress = async () => {
    await HapticsService.medium();
    await openStorePage(evaluation.storeUrl);
  };

  const handleDismissSoftUpdate = async () => {
    await HapticsService.light();
    if (onDismissSimulation) {
      onDismissSimulation();
    } else {
      setDismissedSoftUpdate(true);
    }
  };

  const handleRetryMaintenance = async () => {
    setRetryingMaintenance(true);
    await HapticsService.light();
    try {
      await refetchConfig();
    } catch {
      // Ignored
    } finally {
      setTimeout(() => setRetryingMaintenance(false), 800);
    }
  };

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        if (isSoftUpdate) {
          handleDismissSoftUpdate();
        }
      }}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDarkMode ? '#131927' : '#FFFFFF',
              borderColor: isForceUpdate
                ? '#EF4444'
                : isMaintenance
                ? '#F59E0B'
                : theme.border,
            },
          ]}
        >
          {/* Header Icon & Badges */}
          <View style={styles.iconContainer}>
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: isForceUpdate
                    ? 'rgba(239, 68, 68, 0.15)'
                    : isMaintenance
                    ? 'rgba(245, 158, 11, 0.15)'
                    : 'rgba(99, 102, 241, 0.15)',
                },
              ]}
            >
              <Ionicons
                name={
                  isForceUpdate
                    ? 'alert-circle-outline'
                    : isMaintenance
                    ? 'construct-outline'
                    : 'rocket-outline'
                }
                size={ms(38)}
                color={
                  isForceUpdate
                    ? '#EF4444'
                    : isMaintenance
                    ? '#F59E0B'
                    : theme.primary
                }
              />
            </View>

            <View
              style={[
                styles.badge,
                {
                  backgroundColor: isForceUpdate
                    ? 'rgba(239, 68, 68, 0.2)'
                    : isMaintenance
                    ? 'rgba(245, 158, 11, 0.2)'
                    : 'rgba(16, 185, 129, 0.2)',
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  {
                    color: isForceUpdate
                      ? '#EF4444'
                      : isMaintenance
                      ? '#F59E0B'
                      : '#10B981',
                  },
                ]}
              >
                {isForceUpdate
                  ? 'CRITICAL UPDATE'
                  : isMaintenance
                  ? 'MAINTENANCE MODE'
                  : 'NEW VERSION AVAILABLE'}
              </Text>
            </View>
          </View>

          {/* Title & Description */}
          <Text style={[styles.title, { color: theme.text }]}>
            {evaluation.title}
          </Text>

          <Text style={[styles.message, { color: theme.textSecondary }]}>
            {evaluation.message}
          </Text>

          {/* Version Pill Info */}
          {!isMaintenance && (
            <View
              style={[
                styles.versionRow,
                { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' },
              ]}
            >
              <View style={styles.versionCol}>
                <Text style={[styles.versionLabel, { color: theme.textMuted }]}>
                  Current
                </Text>
                <Text style={[styles.versionValue, { color: theme.textSecondary }]}>
                  v{evaluation.currentVersion || getCurrentAppVersion()}
                </Text>
              </View>
              <Ionicons
                name="arrow-forward"
                size={ms(16)}
                color={theme.textMuted}
                style={{ marginHorizontal: s(12) }}
              />
              <View style={styles.versionCol}>
                <Text style={[styles.versionLabel, { color: theme.textMuted }]}>
                  Latest
                </Text>
                <Text
                  style={[
                    styles.versionValue,
                    {
                      color: isForceUpdate ? '#EF4444' : theme.primary,
                      fontWeight: '700',
                    },
                  ]}
                >
                  v{evaluation.latestVersion}
                </Text>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            {isMaintenance ? (
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: '#F59E0B' }]}
                onPress={handleRetryMaintenance}
                disabled={retryingMaintenance}
                activeOpacity={0.8}
              >
                {retryingMaintenance ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="refresh-outline" size={ms(18)} color="#FFFFFF" />
                    <Text style={styles.primaryBtnText}>Check System Status</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  { backgroundColor: isForceUpdate ? '#EF4444' : theme.primary },
                ]}
                onPress={handleUpdatePress}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={Platform.OS === 'ios' ? 'logo-apple-appstore' : 'logo-google-playstore'}
                  size={ms(18)}
                  color="#FFFFFF"
                />
                <Text style={styles.primaryBtnText}>
                  {Platform.OS === 'ios' ? 'Update on App Store' : 'Update on Google Play'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Soft Update allows "Later" button. Force Update and Maintenance DO NOT render close/later */}
            {isSoftUpdate && (
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={handleDismissSoftUpdate}
                activeOpacity={0.7}
              >
                <Text style={[styles.secondaryBtnText, { color: theme.textMuted }]}>
                  Remind Me Later
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: s(24),
  },
  card: {
    width: '100%',
    maxWidth: s(400),
    borderRadius: RADIUS.xl,
    padding: s(24),
    alignItems: 'center',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 25,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: vs(14),
  },
  iconCircle: {
    width: s(76),
    height: s(76),
    borderRadius: s(38),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(10),
  },
  badge: {
    paddingHorizontal: s(12),
    paddingVertical: vs(4),
    borderRadius: RADIUS.full,
  },
  badgeText: {
    fontSize: fs(11),
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: fs(20),
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: vs(8),
  },
  message: {
    fontSize: fs(14),
    lineHeight: fs(20),
    textAlign: 'center',
    marginBottom: vs(18),
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(10),
    paddingHorizontal: s(20),
    borderRadius: RADIUS.md,
    marginBottom: vs(20),
    width: '100%',
  },
  versionCol: {
    alignItems: 'center',
  },
  versionLabel: {
    fontSize: fs(11),
    marginBottom: vs(2),
  },
  versionValue: {
    fontSize: fs(14),
    fontWeight: '600',
  },
  actionContainer: {
    width: '100%',
    gap: vs(10),
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(8),
    paddingVertical: vs(14),
    borderRadius: RADIUS.md,
    width: '100%',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: fs(15),
    fontWeight: '700',
  },
  secondaryBtn: {
    paddingVertical: vs(10),
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  secondaryBtnText: {
    fontSize: fs(14),
    fontWeight: '600',
  },
});
