import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, RADIUS } from '../../constants/theme';
import { vs, ms } from '../../utils/responsive';

interface ProgressBarProps {
  progress: number; // 0 to 1
  color?: string;
  height?: number;
  isDarkMode?: boolean;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color,
  height = 8,
  isDarkMode = false,
  style,
}) => {
  const theme = isDarkMode ? COLORS.dark : COLORS.light;
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const responsiveHeight = vs(height);

  return (
    <View
      style={[
        styles.track,
        {
          height: responsiveHeight,
          backgroundColor: isDarkMode ? '#1E293B' : '#E2E8F0',
          borderRadius: ms(RADIUS.full),
        },
        style,
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${clampedProgress * 100}%`,
            height: responsiveHeight,
            backgroundColor: color || theme.primary,
            borderRadius: ms(RADIUS.full),
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {},
});
