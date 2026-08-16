import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Header } from '../../components/ui/Header';
import { EmptyState } from '../../components/ui/EmptyState';
import { useTasks } from '../../hooks/useTasks';
import { exportService } from '../../services/exportService';
import { useAuthContext } from '../../context/AuthContext';
import { s, vs, ms, fs } from '../../utils/responsive';

type FilterType = 'today' | 'upcoming' | 'completed' | 'high_priority';

export default function TasksScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { user } = useAuthContext();
  const theme = isDarkMode ? COLORS.dark : COLORS.light;
  const [activeFilter, setActiveFilter] = useState<FilterType>('today');
  const { tasks, loading, toggleTask, deleteTask } = useTasks(activeFilter);

  const filters: { label: string; value: FilterType }[] = [
    { label: 'Today', value: 'today' },
    { label: 'Upcoming', value: 'upcoming' },
    { label: 'Completed', value: 'completed' },
    { label: 'High Priority', value: 'high_priority' },
  ];

  const handleExportTasks = async () => {
    try {
      await exportService.exportTasksToPDF(tasks, user?.name || 'LifePilot User');
    } catch (err: any) {
      Alert.alert('Export Error', err.message || 'Failed to export tasks.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title="Tasks"
        subtitle="Manage & prioritize your daily todos"
        isDarkMode={isDarkMode}
        rightAction={
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: isDarkMode ? '#312E81' : '#EEF2FF', marginRight: s(SPACING.xs) }]}
              onPress={handleExportTasks}
              activeOpacity={0.8}
            >
              <Ionicons name="document-text-outline" size={18} color={theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: theme.primary }]}
              onPress={() => router.push('/screens/task-detail')}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filters.map((f) => {
            const isActive = activeFilter === f.value;
            return (
              <TouchableOpacity
                key={f.value}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive
                      ? theme.primary
                      : isDarkMode
                      ? '#1E293B'
                      : '#E2E8F0',
                  },
                ]}
                onPress={() => setActiveFilter(f.value)}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: isActive ? '#FFFFFF' : theme.textSecondary },
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={{ padding: SPACING.xl, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={{ marginTop: SPACING.md, color: theme.textSecondary }}>
              Loading tasks from Firestore...
            </Text>
          </View>
        ) : tasks.length === 0 ? (
          <EmptyState
            title="No Tasks Found"
            description="You don't have any tasks matching this filter yet. Tap + to add one."
            actionTitle="Add New Task"
            onAction={() => router.push('/screens/task-detail')}
            isDarkMode={isDarkMode}
          />
        ) : (
          tasks.map((task) => (
            <Card key={task.id} isDarkMode={isDarkMode} style={styles.taskCard}>
              <View style={styles.taskCardHeader}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => toggleTask(task.id, task.completed)}
                >
                  <Ionicons
                    name={task.completed ? 'checkmark-circle' : 'ellipse-outline'}
                    size={24}
                    color={task.completed ? theme.success : theme.textMuted}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, marginLeft: SPACING.sm }}
                  onPress={() =>
                    router.push({
                      pathname: '/screens/task-detail',
                      params: {
                        id: task.id,
                        title: task.title,
                        description: task.description || '',
                        dueDate: task.dueDate || '',
                        priority: task.priority,
                        category: task.category,
                        reminder: task.reminder ? 'true' : 'false',
                      },
                    })
                  }
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.taskTitle,
                      task.completed ? styles.completed : null,
                      { color: task.completed ? theme.textMuted : theme.textPrimary },
                    ]}
                  >
                    {task.title}
                  </Text>
                  {task.description ? (
                    <Text style={[styles.taskDesc, { color: theme.textSecondary }]}>
                      {task.description}
                    </Text>
                  ) : null}
                  <View style={styles.metaRow}>
                    <Badge label={task.category} variant="primary" isDarkMode={isDarkMode} />
                    <Badge
                      label={task.priority}
                      variant={
                        task.priority === 'high'
                          ? 'danger'
                          : task.priority === 'medium'
                          ? 'warning'
                          : 'success'
                      }
                      isDarkMode={isDarkMode}
                      style={{ marginLeft: 6 }}
                    />
                    <Text style={[styles.dueDateText, { color: theme.textMuted }]}>
                      🕒 {task.dueDate}
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ padding: 6 }}
                  onPress={() => {
                    Alert.alert(
                      'Delete Task',
                      `Are you sure you want to delete "${task.title}"?`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => deleteTask(task.id),
                        },
                      ]
                    );
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color={theme.danger} />
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
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
  filterContainer: {
    paddingHorizontal: s(SPACING.md),
    paddingVertical: vs(SPACING.xs),
    marginBottom: vs(SPACING.xs),
  },
  filterChip: {
    paddingHorizontal: s(SPACING.md),
    paddingVertical: vs(SPACING.xs + 2),
    borderRadius: ms(RADIUS.full),
    marginRight: s(SPACING.xs + 2),
  },
  filterText: {
    fontSize: fs(13),
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: s(SPACING.md),
    paddingBottom: vs(110),
  },
  taskCard: {
    marginBottom: vs(SPACING.sm),
  },
  taskCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    paddingTop: vs(2),
  },
  taskTitle: {
    fontSize: fs(16),
    fontWeight: '700',
  },
  taskDesc: {
    fontSize: fs(13),
    marginTop: vs(4),
  },
  completed: {
    textDecorationLine: 'line-through',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: vs(SPACING.sm),
    flexWrap: 'wrap',
  },
  dueDateText: {
    fontSize: fs(12),
    marginLeft: s(SPACING.sm),
  },
});
