import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { COLORS, SPACING } from '../../constants/theme';
import { Header } from '../../components/ui/Header';
import { Card } from '../../components/ui/Card';

export default function PrivacyScreen() {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? COLORS.dark : COLORS.light;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title="Privacy Policy" showBack isDarkMode={isDarkMode} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card isDarkMode={isDarkMode} style={styles.card}>
          <View style={styles.headingRow}>
            <Ionicons name="shield-checkmark" size={24} color={theme.success} />
            <Text style={[styles.heading, { color: theme.textPrimary }]}>
              Data Security & Privacy
            </Text>
          </View>
          <Text style={[styles.text, { color: theme.textSecondary }]}>
            LifePilot respects your personal data. All user data, documents, tasks, habits, and notes are stored strictly under your private Firestore collection path (`users/{'{uid}'}/*`) and Firebase Storage path (`users/{'{uid}'}/*`).
          </Text>
          <Text style={[styles.text, { color: theme.textSecondary, marginTop: SPACING.md }]}>
            Firebase Security Rules enforce that no other user can read, modify, or list your records or uploaded files.
          </Text>
          <Text style={[styles.text, { color: theme.textSecondary, marginTop: SPACING.md }]}>
            Warning: Please do not store unencrypted passwords or social security numbers directly in document files.
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
  card: {
    padding: SPACING.lg,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: SPACING.sm,
  },
  text: {
    fontSize: 14,
    lineHeight: 22,
  },
});
