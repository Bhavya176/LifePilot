import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../context/ThemeContext';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? COLORS.dark : COLORS.light;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <View style={[styles.logoContainer, { backgroundColor: theme.primaryLight }]}>
          <Ionicons name="compass-outline" size={64} color={theme.primary} />
        </View>

        <Text style={[styles.title, { color: theme.textPrimary }]}>LifePilot</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Your personal daily command-center for tasks, habits, expenses, notes, and productivity goals.
        </Text>

        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle-outline" size={20} color={theme.success} />
            <Text style={[styles.featureText, { color: theme.textPrimary }]}>
              Organize daily tasks & habits with streaks
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="wallet-outline" size={20} color={theme.accent} />
            <Text style={[styles.featureText, { color: theme.textPrimary }]}>
              Track expenses & personal goals
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="shield-checkmark-outline" size={20} color={theme.info} />
            <Text style={[styles.featureText, { color: theme.textPrimary }]}>
              Secure document vault & Cloud sync
            </Text>
          </View>
        </View>

        <View style={styles.actionContainer}>
          <Button
            title="Get Started"
            onPress={() => router.push('/(auth)/register')}
            isDarkMode={isDarkMode}
            size="lg"
            style={{ marginBottom: SPACING.md }}
          />
          <Button
            title="I already have an account"
            variant="outline"
            onPress={() => router.push('/(auth)/login')}
            isDarkMode={isDarkMode}
            size="lg"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: SPACING.xs,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  featuresList: {
    width: '100%',
    marginBottom: SPACING.xxl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm + 4,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: SPACING.sm + 4,
  },
  actionContainer: {
    width: '100%',
  },
});
