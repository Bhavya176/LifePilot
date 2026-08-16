import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { habitService } from '../services/habitService';
import { Habit } from '../types/habit';
import { auth } from '../firebase/auth';

export function useHabits() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const activeUid = auth.currentUser?.uid || user?.uid || 'demo-user-123';

  useEffect(() => {
    setLoading(true);
    const unsubscribe = habitService.subscribeUserHabits(activeUid, (fetchedHabits) => {
      setHabits(fetchedHabits);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeUid]);

  const addHabit = async (data: { title: string; description?: string; frequency?: 'daily' | 'weekly' }) => {
    const uidToUse = auth.currentUser?.uid || user?.uid || 'demo-user-123';
    return habitService.createHabit(uidToUse, data);
  };

  const toggleHabit = async (habit: Habit, dateStr?: string) => {
    const uidToUse = auth.currentUser?.uid || user?.uid || 'demo-user-123';
    return habitService.toggleHabitCompletion(uidToUse, habit, dateStr);
  };

  const deleteHabit = async (habitId: string) => {
    const uidToUse = auth.currentUser?.uid || user?.uid || 'demo-user-123';
    return habitService.deleteHabit(uidToUse, habitId);
  };

  return {
    habits,
    loading,
    addHabit,
    toggleHabit,
    deleteHabit,
  };
}
