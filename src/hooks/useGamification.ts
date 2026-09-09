import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '../context/AuthContext';
import {
  GamificationProfile,
  DEFAULT_PROFILE,
  XPAction,
  getLevelFromXP,
  getLevelProgress,
  ACHIEVEMENTS,
} from '../types/gamification';
import { getGamificationProfile, awardXP, updateBestStreak } from '../services/gamificationService';

export function useGamification() {
  const { user } = useAuthContext();
  const [profile, setProfile] = useState<GamificationProfile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);
  const [levelUpVisible, setLevelUpVisible] = useState(false);
  const [newBadges, setNewBadges] = useState<string[]>([]);

  useEffect(() => {
    const uid = user?.uid;
    if (!uid) return;

    let isMounted = true;
    getGamificationProfile(uid)
      .then((p) => {
        if (isMounted) setProfile(p);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const earnXP = useCallback(
    async (action: XPAction) => {
      if (!user?.uid) return;
      const result = await awardXP(user.uid, action, profile);
      setProfile(result.profile);

      if (result.leveledUp) {
        setLevelUpVisible(true);
      }

      if (result.newAchievements.length > 0) {
        setNewBadges(result.newAchievements);
      }
    },
    [user, profile]
  );

  const recordStreak = useCallback(
    async (streak: number) => {
      if (!user?.uid) return;
      const updated = await updateBestStreak(user.uid, streak, profile);
      setProfile(updated);
    },
    [user, profile]
  );

  const dismissLevelUp = useCallback(() => setLevelUpVisible(false), []);
  const dismissBadges = useCallback(() => setNewBadges([]), []);

  const currentLevel = getLevelFromXP(profile.totalXP);
  const levelProgress = getLevelProgress(profile.totalXP);

  const unlockedAchievements = ACHIEVEMENTS.filter((a) =>
    (profile.earnedAchievements || []).includes(a.id)
  );
  const lockedAchievements = ACHIEVEMENTS.filter(
    (a) => !(profile.earnedAchievements || []).includes(a.id)
  );

  return {
    profile,
    loading,
    earnXP,
    recordStreak,
    currentLevel,
    levelProgress,
    unlockedAchievements,
    lockedAchievements,
    levelUpVisible,
    dismissLevelUp,
    newBadges,
    dismissBadges,
  };
}
