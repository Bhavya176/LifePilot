export interface NoteAttachment {
  id: string;
  url: string;
  name: string;
  type: 'image' | 'document';
  size?: number;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  isPinned: boolean;
  attachments?: NoteAttachment[];
  createdAt: string;
  updatedAt: string;
}
