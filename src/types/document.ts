export interface DocumentItem {
  id: string;
  userId: string;
  title: string;
  fileName: string;
  fileUrl: string;
  storagePath: string;
  fileSize: number;
  mimeType: string;
  category: 'ID' | 'Receipt' | 'Certificate' | 'Contract' | 'Other';
  createdAt: string;
  updatedAt: string;
}
