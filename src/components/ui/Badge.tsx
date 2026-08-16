import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { s, vs, ms, fs } from '../../utils/responsive';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  isDarkMode?: boolean;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  isDarkMode = false,
  style,
}) => {
  const theme = isDarkMode ? COLORS.dark : COLORS.light;

  const getColors = () => {
    switch (variant) {
      case 'success':
        return {
          bg: isDarkMode ? 'rgba(16, 185, 129, 0.18)' : '#D1FAE5',
          text: isDarkMode ? '#34D399' : '#065F46',
          border: isDarkMode ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0',
        };
      case 'warning':
        return {
          bg: isDarkMode ? 'rgba(245, 158, 11, 0.18)' : '#FEF3C7',
          text: isDarkMode ? '#FBBF24' : '#92400E',
          border: isDarkMode ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A',
        };
      case 'danger':
        return {
          bg: isDarkMode ? 'rgba(239, 68, 68, 0.18)' : '#FEE2E2',
          text: isDarkMode ? '#F87171' : '#991B1B',
          border: isDarkMode ? 'rgba(239, 68, 68, 0.3)' : '#FECACA',
        };
      case 'info':
        return {
          bg: isDarkMode ? 'rgba(59, 130, 246, 0.18)' : '#DBEAFE',
          text: isDarkMode ? '#60A5FA' : '#1E40AF',
          border: isDarkMode ? 'rgba(59, 130, 246, 0.3)' : '#BFDBFE',
        };
      case 'neutral':
        return {
          bg: isDarkMode ? '#1E293B' : '#F1F5F9',
          text: isDarkMode ? '#94A3B8' : '#475569',
          border: isDarkMode ? '#334155' : '#E2E8F0',
        };
      case 'primary':
      default:
        return {
          bg: isDarkMode ? 'rgba(99, 102, 241, 0.18)' : '#EEF2FF',
          text: isDarkMode ? '#818CF8' : '#3730A3',
          border: isDarkMode ? 'rgba(99, 102, 241, 0.3)' : '#C7D2FE',
        };
    }
  };

  const { bg, text, border } = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: border }, style]}>
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: s(SPACING.sm + 2),
    paddingVertical: vs(3),
    borderRadius: ms(RADIUS.full),
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  text: {
    fontSize: fs(11),
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'capitalize',
  },
});
