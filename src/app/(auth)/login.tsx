import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  } from 'react-native';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Header } from '../../components/ui/Header';
import { useTheme } from '../../context/ThemeContext';
import { COLORS, SPACING } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { s, vs, ms, fs } from '../../utils/responsive';

export default function LoginScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { signIn } = useAuth();
  const theme = isDarkMode ? COLORS.dark : COLORS.light;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title="Login" showBack isDarkMode={isDarkMode} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.heading, { color: theme.textPrimary }]}>
            Welcome Back!
          </Text>
          <Text style={[styles.subheading, { color: theme.textSecondary }]}>
            Sign in to continue to LifePilot.
          </Text>

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

          <Input
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            isDarkMode={isDarkMode}
            leftIcon={
              <Ionicons name="lock-closed-outline" size={20} color={theme.textMuted} />
            }
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={theme.textMuted}
                />
              </TouchableOpacity>
            }
          />

          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => router.push('/(auth)/forgot-password')}
          >
            <Text style={[styles.forgotText, { color: theme.primary }]}>
              Forgot Password?
            </Text>
          </TouchableOpacity>

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            isDarkMode={isDarkMode}
            size="lg"
            style={{ marginTop: SPACING.md }}
          />

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={[styles.linkText, { color: theme.primary }]}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: s(SPACING.xl),
  },
  heading: {
    fontSize: fs(26),
    fontWeight: '800',
    marginBottom: vs(4),
  },
  subheading: {
    fontSize: fs(14),
    marginBottom: vs(SPACING.xl),
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: s(SPACING.md),
    borderRadius: ms(8),
    marginBottom: vs(SPACING.md),
  },
  errorText: {
    fontSize: fs(13),
    marginLeft: s(8),
    flex: 1,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: vs(SPACING.lg),
  },
  forgotText: {
    fontSize: fs(14),
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: vs(SPACING.xl),
  },
  footerText: {
    fontSize: fs(14),
  },
  linkText: {
    fontSize: fs(14),
    fontWeight: '700',
  },
});
