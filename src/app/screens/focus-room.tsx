import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { Header } from '../../components/ui/Header';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { s, vs, ms, fs } from '../../utils/responsive';
import { useFocusRoom } from '../../hooks/useFocusRoom';
import { FocusUser } from '../../firebase/realtimeDatabase';

const FOCUS_PRESETS = [
  { label: '💻 Coding & Dev', value: 'Coding & App Development 💻' },
  { label: '📚 Reading & Learning', value: 'Reading & Skill Learning 📚' },
  { label: '🎯 Deep Work', value: 'Deep Work & Strategy 🎯' },
  { label: '📝 Writing & Content', value: 'Writing & Planning 📝' },
  { label: '📐 Problem Solving', value: 'Problem Solving & Math 📐' },
];

export default function FocusRoomScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? COLORS.dark : COLORS.light;
  const {
    activeUsers,
    isFocusing,
    myActivity,
    loading,
    joinSession,
    leaveSession,
    currentUserId,
  } = useFocusRoom();

  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [customActivity, setCustomActivity] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(FOCUS_PRESETS[0].value);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Local timer when focusing
  useEffect(() => {
    let interval: any = null;
    if (isFocusing) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isFocusing]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleJoin = async () => {
    const activityToSet = customActivity.trim() || selectedPreset;
    await joinSession(activityToSet);
    setJoinModalVisible(false);
    setCustomActivity('');
  };

  const handleLeave = () => {
    Alert.alert('End Focus Session', 'Are you sure you want to take a break and leave the room?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave Room',
        style: 'destructive',
        onPress: async () => {
          await leaveSession();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title="Live Co-Working Room"
        subtitle="Focus together in real time with the community"
        showBack
        isDarkMode={isDarkMode}
        rightAction={
          <TouchableOpacity
            style={[styles.chatBtn, { backgroundColor: theme.primaryLight }]}
            onPress={() => router.push('/screens/community-chat')}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={theme.primary} />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Active Focus Session Banner */}
        <Card
          isDarkMode={isDarkMode}
          style={[
            styles.sessionBanner,
            { borderColor: isFocusing ? theme.success : theme.border },
          ]}
        >
          <View style={styles.bannerHeader}>
            <View style={styles.liveIndicatorRow}>
              <View style={[styles.pulseDot, { backgroundColor: isFocusing ? '#10B981' : '#64748B' }]} />
              <Text
                style={[
                  styles.statusText,
                  { color: isFocusing ? theme.success : theme.textSecondary },
                ]}
              >
                {isFocusing ? 'YOU ARE IN DEEP FOCUS' : 'NOT IN FOCUS SESSION'}
              </Text>
            </View>
            <Text style={[styles.activeCountBadge, { color: theme.primary }]}>
              👥 {activeUsers.length} Active Now
            </Text>
          </View>

          {isFocusing ? (
            <View style={styles.timerWrapper}>
              <Text style={[styles.timerText, { color: theme.textPrimary }]}>
                {formatTimer(elapsedSeconds)}
              </Text>
              <Text style={[styles.myActivityLabel, { color: theme.textSecondary }]}>
                Target: <Text style={{ color: theme.primary, fontWeight: '700' }}>{myActivity}</Text>
              </Text>
              <Button
                title="☕ Take a Break / Leave Room"
                variant="outline"
                onPress={handleLeave}
                isDarkMode={isDarkMode}
                style={{ marginTop: vs(SPACING.md), borderColor: theme.danger }}
              />
            </View>
          ) : (
            <View style={styles.joinPromptWrapper}>
              <Text style={[styles.promptTitle, { color: theme.textPrimary }]}>
                Ready to get work done?
              </Text>
              <Text style={[styles.promptSub, { color: theme.textSecondary }]}>
                Join other members working right now. Your focus status and topic will sync live to the room!
              </Text>
              <Button
                title="🚀 Join Live Focus Room"
                onPress={() => setJoinModalVisible(true)}
                isDarkMode={isDarkMode}
                style={{ marginTop: vs(SPACING.md) }}
              />
            </View>
          )}
        </Card>

        {/* Live Active Members List */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Active Members ({activeUsers.length})
          </Text>
          <TouchableOpacity onPress={() => router.push('/screens/community-chat')}>
            <Text style={[styles.chatLink, { color: theme.primary }]}>Open Chat 💬</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={{ marginTop: vs(SPACING.sm), color: theme.textSecondary }}>
              Connecting to Realtime Room...
            </Text>
          </View>
        ) : activeUsers.length === 0 ? (
          <Card isDarkMode={isDarkMode} style={styles.emptyCard}>
            <Ionicons name="people-outline" size={ms(40)} color={theme.textMuted} />
            <Text style={[styles.emptyCardTitle, { color: theme.textPrimary }]}>
              No one is focusing right now
            </Text>
            <Text style={[styles.emptyCardSub, { color: theme.textSecondary }]}>
              Be the first to start a focus session!
            </Text>
          </Card>
        ) : (
          activeUsers.map((userItem: FocusUser) => {
            const isMe = userItem.userId === currentUserId;
            return (
              <Card
                key={userItem.userId}
                isDarkMode={isDarkMode}
                style={[
                  styles.memberCard,
                  isMe && { borderColor: theme.primary, borderWidth: 1.5 },
                ]}
              >
                <View style={styles.memberRow}>
                  <View style={[styles.memberAvatar, { backgroundColor: theme.primaryLight }]}>
                    <Text style={[styles.avatarText, { color: theme.primary }]}>
                      {(userItem.userName || 'M').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <View style={styles.memberNameRow}>
                      <Text style={[styles.memberName, { color: theme.textPrimary }]}>
                        {userItem.userName} {isMe ? '(You)' : ''}
                      </Text>
                      <View style={[styles.focusPill, { backgroundColor: isDarkMode ? '#064E3B' : '#D1FAE5' }]}>
                        <Text style={[styles.focusPillText, { color: '#059669' }]}>🔥 Focusing</Text>
                      </View>
                    </View>
                    <Text style={[styles.activityText, { color: theme.textSecondary }]}>
                      {userItem.activity}
                    </Text>
                  </View>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Join Focus Session Modal */}
      <Modal visible={joinModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                Join Focus Room
              </Text>
              <TouchableOpacity onPress={() => setJoinModalVisible(false)}>
                <Ionicons name="close-circle-outline" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.presetLabel, { color: theme.textSecondary }]}>
              What are you focusing on?
            </Text>
            <View style={styles.presetList}>
              {FOCUS_PRESETS.map((p) => {
                const isSelected = selectedPreset === p.value;
                return (
                  <TouchableOpacity
                    key={p.value}
                    style={[
                      styles.presetPill,
                      {
                        backgroundColor: isSelected
                          ? theme.primary
                          : isDarkMode
                          ? '#1E293B'
                          : '#F1F5F9',
                      },
                    ]}
                    onPress={() => {
                      setSelectedPreset(p.value);
                      setCustomActivity('');
                    }}
                  >
                    <Text
                      style={[
                        styles.presetPillText,
                        { color: isSelected ? '#FFFFFF' : theme.textPrimary },
                      ]}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.presetLabel, { color: theme.textSecondary, marginTop: vs(SPACING.sm) }]}>
              Or write custom goal:
            </Text>
            <TextInput
              style={[
                styles.customInput,
                {
                  backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                  color: theme.textPrimary,
                  borderColor: theme.border,
                },
              ]}
              placeholder="e.g. Building Firebase feature"
              placeholderTextColor={theme.textMuted}
              value={customActivity}
              onChangeText={(txt) => {
                setCustomActivity(txt);
                if (txt.trim()) setSelectedPreset('');
              }}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setJoinModalVisible(false)}
                isDarkMode={isDarkMode}
                style={{ flex: 1, marginRight: s(SPACING.sm) }}
              />
              <Button
                title="Start Focusing 🎯"
                onPress={handleJoin}
                isDarkMode={isDarkMode}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: s(SPACING.md),
    paddingBottom: vs(SPACING.xl),
  },
  chatBtn: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionBanner: {
    padding: s(SPACING.lg),
    marginBottom: vs(SPACING.lg),
    borderWidth: 1.5,
  },
  bannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(SPACING.sm),
  },
  liveIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulseDot: {
    width: ms(10),
    height: ms(10),
    borderRadius: ms(5),
    marginRight: s(6),
  },
  statusText: {
    fontSize: fs(11),
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  activeCountBadge: {
    fontSize: fs(12),
    fontWeight: '700',
  },
  timerWrapper: {
    alignItems: 'center',
    paddingVertical: vs(SPACING.sm),
  },
  timerText: {
    fontSize: fs(36),
    fontWeight: '800',
    letterSpacing: 2,
  },
  myActivityLabel: {
    fontSize: fs(13),
    marginTop: vs(4),
  },
  joinPromptWrapper: {
    alignItems: 'center',
    paddingVertical: vs(SPACING.xs),
  },
  promptTitle: {
    fontSize: fs(16),
    fontWeight: '700',
    textAlign: 'center',
  },
  promptSub: {
    fontSize: fs(12),
    textAlign: 'center',
    marginTop: vs(4),
    lineHeight: fs(17),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(SPACING.sm),
  },
  sectionTitle: {
    fontSize: fs(16),
    fontWeight: '700',
  },
  chatLink: {
    fontSize: fs(12.5),
    fontWeight: '700',
  },
  loadingBox: {
    padding: s(SPACING.xl),
    alignItems: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: vs(SPACING.lg),
  },
  emptyCardTitle: {
    fontSize: fs(14),
    fontWeight: '700',
    marginTop: vs(SPACING.xs),
  },
  emptyCardSub: {
    fontSize: fs(12),
    marginTop: vs(2),
  },
  memberCard: {
    marginBottom: vs(SPACING.sm),
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(SPACING.sm),
  },
  avatarText: {
    fontSize: fs(16),
    fontWeight: '800',
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberName: {
    fontSize: fs(14),
    fontWeight: '700',
  },
  focusPill: {
    paddingHorizontal: s(6),
    paddingVertical: vs(2),
    borderRadius: ms(RADIUS.full),
  },
  focusPillText: {
    fontSize: fs(10),
    fontWeight: '700',
  },
  activityText: {
    fontSize: fs(12.5),
    marginTop: vs(2),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    borderTopLeftRadius: ms(28),
    borderTopRightRadius: ms(28),
    padding: s(SPACING.lg),
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(SPACING.md),
  },
  modalTitle: {
    fontSize: fs(18),
    fontWeight: '700',
  },
  presetLabel: {
    fontSize: fs(13),
    fontWeight: '600',
    marginBottom: vs(SPACING.xs),
  },
  presetList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: vs(SPACING.sm),
  },
  presetPill: {
    paddingHorizontal: s(12),
    paddingVertical: vs(6),
    borderRadius: ms(RADIUS.full),
    marginRight: s(6),
    marginBottom: vs(6),
  },
  presetPillText: {
    fontSize: fs(12),
    fontWeight: '600',
  },
  customInput: {
    borderWidth: 1,
    borderRadius: ms(RADIUS.md),
    paddingHorizontal: s(SPACING.md),
    paddingVertical: vs(10),
    fontSize: fs(14),
    marginBottom: vs(SPACING.md),
  },
  modalActions: {
    flexDirection: 'row',
  },
});
