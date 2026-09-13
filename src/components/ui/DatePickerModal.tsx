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
import { getTodayString, getTomorrowString } from '../../utils/dateUtils';
import { Button } from './Button';

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  value: string; // "YYYY-MM-DD"
  onChange: (newDate: string) => void;
  isDarkMode?: boolean;
}

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatDateString(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function parseDate(dateStr?: string): { year: number; month: number; day: number } {
  if (dateStr && dateStr.includes('-')) {
    const parts = dateStr.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return { year: parts[0], month: parts[1] - 1, day: parts[2] };
    }
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
}

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const { year, month, day } = parseDate(dateStr);
  const dt = new Date(year, month, day);
  return dt.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getRelativeTag(dateStr: string): string {
  const today = getTodayString();
  const tomorrow = getTomorrowString();
  if (dateStr === today) return 'Today';
  if (dateStr === tomorrow) return 'Tomorrow';
  const { year, month, day } = parseDate(dateStr);
  const { year: ty, month: tm, day: td } = parseDate(today);
  const diffMs = new Date(year, month, day).getTime() - new Date(ty, tm, td).getTime();
  const diffDays = Math.round(diffMs / (1000 * 3600 * 24));
  if (diffDays > 0) return `In ${diffDays} days`;
  if (diffDays === -1) return 'Yesterday';
  if (diffDays < -1) return `${Math.abs(diffDays)}d ago`;
  return '';
}

const DatePickerModalContent: React.FC<DatePickerModalProps> = ({
  onClose,
  value,
  onChange,
  isDarkMode: propDarkMode,
}) => {
  const insets = useSafeAreaInsets();
  const { isDarkMode: ctxDarkMode } = useTheme();
  const isDarkMode = propDarkMode !== undefined ? propDarkMode : ctxDarkMode;
  const theme = isDarkMode ? COLORS.dark : COLORS.light;

  const initial = parseDate(value || getTodayString());
  const [selectedDate, setSelectedDate] = useState(
    value || formatDateString(initial.year, initial.month, initial.day)
  );
  const [viewYear, setViewYear] = useState(initial.year);
  const [viewMonth, setViewMonth] = useState(initial.month);

  // Animation drivers - useNativeDriver: false strictly to eliminate thread race & flickering
  const translateY = useMemo(() => new Animated.Value(400), []);
  const backdropAnim = useMemo(() => new Animated.Value(0), []);

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

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Calendar math
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
  const monthTitle = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const calendarDays = useMemo(() => {
    const days: { day: number; dateStr: string; isPlaceholder: boolean }[] = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ day: 0, dateStr: '', isPlaceholder: true });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        day: d,
        dateStr: formatDateString(viewYear, viewMonth, d),
        isPlaceholder: false,
      });
    }
    return days;
  }, [viewYear, viewMonth, firstDayIndex, daysInMonth]);

  const handleSelectDay = (dateStr: string) => {
    setSelectedDate(dateStr);
  };

  const applyPreset = (offsetDays: number) => {
    const target = new Date();
    target.setDate(target.getDate() + offsetDays);
    const dateStr = formatDateString(target.getFullYear(), target.getMonth(), target.getDate());
    setSelectedDate(dateStr);
    setViewYear(target.getFullYear());
    setViewMonth(target.getMonth());
  };

  const applyNextMonday = () => {
    const target = new Date();
    const dayOfWeek = target.getDay(); // 0 = Sun, 1 = Mon...
    const daysUntilNextMon = ((8 - dayOfWeek) % 7) || 7;
    target.setDate(target.getDate() + daysUntilNextMon);
    const dateStr = formatDateString(target.getFullYear(), target.getMonth(), target.getDate());
    setSelectedDate(dateStr);
    setViewYear(target.getFullYear());
    setViewMonth(target.getMonth());
  };

  const handleConfirm = () => {
    dismissModal(() => {
      onChange(selectedDate);
    });
  };

  const todayStr = getTodayString();
  const relativeTag = getRelativeTag(selectedDate);

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
              <View style={[styles.dateIconBadge, { backgroundColor: theme.primaryLight }]}>
                <Ionicons name="calendar" size={18} color={theme.primary} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Select Due Date</Text>
                <Text style={[styles.headerSub, { color: theme.textSecondary }]}>Pick a date for your task</Text>
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

        {/* Scrollable Content */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
          nestedScrollEnabled={true}
        >
          {/* Hero Date Card */}
          <View
            style={[
              styles.heroDateCard,
              {
                backgroundColor: isDarkMode ? '#1A1635' : '#F8FAFC',
                borderColor: isDarkMode ? '#2D2856' : '#E2E8F0',
              },
            ]}
          >
            <View style={styles.heroDateInfo}>
              <Text style={[styles.heroDateText, { color: theme.primary }]}>
                {formatDisplayDate(selectedDate)}
              </Text>
              {relativeTag ? (
                <View style={[styles.relativePill, { backgroundColor: theme.primaryLight }]}>
                  <Text style={[styles.relativePillText, { color: theme.primary }]}>
                    {relativeTag}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Quick Presets Bar */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.presetsScroll}
            contentContainerStyle={styles.presetsContent}
          >
            <TouchableOpacity
              style={[
                styles.presetChip,
                {
                  backgroundColor:
                    selectedDate === todayStr ? theme.primary : isDarkMode ? '#1E1B38' : '#F1F5F9',
                  borderColor: selectedDate === todayStr ? theme.primary : isDarkMode ? '#2D2856' : '#E2E8F0',
                },
              ]}
              onPress={() => applyPreset(0)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.presetText,
                  { color: selectedDate === todayStr ? '#FFFFFF' : theme.textPrimary },
                ]}
              >
                📅 Today
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.presetChip,
                {
                  backgroundColor:
                    selectedDate === getTomorrowString()
                      ? theme.primary
                      : isDarkMode
                      ? '#1E1B38'
                      : '#F1F5F9',
                  borderColor:
                    selectedDate === getTomorrowString()
                      ? theme.primary
                      : isDarkMode
                      ? '#2D2856'
                      : '#E2E8F0',
                },
              ]}
              onPress={() => applyPreset(1)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.presetText,
                  { color: selectedDate === getTomorrowString() ? '#FFFFFF' : theme.textPrimary },
                ]}
              >
                🌅 Tomorrow
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.presetChip,
                {
                  backgroundColor: isDarkMode ? '#1E1B38' : '#F1F5F9',
                  borderColor: isDarkMode ? '#2D2856' : '#E2E8F0',
                },
              ]}
              onPress={applyNextMonday}
              activeOpacity={0.7}
            >
              <Text style={[styles.presetText, { color: theme.textPrimary }]}>
                💼 Next Mon
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.presetChip,
                {
                  backgroundColor: isDarkMode ? '#1E1B38' : '#F1F5F9',
                  borderColor: isDarkMode ? '#2D2856' : '#E2E8F0',
                },
              ]}
              onPress={() => applyPreset(7)}
              activeOpacity={0.7}
            >
              <Text style={[styles.presetText, { color: theme.textPrimary }]}>
                ⏱️ +1 Week
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Month & Year Navigation Bar */}
          <View style={styles.monthNavRow}>
            <TouchableOpacity
              onPress={handlePrevMonth}
              style={[styles.monthNavBtn, { backgroundColor: isDarkMode ? '#1E1B38' : '#F1F5F9' }]}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={18} color={theme.textPrimary} />
            </TouchableOpacity>

            <Text style={[styles.monthNavTitle, { color: theme.textPrimary }]}>
              {monthTitle}
            </Text>

            <TouchableOpacity
              onPress={handleNextMonth}
              style={[styles.monthNavBtn, { backgroundColor: isDarkMode ? '#1E1B38' : '#F1F5F9' }]}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-forward" size={18} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Days of Week Header */}
          <View style={styles.daysHeaderRow}>
            {DAYS_SHORT.map((dayName) => (
              <Text key={dayName} style={[styles.dayHeaderCell, { color: theme.textMuted }]}>
                {dayName}
              </Text>
            ))}
          </View>

          {/* 7-Column Days Grid */}
          <View style={styles.calendarGrid}>
            {calendarDays.map((item, index) => {
              if (item.isPlaceholder) {
                return <View key={`ph-${index}`} style={styles.dayCell} />;
              }

              const isSelected = item.dateStr === selectedDate;
              const isToday = item.dateStr === todayStr;

              return (
                <TouchableOpacity
                  key={item.dateStr}
                  style={[
                    styles.dayCell,
                    isSelected && [styles.selectedDayCell, { backgroundColor: theme.primary }],
                    isToday && !isSelected && [
                      styles.todayDayCell,
                      { borderColor: theme.primary },
                    ],
                  ]}
                  onPress={() => handleSelectDay(item.dateStr)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayText,
                      {
                        color: isSelected
                          ? '#FFFFFF'
                          : isToday
                          ? theme.primary
                          : theme.textPrimary,
                        fontWeight: isSelected || isToday ? '800' : '500',
                      },
                    ]}
                  >
                    {item.day}
                  </Text>
                  {isToday && !isSelected && (
                    <View style={[styles.todayDot, { backgroundColor: theme.primary }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Non-Overlapping Fixed Bottom Action Button */}
        <View style={[styles.footer, { backgroundColor: isDarkMode ? '#131127' : '#FFFFFF' }]}>
          <Button
            title={`Confirm Date • ${formatDisplayDate(selectedDate)}`}
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

export const DatePickerModal: React.FC<DatePickerModalProps> = (props) => {
  if (!props.visible) return null;
  return (
    <Modal
      visible={props.visible}
      transparent
      animationType="none"
      onRequestClose={props.onClose}
      statusBarTranslucent
    >
      <DatePickerModalContent {...props} />
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
  dateIconBadge: {
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
  heroDateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: vs(SPACING.sm),
    paddingHorizontal: s(SPACING.md),
    borderRadius: ms(RADIUS.lg),
    borderWidth: 1,
    marginBottom: vs(SPACING.xs + 2),
  },
  heroDateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(SPACING.sm),
  },
  heroDateText: {
    fontSize: fs(18),
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  relativePill: {
    paddingHorizontal: s(SPACING.xs + 3),
    paddingVertical: vs(2),
    borderRadius: ms(RADIUS.full),
  },
  relativePillText: {
    fontSize: fs(11.5),
    fontWeight: '800',
  },
  presetsScroll: {
    marginBottom: vs(SPACING.xs + 2),
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
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: vs(SPACING.xs),
    marginTop: vs(SPACING.xs),
  },
  monthNavBtn: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(RADIUS.full),
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavTitle: {
    fontSize: fs(15.5),
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  daysHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: vs(SPACING.xs),
    marginTop: vs(2),
  },
  dayHeaderCell: {
    width: '13.5%',
    textAlign: 'center',
    fontSize: fs(11),
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: vs(SPACING.xs),
  },
  dayCell: {
    width: '13.5%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ms(RADIUS.full),
    marginVertical: vs(2),
    position: 'relative',
  },
  selectedDayCell: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  todayDayCell: {
    borderWidth: 1.5,
  },
  dayText: {
    fontSize: fs(13.5),
  },
  todayDot: {
    position: 'absolute',
    bottom: vs(2),
    width: ms(4),
    height: ms(4),
    borderRadius: ms(2),
  },
  footer: {
    paddingHorizontal: s(SPACING.md),
    paddingTop: vs(SPACING.xs + 2),
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.12)',
  },
});
