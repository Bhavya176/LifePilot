import {
  addDocument,
  updateDocument,
  removeDocument,
  subscribeToSubCollection,
} from '../firebase/firestore';
import { AppNotification, NotificationType } from '../types/notification';
import { orderBy } from 'firebase/firestore';

export const notificationService = {
  async createNotification(
    userId: string,
    notificationData: { title: string; body: string; type: NotificationType; relatedEntityId?: string }
  ): Promise<string> {
    return addDocument(userId, 'notifications', {
      userId,
      title: notificationData.title,
      body: notificationData.body,
      type: notificationData.type,
      read: false,
      relatedEntityId: notificationData.relatedEntityId || '',
    });
  },

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    return updateDocument(userId, 'notifications', notificationId, { read: true });
  },

  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    return removeDocument(userId, 'notifications', notificationId);
  },

  subscribeUserNotifications(userId: string, onNotifsUpdate: (notifs: AppNotification[]) => void) {
    return subscribeToSubCollection<AppNotification>(
      userId,
      'notifications',
      [orderBy('createdAt', 'desc')],
      onNotifsUpdate
    );
  },
};
