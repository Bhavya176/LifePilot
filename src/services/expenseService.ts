import {
  addDocument,
  updateDocument,
  removeDocument,
  subscribeToSubCollection,
} from '../firebase/firestore';
import { Expense, ExpenseCategory } from '../types/expense';
import { getTodayString } from '../utils/dateUtils';
import { orderBy } from 'firebase/firestore';

export const expenseService = {
  async addExpense(
    userId: string,
    expenseData: { amount: number; category: ExpenseCategory; description: string; date?: string }
  ): Promise<string> {
    return addDocument(userId, 'expenses', {
      userId,
      amount: expenseData.amount,
      category: expenseData.category,
      description: expenseData.description,
      date: expenseData.date || getTodayString(),
    });
  },

  async deleteExpense(userId: string, expenseId: string): Promise<void> {
    return removeDocument(userId, 'expenses', expenseId);
  },

  subscribeUserExpenses(userId: string, onExpensesUpdate: (expenses: Expense[]) => void) {
    return subscribeToSubCollection<Expense>(
      userId,
      'expenses',
      [orderBy('date', 'desc')],
      onExpensesUpdate
    );
  },
};
