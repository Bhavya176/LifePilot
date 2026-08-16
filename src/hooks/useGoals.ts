import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { goalService } from '../services/goalService';
import { Goal } from '../types/goal';
import { auth } from '../firebase/auth';
import { getGamificationProfile, awardXP } from '../services/gamificationService';

export function useGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const activeUid = auth.currentUser?.uid || user?.uid;

  useEffect(() => {
    if (!activeUid) {
      setGoals([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = goalService.subscribeUserGoals(activeUid, (fetchedGoals) => {
      setGoals(fetchedGoals);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeUid]);

  const addGoal = async (data: { title: string; description?: string; targetValue: number; currentValue?: number; unit?: string; deadline: string }) => {
    const uidToUse = auth.currentUser?.uid || user?.uid;
    if (!uidToUse) throw new Error('You must be signed in to add goals.');
    return goalService.createGoal(uidToUse, data);
  };

  const updateProgress = async (goalId: string, targetValue: number, newCurrentValue: number) => {
    const uidToUse = auth.currentUser?.uid || user?.uid;
    if (!uidToUse) return;
    const res = await goalService.updateGoalProgress(uidToUse, goalId, targetValue, newCurrentValue);
    if (targetValue > 0 && newCurrentValue >= targetValue) {
      getGamificationProfile(uidToUse).then((p) => awardXP(uidToUse, 'GOAL_100_PERCENT', p)).catch(() => {});
    }
    return res;
  };

  const deleteGoal = async (goalId: string) => {
    const uidToUse = auth.currentUser?.uid || user?.uid;
    if (!uidToUse) return;
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
