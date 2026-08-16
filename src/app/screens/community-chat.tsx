import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Header } from '../../components/ui/Header';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { s, vs, ms, fs } from '../../utils/responsive';
import { useCommunityChat } from '../../hooks/useCommunityChat';
import { ChatMessage } from '../../firebase/realtimeDatabase';

const EMOJI_REACTIONS = ['👍', '❤️', '🔥', '🚀', '👏'];

export default function CommunityChatScreen() {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? COLORS.dark : COLORS.light;
  const {
    messages,
    typingUsers,
    loading,
    sendMessage,
    handleTyping,
    reactToMessage,
    currentUserId,
  } = useCommunityChat();

  const [inputVal, setInputVal] = useState('');
  const [selectedMsgForReaction, setSelectedMsgForReaction] = useState<string | null>(null);
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!inputVal.trim()) return;
    const textToSend = inputVal;
    setInputVal('');
    await sendMessage(textToSend);
  };

  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    const isMe = item.userId === currentUserId;
    const timeStr = item.timestamp
      ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';

    // Reactions count map
    const reactions = item.reactions || {};
    const hasReactions = Object.keys(reactions).some((k) => (reactions[k] || []).length > 0);

    return (
      <View style={[styles.msgWrapper, isMe ? styles.msgWrapperRight : styles.msgWrapperLeft]}>
        {!isMe && (
          <View style={[styles.avatarCircle, { backgroundColor: theme.primaryLight }]}>
            <Text style={[styles.avatarText, { color: theme.primary }]}>
              {(item.userName || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <View style={styles.msgBodyCol}>
          {!isMe && (
            <Text style={[styles.senderName, { color: theme.textSecondary }]}>
              {item.userName}
            </Text>
          )}

          <TouchableOpacity
            activeOpacity={0.9}
            onLongPress={() => setSelectedMsgForReaction(selectedMsgForReaction === item.id ? null : item.id)}
            style={[
              styles.bubble,
              isMe
                ? [styles.bubbleMe, { backgroundColor: theme.primary }]
                : [styles.bubbleOther, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }],
            ]}
          >
            <Text style={[styles.msgText, { color: isMe ? '#FFFFFF' : theme.textPrimary }]}>
              {item.text}
            </Text>
            <Text
              style={[
                styles.timeText,
                { color: isMe ? 'rgba(255,255,255,0.7)' : theme.textMuted },
              ]}
            >
              {timeStr}
            </Text>
          </TouchableOpacity>

          {/* Quick Reaction Bar on Active Selection */}
          {selectedMsgForReaction === item.id && (
            <View style={[styles.reactionPickerBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
              {EMOJI_REACTIONS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => {
                    reactToMessage(item.id, emoji);
                    setSelectedMsgForReaction(null);
                  }}
                  style={styles.reactionBtn}
                >
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Displayed Active Reactions */}
          {hasReactions && (
            <View style={styles.reactionBadgesRow}>
              {Object.keys(reactions).map((emoji) => {
                const count = (reactions[emoji] || []).length;
                if (count === 0) return null;
                const hasMyReaction = currentUserId && (reactions[emoji] || []).includes(currentUserId);
                return (
                  <TouchableOpacity
                    key={emoji}
                    onPress={() => reactToMessage(item.id, emoji)}
                    style={[
                      styles.reactionPill,
                      {
                        backgroundColor: hasMyReaction
                          ? isDarkMode
                            ? '#312E81'
                            : '#EEF2FF'
                          : isDarkMode
                          ? '#0F172A'
                          : '#FFFFFF',
                        borderColor: hasMyReaction ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text style={styles.reactionPillText}>
                      {emoji} {count > 1 ? count : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title="Community Live Chat"
        subtitle="Real-time group discussion with fellow achievers"
        showBack
        isDarkMode={isDarkMode}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flexOne}
        keyboardVerticalOffset={Platform.OS === 'ios' ? vs(10) : 0}
      >
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={{ marginTop: vs(SPACING.sm), color: theme.textSecondary }}>
              Connecting to Live Chat RTDB...
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessageItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={ms(48)} color={theme.textMuted} />
                <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Messages Yet</Text>
                <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                  Say hello to everyone in the LifePilot community!
                </Text>
              </View>
            }
          />
        )}

        {/* Real-Time Typing Indicator Banner */}
        {typingUsers.length > 0 && (
          <View style={[styles.typingBanner, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
            <Text style={[styles.typingText, { color: theme.primary }]}>
              ✍️ {typingUsers.map((u) => u.userName).join(', ')}{' '}
              {typingUsers.length === 1 ? 'is typing...' : 'are typing...'}
            </Text>
          </View>
        )}

        {/* Message Input Box */}
        <View style={[styles.inputBar, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                color: theme.textPrimary,
                borderColor: theme.border,
              },
            ]}
            placeholder="Type a message..."
            placeholderTextColor={theme.textMuted}
            value={inputVal}
            onChangeText={(txt) => {
              setInputVal(txt);
              handleTyping(txt);
            }}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              { backgroundColor: inputVal.trim() ? theme.primary : theme.border },
            ]}
            disabled={!inputVal.trim()}
            onPress={handleSend}
          >
            <Ionicons name="arrow-up" size={ms(20)} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flexOne: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: s(SPACING.md),
    paddingVertical: vs(SPACING.sm),
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  msgWrapper: {
    flexDirection: 'row',
    marginVertical: vs(5),
    maxWidth: '85%',
  },
  msgWrapperLeft: {
    alignSelf: 'flex-start',
  },
  msgWrapperRight: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  avatarCircle: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(16),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(6),
  },
  avatarText: {
    fontSize: fs(12),
    fontWeight: '700',
  },
  msgBodyCol: {
    flexDirection: 'column',
  },
  senderName: {
    fontSize: fs(11),
    fontWeight: '600',
    marginBottom: vs(2),
    marginLeft: s(4),
  },
  bubble: {
    paddingHorizontal: s(12),
    paddingVertical: vs(8),
    borderRadius: ms(16),
    maxWidth: '100%',
  },
  bubbleMe: {
    borderBottomRightRadius: ms(4),
  },
  bubbleOther: {
    borderBottomLeftRadius: ms(4),
  },
  msgText: {
    fontSize: fs(14),
    lineHeight: fs(19),
  },
  timeText: {
    fontSize: fs(9.5),
    marginTop: vs(3),
    alignSelf: 'flex-end',
  },
  reactionPickerBar: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: ms(20),
    paddingHorizontal: s(6),
    paddingVertical: vs(3),
    marginTop: vs(4),
    alignSelf: 'flex-start',
  },
  reactionBtn: {
    paddingHorizontal: s(4),
    paddingVertical: vs(2),
  },
  reactionEmoji: {
    fontSize: fs(16),
  },
  reactionBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: vs(3),
  },
  reactionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(6),
    paddingVertical: vs(2),
    borderRadius: ms(RADIUS.full),
    borderWidth: 1,
    marginRight: s(4),
    marginTop: vs(2),
  },
  reactionPillText: {
    fontSize: fs(11),
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: vs(80),
  },
  emptyTitle: {
    fontSize: fs(16),
    fontWeight: '700',
    marginTop: vs(SPACING.md),
  },
  emptySub: {
    fontSize: fs(12.5),
    textAlign: 'center',
    marginTop: vs(4),
  },
  typingBanner: {
    paddingHorizontal: s(SPACING.md),
    paddingVertical: vs(4),
    borderTopWidth: 0,
  },
  typingText: {
    fontSize: fs(11.5),
    fontStyle: 'italic',
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(SPACING.md),
    paddingVertical: vs(SPACING.sm),
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    borderRadius: ms(RADIUS.full),
    borderWidth: 1,
    paddingHorizontal: s(SPACING.md),
    paddingVertical: vs(8),
    fontSize: fs(14),
    maxHeight: vs(90),
  },
  sendBtn: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(19),
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: s(SPACING.xs),
  },
});
