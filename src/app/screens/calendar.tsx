import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { Header } from '../../components/ui/Header';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { s, vs, ms, fs } from '../../utils/responsive';
import { useTasks } from '../../hooks/useTasks';
import { useHabits } from '../../hooks/useHabits';
import { useExpenses } from '../../hooks/useExpenses';
import { formatCurrency } from '../../utils/formatters';
import { getTodayString } from '../../utils/dateUtils';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? COLORS.dark : COLORS.light;

  const { tasks, toggleTask } = useTasks('all' as any);
  const { habits } = useHabits();
  const { expenses } = useExpenses();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(getTodayString());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Month navigation
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleJumpToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(getTodayString());
  };

  // Month calculation
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Create grid cells
  const calendarCells = useMemo(() => {
    const cells: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    // Padding for previous month
    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push({ dateStr: '', dayNum: 0, isCurrentMonth: false });
    }

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(day).padStart(2, '0');
      const dateStr = `${year}-${mStr}-${dStr}`;
      cells.push({ dateStr, dayNum: day, isCurrentMonth: true });
    }

    return cells;
  }, [year, month, firstDayOfWeek, daysInMonth]);

  // Aggregated data maps for dot indicators
  const tasksByDate = useMemo(() => {
    const map: Record<string, typeof tasks> = {};
    tasks.forEach((t) => {
      if (t.dueDate) {
        if (!map[t.dueDate]) map[t.dueDate] = [];
        map[t.dueDate].push(t);
      }
    });
    return map;
  }, [tasks]);

  const habitsByDate = useMemo(() => {
    const map: Record<string, typeof habits> = {};
    habits.forEach((h) => {
      (h.completedDates || []).forEach((d) => {
        if (!map[d]) map[d] = [];
        map[d].push(h);
      });
    });
    return map;
  }, [habits]);

  const expensesByDate = useMemo(() => {
    const map: Record<string, typeof expenses> = {};
    expenses.forEach((e) => {
      if (e.date) {
        if (!map[e.date]) map[e.date] = [];
        map[e.date].push(e);
      }
    });
    return map;
  }, [expenses]);

  // Data for the currently selected date
  const selectedTasks = tasksByDate[selectedDateStr] || [];
  const selectedHabits = habitsByDate[selectedDateStr] || [];
  const selectedExpenses = expensesByDate[selectedDateStr] || [];
  const selectedExpenseTotal = selectedExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const selectedDatePretty = new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title="Agenda Calendar"
        subtitle="Month overview with tasks, habits & spending"
        showBack
        isDarkMode={isDarkMode}
        rightAction={
          <TouchableOpacity
            style={[styles.todayBtn, { backgroundColor: isDarkMode ? '#312E81' : '#EEF2FF' }]}
            onPress={handleJumpToday}
          >
            <Text style={[styles.todayBtnText, { color: theme.primary }]}>Today</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Calendar Card */}
        <Card isDarkMode={isDarkMode} style={styles.calendarCard}>
          {/* Month Header Controller */}
          <View style={styles.monthHeader}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
              <Ionicons name="chevron-back" size={20} color={theme.textPrimary} />
            </TouchableOpacity>

            <Text style={[styles.monthTitle, { color: theme.textPrimary }]}>{monthName}</Text>

            <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
              <Ionicons name="chevron-forward" size={20} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Days of Week Header */}
          <View style={styles.daysOfWeekRow}>
            {DAYS_OF_WEEK.map((dayName, idx) => (
              <Text
                key={dayName}
                style={[
                  styles.dayOfWeekText,
                  { color: idx === 0 || idx === 6 ? theme.textMuted : theme.textSecondary },
                ]}
              >
                {dayName}
              </Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.gridContainer}>
            {calendarCells.map((cell, idx) => {
              if (!cell.isCurrentMonth) {
                return <View key={idx} style={styles.emptyDayCell} />;
              }

              const isSelected = cell.dateStr === selectedDateStr;
              const isToday = cell.dateStr === getTodayString();
              const hasTasks = Boolean(tasksByDate[cell.dateStr]?.length);
              const hasHabits = Boolean(habitsByDate[cell.dateStr]?.length);
              const hasExpenses = Boolean(expensesByDate[cell.dateStr]?.length);

              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.7}
                  onPress={() => setSelectedDateStr(cell.dateStr)}
                  style={[
                    styles.dayCell,
                    isSelected && [styles.selectedDayCell, { backgroundColor: theme.primary }],
                    isToday && !isSelected && [
                      styles.todayCell,
                      { borderColor: theme.accent, borderWidth: 1.5 },
                    ],
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNumText,
                      {
                        color: isSelected
                          ? '#FFFFFF'
                          : isToday
                          ? theme.accent
                          : theme.textPrimary,
                        fontWeight: isSelected || isToday ? '800' : '500',
                      },
                    ]}
                  >
                    {cell.dayNum}
                  </Text>

                  {/* Dot Badges */}
                  <View style={styles.dotsRow}>
                    {hasTasks && (
                      <View
                        style={[
                          styles.dot,
                          { backgroundColor: isSelected ? '#FFFFFF' : '#3B82F6' },
                        ]}
                      />
                    )}
                    {hasHabits && (
                      <View
                        style={[
                          styles.dot,
                          { backgroundColor: isSelected ? '#FFFFFF' : '#10B981' },
                        ]}
                      />
                    )}
                    {hasExpenses && (
                      <View
                        style={[
                          styles.dot,
                          { backgroundColor: isSelected ? '#FFFFFF' : '#F59E0B' },
                        ]}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Legend */}
          <View style={[styles.legendRow, { borderTopColor: theme.border }]}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
              <Text style={[styles.legendText, { color: theme.textSecondary }]}>Tasks</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
              <Text style={[styles.legendText, { color: theme.textSecondary }]}>Habits</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={[styles.legendText, { color: theme.textSecondary }]}>Expenses</Text>
            </View>
          </View>
        </Card>

        {/* Selected Day Agenda Section */}
        <View style={styles.agendaHeaderRow}>
          <Text style={[styles.agendaTitle, { color: theme.textPrimary }]}>
            {selectedDatePretty}
          </Text>
        </View>

        {/* 1. Tasks Scheduled on Date */}
        <View style={styles.agendaSection}>
          <View style={styles.sectionSubHeader}>
            <Text style={[styles.subHeaderTitle, { color: theme.textPrimary }]}>
              📋 Scheduled Tasks ({selectedTasks.length})
            </Text>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/screens/task-detail',
                  params: { dueDate: selectedDateStr },
                })
              }
            >
              <Text style={[styles.addLink, { color: theme.primary }]}>+ Add Task</Text>
            </TouchableOpacity>
          </View>

          {selectedTasks.length === 0 ? (
            <Text style={[styles.emptySectionText, { color: theme.textMuted }]}>
              No tasks due on this date.
            </Text>
          ) : (
            selectedTasks.map((t) => (
              <Card key={t.id} isDarkMode={isDarkMode} style={styles.itemCard}>
                <View style={styles.itemRow}>
                  <TouchableOpacity onPress={() => toggleTask(t.id, t.completed)}>
                    <Ionicons
                      name={t.completed ? 'checkmark-circle' : 'ellipse-outline'}
                      size={22}
                      color={t.completed ? theme.success : theme.textMuted}
                    />
                  </TouchableOpacity>
                  <View style={{ flex: 1, marginLeft: s(SPACING.sm) }}>
                    <Text
                      style={[
                        styles.itemTitle,
                        {
                          color: t.completed ? theme.textMuted : theme.textPrimary,
                          textDecorationLine: t.completed ? 'line-through' : 'none',
                        },
                      ]}
                    >
                      {t.title}
                    </Text>
                    {t.description ? (
                      <Text style={[styles.itemDesc, { color: theme.textSecondary }]}>
                        {t.description}
                      </Text>
                    ) : null}
                  </View>
                  <Badge
                    label={t.priority}
                    variant={
                      t.priority === 'high'
                        ? 'danger'
                        : t.priority === 'medium'
                        ? 'warning'
                        : 'success'
                    }
                    isDarkMode={isDarkMode}
                  />
                </View>
              </Card>
            ))
          )}
        </View>

        {/* 2. Habits Completed on Date */}
        <View style={styles.agendaSection}>
          <Text style={[styles.subHeaderTitle, { color: theme.textPrimary }]}>
            🔥 Habits Completed ({selectedHabits.length})
          </Text>
          {selectedHabits.length === 0 ? (
            <Text style={[styles.emptySectionText, { color: theme.textMuted }]}>
              No habits checked in on this date.
            </Text>
          ) : (
            selectedHabits.map((h) => (
              <Card key={h.id} isDarkMode={isDarkMode} style={styles.itemCard}>
                <View style={styles.itemRow}>
                  <Ionicons name="checkmark-done-circle" size={22} color={theme.success} />
                  <Text style={[styles.itemTitle, { color: theme.textPrimary, marginLeft: s(SPACING.sm) }]}>
                    {h.title}
                  </Text>
                  <Badge label="Completed" variant="success" isDarkMode={isDarkMode} />
                </View>
              </Card>
            ))
          )}
        </View>

        {/* 3. Expenses on Date */}
        <View style={[styles.agendaSection, { marginBottom: vs(SPACING.xl) }]}>
          <View style={styles.sectionSubHeader}>
            <Text style={[styles.subHeaderTitle, { color: theme.textPrimary }]}>
              💳 Expenses Logged ({selectedExpenses.length})
            </Text>
            {selectedExpenseTotal > 0 && (
              <Text style={[styles.totalSpentText, { color: theme.danger }]}>
                {formatCurrency(selectedExpenseTotal)}
              </Text>
            )}
          </View>

          {selectedExpenses.length === 0 ? (
            <Text style={[styles.emptySectionText, { color: theme.textMuted }]}>
              No expenses recorded on this date.
            </Text>
          ) : (
            selectedExpenses.map((exp) => (
              <Card key={exp.id} isDarkMode={isDarkMode} style={styles.itemCard}>
                <View style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemTitle, { color: theme.textPrimary }]}>
                      {exp.description || exp.title || 'Expense'}
                    </Text>
                    <Text style={[styles.itemDesc, { color: theme.textSecondary }]}>
                      {exp.category}
                    </Text>
                  </View>
                  <Text style={[styles.expenseAmount, { color: theme.danger }]}>
                    {formatCurrency(exp.amount)}
                  </Text>
                </View>
              </Card>
            ))
          )}
        </View>
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
  todayBtn: {
    paddingHorizontal: s(12),
    paddingVertical: vs(5),
    borderRadius: ms(RADIUS.full),
  },
  todayBtnText: {
    fontSize: fs(12),
    fontWeight: '700',
  },
  calendarCard: {
    padding: s(SPACING.md),
    marginBottom: vs(SPACING.md),
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(SPACING.sm),
  },
  monthTitle: {
    fontSize: fs(16),
    fontWeight: '800',
  },
  navBtn: {
    padding: s(6),
  },
  daysOfWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: vs(SPACING.xs),
    marginBottom: vs(SPACING.xs),
  },
  dayOfWeekText: {
    fontSize: fs(11),
    fontWeight: '700',
    width: `${100 / 7}%`,
    textAlign: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyDayCell: {
    width: `${100 / 7}%`,
    height: vs(42),
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: vs(42),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ms(10),
    marginVertical: vs(1.5),
  },
  selectedDayCell: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  todayCell: {
    borderRadius: ms(10),
  },
  dayNumText: {
    fontSize: fs(13),
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: vs(4),
    marginTop: vs(2),
  },
  dot: {
    width: ms(4),
    height: ms(4),
    borderRadius: ms(2),
    marginHorizontal: s(1),
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    marginTop: vs(SPACING.sm),
    paddingTop: vs(SPACING.xs + 2),
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: ms(6),
    height: ms(6),
    borderRadius: ms(3),
    marginRight: s(4),
  },
  legendText: {
    fontSize: fs(10.5),
    fontWeight: '600',
  },
  agendaHeaderRow: {
    marginTop: vs(SPACING.xs),
    marginBottom: vs(SPACING.sm),
  },
  agendaTitle: {
    fontSize: fs(16),
    fontWeight: '800',
  },
  agendaSection: {
    marginBottom: vs(SPACING.md),
  },
  sectionSubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(SPACING.xs),
  },
  subHeaderTitle: {
    fontSize: fs(13.5),
    fontWeight: '700',
  },
  addLink: {
    fontSize: fs(12),
    fontWeight: '700',
  },
  totalSpentText: {
    fontSize: fs(13.5),
    fontWeight: '800',
  },
  emptySectionText: {
    fontSize: fs(12),
    fontStyle: 'italic',
    paddingVertical: vs(SPACING.xs),
  },
  itemCard: {
    padding: s(SPACING.sm + 2),
    marginBottom: vs(SPACING.xs),
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemTitle: {
    fontSize: fs(13.5),
    fontWeight: '600',
  },
  itemDesc: {
    fontSize: fs(11.5),
    marginTop: vs(2),
  },
  expenseAmount: {
    fontSize: fs(13.5),
    fontWeight: '700',
  },
});
