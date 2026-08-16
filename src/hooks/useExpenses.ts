import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { expenseService } from '../services/expenseService';
import { Expense, ExpenseCategory } from '../types/expense';
import { auth } from '../firebase/auth';
import { getGamificationProfile, awardXP } from '../services/gamificationService';

export function useExpenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const activeUid = auth.currentUser?.uid || user?.uid;

  useEffect(() => {
    if (!activeUid) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = expenseService.subscribeUserExpenses(activeUid, (fetchedExpenses) => {
      setExpenses(fetchedExpenses);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeUid]);

  const addExpense = async (data: { amount: number; category: ExpenseCategory; description: string; date?: string }) => {
    const uidToUse = auth.currentUser?.uid || user?.uid;
    if (!uidToUse) throw new Error('You must be signed in to log expenses.');
    const added = await expenseService.addExpense(uidToUse, data);
    getGamificationProfile(uidToUse).then((p) => awardXP(uidToUse, 'LOG_EXPENSE', p)).catch(() => {});
    return added;
  };

  const deleteExpense = async (expenseId: string) => {
    const uidToUse = auth.currentUser?.uid || user?.uid;
    if (!uidToUse) return;
    return expenseService.deleteExpense(uidToUse, expenseId);
  };

  return {
    expenses,
    loading,
    addExpense,
    deleteExpense,
  };
}
