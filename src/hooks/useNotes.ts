import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { noteService } from '../services/noteService';
import { Note } from '../types/note';
import { auth } from '../firebase/auth';
import { getGamificationProfile, awardXP } from '../services/gamificationService';

export function useNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const activeUid = auth.currentUser?.uid || user?.uid;

  useEffect(() => {
    if (!activeUid) {
      setNotes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = noteService.subscribeUserNotes(activeUid, (fetchedNotes) => {
      setNotes(fetchedNotes);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeUid]);

  const addNote = async (data: { title: string; content: string; isPinned?: boolean }) => {
    const uidToUse = auth.currentUser?.uid || user?.uid;
    if (!uidToUse) throw new Error('You must be signed in to create notes.');
    const created = await noteService.createNote(uidToUse, data);
    getGamificationProfile(uidToUse).then((p) => awardXP(uidToUse, 'CREATE_NOTE', p)).catch(() => {});
    return created;
  };

  const updateNote = async (noteId: string, updates: Partial<Note>) => {
    const uidToUse = auth.currentUser?.uid || user?.uid;
    if (!uidToUse) return;
    return noteService.updateNote(uidToUse, noteId, updates);
  };

  const togglePin = async (noteId: string, currentPinned: boolean) => {
    const uidToUse = auth.currentUser?.uid || user?.uid;
    if (!uidToUse) return;
    return noteService.toggleNotePin(uidToUse, noteId, currentPinned);
  };

  const deleteNote = async (noteId: string) => {
    const uidToUse = auth.currentUser?.uid || user?.uid;
    if (!uidToUse) return;
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
