import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Header } from '../../components/ui/Header';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ExpensePieChart } from '../../components/ui/ExpensePieChart';
import { BudgetCard } from '../../components/ui/BudgetCard';
import { EXPENSE_CATEGORIES } from '../../constants/categories';
import { formatCurrency } from '../../utils/formatters';
import { getTodayString } from '../../utils/dateUtils';
import { s, vs, ms, fs } from '../../utils/responsive';
import { useExpenses } from '../../hooks/useExpenses';
import { useBudgets } from '../../hooks/useBudgets';
import { exportService } from '../../services/exportService';
import { useAuthContext } from '../../context/AuthContext';
import { Expense, ExpenseCategory } from '../../types/expense';

export default function ExpensesScreen() {
  const { isDarkMode } = useTheme();
  const { user } = useAuthContext();
  const theme = isDarkMode ? COLORS.dark : COLORS.light;
  const { expenses, loading, addExpense, deleteExpense } = useExpenses();
  const { budgets, saveBudget, checkAlert } = useBudgets();

  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | 'all'>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);

  // Expense form state
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Food');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(getTodayString());
  const [submitting, setSubmitting] = useState(false);

  // Budget form state
  const [budgetCat, setBudgetCat] = useState<ExpenseCategory>('Food');
  const [budgetLimitInput, setBudgetLimitInput] = useState('');
  const [savingBudget, setSavingBudget] = useState(false);

  // Compute live spending stats
  const todayStr = getTodayString();
  const currentMonthStr = todayStr.substring(0, 7); // YYYY-MM
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  const todayTotal = expenses
    .filter((e) => e.date === todayStr)
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const weekTotal = expenses
    .filter((e) => (e.date || '') >= sevenDaysAgoStr)
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const monthTotal = expenses
    .filter((e) => (e.date || '').startsWith(currentMonthStr))
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const filteredExpenses = expenses.filter((e) => {
    if (selectedCategory === 'all') return true;
    return (e.category || '').toLowerCase() === selectedCategory.toLowerCase();
  });

  const handleCreateExpense = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid expense amount.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Validation Error', 'Please enter an expense description.');
      return;
    }

    setSubmitting(true);
    try {
      await addExpense({
        amount: numAmount,
        category,
        description: description.trim(),
        date: date || todayStr,
      });

      // Check category budget alert
      const targetBudget = budgets.find((b) => (b.category || '').toLowerCase() === category.toLowerCase());
      if (targetBudget && targetBudget.monthlyLimit > 0) {
        const catMonthSpent = expenses
          .filter((e) => e.date?.startsWith(currentMonthStr) && (e.category || '').toLowerCase() === category.toLowerCase())
          .reduce((sum, e) => sum + (Number(e.amount) || 0), 0) + numAmount;
        await checkAlert(category, catMonthSpent, targetBudget.monthlyLimit);
      }

      setAmount('');
      setDescription('');
      setDate(getTodayString());
      setCategory('Food');
      setModalVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save expense in Firestore.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenBudgetModal = (catToEdit?: ExpenseCategory) => {
    const targetCat = catToEdit || 'Food';
    setBudgetCat(targetCat);
    const existing = budgets.find((b) => (b.category || '').toLowerCase() === targetCat.toLowerCase());
    setBudgetLimitInput(existing ? String(existing.monthlyLimit) : '');
    setBudgetModalVisible(true);
  };

  const handleSaveBudgetLimit = async () => {
    const limitNum = parseFloat(budgetLimitInput);
    if (isNaN(limitNum) || limitNum < 0) {
      Alert.alert('Validation Error', 'Please enter a valid monthly budget limit.');
      return;
    }

    setSavingBudget(true);
    try {
      await saveBudget(budgetCat, limitNum);
      setBudgetModalVisible(false);
      Alert.alert('Budget Saved', `Monthly limit of ${formatCurrency(limitNum)} set for ${budgetCat}.`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save budget limit.');
    } finally {
      setSavingBudget(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      await exportService.exportExpensesToPDF(expenses, user?.name || 'LifePilot User');
    } catch (err: any) {
      Alert.alert('Export Error', err.message || 'Failed to export PDF.');
    }
  };

  const handleExportCSV = async () => {
    try {
      await exportService.exportExpensesToCSV(expenses);
    } catch (err: any) {
      Alert.alert('Export Error', err.message || 'Failed to export CSV.');
    }
  };

  const handleDeleteExpense = (item: Expense) => {
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to remove "${item.description}" (${formatCurrency(item.amount)})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteExpense(item.id);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete expense.');
            }
          },
        },
      ]
    );
  };

  const getCategoryMeta = (catVal: string) => {
    return (
      EXPENSE_CATEGORIES.find((c) => c.value === catVal) || {
        label: catVal,
        icon: 'receipt-outline',
        color: '#6366F1',
      }
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title="Expenses"
        subtitle="Track daily spending & categories"
        isDarkMode={isDarkMode}
        rightAction={
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              style={[
                styles.addBtn,
                { backgroundColor: isDarkMode ? '#312E81' : '#EEF2FF', marginRight: s(SPACING.xs) },
              ]}
              onPress={() => setExportModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="download-outline" size={18} color={theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: theme.primary }]}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Totals Summary Banner */}
        <Card isDarkMode={isDarkMode} style={styles.totalsCard}>
          <Text style={[styles.cardTitle, { color: theme.textSecondary }]}>
            This Month's Spending
          </Text>
          <Text style={[styles.mainTotal, { color: theme.textPrimary }]}>
            {formatCurrency(monthTotal)}
          </Text>
          <Text style={[styles.mainTotalLabel, { color: theme.textMuted }]}>
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>

          <View style={[styles.totalsGrid, { borderTopColor: theme.border }]}>
            <View style={styles.totalBox}>
              <Text style={[styles.subTotal, { color: theme.primary }]}>
                {formatCurrency(todayTotal)}
              </Text>
              <Text style={[styles.subTotalLabel, { color: theme.textSecondary }]}>Today</Text>
            </View>

            <View style={styles.totalBox}>
              <Text style={[styles.subTotal, { color: theme.accent }]}>
                {formatCurrency(weekTotal)}
              </Text>
              <Text style={[styles.subTotalLabel, { color: theme.textSecondary }]}>Last 7 Days</Text>
            </View>
          </View>
        </Card>

        {/* Visual Category Distribution Pie Chart */}
        <ExpensePieChart expenses={expenses} isDarkMode={isDarkMode} />

        {/* Category Budget Limits & Tracking */}
        <BudgetCard
          budgets={budgets}
          expenses={expenses}
          onOpenSetBudget={handleOpenBudgetModal}
          isDarkMode={isDarkMode}
        />

        {/* Category Filters */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Filter by Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          <TouchableOpacity
            style={[
              styles.categoryCard,
              {
                backgroundColor:
                  selectedCategory === 'all'
                    ? theme.primary
                    : isDarkMode
                    ? '#1E293B'
                    : '#FFFFFF',
              },
            ]}
            onPress={() => setSelectedCategory('all')}
          >
            <Ionicons
              name="apps"
              size={20}
              color={selectedCategory === 'all' ? '#FFFFFF' : theme.textPrimary}
            />
            <Text
              style={[
                styles.catName,
                { color: selectedCategory === 'all' ? '#FFFFFF' : theme.textPrimary },
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          {EXPENSE_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.value;
            return (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.categoryCard,
                  {
                    backgroundColor: isSelected
                      ? theme.primary
                      : isDarkMode
                      ? '#1E293B'
                      : '#FFFFFF',
                  },
                ]}
                onPress={() => setSelectedCategory(cat.value as ExpenseCategory)}
              >
                <View
                  style={[
                    styles.catIconWrapper,
                    { backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : `${cat.color}20` },
                  ]}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={20}
                    color={isSelected ? '#FFFFFF' : cat.color}
                  />
                </View>
                <Text
                  style={[
                    styles.catName,
                    { color: isSelected ? '#FFFFFF' : theme.textPrimary },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Transactions List */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            {selectedCategory === 'all'
              ? `All Expenses (${expenses.length})`
              : `${getCategoryMeta(selectedCategory).label} (${filteredExpenses.length})`}
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={{ marginTop: SPACING.md, color: theme.textSecondary }}>
              Loading expenses from Firestore...
            </Text>
          </View>
        ) : filteredExpenses.length === 0 ? (
          <EmptyState
            title="No Expenses Logged"
            description={
              selectedCategory === 'all'
                ? "You haven't recorded any expenses yet. Tap + to log your first spend."
                : `No expenses found in the "${getCategoryMeta(selectedCategory).label}" category.`
            }
            actionTitle={selectedCategory === 'all' ? 'Add Expense' : 'Show All Expenses'}
            onAction={
              selectedCategory === 'all'
                ? () => setModalVisible(true)
                : () => setSelectedCategory('all')
            }
            iconName="wallet-outline"
            isDarkMode={isDarkMode}
          />
        ) : (
          <Card isDarkMode={isDarkMode}>
            {filteredExpenses.map((item, idx) => {
              const meta = getCategoryMeta(item.category);
              return (
                <React.Fragment key={item.id}>
                  {idx > 0 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
                  <View style={styles.transactionRow}>
                    <View style={[styles.catIconWrapper, { backgroundColor: `${meta.color}20` }]}>
                      <Ionicons name={meta.icon as any} size={20} color={meta.color} />
                    </View>

                    <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                      <Text style={[styles.transTitle, { color: theme.textPrimary }]}>
                        {item.description}
                      </Text>
                      <Text style={[styles.transDate, { color: theme.textSecondary }]}>
                        {item.date} • {meta.label}
                      </Text>
                    </View>

                    <Text style={[styles.transAmount, { color: theme.danger }]}>
                      -{formatCurrency(item.amount)}
                    </Text>

                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDeleteExpense(item)}
                    >
                      <Ionicons name="trash-outline" size={18} color={theme.textMuted} />
                    </TouchableOpacity>
                  </View>
                </React.Fragment>
              );
            })}
          </Card>
        )}
      </ScrollView>

      {/* Add Expense Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View style={styles.handleWrapper}>
              <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />
            </View>

            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                Add New Expense
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <Input
              label="Amount ($) *"
              placeholder="e.g. 18.50"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              isDarkMode={isDarkMode}
              leftIcon={<Ionicons name="cash-outline" size={20} color={theme.textMuted} />}
            />

            <Input
              label="Description *"
              placeholder="e.g. Lunch with team, Metro card refill"
              value={description}
              onChangeText={setDescription}
              isDarkMode={isDarkMode}
            />

            <Input
              label="Date (YYYY-MM-DD)"
              placeholder={todayStr}
              value={date}
              onChangeText={setDate}
              isDarkMode={isDarkMode}
              leftIcon={<Ionicons name="calendar-outline" size={20} color={theme.textMuted} />}
            />

            <Text style={[styles.categoryLabel, { color: theme.textPrimary }]}>
              Category
            </Text>
            <View style={styles.categoryGrid}>
              {EXPENSE_CATEGORIES.map((cat) => {
                const isSelected = category === cat.value;
                return (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.categoryPickerPill,
                      {
                        backgroundColor: isSelected
                          ? theme.primary
                          : isDarkMode
                          ? '#1E293B'
                          : '#E2E8F0',
                      },
                    ]}
                    onPress={() => setCategory(cat.value as ExpenseCategory)}
                  >
                    <Ionicons
                      name={cat.icon as any}
                      size={16}
                      color={isSelected ? '#FFFFFF' : cat.color}
                    />
                    <Text
                      style={[
                        styles.catPickerText,
                        { color: isSelected ? '#FFFFFF' : theme.textPrimary },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setModalVisible(false)}
                isDarkMode={isDarkMode}
                style={{ flex: 1, marginRight: SPACING.sm }}
              />
              <Button
                title="Save Expense"
                onPress={handleCreateExpense}
                loading={submitting}
                isDarkMode={isDarkMode}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Set Category Budget Modal */}
      <Modal visible={budgetModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.handleWrapper}>
              <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />
            </View>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                Set Category Budget
              </Text>
              <TouchableOpacity onPress={() => setBudgetModalVisible(false)}>
                <Ionicons name="close-circle-outline" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.categoryLabel, { color: theme.textSecondary }]}>Select Category</Text>
            <View style={styles.categoryGrid}>
              {EXPENSE_CATEGORIES.map((cat) => {
                const isSelected = budgetCat === cat.value;
                return (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.categoryPickerPill,
                      {
                        backgroundColor: isSelected
                          ? theme.primary
                          : isDarkMode
                          ? '#1E293B'
                          : '#F1F5F9',
                      },
                    ]}
                    onPress={() => setBudgetCat(cat.value as ExpenseCategory)}
                  >
                    <Ionicons
                      name={cat.icon as any}
                      size={16}
                      color={isSelected ? '#FFFFFF' : cat.color}
                    />
                    <Text
                      style={[
                        styles.catPickerText,
                        { color: isSelected ? '#FFFFFF' : theme.textPrimary },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Input
              label="Monthly Limit ($)"
              placeholder="e.g. 500"
              keyboardType="numeric"
              value={budgetLimitInput}
              onChangeText={setBudgetLimitInput}
              isDarkMode={isDarkMode}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setBudgetModalVisible(false)}
                isDarkMode={isDarkMode}
                style={{ flex: 1, marginRight: s(SPACING.sm) }}
              />
              <Button
                title="Save Budget"
                onPress={handleSaveBudgetLimit}
                loading={savingBudget}
                isDarkMode={isDarkMode}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Export Statement Modal */}
      <Modal visible={exportModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlayCenter}>
          <View style={[styles.centerModalBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                Export Expense Report
              </Text>
              <TouchableOpacity onPress={() => setExportModalVisible(false)}>
                <Ionicons name="close-circle-outline" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: fs(13), color: theme.textSecondary, marginBottom: vs(SPACING.md), lineHeight: fs(18) }}>
              Generate a printable report of all {expenses.length} recorded transactions:
            </Text>

            <Button
              title="📄 Export PDF Statement"
              onPress={() => {
                setExportModalVisible(false);
                handleExportPDF();
              }}
              isDarkMode={isDarkMode}
              style={{ marginBottom: vs(SPACING.sm) }}
            />

            <Button
              title="📊 Export CSV (Excel) Spreadsheet"
              variant="outline"
              onPress={() => {
                setExportModalVisible(false);
                handleExportCSV();
              }}
              isDarkMode={isDarkMode}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  addBtn: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(RADIUS.full),
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: s(SPACING.md),
    paddingBottom: vs(110),
  },
  totalsCard: {
    alignItems: 'center',
    paddingVertical: vs(SPACING.lg),
    marginBottom: vs(SPACING.md),
  },
  cardTitle: {
    fontSize: fs(13),
    fontWeight: '600',
  },
  mainTotal: {
    fontSize: fs(32),
    fontWeight: '800',
    marginTop: vs(4),
  },
  mainTotalLabel: {
    fontSize: fs(12),
    marginTop: vs(2),
  },
  totalsGrid: {
    flexDirection: 'row',
    width: '100%',
    marginTop: vs(SPACING.md),
    paddingTop: vs(SPACING.md),
    borderTopWidth: 1,
  },
  totalBox: {
    flex: 1,
    alignItems: 'center',
  },
  subTotal: {
    fontSize: fs(18),
    fontWeight: '800',
  },
  subTotalLabel: {
    fontSize: fs(12),
    marginTop: vs(2),
  },
  sectionTitle: {
    fontSize: fs(18),
    fontWeight: '700',
    marginBottom: vs(SPACING.xs),
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: vs(SPACING.sm),
    marginBottom: vs(SPACING.xs),
  },
  categoryScroll: {
    marginVertical: vs(SPACING.xs),
  },
  categoryCard: {
    paddingHorizontal: s(SPACING.md),
    paddingVertical: vs(SPACING.sm),
    borderRadius: ms(RADIUS.md),
    marginRight: s(SPACING.sm),
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: s(80),
    height: vs(70),
  },
  catIconWrapper: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(RADIUS.full),
    alignItems: 'center',
    justifyContent: 'center',
  },
  catName: {
    fontSize: fs(12),
    fontWeight: '600',
    marginTop: vs(SPACING.xs),
  },
  loadingContainer: {
    padding: s(SPACING.xl),
    alignItems: 'center',
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(SPACING.xs + 2),
  },
  transTitle: {
    fontSize: fs(15),
    fontWeight: '600',
  },
  transDate: {
    fontSize: fs(12),
    marginTop: vs(2),
  },
  transAmount: {
    fontSize: fs(15),
    fontWeight: '700',
    marginRight: s(SPACING.xs),
  },
  deleteBtn: {
    padding: s(6),
  },
  divider: {
    height: 1,
    marginVertical: vs(SPACING.xs),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: ms(28),
    borderTopRightRadius: ms(28),
    paddingHorizontal: s(SPACING.lg),
    paddingTop: vs(SPACING.sm),
    paddingBottom: vs(SPACING.xl),
    borderWidth: 1,
  },
  handleWrapper: {
    alignItems: 'center',
    paddingVertical: vs(SPACING.xs),
    marginBottom: vs(SPACING.xs),
  },
  modalHandle: {
    width: s(40),
    height: vs(4),
    borderRadius: ms(2),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(SPACING.md),
  },
  modalTitle: {
    fontSize: fs(18),
    fontWeight: '700',
  },
  categoryLabel: {
    fontSize: fs(14),
    fontWeight: '600',
    marginBottom: vs(SPACING.xs),
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: vs(SPACING.lg),
  },
  categoryPickerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(SPACING.md),
    paddingVertical: vs(SPACING.xs + 2),
    borderRadius: ms(RADIUS.full),
    marginRight: s(SPACING.xs + 2),
    marginBottom: vs(SPACING.xs + 2),
  },
  catPickerText: {
    fontSize: fs(13),
    fontWeight: '600',
    marginLeft: s(6),
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: vs(SPACING.sm),
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: s(SPACING.lg),
  },
  centerModalBox: {
    borderRadius: ms(24),
    padding: s(SPACING.lg),
    borderWidth: 1,
  },
});
