import { ExpenseCategory } from '../types/expense';
import { TaskCategory, TaskPriority } from '../types/task';

export const TASK_CATEGORIES: { label: string; value: TaskCategory; icon: string }[] = [
  { label: 'Work', value: 'work', icon: 'briefcase-outline' },
  { label: 'Personal', value: 'personal', icon: 'person-outline' },
  { label: 'Health', value: 'health', icon: 'heart-outline' },
  { label: 'Finance', value: 'finance', icon: 'cash-outline' },
  { label: 'Learning', value: 'learning', icon: 'book-outline' },
  { label: 'Other', value: 'other', icon: 'ellipsis-horizontal-outline' },
];

export const TASK_PRIORITIES: { label: string; value: TaskPriority; color: string }[] = [
  { label: 'Low', value: 'low', color: '#10B981' },
  { label: 'Medium', value: 'medium', color: '#F59E0B' },
  { label: 'High', value: 'high', color: '#EF4444' },
];

export const EXPENSE_CATEGORIES: { label: ExpenseCategory; value: ExpenseCategory; icon: string; color: string }[] = [
  { label: 'Food', value: 'Food', icon: 'fast-food-outline', color: '#F59E0B' },
  { label: 'Transport', value: 'Transport', icon: 'car-outline', color: '#3B82F6' },
  { label: 'Shopping', value: 'Shopping', icon: 'bag-handle-outline', color: '#EC4899' },
  { label: 'Bills', value: 'Bills', icon: 'receipt-outline', color: '#EF4444' },
  { label: 'Entertainment', value: 'Entertainment', icon: 'game-controller-outline', color: '#8B5CF6' },
  { label: 'Other', value: 'Other', icon: 'shapes-outline', color: '#6B7280' },
];

export const DOCUMENT_CATEGORIES = ['ID', 'Receipt', 'Certificate', 'Contract', 'Other'] as const;
