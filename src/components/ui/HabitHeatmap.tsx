import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Habit } from '../../types/habit';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { s, vs, ms, fs } from '../../utils/responsive';

interface HabitHeatmapProps {
  habits: Habit[];
  isDarkMode?: boolean;
}

export const HabitHeatmap: React.FC<HabitHeatmapProps> = ({ habits, isDarkMode = false }) => {
  const theme = isDarkMode ? COLORS.dark : COLORS.light;
  const [selectedDay, setSelectedDay] = useState<{ date: string; count: number; total: number } | null>(null);

  // Generate the last 14 weeks (98 days)
  const totalDays = 98;
  const today = new Date();
  const dayList: { dateStr: string; dayOfWeek: number; monthName: string; dayNum: number }[] = [];

  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    dayList.push({
      dateStr,
      dayOfWeek: d.getDay(), // 0 = Sun, 6 = Sat
      monthName: d.toLocaleDateString('en-US', { month: 'short' }),
      dayNum: d.getDate(),
    });
  }

  // Count completions per date
  const dateCounts: Record<string, number> = {};
  let totalCompletionsLast90Days = 0;

  habits.forEach((h) => {
    (h.completedDates || []).forEach((dStr) => {
      dateCounts[dStr] = (dateCounts[dStr] || 0) + 1;
      totalCompletionsLast90Days++;
    });
  });

  // Group into columns (weeks of 7 days)
  const weeks: { dateStr: string; count: number; dayOfWeek: number; monthName: string }[][] = [];
  let currentWeek: { dateStr: string; count: number; dayOfWeek: number; monthName: string }[] = [];

  dayList.forEach((item) => {
    const count = dateCounts[item.dateStr] || 0;
    currentWeek.push({ ...item, count });
    if (item.dayOfWeek === 6 || currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  // Intensity color generator
  const getCellColor = (count: number, total: number) => {
    if (total === 0 || count === 0) {
      return isDarkMode ? '#1E293B' : '#E2E8F0';
    }
    const ratio = count / total;
    if (ratio <= 0.25) return '#A7F3D0'; // Level 1
    if (ratio <= 0.5) return '#34D399';  // Level 2
    if (ratio <= 0.75) return '#10B981'; // Level 3
    return '#047857';                   // Level 4 (Max)
  };

  const totalActiveHabits = habits.length;

  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Habit Consistency Matrix</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {totalCompletionsLast90Days} check-ins across last 14 weeks
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: isDarkMode ? '#064E3B' : '#D1FAE5' }]}>
          <Text style={[styles.badgeText, { color: '#059669' }]}>🔥 Consistency</Text>
        </View>
      </View>

      {/* Selected Date Tooltip */}
      {selectedDay && (
        <View style={[styles.tooltip, { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' }]}>
          <Text style={[styles.tooltipText, { color: theme.textPrimary }]}>
            📅 {selectedDay.date}:{' '}
            <Text style={{ fontWeight: '800', color: theme.primary }}>
              {selectedDay.count} of {selectedDay.total}
            </Text>{' '}
            habits completed
          </Text>
        </View>
      )}

      {/* Horizontal Scrollable Heatmap Grid */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gridScroll}>
        <View style={styles.matrixWrapper}>
          {weeks.map((week, wIdx) => (
            <View key={wIdx} style={styles.weekColumn}>
              {week.map((day) => {
                const cellColor = getCellColor(day.count, totalActiveHabits);
                const isToday = day.dateStr === today.toISOString().split('T')[0];
                return (
                  <TouchableOpacity
                    key={day.dateStr}
                    activeOpacity={0.7}
                    onPress={() => setSelectedDay({ date: day.dateStr, count: day.count, total: totalActiveHabits })}
                    style={[
                      styles.cell,
                      {
                        backgroundColor: cellColor,
                        borderColor: isToday ? '#F59E0B' : 'transparent',
                        borderWidth: isToday ? 1.5 : 0,
                      },
                    ]}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Legend Footer */}
      <View style={styles.footerLegend}>
        <Text style={[styles.legendText, { color: theme.textSecondary }]}>Less</Text>
        <View style={[styles.cellMini, { backgroundColor: isDarkMode ? '#1E293B' : '#E2E8F0' }]} />
        <View style={[styles.cellMini, { backgroundColor: '#A7F3D0' }]} />
        <View style={[styles.cellMini, { backgroundColor: '#34D399' }]} />
        <View style={[styles.cellMini, { backgroundColor: '#10B981' }]} />
        <View style={[styles.cellMini, { backgroundColor: '#047857' }]} />
        <Text style={[styles.legendText, { color: theme.textSecondary }]}>More</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: ms(RADIUS.lg),
    borderWidth: 1,
    padding: s(SPACING.md),
    marginBottom: vs(SPACING.md),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(SPACING.xs),
  },
  title: {
    fontSize: fs(14),
    fontWeight: '700',
  },
  subtitle: {
    fontSize: fs(11),
    marginTop: vs(1),
  },
  badge: {
    paddingHorizontal: s(8),
    paddingVertical: vs(3),
    borderRadius: ms(RADIUS.full),
  },
  badgeText: {
    fontSize: fs(10.5),
    fontWeight: '700',
  },
  tooltip: {
    paddingHorizontal: s(SPACING.sm),
    paddingVertical: vs(4),
    borderRadius: ms(RADIUS.sm),
    marginVertical: vs(6),
  },
  tooltipText: {
    fontSize: fs(11.5),
  },
  gridScroll: {
    marginVertical: vs(SPACING.xs),
  },
  matrixWrapper: {
    flexDirection: 'row',
    paddingVertical: vs(4),
  },
  weekColumn: {
    flexDirection: 'column',
    marginRight: s(3.5),
  },
  cell: {
    width: ms(13),
    height: ms(13),
    borderRadius: ms(3),
    marginBottom: vs(3.5),
  },
  footerLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: vs(SPACING.xs),
  },
  legendText: {
    fontSize: fs(10),
    marginHorizontal: s(4),
  },
  cellMini: {
    width: ms(9),
    height: ms(9),
    borderRadius: ms(2),
    marginHorizontal: s(1.5),
  },
});
