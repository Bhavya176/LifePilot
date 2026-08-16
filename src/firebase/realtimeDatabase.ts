import {
  getDatabase,
  ref,
  set,
  push,
  remove,
  onValue,
  onDisconnect,
  query,
  limitToLast,
  Database,
} from 'firebase/database';
import { app } from './config';

export const rtdb: Database = getDatabase(app);

export type LiveStatusState = 'Working' | 'Break' | 'Completed' | 'Offline';

export interface UserLivePresence {
  status: LiveStatusState;
  lastUpdated: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  text: string;
  timestamp: string;
  reactions?: Record<string, string[]>; // emoji -> array of userIds
}

export interface FocusUser {
  userId: string;
  userName: string;
  activity: string;
  joinedAt: string;
  status: 'Focusing' | 'Break';
}

/**
 * Set user live productivity status in Realtime Database at path status/{userId}
 * Uses onDisconnect() to automatically flip state to 'Offline' when connection drops.
 */
export async function setUserLiveStatus(userId: string, status: LiveStatusState): Promise<void> {
  const statusRef = ref(rtdb, `status/${userId}`);

  const statusPayload: UserLivePresence = {
    status,
    lastUpdated: new Date().toISOString(),
  };

  const disconnectRef = onDisconnect(statusRef);
  await disconnectRef.set({
    status: 'Offline',
    lastUpdated: new Date().toISOString(),
  });

  await set(statusRef, statusPayload);
}

/**
 * Listen to real-time presence updates for a given user UID
 */
export function subscribeUserLiveStatus(
  userId: string,
  onStatusUpdate: (presence: UserLivePresence | null) => void
) {
  const statusRef = ref(rtdb, `status/${userId}`);

  return onValue(statusRef, (snapshot) => {
    if (snapshot.exists()) {
      onStatusUpdate(snapshot.val() as UserLivePresence);
    } else {
      onStatusUpdate(null);
    }
  });
}

// ==========================================
// 💬 Real-Time Live Chat Functions
// ==========================================

/**
 * Send a new real-time chat message to /chat/messages
 */
export async function sendChatMessage(
  userId: string,
  userName: string,
  text: string,
  userEmail?: string
): Promise<void> {
  const messagesRef = ref(rtdb, 'chat/messages');
  const newMsgRef = push(messagesRef);

  const payload: Omit<ChatMessage, 'id'> = {
    userId,
    userName: userName || 'Explorer',
    userEmail: userEmail || '',
    text: text.trim(),
    timestamp: new Date().toISOString(),
  };

  await set(newMsgRef, payload);
}

/**
 * Subscribe to the last 50 chat messages in real time
 */
export function subscribeChatMessages(onMessages: (messages: ChatMessage[]) => void) {
  const messagesQuery = query(ref(rtdb, 'chat/messages'), limitToLast(50));

  return onValue(messagesQuery, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const list: ChatMessage[] = Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
      }));
      // Sort oldest to newest for chronological chat feed
      list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      onMessages(list);
    } else {
      onMessages([]);
    }
  });
}

/**
 * Set real-time typing status at /chat/typing/{userId}
 */
export async function setUserTyping(userId: string, userName: string, isTyping: boolean): Promise<void> {
  const typingRef = ref(rtdb, `chat/typing/${userId}`);

  if (isTyping) {
    onDisconnect(typingRef).remove();
    await set(typingRef, {
      userId,
      userName: userName || 'Someone',
      timestamp: Date.now(),
    });
  } else {
    await remove(typingRef);
  }
}

/**
 * Subscribe to who is currently typing
 */
export function subscribeTypingUsers(
  currentUserId: string,
  onTyping: (typingUsers: { userId: string; userName: string }[]) => void
) {
  const typingRef = ref(rtdb, 'chat/typing');

  return onValue(typingRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const now = Date.now();
      const users = Object.keys(data)
        .map((key) => data[key])
        .filter((u) => u.userId !== currentUserId && now - (u.timestamp || 0) < 6000);
      onTyping(users);
    } else {
      onTyping([]);
    }
  });
}

/**
 * Toggle reaction emoji on a chat message
 */
export async function toggleMessageReaction(
  messageId: string,
  emoji: string,
  userId: string
): Promise<void> {
  const reactionRef = ref(rtdb, `chat/messages/${messageId}/reactions/${emoji}`);
  // We read the current list of userIds
  onValue(
    reactionRef,
    async (snapshot) => {
      let currentUsers: string[] = snapshot.exists() ? (snapshot.val() as string[]) : [];
      if (currentUsers.includes(userId)) {
        currentUsers = currentUsers.filter((u) => u !== userId);
      } else {
        currentUsers.push(userId);
      }
      await set(reactionRef, currentUsers);
    },
    { onlyOnce: true }
  );
}

// ==========================================
// 👥 Live Co-Working / Focus Room Functions
// ==========================================

/**
 * Join live focus room at /focus_room/active_users/{userId}
 */
export async function joinFocusRoom(
  userId: string,
  userName: string,
  activity: string
): Promise<void> {
  const userFocusRef = ref(rtdb, `focus_room/active_users/${userId}`);

  const payload: FocusUser = {
    userId,
    userName: userName || 'Focus Member',
    activity: activity || 'Deep Focus Session',
    joinedAt: new Date().toISOString(),
    status: 'Focusing',
  };

  onDisconnect(userFocusRef).remove();
  await set(userFocusRef, payload);
}

/**
 * Leave focus room
 */
export async function leaveFocusRoom(userId: string): Promise<void> {
  const userFocusRef = ref(rtdb, `focus_room/active_users/${userId}`);
  await remove(userFocusRef);
}

/**
 * Subscribe to all currently active users in Focus Room
 */
export function subscribeFocusUsers(onUsers: (users: FocusUser[]) => void) {
  const focusRef = ref(rtdb, 'focus_room/active_users');

  return onValue(focusRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const list: FocusUser[] = Object.keys(data).map((key) => data[key]);
      onUsers(list);
    } else {
      onUsers([]);
    }
  });
}
