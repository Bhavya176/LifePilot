import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { G, Circle } from 'react-native-svg';
import { Expense } from '../../types/expense';
import { EXPENSE_CATEGORIES } from '../../constants/categories';
import { formatCurrency } from '../../utils/formatters';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { s, vs, ms, fs } from '../../utils/responsive';

interface ExpensePieChartProps {
  expenses: Expense[];
  isDarkMode?: boolean;
}

export const ExpensePieChart: React.FC<ExpensePieChartProps> = ({ expenses, isDarkMode = false }) => {
  const theme = isDarkMode ? COLORS.dark : COLORS.light;
  const totalSpent = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  // Group amounts by category
  const categoryTotals: Record<string, number> = {};

  expenses.forEach((e) => {
    const catKey = (e.category || 'Other').toLowerCase();
    categoryTotals[catKey] = (categoryTotals[catKey] || 0) + (Number(e.amount) || 0);
  });

  const categoriesWithSpent = EXPENSE_CATEGORIES.map((cat) => {
    const amount = categoryTotals[cat.value.toLowerCase()] || 0;
    return {
      ...cat,
      amount,
      percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
    };
  })
    .filter((cat) => cat.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  if (totalSpent === 0 || categoriesWithSpent.length === 0) {
    return null;
  }

  // SVG dimensions for Donut
  const size = ms(140);
  const strokeWidth = ms(18);
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Build slice segments for SVG circle dasharray
  let accumulatedPercent = 0;
  const slices = categoriesWithSpent.map((cat) => {
    const strokeDash = (cat.percentage / 100) * circumference;
    const strokeOffset = (accumulatedPercent / 100) * circumference;
    accumulatedPercent += cat.percentage;
    return {
      ...cat,
      strokeDash,
      strokeOffset,
    };
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Spending Breakdown</Text>
        <Text style={[styles.badgeText, { color: theme.primary, backgroundColor: theme.primaryLight }]}>
          {categoriesWithSpent.length} {categoriesWithSpent.length === 1 ? 'Category' : 'Categories'}
        </Text>
      </View>

      <View style={styles.contentRow}>
        {/* SVG Donut Chart with Center Text */}
        <View style={styles.chartWrapper}>
          <Svg width={size} height={size}>
            {/* Background Track */}
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={isDarkMode ? '#1E293B' : '#F1F5F9'}
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Donut Slices */}
            <G transform={`rotate(-90 ${center} ${center})`}>
              {slices.map((slice, idx) => (
                <Circle
                  key={idx}
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={slice.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${slice.strokeDash} ${circumference - slice.strokeDash}`}
                  strokeDashoffset={-slice.strokeOffset}
                  fill="transparent"
                  strokeLinecap={categoriesWithSpent.length === 1 ? 'butt' : 'round'}
                />
              ))}
            </G>
          </Svg>

          <View style={styles.centerOverlay}>
            <Text style={[styles.centerSub, { color: theme.textSecondary }]}>TOTAL</Text>
            <Text style={[styles.centerAmount, { color: theme.textPrimary }]} numberOfLines={1}>
              {formatCurrency(totalSpent)}
            </Text>
          </View>
        </View>

        {/* Categories Legend List */}
        <View style={styles.legendCol}>
          {categoriesWithSpent.slice(0, 4).map((item) => (
            <View key={item.value} style={styles.legendItem}>
              <View style={styles.legendLeft}>
                <View style={[styles.dot, { backgroundColor: item.color }]} />
                <Text style={[styles.legendLabel, { color: theme.textPrimary }]} numberOfLines={1}>
                  {item.label}
                </Text>
              </View>
              <View style={styles.legendRight}>
                <Text style={[styles.legendAmount, { color: theme.textPrimary }]}>
                  {formatCurrency(item.amount)}
                </Text>
                <Text style={[styles.legendPercent, { color: theme.textSecondary }]}>
                  {item.percentage.toFixed(0)}%
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
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
    fontWeight: '800',
  },
  badgeText: {
    fontSize: fs(10.5),
    fontWeight: '700',
    paddingHorizontal: s(8),
    paddingVertical: vs(3),
    borderRadius: ms(RADIUS.full),
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chartWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: ms(140),
    height: ms(140),
  },
  centerOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: s(6),
  },
  centerSub: {
    fontSize: fs(9),
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  centerAmount: {
    fontSize: fs(13),
    fontWeight: '900',
    marginTop: vs(1),
    textAlign: 'center',
  },
  legendCol: {
    flex: 1,
    marginLeft: s(SPACING.md),
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: vs(3.5),
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: s(4),
  },
  dot: {
    width: ms(8),
    height: ms(8),
    borderRadius: ms(4),
    marginRight: s(6),
  },
  legendLabel: {
    fontSize: fs(12),
    fontWeight: '600',
    flex: 1,
  },
  legendRight: {
    alignItems: 'flex-end',
  },
  legendAmount: {
    fontSize: fs(11.5),
    fontWeight: '700',
  },
  legendPercent: {
    fontSize: fs(9.5),
    fontWeight: '600',
  },
});
