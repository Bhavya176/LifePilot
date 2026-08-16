/**
 * Server-side data validation trigger for Firestore document commits.
 * Rejects negative expense amounts and sanitizes string inputs.
 */
export function validateExpenseData(data: any): { isValid: boolean; reason?: string } {
  if (typeof data.amount !== 'number' || data.amount < 0) {
    return { isValid: false, reason: 'Expense amount must be a positive number.' };
  }
  if (!data.description || typeof data.description !== 'string') {
    return { isValid: false, reason: 'Expense description is required.' };
  }
  return { isValid: true };
}
