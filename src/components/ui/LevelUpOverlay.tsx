import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Animated, TouchableOpacity } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { s, vs, ms, fs } from '../../utils/responsive';
import { UserLevel } from '../../types/gamification';

interface LevelUpOverlayProps {
  visible: boolean;
  level: UserLevel;
  onDismiss: () => void;
  isDarkMode?: boolean;
}

export const LevelUpOverlay: React.FC<LevelUpOverlayProps> = ({
  visible,
  level,
  onDismiss,
  isDarkMode = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.5);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const theme = isDarkMode ? COLORS.dark : COLORS.light;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: theme.card,
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <Text style={styles.confetti}>🎉🎊✨</Text>
          <Text style={styles.bigEmoji}>{level.emoji}</Text>
          <Text style={[styles.title, { color: theme.textPrimary }]}>LEVEL UP!</Text>
          <Text style={[styles.levelText, { color: theme.primary }]}>
            Level {level.level} — {level.title}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            You're making incredible progress! Keep up the momentum and unlock new achievements.
          </Text>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: theme.primary }]}
            onPress={onDismiss}
            activeOpacity={0.8}
          >
            <Text style={styles.btnText}>Continue 🚀</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: s(SPACING.xl),
  },
  card: {
    width: '100%',
    borderRadius: ms(RADIUS.xl),
    padding: s(SPACING.xl),
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  confetti: {
    fontSize: fs(28),
    marginBottom: vs(4),
  },
  bigEmoji: {
    fontSize: fs(56),
    marginBottom: vs(SPACING.sm),
  },
  title: {
    fontSize: fs(28),
    fontWeight: '900',
    letterSpacing: 2,
  },
  levelText: {
    fontSize: fs(17),
    fontWeight: '700',
    marginTop: vs(4),
  },
  subtitle: {
    fontSize: fs(13),
    textAlign: 'center',
    lineHeight: fs(18),
    marginTop: vs(SPACING.sm),
    marginBottom: vs(SPACING.lg),
  },
  btn: {
    paddingVertical: vs(SPACING.sm + 2),
    paddingHorizontal: s(SPACING.xl),
    borderRadius: ms(RADIUS.full),
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: fs(15),
    fontWeight: '700',
  },
});
