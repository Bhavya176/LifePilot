import {
  addDocument,
  updateDocument,
  removeDocument,
  subscribeToSubCollection,
} from '../firebase/firestore';
import { Habit } from '../types/habit';
import { calculateHabitStreak, getTodayString } from '../utils/dateUtils';
import { orderBy } from 'firebase/firestore';

export const habitService = {
  async createHabit(
    userId: string,
    habitData: { title: string; description?: string; frequency?: 'daily' | 'weekly' }
  ): Promise<string> {
    return addDocument(userId, 'habits', {
      userId,
      title: habitData.title,
      description: habitData.description || '',
      frequency: habitData.frequency || 'daily',
      completedDates: [],
      currentStreak: 0,
      bestStreak: 0,
    });
  },

  async toggleHabitCompletion(userId: string, habit: Habit, dateStr: string = getTodayString()): Promise<void> {
    let updatedDates = [...(habit.completedDates || [])];
    if (updatedDates.includes(dateStr)) {
      updatedDates = updatedDates.filter((d) => d !== dateStr);
    } else {
      updatedDates.push(dateStr);
    }

    const { currentStreak, bestStreak } = calculateHabitStreak(updatedDates);

    return updateDocument(userId, 'habits', habit.id, {
      completedDates: updatedDates,
      currentStreak,
      bestStreak: Math.max(bestStreak, habit.bestStreak || 0),
    });
  },

  async deleteHabit(userId: string, habitId: string): Promise<void> {
    return removeDocument(userId, 'habits', habitId);
  },

  subscribeUserHabits(userId: string, onHabitsUpdate: (habits: Habit[]) => void) {
    return subscribeToSubCollection<Habit>(
      userId,
      'habits',
      [orderBy('createdAt', 'desc')],
      onHabitsUpdate
    );
  },
};
