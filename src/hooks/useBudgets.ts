import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { budgetService } from '../services/budgetService';
import { CategoryBudget, ExpenseCategory } from '../types/expense';

export function useBudgets() {
  const { user } = useAuth();
  const userId = user?.uid;
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [loading, setLoading] = useState<boolean>(Boolean(userId));

  useEffect(() => {
    if (!userId) {
      return;
    }

    const unsubscribe = budgetService.subscribeUserBudgets(userId, (fetched) => {
      setBudgets(fetched);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const saveBudget = async (category: ExpenseCategory, monthlyLimit: number) => {
    if (!user) return;
    return budgetService.setCategoryBudget(user.uid, category, monthlyLimit);
  };

  const checkAlert = async (category: string, spentAmount: number, budgetLimit: number) => {
    return budgetService.checkBudgetAlert(category, spentAmount, budgetLimit);
  };

  return {
    budgets,
    loading,
    saveBudget,
    checkAlert,
  };
}
