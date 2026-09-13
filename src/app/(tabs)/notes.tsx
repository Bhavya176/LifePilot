import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../context/ThemeContext';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Header } from '../../components/ui/Header';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Toast } from '../../components/ui/Toast';
import { useNotes } from '../../hooks/useNotes';
import { Note } from '../../types/note';
import { HapticsService } from '../../services/hapticsService';
import { s, vs, ms, fs } from '../../utils/responsive';
import { useAuthContext } from '../../context/AuthContext';
import { GuestGateModal } from '../../components/ui/GuestGateModal';

export default function NotesScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { user } = useAuthContext();
  const theme = isDarkMode ? COLORS.dark : COLORS.light;
  const { notes, loading, togglePin, deleteNote } = useNotes();
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);
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

  const handleCreateNote = () => {
    HapticsService.light();
    if (user?.isGuest) {
      setGuestGateVisible(true);
      return;
    }
    router.push('/screens/note-detail');
  };

  const handleCopyNote = async (note: Note) => {
    try {
      await HapticsService.light();
      // Only copy note content without title as requested
      const textToCopy = (note.content || '').trim();

      if (!textToCopy) {
        Alert.alert('Empty Content', 'This note has no content body to copy.');
        return;
      }

      await Clipboard.setStringAsync(textToCopy);
      setCopiedNoteId(note.id);
      showToast('Content copied to clipboard! 📋');

      setTimeout(() => {
        setCopiedNoteId((current) => (current === note.id ? null : current));
      }, 2000);
    } catch {
      Alert.alert('Copy Error', 'Failed to copy note content to clipboard.');
    }
  };

  const filteredNotes = notes.filter((n) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      n.title.toLowerCase().includes(q) ||
      (n.content && n.content.toLowerCase().includes(q))
    );
  });

  const pinnedNotes = filteredNotes.filter((n) => n.isPinned);
  const regularNotes = filteredNotes.filter((n) => !n.isPinned);

  const handleOpenNote = (note: Note) => {
    router.push({
      pathname: '/screens/note-detail',
      params: {
        id: note.id,
        title: note.title,
        content: note.content,
        isPinned: note.isPinned ? 'true' : 'false',
      },
    });
  };

  const handleDeleteNote = (note: Note) => {
    Alert.alert(
      'Delete Note',
      `Are you sure you want to permanently delete "${note.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteNote(note.id);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete note.');
            }
          },
        },
      ]
    );
  };

  const formatNoteDate = (isoStr?: string) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const renderNoteCard = (note: Note) => (
    <Card key={note.id} isDarkMode={isDarkMode} style={styles.noteCard}>
      <TouchableOpacity onPress={() => handleOpenNote(note)} activeOpacity={0.8}>
        <View style={styles.noteHeader}>
          <Text
            style={[styles.noteTitle, { color: theme.textPrimary }]}
            numberOfLines={1}
          >
            {note.title}
          </Text>
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => handleCopyNote(note)}
              accessibilityLabel="Copy note to clipboard"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={copiedNoteId === note.id ? 'checkmark-done' : 'copy-outline'}
                size={18}
                color={copiedNoteId === note.id ? theme.success : theme.textMuted}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => togglePin(note.id, note.isPinned)}
              accessibilityLabel="Pin note"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={note.isPinned ? 'pin' : 'pin-outline'}
                size={18}
                color={note.isPinned ? theme.warning : theme.textMuted}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => handleDeleteNote(note)}
              accessibilityLabel="Delete note"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={18} color={theme.danger} />
            </TouchableOpacity>
          </View>
        </View>

        {note.content ? (
          <Text
            style={[styles.noteContent, { color: theme.textSecondary }]}
            numberOfLines={3}
          >
            {note.content}
          </Text>
        ) : null}

        <View style={styles.noteFooter}>
          <Text style={[styles.dateText, { color: theme.textMuted }]}>
            {formatNoteDate(note.createdAt)}
          </Text>
          {note.attachments && note.attachments.length > 0 ? (
            <Badge
              label={`${note.attachments.length} ${
                note.attachments.length === 1 ? 'Attachment' : 'Attachments'
              }`}
              variant="info"
              isDarkMode={isDarkMode}
            />
          ) : null}
        </View>
      </TouchableOpacity>
    </Card>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title="Notes"
        subtitle="Personal notes, ideas & brain dumps"
        isDarkMode={isDarkMode}
        rightAction={
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: theme.primary }]}
            onPress={handleCreateNote}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <View style={styles.searchContainer}>
        <Input
          placeholder="Search notes by title or content..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          isDarkMode={isDarkMode}
          leftIcon={<Ionicons name="search-outline" size={20} color={theme.textMuted} />}
          containerStyle={{ marginBottom: 0 }}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={{ marginTop: SPACING.md, color: theme.textSecondary }}>
              Loading notes from Firestore...
            </Text>
          </View>
        ) : filteredNotes.length === 0 ? (
          <EmptyState
            title={searchQuery ? 'No Matching Notes' : 'No Notes Found'}
            description={
              searchQuery
                ? `No notes matching "${searchQuery}".`
                : 'Capture your thoughts, ideas, and meeting notes with Firestore sync.'
            }
            actionTitle={searchQuery ? undefined : 'Create First Note'}
            onAction={searchQuery ? undefined : handleCreateNote}
            iconName="document-text-outline"
            isDarkMode={isDarkMode}
          />
        ) : (
          <>
            {/* Pinned Notes Section */}
            {pinnedNotes.length > 0 && (
              <View style={styles.sectionGroup}>
                <View style={styles.sectionRow}>
                  <Ionicons name="pin" size={18} color={theme.warning} />
                  <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                    Pinned Notes ({pinnedNotes.length})
                  </Text>
                </View>
                {pinnedNotes.map(renderNoteCard)}
              </View>
            )}

            {/* All Notes Section */}
            {regularNotes.length > 0 && (
              <View style={styles.sectionGroup}>
                {pinnedNotes.length > 0 && (
                  <View style={styles.sectionRow}>
                    <Ionicons name="document-text-outline" size={18} color={theme.primary} />
                    <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                      All Notes ({regularNotes.length})
                    </Text>
                  </View>
                )}
                {regularNotes.map(renderNoteCard)}
              </View>
            )}
          </>
        )}
      </ScrollView>
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
  addBtn: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(RADIUS.full),
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: s(SPACING.md),
    marginBottom: vs(SPACING.sm),
  },
  scrollContent: {
    paddingHorizontal: s(SPACING.md),
    paddingBottom: vs(110),
  },
  loadingContainer: {
    padding: s(SPACING.xl),
    alignItems: 'center',
  },
  sectionGroup: {
    marginBottom: vs(SPACING.sm),
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: vs(SPACING.xs),
    marginBottom: vs(SPACING.xs),
  },
  sectionTitle: {
    fontSize: fs(16),
    fontWeight: '700',
    marginLeft: s(6),
  },
  noteCard: {
    marginBottom: vs(SPACING.sm),
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(SPACING.xs),
  },
  noteTitle: {
    fontSize: fs(16),
    fontWeight: '700',
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    padding: s(6),
    marginLeft: s(SPACING.xs),
  },
  noteContent: {
    fontSize: fs(14),
    lineHeight: fs(20),
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: vs(SPACING.md),
  },
  dateText: {
    fontSize: fs(12),
  },
});
