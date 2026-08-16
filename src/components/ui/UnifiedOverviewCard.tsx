import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from './Card';
import { Badge } from './Badge';
import { ProgressBar } from './ProgressBar';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { s, vs, ms, fs } from '../../utils/responsive';
import { UserLevel } from '../../types/gamification';
import { Goal } from '../../types/goal';
import { formatCurrency } from '../../utils/formatters';
import { Ionicons } from '@expo/vector-icons';

interface UnifiedOverviewCardProps {
  totalXP: number;
  currentLevel: UserLevel;
  levelProgress: number;
  status: string;
  tasksCompleted: number;
  tasksTotal: number;
  habitsCompleted: number;
  habitsTotal: number;
  bestStreak: number;
  todayExpense: number;
  activeGoal: Goal | null;
  onStatusPress: () => void;
  onAnalyticsPress: () => void;
  onGoalPress: () => void;
  isDarkMode?: boolean;
}

export const UnifiedOverviewCard: React.FC<UnifiedOverviewCardProps> = ({
  totalXP,
  currentLevel,
  levelProgress,
  status,
  tasksCompleted,
  tasksTotal,
  habitsCompleted,
  habitsTotal,
  bestStreak,
  todayExpense,
  activeGoal,
  onStatusPress,
  onAnalyticsPress,
  onGoalPress,
  isDarkMode = false,
}) => {
  const theme = isDarkMode ? COLORS.dark : COLORS.light;
  const nextLevelXP = currentLevel.maxXP === Infinity ? '∞' : currentLevel.maxXP + 1;

  return (
    <Card isDarkMode={isDarkMode} style={styles.container}>
      {/* Top Header: Level Badge & Status Pill */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.levelClickable}
          activeOpacity={0.7}
          onPress={onAnalyticsPress}
        >
          <View style={[styles.levelBadge, { backgroundColor: theme.primaryLight }]}>
            <Text style={styles.levelEmoji}>{currentLevel.emoji}</Text>
            <Text style={[styles.levelNum, { color: theme.primary }]}>Lv.{currentLevel.level}</Text>
          </View>
          <View style={{ marginLeft: s(SPACING.xs + 2) }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.levelTitle, { color: theme.textPrimary }]}>
                {currentLevel.title}
              </Text>
              <Ionicons name="chevron-forward" size={14} color={theme.textMuted} style={{ marginLeft: 2 }} />
            </View>
            <Text style={[styles.xpText, { color: theme.textSecondary }]}>
              {totalXP.toLocaleString()} / {nextLevelXP} XP
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={onStatusPress} activeOpacity={0.7}>
          <Badge label={`Status: ${status}`} variant="info" isDarkMode={isDarkMode} />
        </TouchableOpacity>
      </View>

      {/* Slim XP Progress Bar */}
      <View style={styles.progressBarWrapper}>
        <ProgressBar progress={levelProgress} color={theme.primary} isDarkMode={isDarkMode} />
      </View>

      {/* 3 Core Stats Columns */}
      <View style={styles.overviewGrid}>
        <View style={styles.statBox}>
          <Ionicons name="checkbox-outline" size={20} color={theme.primary} />
          <Text style={[styles.statValue, { color: theme.textPrimary }]}>
            {tasksCompleted}/{tasksTotal}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Tasks</Text>
        </View>

        <View style={styles.statBox}>
          <Ionicons name="flame-outline" size={20} color={theme.warning} />
          <Text style={[styles.statValue, { color: theme.textPrimary }]}>
            {habitsCompleted}/{habitsTotal}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Habits {bestStreak > 0 ? `(${bestStreak}d)` : ''}
          </Text>
        </View>

        <View style={styles.statBox}>
          <Ionicons name="wallet-outline" size={20} color={theme.danger} />
          <Text style={[styles.statValue, { color: theme.textPrimary }]}>
            {formatCurrency(todayExpense)}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Spent Today</Text>
        </View>
      </View>

      {/* Active Goal Snippet */}
      {activeGoal ? (
        <TouchableOpacity
          style={[styles.goalSnippet, { backgroundColor: theme.primaryLight }]}
          onPress={onGoalPress}
          activeOpacity={0.8}
        >
          <View style={styles.goalRow}>
            <Text style={[styles.goalTitle, { color: theme.textPrimary }]} numberOfLines={1}>
              🎯 {activeGoal.title}
            </Text>
            <Text style={[styles.goalProgressText, { color: theme.primary }]}>
              {activeGoal.currentValue} / {activeGoal.targetValue} {activeGoal.unit || ''}
            </Text>
          </View>
          <ProgressBar
            progress={activeGoal.targetValue > 0 ? activeGoal.currentValue / activeGoal.targetValue : 0}
            color={theme.primary}
            isDarkMode={isDarkMode}
          />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.goalSnippet, { backgroundColor: theme.primaryLight, alignItems: 'center' }]}
          onPress={onGoalPress}
          activeOpacity={0.8}
        >
          <Text style={[styles.goalTitle, { color: theme.primary }]}>
            🎯 Tap to set your personal goal
          </Text>
        </TouchableOpacity>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: s(SPACING.md),
    marginBottom: vs(SPACING.md),
    borderLeftWidth: 3,
    borderLeftColor: '#6366F1',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(SPACING.xs),
  },
  levelClickable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(8),
    paddingVertical: vs(4),
    borderRadius: ms(RADIUS.full),
  },
  levelEmoji: {
    fontSize: fs(15),
  },
  levelNum: {
    fontSize: fs(11),
    fontWeight: '800',
    marginLeft: s(3),
  },
  levelTitle: {
    fontSize: fs(14),
    fontWeight: '800',
  },
  xpText: {
    fontSize: fs(10.5),
    fontWeight: '600',
    marginTop: vs(1),
  },
  progressBarWrapper: {
    marginVertical: vs(SPACING.xs),
  },
  overviewGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: vs(SPACING.xs + 2),
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.1)',
    marginTop: vs(2),
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: fs(15),
    fontWeight: '800',
    marginTop: vs(2),
  },
  statLabel: {
    fontSize: fs(11),
    marginTop: vs(1),
  },
  goalSnippet: {
    marginTop: vs(SPACING.xs + 2),
    padding: s(SPACING.sm),
    borderRadius: ms(RADIUS.md),
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(SPACING.xs),
  },
  goalTitle: {
    fontSize: fs(12),
    fontWeight: '700',
    flex: 1,
  },
  goalProgressText: {
    fontSize: fs(11),
    fontWeight: '700',
    marginLeft: s(4),
  },
});
