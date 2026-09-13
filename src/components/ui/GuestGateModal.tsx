import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { Button } from './Button';
import { HapticsService } from '../../services/hapticsService';
import { s, vs, ms, fs } from '../../utils/responsive';

interface GuestGateModalProps {
  visible: boolean;
  featureName?: string; // e.g. "Task", "Habit", "Expense", "Note", "Goal"
  onClose: () => void;
}

export const GuestGateModal: React.FC<GuestGateModalProps> = ({
  visible,
  featureName = 'Items',
  onClose,
}) => {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? COLORS.dark : COLORS.light;

  const [scaleAnim] = useState(() => new Animated.Value(0.92));
  const [opacityAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      HapticsService.medium().catch(() => {});
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 7,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.92);
      opacityAnim.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim]);

  if (!visible) return null;

  const handleCreateAccount = () => {
    onClose();
    router.push('/(auth)/register');
  };

  const handleLogin = () => {
    onClose();
    router.push('/(auth)/login');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalBox,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Close Icon */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={ms(22)} color={theme.textMuted} />
          </TouchableOpacity>

          {/* Hero Icon Badge */}
          <View style={[styles.iconWrapper, { backgroundColor: isDarkMode ? '#312E81' : '#EEF2FF' }]}>
            <Ionicons name="sparkles" size={ms(32)} color={theme.primary} />
          </View>

          {/* Title & Subtitle */}
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            {`Create Free Account to Add ${featureName}`}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {`Sign up in 10 seconds to save your ${featureName.toLowerCase()}s, activate hardware alarms, and sync across all your devices.`}
          </Text>

          {/* Value Proposition List */}
          <View style={[styles.benefitsList, { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC' }]}>
            <View style={styles.benefitRow}>
              <View style={[styles.miniIcon, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                <Ionicons name="alarm" size={ms(16)} color="#EF4444" />
              </View>
              <View style={{ flex: 1, marginLeft: s(SPACING.sm) }}>
                <Text style={[styles.benefitTitle, { color: theme.textPrimary }]}>
                  Smart Repeat Alarms
                </Text>
                <Text style={[styles.benefitDesc, { color: theme.textSecondary }]}>
                  Never miss urgent deadlines with 5x ringing alerts.
                </Text>
              </View>
            </View>

            <View style={styles.benefitRow}>
              <View style={[styles.miniIcon, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                <Ionicons name="flame" size={ms(16)} color="#F59E0B" />
              </View>
              <View style={{ flex: 1, marginLeft: s(SPACING.sm) }}>
                <Text style={[styles.benefitTitle, { color: theme.textPrimary }]}>
                  Habit Streaks & Heatmaps
                </Text>
                <Text style={[styles.benefitDesc, { color: theme.textSecondary }]}>
                  30-day visual consistency matrices and XP rewards.
                </Text>
              </View>
            </View>

            <View style={[styles.benefitRow, { marginBottom: 0 }]}>
              <View style={[styles.miniIcon, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                <Ionicons name="cloud-done" size={ms(16)} color="#10B981" />
              </View>
              <View style={{ flex: 1, marginLeft: s(SPACING.sm) }}>
                <Text style={[styles.benefitTitle, { color: theme.textPrimary }]}>
                  Permanent Cloud Sync
                </Text>
                <Text style={[styles.benefitDesc, { color: theme.textSecondary }]}>
                  Safe cloud backup across Android, iOS & Web.
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <Button
            title="🚀 Create Free Account"
            onPress={handleCreateAccount}
            size="lg"
            isDarkMode={isDarkMode}
            style={{ width: '100%', marginBottom: vs(SPACING.xs + 2) }}
          />

          <Button
            title="🔑 Log In to Existing Account"
            variant="outline"
            onPress={handleLogin}
            size="md"
            isDarkMode={isDarkMode}
            style={{ width: '100%', marginBottom: vs(SPACING.xs) }}
          />

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={[styles.cancelText, { color: theme.textMuted }]}>
              Maybe Later (Keep Exploring)
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: s(SPACING.lg),
  },
  modalBox: {
    width: '100%',
    maxWidth: s(380),
    borderRadius: ms(24),
    padding: s(SPACING.lg),
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: vs(SPACING.md),
    right: s(SPACING.md),
    zIndex: 10,
    padding: s(4),
  },
  iconWrapper: {
    width: ms(64),
    height: ms(64),
    borderRadius: ms(RADIUS.full),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(SPACING.md),
    marginTop: vs(SPACING.xs),
  },
  title: {
    fontSize: fs(19),
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: vs(SPACING.xs),
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: fs(13),
    lineHeight: fs(18),
    textAlign: 'center',
    marginBottom: vs(SPACING.md),
    paddingHorizontal: s(SPACING.xs),
  },
  benefitsList: {
    width: '100%',
    borderRadius: ms(RADIUS.lg),
    padding: s(SPACING.md),
    marginBottom: vs(SPACING.lg),
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vs(SPACING.sm),
  },
  miniIcon: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(RADIUS.sm),
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitTitle: {
    fontSize: fs(13.5),
    fontWeight: '700',
  },
  benefitDesc: {
    fontSize: fs(11.5),
    marginTop: vs(1),
  },
  cancelBtn: {
    paddingVertical: vs(SPACING.xs + 2),
    paddingHorizontal: s(SPACING.md),
  },
  cancelText: {
    fontSize: fs(12.5),
    fontWeight: '600',
  },
});
