import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  } from 'react-native';
import React from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuthContext } from '../../context/AuthContext';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { getGreeting } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatters';
import { s, vs, ms, fs } from '../../utils/responsive';
import { useTasks } from '../../hooks/useTasks';
import { useHabits } from '../../hooks/useHabits';
import { useExpenses } from '../../hooks/useExpenses';
import { useGoals } from '../../hooks/useGoals';
import { useLiveStatus } from '../../hooks/useLiveStatus';

export default function HomeScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { user } = useAuthContext();
  const theme = isDarkMode ? COLORS.dark : COLORS.light;

  // Real-time live Firestore & Realtime DB hooks
  const { tasks, toggleTask } = useTasks();
  const { habits, toggleHabit } = useHabits();
  const { expenses } = useExpenses();
  const { goals } = useGoals();
  const { status } = useLiveStatus();

  const greeting = getGreeting();
  const userName = user?.name || 'Explorer';

  // Compute live overview metrics from Firestore collections
  const tasksCompleted = tasks.filter((t) => t.completed).length;
  const tasksTotal = tasks.length;
  const habitsCompleted = habits.filter((h) => h.completedDates?.includes(new Date().toISOString().split('T')[0])).length;
  const habitsTotal = habits.length;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayExpense = expenses
    .filter((e) => e.date === todayStr)
    .reduce((sum, item) => sum + (item.amount || 0), 0);

  const activeGoal = goals.length > 0 ? goals[0] : null;
  const todayTasks = tasks.slice(0, 3); // Display top 3 tasks on dashboard

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={[styles.greetingText, { color: theme.textSecondary }]}>
            {greeting},
          </Text>
          <Text style={[styles.userNameText, { color: theme.textPrimary }]}>
            {userName} 👋
          </Text>
        </View>

        <View style={styles.topIcons}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: theme.card }]}
            onPress={() => router.push('/screens/live-status')}
          >
            <Ionicons name="radio-outline" size={20} color={theme.accent} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: theme.card }]}
            onPress={() => router.push('/screens/notifications')}
          >
            <Ionicons name="notifications-outline" size={20} color={theme.textPrimary} />
            <View style={styles.badgeDot} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: theme.card }]}
            onPress={() => router.push('/screens/profile')}
          >
            <Ionicons name="person-circle-outline" size={24} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: theme.card }]}
            onPress={() => router.push('/screens/settings')}
          >
            <Ionicons name="settings-outline" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status & Overview Banner */}
        <Card isDarkMode={isDarkMode} style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Today's Overview
            </Text>
            <TouchableOpacity onPress={() => router.push('/screens/live-status')}>
              <Badge label={`Status: ${status}`} variant="info" isDarkMode={isDarkMode} />
            </TouchableOpacity>
          </View>

          <View style={styles.overviewGrid}>
            <View style={styles.statBox}>
              <Ionicons name="checkbox-outline" size={22} color={theme.primary} />
              <Text style={[styles.statValue, { color: theme.textPrimary }]}>
                {tasksCompleted}/{tasksTotal}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Tasks</Text>
            </View>

            <View style={styles.statBox}>
              <Ionicons name="flame-outline" size={22} color={theme.warning} />
              <Text style={[styles.statValue, { color: theme.textPrimary }]}>
                {habitsCompleted}/{habitsTotal}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Habits</Text>
            </View>

            <View style={styles.statBox}>
              <Ionicons name="wallet-outline" size={22} color={theme.danger} />
              <Text style={[styles.statValue, { color: theme.textPrimary }]}>
                {formatCurrency(todayExpense)}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Spent Today</Text>
            </View>
          </View>

          {/* Active Goal */}
          {activeGoal ? (
            <View style={[styles.goalSnippet, { backgroundColor: theme.primaryLight }]}>
              <View style={styles.goalRow}>
                <Text style={[styles.goalTitle, { color: theme.textPrimary }]}>
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
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.goalSnippet, { backgroundColor: theme.primaryLight, alignItems: 'center' }]}
              onPress={() => router.push('/screens/goals')}
            >
              <Text style={[styles.goalTitle, { color: theme.primary }]}>
                🎯 Tap to add your first personal goal
              </Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Quick Actions */}
        <Text style={[styles.sectionHeader, { color: theme.textPrimary }]}>Quick Actions</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickAddScroll}>
          <TouchableOpacity
            style={[styles.quickAddBtn, { backgroundColor: theme.primaryLight }]}
            onPress={() => router.push('/screens/task-detail')}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle" size={26} color={theme.primary} />
            <Text style={[styles.quickAddText, { color: theme.primary }]}>Add Task</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.quickAddBtn,
              { backgroundColor: isDarkMode ? 'rgba(217, 119, 6, 0.18)' : '#FEF3C7' },
            ]}
            onPress={() => router.push('/(tabs)/habits')}
            activeOpacity={0.7}
          >
            <Ionicons name="flame" size={26} color={isDarkMode ? '#FBBF24' : '#D97706'} />
            <Text style={[styles.quickAddText, { color: isDarkMode ? '#FCD34D' : '#B45309' }]}>
              Add Habit
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.quickAddBtn,
              { backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.18)' : '#D1FAE5' },
            ]}
            onPress={() => router.push('/(tabs)/expenses')}
            activeOpacity={0.7}
          >
            <Ionicons name="wallet" size={26} color={isDarkMode ? '#34D399' : '#059669'} />
            <Text style={[styles.quickAddText, { color: isDarkMode ? '#6EE7B7' : '#047857' }]}>
              Add Expense
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.quickAddBtn,
              { backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.18)' : '#DBEAFE' },
            ]}
            onPress={() => router.push('/screens/note-detail')}
            activeOpacity={0.7}
          >
            <Ionicons name="document-text" size={26} color={isDarkMode ? '#60A5FA' : '#2563EB'} />
            <Text style={[styles.quickAddText, { color: isDarkMode ? '#93C5FD' : '#1D4ED8' }]}>
              Add Note
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.quickAddBtn,
              { backgroundColor: isDarkMode ? 'rgba(168, 85, 247, 0.18)' : '#F3E8FF' },
            ]}
            onPress={() => router.push('/screens/documents')}
            activeOpacity={0.7}
          >
            <Ionicons name="cloud-upload" size={26} color={isDarkMode ? '#C084FC' : '#9333EA'} />
            <Text style={[styles.quickAddText, { color: isDarkMode ? '#D8B4FE' : '#7E22CE' }]}>
              Upload Doc
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Section 1: Today's Tasks */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionHeader, { color: theme.textPrimary }]}>Today's Tasks</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/tasks')}>
            <Text style={[styles.seeAllText, { color: theme.primary }]}>See All ({tasks.length})</Text>
          </TouchableOpacity>
        </View>

        <Card isDarkMode={isDarkMode}>
          {todayTasks.length === 0 ? (
            <EmptyState
              iconName="checkbox-outline"
              title="No Tasks Found"
              description="Tap + Add Task to create your first task."
              actionTitle="Add Task"
              onAction={() => router.push('/screens/task-detail')}
              isDarkMode={isDarkMode}
            />
          ) : (
            todayTasks.map((t, idx) => (
              <React.Fragment key={t.id}>
                {idx > 0 && <View style={styles.divider} />}
                <TouchableOpacity
                  style={styles.taskRow}
                  onPress={() => toggleTask(t.id, t.completed)}
                >
                  <Ionicons
                    name={t.completed ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={t.completed ? theme.success : theme.textMuted}
                  />
                  <Text
                    style={[
                      styles.taskTitle,
                      t.completed && styles.completedTask,
                      { color: t.completed ? theme.textMuted : theme.textPrimary },
                    ]}
                  >
                    {t.title}
                  </Text>
                  <Badge
                    label={t.priority}
                    variant={t.priority === 'high' ? 'danger' : t.priority === 'medium' ? 'warning' : 'neutral'}
                    isDarkMode={isDarkMode}
                  />
                </TouchableOpacity>
              </React.Fragment>
            ))
          )}
        </Card>

        {/* Section 2: Today's Habits */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionHeader, { color: theme.textPrimary }]}>Today's Habits</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/habits')}>
            <Text style={[styles.seeAllText, { color: theme.primary }]}>Manage ({habits.length})</Text>
          </TouchableOpacity>
        </View>

        <Card isDarkMode={isDarkMode}>
          {habits.length === 0 ? (
            <EmptyState
              iconName="flame-outline"
              title="No Habits Yet"
              description="Tap Manage to add your daily habits."
              actionTitle="Add Habit"
              onAction={() => router.push('/(tabs)/habits')}
              isDarkMode={isDarkMode}
            />
          ) : (
            habits.slice(0, 3).map((h, idx) => {
              const isDoneToday = h.completedDates?.includes(todayStr);
              return (
                <React.Fragment key={h.id}>
                  {idx > 0 && <View style={styles.divider} />}
                  <TouchableOpacity
                    style={styles.habitRow}
                    onPress={() => toggleHabit(h, todayStr)}
                  >
                    <View style={styles.habitLeft}>
                      <Ionicons
                        name={isDoneToday ? 'checkmark-circle' : 'flame-outline'}
                        size={20}
                        color={isDoneToday ? theme.success : theme.warning}
                      />
                      <Text
                        style={[
                          styles.habitName,
                          { color: theme.textPrimary },
                          isDoneToday ? styles.completedTask : null,
                        ]}
                      >
                        {h.title}
                      </Text>
                    </View>
                    <Badge
                      label={`🔥 ${h.currentStreak || 0} ${
                        (h.currentStreak || 0) === 1 ? 'day' : 'days'
                      }`}
                      variant={isDoneToday ? 'success' : (h.currentStreak || 0) > 0 ? 'warning' : 'neutral'}
                      isDarkMode={isDarkMode}
                    />
                  </TouchableOpacity>
                </React.Fragment>
              );
            })
          )}
        </Card>

        {/* Section 3: Productivity Summary Banner */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push('/screens/summary')}
          style={{ marginTop: SPACING.md, marginBottom: SPACING.xl }}
        >
          <Card isDarkMode={isDarkMode} style={[styles.summaryBanner, { backgroundColor: theme.primary }]}>
            <View style={styles.summaryBannerContent}>
              <Ionicons name="analytics" size={32} color="#FFFFFF" />
              <View style={{ marginLeft: SPACING.md, flex: 1 }}>
                <Text style={styles.summaryBannerTitle}>Daily Productivity Summary</Text>
                <Text style={styles.summaryBannerSubtitle}>
                  {tasksTotal > 0
                    ? `You've completed ${tasksCompleted}/${tasksTotal} tasks today. Tap to view insights!`
                    : 'Tap to view AI-generated daily productivity insights.'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
            </View>
          </Card>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(SPACING.md),
    paddingVertical: vs(SPACING.sm),
  },
  greetingText: {
    fontSize: fs(13),
    fontWeight: '500',
  },
  userNameText: {
    fontSize: fs(20),
    fontWeight: '800',
  },
  topIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(RADIUS.full),
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: s(SPACING.xs + 2),
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: vs(6),
    right: s(6),
    width: ms(8),
    height: ms(8),
    borderRadius: ms(4),
    backgroundColor: '#EF4444',
  },
  scrollContent: {
    paddingHorizontal: s(SPACING.md),
    paddingBottom: vs(110),
  },
  overviewCard: {
    marginTop: vs(SPACING.xs),
    marginBottom: vs(SPACING.md),
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(SPACING.md),
  },
  sectionTitle: {
    fontSize: fs(18),
    fontWeight: '700',
  },
  overviewGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: vs(SPACING.md),
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: fs(18),
    fontWeight: '800',
    marginTop: vs(4),
  },
  statLabel: {
    fontSize: fs(12),
    marginTop: vs(2),
  },
  goalSnippet: {
    padding: s(SPACING.md),
    borderRadius: ms(RADIUS.md),
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(SPACING.xs),
  },
  goalTitle: {
    fontSize: fs(13),
    fontWeight: '700',
  },
  goalProgressText: {
    fontSize: fs(12),
    fontWeight: '600',
  },
  sectionHeader: {
    fontSize: fs(18),
    fontWeight: '700',
    marginTop: vs(SPACING.sm),
    marginBottom: vs(SPACING.sm),
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: vs(SPACING.md),
    marginBottom: vs(SPACING.xs),
  },
  seeAllText: {
    fontSize: fs(14),
    fontWeight: '600',
  },
  quickAddScroll: {
    marginBottom: vs(SPACING.sm),
  },
  quickAddBtn: {
    paddingHorizontal: s(SPACING.md),
    paddingVertical: vs(SPACING.sm + 2),
    borderRadius: ms(RADIUS.md),
    marginRight: s(SPACING.sm),
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: s(90),
  },
  quickAddText: {
    fontSize: fs(12),
    fontWeight: '700',
    marginTop: vs(4),
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(SPACING.xs + 2),
  },
  taskTitle: {
    flex: 1,
    fontSize: fs(14),
    fontWeight: '500',
    marginHorizontal: s(SPACING.sm),
  },
  completedTask: {
    textDecorationLine: 'line-through',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: vs(SPACING.xs),
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: vs(SPACING.xs),
  },
  habitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  habitName: {
    fontSize: fs(14),
    fontWeight: '600',
    marginLeft: s(SPACING.sm),
  },
  summaryBanner: {
    borderWidth: 0,
  },
  summaryBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryBannerTitle: {
    color: '#FFFFFF',
    fontSize: fs(16),
    fontWeight: '700',
  },
  summaryBannerSubtitle: {
    color: '#E0E7FF',
    fontSize: fs(12),
    marginTop: vs(2),
  },
});
