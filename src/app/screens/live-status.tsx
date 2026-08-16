import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  } from 'react-native';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Header } from '../../components/ui/Header';
import { Badge } from '../../components/ui/Badge';
import { useLiveStatus } from '../../hooks/useLiveStatus';
import { LiveStatusState } from '../../firebase/realtimeDatabase';
import { s, vs, ms, fs } from '../../utils/responsive';

export default function LiveStatusScreen() {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? COLORS.dark : COLORS.light;
  const { status, lastUpdated, loading, changeStatus } = useLiveStatus();

  const statusOptions: { label: LiveStatusState; icon: string; color: string }[] = [
    { label: 'Working', icon: 'flame-outline', color: '#10B981' },
    { label: 'Break', icon: 'cafe-outline', color: '#F59E0B' },
    { label: 'Completed', icon: 'checkmark-done-circle-outline', color: '#4F46E5' },
    { label: 'Offline', icon: 'cloud-offline-outline', color: '#6B7280' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title="Live Status"
        subtitle="Broadcast your focus state to the community"
        showBack
        isDarkMode={isDarkMode}
      />

      <View style={styles.content}>
        <Card isDarkMode={isDarkMode} style={styles.currentCard}>
          <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
            Current Active Session State:
          </Text>
          {loading ? (
            <ActivityIndicator size="small" color={theme.primary} style={{ marginVertical: SPACING.sm }} />
          ) : (
            <View style={styles.badgeWrapper}>
              <Badge
                label={`🟢 Status: ${status}`}
                variant={status === 'Working' ? 'success' : status === 'Break' ? 'warning' : 'neutral'}
                isDarkMode={isDarkMode}
              />
              {lastUpdated && (
                <Text style={[styles.updatedText, { color: theme.textMuted }]}>
                  Last synced: {new Date(lastUpdated).toLocaleTimeString()}
                </Text>
              )}
            </View>
          )}
        </Card>

        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Change Status State
        </Text>

        {statusOptions.map((opt) => {
          const isSelected = status === opt.label;
          return (
            <TouchableOpacity
              key={opt.label}
              style={[
                styles.optionCard,
                {
                  backgroundColor: isSelected
                    ? isDarkMode
                      ? '#1E293B'
                      : '#EEF2FF'
                    : isDarkMode
                    ? '#151C2C'
                    : '#FFFFFF',
                  borderColor: isSelected ? theme.primary : theme.border,
                },
              ]}
              onPress={() => changeStatus(opt.label)}
            >
              <Ionicons name={opt.icon as any} size={26} color={opt.color} />
              <Text style={[styles.optionLabel, { color: theme.textPrimary }]}>
                {opt.label}
              </Text>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={22} color={theme.primary} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: s(SPACING.md),
  },
  currentCard: {
    alignItems: 'center',
    paddingVertical: vs(SPACING.lg),
    marginBottom: vs(SPACING.lg),
  },
  cardSub: {
    fontSize: fs(13),
    fontWeight: '600',
  },
  badgeWrapper: {
    marginTop: vs(SPACING.sm),
    alignItems: 'center',
  },
  updatedText: {
    fontSize: fs(11),
    marginTop: vs(6),
  },
  sectionTitle: {
    fontSize: fs(16),
    fontWeight: '700',
    marginBottom: vs(SPACING.sm),
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: s(SPACING.md),
    borderRadius: ms(RADIUS.md),
    borderWidth: 1.5,
    marginBottom: vs(SPACING.sm),
  },
  optionLabel: {
    flex: 1,
    fontSize: fs(16),
    fontWeight: '700',
    marginLeft: s(SPACING.md),
  },
});
