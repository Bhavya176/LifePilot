import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { s, vs, ms, fs } from '../../utils/responsive';
import { HapticsService } from '../../services/hapticsService';

interface CelebrationModalProps {
  visible: boolean;
  title: string;
  message: string;
  badgeEmoji?: string;
  onDismiss: () => void;
  isDarkMode?: boolean;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  visible,
  title,
  message,
  badgeEmoji = '🎉',
  onDismiss,
  isDarkMode = false,
}) => {
  const [scaleAnim] = useState(() => new Animated.Value(0.4));
  const [opacityAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      HapticsService.success().catch(() => {});
      scaleAnim.setValue(0.4);
      opacityAnim.setValue(0);

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleAnim, opacityAnim]);

  if (!visible) return null;

  const theme = isDarkMode ? COLORS.dark : COLORS.light;

  const handleClose = async () => {
    await HapticsService.light();
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: isDarkMode ? '#1E1B38' : '#FFFFFF',
              borderColor: isDarkMode ? '#3730A3' : '#E2E8F0',
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Top Emoji Badge Circle with Glow */}
          <View
            style={[
              styles.emojiCircle,
              { backgroundColor: isDarkMode ? '#2E2856' : '#EEF2FF' },
            ]}
          >
            <Text style={styles.emojiText}>{badgeEmoji}</Text>
          </View>

          {/* Celebration Tag */}
          <View style={[styles.tagPill, { backgroundColor: isDarkMode ? '#312E81' : '#E0E7FF' }]}>
            <Text style={styles.tagText}>GOAL MILESTONE UNLOCKED</Text>
          </View>

          {/* Title */}
          <Text style={[styles.titleText, { color: theme.textPrimary }]}>
            {title}
          </Text>

          {/* Message */}
          <Text style={[styles.messageText, { color: theme.textSecondary }]}>
            {message}
          </Text>

          {/* Action Button */}
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.primary }]}
            onPress={handleClose}
            activeOpacity={0.85}
          >
            <Text style={styles.actionBtnText}>Keep Crushing It 🚀</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: s(SPACING.lg),
  },
  card: {
    width: '100%',
    maxWidth: s(340),
    borderRadius: ms(RADIUS.xl),
    paddingVertical: vs(SPACING.xl),
    paddingHorizontal: s(SPACING.lg),
    alignItems: 'center',
    borderWidth: 1.5,
    ...Platform.select({
      ios: {
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  emojiCircle: {
    width: ms(88),
    height: ms(88),
    borderRadius: ms(44),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(SPACING.md),
  },
  emojiText: {
    fontSize: fs(44),
  },
  tagPill: {
    paddingHorizontal: s(12),
    paddingVertical: vs(4),
    borderRadius: ms(RADIUS.full),
    marginBottom: vs(SPACING.xs + 2),
  },
  tagText: {
    color: '#6366F1',
    fontSize: fs(10.5),
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  titleText: {
    fontSize: fs(22),
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: vs(SPACING.xs),
  },
  messageText: {
    fontSize: fs(13.5),
    textAlign: 'center',
    lineHeight: fs(20),
    marginBottom: vs(SPACING.lg),
  },
  actionBtn: {
    width: '100%',
    paddingVertical: vs(14),
    borderRadius: ms(RADIUS.lg),
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: fs(15),
    fontWeight: '800',
  },
});
