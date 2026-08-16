import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { G, Path, Circle, Text as SvgText } from 'react-native-svg';
import { Expense, ExpenseCategory } from '../../types/expense';
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
  const totalSpent = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);

  // Group amounts by category
  const categoryTotals: Record<string, number> = {};

  expenses.forEach((e) => {
    const catKey = (e.category || 'Other').toLowerCase();
    categoryTotals[catKey] = (categoryTotals[catKey] || 0) + (e.amount || 0);
  });

  const categoriesWithSpent = EXPENSE_CATEGORIES.map((cat) => {
    const amount = categoryTotals[cat.value.toLowerCase()] || 0;
    return {
      ...cat,
      amount,
      percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
    };
  }).filter((cat) => cat.amount > 0);

  if (totalSpent === 0 || categoriesWithSpent.length === 0) {
    return null;
  }

  // SVG dimensions
  const size = s(180);
  const radius = size / 2;
  const strokeWidth = s(28);
  const innerRadius = radius - strokeWidth;
  const center = radius;

  // Compute SVG arcs
  let accumulatedAngle = 0;
  const slices = categoriesWithSpent.map((cat) => {
    const angle = (cat.amount / totalSpent) * 360;
    const startAngle = accumulatedAngle;
    const endAngle = accumulatedAngle + angle;
    accumulatedAngle += angle;

    // Convert angles to polar coordinates
    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;

    const x1 = center + innerRadius * Math.cos(startRad);
    const y1 = center + innerRadius * Math.sin(startRad);
    const x2 = center + innerRadius * Math.cos(endRad);
    const y2 = center + innerRadius * Math.sin(endRad);

    const x3 = center + radius * Math.cos(endRad);
    const y3 = center + radius * Math.sin(endRad);
    const x4 = center + radius * Math.cos(startRad);
    const y4 = center + radius * Math.sin(startRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const pathData = `
      M ${x1} ${y1}
      A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}
      L ${x3} ${y3}
      A ${radius} ${radius} 0 ${largeArcFlag} 0 ${x4} ${y4}
      Z
    `;

    return {
      ...cat,
      pathData,
    };
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>Spending Distribution</Text>

      <View style={styles.chartRow}>
        {/* SVG Donut Chart */}
        <View style={styles.svgWrapper}>
          <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <G>
              {slices.map((slice, i) => (
                <Path key={i} d={slice.pathData} fill={slice.color} stroke={theme.card} strokeWidth={2} />
              ))}
            </G>
          </Svg>
          <View style={styles.centerLabel}>
            <Text style={[styles.centerSub, { color: theme.textSecondary }]}>Total</Text>
            <Text style={[styles.centerAmount, { color: theme.textPrimary }]} numberOfLines={1}>
              {formatCurrency(totalSpent)}
            </Text>
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legendContainer}>
          {categoriesWithSpent.map((item) => (
            <View key={item.value} style={styles.legendRow}>
              <View style={[styles.colorDot, { backgroundColor: item.color }]} />
              <Text style={[styles.legendLabel, { color: theme.textPrimary }]} numberOfLines={1}>
                {item.label}
              </Text>
              <Text style={[styles.legendPct, { color: theme.textSecondary }]}>
                {item.percentage.toFixed(0)}%
              </Text>
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
  title: {
    fontSize: fs(14),
    fontWeight: '700',
    marginBottom: vs(SPACING.sm),
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  svgWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerSub: {
    fontSize: fs(10),
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  centerAmount: {
    fontSize: fs(14),
    fontWeight: '800',
    maxWidth: s(90),
  },
  legendContainer: {
    flex: 1,
    marginLeft: s(SPACING.md),
    justifyContent: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: vs(2.5),
  },
  colorDot: {
    width: ms(10),
    height: ms(10),
    borderRadius: ms(5),
    marginRight: s(6),
  },
  legendLabel: {
    fontSize: fs(12),
    fontWeight: '600',
    flex: 1,
  },
  legendPct: {
    fontSize: fs(11),
    fontWeight: '700',
    marginLeft: s(4),
  },
});
