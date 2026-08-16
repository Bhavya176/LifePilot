import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Header } from '../../components/ui/Header';
import { useTheme } from '../../context/ThemeContext';
import { COLORS, SPACING } from '../../constants/theme';
import { resetPassword } from '../../firebase/auth';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? COLORS.dark : COLORS.light;

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async () => {
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title="Forgot Password" showBack isDarkMode={isDarkMode} />
      <View style={styles.content}>
        <Text style={[styles.heading, { color: theme.textPrimary }]}>
          Reset Password
        </Text>
        <Text style={[styles.subheading, { color: theme.textSecondary }]}>
          Enter your registered email address and we'll send you instructions to reset your password.
        </Text>

        {success ? (
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={24} color={theme.success} />
            <Text style={[styles.successText, { color: theme.success }]}>
              Password reset link sent! Check your inbox.
            </Text>
            <Button
              title="Return to Login"
              onPress={() => router.replace('/(auth)/login')}
              isDarkMode={isDarkMode}
              style={{ marginTop: SPACING.md }}
            />
          </View>
        ) : (
          <>
            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={18} color={theme.danger} />
                <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
              </View>
            ) : null}

            <Input
              label="Email Address"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              isDarkMode={isDarkMode}
              leftIcon={
                <Ionicons name="mail-outline" size={20} color={theme.textMuted} />
              }
            />

            <Button
              title="Send Reset Link"
              onPress={handleReset}
              loading={loading}
              isDarkMode={isDarkMode}
              size="lg"
              style={{ marginTop: SPACING.md }}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: SPACING.xl,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
  },
  subheading: {
    fontSize: 14,
    marginBottom: SPACING.xl,
    lineHeight: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  successContainer: {
    alignItems: 'center',
    padding: SPACING.lg,
  },
  successText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: SPACING.md,
  },
});
