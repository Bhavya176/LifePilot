import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  Platform,
} from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { s, vs, ms, fs } from '../../utils/responsive';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  isDarkMode?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  isDarkMode = false,
  leftIcon,
  rightIcon,
  containerStyle,
  style,
  multiline = false,
  onFocus,
  onBlur,
  ...props
}) => {
  const [focused, setFocused] = useState(false);
  const theme = isDarkMode ? COLORS.dark : COLORS.light;

  const handleFocus = (e: any) => {
    setFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: any) => {
    setFocused(false);
    if (onBlur) onBlur(e);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: theme.textPrimary }]}>{label}</Text>
      )}
      <View
        style={[
          styles.inputContainer,
          multiline ? styles.multilineContainer : styles.singleLineContainer,
          {
            backgroundColor: theme.inputBg,
            borderColor: error
              ? theme.danger
              : focused
              ? theme.primary
              : theme.border,
            borderWidth: focused ? 1.5 : 1,
          },
        ]}
      >
        {leftIcon && (
          <View style={[styles.iconContainer, multiline ? { marginTop: vs(4) } : null]}>
            {leftIcon}
          </View>
        )}
        <TextInput
          multiline={multiline}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[
            styles.input,
            multiline ? styles.multilineInput : styles.singleLineInput,
            { color: theme.textPrimary },
            leftIcon ? { paddingLeft: s(SPACING.xs) } : null,
            rightIcon ? { paddingRight: s(SPACING.xs) } : null,
            style,
          ]}
          placeholderTextColor={theme.textMuted}
          textAlignVertical={multiline ? 'top' : 'center'}
          {...props}
        />
        {rightIcon && (
          <View style={[styles.iconContainer, multiline ? { marginTop: vs(4) } : null]}>
            {rightIcon}
          </View>
        )}
      </View>
      {error ? (
        <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
      ) : helperText ? (
        <Text style={[styles.helperText, { color: theme.textMuted }]}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: vs(SPACING.md),
  },
  label: {
    fontSize: fs(14),
    fontWeight: '600',
    marginBottom: vs(SPACING.xs + 2),
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    borderRadius: ms(RADIUS.md + 2),
    paddingHorizontal: s(SPACING.md),
  },
  singleLineContainer: {
    alignItems: 'center',
    height: vs(50),
    minHeight: 46,
  },
  multilineContainer: {
    alignItems: 'flex-start',
    minHeight: vs(125),
    paddingVertical: vs(SPACING.sm + 4),
  },
  singleLineInput: {
    height: '100%',
  },
  multilineInput: {
    minHeight: vs(100),
    paddingTop: Platform.OS === 'ios' ? 0 : 2,
  },
  input: {
    flex: 1,
    fontSize: fs(15),
    fontWeight: '500',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: fs(12),
    marginTop: vs(4),
    fontWeight: '500',
  },
  helperText: {
    fontSize: fs(12),
    marginTop: vs(4),
  },
});
