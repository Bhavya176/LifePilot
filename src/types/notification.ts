export type NotificationType = 'task' | 'habit' | 'goal' | 'summary' | 'document' | 'system';

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  read: boolean;
  relatedEntityId?: string;
  createdAt: string;
}
