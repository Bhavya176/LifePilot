import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuthContext } from '../../context/AuthContext';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Header } from '../../components/ui/Header';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useTasks } from '../../hooks/useTasks';
import { useHabits } from '../../hooks/useHabits';
import { useExpenses } from '../../hooks/useExpenses';
import { useGoals } from '../../hooks/useGoals';
import { summaryService } from '../../services/summaryService';
import { formatCurrency } from '../../utils/formatters';
import { getTodayString } from '../../utils/dateUtils';
import { s, vs, ms, fs } from '../../utils/responsive';

export default function SummaryScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { user } = useAuthContext();
  const theme = isDarkMode ? COLORS.dark : COLORS.light;

  const { tasks, loading: tasksLoading } = useTasks();
  const { habits, loading: habitsLoading } = useHabits();
  const { expenses, loading: expensesLoading } = useExpenses();
  const { goals, loading: goalsLoading } = useGoals();

  const [aiInsight, setAiInsight] = useState<string>('');
  const [cloudScore, setCloudScore] = useState<number | null>(null);

  const todayStr = getTodayString();
  const loading = tasksLoading || habitsLoading || expensesLoading || goalsLoading;

  // Compute live today metrics
  const todayTasks = tasks.filter((t) => t.dueDate === todayStr || !t.dueDate);
  const tasksCompleted = todayTasks.filter((t) => t.completed).length;
  const tasksTotal = todayTasks.length;
  const taskPercent = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;

  const habitsCompleted = habits.filter((h) => h.completedDates?.includes(todayStr)).length;
  const habitsTotal = habits.length;
  const habitPercent = habitsTotal > 0 ? Math.round((habitsCompleted / habitsTotal) * 100) : 0;

  const todayExpense = expenses
    .filter((e) => e.date === todayStr)
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const activeGoals = goals.filter((g) => !g.completed);

  // Compute weighted dynamic productivity score (0 - 100)
  let calculatedScore = 0;
  if (tasksTotal === 0 && habitsTotal === 0) {
    calculatedScore = 50; // Baseline neutral score for new user
  } else {
    let taskWeight = tasksTotal > 0 ? (tasksCompleted / tasksTotal) * 50 : 25;
    let habitWeight = habitsTotal > 0 ? (habitsCompleted / habitsTotal) * 40 : 20;
    let goalBonus = activeGoals.length > 0 ? 10 : 5;
    calculatedScore = Math.min(Math.round(taskWeight + habitWeight + goalBonus), 100);
  }

  const finalScore = cloudScore ?? calculatedScore;

  useEffect(() => {
    async function loadCloudSummary() {
      if (user?.uid) {
        try {
          const cloudSum = await summaryService.fetchTodaySummary(user.uid);
          if (cloudSum?.aiInsight) {
            setAiInsight(cloudSum.aiInsight);
          }
        } catch {
          // Fallback to locally computed insight
        }
      }
    }
    loadCloudSummary();
  }, [user?.uid]);

  // Generate dynamic personalized productivity advice based on live score
  const getDynamicInsight = () => {
    if (aiInsight) return aiInsight;
    if (finalScore >= 80) {
      return `Outstanding focus! You've conquered ${tasksCompleted}/${tasksTotal} tasks and locked in ${habitsCompleted}/${habitsTotal} habits today. Keep this strong momentum going.`;
    }
    if (finalScore >= 50) {
      return `Solid progress so far today. You've completed ${tasksCompleted} tasks and ${habitsCompleted} habits. Tackling 1 more high-priority task will push your score past 80%!`;
    }
    return `Start building today's momentum. Check off your first high-priority task and complete your daily water or workout habit to boost your productivity score!`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title="Productivity Summary"
        subtitle="Live metrics & serverless insights"
        showBack
        isDarkMode={isDarkMode}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={{ marginTop: SPACING.md, color: theme.textSecondary }}>
              Analyzing daily productivity data...
            </Text>
          </View>
        ) : (
          <>
            {/* Score Card */}
            <Card isDarkMode={isDarkMode} style={styles.scoreCard}>
              <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>
                Today's Productivity Score
              </Text>
              <Text
                style={[
                  styles.scoreValue,
                  {
                    color:
                      finalScore >= 80
                        ? theme.success
                        : finalScore >= 50
                        ? theme.primary
                        : theme.warning,
                  },
                ]}
              >
                {finalScore}%
              </Text>
              <Badge
                label={
                  finalScore >= 80
                    ? '🔥 High Performance'
                    : finalScore >= 50
                    ? '⚡ Steady Momentum'
                    : '🌱 Getting Started'
                }
                variant={finalScore >= 80 ? 'success' : finalScore >= 50 ? 'info' : 'warning'}
                isDarkMode={isDarkMode}
                style={{ marginTop: 4 }}
              />
              <ProgressBar
                progress={finalScore / 100}
                color={
                  finalScore >= 80
                    ? theme.success
                    : finalScore >= 50
                    ? theme.primary
                    : theme.warning
                }
                isDarkMode={isDarkMode}
                style={{ marginTop: SPACING.md }}
              />
            </Card>

            {/* AI / Cloud Function Insight Card */}
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
                <Ionicons name="sparkles" size={22} color="#D97706" />
                <Text style={[styles.insightTitle, { color: isDarkMode ? '#F8FAFC' : '#92400E' }]}>
                  Productivity Intelligence
                </Text>
              </View>
              <Text
                style={[
                  styles.insightText,
                  { color: isDarkMode ? '#CBD5E1' : '#78350F' },
                ]}
              >
                {getDynamicInsight()}
              </Text>
            </Card>

            {/* Daily Breakdown Grid */}
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Today's Key Performance Indicators
            </Text>
            <Card isDarkMode={isDarkMode}>
              <View style={styles.metricRow}>
                <View style={styles.metricLabelRow}>
                  <Ionicons name="checkbox-outline" size={18} color={theme.primary} />
                  <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                    Tasks Completed
                  </Text>
                </View>
                <Text style={[styles.metricValue, { color: theme.textPrimary }]}>
                  {tasksCompleted} / {tasksTotal} ({taskPercent}%)
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              <View style={styles.metricRow}>
                <View style={styles.metricLabelRow}>
                  <Ionicons name="flame-outline" size={18} color={theme.warning} />
                  <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                    Habits Achieved
                  </Text>
                </View>
                <Text style={[styles.metricValue, { color: theme.textPrimary }]}>
                  {habitsCompleted} / {habitsTotal} ({habitPercent}%)
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              <View style={styles.metricRow}>
                <View style={styles.metricLabelRow}>
                  <Ionicons name="wallet-outline" size={18} color={theme.danger} />
                  <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                    Spent Today
                  </Text>
                </View>
                <Text style={[styles.metricValue, { color: theme.textPrimary }]}>
                  {formatCurrency(todayExpense)}
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              <View style={styles.metricRow}>
                <View style={styles.metricLabelRow}>
                  <Ionicons name="trophy-outline" size={18} color={theme.success} />
                  <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                    Active Goals
                  </Text>
                </View>
                <Text style={[styles.metricValue, { color: theme.textPrimary }]}>
                  {activeGoals.length} {activeGoals.length === 1 ? 'Goal' : 'Goals'}
                </Text>
              </View>
            </Card>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              <Button
                title="View All Tasks"
                variant="outline"
                onPress={() => router.push('/(tabs)/tasks')}
                isDarkMode={isDarkMode}
                style={{ flex: 1, marginRight: SPACING.sm }}
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
    paddingBottom: vs(SPACING.xl),
  },
  loadingContainer: {
    padding: s(SPACING.xl),
    alignItems: 'center',
  },
  scoreCard: {
    alignItems: 'center',
    paddingVertical: vs(SPACING.lg),
    marginBottom: vs(SPACING.md),
  },
  scoreLabel: {
    fontSize: fs(13),
    fontWeight: '600',
  },
  scoreValue: {
    fontSize: fs(48),
    fontWeight: '900',
    marginTop: vs(4),
  },
  insightCard: {
    marginBottom: vs(SPACING.md),
    borderWidth: 1,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vs(SPACING.xs),
  },
  insightTitle: {
    fontSize: fs(15),
    fontWeight: '700',
    marginLeft: s(SPACING.xs + 2),
  },
  insightText: {
    fontSize: fs(13),
    lineHeight: fs(20),
  },
  sectionTitle: {
    fontSize: fs(16),
    fontWeight: '700',
    marginBottom: vs(SPACING.xs),
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: vs(SPACING.xs + 2),
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: fs(14),
    marginLeft: s(8),
  },
  metricValue: {
    fontSize: fs(14),
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: vs(SPACING.xs),
  },
  actionsContainer: {
    flexDirection: 'row',
    marginTop: vs(SPACING.md),
  },
});
