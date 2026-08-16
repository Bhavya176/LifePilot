import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { noteService } from '../services/noteService';
import { Note } from '../types/note';
import { auth } from '../firebase/auth';

export function useNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const activeUid = auth.currentUser?.uid || user?.uid || 'demo-user-123';

  useEffect(() => {
    setLoading(true);
    const unsubscribe = noteService.subscribeUserNotes(activeUid, (fetchedNotes) => {
      setNotes(fetchedNotes);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeUid]);

  const addNote = async (data: { title: string; content: string; isPinned?: boolean }) => {
    const uidToUse = auth.currentUser?.uid || user?.uid || 'demo-user-123';
    return noteService.createNote(uidToUse, data);
  };

  const updateNote = async (noteId: string, updates: Partial<Note>) => {
    const uidToUse = auth.currentUser?.uid || user?.uid || 'demo-user-123';
    return noteService.updateNote(uidToUse, noteId, updates);
  };

  const togglePin = async (noteId: string, currentPinned: boolean) => {
    const uidToUse = auth.currentUser?.uid || user?.uid || 'demo-user-123';
    return noteService.toggleNotePin(uidToUse, noteId, currentPinned);
  };

  const deleteNote = async (noteId: string) => {
    const uidToUse = auth.currentUser?.uid || user?.uid || 'demo-user-123';
    return noteService.deleteNote(uidToUse, noteId);
  };

  return {
    notes,
    loading,
    addNote,
    updateNote,
    togglePin,
    deleteNote,
  };
}
