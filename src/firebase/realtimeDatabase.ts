import {
  getDatabase,
  ref,
  set,
  onValue,
  onDisconnect,
  Database,
} from 'firebase/database';
import { app } from './config';

export const rtdb: Database = getDatabase(app);

export type LiveStatusState = 'Working' | 'Break' | 'Completed' | 'Offline';

export interface UserLivePresence {
  status: LiveStatusState;
  lastUpdated: string;
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

  // Configure automatic disconnect handler
  const disconnectRef = onDisconnect(statusRef);
  await disconnectRef.set({
    status: 'Offline',
    lastUpdated: new Date().toISOString(),
  });

  // Set active presence state
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
