import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { Header } from '../../components/ui/Header';
import { Card } from '../../components/ui/Card';

export default function AboutScreen() {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? COLORS.dark : COLORS.light;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title="About LifePilot" showBack isDarkMode={isDarkMode} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.centerBox}>
          <View style={[styles.logoWrapper, { backgroundColor: theme.primaryLight }]}>
            <Ionicons name="compass-outline" size={54} color={theme.primary} />
          </View>
          <Text style={[styles.appName, { color: theme.textPrimary }]}>LifePilot</Text>
          <Text style={[styles.appVersion, { color: theme.textSecondary }]}>
            Version 1.0.0 (Expo SDK 57)
          </Text>
        </View>

        <Card isDarkMode={isDarkMode} style={styles.card}>
          <Text style={[styles.cardHeading, { color: theme.textPrimary }]}>
            Your Daily Command Center
          </Text>
          <Text style={[styles.cardText, { color: theme.textSecondary }]}>
            LifePilot is designed to give you clarity, focus, and control over daily tasks, habit streaks, personal notes, expenses, and document vaults in a unified mobile application.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  centerBox: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  logoWrapper: {
    width: 88,
    height: 88,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
  },
  appVersion: {
    fontSize: 13,
    marginTop: 4,
  },
  card: {
    padding: SPACING.lg,
  },
  cardHeading: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 22,
  },
});
