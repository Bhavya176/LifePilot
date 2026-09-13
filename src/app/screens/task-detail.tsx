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
  Image,
  ActivityIndicator,
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
import { TimePickerModal } from '../../components/ui/TimePickerModal';
import { DatePickerModal } from '../../components/ui/DatePickerModal';
import { uploadUserFile } from '../../firebase/storage';
import { getTodayString, getTomorrowString, formatTimeTo12Hour, formatDate } from '../../utils/dateUtils';
import { scheduleTaskReminder, cancelTaskReminder } from '../../firebase/messaging';
import { s, vs, ms, fs } from '../../utils/responsive';
import { GuestGateModal } from '../../components/ui/GuestGateModal';

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
    alarmMode?: string;
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
  const [alarmMode, setAlarmMode] = useState(params.alarmMode === 'true');
  const [notificationId, setNotificationId] = useState<string | undefined>(params.notificationId);
  const [imageUrl, setImageUrl] = useState<string | undefined>(params.imageUrl);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [guestGateVisible, setGuestGateVisible] = useState(false);

  const handlePickImage = () => {
    if (user?.isGuest) {
      setGuestGateVisible(true);
      return;
    }
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
    if (user?.isGuest) {
      setGuestGateVisible(true);
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
          isAlarm: alarmMode,
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
          alarmMode,
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
          alarmMode,
          notificationId: currentNotifId,
          ...(imageUrl ? { imageUrl } : {}),
        });
      }

      if (reminder && dueTime && currentNotifId) {
        const timeFormatted = formatTimeTo12Hour(dueTime);
        const dayLabel = isDaily ? 'Every Day' : dueDate === getTodayString() ? 'Today' : dueDate === getTomorrowString() ? 'Tomorrow' : dueDate;
        if (alarmMode) {
          Alert.alert(
            '🚨 Persistent Alarm Scheduled',
            `Alarm set for ${dayLabel} at ${timeFormatted}!\nWill repeat up to 5 times until stopped.`
          );
        } else {
          Alert.alert(
            '⏰ Reminder Scheduled',
            `Notification set for ${dayLabel} at ${timeFormatted}!`
          );
        }
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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

          {/* Due Date Section */}
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={15} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Due Date</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.heroDateCard,
              {
                backgroundColor: isDarkMode ? '#17142E' : '#FFFFFF',
                borderColor: isDarkMode ? '#27234D' : '#E2E8F0',
              },
            ]}
            onPress={() => setDatePickerVisible(true)}
            activeOpacity={0.8}
          >
            <View style={styles.heroDateLeft}>
              <View style={[styles.heroDateBadge, { backgroundColor: theme.primaryLight }]}>
                <Ionicons name="calendar" size={19} color={theme.primary} />
              </View>
              <View>
                <Text style={[styles.heroDateValue, { color: theme.textPrimary }]}>
                  {formatDate(dueDate) || dueDate}
                </Text>
                <View style={styles.heroSubRow}>
                  <View
                    style={[
                      styles.heroBadgeDot,
                      {
                        backgroundColor:
                          dueDate === getTodayString()
                            ? '#10B981'
                            : dueDate === getTomorrowString()
                            ? '#6366F1'
                            : '#F59E0B',
                      },
                    ]}
                  />
                  <Text style={[styles.heroSubText, { color: theme.textSecondary }]}>
                    {dueDate === getTodayString()
                      ? 'Due Today'
                      : dueDate === getTomorrowString()
                      ? 'Due Tomorrow'
                      : `Due on ${dueDate}`}
                  </Text>
                </View>
              </View>
            </View>

            <View style={[styles.heroEditPill, { backgroundColor: isDarkMode ? '#2D2754' : '#EFF6FF' }]}>
              <Text style={[styles.heroEditPillText, { color: theme.primary }]}>Change</Text>
              <Ionicons name="chevron-forward" size={14} color={theme.primary} />
            </View>
          </TouchableOpacity>

          {/* Quick Date Chips (Horizontal Scrollable) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalPresetsScroll}
            contentContainerStyle={styles.horizontalPresetsContent}
          >
            <TouchableOpacity
              style={[
                styles.presetChip,
                {
                  backgroundColor:
                    dueDate === getTodayString() ? theme.primary : isDarkMode ? '#1E1B38' : '#F1F5F9',
                  borderColor:
                    dueDate === getTodayString() ? theme.primary : isDarkMode ? '#2D2856' : '#E2E8F0',
                },
              ]}
              onPress={() => setDueDate(getTodayString())}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.presetText,
                  { color: dueDate === getTodayString() ? '#FFFFFF' : theme.textPrimary },
                ]}
              >
                📅 Today
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.presetChip,
                {
                  backgroundColor:
                    dueDate === getTomorrowString() ? theme.primary : isDarkMode ? '#1E1B38' : '#F1F5F9',
                  borderColor:
                    dueDate === getTomorrowString() ? theme.primary : isDarkMode ? '#2D2856' : '#E2E8F0',
                },
              ]}
              onPress={() => setDueDate(getTomorrowString())}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.presetText,
                  { color: dueDate === getTomorrowString() ? '#FFFFFF' : theme.textPrimary },
                ]}
              >
                🌅 Tomorrow
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.presetChip,
                {
                  backgroundColor: isDarkMode ? '#1E1B38' : '#F1F5F9',
                  borderColor: isDarkMode ? '#2D2856' : '#E2E8F0',
                },
              ]}
              onPress={() => {
                const target = new Date();
                const dayOfWeek = target.getDay();
                const daysUntilMon = ((8 - dayOfWeek) % 7) || 7;
                target.setDate(target.getDate() + daysUntilMon);
                const y = target.getFullYear();
                const m = String(target.getMonth() + 1).padStart(2, '0');
                const d = String(target.getDate()).padStart(2, '0');
                setDueDate(`${y}-${m}-${d}`);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.presetText, { color: theme.textPrimary }]}>
                💼 Next Mon
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.presetChip,
                {
                  backgroundColor: isDarkMode ? '#1E1B38' : '#F1F5F9',
                  borderColor: isDarkMode ? '#2D2856' : '#E2E8F0',
                },
              ]}
              onPress={() => {
                const target = new Date();
                target.setDate(target.getDate() + 3);
                const y = target.getFullYear();
                const m = String(target.getMonth() + 1).padStart(2, '0');
                const d = String(target.getDate()).padStart(2, '0');
                setDueDate(`${y}-${m}-${d}`);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.presetText, { color: theme.textPrimary }]}>
                ⏱️ +3 Days
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.presetChip,
                {
                  backgroundColor: isDarkMode ? '#1E1B38' : '#F1F5F9',
                  borderColor: isDarkMode ? '#2D2856' : '#E2E8F0',
                },
              ]}
              onPress={() => {
                const target = new Date();
                target.setDate(target.getDate() + 7);
                const y = target.getFullYear();
                const m = String(target.getMonth() + 1).padStart(2, '0');
                const d = String(target.getDate()).padStart(2, '0');
                setDueDate(`${y}-${m}-${d}`);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.presetText, { color: theme.textPrimary }]}>
                🗓️ +1 Week
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Priority Section (3-Way Segmented Control) */}
          <View style={styles.sectionHeader}>
            <Ionicons name="flag-outline" size={15} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Priority</Text>
          </View>
          <View style={styles.prioritySegmentContainer}>
            {TASK_PRIORITIES.map((p) => {
              const isSelected = priority === p.value;
              return (
                <TouchableOpacity
                  key={p.value}
                  style={[
                    styles.prioritySegment,
                    {
                      backgroundColor: isSelected
                        ? p.color
                        : isDarkMode
                        ? '#17142E'
                        : '#FFFFFF',
                      borderColor: isSelected
                        ? p.color
                        : isDarkMode
                        ? '#27234D'
                        : '#E2E8F0',
                    },
                  ]}
                  onPress={() => setPriority(p.value)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.prioritySegmentText,
                      {
                        color: isSelected ? '#FFFFFF' : theme.textPrimary,
                        fontWeight: isSelected ? '800' : '600',
                      },
                    ]}
                  >
                    {p.value === 'low' ? '🟢 Low' : p.value === 'medium' ? '🟡 Medium' : '🔴 High'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Category Section (Clean Symmetrical 3x2 Grid) */}
          <View style={styles.sectionHeader}>
            <Ionicons name="grid-outline" size={15} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Category</Text>
          </View>
          <View style={styles.categoryGrid}>
            {TASK_CATEGORIES.map((c) => {
              const isSelected = category === c.value;
              return (
                <TouchableOpacity
                  key={c.value}
                  style={[
                    styles.categoryCard,
                    {
                      backgroundColor: isSelected
                        ? theme.primary
                        : isDarkMode
                        ? '#17142E'
                        : '#FFFFFF',
                      borderColor: isSelected
                        ? theme.primary
                        : isDarkMode
                        ? '#27234D'
                        : '#E2E8F0',
                    },
                  ]}
                  onPress={() => setCategory(c.value)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={c.icon as any}
                    size={15}
                    color={isSelected ? '#FFFFFF' : theme.primary}
                  />
                  <Text
                    style={[
                      styles.categoryCardText,
                      {
                        color: isSelected ? '#FFFFFF' : theme.textPrimary,
                        fontWeight: isSelected ? '800' : '600',
                      },
                    ]}
                  >
                    {c.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Photo Attachment Section */}
          <View style={styles.sectionHeader}>
            <Ionicons name="image-outline" size={15} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Photo Attachment</Text>
          </View>
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
                {
                  backgroundColor: isDarkMode ? '#17142E' : '#FFFFFF',
                  borderColor: isDarkMode ? '#27234D' : '#CBD5E1',
                },
              ]}
              onPress={handlePickImage}
              disabled={uploadingImage}
              activeOpacity={0.8}
            >
              {uploadingImage ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <>
                  <Ionicons name="camera-outline" size={20} color={theme.primary} />
                  <Text style={[styles.addPhotoText, { color: theme.primary }]}>
                    Attach Photo (Camera / Gallery)
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Reminder & Notification Box */}
          <View
            style={[
              styles.reminderContainer,
              {
                backgroundColor: isDarkMode ? '#17142E' : '#FFFFFF',
                borderColor: isDarkMode ? '#27234D' : '#E2E8F0',
              },
            ]}
          >
            <View style={styles.reminderRow}>
              <View style={styles.reminderHeaderLeft}>
                <View style={[styles.reminderIconBadge, { backgroundColor: theme.primaryLight }]}>
                  <Ionicons name="alarm" size={18} color={theme.primary} />
                </View>
                <View>
                  <Text style={[styles.reminderHeaderTitle, { color: theme.textPrimary }]}>
                    Reminder Notification
                  </Text>
                  <Text style={[styles.reminderHeaderSub, { color: theme.textSecondary }]}>
                    Hardware alert with sound on device
                  </Text>
                </View>
              </View>
              <Switch
                value={reminder}
                onValueChange={setReminder}
                trackColor={{ false: isDarkMode ? '#334155' : '#CBD5E1', true: theme.primary }}
              />
            </View>

            {reminder && (
              <View style={[styles.reminderSettings, { borderTopColor: isDarkMode ? '#27234D' : '#E2E8F0' }]}>
                {/* Hero Time Card */}
                <TouchableOpacity
                  style={[
                    styles.heroTimeCard,
                    {
                      backgroundColor: isDarkMode ? '#1E1B38' : '#F8FAFC',
                      borderColor: isDarkMode ? '#2D2856' : '#E2E8F0',
                    },
                  ]}
                  onPress={() => setTimePickerVisible(true)}
                  activeOpacity={0.8}
                >
                  <View style={styles.heroTimeLeft}>
                    <View style={[styles.heroClockIcon, { backgroundColor: theme.primaryLight }]}>
                      <Ionicons name="time" size={18} color={theme.primary} />
                    </View>
                    <View>
                      <Text style={[styles.heroTimeValue, { color: theme.textPrimary }]}>
                        {formatTimeTo12Hour(dueTime) || dueTime}
                      </Text>
                      <View style={styles.heroSubRow}>
                        <View style={[styles.heroBadgeDot, { backgroundColor: '#10B981' }]} />
                        <Text style={[styles.heroSubText, { color: theme.textSecondary }]}>
                          {isDaily
                            ? 'Everyday reminder'
                            : dueDate === getTodayString()
                            ? 'Scheduled for Today'
                            : dueDate === getTomorrowString()
                            ? 'Scheduled for Tomorrow'
                            : `Scheduled for ${dueDate}`}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.heroEditPill, { backgroundColor: isDarkMode ? '#2D2754' : '#EFF6FF' }]}>
                    <Text style={[styles.heroEditPillText, { color: theme.primary }]}>Change</Text>
                    <Ionicons name="chevron-forward" size={14} color={theme.primary} />
                  </View>
                </TouchableOpacity>

                {/* Quick Time Presets Horizontal Scroll */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.timePresetsScroll}
                  contentContainerStyle={styles.timePresetsContent}
                >
                  <TouchableOpacity
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor:
                          dueTime === '09:00' ? theme.primary : isDarkMode ? '#221E3E' : '#F1F5F9',
                        borderColor:
                          dueTime === '09:00' ? theme.primary : isDarkMode ? '#2F295B' : '#E2E8F0',
                      },
                    ]}
                    onPress={() => setPresetTime(9, 0)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.presetText,
                        { color: dueTime === '09:00' ? '#FFFFFF' : theme.textPrimary },
                      ]}
                    >
                      🌅 9 AM
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor:
                          dueTime === '14:00' ? theme.primary : isDarkMode ? '#221E3E' : '#F1F5F9',
                        borderColor:
                          dueTime === '14:00' ? theme.primary : isDarkMode ? '#2F295B' : '#E2E8F0',
                      },
                    ]}
                    onPress={() => setPresetTime(14, 0)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.presetText,
                        { color: dueTime === '14:00' ? '#FFFFFF' : theme.textPrimary },
                      ]}
                    >
                      ☀️ 2 PM
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor:
                          dueTime === '19:00' ? theme.primary : isDarkMode ? '#221E3E' : '#F1F5F9',
                        borderColor:
                          dueTime === '19:00' ? theme.primary : isDarkMode ? '#2F295B' : '#E2E8F0',
                      },
                    ]}
                    onPress={() => setPresetTime(19, 0)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.presetText,
                        { color: dueTime === '19:00' ? '#FFFFFF' : theme.textPrimary },
                      ]}
                    >
                      🌆 7 PM
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor: isDarkMode ? '#221E3E' : '#F1F5F9',
                        borderColor: isDarkMode ? '#2F295B' : '#E2E8F0',
                      },
                    ]}
                    onPress={() => setOffsetMinutes(15)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.presetText, { color: theme.primary, fontWeight: '700' }]}>
                      ⏱️ +15m
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor: isDarkMode ? '#221E3E' : '#F1F5F9',
                        borderColor: isDarkMode ? '#2F295B' : '#E2E8F0',
                      },
                    ]}
                    onPress={() => setOffsetMinutes(60)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.presetText, { color: theme.primary, fontWeight: '700' }]}>
                      ⏱️ +1h
                    </Text>
                  </TouchableOpacity>
                </ScrollView>

                <View style={[styles.reminderDivider, { backgroundColor: isDarkMode ? '#27234D' : '#E2E8F0' }]} />

                {/* Alert Type: Standard vs Persistent Alarm */}
                <View style={styles.alertTypeContainer}>
                  <View style={styles.alertTypeHeaderRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(6) }}>
                      <Ionicons
                        name={alarmMode ? 'alarm' : 'notifications'}
                        size={16}
                        color={alarmMode ? '#EF4444' : theme.primary}
                      />
                      <Text style={[styles.alertTypeHeaderTitle, { color: theme.textPrimary }]}>
                        Alert Mode
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.alertTypeHeaderBadge,
                        {
                          color: alarmMode ? '#EF4444' : theme.primary,
                          backgroundColor: alarmMode
                            ? isDarkMode
                              ? 'rgba(239, 68, 68, 0.15)'
                              : '#FEE2E2'
                            : isDarkMode
                            ? 'rgba(99, 102, 241, 0.15)'
                            : '#EEF2FF',
                        },
                      ]}
                    >
                      {alarmMode ? '🚨 Persistent (x5)' : '🔔 Standard (x1)'}
                    </Text>
                  </View>

                  <View style={[styles.alertTypeSegments, { backgroundColor: isDarkMode ? '#131126' : '#F1F5F9' }]}>
                    <TouchableOpacity
                      style={[
                        styles.alertTypeSegment,
                        !alarmMode && [
                          styles.alertTypeSegmentActive,
                          { backgroundColor: isDarkMode ? '#27234D' : '#FFFFFF' },
                        ],
                      ]}
                      onPress={() => setAlarmMode(false)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="notifications-outline"
                        size={15}
                        color={!alarmMode ? theme.primary : theme.textMuted}
                      />
                      <Text
                        style={[
                          styles.alertTypeSegmentText,
                          {
                            color: !alarmMode ? theme.textPrimary : theme.textSecondary,
                            fontWeight: !alarmMode ? '800' : '600',
                          },
                        ]}
                      >
                        Standard
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.alertTypeSegment,
                        alarmMode && [
                          styles.alertTypeSegmentActiveAlarm,
                          { backgroundColor: isDarkMode ? '#3B1824' : '#FEE2E2' },
                        ],
                      ]}
                      onPress={() => setAlarmMode(true)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="alarm"
                        size={15}
                        color={alarmMode ? '#EF4444' : theme.textMuted}
                      />
                      <Text
                        style={[
                          styles.alertTypeSegmentText,
                          {
                            color: alarmMode ? '#EF4444' : theme.textSecondary,
                            fontWeight: alarmMode ? '800' : '600',
                          },
                        ]}
                      >
                        Persistent Alarm
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {alarmMode && (
                    <View
                      style={[
                        styles.alarmNoticeBox,
                        {
                          backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2',
                          borderColor: isDarkMode ? 'rgba(239, 68, 68, 0.3)' : '#FCA5A5',
                        },
                      ]}
                    >
                      <Ionicons name="information-circle" size={16} color="#EF4444" />
                      <Text style={[styles.alarmNoticeText, { color: isDarkMode ? '#FCA5A5' : '#991B1B' }]}>
                        Repeats 5 times (at 0m, 1m, 2m, 3m, 5m) with heavy vibration & in-app ringing screen until stopped.
                      </Text>
                    </View>
                  )}
                </View>

                <View style={[styles.reminderDivider, { backgroundColor: isDarkMode ? '#27234D' : '#E2E8F0' }]} />

                {/* Daily Recurring Switch */}
                <View style={styles.dailySwitchRow}>
                  <View style={{ flex: 1, marginRight: s(SPACING.sm) }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(6) }}>
                      <Ionicons name="repeat" size={16} color={isDaily ? theme.primary : theme.textSecondary} />
                      <Text style={[styles.dailyTitle, { color: theme.textPrimary }]}>
                        Repeat Daily
                      </Text>
                    </View>
                    <Text style={[styles.dailySub, { color: theme.textSecondary }]}>
                      {isDaily
                        ? `Notifies everyday at ${formatTimeTo12Hour(dueTime) || dueTime}`
                        : 'One-time alert for this task'}
                    </Text>
                  </View>
                  <Switch
                    value={isDaily}
                    onValueChange={setIsDaily}
                    trackColor={{ false: isDarkMode ? '#334155' : '#CBD5E1', true: theme.primary }}
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

      <TimePickerModal
        visible={timePickerVisible}
        onClose={() => setTimePickerVisible(false)}
        value={dueTime}
        onChange={setDueTime}
        isDarkMode={isDarkMode}
      />

      <DatePickerModal
        visible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        value={dueDate}
        onChange={setDueDate}
        isDarkMode={isDarkMode}
      />

      <GuestGateModal
        visible={guestGateVisible}
        featureName="Task"
        onClose={() => setGuestGateVisible(false)}
      />
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    marginBottom: vs(SPACING.xs + 2),
    marginTop: vs(SPACING.md),
  },
  sectionTitle: {
    fontSize: fs(12),
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  horizontalPresetsScroll: {
    marginHorizontal: -s(SPACING.xs),
    marginBottom: vs(SPACING.xs),
  },
  horizontalPresetsContent: {
    gap: s(SPACING.xs),
    paddingHorizontal: s(SPACING.xs),
    paddingVertical: vs(2),
    paddingRight: s(SPACING.lg),
  },
  prioritySegmentContainer: {
    flexDirection: 'row',
    gap: s(SPACING.xs + 2),
    marginBottom: vs(SPACING.xs),
  },
  prioritySegment: {
    flex: 1,
    paddingVertical: vs(SPACING.sm),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ms(RADIUS.md),
    borderWidth: 1,
  },
  prioritySegmentText: {
    fontSize: fs(13),
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(SPACING.xs + 2),
    justifyContent: 'space-between',
    marginBottom: vs(SPACING.xs),
  },
  categoryCard: {
    width: '31%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(5),
    paddingVertical: vs(SPACING.sm - 1),
    borderRadius: ms(RADIUS.md),
    borderWidth: 1,
  },
  categoryCardText: {
    fontSize: fs(12),
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
    borderRadius: ms(RADIUS.lg),
    borderWidth: 1,
    padding: s(SPACING.md),
    marginTop: vs(SPACING.md + 2),
    marginBottom: vs(SPACING.sm),
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reminderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(SPACING.xs + 3),
    flex: 1,
    marginRight: s(SPACING.sm),
  },
  reminderIconBadge: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(RADIUS.full),
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderHeaderTitle: {
    fontSize: fs(15),
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  reminderHeaderSub: {
    fontSize: fs(11.5),
    marginTop: vs(2),
    lineHeight: fs(16),
  },
  reminderSettings: {
    borderTopWidth: 1,
    marginTop: vs(SPACING.md),
    paddingTop: vs(SPACING.md),
  },
  heroDateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: s(SPACING.sm + 2),
    borderRadius: ms(RADIUS.md),
    borderWidth: 1,
    marginBottom: vs(SPACING.xs + 2),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  heroDateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(SPACING.sm),
  },
  heroDateBadge: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(RADIUS.full),
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroDateValue: {
    fontSize: fs(17),
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  heroTimeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: s(SPACING.sm + 2),
    borderRadius: ms(RADIUS.md),
    borderWidth: 1,
    marginBottom: vs(SPACING.xs + 2),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  heroTimeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(SPACING.sm),
  },
  heroClockIcon: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(RADIUS.full),
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTimeValue: {
    fontSize: fs(19),
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  heroSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(5),
    marginTop: vs(2),
  },
  heroBadgeDot: {
    width: ms(6),
    height: ms(6),
    borderRadius: ms(3),
  },
  heroSubText: {
    fontSize: fs(12),
    fontWeight: '600',
  },
  heroEditPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(SPACING.sm + 2),
    paddingVertical: vs(6),
    borderRadius: ms(RADIUS.full),
    gap: s(3),
  },
  heroEditPillText: {
    fontSize: fs(12),
    fontWeight: '700',
  },
  timePresetsScroll: {
    marginVertical: vs(SPACING.xs),
    marginHorizontal: -s(2),
  },
  timePresetsContent: {
    gap: s(SPACING.xs),
    paddingVertical: vs(2),
    paddingRight: s(SPACING.lg),
  },
  presetChip: {
    paddingHorizontal: s(SPACING.sm + 2),
    paddingVertical: vs(6),
    borderRadius: ms(RADIUS.full),
    borderWidth: 1,
  },
  presetText: {
    fontSize: fs(12),
    fontWeight: '700',
  },
  reminderDivider: {
    height: 1,
    marginVertical: vs(SPACING.sm + 2),
  },
  dailySwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: vs(2),
  },
  dailyTitle: {
    fontSize: fs(14),
    fontWeight: '700',
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
  timeSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(SPACING.md),
    paddingVertical: vs(SPACING.sm + 3),
    borderRadius: ms(RADIUS.md),
    borderWidth: 1.5,
    marginBottom: vs(SPACING.sm),
    marginTop: vs(4),
  },
  timeSelectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
  },
  timeSelectValue: {
    fontSize: fs(15),
    fontWeight: '700',
  },
  timeSelect24hr: {
    fontSize: fs(12),
    fontWeight: '500',
  },
  timeSelectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(SPACING.sm),
    paddingVertical: vs(5),
    borderRadius: ms(RADIUS.full),
    gap: s(4),
  },
  timeSelectPillText: {
    fontSize: fs(12),
    fontWeight: '700',
  },
  alertTypeContainer: {
    marginTop: vs(SPACING.sm),
    marginBottom: vs(SPACING.xs),
  },
  alertTypeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(SPACING.xs + 2),
  },
  alertTypeHeaderTitle: {
    fontSize: fs(13),
    fontWeight: '700',
  },
  alertTypeHeaderBadge: {
    fontSize: fs(11),
    fontWeight: '800',
    paddingHorizontal: s(8),
    paddingVertical: vs(2),
    borderRadius: ms(RADIUS.full),
    overflow: 'hidden',
  },
  alertTypeSegments: {
    flexDirection: 'row',
    borderRadius: ms(RADIUS.md),
    padding: s(3),
    gap: s(4),
  },
  alertTypeSegment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(8),
    borderRadius: ms(RADIUS.sm + 2),
    gap: s(6),
  },
  alertTypeSegmentActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  alertTypeSegmentActiveAlarm: {
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  alertTypeSegmentText: {
    fontSize: fs(12.5),
  },
  alarmNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: ms(RADIUS.sm + 2),
    paddingHorizontal: s(SPACING.sm),
    paddingVertical: vs(SPACING.xs + 2),
    marginTop: vs(SPACING.xs + 2),
    gap: s(6),
  },
  alarmNoticeText: {
    flex: 1,
    fontSize: fs(11),
    lineHeight: fs(15),
  },
});
