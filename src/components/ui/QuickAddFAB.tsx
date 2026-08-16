import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { Input } from './Input';
import { Button } from './Button';
import { s, vs, ms, fs } from '../../utils/responsive';
import { useTasks } from '../../hooks/useTasks';
import { useHabits } from '../../hooks/useHabits';
import { useExpenses } from '../../hooks/useExpenses';
import { useNotes } from '../../hooks/useNotes';
import { getTodayString } from '../../utils/dateUtils';

type QuickAddType = 'task' | 'habit' | 'expense' | 'note' | null;

const MINI_FABS = [
  { type: 'task' as const, icon: 'checkbox-outline' as const, label: 'Task', color: '#6366F1' },
  { type: 'note' as const, icon: 'create-outline' as const, label: 'Note', color: '#3B82F6' },
  { type: 'expense' as const, icon: 'wallet-outline' as const, label: 'Expense', color: '#F59E0B' },
  { type: 'habit' as const, icon: 'flame-outline' as const, label: 'Habit', color: '#10B981' },
];

export const QuickAddFAB: React.FC = () => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? COLORS.dark : COLORS.light;
  const insets = useSafeAreaInsets();
  const fabBottom = Math.max(insets.bottom, 10) + vs(64);
  const router = useRouter();

  const { addTask } = useTasks();
  const { addHabit } = useHabits();
  const { addExpense } = useExpenses();
  const { addNote } = useNotes();

  const [expanded, setExpanded] = useState(false);
  const [modalType, setModalType] = useState<QuickAddType>(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const rotateAnim = useRef(new Animated.Value(0)).current;
  const expandAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(rotateAnim, {
        toValue: expanded ? 1 : 0,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.spring(expandAnim, {
        toValue: expanded ? 1 : 0,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [expanded]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const handleMiniFabPress = (type: QuickAddType) => {
    setExpanded(false);
    setTitle('');
    setAmount('');
    setModalType(type);
  };

  const handleQuickSave = async () => {
    if (!title.trim() && modalType !== 'expense') {
      Alert.alert('Required', 'Please enter a title.');
      return;
    }
    if (modalType === 'expense' && (!title.trim() || !amount.trim())) {
      Alert.alert('Required', 'Please enter description and amount.');
      return;
    }

    setSaving(true);
    try {
      if (modalType === 'task') {
        await addTask({
          title: title.trim(),
          description: '',
          dueDate: getTodayString(),
          priority: 'medium',
          category: 'personal',
          completed: false,
          reminder: false,
        });
      } else if (modalType === 'note') {
        await addNote({
          title: title.trim(),
          content: '',
          isPinned: false,
        });
      } else if (modalType === 'expense') {
        await addExpense({
          description: title.trim(),
          amount: parseFloat(amount) || 0,
          category: 'Other',
          date: getTodayString(),
        });
      } else if (modalType === 'habit') {
        await addHabit({
          title: title.trim(),
          description: '',
          frequency: 'daily',
        });
      }
      setModalType(null);
      setTitle('');
      setAmount('');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Backdrop when expanded */}
      {expanded && (
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setExpanded(false)}
        />
      )}

      {/* Mini FABs */}
      {MINI_FABS.map((fab, index) => {
        const translateY = expandAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -(60 * (index + 1))],
        });
        const opacity = expandAnim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, 0, 1],
        });
        const scale = expandAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.3, 1],
        });

        return (
          <Animated.View
            key={fab.type}
            style={[
              styles.miniFabContainer,
              { bottom: fabBottom, transform: [{ translateY }, { scale }], opacity },
            ]}
          >
            <TouchableOpacity
              style={[styles.miniFab, { backgroundColor: fab.color }]}
              onPress={() => handleMiniFabPress(fab.type)}
              activeOpacity={0.8}
            >
              <Ionicons name={fab.icon} size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <Animated.View style={[styles.labelPill, { backgroundColor: theme.card, opacity }]}>
              <Text style={[styles.labelText, { color: theme.textPrimary }]}>{fab.label}</Text>
            </Animated.View>
          </Animated.View>
        );
      })}

      {/* Main FAB */}
      <TouchableOpacity
        style={[styles.mainFab, { bottom: fabBottom, backgroundColor: theme.primary }]}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.9}
      >
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </Animated.View>
      </TouchableOpacity>

      {/* Quick Add Modal */}
      <Modal visible={modalType !== null} transparent animationType="slide" onRequestClose={() => setModalType(null)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBackdrop}
        >
          <View style={[styles.modalCard, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                Quick Add {modalType === 'task' ? '📋 Task' : modalType === 'note' ? '📝 Note' : modalType === 'expense' ? '💰 Expense' : '🔥 Habit'}
              </Text>
              <TouchableOpacity onPress={() => setModalType(null)}>
                <Ionicons name="close" size={22} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <Input
              label={modalType === 'expense' ? 'Description' : 'Title'}
              placeholder={
                modalType === 'task' ? 'What needs to be done?'
                : modalType === 'note' ? 'Note title...'
                : modalType === 'expense' ? 'What did you spend on?'
                : 'Habit name...'
              }
              value={title}
              onChangeText={setTitle}
              isDarkMode={isDarkMode}
            />

            {modalType === 'expense' && (
              <Input
                label="Amount (₹)"
                placeholder="0.00"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                isDarkMode={isDarkMode}
              />
            )}

            <Button
              title={saving ? 'Saving...' : 'Save Instantly ⚡'}
              onPress={handleQuickSave}
              loading={saving}
              isDarkMode={isDarkMode}
              size="lg"
              style={{ marginTop: vs(SPACING.sm) }}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 998,
  },
  mainFab: {
    position: 'absolute',
    right: s(20),
    width: ms(56),
    height: ms(56),
    borderRadius: ms(28),
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  miniFabContainer: {
    position: 'absolute',
    right: s(20),
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 999,
  },
  miniFab: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(22),
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: s(6),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  labelPill: {
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderRadius: ms(RADIUS.sm),
    marginRight: s(8),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  labelText: {
    fontSize: fs(12),
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalCard: {
    borderTopLeftRadius: ms(RADIUS.xl),
    borderTopRightRadius: ms(RADIUS.xl),
    padding: s(SPACING.lg),
    paddingBottom: vs(SPACING.xl + 20),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(SPACING.md),
  },
  modalTitle: {
    fontSize: fs(17),
    fontWeight: '800',
  },
});
