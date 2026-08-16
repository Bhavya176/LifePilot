import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { budgetService } from '../services/budgetService';
import { CategoryBudget, ExpenseCategory } from '../types/expense';

export function useBudgets() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user) {
      setBudgets([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = budgetService.subscribeUserBudgets(user.uid, (fetched) => {
      setBudgets(fetched);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

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
