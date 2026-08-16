import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Vibration,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { Header } from '../../components/ui/Header';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { s, vs, ms, fs } from '../../utils/responsive';
import { useGamification } from '../../hooks/useGamification';
import { scheduleLocalReminder } from '../../firebase/messaging';

type PomodoroMode = 'focus' | 'short_break' | 'long_break';

const MODE_CONFIG = {
  focus: { label: 'Focus Time', duration: 25 * 60, color: '#6366F1', emoji: '🍅' },
  short_break: { label: 'Short Break', duration: 5 * 60, color: '#10B981', emoji: '☕' },
  long_break: { label: 'Long Break', duration: 15 * 60, color: '#3B82F6', emoji: '🌴' },
};

export default function PomodoroScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? COLORS.dark : COLORS.light;
  const { earnXP } = useGamification();

  const [mode, setMode] = useState<PomodoroMode>('focus');
  const [timeLeft, setTimeLeft] = useState(MODE_CONFIG.focus.duration);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);

  const activeConfig = MODE_CONFIG[mode];
  const timerRef = useRef<any>(null);

  // SVG dimensions
  const size = ms(240);
  const strokeWidth = ms(10);
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = timeLeft / activeConfig.duration;
  const strokeDashoffset = circumference * (1 - progress);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode]);

  const handleTimerComplete = async () => {
    setIsRunning(false);
    Vibration.vibrate([0, 500, 200, 500]);

    if (mode === 'focus') {
      const nextCount = completedSessions + 1;
      setCompletedSessions(nextCount);
      await earnXP('FOCUS_SESSION');

      await scheduleLocalReminder(
        '🍅 Pomodoro Completed!',
        'Great job! 25 minutes of deep focus achieved (+20 XP). Time for a well-deserved break! 🎉',
        1
      );

      Alert.alert(
        '🍅 Focus Session Complete!',
        `Awesome work! You earned +20 XP. Total sessions today: ${nextCount}. Take a break!`,
        [
          { text: 'Start Short Break (5m)', onPress: () => switchMode('short_break') },
          { text: 'Later', style: 'cancel' },
        ]
      );
    } else {
      await scheduleLocalReminder(
        '⚡ Break Over!',
        'Break is finished. Ready to get back into focus mode? 🚀',
        1
      );
      Alert.alert('⚡ Break Finished', 'Ready for your next focus round?', [
        { text: 'Start Focus (25m)', onPress: () => switchMode('focus') },
        { text: 'OK', style: 'cancel' },
      ]);
    }
  };

  const switchMode = (newMode: PomodoroMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(MODE_CONFIG[newMode].duration);
  };

  const handleTogglePlay = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(activeConfig.duration);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title="Pomodoro Focus"
        subtitle="Deep work cycles & focus productivity"
        showBack
        isDarkMode={isDarkMode}
        rightAction={
          <TouchableOpacity
            style={[styles.roomBtn, { backgroundColor: isDarkMode ? '#312E81' : '#EEF2FF' }]}
            onPress={() => router.push('/screens/focus-room')}
          >
            <Ionicons name="people" size={16} color={theme.primary} />
            <Text style={[styles.roomBtnText, { color: theme.primary }]}>Focus Room</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Mode Selector Tabs */}
        <View style={[styles.modeSelector, { backgroundColor: theme.card }]}>
          {(['focus', 'short_break', 'long_break'] as PomodoroMode[]).map((m) => {
            const isSelected = mode === m;
            const cfg = MODE_CONFIG[m];
            return (
              <TouchableOpacity
                key={m}
                onPress={() => switchMode(m)}
                style={[
                  styles.modeTab,
                  isSelected && [styles.selectedTab, { backgroundColor: cfg.color }],
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.modeTabText,
                    { color: isSelected ? '#FFFFFF' : theme.textSecondary },
                  ]}
                >
                  {cfg.emoji} {cfg.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Circular Progress Ring */}
        <View style={styles.timerCircleContainer}>
          <Svg width={size} height={size}>
            {/* Background Track Circle */}
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={isDarkMode ? '#1E293B' : '#E2E8F0'}
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Active Progress Circle */}
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={activeConfig.color}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              transform={`rotate(-90 ${center} ${center})`}
            />
          </Svg>

          {/* Time Display Inside Ring */}
          <View style={styles.timerInner}>
            <Text style={styles.modeEmoji}>{activeConfig.emoji}</Text>
            <Text style={[styles.timeText, { color: theme.textPrimary }]}>
              {formatTime(timeLeft)}
            </Text>
            <Text style={[styles.timerSub, { color: theme.textSecondary }]}>
              {isRunning ? 'Focus In Progress' : 'Paused'}
            </Text>
          </View>
        </View>

        {/* Play / Pause / Reset Controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.secondaryBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}
            onPress={handleReset}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={24} color={theme.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryPlayBtn, { backgroundColor: activeConfig.color }]}
            onPress={handleTogglePlay}
            activeOpacity={0.85}
          >
            <Ionicons
              name={isRunning ? 'pause' : 'play'}
              size={32}
              color="#FFFFFF"
              style={{ marginLeft: isRunning ? 0 : 3 }}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}
            onPress={() => switchMode(mode === 'focus' ? 'short_break' : 'focus')}
            activeOpacity={0.7}
          >
            <Ionicons name="play-forward" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Sessions Counter Card */}
        <Card isDarkMode={isDarkMode} style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <Text style={[styles.statsTitle, { color: theme.textPrimary }]}>Today's Focus Streak</Text>
            <Badge label={`+${completedSessions * 20} XP Earned`} variant="success" isDarkMode={isDarkMode} />
          </View>
          <View style={styles.tomatoesRow}>
            {completedSessions === 0 ? (
              <Text style={[styles.noSessionsText, { color: theme.textMuted }]}>
                No sessions completed yet today. Start your first 25m round!
              </Text>
            ) : (
              Array.from({ length: Math.min(completedSessions, 10) }).map((_, i) => (
                <Text key={i} style={styles.tomatoEmoji}>
                  🍅
                </Text>
              ))
            )}
          </View>
          <Text style={[styles.statsFooter, { color: theme.textSecondary }]}>
            {completedSessions} Pomodoro session{completedSessions !== 1 ? 's' : ''} completed today
          </Text>
        </Card>
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
    alignItems: 'center',
  },
  roomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(10),
    paddingVertical: vs(5),
    borderRadius: ms(RADIUS.full),
  },
  roomBtnText: {
    fontSize: fs(11.5),
    fontWeight: '700',
    marginLeft: s(4),
  },
  modeSelector: {
    flexDirection: 'row',
    borderRadius: ms(RADIUS.full),
    padding: s(4),
    marginVertical: vs(SPACING.md),
    width: '100%',
  },
  modeTab: {
    flex: 1,
    paddingVertical: vs(SPACING.xs + 2),
    borderRadius: ms(RADIUS.full),
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedTab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  modeTabText: {
    fontSize: fs(11.5),
    fontWeight: '700',
  },
  timerCircleContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: vs(SPACING.lg),
  },
  timerInner: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeEmoji: {
    fontSize: fs(24),
    marginBottom: vs(2),
  },
  timeText: {
    fontSize: fs(42),
    fontWeight: '900',
    letterSpacing: 1,
  },
  timerSub: {
    fontSize: fs(12),
    fontWeight: '600',
    marginTop: vs(2),
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: vs(SPACING.lg),
    gap: s(SPACING.lg),
  },
  primaryPlayBtn: {
    width: ms(72),
    height: ms(72),
    borderRadius: ms(36),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  secondaryBtn: {
    width: ms(48),
    height: ms(48),
    borderRadius: ms(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsCard: {
    width: '100%',
    padding: s(SPACING.md),
    marginTop: vs(SPACING.sm),
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(SPACING.xs),
  },
  statsTitle: {
    fontSize: fs(14),
    fontWeight: '700',
  },
  tomatoesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: vs(SPACING.xs + 2),
    gap: s(4),
  },
  tomatoEmoji: {
    fontSize: fs(22),
  },
  noSessionsText: {
    fontSize: fs(12),
    fontStyle: 'italic',
  },
  statsFooter: {
    fontSize: fs(11.5),
    marginTop: vs(2),
  },
});
