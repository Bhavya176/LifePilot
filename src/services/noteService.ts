import {
  addDocument,
  updateDocument,
  removeDocument,
  subscribeToSubCollection,
} from '../firebase/firestore';
import { Note, NoteAttachment } from '../types/note';
import { orderBy } from 'firebase/firestore';

export const noteService = {
  async createNote(
    userId: string,
    noteData: { title: string; content: string; isPinned?: boolean; attachments?: NoteAttachment[] }
  ): Promise<string> {
    return addDocument(userId, 'notes', {
      userId,
      title: noteData.title,
      content: noteData.content,
      isPinned: noteData.isPinned || false,
      attachments: noteData.attachments || [],
    });
  },

  async updateNote(userId: string, noteId: string, updates: Partial<Note>): Promise<void> {
    return updateDocument(userId, 'notes', noteId, updates);
  },

  async toggleNotePin(userId: string, noteId: string, currentPinStatus: boolean): Promise<void> {
    return updateDocument(userId, 'notes', noteId, { isPinned: !currentPinStatus });
  },

  async deleteNote(userId: string, noteId: string): Promise<void> {
    return removeDocument(userId, 'notes', noteId);
  },

  subscribeUserNotes(userId: string, onNotesUpdate: (notes: Note[]) => void) {
    return subscribeToSubCollection<Note>(
      userId,
      'notes',
      [orderBy('createdAt', 'desc')],
      onNotesUpdate
    );
  },
};
