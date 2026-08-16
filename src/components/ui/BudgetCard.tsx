import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CategoryBudget, Expense, ExpenseCategory } from '../../types/expense';
import { EXPENSE_CATEGORIES } from '../../constants/categories';
import { formatCurrency } from '../../utils/formatters';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { s, vs, ms, fs } from '../../utils/responsive';
import { ProgressBar } from './ProgressBar';

interface BudgetCardProps {
  budgets: CategoryBudget[];
  expenses: Expense[];
  onOpenSetBudget: (category?: ExpenseCategory) => void;
  isDarkMode?: boolean;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({
  budgets,
  expenses,
  onOpenSetBudget,
  isDarkMode = false,
}) => {
  const theme = isDarkMode ? COLORS.dark : COLORS.light;

  // Filter current month's expenses
  const currentMonthStr = new Date().toISOString().substring(0, 7); // YYYY-MM
  const monthExpenses = expenses.filter((e) => e.date?.startsWith(currentMonthStr));

  // Map category spent
  const categorySpent: Record<string, number> = {};
  monthExpenses.forEach((e) => {
    const cat = (e.category || 'other').toLowerCase();
    categorySpent[cat] = (categorySpent[cat] || 0) + (e.amount || 0);
  });

  const budgetMap: Record<string, number> = {};
  budgets.forEach((b) => {
    budgetMap[(b.category || '').toLowerCase()] = b.monthlyLimit || 0;
  });

  // Display top categories with budget set or default list
  const activeBudgetCategories = EXPENSE_CATEGORIES.map((cat) => {
    const key = cat.value.toLowerCase();
    const limit = budgetMap[key] || 0;
    const spent = categorySpent[key] || 0;
    const ratio = limit > 0 ? spent / limit : 0;
    return {
      ...cat,
      limit,
      spent,
      ratio,
    };
  }).filter((c) => c.limit > 0 || c.spent > 0);

  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Category Monthly Budgets</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Active limits & real-time threshold tracking
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.setBtn, { backgroundColor: isDarkMode ? '#312E81' : '#EEF2FF' }]}
          onPress={() => onOpenSetBudget()}
        >
          <Text style={[styles.setBtnText, { color: theme.primary }]}>+ Set Budget</Text>
        </TouchableOpacity>
      </View>

      {activeBudgetCategories.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            No budgets configured yet. Set a monthly limit to receive 80% & 100% threshold alerts.
          </Text>
        </View>
      ) : (
        activeBudgetCategories.slice(0, 4).map((item) => {
          const isOver = item.limit > 0 && item.spent >= item.limit;
          const isWarning = item.limit > 0 && item.ratio >= 0.8 && !isOver;
          const progressColor = isOver ? '#EF4444' : isWarning ? '#F59E0B' : item.color;

          return (
            <TouchableOpacity
              key={item.value}
              activeOpacity={0.7}
              onPress={() => onOpenSetBudget(item.value as ExpenseCategory)}
              style={styles.budgetRow}
            >
              <View style={styles.rowTop}>
                <View style={styles.nameGroup}>
                  <View style={[styles.dot, { backgroundColor: item.color }]} />
                  <Text style={[styles.categoryName, { color: theme.textPrimary }]}>{item.label}</Text>
                </View>
                <Text style={[styles.amountText, { color: isOver ? '#EF4444' : theme.textPrimary }]}>
                  {formatCurrency(item.spent)}{' '}
                  <Text style={{ fontSize: fs(11), color: theme.textSecondary, fontWeight: '400' }}>
                    / {item.limit > 0 ? formatCurrency(item.limit) : 'No limit'}
                  </Text>
                </Text>
              </View>

              {item.limit > 0 && (
                <ProgressBar
                  progress={Math.min(item.ratio, 1)}
                  color={progressColor}
                  isDarkMode={isDarkMode}
                  style={{ marginTop: vs(6) }}
                />
              )}
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: ms(RADIUS.lg),
    borderWidth: 1,
    padding: s(SPACING.md),
    marginBottom: vs(SPACING.md),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(SPACING.sm),
  },
  title: {
    fontSize: fs(14),
    fontWeight: '700',
  },
  subtitle: {
    fontSize: fs(11),
    marginTop: vs(1),
  },
  setBtn: {
    paddingHorizontal: s(10),
    paddingVertical: vs(5),
    borderRadius: ms(RADIUS.full),
  },
  setBtnText: {
    fontSize: fs(11.5),
    fontWeight: '700',
  },
  emptyContainer: {
    paddingVertical: vs(SPACING.sm),
  },
  emptyText: {
    fontSize: fs(12),
    lineHeight: fs(17),
  },
  budgetRow: {
    marginVertical: vs(6),
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: ms(8),
    height: ms(8),
    borderRadius: ms(4),
    marginRight: s(6),
  },
  categoryName: {
    fontSize: fs(13),
    fontWeight: '600',
  },
  amountText: {
    fontSize: fs(12.5),
    fontWeight: '700',
  },
});
