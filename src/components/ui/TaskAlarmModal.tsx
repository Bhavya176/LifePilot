import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { s, vs, ms, fs } from '../../utils/responsive';
import { HapticsService } from '../../services/hapticsService';

interface TaskAlarmModalProps {
  visible: boolean;
  taskId?: string;
  taskTitle: string;
  dueTime?: string;
  notificationId?: string;
  onDismiss: () => void;
  onComplete: () => void;
  onSnooze: () => void;
}

export const TaskAlarmModal: React.FC<TaskAlarmModalProps> = ({
  visible,
  taskTitle,
  dueTime,
  onDismiss,
  onComplete,
  onSnooze,
}) => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? COLORS.dark : COLORS.light;

  // Pulsing scale animation for alarm bell
  const [pulseAnim] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (visible) {
      // 1. Trigger repeated vibration pattern: 600ms vibrate, 300ms pause, 600ms vibrate, 300ms pause, 800ms vibrate
      Vibration.vibrate([0, 600, 300, 600, 300, 800], true);
      HapticsService.success().catch(() => {});

      // 2. Start pulsing bell animation
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();

      return () => {
        loop.stop();
        Vibration.cancel();
      };
    } else {
      Vibration.cancel();
    }
  }, [visible, pulseAnim]);

  if (!visible) return null;

  const handleStop = () => {
    Vibration.cancel();
    HapticsService.heavy().catch(() => {});
    onDismiss();
  };

  const handleComplete = () => {
    Vibration.cancel();
    HapticsService.success().catch(() => {});
    onComplete();
  };

  const handleSnooze = () => {
    Vibration.cancel();
    HapticsService.medium().catch(() => {});
    onSnooze();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleStop}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDarkMode ? '#1E1B38' : '#FFFFFF',
              borderColor: isDarkMode ? '#EF4444' : '#FCA5A5',
            },
          ]}
        >
          {/* Pulsing Alarm Icon Circle */}
          <Animated.View
            style={[
              styles.iconCircle,
              {
                backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2',
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <Ionicons name="alarm" size={ms(44)} color="#EF4444" />
          </Animated.View>

          {/* Alarm Status Badge */}
          <View style={styles.statusBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.statusBadgeText}>TASK ALARM RINGING</Text>
          </View>

          {/* Task Title */}
          <Text
            style={[styles.taskTitle, { color: theme.textPrimary }]}
            numberOfLines={3}
          >
            {taskTitle || 'Important Task'}
          </Text>

          {/* Time & Alert Subtitle */}
          {dueTime ? (
            <View style={styles.timeRow}>
              <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
              <Text style={[styles.timeText, { color: theme.textSecondary }]}>
                Scheduled for {dueTime}
              </Text>
            </View>
          ) : null}

          <Text style={[styles.helperText, { color: theme.textMuted }]}>
            This alarm will keep buzzing until you dismiss or complete it.
          </Text>

          {/* Action Buttons */}
          <View style={styles.actionsColumn}>
            {/* Mark Completed Primary Action */}
            <TouchableOpacity
              style={[styles.actionBtn, styles.completeBtn]}
              onPress={handleComplete}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.completeBtnText}>Mark as Completed</Text>
            </TouchableOpacity>

            {/* Stop Alarm Action */}
            <TouchableOpacity
              style={[
                styles.actionBtn,
                styles.stopBtn,
                {
                  backgroundColor: isDarkMode ? '#2D2856' : '#F1F5F9',
                  borderColor: isDarkMode ? '#3B356D' : '#CBD5E1',
                },
              ]}
              onPress={handleStop}
              activeOpacity={0.85}
            >
              <Ionicons name="stop-circle-outline" size={20} color="#EF4444" />
              <Text style={[styles.stopBtnText, { color: '#EF4444' }]}>Stop Alarm</Text>
            </TouchableOpacity>

            {/* Snooze 5 Min Action */}
            <TouchableOpacity
              style={styles.snoozeBtn}
              onPress={handleSnooze}
              activeOpacity={0.7}
            >
              <Ionicons name="moon-outline" size={16} color={theme.textSecondary} />
              <Text style={[styles.snoozeBtnText, { color: theme.textSecondary }]}>
                Snooze for 5 Minutes
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: s(SPACING.lg),
  },
  card: {
    width: '100%',
    maxWidth: s(360),
    borderRadius: ms(RADIUS.xl),
    paddingVertical: vs(SPACING.xl),
    paddingHorizontal: s(SPACING.lg),
    alignItems: 'center',
    borderWidth: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  iconCircle: {
    width: ms(84),
    height: ms(84),
    borderRadius: ms(42),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(SPACING.md),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: s(SPACING.sm + 2),
    paddingVertical: vs(4),
    borderRadius: ms(RADIUS.full),
    marginBottom: vs(SPACING.sm),
  },
  liveDot: {
    width: ms(8),
    height: ms(8),
    borderRadius: ms(4),
    backgroundColor: '#EF4444',
    marginRight: s(6),
  },
  statusBadgeText: {
    color: '#EF4444',
    fontSize: fs(11),
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  taskTitle: {
    fontSize: fs(21),
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: fs(28),
    marginBottom: vs(SPACING.xs),
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    marginBottom: vs(SPACING.xs),
  },
  timeText: {
    fontSize: fs(13),
    fontWeight: '600',
  },
  helperText: {
    fontSize: fs(12),
    textAlign: 'center',
    marginBottom: vs(SPACING.lg),
    lineHeight: fs(17),
  },
  actionsColumn: {
    width: '100%',
    gap: vs(SPACING.sm),
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(14),
    borderRadius: ms(RADIUS.lg),
    gap: s(8),
  },
  completeBtn: {
    backgroundColor: '#10B981',
  },
  completeBtnText: {
    color: '#FFFFFF',
    fontSize: fs(15),
    fontWeight: '800',
  },
  stopBtn: {
    borderWidth: 1.5,
  },
  stopBtnText: {
    fontSize: fs(15),
    fontWeight: '800',
  },
  snoozeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(SPACING.sm),
    gap: s(6),
    marginTop: vs(2),
  },
  snoozeBtnText: {
    fontSize: fs(13),
    fontWeight: '600',
  },
});
