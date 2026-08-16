import {
  addDocument,
  removeDocument,
  subscribeToSubCollection,
} from '../firebase/firestore';
import { uploadUserFile, deleteUserFile } from '../firebase/storage';
import { DocumentItem } from '../types/document';
import { orderBy } from 'firebase/firestore';

export const documentService = {
  async uploadDocument(
    userId: string,
    title: string,
    category: DocumentItem['category'],
    file: { name: string; blob: Blob | Uint8Array | string; size: number; mimeType: string },
    onProgress?: (percent: number) => void
  ): Promise<string> {
    const timestamp = Date.now();
    const safeFileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // Upload to Firebase Storage under users/{userId}/documents/{fileName}
    const { downloadUrl, storagePath } = await uploadUserFile(
      userId,
      'documents',
      safeFileName,
      file.blob,
      file.mimeType,
      onProgress
    );

    // Save document metadata record in Cloud Firestore under users/{userId}/documents/{docId}
    return addDocument<DocumentItem>(userId, 'documents', {
      userId,
      title,
      fileName: file.name,
      fileUrl: downloadUrl,
      storagePath,
      fileSize: file.size,
      mimeType: file.mimeType,
      category,
    });
  },

  async deleteDocument(userId: string, docItem: DocumentItem): Promise<void> {
    try {
      if (docItem.storagePath) {
        await deleteUserFile(docItem.storagePath);
      }
    } catch (e) {
      console.warn('Storage deletion error (file might not exist):', e);
    }
    return removeDocument(userId, 'documents', docItem.id);
  },

  subscribeUserDocuments(userId: string, onDocsUpdate: (docs: DocumentItem[]) => void) {
    return subscribeToSubCollection<DocumentItem>(
      userId,
      'documents',
      [orderBy('createdAt', 'desc')],
      onDocsUpdate
    );
  },
};
