import {
  addDocument,
  updateDocument,
  removeDocument,
  subscribeToSubCollection,
} from '../firebase/firestore';
import { Goal } from '../types/goal';
import { orderBy } from 'firebase/firestore';

export const goalService = {
  async createGoal(
    userId: string,
    goalData: { title: string; description?: string; targetValue: number; currentValue?: number; unit?: string; deadline: string }
  ): Promise<string> {
    const currentValue = goalData.currentValue || 0;
    const completed = currentValue >= goalData.targetValue;
    return addDocument(userId, 'goals', {
      userId,
      title: goalData.title,
      description: goalData.description || '',
      targetValue: goalData.targetValue,
      currentValue,
      unit: goalData.unit || '',
      deadline: goalData.deadline,
      completed,
    });
  },

  async updateGoalProgress(userId: string, goalId: string, targetValue: number, newCurrentValue: number): Promise<void> {
    const completed = newCurrentValue >= targetValue;
    return updateDocument(userId, 'goals', goalId, {
      currentValue: newCurrentValue,
      completed,
    });
  },

  async deleteGoal(userId: string, goalId: string): Promise<void> {
    return removeDocument(userId, 'goals', goalId);
  },

  subscribeUserGoals(userId: string, onGoalsUpdate: (goals: Goal[]) => void) {
    return subscribeToSubCollection<Goal>(
      userId,
      'goals',
      [orderBy('createdAt', 'desc')],
      onGoalsUpdate
    );
  },
};
