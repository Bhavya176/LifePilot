import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { documentService } from '../services/documentService';
import { DocumentItem } from '../types/document';
import { auth } from '../firebase/auth';

export function useDocuments() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const activeUid = auth.currentUser?.uid || user?.uid;

  useEffect(() => {
    if (!activeUid) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = documentService.subscribeUserDocuments(activeUid, (fetchedDocs) => {
      setDocuments(fetchedDocs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeUid]);

  const uploadDoc = async (
    title: string,
    category: DocumentItem['category'],
    file: { name: string; blob: Blob | Uint8Array | string; size: number; mimeType: string }
  ) => {
    const uidToUse = auth.currentUser?.uid || user?.uid;
    if (!uidToUse) throw new Error('You must be signed in to upload documents.');
    setUploadProgress(0);
    try {
      const docId = await documentService.uploadDocument(
        uidToUse,
        title,
        category,
        file,
        (percent) => setUploadProgress(percent)
      );
      return docId;
    } finally {
      setUploadProgress(null);
    }
  };

  const deleteDoc = async (docItem: DocumentItem) => {
    const uidToUse = auth.currentUser?.uid || user?.uid;
    if (!uidToUse) return;
    return documentService.deleteDocument(uidToUse, docItem);
  };

  return {
    documents,
    loading,
    uploadProgress,
    uploadDoc,
    deleteDoc,
  };
}
