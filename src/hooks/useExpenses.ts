import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { expenseService } from '../services/expenseService';
import { Expense, ExpenseCategory } from '../types/expense';
import { auth } from '../firebase/auth';

export function useExpenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const activeUid = auth.currentUser?.uid || user?.uid || 'demo-user-123';

  useEffect(() => {
    setLoading(true);
    const unsubscribe = expenseService.subscribeUserExpenses(activeUid, (fetchedExpenses) => {
      setExpenses(fetchedExpenses);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeUid]);

  const addExpense = async (data: { amount: number; category: ExpenseCategory; description: string; date?: string }) => {
    const uidToUse = auth.currentUser?.uid || user?.uid || 'demo-user-123';
    return expenseService.addExpense(uidToUse, data);
  };

  const deleteExpense = async (expenseId: string) => {
    const uidToUse = auth.currentUser?.uid || user?.uid || 'demo-user-123';
    return expenseService.deleteExpense(uidToUse, expenseId);
  };

  return {
    expenses,
    loading,
    addExpense,
    deleteExpense,
  };
}
