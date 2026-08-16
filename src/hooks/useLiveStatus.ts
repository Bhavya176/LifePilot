import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { auth } from '../firebase/auth';
import {
  setUserLiveStatus,
  subscribeUserLiveStatus,
  LiveStatusState,
  UserLivePresence,
} from '../firebase/realtimeDatabase';

export function useLiveStatus() {
  const { user } = useAuth();
  const [presence, setPresence] = useState<UserLivePresence | null>({
    status: 'Working',
    lastUpdated: new Date().toISOString(),
  });
  const [loading, setLoading] = useState<boolean>(true);

  const activeUid = auth.currentUser?.uid || user?.uid;

  useEffect(() => {
    if (!activeUid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeUserLiveStatus(activeUid, (updatedPresence) => {
      setPresence(updatedPresence || { status: 'Working', lastUpdated: new Date().toISOString() });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeUid]);

  const changeStatus = async (newStatus: LiveStatusState) => {
    if (!activeUid) return;
    await setUserLiveStatus(activeUid, newStatus);
  };

  return {
    status: presence?.status || 'Working',
    lastUpdated: presence?.lastUpdated,
    loading,
    changeStatus,
  };
}
