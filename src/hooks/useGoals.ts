import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { goalService } from '../services/goalService';
import { Goal } from '../types/goal';
import { auth } from '../firebase/auth';

export function useGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const activeUid = auth.currentUser?.uid || user?.uid || 'demo-user-123';

  useEffect(() => {
    setLoading(true);
    const unsubscribe = goalService.subscribeUserGoals(activeUid, (fetchedGoals) => {
      setGoals(fetchedGoals);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeUid]);

  const addGoal = async (data: { title: string; description?: string; targetValue: number; currentValue?: number; unit?: string; deadline: string }) => {
    const uidToUse = auth.currentUser?.uid || user?.uid || 'demo-user-123';
    return goalService.createGoal(uidToUse, data);
  };

  const updateProgress = async (goalId: string, targetValue: number, newCurrentValue: number) => {
    const uidToUse = auth.currentUser?.uid || user?.uid || 'demo-user-123';
    return goalService.updateGoalProgress(uidToUse, goalId, targetValue, newCurrentValue);
  };

  const deleteGoal = async (goalId: string) => {
    const uidToUse = auth.currentUser?.uid || user?.uid || 'demo-user-123';
    return goalService.deleteGoal(uidToUse, goalId);
  };

  return {
    goals,
    loading,
    addGoal,
    updateProgress,
    deleteGoal,
  };
}
