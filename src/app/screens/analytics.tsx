import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { Header } from '../../components/ui/Header';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { s, vs, ms, fs } from '../../utils/responsive';
import { useTasks } from '../../hooks/useTasks';
import { useHabits } from '../../hooks/useHabits';
import { useExpenses } from '../../hooks/useExpenses';
import { useGoals } from '../../hooks/useGoals';
import { useGamification } from '../../hooks/useGamification';
import { formatCurrency } from '../../utils/formatters';
import { getTodayString } from '../../utils/dateUtils';

const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function AnalyticsScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? COLORS.dark : COLORS.light;

  const { tasks } = useTasks();
  const { habits } = useHabits();
  const { expenses } = useExpenses();
  const { goals } = useGoals();
  const { profile: xpProfile, currentLevel, unlockedAchievements } = useGamification();

  // Metrics computation
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const taskRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalHabits = habits.length;
  const todayStr = getTodayString();
  const habitsDoneToday = habits.filter((h) => (h.completedDates || []).includes(todayStr)).length;
  const habitRate = totalHabits > 0 ? Math.round((habitsDoneToday / totalHabits) * 100) : 0;

  const totalGoals = goals.length;
  const completedGoals = goals.filter((g) => g.completed || (g.targetValue > 0 && g.currentValue >= g.targetValue)).length;

  // Composite Productivity Score (0-100)
  const productivityScore = useMemo(() => {
    let score = 0;
    if (totalTasks > 0) score += (completedTasks / totalTasks) * 40;
    else score += 25;

    if (totalHabits > 0) score += (habitsDoneToday / totalHabits) * 35;
    else score += 20;

    if (totalGoals > 0) score += (completedGoals / totalGoals) * 25;
    else score += 15;

    return Math.min(Math.round(score), 100);
  }, [totalTasks, completedTasks, totalHabits, habitsDoneToday, totalGoals, completedGoals]);

  // Expenses computation
  const totalExpenseAmount = useMemo(
    () => expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
    [expenses]
  );

  const categoryExpenses = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      const cat = e.category || 'Other';
      map[cat] = (map[cat] || 0) + (e.amount || 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const topCategory = categoryExpenses.length > 0 ? categoryExpenses[0] : null;

  // Mock weekly task distribution for visual bar chart
  const weeklyTaskData = useMemo(() => {
    return [
      { day: 'Mon', count: Math.min(completedTasks, 4), total: 5 },
      { day: 'Tue', count: Math.min(completedTasks, 3), total: 4 },
      { day: 'Wed', count: Math.min(completedTasks, 5), total: 6 },
      { day: 'Thu', count: Math.min(completedTasks, 2), total: 3 },
      { day: 'Fri', count: Math.min(completedTasks, 4), total: 5 },
      { day: 'Sat', count: Math.min(completedTasks, 3), total: 4 },
      { day: 'Sun', count: completedTasks, total: totalTasks || 1 },
    ];
  }, [completedTasks, totalTasks]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title="Productivity Analytics"
        subtitle="Insights, trends & performance scores"
        showBack
        isDarkMode={isDarkMode}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Big Productivity Score Card */}
        <Card isDarkMode={isDarkMode} style={styles.scoreCard}>
          <View style={styles.scoreHeader}>
            <View>
              <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>
                OVERALL PRODUCTIVITY SCORE
              </Text>
              <View style={styles.scoreNumberRow}>
                <Text style={[styles.scoreValue, { color: theme.primary }]}>
                  {productivityScore}%
                </Text>
                <Badge
                  label={
                    productivityScore >= 80
                      ? 'Super Productive 🔥'
                      : productivityScore >= 50
                      ? 'Good Progress ⭐'
                      : 'Needs Focus 🌱'
                  }
                  variant={productivityScore >= 80 ? 'success' : productivityScore >= 50 ? 'primary' : 'warning'}
                  isDarkMode={isDarkMode}
                  style={{ marginLeft: s(SPACING.sm) }}
                />
              </View>
            </View>
            <View style={[styles.rankPill, { backgroundColor: isDarkMode ? '#312E81' : '#EEF2FF' }]}>
              <Text style={styles.rankEmoji}>{currentLevel.emoji}</Text>
              <Text style={[styles.rankText, { color: theme.primary }]}>Lv.{currentLevel.level}</Text>
            </View>
          </View>

          <ProgressBar progress={productivityScore / 100} isDarkMode={isDarkMode} />
        </Card>

        {/* 3 Core Stats Grid */}
        <View style={styles.metricsGrid}>
          <Card isDarkMode={isDarkMode} style={styles.metricCard}>
            <Ionicons name="checkbox-outline" size={20} color="#6366F1" />
            <Text style={[styles.metricNumber, { color: theme.textPrimary }]}>{taskRate}%</Text>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Tasks Done</Text>
            <Text style={[styles.metricSub, { color: theme.textMuted }]}>
              {completedTasks}/{totalTasks}
            </Text>
          </Card>

          <Card isDarkMode={isDarkMode} style={styles.metricCard}>
            <Ionicons name="flame-outline" size={20} color="#10B981" />
            <Text style={[styles.metricNumber, { color: theme.textPrimary }]}>{habitRate}%</Text>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Habits Today</Text>
            <Text style={[styles.metricSub, { color: theme.textMuted }]}>
              {habitsDoneToday}/{totalHabits}
            </Text>
          </Card>

          <Card isDarkMode={isDarkMode} style={styles.metricCard}>
            <Ionicons name="trophy-outline" size={20} color="#EC4899" />
            <Text style={[styles.metricNumber, { color: theme.textPrimary }]}>
              {totalGoals > 0 ? `${completedGoals}/${totalGoals}` : '0'}
            </Text>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Goals Done</Text>
            <Text style={[styles.metricSub, { color: theme.textMuted }]}>Targets Hit</Text>
          </Card>
        </View>

        {/* Weekly Task Activity Bar Graph */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Weekly Task Activity</Text>
        <Card isDarkMode={isDarkMode} style={styles.barGraphCard}>
          <View style={styles.barGraphRow}>
            {weeklyTaskData.map((item, idx) => {
              const heightPercent = item.total > 0 ? Math.round((item.count / item.total) * 100) : 20;
              const isToday = idx === 6;
              return (
                <View key={item.day} style={styles.barCol}>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${Math.max(heightPercent, 15)}%`,
                          backgroundColor: isToday ? theme.primary : isDarkMode ? '#334155' : '#CBD5E1',
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.barDayText,
                      { color: isToday ? theme.primary : theme.textMuted, fontWeight: isToday ? '800' : '600' },
                    ]}
                  >
                    {item.day}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Spending & Finance Summary */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Expense Summary</Text>
        <Card isDarkMode={isDarkMode} style={styles.expenseCard}>
          <View style={styles.expenseHeaderRow}>
            <View>
              <Text style={[styles.expenseSubLabel, { color: theme.textSecondary }]}>Total Recorded</Text>
              <Text style={[styles.expenseTotalText, { color: theme.textPrimary }]}>
                {formatCurrency(totalExpenseAmount)}
              </Text>
            </View>
            {topCategory && (
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.expenseSubLabel, { color: theme.textSecondary }]}>Top Category</Text>
                <Badge label={`${topCategory[0]}: ${formatCurrency(topCategory[1])}`} variant="warning" isDarkMode={isDarkMode} />
              </View>
            )}
          </View>
        </Card>

        {/* Achievements Showcase */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Unlocked Achievements ({unlockedAchievements.length})
        </Text>
        <Card isDarkMode={isDarkMode} style={styles.achievementsCard}>
          {unlockedAchievements.length === 0 ? (
            <Text style={[styles.noBadgesText, { color: theme.textMuted }]}>
              Complete tasks and habits to unlock your first achievement badge!
            </Text>
          ) : (
            <View style={styles.badgeGrid}>
              {unlockedAchievements.map((ach) => (
                <View key={ach.id} style={styles.badgeItem}>
                  <View style={[styles.badgeIconCircle, { backgroundColor: isDarkMode ? '#1E293B' : '#EEF2FF' }]}>
                    <Text style={styles.badgeEmoji}>{ach.emoji}</Text>
                  </View>
                  <Text style={[styles.badgeTitleText, { color: theme.textPrimary }]} numberOfLines={1}>
                    {ach.title}
                  </Text>
                </View>
              ))}
            </View>
          )}
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
  },
  scoreCard: {
    padding: s(SPACING.md),
    marginBottom: vs(SPACING.md),
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1',
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(SPACING.sm),
  },
  scoreLabel: {
    fontSize: fs(10.5),
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  scoreNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: vs(2),
  },
  scoreValue: {
    fontSize: fs(32),
    fontWeight: '900',
  },
  rankPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(10),
    paddingVertical: vs(5),
    borderRadius: ms(RADIUS.full),
  },
  rankEmoji: {
    fontSize: fs(16),
  },
  rankText: {
    fontSize: fs(12),
    fontWeight: '800',
    marginLeft: s(4),
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: s(SPACING.xs + 2),
    marginBottom: vs(SPACING.md),
  },
  metricCard: {
    flex: 1,
    padding: s(SPACING.sm + 2),
    alignItems: 'center',
  },
  metricNumber: {
    fontSize: fs(18),
    fontWeight: '800',
    marginTop: vs(4),
  },
  metricLabel: {
    fontSize: fs(11),
    fontWeight: '600',
    marginTop: vs(2),
  },
  metricSub: {
    fontSize: fs(9.5),
    marginTop: vs(1),
  },
  sectionTitle: {
    fontSize: fs(14),
    fontWeight: '800',
    marginBottom: vs(SPACING.xs),
    marginTop: vs(SPACING.xs),
  },
  barGraphCard: {
    padding: s(SPACING.md),
    marginBottom: vs(SPACING.md),
  },
  barGraphRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: vs(100),
    paddingTop: vs(SPACING.xs),
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    width: s(18),
    height: vs(75),
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: ms(RADIUS.full),
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: ms(RADIUS.full),
  },
  barDayText: {
    fontSize: fs(10.5),
    marginTop: vs(4),
  },
  expenseCard: {
    padding: s(SPACING.md),
    marginBottom: vs(SPACING.md),
  },
  expenseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseSubLabel: {
    fontSize: fs(11),
    fontWeight: '600',
  },
  expenseTotalText: {
    fontSize: fs(20),
    fontWeight: '800',
    marginTop: vs(2),
  },
  achievementsCard: {
    padding: s(SPACING.md),
    marginBottom: vs(SPACING.lg),
  },
  noBadgesText: {
    fontSize: fs(12),
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: vs(SPACING.sm),
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(SPACING.sm),
  },
  badgeItem: {
    alignItems: 'center',
    width: s(75),
  },
  badgeIconCircle: {
    width: ms(48),
    height: ms(48),
    borderRadius: ms(24),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(2),
  },
  badgeEmoji: {
    fontSize: fs(24),
  },
  badgeTitleText: {
    fontSize: fs(10.5),
    fontWeight: '700',
    textAlign: 'center',
  },
});
