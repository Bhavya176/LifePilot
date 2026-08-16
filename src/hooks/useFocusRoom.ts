import { useState, useEffect } from 'react';
import { useAuthContext } from '../context/AuthContext';
import {
  FocusUser,
  joinFocusRoom,
  leaveFocusRoom,
  subscribeFocusUsers,
} from '../firebase/realtimeDatabase';

export function useFocusRoom() {
  const { user } = useAuthContext();
  const [activeUsers, setActiveUsers] = useState<FocusUser[]>([]);
  const [isFocusing, setIsFocusing] = useState<boolean>(false);
  const [myActivity, setMyActivity] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeFocusUsers((users) => {
      setActiveUsers(users);
      if (user) {
        const found = users.find((u) => u.userId === user.uid);
        setIsFocusing(!!found);
        if (found) {
          setMyActivity(found.activity);
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [user?.uid]);

  const joinSession = async (activity: string) => {
    if (!user) return;
    await joinFocusRoom(user.uid, user.name || 'Explorer', activity || 'Focus Session');
    setIsFocusing(true);
    setMyActivity(activity);
  };

  const leaveSession = async () => {
    if (!user) return;
    await leaveFocusRoom(user.uid);
    setIsFocusing(false);
    setMyActivity('');
  };

  return {
    activeUsers,
    isFocusing,
    myActivity,
    loading,
    joinSession,
    leaveSession,
    currentUserId: user?.uid,
  };
}
