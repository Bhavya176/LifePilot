import {
  getUserCollectionRef,
  setDocumentWithId,
  subscribeToSubCollection,
} from '../firebase/firestore';
import { CategoryBudget, ExpenseCategory } from '../types/expense';
import { scheduleLocalReminder } from '../firebase/messaging';
import { formatCurrency } from '../utils/formatters';

const SUB_COLLECTION = 'budgets';

export const budgetService = {
  /**
   * Subscribe in real-time to user's category budgets
   */
  subscribeUserBudgets(userId: string, onData: (budgets: CategoryBudget[]) => void) {
    return subscribeToSubCollection<CategoryBudget>(userId, SUB_COLLECTION, [], onData);
  },

  /**
   * Set or update monthly budget for a category
   */
  async setCategoryBudget(userId: string, category: ExpenseCategory, monthlyLimit: number): Promise<void> {
    const docId = category.toLowerCase();
    await setDocumentWithId<CategoryBudget>(userId, SUB_COLLECTION, docId, {
      id: docId,
      userId,
      category,
      monthlyLimit,
      updatedAt: new Date().toISOString(),
    });
  },

  /**
   * Check budget threshold and trigger notification if over 80% or 100%
   */
  async checkBudgetAlert(category: string, spentAmount: number, budgetLimit: number): Promise<void> {
    if (budgetLimit <= 0) return;
    const ratio = spentAmount / budgetLimit;

    if (ratio >= 1.0) {
      await scheduleLocalReminder(
        `🚨 Budget Exceeded: ${category}`,
        `You have spent ${formatCurrency(spentAmount)}, which exceeds your monthly limit of ${formatCurrency(budgetLimit)}!`,
        1
      );
    } else if (ratio >= 0.8) {
      await scheduleLocalReminder(
        `⚠️ Budget Alert: ${category}`,
        `You have used ${(ratio * 100).toFixed(0)}% (${formatCurrency(spentAmount)}) of your ${formatCurrency(budgetLimit)} monthly budget.`,
        1
      );
    }
  },
};
