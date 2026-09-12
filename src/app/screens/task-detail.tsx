import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import React, { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../context/ThemeContext';
import { useAuthContext } from '../../context/AuthContext';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { Header } from '../../components/ui/Header';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { TASK_CATEGORIES, TASK_PRIORITIES } from '../../constants/categories';
import { TaskCategory, TaskPriority } from '../../types/task';
import { useTasks } from '../../hooks/useTasks';
import { uploadUserFile } from '../../firebase/storage';
import { getTodayString, getTomorrowString, formatTimeTo12Hour } from '../../utils/dateUtils';
import { scheduleTaskReminder, cancelTaskReminder } from '../../firebase/messaging';
import { s, vs, ms, fs } from '../../utils/responsive';
import { Image, ActivityIndicator } from 'react-native';

export default function TaskDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    title?: string;
    description?: string;
    dueDate?: string;
    dueTime?: string;
    isDaily?: string;
    priority?: TaskPriority;
    category?: TaskCategory;
    reminder?: string;
    notificationId?: string;
    imageUrl?: string;
  }>();

  const isEditing = Boolean(params.id);
  const { isDarkMode } = useTheme();
  const { user } = useAuthContext();
  const { addTask, updateTask, deleteTask } = useTasks();
  const theme = isDarkMode ? COLORS.dark : COLORS.light;

  const [title, setTitle] = useState(params.title || '');
  const [description, setDescription] = useState(params.description || '');
  const [dueDate, setDueDate] = useState(params.dueDate || getTodayString());
  const [dueTime, setDueTime] = useState(params.dueTime || '09:00');
  const [isDaily, setIsDaily] = useState(params.isDaily === 'true');
  const [priority, setPriority] = useState<TaskPriority>(params.priority || 'medium');
  const [category, setCategory] = useState<TaskCategory>(params.category || 'work');
  const [reminder, setReminder] = useState(params.reminder !== 'false');
  const [notificationId, setNotificationId] = useState<string | undefined>(params.notificationId);
  const [imageUrl, setImageUrl] = useState<string | undefined>(params.imageUrl);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);

  const handlePickImage = () => {
    Alert.alert('Attach Task Photo', 'Choose photo source:', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Take Photo with Camera',
        onPress: async () => {
          try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission Required', 'Camera permission is needed to take a photo.');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              quality: 0.8,
              allowsEditing: true,
            });
            if (!result.canceled && result.assets[0]) {
              await uploadTaskPhoto(result.assets[0].uri);
            }
          } catch (err: any) {
            Alert.alert('Camera Error', err.message);
          }
        },
      },
      {
        text: 'Select from Photo Library',
        onPress: async () => {
          try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission Required', 'Photo library permission is required.');
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              quality: 0.8,
              allowsEditing: true,
            });
            if (!result.canceled && result.assets[0]) {
              await uploadTaskPhoto(result.assets[0].uri);
            }
          } catch (err: any) {
            Alert.alert('Photo Error', err.message);
          }
        },
      },
    ]);
  };

  const uploadTaskPhoto = async (uri: string) => {
    setUploadingImage(true);
    try {
      const uid = user?.uid || 'user-123';
      const fileName = `task_${Date.now()}.jpg`;
      const { downloadUrl } = await uploadUserFile(uid, 'tasks', fileName, uri, 'image/jpeg');
      setImageUrl(downloadUrl);
      Alert.alert('Photo Attached', 'Image uploaded and linked to this task.');
    } catch (err: any) {
      Alert.alert('Upload Error', err.message || 'Failed to upload photo.');
    } finally {
      setUploadingImage(false);
    }
  };

  const setPresetTime = (hours: number, minutes: number) => {
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    setDueTime(`${hh}:${mm}`);
  };

  const setOffsetMinutes = (mins: number) => {
    const d = new Date(Date.now() + mins * 60 * 1000);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    setDueTime(`${hh}:${mm}`);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setDueDate(`${year}-${month}-${day}`);
    setIsDaily(false);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Task title is required.');
      return;
    }
    setSaving(true);
    try {
      let currentNotifId = notificationId;

      // 1. If reminder is toggled OFF, cancel any existing notification
      if (!reminder && currentNotifId) {
        await cancelTaskReminder(currentNotifId);
        currentNotifId = undefined;
      }

      // 2. If reminder is ON and dueTime is set, schedule hardware alert
      if (reminder && dueTime) {
        if (currentNotifId) {
          await cancelTaskReminder(currentNotifId);
        }

        const scheduledId = await scheduleTaskReminder({
          taskId: params.id,
          taskTitle: title.trim(),
          taskDescription: description.trim() || undefined,
          dueDate: dueDate || getTodayString(),
          dueTime: dueTime.trim(),
          isDaily,
        });

        if (scheduledId) {
          currentNotifId = scheduledId;
        }
      }

      if (isEditing && params.id) {
        await updateTask(params.id, {
          title: title.trim(),
          description: description.trim(),
          dueDate: dueDate || getTodayString(),
          dueTime: dueTime.trim(),
          isDaily,
          priority,
          category,
          reminder,
          notificationId: currentNotifId,
          ...(imageUrl ? { imageUrl } : {}),
        });
      } else {
        await addTask({
          title: title.trim(),
          description: description.trim(),
          dueDate: dueDate || getTodayString(),
          dueTime: dueTime.trim(),
          isDaily,
          priority,
          category,
          completed: false,
          reminder,
          notificationId: currentNotifId,
          ...(imageUrl ? { imageUrl } : {}),
        });
      }

      if (reminder && dueTime && currentNotifId) {
        const timeFormatted = formatTimeTo12Hour(dueTime);
        const dayLabel = isDaily ? 'Every Day' : dueDate === getTodayString() ? 'Today' : dueDate === getTomorrowString() ? 'Tomorrow' : dueDate;
        Alert.alert(
          '⏰ Reminder Scheduled',
          `Notification set for ${dayLabel} at ${timeFormatted}!`
        );
      }

      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save task in Firestore.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!params.id) return;
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            if (notificationId) {
              await cancelTaskReminder(notificationId);
            }
            await deleteTask(params.id!, notificationId);
            router.back();
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete task.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title={isEditing ? 'Edit Task' : 'Add Task'} showBack isDarkMode={isDarkMode} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Input
            label="Title *"
            placeholder="e.g., Review sprint backlog, Buy groceries"
            value={title}
            onChangeText={setTitle}
            isDarkMode={isDarkMode}
          />

          <Input
            label="Description"
            placeholder="Add details, links or subtasks..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            isDarkMode={isDarkMode}
          />

          {/* Due Date & Quick Date Chips */}
          <Text style={[styles.label, { color: theme.textPrimary }]}>Due Date</Text>
          <View style={styles.quickDateRow}>
            <TouchableOpacity
              style={[
                styles.quickDateChip,
                {
                  backgroundColor:
                    dueDate === getTodayString() ? theme.primary : isDarkMode ? '#1E293B' : '#E2E8F0',
                },
              ]}
              onPress={() => setDueDate(getTodayString())}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.quickDateText,
                  { color: dueDate === getTodayString() ? '#FFFFFF' : theme.textSecondary },
                ]}
              >
                📅 Today
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickDateChip,
                {
                  backgroundColor:
                    dueDate === getTomorrowString() ? theme.primary : isDarkMode ? '#1E293B' : '#E2E8F0',
                },
              ]}
              onPress={() => setDueDate(getTomorrowString())}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.quickDateText,
                  { color: dueDate === getTomorrowString() ? '#FFFFFF' : theme.textSecondary },
                ]}
              >
                🌅 Tomorrow
              </Text>
            </TouchableOpacity>
          </View>

          <Input
            placeholder={getTodayString()}
            value={dueDate}
            onChangeText={setDueDate}
            isDarkMode={isDarkMode}
            leftIcon={<Ionicons name="calendar-outline" size={20} color={theme.textMuted} />}
          />

          <Text style={[styles.label, { color: theme.textPrimary }]}>Priority</Text>
          <View style={styles.chipRow}>
            {TASK_PRIORITIES.map((p) => {
              const isSelected = priority === p.value;
              return (
                <TouchableOpacity
                  key={p.value}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected
                        ? p.color
                        : isDarkMode
                        ? '#1E293B'
                        : '#E2E8F0',
                    },
                  ]}
                  onPress={() => setPriority(p.value)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: isSelected ? '#FFFFFF' : theme.textSecondary },
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.label, { color: theme.textPrimary, marginTop: SPACING.sm }]}>
            Category
          </Text>
          <View style={styles.chipRow}>
            {TASK_CATEGORIES.map((c) => {
              const isSelected = category === c.value;
              return (
                <TouchableOpacity
                  key={c.value}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected
                        ? theme.primary
                        : isDarkMode
                        ? '#1E293B'
                        : '#E2E8F0',
                    },
                  ]}
                  onPress={() => setCategory(c.value)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: isSelected ? '#FFFFFF' : theme.textSecondary },
                    ]}
                  >
                    {c.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Photo Attachment Section */}
          <Text style={[styles.label, { color: theme.textPrimary, marginTop: vs(SPACING.sm) }]}>
            Photo Attachment
          </Text>
          {imageUrl ? (
            <View style={styles.attachedImageContainer}>
              <Image source={{ uri: imageUrl }} style={styles.attachedImage} />
              <TouchableOpacity
                style={[styles.removeImageBtn, { backgroundColor: theme.danger }]}
                onPress={() => setImageUrl(undefined)}
              >
                <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.addPhotoBtn,
                { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9', borderColor: theme.border },
              ]}
              onPress={handlePickImage}
              disabled={uploadingImage}
              activeOpacity={0.8}
            >
              {uploadingImage ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <>
                  <Ionicons name="camera-outline" size={22} color={theme.primary} />
                  <Text style={[styles.addPhotoText, { color: theme.primary }]}>
                    Attach Photo (Camera / Gallery)
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Reminder & Notification Timer Box */}
          <View
            style={[
              styles.reminderContainer,
              {
                backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                borderColor: reminder ? theme.primary : isDarkMode ? '#334155' : '#E2E8F0',
              },
            ]}
          >
            <View style={styles.reminderRow}>
              <View style={{ flex: 1, marginRight: s(SPACING.sm) }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="alarm-outline" size={20} color={theme.primary} />
                  <Text style={[styles.reminderHeaderTitle, { color: theme.textPrimary, marginLeft: s(6) }]}>
                    Reminder & Notification Timer
                  </Text>
                </View>
                <Text style={[styles.reminderHeaderSub, { color: theme.textSecondary }]}>
                  Schedule hardware alert with sound on device
                </Text>
              </View>
              <Switch
                value={reminder}
                onValueChange={setReminder}
                trackColor={{ false: '#94A3B8', true: theme.primary }}
              />
            </View>

            {reminder && (
              <View style={styles.reminderSettings}>
                {/* Quick Time Presets */}
                <Text style={[styles.subLabel, { color: theme.textSecondary }]}>
                  Quick Time Presets
                </Text>
                <View style={styles.timePresetsRow}>
                  <TouchableOpacity
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor:
                          dueTime === '09:00' ? theme.primary : isDarkMode ? '#334155' : '#E2E8F0',
                      },
                    ]}
                    onPress={() => setPresetTime(9, 0)}
                  >
                    <Text
                      style={[
                        styles.presetText,
                        { color: dueTime === '09:00' ? '#FFFFFF' : theme.textPrimary },
                      ]}
                    >
                      🌅 09:00 AM
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor:
                          dueTime === '14:00' ? theme.primary : isDarkMode ? '#334155' : '#E2E8F0',
                      },
                    ]}
                    onPress={() => setPresetTime(14, 0)}
                  >
                    <Text
                      style={[
                        styles.presetText,
                        { color: dueTime === '14:00' ? '#FFFFFF' : theme.textPrimary },
                      ]}
                    >
                      ☀️ 02:00 PM
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor:
                          dueTime === '19:00' ? theme.primary : isDarkMode ? '#334155' : '#E2E8F0',
                      },
                    ]}
                    onPress={() => setPresetTime(19, 0)}
                  >
                    <Text
                      style={[
                        styles.presetText,
                        { color: dueTime === '19:00' ? '#FFFFFF' : theme.textPrimary },
                      ]}
                    >
                      🌆 07:00 PM
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.presetChip,
                      { backgroundColor: isDarkMode ? '#312E81' : '#EEF2FF' },
                    ]}
                    onPress={() => setOffsetMinutes(15)}
                  >
                    <Text style={[styles.presetText, { color: theme.primary, fontWeight: '700' }]}>
                      ⏱️ +15 Min
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.presetChip,
                      { backgroundColor: isDarkMode ? '#312E81' : '#EEF2FF' },
                    ]}
                    onPress={() => setOffsetMinutes(60)}
                  >
                    <Text style={[styles.presetText, { color: theme.primary, fontWeight: '700' }]}>
                      ⏱️ +1 Hour
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Custom Time Input */}
                <Input
                  label="Reminder Time (24hr HH:mm)"
                  placeholder="09:00"
                  value={dueTime}
                  onChangeText={setDueTime}
                  isDarkMode={isDarkMode}
                  leftIcon={<Ionicons name="time-outline" size={20} color={theme.textMuted} />}
                />

                {/* Reminder Preview Box */}
                <View
                  style={[
                    styles.previewBanner,
                    {
                      backgroundColor: isDarkMode ? '#0F172A' : '#EFF6FF',
                      borderColor: theme.primary,
                    },
                  ]}
                >
                  <Ionicons name="notifications-outline" size={20} color={theme.primary} />
                  <Text style={[styles.previewText, { color: theme.textPrimary }]}>
                    Will notify at:{' '}
                    <Text style={{ fontWeight: '700', color: theme.primary }}>
                      {formatTimeTo12Hour(dueTime) || dueTime}
                    </Text>{' '}
                    (
                    {isDaily
                      ? 'Every Day'
                      : dueDate === getTodayString()
                      ? 'Today'
                      : dueDate === getTomorrowString()
                      ? 'Tomorrow'
                      : dueDate}
                    )
                  </Text>
                </View>

                {/* Daily Recurring Switch */}
                <View style={styles.dailySwitchRow}>
                  <View style={{ flex: 1, marginRight: s(SPACING.sm) }}>
                    <Text style={[styles.dailyTitle, { color: theme.textPrimary }]}>
                      🔄 Repeat Every Day
                    </Text>
                    <Text style={[styles.dailySub, { color: theme.textSecondary }]}>
                      Receive this reminder daily at {formatTimeTo12Hour(dueTime) || dueTime}
                    </Text>
                  </View>
                  <Switch
                    value={isDaily}
                    onValueChange={setIsDaily}
                    trackColor={{ false: '#94A3B8', true: theme.primary }}
                  />
                </View>
              </View>
            )}
          </View>

          <Button
            title={isEditing ? 'Update Task' : 'Save Task'}
            onPress={handleSave}
            loading={saving}
            isDarkMode={isDarkMode}
            size="lg"
            style={{ marginTop: SPACING.md }}
          />

          {isEditing && (
            <Button
              title="Delete Task"
              variant="danger"
              onPress={handleDelete}
              isDarkMode={isDarkMode}
              size="lg"
              style={{ marginTop: SPACING.sm, marginBottom: SPACING.xl }}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: s(SPACING.md),
    paddingBottom: vs(SPACING.xl),
  },
  label: {
    fontSize: fs(14),
    fontWeight: '600',
    marginBottom: vs(SPACING.xs),
  },
  quickDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vs(SPACING.xs),
  },
  quickDateChip: {
    paddingHorizontal: s(SPACING.md),
    paddingVertical: vs(SPACING.xs + 2),
    borderRadius: ms(RADIUS.full),
    marginRight: s(SPACING.xs + 2),
  },
  quickDateText: {
    fontSize: fs(13),
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: vs(SPACING.sm),
  },
  chip: {
    paddingHorizontal: s(SPACING.md),
    paddingVertical: vs(SPACING.xs + 2),
    borderRadius: ms(RADIUS.full),
    marginRight: s(SPACING.xs + 2),
    marginBottom: vs(SPACING.xs),
  },
  chipText: {
    fontSize: fs(13),
    fontWeight: '600',
  },
  reminderContainer: {
    borderRadius: ms(RADIUS.md),
    borderWidth: 1.5,
    padding: s(SPACING.md),
    marginVertical: vs(SPACING.sm),
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reminderHeaderTitle: {
    fontSize: fs(15),
    fontWeight: '700',
  },
  reminderHeaderSub: {
    fontSize: fs(12),
    marginTop: vs(2),
  },
  reminderSettings: {
    marginTop: vs(SPACING.sm),
    borderTopWidth: 1,
    borderTopColor: '#CBD5E1',
    paddingTop: vs(SPACING.sm),
  },
  subLabel: {
    fontSize: fs(12),
    fontWeight: '600',
    marginBottom: vs(SPACING.xs),
  },
  timePresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: vs(SPACING.xs),
  },
  presetChip: {
    paddingHorizontal: s(SPACING.sm + 2),
    paddingVertical: vs(SPACING.xs + 1),
    borderRadius: ms(RADIUS.sm),
    marginRight: s(SPACING.xs),
    marginBottom: vs(SPACING.xs),
  },
  presetText: {
    fontSize: fs(12),
    fontWeight: '500',
  },
  previewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: s(SPACING.sm),
    borderRadius: ms(RADIUS.sm),
    borderWidth: 1,
    marginVertical: vs(SPACING.xs),
  },
  previewText: {
    fontSize: fs(13),
    marginLeft: s(8),
    flex: 1,
  },
  dailySwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: vs(SPACING.xs),
  },
  dailyTitle: {
    fontSize: fs(14),
    fontWeight: '600',
  },
  dailySub: {
    fontSize: fs(12),
    marginTop: vs(2),
  },
  addPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(SPACING.md),
    borderRadius: ms(RADIUS.md),
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginBottom: vs(SPACING.sm),
  },
  addPhotoText: {
    fontSize: fs(13),
    fontWeight: '700',
    marginLeft: s(8),
  },
  attachedImageContainer: {
    position: 'relative',
    borderRadius: ms(RADIUS.md),
    overflow: 'hidden',
    marginBottom: vs(SPACING.sm),
  },
  attachedImage: {
    width: '100%',
    height: vs(160),
    borderRadius: ms(RADIUS.md),
  },
  removeImageBtn: {
    position: 'absolute',
    top: vs(8),
    right: s(8),
    width: ms(32),
    height: ms(32),
    borderRadius: ms(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
});
