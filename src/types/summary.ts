export interface DailySummary {
  date: string; // YYYY-MM-DD
  userId: string;
  tasksCompleted: number;
  tasksTotal: number;
  habitsCompleted: number;
  habitsTotal: number;
  totalExpense: number;
  activeGoalsCount: number;
  productivityScore: number; // 0 - 100
  aiInsight?: string;
  createdAt: string;
}

export interface WeeklySummary {
  weekStartDate: string; // YYYY-MM-DD
  userId: string;
  tasksCompleted: number;
  habitsCompleted: number;
  totalExpenses: number;
  topCategory: string;
  createdAt: string;
}
