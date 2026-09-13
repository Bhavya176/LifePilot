import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import React, { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../context/ThemeContext';
import { useAuthContext } from '../../context/AuthContext';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { Header } from '../../components/ui/Header';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Toast } from '../../components/ui/Toast';
import { useNotes } from '../../hooks/useNotes';
import { uploadUserFile } from '../../firebase/storage';
import { NoteAttachment } from '../../types/note';
import { formatFileSize } from '../../utils/formatters';
import { HapticsService } from '../../services/hapticsService';
import { s, vs, ms, fs } from '../../utils/responsive';
import { GuestGateModal } from '../../components/ui/GuestGateModal';

export default function NoteDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    title?: string;
    content?: string;
    isPinned?: string;
  }>();

  const isEditing = Boolean(params.id);
  const { isDarkMode } = useTheme();
  const { user } = useAuthContext();
  const { addNote, updateNote, deleteNote } = useNotes();
  const theme = isDarkMode ? COLORS.dark : COLORS.light;

  const [title, setTitle] = useState(params.title || '');
  const [content, setContent] = useState(params.content || '');
  const [isPinned, setIsPinned] = useState(params.isPinned === 'true');
  const [attachments, setAttachments] = useState<NoteAttachment[]>([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [guestGateVisible, setGuestGateVisible] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
    setTimeout(() => {
      setToastVisible(false);
    }, 2200);
  };

  const handleCopyNote = async () => {
    // Only copy note content without title as requested
    const textToCopy = (content || '').trim();

    if (!textToCopy) {
      Alert.alert('Empty Content', 'Write some note content first before copying.');
      return;
    }

    try {
      await HapticsService.light();
      await Clipboard.setStringAsync(textToCopy);
      setCopied(true);
      showToast('Content copied to clipboard! 📋');

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      Alert.alert('Copy Error', 'Failed to copy note content.');
    }
  };

  const handlePickAttachment = () => {
    if (user?.isGuest) {
      setGuestGateVisible(true);
      return;
    }
    Alert.alert('Attach File or Image', 'Choose the attachment source:', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: '📷 Take Photo with Camera',
        onPress: async () => {
          try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission Denied', 'Camera permission is required.');
              return;
            }

            const result = await ImagePicker.launchCameraAsync({
              quality: 0.8,
              allowsEditing: true,
            });

            if (result.canceled || !result.assets || result.assets.length === 0) return;

            const asset = result.assets[0];
            setUploadingAttachment(true);
            const uid = user?.uid || 'user-123';
            const fileName = `note_cam_${Date.now()}.jpg`;

            const { downloadUrl } = await uploadUserFile(
              uid,
              'notes',
              fileName,
              asset.uri,
              'image/jpeg'
            );

            const newAttachment: NoteAttachment = {
              id: `att_${Date.now()}`,
              name: fileName,
              url: downloadUrl,
              size: asset.fileSize || 0,
              type: 'image',
            };

            setAttachments((prev) => [...prev, newAttachment]);
          } catch (err: any) {
            Alert.alert('Camera Error', err.message || 'Failed to capture photo.');
          } finally {
            setUploadingAttachment(false);
          }
        },
      },
      {
        text: '🖼️ Choose Image from Photos',
        onPress: async () => {
          try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission Denied', 'Permission to access photos is required.');
              return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              quality: 0.8,
            });

            if (result.canceled || !result.assets || result.assets.length === 0) return;

            const asset = result.assets[0];
            setUploadingAttachment(true);
            const uid = user?.uid;
            if (!uid) throw new Error('User must be signed in.');
            const fileName = `note_img_${Date.now()}.jpg`;

            const { downloadUrl, storagePath } = await uploadUserFile(
              uid,
              'notes',
              fileName,
              asset.uri,
              'image/jpeg'
            );

            const newAttachment: NoteAttachment = {
              id: `att_${Date.now()}`,
              name: asset.fileName || fileName,
              url: downloadUrl,
              size: asset.fileSize || 0,
              type: 'image',
            };

            setAttachments((prev) => [...prev, newAttachment]);
          } catch (err: any) {
            Alert.alert('Upload Error', err.message || 'Failed to attach image.');
          } finally {
            setUploadingAttachment(false);
          }
        },
      },
      {
        text: 'Choose Document File',
        onPress: async () => {
          try {
            const result = await DocumentPicker.getDocumentAsync({
              type: '*/*',
              copyToCacheDirectory: true,
            });

            if (result.canceled || !result.assets || result.assets.length === 0) return;

            const file = result.assets[0];
            setUploadingAttachment(true);
            const uid = user?.uid;
            if (!uid) throw new Error('User must be signed in.');
            const safeName = file.name || `note_doc_${Date.now()}`;

            const { downloadUrl, storagePath } = await uploadUserFile(
              uid,
              'notes',
              safeName,
              file.uri,
              file.mimeType || 'application/octet-stream'
            );

            const newAttachment: NoteAttachment = {
              id: `att_${Date.now()}`,
              name: safeName,
              url: downloadUrl,
              size: file.size || 0,
              type: 'document',
            };

            setAttachments((prev) => [...prev, newAttachment]);
          } catch (err: any) {
            Alert.alert('Upload Error', err.message || 'Failed to attach document.');
          } finally {
            setUploadingAttachment(false);
          }
        },
      },
    ]);
  };

  const handleRemoveAttachment = (attId: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attId));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Note title is required.');
      return;
    }
    if (user?.isGuest) {
      setGuestGateVisible(true);
      return;
    }

    setSaving(true);
    try {
      if (isEditing && params.id) {
        await updateNote(params.id, {
          title: title.trim(),
          content: content.trim(),
          isPinned,
          attachments,
        });
      } else {
        await addNote({
          title: title.trim(),
          content: content.trim(),
          isPinned,
        });
      }
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save note.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!params.id) return;
    Alert.alert('Delete Note', 'Are you sure you want to permanently delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteNote(params.id!);
            router.back();
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete note.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title={isEditing ? 'Edit Note' : 'New Note'}
        showBack
        isDarkMode={isDarkMode}
        rightAction={
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              style={{ padding: s(6), marginRight: s(4) }}
              onPress={handleCopyNote}
              activeOpacity={0.7}
              accessibilityLabel="Copy note to clipboard"
            >
              <Ionicons
                name={copied ? 'checkmark-done' : 'copy-outline'}
                size={22}
                color={copied ? theme.success : theme.textPrimary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={{ padding: s(6) }}
              onPress={() => setIsPinned(!isPinned)}
              activeOpacity={0.7}
              accessibilityLabel="Pin note"
            >
              <Ionicons
                name={isPinned ? 'pin' : 'pin-outline'}
                size={22}
                color={isPinned ? theme.warning : theme.textMuted}
              />
            </TouchableOpacity>
          </View>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Input
            label="Title *"
            placeholder="e.g. Project Roadmap, Recipe notes, Meeting summary"
            value={title}
            onChangeText={setTitle}
            isDarkMode={isDarkMode}
          />

          <Input
            label="Content"
            placeholder="Write your note here..."
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={8}
            isDarkMode={isDarkMode}
          />

          {/* Quick Copy Action Bar */}
          <View style={styles.quickBar}>
            <TouchableOpacity
              style={[
                styles.quickCopyBtn,
                {
                  backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
                  borderColor: copied ? theme.success : (isDarkMode ? '#334155' : '#E2E8F0'),
                },
              ]}
              onPress={handleCopyNote}
              activeOpacity={0.7}
            >
              <Ionicons
                name={copied ? 'checkmark-done' : 'copy-outline'}
                size={16}
                color={copied ? theme.success : theme.primary}
                style={{ marginRight: s(6) }}
              />
              <Text
                style={[
                  styles.quickCopyText,
                  { color: copied ? theme.success : theme.textPrimary },
                ]}
              >
                {copied ? 'Content Copied! 📋' : 'Copy Content to Clipboard 📋'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Attachments Section */}
          <View style={styles.attachmentSection}>
            <TouchableOpacity
              style={styles.attachBtn}
              onPress={handlePickAttachment}
              disabled={uploadingAttachment}
              activeOpacity={0.7}
            >
              {uploadingAttachment ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <Ionicons name="attach" size={20} color={theme.primary} />
              )}
              <Text style={[styles.attachText, { color: theme.primary }]}>
                {uploadingAttachment ? 'Uploading Attachment...' : 'Add Image / File Attachment'}
              </Text>
            </TouchableOpacity>

            {attachments.length > 0 && (
              <View style={styles.attachmentList}>
                {attachments.map((att) => (
                  <View
                    key={att.id}
                    style={[
                      styles.attachmentChip,
                      { backgroundColor: theme.card, borderColor: theme.border },
                    ]}
                  >
                    <Ionicons
                      name={att.type === 'image' ? 'image-outline' : 'document-outline'}
                      size={18}
                      color={theme.primary}
                    />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={[styles.attName, { color: theme.textPrimary }]} numberOfLines={1}>
                        {att.name}
                      </Text>
                      {typeof att.size === 'number' && att.size > 0 && (
                        <Text style={[styles.attSize, { color: theme.textMuted }]}>
                          {formatFileSize(att.size)}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveAttachment(att.id)}
                      style={{ padding: 4 }}
                    >
                      <Ionicons name="close-circle" size={18} color={theme.danger} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          <Button
            title={isEditing ? 'Update Note' : 'Save Note'}
            onPress={handleSave}
            loading={saving}
            isDarkMode={isDarkMode}
            size="lg"
            style={{ marginTop: SPACING.lg }}
          />

          {isEditing && (
            <Button
              title="Delete Note"
              variant="danger"
              onPress={handleDelete}
              isDarkMode={isDarkMode}
              size="lg"
              style={{ marginTop: SPACING.sm, marginBottom: SPACING.xl }}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      <Toast
        visible={toastVisible}
        message={toastMessage}
        icon="clipboard-outline"
        isDarkMode={isDarkMode}
      />
      <GuestGateModal
        visible={guestGateVisible}
        featureName="Note"
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
  quickBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: vs(SPACING.md),
    marginTop: vs(-SPACING.xs),
  },
  quickCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(SPACING.sm),
    paddingVertical: vs(6),
    borderRadius: ms(RADIUS.md),
    borderWidth: 1,
  },
  quickCopyText: {
    fontSize: fs(12.5),
    fontWeight: '600',
  },
  attachmentSection: {
    marginTop: vs(SPACING.xs),
    marginBottom: vs(SPACING.sm),
  },
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(SPACING.sm),
  },
  attachText: {
    fontSize: fs(14),
    fontWeight: '600',
    marginLeft: s(6),
  },
  attachmentList: {
    marginTop: vs(SPACING.xs),
  },
  attachmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: s(SPACING.sm),
    borderRadius: ms(RADIUS.md),
    borderWidth: 1,
    marginBottom: vs(SPACING.xs),
  },
  attName: {
    fontSize: fs(13),
    fontWeight: '600',
  },
  attSize: {
    fontSize: fs(11),
    marginTop: vs(2),
  },
});
