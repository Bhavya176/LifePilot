import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Animated,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTheme } from '../../context/ThemeContext';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { s, vs, ms, fs } from '../../utils/responsive';
import { Button } from './Button';

interface TimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  value: string; // 24-hour "HH:mm"
  onChange: (newTime24: string) => void;
  isDarkMode?: boolean;
}

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

const PRESETS = [
  { label: '🌅 9:00 AM', hour: 9, min: '00', period: 'AM' as const },
  { label: '☀️ 12:00 PM', hour: 12, min: '00', period: 'PM' as const },
  { label: '☕ 2:00 PM', hour: 2, min: '00', period: 'PM' as const },
  { label: '🌆 7:00 PM', hour: 7, min: '00', period: 'PM' as const },
  { label: '🌙 9:00 PM', hour: 9, min: '00', period: 'PM' as const },
];

function parseTime(value?: string) {
  let initialHour = 9;
  let initialMin = '00';
  let initialPeriod: 'AM' | 'PM' = 'AM';

  if (value && value.includes(':')) {
    const parts = value.split(':');
    const h = parseInt(parts[0], 10);
    const m = parts[1] || '00';

    if (!isNaN(h)) {
      initialPeriod = h >= 12 ? 'PM' : 'AM';
      initialHour = h % 12 === 0 ? 12 : h % 12;
      const nearestMin = MINUTES.includes(m) ? m : String(Math.round(parseInt(m, 10) / 5) * 5).padStart(2, '0');
      initialMin = MINUTES.includes(nearestMin) ? nearestMin : '00';
    }
  }

  return { initialHour, initialMin, initialPeriod };
}

const TimePickerModalContent: React.FC<TimePickerModalProps> = ({
  onClose,
  value,
  onChange,
  isDarkMode: propDarkMode,
}) => {
  const insets = useSafeAreaInsets();
  const { isDarkMode: ctxDarkMode } = useTheme();
  const isDarkMode = propDarkMode !== undefined ? propDarkMode : ctxDarkMode;
  const theme = isDarkMode ? COLORS.dark : COLORS.light;

  const parsed = parseTime(value);
  const [selectedHour, setSelectedHour] = useState(parsed.initialHour);
  const [selectedMinute, setSelectedMinute] = useState(parsed.initialMin);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>(parsed.initialPeriod);

  // Animation values - strictly useNativeDriver: false across all calls to prevent thread collision & flickering
  const translateY = useMemo(() => new Animated.Value(400), []);
  const backdropAnim = useMemo(() => new Animated.Value(0), []);

  // Smooth enter animation on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        tension: 75,
        friction: 10,
        useNativeDriver: false,
      }),
    ]).start();
  }, [backdropAnim, translateY]);

  // Smooth exit animation
  const dismissModal = useCallback(
    (onFinish?: () => void) => {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: false,
        }),
        Animated.timing(translateY, {
          toValue: 500,
          duration: 180,
          useNativeDriver: false,
        }),
      ]).start(() => {
        onClose();
        if (onFinish) onFinish();
      });
    },
    [backdropAnim, onClose, translateY]
  );

  // PanResponder for smooth downward drag to dismiss
  // onStart is FALSE so taps on buttons / close icon are never stolen
  // onMove only claims on deliberate downward drag, never on horizontal or upward swipe
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return gestureState.dy > 8 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx * 1.5);
        },
        onMoveShouldSetPanResponderCapture: (_, gestureState) => {
          return gestureState.dy > 8 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx * 1.5);
        },
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dy > 0) {
            translateY.setValue(gestureState.dy);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dy > 90 || gestureState.vy > 0.5) {
            dismissModal();
          } else {
            Animated.spring(translateY, {
              toValue: 0,
              bounciness: 0,
              useNativeDriver: false,
            }).start();
          }
        },
      }),
    [dismissModal, translateY]
  );

  const handleConfirm = () => {
    let h24 = selectedHour;
    if (selectedPeriod === 'AM') {
      if (h24 === 12) h24 = 0;
    } else {
      if (h24 !== 12) h24 += 12;
    }

    const hh = String(h24).padStart(2, '0');
    const mm = selectedMinute;
    dismissModal(() => {
      onChange(`${hh}:${mm}`);
    });
  };

  const applyPreset = (h: number, m: string, p: 'AM' | 'PM') => {
    setSelectedHour(h);
    setSelectedMinute(m);
    setSelectedPeriod(p);
  };

  return (
    <GestureHandlerRootView style={styles.modalOverlay}>
      {/* Animated Backdrop */}
      <Animated.View
        style={[
          styles.backdropPressable,
          {
            opacity: backdropAnim,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
          },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={() => dismissModal()} />
      </Animated.View>

      {/* Slide-Up Bottom Sheet */}
      <Animated.View
        style={[
          styles.bottomSheet,
          {
            backgroundColor: isDarkMode ? '#131127' : '#FFFFFF',
            borderTopColor: isDarkMode ? '#27234D' : '#E2E8F0',
            paddingBottom: Math.max(insets.bottom, 16),
            transform: [{ translateY }],
          },
        ]}
      >
        {/* Swipe-Down Header Drag Zone */}
        <View {...panResponder.panHandlers} style={styles.dragHeaderArea}>
          <View style={[styles.handleBar, { backgroundColor: isDarkMode ? '#475569' : '#CBD5E1' }]} />

          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={[styles.clockIconBadge, { backgroundColor: theme.primaryLight }]}>
                <Ionicons name="alarm" size={18} color={theme.primary} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Set Reminder Time</Text>
                <Text style={[styles.headerSub, { color: theme.textSecondary }]}>Pick an exact hour and minute</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => dismissModal()}
              style={[styles.closeBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Time Selection Content Area */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
          nestedScrollEnabled={true}
        >
          {/* Digital Clock Display Card */}
          <View
            style={[
              styles.heroClockCard,
              {
                backgroundColor: isDarkMode ? '#1A1635' : '#F8FAFC',
                borderColor: isDarkMode ? '#2D2856' : '#E2E8F0',
              },
            ]}
          >
            <View style={styles.clockDigitsContainer}>
              <View style={[styles.digitPill, { backgroundColor: isDarkMode ? '#241E48' : '#FFFFFF' }]}>
                <Text style={[styles.clockDigit, { color: theme.primary }]}>
                  {String(selectedHour).padStart(2, '0')}
                </Text>
              </View>

              <Text style={[styles.clockColon, { color: theme.primary }]}>:</Text>

              <View style={[styles.digitPill, { backgroundColor: isDarkMode ? '#241E48' : '#FFFFFF' }]}>
                <Text style={[styles.clockDigit, { color: theme.primary }]}>
                  {selectedMinute}
                </Text>
              </View>
            </View>

            {/* Segmented AM / PM Switch */}
            <View style={[styles.ampmSegment, { backgroundColor: isDarkMode ? '#241E48' : '#E2E8F0' }]}>
              <TouchableOpacity
                style={[
                  styles.ampmBtn,
                  selectedPeriod === 'AM' && [styles.ampmBtnActive, { backgroundColor: theme.primary }],
                ]}
                onPress={() => setSelectedPeriod('AM')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.ampmText,
                    { color: selectedPeriod === 'AM' ? '#FFFFFF' : theme.textSecondary },
                  ]}
                >
                  AM
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.ampmBtn,
                  selectedPeriod === 'PM' && [styles.ampmBtnActive, { backgroundColor: theme.primary }],
                ]}
                onPress={() => setSelectedPeriod('PM')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.ampmText,
                    { color: selectedPeriod === 'PM' ? '#FFFFFF' : theme.textSecondary },
                  ]}
                >
                  PM
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick 1-Tap Presets */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.presetsScroll}
            contentContainerStyle={styles.presetsContent}
          >
            {PRESETS.map((p) => {
              const isMatch =
                selectedHour === p.hour &&
                selectedMinute === p.min &&
                selectedPeriod === p.period;
              return (
                <TouchableOpacity
                  key={p.label}
                  style={[
                    styles.presetChip,
                    {
                      backgroundColor: isMatch
                        ? theme.primary
                        : isDarkMode
                        ? '#1E1B38'
                        : '#F1F5F9',
                      borderColor: isMatch ? theme.primary : isDarkMode ? '#2D2856' : '#E2E8F0',
                    },
                  ]}
                  onPress={() => applyPreset(p.hour, p.min, p.period)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.presetText,
                      { color: isMatch ? '#FFFFFF' : theme.textPrimary },
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Symmetrical Hour Selector (6 Columns x 2 Rows) */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>SELECT HOUR</Text>
            <Text style={[styles.sectionSubtitle, { color: theme.primary }]}>
              {String(selectedHour).padStart(2, '0')} {selectedPeriod}
            </Text>
          </View>
          <View style={styles.gridContainer}>
            {HOURS.map((h) => {
              const active = selectedHour === h;
              return (
                <TouchableOpacity
                  key={h}
                  style={[
                    styles.gridButton,
                    {
                      backgroundColor: active
                        ? theme.primary
                        : isDarkMode
                        ? '#1A1635'
                        : '#F8FAFC',
                      borderColor: active ? theme.primary : isDarkMode ? '#2D2856' : '#E2E8F0',
                    },
                  ]}
                  onPress={() => setSelectedHour(h)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.gridButtonText,
                      {
                        color: active ? '#FFFFFF' : theme.textPrimary,
                        fontWeight: active ? '800' : '600',
                      },
                    ]}
                  >
                    {h}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Symmetrical Minute Selector (6 Columns x 2 Rows) */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>SELECT MINUTE</Text>
            <Text style={[styles.sectionSubtitle, { color: theme.primary }]}>:{selectedMinute} mins</Text>
          </View>
          <View style={styles.gridContainer}>
            {MINUTES.map((m) => {
              const active = selectedMinute === m;
              return (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.gridButton,
                    {
                      backgroundColor: active
                        ? theme.primary
                        : isDarkMode
                        ? '#1A1635'
                        : '#F8FAFC',
                      borderColor: active ? theme.primary : isDarkMode ? '#2D2856' : '#E2E8F0',
                    },
                  ]}
                  onPress={() => setSelectedMinute(m)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.gridButtonText,
                      {
                        color: active ? '#FFFFFF' : theme.textPrimary,
                        fontWeight: active ? '800' : '600',
                      },
                    ]}
                  >
                    {m}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Fixed Non-Overlapping Bottom Action Button */}
        <View style={[styles.footer, { backgroundColor: isDarkMode ? '#131127' : '#FFFFFF' }]}>
          <Button
            title={`Confirm Reminder • ${String(selectedHour).padStart(2, '0')}:${selectedMinute} ${selectedPeriod}`}
            onPress={handleConfirm}
            variant="primary"
            size="lg"
            isDarkMode={isDarkMode}
          />
        </View>
      </Animated.View>
    </GestureHandlerRootView>
  );
};

export const TimePickerModal: React.FC<TimePickerModalProps> = (props) => {
  if (!props.visible) return null;
  return (
    <Modal
      visible={props.visible}
      transparent
      animationType="none"
      onRequestClose={props.onClose}
      statusBarTranslucent
    >
      <TimePickerModalContent {...props} />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bottomSheet: {
    width: '100%',
    maxHeight: '85%',
    borderTopLeftRadius: ms(28),
    borderTopRightRadius: ms(28),
    borderTopWidth: 1,
    paddingTop: vs(8),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 24,
  },
  dragHeaderArea: {
    paddingHorizontal: s(SPACING.md),
    paddingBottom: vs(SPACING.xs),
  },
  handleBar: {
    width: s(44),
    height: vs(5),
    borderRadius: ms(3),
    alignSelf: 'center',
    marginBottom: vs(SPACING.sm),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: vs(SPACING.xs),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(SPACING.xs + 2),
  },
  clockIconBadge: {
    width: ms(34),
    height: ms(34),
    borderRadius: ms(RADIUS.full),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fs(16),
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: fs(11.5),
    marginTop: vs(1),
  },
  closeBtn: {
    width: ms(30),
    height: ms(30),
    borderRadius: ms(RADIUS.full),
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: s(SPACING.md),
    paddingBottom: vs(SPACING.sm),
  },
  heroClockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: vs(SPACING.sm),
    paddingHorizontal: s(SPACING.md),
    borderRadius: ms(RADIUS.lg),
    borderWidth: 1,
    marginBottom: vs(SPACING.xs + 2),
  },
  clockDigitsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
  },
  digitPill: {
    paddingHorizontal: s(SPACING.sm + 4),
    paddingVertical: vs(4),
    borderRadius: ms(RADIUS.md),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  clockDigit: {
    fontSize: fs(26),
    fontWeight: '900',
    letterSpacing: 1,
  },
  clockColon: {
    fontSize: fs(24),
    fontWeight: '900',
  },
  ampmSegment: {
    flexDirection: 'row',
    borderRadius: ms(RADIUS.md),
    padding: s(3),
    gap: s(2),
  },
  ampmBtn: {
    paddingHorizontal: s(SPACING.sm + 2),
    paddingVertical: vs(5),
    borderRadius: ms(RADIUS.sm),
  },
  ampmBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  ampmText: {
    fontSize: fs(12.5),
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  presetsScroll: {
    marginBottom: vs(SPACING.sm),
  },
  presetsContent: {
    gap: s(SPACING.xs),
    paddingVertical: vs(2),
  },
  presetChip: {
    paddingHorizontal: s(SPACING.sm + 2),
    paddingVertical: vs(5),
    borderRadius: ms(RADIUS.full),
    borderWidth: 1,
  },
  presetText: {
    fontSize: fs(11.5),
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: vs(SPACING.xs),
    marginTop: vs(SPACING.xs),
  },
  sectionTitle: {
    fontSize: fs(11),
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionSubtitle: {
    fontSize: fs(11),
    fontWeight: '700',
  },
  // Unified 6-column symmetrical grid for both Hours and Minutes
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(6),
    justifyContent: 'space-between',
    marginBottom: vs(SPACING.xs + 2),
  },
  gridButton: {
    width: '14.8%',
    paddingVertical: vs(7),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ms(RADIUS.md),
    borderWidth: 1,
  },
  gridButtonText: {
    fontSize: fs(13.5),
  },
  footer: {
    paddingHorizontal: s(SPACING.md),
    paddingTop: vs(SPACING.xs + 2),
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.12)',
  },
});
