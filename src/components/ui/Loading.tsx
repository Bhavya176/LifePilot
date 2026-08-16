import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';

interface LoadingProps {
  message?: string;
  isDarkMode?: boolean;
  fullScreen?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
  message = 'Loading...',
  isDarkMode = false,
  fullScreen = false,
}) => {
  const theme = isDarkMode ? COLORS.dark : COLORS.light;

  return (
    <View
      style={[
        styles.container,
        fullScreen && [styles.fullScreen, { backgroundColor: theme.background }],
      ]}
    >
      <ActivityIndicator size="large" color={theme.primary} />
      {message ? (
        <Text style={[styles.message, { color: theme.textSecondary }]}>
          {message}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreen: {
    flex: 1,
    ...StyleSheet.absoluteFill,
    zIndex: 999,
  },
  message: {
    marginTop: SPACING.md,
    fontSize: 14,
    fontWeight: '500',
  },
});
