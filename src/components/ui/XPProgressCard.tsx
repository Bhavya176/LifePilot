import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from './Card';
import { ProgressBar } from './ProgressBar';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { s, vs, ms, fs } from '../../utils/responsive';
import { UserLevel } from '../../types/gamification';

interface XPProgressCardProps {
  totalXP: number;
  currentLevel: UserLevel;
  levelProgress: number;
  tasksCompleted: number;
  habitsCompleted: number;
  bestStreak: number;
  isDarkMode?: boolean;
}

export const XPProgressCard: React.FC<XPProgressCardProps> = ({
  totalXP,
  currentLevel,
  levelProgress,
  tasksCompleted,
  habitsCompleted,
  bestStreak,
  isDarkMode = false,
}) => {
  const router = useRouter();
  const theme = isDarkMode ? COLORS.dark : COLORS.light;
  const nextLevelXP = currentLevel.maxXP === Infinity ? '∞' : currentLevel.maxXP + 1;

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/screens/analytics')}>
      <Card isDarkMode={isDarkMode} style={styles.container}>
      {/* Level Badge Row */}
      <View style={styles.levelRow}>
        <View style={[styles.levelBadge, { backgroundColor: theme.primaryLight }]}>
          <Text style={styles.levelEmoji}>{currentLevel.emoji}</Text>
          <Text style={[styles.levelNum, { color: theme.primary }]}>Lv.{currentLevel.level}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: s(SPACING.sm) }}>
          <Text style={[styles.levelTitle, { color: theme.textPrimary }]}>
            {currentLevel.title}
          </Text>
          <Text style={[styles.xpText, { color: theme.textSecondary }]}>
            {totalXP.toLocaleString()} XP {currentLevel.maxXP !== Infinity ? `/ ${nextLevelXP} XP` : ''}
          </Text>
        </View>
        <View style={[styles.xpPill, { backgroundColor: isDarkMode ? '#312E81' : '#EEF2FF' }]}>
          <Text style={[styles.xpPillText, { color: theme.primary }]}>🎮 XP</Text>
        </View>
      </View>

      {/* XP Progress Bar */}
      <View style={{ marginVertical: vs(SPACING.xs) }}>
        <ProgressBar progress={levelProgress} isDarkMode={isDarkMode} />
      </View>

      {/* Quick Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.primary }]}>{tasksCompleted}</Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Tasks Done</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.success }]}>{habitsCompleted}</Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Habits</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.warning }]}>{bestStreak}</Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Best Streak</Text>
        </View>
      </View>
    </Card>
  </TouchableOpacity>
);
};

const styles = StyleSheet.create({
  container: {
    padding: s(SPACING.md),
    marginBottom: vs(SPACING.md),
    borderLeftWidth: 3,
    borderLeftColor: '#6366F1',
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vs(SPACING.xs),
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(10),
    paddingVertical: vs(5),
    borderRadius: ms(RADIUS.full),
  },
  levelEmoji: {
    fontSize: fs(18),
  },
  levelNum: {
    fontSize: fs(12),
    fontWeight: '800',
    marginLeft: s(4),
  },
  levelTitle: {
    fontSize: fs(15),
    fontWeight: '800',
  },
  xpText: {
    fontSize: fs(11.5),
    fontWeight: '600',
    marginTop: vs(1),
  },
  xpPill: {
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderRadius: ms(RADIUS.full),
  },
  xpPillText: {
    fontSize: fs(11),
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: vs(SPACING.xs + 2),
    paddingTop: vs(SPACING.xs + 2),
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: fs(16),
    fontWeight: '800',
  },
  statLabel: {
    fontSize: fs(10),
    fontWeight: '600',
    marginTop: vs(1),
  },
  statDivider: {
    width: 1,
    height: vs(28),
  },
});
