export interface Habit {
  id: string;
  userId: string;
  title: string;
  description?: string;
  frequency: 'daily' | 'weekly';
  completedDates: string[]; // YYYY-MM-DD strings
  currentStreak: number;
  bestStreak: number;
  createdAt: string;
  updatedAt: string;
}
