import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/ui/Button';
import { Header } from '../../components/ui/Header';
import { useTheme } from '../../context/ThemeContext';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { sendVerificationEmail } from '../../firebase/auth';
import { useAuthContext } from '../../context/AuthContext';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { user } = useAuthContext();
  const theme = isDarkMode ? COLORS.dark : COLORS.light;

  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResend = async () => {
    setLoading(true);
    try {
      await sendVerificationEmail();
      setSent(true);
      Alert.alert('Email Sent', 'A verification email has been sent to your address.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send verification email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title="Verify Email" isDarkMode={isDarkMode} />
      <View style={styles.content}>
        <View style={[styles.iconWrapper, { backgroundColor: theme.primaryLight }]}>
          <Ionicons name="mail-unread-outline" size={56} color={theme.primary} />
        </View>

        <Text style={[styles.heading, { color: theme.textPrimary }]}>
          Verify Your Email
        </Text>
        <Text style={[styles.subheading, { color: theme.textSecondary }]}>
          We've sent a verification email to{' '}
          <Text style={{ fontWeight: '700', color: theme.textPrimary }}>
            {user?.email || 'your email'}
          </Text>
          . Please check your inbox and click the verification link to activate your account.
        </Text>

        <Button
          title={sent ? 'Verification Email Sent' : 'Resend Verification Email'}
          onPress={handleResend}
          loading={loading}
          variant="outline"
          isDarkMode={isDarkMode}
          style={{ width: '100%', marginBottom: SPACING.md }}
        />

        <Button
          title="Continue to LifePilot"
          onPress={() => router.replace('/(tabs)')}
          isDarkMode={isDarkMode}
          size="lg"
          style={{ width: '100%' }}
        />
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
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconWrapper: {
    width: 96,
    height: 96,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xxl,
  },
});
