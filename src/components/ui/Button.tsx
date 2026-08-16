import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { s, vs, ms, fs } from '../../utils/responsive';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  isDarkMode?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  isDarkMode = false,
  icon,
  style,
  textStyle,
  disabled,
  ...props
}) => {
  const theme = isDarkMode ? COLORS.dark : COLORS.light;

  const getContainerStyle = (): ViewStyle => {
    let base: ViewStyle = {
      borderRadius: ms(RADIUS.md + 2),
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    };

    // Size
    if (size === 'sm') {
      base.paddingVertical = vs(SPACING.xs + 3);
      base.paddingHorizontal = s(SPACING.md);
      base.minHeight = vs(36);
    } else if (size === 'lg') {
      base.paddingVertical = vs(SPACING.md);
      base.paddingHorizontal = s(SPACING.xl);
      base.minHeight = vs(52);
    } else {
      base.paddingVertical = vs(SPACING.sm + 4);
      base.paddingHorizontal = s(SPACING.lg);
      base.minHeight = vs(44);
    }

    // Variant
    switch (variant) {
      case 'secondary':
        base.backgroundColor = isDarkMode ? '#1E293B' : '#E2E8F0';
        break;
      case 'outline':
        base.backgroundColor = 'transparent';
        base.borderWidth = 1.5;
        base.borderColor = theme.primary;
        break;
      case 'danger':
        base.backgroundColor = theme.danger;
        break;
      case 'success':
        base.backgroundColor = theme.success;
        break;
      case 'ghost':
        base.backgroundColor = 'transparent';
        break;
      case 'primary':
      default:
        base.backgroundColor = theme.primary;
        if (!isDarkMode) {
          base.shadowColor = theme.primary;
          base.shadowOffset = { width: 0, height: vs(3) };
          base.shadowOpacity = 0.25;
          base.shadowRadius = ms(6);
          base.elevation = 4;
        }
        break;
    }

    if (disabled || loading) {
      base.opacity = 0.6;
    }

    return base;
  };

  const getTextStyle = (): TextStyle => {
    let base: TextStyle = {
      fontWeight: '700',
      fontSize: size === 'sm' ? fs(13) : size === 'lg' ? fs(17) : fs(15),
      letterSpacing: 0.2,
    };

    switch (variant) {
      case 'secondary':
        base.color = theme.textPrimary;
        break;
      case 'outline':
        base.color = theme.primary;
        break;
      case 'danger':
        base.color = '#FFFFFF';
        break;
      case 'success':
        base.color = '#FFFFFF';
        break;
      case 'ghost':
        base.color = theme.primary;
        break;
      case 'primary':
      default:
        base.color = '#FFFFFF';
        break;
    }

    return base;
  };

  return (
    <TouchableOpacity
      style={[getContainerStyle(), style]}
      disabled={disabled || loading}
      activeOpacity={0.75}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? theme.primary : '#FFFFFF'}
        />
      ) : (
        <>
          {icon && <View style={{ marginRight: s(6) }}>{icon}</View>}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};
