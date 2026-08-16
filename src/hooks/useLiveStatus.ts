import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
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

  const activeUid = user?.uid || 'demo-user-123';

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeUserLiveStatus(activeUid, (updatedPresence) => {
      setPresence(updatedPresence || { status: 'Working', lastUpdated: new Date().toISOString() });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeUid]);

  const changeStatus = async (newStatus: LiveStatusState) => {
    await setUserLiveStatus(activeUid, newStatus);
  };

  return {
    status: presence?.status || 'Working',
    lastUpdated: presence?.lastUpdated,
    loading,
    changeStatus,
  };
}
