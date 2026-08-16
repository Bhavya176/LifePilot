import {
  addDocument,
  updateDocument,
  removeDocument,
  subscribeToSubCollection,
} from '../firebase/firestore';
import { Task } from '../types/task';
import { AnalyticsService } from '../firebase/analytics';
import { getTodayString } from '../utils/dateUtils';

export const taskService = {
  async createTask(
    userId: string,
    taskData: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const taskId = await addDocument(userId, 'tasks', {
      userId,
      ...taskData,
    });
    AnalyticsService.logEvent('task_created', { category: taskData.category, priority: taskData.priority });
    return taskId;
  },

  async updateTask(
    userId: string,
    taskId: string,
    updates: Partial<Task>
  ): Promise<void> {
    return updateDocument(userId, 'tasks', taskId, updates);
  },

  async toggleTaskCompleted(userId: string, taskId: string, currentCompleted: boolean): Promise<void> {
    const newStatus = !currentCompleted;
    if (newStatus) {
      AnalyticsService.logEvent('task_completed', { taskId });
    }
    return updateDocument(userId, 'tasks', taskId, { completed: newStatus });
  },

  async deleteTask(userId: string, taskId: string): Promise<void> {
    return removeDocument(userId, 'tasks', taskId);
  },

  subscribeUserTasks(
    userId: string,
    onTasksUpdate: (tasks: Task[]) => void,
    filter?: 'today' | 'upcoming' | 'completed' | 'high_priority'
  ) {
    const todayStr = getTodayString();

    return subscribeToSubCollection<Task>(
      userId,
      'tasks',
      [], // Avoid index requirements by querying subcollection directly & sorting in memory
      (rawTasks) => {
        // Sort tasks by createdAt descending
        let filtered = rawTasks.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

        if (filter === 'completed') {
          filtered = filtered.filter((t) => t.completed);
        } else if (filter === 'high_priority') {
          filtered = filtered.filter((t) => t.priority === 'high');
        } else if (filter === 'today') {
          filtered = filtered.filter((t) => t.dueDate === todayStr);
        } else if (filter === 'upcoming') {
          filtered = filtered.filter((t) => !t.completed && t.dueDate >= todayStr);
        }

        onTasksUpdate(filtered);
      }
    );
  },
};
