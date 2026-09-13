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
import { useNetwork } from '../../context/NetworkContext';
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
import { useRemoteConfig } from '../../hooks/useRemoteConfig';
import { useGamification } from '../../hooks/useGamification';
import { DynamicAnnouncementBanner } from '../../components/ui/DynamicAnnouncementBanner';
import { DynamicDailyQuoteCard } from '../../components/ui/DynamicDailyQuoteCard';
import { UnifiedOverviewCard } from '../../components/ui/UnifiedOverviewCard';
import { LevelUpOverlay } from '../../components/ui/LevelUpOverlay';
import { CelebrationModal } from '../../components/ui/CelebrationModal';
import { GuestGateModal } from '../../components/ui/GuestGateModal';

export default function HomeScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { user } = useAuthContext();
  const { isOnline } = useNetwork();
  const { announcement, dailyQuote, refetchConfig } = useRemoteConfig();
  const { profile: xpProfile, currentLevel, levelProgress, levelUpVisible, dismissLevelUp } = useGamification();
  const theme = isDarkMode ? COLORS.dark : COLORS.light;

  const [celebrationData, setCelebrationData] = React.useState<{
    title: string;
    message: string;
    badgeEmoji: string;
  } | null>(null);
  const [guestGateVisible, setGuestGateVisible] = React.useState(false);
  const celebratedTasksRef = React.useRef(false);
  const celebratedHabitsRef = React.useRef(false);

  // Real-time live Firestore hooks
  const { tasks, toggleTask } = useTasks();
  const { habits, toggleHabit } = useHabits();
  const { expenses } = useExpenses();
  const { goals } = useGoals();

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

  React.useEffect(() => {
    if (tasksTotal > 0 && tasksCompleted === tasksTotal && !celebratedTasksRef.current) {
      celebratedTasksRef.current = true;
      setCelebrationData({
        title: "All Today's Tasks Done!",
        message: `Incredible focus! You've conquered all ${tasksTotal} tasks planned for today. Your momentum is at peak!`,
        badgeEmoji: '🏆',
      });
    }
  }, [tasksTotal, tasksCompleted]);

  React.useEffect(() => {
    if (habitsTotal > 0 && habitsCompleted === habitsTotal && !celebratedHabitsRef.current) {
      celebratedHabitsRef.current = true;
      setCelebrationData({
        title: 'All Daily Habits Mastered!',
        message: `Pure consistency! You've locked in all ${habitsTotal} habits today. Your streaks are protected!`,
        badgeEmoji: '🔥',
      });
    }
  }, [habitsTotal, habitsCompleted]);

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
          {!isOnline && (
            <View style={[styles.offlineChip, { backgroundColor: isDarkMode ? '#78350F' : '#FEF3C7' }]}>
              <Ionicons name="cloud-offline" size={13} color="#D97706" />
              <Text style={styles.offlineText}>Offline</Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: theme.card }]}
            onPress={() => router.push('/screens/search')}
          >
            <Ionicons name="search-outline" size={20} color={theme.textPrimary} />
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
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Dynamic Remote Announcement Banner (Remote Config) */}
        <DynamicAnnouncementBanner
          enabled={announcement.enabled}
          text={announcement.text}
          type={announcement.type}
          actionTitle={announcement.actionTitle}
          isDarkMode={isDarkMode}
        />

        {/* Dynamic Daily Motivational Quote Card (Remote Config) */}
        <DynamicDailyQuoteCard
          enabled={dailyQuote.enabled}
          text={dailyQuote.text}
          author={dailyQuote.author}
          onRefresh={refetchConfig}
          isDarkMode={isDarkMode}
        />

        {/* Unified Overview & Gamification XP Card */}
        <UnifiedOverviewCard
          totalXP={xpProfile.totalXP}
          currentLevel={currentLevel}
          levelProgress={levelProgress}
          tasksCompleted={tasksCompleted}
          tasksTotal={tasksTotal}
          habitsCompleted={habitsCompleted}
          habitsTotal={habitsTotal}
          bestStreak={xpProfile.bestStreak}
          todayExpense={todayExpense}
          activeGoal={activeGoal}
          onAnalyticsPress={() => router.push('/screens/analytics')}
          onGoalPress={() => router.push('/screens/goals')}
          isDarkMode={isDarkMode}
        />

        {/* Productivity Tools Quick Pills */}
        <View style={styles.toolsRow}>
          <TouchableOpacity
            style={[styles.toolChip, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push('/screens/pomodoro')}
            activeOpacity={0.7}
          >
            <Ionicons name="timer-outline" size={16} color="#EF4444" />
            <Text style={[styles.toolChipText, { color: theme.textPrimary }]}>Pomodoro</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolChip, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push('/screens/calendar')}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar-outline" size={16} color={theme.primary} />
            <Text style={[styles.toolChipText, { color: theme.textPrimary }]}>Calendar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolChip, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push('/screens/goals')}
            activeOpacity={0.7}
          >
            <Ionicons name="flag-outline" size={16} color="#F59E0B" />
            <Text style={[styles.toolChipText, { color: theme.textPrimary }]}>Goals</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolChip, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push('/screens/analytics')}
            activeOpacity={0.7}
          >
            <Ionicons name="bar-chart-outline" size={16} color="#10B981" />
            <Text style={[styles.toolChipText, { color: theme.textPrimary }]}>Analytics</Text>
          </TouchableOpacity>
        </View>

        {/* Section 1: Today's Tasks */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionHeader, { color: theme.textPrimary }]}>{"Today's Tasks"}</Text>
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
              onAction={() => {
                if (user?.isGuest) {
                  setGuestGateVisible(true);
                  return;
                }
                router.push('/screens/task-detail');
              }}
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
          <Text style={[styles.sectionHeader, { color: theme.textPrimary }]}>{"Today's Habits"}</Text>
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

        {/* Section 3: Productivity Insights & Analytics Banner */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push('/screens/analytics')}
          style={{ marginTop: SPACING.md, marginBottom: SPACING.xl }}
        >
          <Card isDarkMode={isDarkMode} style={[styles.summaryBanner, { backgroundColor: theme.primary }]}>
            <View style={styles.summaryBannerContent}>
              <Ionicons name="analytics" size={32} color="#FFFFFF" />
              <View style={{ marginLeft: SPACING.md, flex: 1 }}>
                <Text style={styles.summaryBannerTitle}>Productivity Insights & Analytics</Text>
                <Text style={styles.summaryBannerSubtitle}>
                  {tasksTotal > 0
                    ? `You've completed ${tasksCompleted}/${tasksTotal} tasks today. Tap to view insights & trends!`
                    : 'Tap to view AI-generated productivity insights & weekly trends.'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
            </View>
          </Card>
        </TouchableOpacity>
      </ScrollView>

      {/* Level Up Celebration Overlay */}
      <LevelUpOverlay
        visible={levelUpVisible}
        level={currentLevel}
        onDismiss={dismissLevelUp}
        isDarkMode={isDarkMode}
      />

      {/* Daily Milestone Celebration Overlay */}
      <CelebrationModal
        visible={!!celebrationData}
        title={celebrationData?.title || ''}
        message={celebrationData?.message || ''}
        badgeEmoji={celebrationData?.badgeEmoji}
        onDismiss={() => setCelebrationData(null)}
        isDarkMode={isDarkMode}
      />

      <GuestGateModal
        visible={guestGateVisible}
        featureName="Task"
        onClose={() => setGuestGateVisible(false)}
      />
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
  offlineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(SPACING.xs + 2),
    paddingVertical: vs(4),
    borderRadius: ms(RADIUS.full),
    marginRight: s(SPACING.xs),
    gap: s(4),
  },
  offlineText: {
    fontSize: fs(11),
    fontWeight: '600',
    color: '#D97706',
  },
  toolsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: s(SPACING.xs),
    marginBottom: vs(SPACING.sm),
    marginTop: vs(SPACING.xs),
  },
  toolChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(SPACING.sm),
    paddingHorizontal: s(2),
    borderRadius: ms(RADIUS.md),
    borderWidth: 1,
    gap: s(4),
  },
  toolChipText: {
    fontSize: fs(11.5),
    fontWeight: '600',
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
