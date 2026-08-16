import { useState, useEffect, useRef } from 'react';
import { useAuthContext } from '../context/AuthContext';
import {
  ChatMessage,
  sendChatMessage,
  subscribeChatMessages,
  setUserTyping,
  subscribeTypingUsers,
  toggleMessageReaction,
} from '../firebase/realtimeDatabase';

export function useCommunityChat() {
  const { user } = useAuthContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<{ userId: string; userName: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const typingTimeoutRef = useRef<any>(null);

  useEffect(() => {
    setLoading(true);
    const unsubMessages = subscribeChatMessages((msgs) => {
      setMessages(msgs);
      setLoading(false);
    });

    const unsubTyping = user
      ? subscribeTypingUsers(user.uid, (typings) => {
          setTypingUsers(typings);
        })
      : () => {};

    return () => {
      unsubMessages();
      unsubTyping();
      if (user) {
        setUserTyping(user.uid, user.name || '', false).catch(() => {});
      }
    };
  }, [user?.uid]);

  const sendMessage = async (text: string) => {
    if (!user || !text.trim()) return;
    await sendChatMessage(user.uid, user.name || 'Member', text.trim(), user.email);
    // Clear typing
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    await setUserTyping(user.uid, user.name || '', false);
  };

  const handleTyping = (text: string) => {
    if (!user) return;
    if (text.length > 0) {
      setUserTyping(user.uid, user.name || 'Member', true).catch(() => {});
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setUserTyping(user.uid, user.name || '', false).catch(() => {});
      }, 3000);
    } else {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setUserTyping(user.uid, user.name || '', false).catch(() => {});
    }
  };

  const reactToMessage = async (messageId: string, emoji: string) => {
    if (!user) return;
    await toggleMessageReaction(messageId, emoji, user.uid);
  };

  return {
    messages,
    typingUsers,
    loading,
    sendMessage,
    handleTyping,
    reactToMessage,
    currentUserId: user?.uid,
  };
}
