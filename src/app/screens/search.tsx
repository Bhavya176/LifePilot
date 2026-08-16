import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { s, vs, ms, fs } from '../../utils/responsive';
import { useTasks } from '../../hooks/useTasks';
import { useHabits } from '../../hooks/useHabits';
import { useExpenses } from '../../hooks/useExpenses';
import { useGoals } from '../../hooks/useGoals';
import { useNotes } from '../../hooks/useNotes';
import { formatCurrency } from '../../utils/formatters';

interface SearchResult {
  id: string;
  type: 'task' | 'note' | 'habit' | 'expense' | 'goal';
  title: string;
  subtitle?: string;
  icon: string;
  iconColor: string;
  badgeLabel: string;
  badgeVariant: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

export default function SearchScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? COLORS.dark : COLORS.light;

  const { tasks } = useTasks();
  const { habits } = useHabits();
  const { expenses } = useExpenses();
  const { goals } = useGoals();
  const { notes } = useNotes();

  const [query, setQuery] = useState('');

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];

    const matches: SearchResult[] = [];

    // Search tasks
    tasks.forEach((t) => {
      if (t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)) {
        matches.push({
          id: t.id,
          type: 'task',
          title: t.title,
          subtitle: t.dueDate ? `Due: ${t.dueDate}` : undefined,
          icon: 'checkbox-outline',
          iconColor: '#6366F1',
          badgeLabel: '📋 Task',
          badgeVariant: 'primary',
        });
      }
    });

    // Search notes
    notes.forEach((n) => {
      if (n.title.toLowerCase().includes(q) || n.content?.toLowerCase().includes(q)) {
        matches.push({
          id: n.id,
          type: 'note',
          title: n.title,
          subtitle: n.content?.substring(0, 60) || undefined,
          icon: 'document-text-outline',
          iconColor: '#3B82F6',
          badgeLabel: '📝 Note',
          badgeVariant: 'info',
        });
      }
    });

    // Search habits
    habits.forEach((h) => {
      if (h.title.toLowerCase().includes(q) || h.description?.toLowerCase().includes(q)) {
        matches.push({
          id: h.id,
          type: 'habit',
          title: h.title,
          subtitle: `Streak: ${h.currentStreak} days`,
          icon: 'flame-outline',
          iconColor: '#10B981',
          badgeLabel: '🔥 Habit',
          badgeVariant: 'success',
        });
      }
    });

    // Search expenses
    expenses.forEach((e) => {
      const desc = e.description || e.title || '';
      if (desc.toLowerCase().includes(q) || e.category?.toLowerCase().includes(q)) {
        matches.push({
          id: e.id,
          type: 'expense',
          title: desc || e.category,
          subtitle: `${formatCurrency(e.amount)} • ${e.date}`,
          icon: 'wallet-outline',
          iconColor: '#F59E0B',
          badgeLabel: '💰 Expense',
          badgeVariant: 'warning',
        });
      }
    });

    // Search goals
    goals.forEach((g) => {
      if (g.title.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q)) {
        const pct = g.targetValue > 0 ? Math.round((g.currentValue / g.targetValue) * 100) : 0;
        matches.push({
          id: g.id,
          type: 'goal',
          title: g.title,
          subtitle: `Progress: ${pct}%`,
          icon: 'trophy-outline',
          iconColor: '#EC4899',
          badgeLabel: '🎯 Goal',
          badgeVariant: 'danger',
        });
      }
    });

    return matches.slice(0, 30); // cap at 30 results
  }, [query, tasks, notes, habits, expenses, goals]);

  const handleResultTap = (result: SearchResult) => {
    if (result.type === 'task') {
      const task = tasks.find((t) => t.id === result.id);
      if (task) {
        router.push({
          pathname: '/screens/task-detail',
          params: {
            id: task.id,
            title: task.title,
            description: task.description || '',
            dueDate: task.dueDate,
            priority: task.priority,
            category: task.category,
            reminder: task.reminder ? 'true' : 'false',
          },
        });
      }
    } else if (result.type === 'note') {
      const note = notes.find((n) => n.id === result.id);
      if (note) {
        router.push({
          pathname: '/screens/note-detail',
          params: {
            id: note.id,
            title: note.title,
            content: note.content,
            isPinned: note.isPinned ? 'true' : 'false',
          },
        });
      }
    } else if (result.type === 'goal') {
      router.push('/screens/goals');
    }
  };

  const totalCount = tasks.length + notes.length + habits.length + expenses.length + goals.length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Search Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={[styles.searchBar, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
          <Ionicons name="search-outline" size={18} color={theme.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder="Search tasks, notes, habits, expenses..."
            placeholderTextColor={theme.textMuted}
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {query.length < 2 ? (
          <View style={styles.hintContainer}>
            <Ionicons name="sparkles-outline" size={48} color={theme.textMuted} />
            <Text style={[styles.hintTitle, { color: theme.textSecondary }]}>
              Search across everything
            </Text>
            <Text style={[styles.hintSubtitle, { color: theme.textMuted }]}>
              {totalCount} items indexed • Tasks, Notes, Habits, Expenses & Goals
            </Text>
          </View>
        ) : results.length === 0 ? (
          <EmptyState
            title="No Results Found"
            description={`No matches for "${query}" across your data.`}
            isDarkMode={isDarkMode}
            iconName="search-outline"
          />
        ) : (
          <>
            <Text style={[styles.resultCount, { color: theme.textSecondary }]}>
              {results.length} result{results.length > 1 ? 's' : ''} found
            </Text>

            {results.map((r) => (
              <TouchableOpacity key={`${r.type}-${r.id}`} activeOpacity={0.7} onPress={() => handleResultTap(r)}>
                <Card isDarkMode={isDarkMode} style={styles.resultCard}>
                  <View style={styles.resultRow}>
                    <View style={[styles.resultIcon, { backgroundColor: r.iconColor + '20' }]}>
                      <Ionicons name={r.icon as any} size={20} color={r.iconColor} />
                    </View>
                    <View style={{ flex: 1, marginLeft: s(SPACING.sm) }}>
                      <Text style={[styles.resultTitle, { color: theme.textPrimary }]}>{r.title}</Text>
                      {r.subtitle && (
                        <Text style={[styles.resultSub, { color: theme.textSecondary }]} numberOfLines={1}>
                          {r.subtitle}
                        </Text>
                      )}
                    </View>
                    <Badge label={r.badgeLabel} variant={r.badgeVariant} isDarkMode={isDarkMode} />
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(SPACING.md),
    paddingVertical: vs(SPACING.sm),
  },
  backBtn: {
    marginRight: s(SPACING.sm),
    padding: s(4),
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(SPACING.sm + 4),
    paddingVertical: vs(SPACING.sm),
    borderRadius: ms(RADIUS.full),
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: fs(14),
    marginLeft: s(8),
    paddingVertical: 0,
  },
  scrollContent: {
    paddingHorizontal: s(SPACING.md),
    paddingBottom: vs(SPACING.xl),
  },
  hintContainer: {
    alignItems: 'center',
    paddingTop: vs(SPACING.xl * 2),
  },
  hintTitle: {
    fontSize: fs(16),
    fontWeight: '700',
    marginTop: vs(SPACING.md),
  },
  hintSubtitle: {
    fontSize: fs(12.5),
    marginTop: vs(4),
    textAlign: 'center',
  },
  resultCount: {
    fontSize: fs(12),
    fontWeight: '600',
    marginBottom: vs(SPACING.sm),
    marginTop: vs(SPACING.xs),
  },
  resultCard: {
    padding: s(SPACING.sm + 2),
    marginBottom: vs(SPACING.xs),
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultIcon: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTitle: {
    fontSize: fs(13.5),
    fontWeight: '600',
  },
  resultSub: {
    fontSize: fs(11),
    marginTop: vs(2),
  },
});
