export type ExpenseCategory = 'Food' | 'Transport' | 'Shopping' | 'Bills' | 'Entertainment' | 'Other' | 'food' | 'transport' | 'shopping' | 'bills' | 'entertainment' | 'other';

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  title?: string;
  date: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}

export interface CategoryBudget {
  id: string;
  userId: string;
  category: ExpenseCategory;
  monthlyLimit: number;
  updatedAt: string;
}

