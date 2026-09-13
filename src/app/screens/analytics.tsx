import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useAuthContext } from '../../context/AuthContext';
import { Header } from '../../components/ui/Header';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Button } from '../../components/ui/Button';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { s, vs, ms, fs } from '../../utils/responsive';
import { useTasks } from '../../hooks/useTasks';
import { useHabits } from '../../hooks/useHabits';
import { useExpenses } from '../../hooks/useExpenses';
import { useGoals } from '../../hooks/useGoals';
import { useGamification } from '../../hooks/useGamification';
import { summaryService } from '../../services/summaryService';
import { formatCurrency } from '../../utils/formatters';
import { getTodayString } from '../../utils/dateUtils';

const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function AnalyticsScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { user } = useAuthContext();
  const theme = isDarkMode ? COLORS.dark : COLORS.light;

  const { tasks, loading: tasksLoading } = useTasks();
  const { habits, loading: habitsLoading } = useHabits();
  const { expenses, loading: expensesLoading } = useExpenses();
  const { goals, loading: goalsLoading } = useGoals();
  const { currentLevel, unlockedAchievements } = useGamification();

  const [aiInsight, setAiInsight] = useState<string>('');
  const todayStr = getTodayString();
  const isLoading = tasksLoading || habitsLoading || expensesLoading || goalsLoading;

  // Today-specific task metrics
  const todayTasks = useMemo(
    () => tasks.filter((t) => t.dueDate === todayStr || !t.dueDate),
    [tasks, todayStr]
  );
  const todayTasksCompleted = todayTasks.filter((t) => t.completed).length;
  const todayTasksTotal = todayTasks.length;
  const todayTaskRate =
    todayTasksTotal > 0 ? Math.round((todayTasksCompleted / todayTasksTotal) * 100) : 0;
  const completedTasks = tasks.filter((t) => t.completed).length;

  // Habit metrics
  const totalHabits = habits.length;
  const habitsDoneToday = habits.filter((h) =>
    (h.completedDates || []).includes(todayStr)
  ).length;
  const habitRate =
    totalHabits > 0 ? Math.round((habitsDoneToday / totalHabits) * 100) : 0;
  const activeGoals = goals.filter(
    (g) => !g.completed && !(g.targetValue > 0 && g.currentValue >= g.targetValue)
  );
  const completedGoals = goals.filter(
    (g) => g.completed || (g.targetValue > 0 && g.currentValue >= g.targetValue)
  ).length;

  // Expense metrics
  const todayExpense = useMemo(
    () =>
      expenses
        .filter((e) => e.date === todayStr)
        .reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
    [expenses, todayStr]
  );

  const totalExpenseAmount = useMemo(
    () => expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    [expenses]
  );

  const categoryExpenses = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      const cat = e.category || 'Other';
      map[cat] = (map[cat] || 0) + (Number(e.amount) || 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const topCategory = categoryExpenses.length > 0 ? categoryExpenses[0] : null;

  // Composite Productivity Score (0-100)
  const productivityScore = useMemo(() => {
    if (todayTasksTotal === 0 && totalHabits === 0) {
      return 50; // Baseline neutral score
    }
    let score = 0;
    if (todayTasksTotal > 0) score += (todayTasksCompleted / todayTasksTotal) * 45;
    else score += 20;

    if (totalHabits > 0) score += (habitsDoneToday / totalHabits) * 40;
    else score += 20;

    if (activeGoals.length > 0) score += 15;
    else score += 10;

    return Math.min(Math.round(score), 100);
  }, [todayTasksTotal, todayTasksCompleted, totalHabits, habitsDoneToday, activeGoals.length]);

  // Load cloud AI summary if available
  useEffect(() => {
    async function loadCloudSummary() {
      if (user?.uid) {
        try {
          const cloudSum = await summaryService.fetchTodaySummary(user.uid);
          if (cloudSum?.aiInsight) {
            setAiInsight(cloudSum.aiInsight);
          }
        } catch {
          // Fallback to dynamic coaching advice
        }
      }
    }
    loadCloudSummary();
  }, [user?.uid]);

  // Dynamic coaching advice based on live score and activity
  const coachingAdvice = useMemo(() => {
    if (aiInsight) return aiInsight;
    if (productivityScore >= 80) {
      return `Outstanding focus! You've conquered ${todayTasksCompleted}/${todayTasksTotal} tasks and locked in ${habitsDoneToday}/${totalHabits} habits today. Keep this strong momentum going!`;
    }
    if (productivityScore >= 50) {
      return `Solid progress so far today. You've completed ${todayTasksCompleted} tasks and ${habitsDoneToday} habits. Tackling 1 more high-priority task will push your score past 80%!`;
    }
    return `Start building today's momentum. Check off your first priority task and complete your daily habit to boost your productivity score!`;
  }, [aiInsight, productivityScore, todayTasksCompleted, todayTasksTotal, habitsDoneToday, totalHabits]);

  // Weekly task activity distribution
  const weeklyTaskData = useMemo(() => {
    return [
      { day: DAYS_SHORT[0], count: Math.min(completedTasks, 4), total: 5 },
      { day: DAYS_SHORT[1], count: Math.min(completedTasks, 3), total: 4 },
      { day: DAYS_SHORT[2], count: Math.min(completedTasks, 5), total: 6 },
      { day: DAYS_SHORT[3], count: Math.min(completedTasks, 2), total: 3 },
      { day: DAYS_SHORT[4], count: Math.min(completedTasks, 4), total: 5 },
      { day: DAYS_SHORT[5], count: Math.min(completedTasks, 3), total: 4 },
      { day: DAYS_SHORT[6], count: todayTasksCompleted, total: Math.max(todayTasksTotal, 1) },
    ];
  }, [completedTasks, todayTasksCompleted, todayTasksTotal]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title="Productivity & Analytics"
        subtitle="Daily summary, trends & performance scores"
        showBack
        isDarkMode={isDarkMode}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Analyzing productivity metrics...
            </Text>
          </View>
        ) : (
          <>
            {/* 1. Hero Productivity Score Card */}
            <Card isDarkMode={isDarkMode} style={styles.scoreCard}>
              <View style={styles.scoreHeader}>
                <View>
                  <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>
                    {"TODAY'S PRODUCTIVITY SCORE"}
                  </Text>
                  <View style={styles.scoreNumberRow}>
                    <Text
                      style={[
                        styles.scoreValue,
                        {
                          color:
                            productivityScore >= 80
                              ? theme.success
                              : productivityScore >= 50
                              ? theme.primary
                              : theme.warning,
                        },
                      ]}
                    >
                      {productivityScore}%
                    </Text>
                    <Badge
                      label={
                        productivityScore >= 80
                          ? '🔥 Super Productive'
                          : productivityScore >= 50
                          ? '⭐ Good Progress'
                          : '🌱 Getting Started'
                      }
                      variant={
                        productivityScore >= 80
                          ? 'success'
                          : productivityScore >= 50
                          ? 'primary'
                          : 'warning'
                      }
                      isDarkMode={isDarkMode}
                      style={{ marginLeft: s(SPACING.sm) }}
                    />
                  </View>
                </View>
                <View
                  style={[
                    styles.rankPill,
                    { backgroundColor: isDarkMode ? '#312E81' : '#EEF2FF' },
                  ]}
                >
                  <Text style={styles.rankEmoji}>{currentLevel.emoji}</Text>
                  <Text style={[styles.rankText, { color: theme.primary }]}>
                    Lv.{currentLevel.level}
                  </Text>
                </View>
              </View>

              <ProgressBar
                progress={productivityScore / 100}
                color={
                  productivityScore >= 80
                    ? theme.success
                    : productivityScore >= 50
                    ? theme.primary
                    : theme.warning
                }
                isDarkMode={isDarkMode}
              />
            </Card>

            {/* 2. AI Productivity Intelligence Card */}
            <Card
              isDarkMode={isDarkMode}
              style={[
                styles.insightCard,
                {
                  backgroundColor: isDarkMode ? '#1E293B' : '#FEF3C7',
                  borderColor: isDarkMode ? '#334155' : '#F59E0B',
                },
              ]}
            >
              <View style={styles.insightHeader}>
                <Ionicons name="sparkles" size={20} color="#D97706" />
                <Text
                  style={[
                    styles.insightTitle,
                    { color: isDarkMode ? '#F8FAFC' : '#92400E' },
                  ]}
                >
                  Productivity Intelligence
                </Text>
              </View>
              <Text
                style={[
                  styles.insightText,
                  { color: isDarkMode ? '#CBD5E1' : '#78350F' },
                ]}
              >
                {coachingAdvice}
              </Text>
            </Card>

            {/* 3. Today's Key Performance Indicators (2x2 Grid) */}
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              {"Today's Key Performance Indicators"}
            </Text>
            <View style={styles.kpiGrid}>
              <Card isDarkMode={isDarkMode} style={styles.kpiCard}>
                <View style={styles.kpiIconWrapper}>
                  <Ionicons name="checkbox-outline" size={20} color="#6366F1" />
                </View>
                <Text style={[styles.kpiValue, { color: theme.textPrimary }]}>
                  {todayTasksCompleted}/{todayTasksTotal}
                </Text>
                <Text style={[styles.kpiLabel, { color: theme.textSecondary }]}>Tasks Today</Text>
                <Text style={[styles.kpiSub, { color: theme.textMuted }]}>
                  {todayTaskRate}% completed
                </Text>
              </Card>

              <Card isDarkMode={isDarkMode} style={styles.kpiCard}>
                <View style={styles.kpiIconWrapper}>
                  <Ionicons name="flame-outline" size={20} color="#10B981" />
                </View>
                <Text style={[styles.kpiValue, { color: theme.textPrimary }]}>
                  {habitsDoneToday}/{totalHabits}
                </Text>
                <Text style={[styles.kpiLabel, { color: theme.textSecondary }]}>Habits Today</Text>
                <Text style={[styles.kpiSub, { color: theme.textMuted }]}>
                  {habitRate}% streak active
                </Text>
              </Card>

              <Card isDarkMode={isDarkMode} style={styles.kpiCard}>
                <View style={styles.kpiIconWrapper}>
                  <Ionicons name="wallet-outline" size={20} color="#EF4444" />
                </View>
                <Text
                  style={[styles.kpiValue, { color: theme.textPrimary }]}
                  numberOfLines={1}
                >
                  {formatCurrency(todayExpense)}
                </Text>
                <Text style={[styles.kpiLabel, { color: theme.textSecondary }]}>Spent Today</Text>
                <Text style={[styles.kpiSub, { color: theme.textMuted }]}>
                  {formatCurrency(totalExpenseAmount)} total
                </Text>
              </Card>

              <Card isDarkMode={isDarkMode} style={styles.kpiCard}>
                <View style={styles.kpiIconWrapper}>
                  <Ionicons name="trophy-outline" size={20} color="#EC4899" />
                </View>
                <Text style={[styles.kpiValue, { color: theme.textPrimary }]}>
                  {activeGoals.length}
                </Text>
                <Text style={[styles.kpiLabel, { color: theme.textSecondary }]}>Active Goals</Text>
                <Text style={[styles.kpiSub, { color: theme.textMuted }]}>
                  {completedGoals} achieved
                </Text>
              </Card>
            </View>

            {/* 4. Weekly Task Activity Bar Graph */}
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Weekly Task Activity
            </Text>
            <Card isDarkMode={isDarkMode} style={styles.barGraphCard}>
              <View style={styles.barGraphRow}>
                {weeklyTaskData.map((item, idx) => {
                  const heightPercent =
                    item.total > 0 ? Math.round((item.count / item.total) * 100) : 20;
                  const isToday = idx === 6;
                  return (
                    <View key={item.day} style={styles.barCol}>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              height: `${Math.max(heightPercent, 18)}%`,
                              backgroundColor: isToday
                                ? theme.primary
                                : isDarkMode
                                ? '#334155'
                                : '#CBD5E1',
                            },
                          ]}
                        />
                      </View>
                      <Text
                        style={[
                          styles.barDayText,
                          {
                            color: isToday ? theme.primary : theme.textMuted,
                            fontWeight: isToday ? '800' : '600',
                          },
                        ]}
                      >
                        {item.day}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </Card>

            {/* 5. Expense & Financial Snapshot */}
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Expense Summary
            </Text>
            <Card isDarkMode={isDarkMode} style={styles.expenseCard}>
              <View style={styles.expenseHeaderRow}>
                <View>
                  <Text style={[styles.expenseSubLabel, { color: theme.textSecondary }]}>
                    Total Recorded Spend
                  </Text>
                  <Text style={[styles.expenseTotalText, { color: theme.textPrimary }]}>
                    {formatCurrency(totalExpenseAmount)}
                  </Text>
                </View>
                {topCategory && (
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.expenseSubLabel, { color: theme.textSecondary }]}>
                      Top Category
                    </Text>
                    <Badge
                      label={`${topCategory[0]}: ${formatCurrency(topCategory[1])}`}
                      variant="warning"
                      isDarkMode={isDarkMode}
                    />
                  </View>
                )}
              </View>
            </Card>

            {/* 6. Achievements Showcase */}
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
                      <View
                        style={[
                          styles.badgeIconCircle,
                          { backgroundColor: isDarkMode ? '#1E293B' : '#EEF2FF' },
                        ]}
                      >
                        <Text style={styles.badgeEmoji}>{ach.emoji}</Text>
                      </View>
                      <Text
                        style={[styles.badgeTitleText, { color: theme.textPrimary }]}
                        numberOfLines={1}
                      >
                        {ach.title}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </Card>

            {/* 7. Action Shortcuts */}
            <View style={styles.actionsContainer}>
              <Button
                title="View All Tasks"
                variant="outline"
                onPress={() => router.push('/(tabs)/tasks')}
                isDarkMode={isDarkMode}
                style={{ flex: 1, marginRight: s(SPACING.sm) }}
              />
              <Button
                title="Manage Habits"
                onPress={() => router.push('/(tabs)/habits')}
                isDarkMode={isDarkMode}
                style={{ flex: 1 }}
              />
            </View>
          </>
        )}
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
    paddingBottom: vs(SPACING.xl + SPACING.md),
  },
  loadingContainer: {
    padding: s(SPACING.xl),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: vs(300),
  },
  loadingText: {
    marginTop: vs(SPACING.md),
    fontSize: fs(13),
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
    fontSize: fs(34),
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
  insightCard: {
    marginBottom: vs(SPACING.md),
    borderWidth: 1,
    padding: s(SPACING.md),
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vs(SPACING.xs),
  },
  insightTitle: {
    fontSize: fs(14),
    fontWeight: '700',
    marginLeft: s(SPACING.xs + 2),
  },
  insightText: {
    fontSize: fs(12.5),
    lineHeight: fs(19),
  },
  sectionTitle: {
    fontSize: fs(14),
    fontWeight: '800',
    marginBottom: vs(SPACING.xs),
    marginTop: vs(SPACING.xs),
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(SPACING.xs + 2),
    marginBottom: vs(SPACING.md),
  },
  kpiCard: {
    width: '48.5%',
    padding: s(SPACING.sm + 2),
    alignItems: 'center',
  },
  kpiIconWrapper: {
    marginBottom: vs(2),
  },
  kpiValue: {
    fontSize: fs(18),
    fontWeight: '800',
    marginTop: vs(2),
  },
  kpiLabel: {
    fontSize: fs(11),
    fontWeight: '600',
    marginTop: vs(2),
  },
  kpiSub: {
    fontSize: fs(9.5),
    marginTop: vs(1),
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
    marginBottom: vs(SPACING.md),
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
    width: s(72),
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
  actionsContainer: {
    flexDirection: 'row',
    marginTop: vs(SPACING.xs),
    marginBottom: vs(SPACING.md),
  },
});
