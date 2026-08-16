import React from 'react';
import { View, StyleSheet, ViewProps, StyleProp, ViewStyle } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { s, vs, ms } from '../../utils/responsive';

interface CardProps extends ViewProps {
  isDarkMode?: boolean;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  isDarkMode = false,
  style,
  children,
  ...props
}) => {
  const theme = isDarkMode ? COLORS.dark : COLORS.light;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: isDarkMode ? '#2A364F' : '#E8EEF5',
          shadowColor: isDarkMode ? '#000000' : '#475569',
          shadowOpacity: isDarkMode ? 0.25 : 0.05,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: ms(RADIUS.lg + 2),
    padding: s(SPACING.md),
    borderWidth: 1,
    marginVertical: vs(SPACING.xs),
    shadowOffset: { width: 0, height: vs(2) },
    shadowRadius: ms(8),
    elevation: 2,
  },
});
