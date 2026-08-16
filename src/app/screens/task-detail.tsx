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
import { getTodayString } from '../../utils/dateUtils';
import { s, vs, ms, fs } from '../../utils/responsive';
import { Image, ActivityIndicator } from 'react-native';

export default function TaskDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    title?: string;
    description?: string;
    dueDate?: string;
    priority?: TaskPriority;
    category?: TaskCategory;
    reminder?: string;
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
  const [priority, setPriority] = useState<TaskPriority>(params.priority || 'medium');
  const [category, setCategory] = useState<TaskCategory>(params.category || 'work');
  const [reminder, setReminder] = useState(params.reminder !== 'false');
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

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Task title is required.');
      return;
    }
    setSaving(true);
    try {
      if (isEditing && params.id) {
        await updateTask(params.id, {
          title: title.trim(),
          description: description.trim(),
          dueDate: dueDate || getTodayString(),
          priority,
          category,
          reminder,
          imageUrl,
        });
      } else {
        await addTask({
          title: title.trim(),
          description: description.trim(),
          dueDate: dueDate || getTodayString(),
          priority,
          category,
          completed: false,
          reminder,
          imageUrl,
        });
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
            await deleteTask(params.id!);
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

          <Input
            label="Due Date (YYYY-MM-DD)"
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

          <View style={styles.reminderRow}>
            <Text style={[styles.label, { color: theme.textPrimary, marginBottom: 0 }]}>
              Enable Reminder Notification
            </Text>
            <Switch
              value={reminder}
              onValueChange={setReminder}
              trackColor={{ false: '#94A3B8', true: theme.primary }}
            />
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
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: vs(SPACING.md),
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
