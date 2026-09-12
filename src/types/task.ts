export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskCategory = 'work' | 'personal' | 'health' | 'finance' | 'learning' | 'other';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  isDaily?: boolean; // If true, repeats daily at dueTime
  notificationId?: string; // Scheduled local notification ID
  priority: TaskPriority;
  category: TaskCategory;
  completed: boolean;
  reminder: boolean;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}
