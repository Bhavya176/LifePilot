import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Header } from '../../components/ui/Header';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { useHabits } from '../../hooks/useHabits';
import { getTodayString } from '../../utils/dateUtils';
import { s, vs, ms, fs } from '../../utils/responsive';
import { Habit } from '../../types/habit';

export default function HabitsScreen() {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? COLORS.dark : COLORS.light;
  const { habits, loading, addHabit, toggleHabit, deleteHabit } = useHabits();

  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const [submitting, setSubmitting] = useState(false);

  const todayStr = getTodayString();
  const totalHabits = habits.length;
  const completedToday = habits.filter((h) => h.completedDates?.includes(todayStr)).length;
  const completionPercent = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;
  const bestStreakOverall = habits.reduce(
    (max, h) => Math.max(max, h.bestStreak || 0, h.currentStreak || 0),
    0
  );

  const handleCreateHabit = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a habit title.');
      return;
    }
    setSubmitting(true);
    try {
      await addHabit({
        title: title.trim(),
        description: description.trim(),
        frequency,
      });
      setTitle('');
      setDescription('');
      setFrequency('daily');
      setModalVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create habit in Firestore.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteHabit = (habit: Habit) => {
    Alert.alert(
      'Delete Habit',
      `Are you sure you want to remove "${habit.title}" and its streak history?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteHabit(habit.id);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete habit.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title="Habits"
        subtitle="Build daily discipline & track your streaks"
        isDarkMode={isDarkMode}
        rightAction={
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: theme.primary }]}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Habit Summary Banner */}
        <Card isDarkMode={isDarkMode} style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryStat}>
              <Text style={[styles.statNumber, { color: theme.warning }]}>
                {bestStreakOverall} {bestStreakOverall === 1 ? 'Day' : 'Days'}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Best Streak</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={styles.summaryStat}>
              <Text style={[styles.statNumber, { color: theme.success }]}>
                {completionPercent}%
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Today's Target ({completedToday}/{totalHabits})
              </Text>
            </View>
          </View>
        </Card>

        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Daily Habits ({habits.length})
        </Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={{ marginTop: SPACING.md, color: theme.textSecondary }}>
              Loading habits from Firestore...
            </Text>
          </View>
        ) : habits.length === 0 ? (
          <EmptyState
            title="No Habits Yet"
            description="Start building positive routines. Tap + to add your first habit tracker."
            actionTitle="Add New Habit"
            onAction={() => setModalVisible(true)}
            iconName="flame-outline"
            isDarkMode={isDarkMode}
          />
        ) : (
          habits.map((habit) => {
            const isCompletedToday = habit.completedDates?.includes(todayStr);
            const streak = habit.currentStreak || 0;
            const best = habit.bestStreak || 0;

            return (
              <Card key={habit.id} isDarkMode={isDarkMode} style={styles.habitCard}>
                <View style={styles.habitMain}>
                  <View
                    style={[
                      styles.habitIcon,
                      {
                        backgroundColor: isCompletedToday
                          ? isDarkMode
                            ? '#064E3B'
                            : '#D1FAE5'
                          : theme.primaryLight,
                      },
                    ]}
                  >
                    <Ionicons
                      name={isCompletedToday ? 'checkmark-circle' : 'flame-outline'}
                      size={24}
                      color={isCompletedToday ? theme.success : theme.primary}
                    />
                  </View>

                  <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                    <Text
                      style={[
                        styles.habitTitle,
                        { color: theme.textPrimary },
                        isCompletedToday ? styles.completedText : null,
                      ]}
                    >
                      {habit.title}
                    </Text>
                    {habit.description ? (
                      <Text style={[styles.habitSubtitle, { color: theme.textSecondary }]}>
                        {habit.description}
                      </Text>
                    ) : null}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.checkBtn,
                      {
                        backgroundColor: isCompletedToday
                          ? theme.success
                          : isDarkMode
                          ? '#1E293B'
                          : '#E2E8F0',
                      },
                    ]}
                    onPress={() => toggleHabit(habit, todayStr)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={isCompletedToday ? 'checkmark' : 'add'}
                      size={22}
                      color={isCompletedToday ? '#FFFFFF' : theme.textPrimary}
                    />
                  </TouchableOpacity>
                </View>

                <View style={[styles.habitFooter, { borderTopColor: theme.border }]}>
                  <View style={styles.badgeRow}>
                    <Badge
                      label={`🔥 ${streak} ${streak === 1 ? 'day' : 'days'} streak`}
                      variant={streak > 0 ? 'warning' : 'neutral'}
                      isDarkMode={isDarkMode}
                    />
                    <Text style={[styles.bestStreakText, { color: theme.textMuted }]}>
                      Best: {best} {best === 1 ? 'day' : 'days'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDeleteHabit(habit)}
                  >
                    <Ionicons name="trash-outline" size={18} color={theme.danger} />
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Add Habit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View style={styles.handleWrapper}>
              <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />
            </View>

            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                Add Daily Habit
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <Input
              label="Habit Name *"
              placeholder="e.g. Read 20 mins, Drink 2L Water, 30 Min Workout"
              value={title}
              onChangeText={setTitle}
              isDarkMode={isDarkMode}
            />

            <Input
              label="Description (Optional)"
              placeholder="e.g. Morning routine, after breakfast"
              value={description}
              onChangeText={setDescription}
              isDarkMode={isDarkMode}
            />

            <Text style={[styles.frequencyLabel, { color: theme.textPrimary }]}>
              Frequency
            </Text>
            <View style={styles.freqRow}>
              {(['daily', 'weekly'] as const).map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[
                    styles.freqChip,
                    {
                      backgroundColor:
                        frequency === f
                          ? theme.primary
                          : isDarkMode
                          ? '#1E293B'
                          : '#E2E8F0',
                    },
                  ]}
                  onPress={() => setFrequency(f)}
                >
                  <Text
                    style={[
                      styles.freqText,
                      { color: frequency === f ? '#FFFFFF' : theme.textSecondary },
                    ]}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setModalVisible(false)}
                isDarkMode={isDarkMode}
                style={{ flex: 1, marginRight: SPACING.sm }}
              />
              <Button
                title="Create Habit"
                onPress={handleCreateHabit}
                loading={submitting}
                isDarkMode={isDarkMode}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  addBtn: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(RADIUS.full),
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: s(SPACING.md),
    paddingBottom: vs(110),
  },
  summaryCard: {
    marginBottom: vs(SPACING.md),
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  summaryStat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: fs(22),
    fontWeight: '800',
  },
  statLabel: {
    fontSize: fs(12),
    marginTop: vs(2),
  },
  divider: {
    width: 1,
    height: vs(36),
  },
  sectionTitle: {
    fontSize: fs(18),
    fontWeight: '700',
    marginBottom: vs(SPACING.sm),
  },
  loadingContainer: {
    padding: s(SPACING.xl),
    alignItems: 'center',
  },
  habitCard: {
    marginBottom: vs(SPACING.sm),
  },
  habitMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  habitIcon: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(RADIUS.md),
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitTitle: {
    fontSize: fs(16),
    fontWeight: '700',
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.75,
  },
  habitSubtitle: {
    fontSize: fs(12),
    marginTop: vs(2),
  },
  checkBtn: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(RADIUS.full),
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: vs(SPACING.md),
    paddingTop: vs(SPACING.xs + 2),
    borderTopWidth: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bestStreakText: {
    fontSize: fs(12),
    marginLeft: s(SPACING.sm),
  },
  deleteBtn: {
    padding: s(6),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: ms(28),
    borderTopRightRadius: ms(28),
    paddingHorizontal: s(SPACING.lg),
    paddingTop: vs(SPACING.sm),
    paddingBottom: vs(SPACING.xl),
    borderWidth: 1,
  },
  handleWrapper: {
    alignItems: 'center',
    paddingVertical: vs(SPACING.xs),
    marginBottom: vs(SPACING.xs),
  },
  modalHandle: {
    width: s(40),
    height: vs(4),
    borderRadius: ms(2),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(SPACING.md),
  },
  modalTitle: {
    fontSize: fs(18),
    fontWeight: '700',
  },
  frequencyLabel: {
    fontSize: fs(14),
    fontWeight: '600',
    marginBottom: vs(SPACING.xs),
  },
  freqRow: {
    flexDirection: 'row',
    marginBottom: vs(SPACING.lg),
  },
  freqChip: {
    paddingHorizontal: s(SPACING.md),
    paddingVertical: vs(SPACING.xs + 2),
    borderRadius: ms(RADIUS.full),
    marginRight: s(SPACING.sm),
  },
  freqText: {
    fontSize: fs(13),
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: vs(SPACING.sm),
  },
});
