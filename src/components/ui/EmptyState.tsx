import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { Button } from './Button';
import { s, vs, ms, fs } from '../../utils/responsive';

interface EmptyStateProps {
  title: string;
  description: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  actionTitle?: string;
  onAction?: () => void;
  isDarkMode?: boolean;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  iconName = 'document-text-outline',
  actionTitle,
  onAction,
  isDarkMode = false,
  style,
}) => {
  const theme = isDarkMode ? COLORS.dark : COLORS.light;

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.iconWrapper,
          {
            backgroundColor: theme.primaryLight,
            borderColor: isDarkMode ? 'rgba(99, 102, 241, 0.25)' : 'rgba(99, 102, 241, 0.15)',
          },
        ]}
      >
        <Ionicons name={iconName} size={ms(38)} color={theme.primary} />
      </View>
      <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
      <Text style={[styles.description, { color: theme.textSecondary }]}>
        {description}
      </Text>
      {actionTitle && onAction && (
        <Button
          title={actionTitle}
          onPress={onAction}
          isDarkMode={isDarkMode}
          size="md"
          style={{ marginTop: vs(SPACING.md) }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: vs(SPACING.xl),
    paddingHorizontal: s(SPACING.lg),
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    width: ms(76),
    height: ms(76),
    borderRadius: ms(RADIUS.full),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(SPACING.md),
    borderWidth: 1,
  },
  title: {
    fontSize: fs(17),
    fontWeight: '800',
    marginBottom: vs(SPACING.xs),
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  description: {
    fontSize: fs(13),
    textAlign: 'center',
    maxWidth: s(290),
    lineHeight: fs(19),
  },
});
