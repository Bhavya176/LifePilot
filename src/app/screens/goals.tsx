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
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { useGoals } from '../../hooks/useGoals';
import { Goal } from '../../types/goal';
import { getTodayString } from '../../utils/dateUtils';
import { triggerGoalMilestoneAlert } from '../../firebase/messaging';
import { s, vs, ms, fs } from '../../utils/responsive';

export default function GoalsScreen() {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? COLORS.dark : COLORS.light;
  const { goals, loading, addGoal, updateProgress, deleteGoal } = useGoals();

  // Add Goal Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [currentValue, setCurrentValue] = useState('0');
  const [unit, setUnit] = useState('books');
  const [deadline, setDeadline] = useState('2026-12-31');
  const [submitting, setSubmitting] = useState(false);

  // Progress Update Modal State
  const [progressModalVisible, setProgressModalVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [incrementAmount, setIncrementAmount] = useState('1');
  const [updatingProgress, setUpdatingProgress] = useState(false);

  const handleCreateGoal = async () => {
    const numTarget = parseFloat(targetValue);
    const numCurrent = parseFloat(currentValue) || 0;

    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a goal title.');
      return;
    }
    if (isNaN(numTarget) || numTarget <= 0) {
      Alert.alert('Validation Error', 'Target value must be greater than 0.');
      return;
    }

    setSubmitting(true);
    try {
      await addGoal({
        title: title.trim(),
        description: description.trim(),
        targetValue: numTarget,
        currentValue: numCurrent,
        unit: unit.trim(),
        deadline: deadline || '2026-12-31',
      });
      setTitle('');
      setDescription('');
      setTargetValue('');
      setCurrentValue('0');
      setUnit('books');
      setModalVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create goal.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenProgressModal = (goal: Goal) => {
    setSelectedGoal(goal);
    setIncrementAmount('1');
    setProgressModalVisible(true);
  };

  const handleSaveProgress = async () => {
    if (!selectedGoal) return;
    const addVal = parseFloat(incrementAmount);
    if (isNaN(addVal) || addVal <= 0) {
      Alert.alert('Validation Error', 'Please enter a positive progress increment.');
      return;
    }

    setUpdatingProgress(true);
    try {
      const newCurrent = (selectedGoal.currentValue || 0) + addVal;
      const pct = (newCurrent / selectedGoal.targetValue) * 100;
      await updateProgress(selectedGoal.id, selectedGoal.targetValue, newCurrent);

      if (pct >= 50) {
        await triggerGoalMilestoneAlert(selectedGoal.title, pct);
      }

      setProgressModalVisible(false);
      setSelectedGoal(null);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update goal progress.');
    } finally {
      setUpdatingProgress(false);
    }
  };

  const handleDeleteGoal = (goal: Goal) => {
    Alert.alert(
      'Delete Goal',
      `Are you sure you want to remove "${goal.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGoal(goal.id);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete goal.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title="Personal Goals"
        subtitle="Long-term objectives & visual progress"
        showBack
        isDarkMode={isDarkMode}
        rightAction={
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: theme.primary }]}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={{ marginTop: SPACING.md, color: theme.textSecondary }}>
              Loading personal goals from Firestore...
            </Text>
          </View>
        ) : goals.length === 0 ? (
          <EmptyState
            title="No Goals Set"
            description="Turn your aspirations into measurable milestones. Tap + to create your first goal."
            actionTitle="Add Personal Goal"
            onAction={() => setModalVisible(true)}
            iconName="trophy-outline"
            isDarkMode={isDarkMode}
          />
        ) : (
          goals.map((goal) => {
            const current = goal.currentValue || 0;
            const target = goal.targetValue || 1;
            const progressRatio = Math.min(Math.max(current / target, 0), 1);
            const percent = Math.round(progressRatio * 100);
            const isCompleted = goal.completed || current >= target;

            return (
              <Card key={goal.id} isDarkMode={isDarkMode} style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <View
                    style={[
                      styles.goalIcon,
                      {
                        backgroundColor: isCompleted
                          ? isDarkMode
                            ? '#064E3B'
                            : '#D1FAE5'
                          : theme.primaryLight,
                      },
                    ]}
                  >
                    <Ionicons
                      name={isCompleted ? 'checkmark-circle' : 'trophy-outline'}
                      size={24}
                      color={isCompleted ? theme.success : theme.primary}
                    />
                  </View>

                  <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                    <Text style={[styles.goalTitle, { color: theme.textPrimary }]}>
                      {goal.title}
                    </Text>
                    <Text style={[styles.goalDeadline, { color: theme.textSecondary }]}>
                      Target: {goal.deadline || 'Ongoing'}
                    </Text>
                  </View>

                  <Badge
                    label={isCompleted ? 'Completed' : `${percent}%`}
                    variant={isCompleted ? 'success' : percent > 50 ? 'info' : 'neutral'}
                    isDarkMode={isDarkMode}
                  />
                </View>

                {goal.description ? (
                  <Text style={[styles.goalDesc, { color: theme.textSecondary }]}>
                    {goal.description}
                  </Text>
                ) : null}

                <View style={[styles.progressSection, { borderTopColor: theme.border }]}>
                  <View style={styles.progressRow}>
                    <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>
                      Progress
                    </Text>
                    <Text
                      style={[
                        styles.progressValue,
                        { color: isCompleted ? theme.success : theme.primary },
                      ]}
                    >
                      {current} / {target} {goal.unit || ''} ({percent}%)
                    </Text>
                  </View>
                  <ProgressBar
                    progress={progressRatio}
                    color={isCompleted ? theme.success : theme.primary}
                    isDarkMode={isDarkMode}
                  />
                </View>

                <View style={styles.goalActionsRow}>
                  <TouchableOpacity
                    style={[styles.quickActionBtn, { backgroundColor: theme.primaryLight }]}
                    onPress={() => handleOpenProgressModal(goal)}
                  >
                    <Ionicons name="add-circle-outline" size={16} color={theme.primary} />
                    <Text style={[styles.quickActionText, { color: theme.primary }]}>
                      + Log Progress
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDeleteGoal(goal)}
                  >
                    <Ionicons name="trash-outline" size={18} color={theme.danger} />
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Add Goal Modal */}
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
                Add Personal Goal
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <Input
              label="Goal Title *"
              placeholder="e.g., Read 10 Books, Run 100km, Save $5,000"
              value={title}
              onChangeText={setTitle}
              isDarkMode={isDarkMode}
            />

            <Input
              label="Description (Optional)"
              placeholder="e.g. Focus on non-fiction books, weekend jogging"
              value={description}
              onChangeText={setDescription}
              isDarkMode={isDarkMode}
            />

            <View style={styles.inlineInputs}>
              <Input
                label="Target Value *"
                placeholder="10"
                value={targetValue}
                onChangeText={setTargetValue}
                keyboardType="numeric"
                isDarkMode={isDarkMode}
                containerStyle={{ flex: 1, marginRight: SPACING.sm }}
              />
              <Input
                label="Current Progress"
                placeholder="0"
                value={currentValue}
                onChangeText={setCurrentValue}
                keyboardType="numeric"
                isDarkMode={isDarkMode}
                containerStyle={{ flex: 1 }}
              />
            </View>

            <View style={styles.inlineInputs}>
              <Input
                label="Unit (e.g. books, $, km)"
                placeholder="books"
                value={unit}
                onChangeText={setUnit}
                isDarkMode={isDarkMode}
                containerStyle={{ flex: 1, marginRight: SPACING.sm }}
              />
              <Input
                label="Deadline (YYYY-MM-DD)"
                placeholder="2026-12-31"
                value={deadline}
                onChangeText={setDeadline}
                isDarkMode={isDarkMode}
                containerStyle={{ flex: 1 }}
              />
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
                title="Create Goal"
                onPress={handleCreateGoal}
                loading={submitting}
                isDarkMode={isDarkMode}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Progress Increment Modal */}
      <Modal
        visible={progressModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setProgressModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlayCenter}
        >
          <View
            style={[
              styles.centerModalBox,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.textPrimary, marginBottom: 4 }]}>
              Log Goal Progress
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              {selectedGoal?.title}
            </Text>

            <Input
              label={`Amount to add (${selectedGoal?.unit || 'units'})`}
              placeholder="1"
              value={incrementAmount}
              onChangeText={setIncrementAmount}
              keyboardType="numeric"
              isDarkMode={isDarkMode}
              containerStyle={{ marginTop: SPACING.md }}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setProgressModalVisible(false)}
                isDarkMode={isDarkMode}
                style={{ flex: 1, marginRight: SPACING.sm }}
              />
              <Button
                title="Add Progress"
                onPress={handleSaveProgress}
                loading={updatingProgress}
                isDarkMode={isDarkMode}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
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
    paddingBottom: vs(SPACING.xl),
  },
  loadingContainer: {
    padding: s(SPACING.xl),
    alignItems: 'center',
  },
  goalCard: {
    marginBottom: vs(SPACING.md),
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalIcon: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(RADIUS.md),
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalTitle: {
    fontSize: fs(16),
    fontWeight: '700',
  },
  goalDeadline: {
    fontSize: fs(12),
    marginTop: vs(2),
  },
  goalDesc: {
    fontSize: fs(13),
    marginTop: vs(SPACING.sm),
  },
  progressSection: {
    marginTop: vs(SPACING.md),
    paddingTop: vs(SPACING.xs + 2),
    borderTopWidth: 1,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: vs(SPACING.xs),
  },
  progressLabel: {
    fontSize: fs(12),
  },
  progressValue: {
    fontSize: fs(12),
    fontWeight: '700',
  },
  goalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: vs(SPACING.md),
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(SPACING.md),
    paddingVertical: vs(SPACING.xs + 2),
    borderRadius: ms(RADIUS.full),
  },
  quickActionText: {
    fontSize: fs(13),
    fontWeight: '600',
    marginLeft: s(6),
  },
  deleteBtn: {
    padding: s(6),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: s(SPACING.lg),
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
  centerModalBox: {
    borderRadius: ms(24),
    padding: s(SPACING.lg),
    borderWidth: 1,
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
  modalSubtitle: {
    fontSize: fs(13),
  },
  inlineInputs: {
    flexDirection: 'row',
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: vs(SPACING.md),
  },
});
