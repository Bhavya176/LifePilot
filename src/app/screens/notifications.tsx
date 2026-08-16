import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  } from 'react-native';
import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Header } from '../../components/ui/Header';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { useNotifications } from '../../hooks/useNotifications';
import {
  scheduleMorningBriefing,
  scheduleNightRecap,
  triggerGoalMilestoneAlert,
} from '../../firebase/messaging';
import { s, vs, ms, fs } from '../../utils/responsive';

export default function NotificationsScreen() {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? COLORS.dark : COLORS.light;
  const { notifications, loading, fcmToken, markRead, removeNotif, triggerTestReminder } = useNotifications();

  const [prefs, setPrefs] = useState({
    taskReminders: true,
    habitReminders: true,
    goalReminders: true,
    dailySummary: true,
    morningBriefing: true,
    nightRecap: true,
    documentReminders: false,
    weeklySummary: true,
  });

  const togglePref = (key: keyof typeof prefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSendTestNotification = async () => {
    try {
      await triggerTestReminder(
        '🔔 Task Reminder: Finish Review',
        'Don\'t forget to complete your high-priority daily task in LifePilot.',
        'task'
      );
      Alert.alert('Push Notification Scheduled', 'A local push notification will fire in 3 seconds!');
    } catch (err: any) {
      Alert.alert('Notification Error', err.message);
    }
  };

  const handleMorningBriefingTest = async () => {
    try {
      await scheduleMorningBriefing(4, 2);
      Alert.alert('Morning Briefing Scheduled', 'Morning briefing notification will fire in 2 seconds!');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleNightRecapTest = async () => {
    try {
      await scheduleNightRecap(3, 500, 2);
      Alert.alert('Night Recap Scheduled', 'Evening recap notification will fire in 2 seconds!');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleMilestoneTest = async () => {
    try {
      await triggerGoalMilestoneAlert('Master React Native & Firebase', 100);
      Alert.alert('Goal Milestone Triggered', 'Celebration notification dispatched!');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title="Notification Center"
        subtitle="Reminders, alerts & preferences"
        showBack
        isDarkMode={isDarkMode}
        rightAction={
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: theme.primary }]}
            onPress={handleSendTestNotification}
          >
            <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Push Notification Service Status Indicator */}
        <Card isDarkMode={isDarkMode} style={styles.tokenCard}>
          <View style={styles.tokenRow}>
            <Ionicons name="notifications-circle" size={24} color={theme.primary} />
            <View style={{ flex: 1, marginLeft: SPACING.sm }}>
              <Text style={[styles.tokenTitle, { color: theme.textPrimary }]}>
                Push Notification Service
              </Text>
              <Text style={[styles.tokenSub, { color: theme.textSecondary }]}>
                Connected & Ready • Instant task & habit reminders
              </Text>
            </View>
            <Badge label="Active" variant="success" isDarkMode={isDarkMode} />
          </View>
        </Card>

        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Recent Alerts</Text>
          <Button
            title="Test Trigger"
            size="sm"
            variant="outline"
            onPress={handleSendTestNotification}
            isDarkMode={isDarkMode}
          />
        </View>

        {loading ? (
          <View style={{ padding: SPACING.xl, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={{ marginTop: SPACING.md, color: theme.textSecondary }}>
              Loading notification history...
            </Text>
          </View>
        ) : notifications.length === 0 ? (
          <EmptyState
            title="No Notifications Yet"
            description="You don't have any recent alerts. Tap Test Trigger to test local push reminders."
            actionTitle="Send Test Reminder"
            onAction={handleSendTestNotification}
            isDarkMode={isDarkMode}
            iconName="notifications-off-outline"
          />
        ) : (
          notifications.map((notif) => (
            <Card key={notif.id} isDarkMode={isDarkMode} style={styles.notifCard}>
              <View style={styles.notifRow}>
                <View style={[styles.iconWrapper, { backgroundColor: theme.primaryLight }]}>
                  <Ionicons name="notifications" size={20} color={theme.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                  <Text style={[styles.notifTitle, { color: theme.textPrimary }]}>
                    {notif.title}
                  </Text>
                  <Text style={[styles.notifBody, { color: theme.textSecondary }]}>
                    {notif.body}
                  </Text>
                  <Text style={[styles.notifTime, { color: theme.textMuted }]}>
                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <TouchableOpacity style={{ padding: 4 }} onPress={() => removeNotif(notif.id)}>
                  <Ionicons name="trash-outline" size={18} color={theme.danger} />
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}

        {/* Category Notification Preferences */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginTop: SPACING.lg }]}>
          Notification Categories
        </Text>

        <Card isDarkMode={isDarkMode}>
          <View style={styles.prefRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.prefTitle, { color: theme.textPrimary }]}>Task Reminders</Text>
              <Text style={[styles.prefSub, { color: theme.textSecondary }]}>
                Get notified before tasks are due
              </Text>
            </View>
            <Switch
              value={prefs.taskReminders}
              onValueChange={() => togglePref('taskReminders')}
              trackColor={{ false: '#94A3B8', true: theme.primary }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.prefRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.prefTitle, { color: theme.textPrimary }]}>Habit Reminders</Text>
              <Text style={[styles.prefSub, { color: theme.textSecondary }]}>
                Daily prompts for habit completion
              </Text>
            </View>
            <Switch
              value={prefs.habitReminders}
              onValueChange={() => togglePref('habitReminders')}
              trackColor={{ false: '#94A3B8', true: theme.primary }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.prefRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.prefTitle, { color: theme.textPrimary }]}>
                Daily Morning Summary
              </Text>
              <Text style={[styles.prefSub, { color: theme.textSecondary }]}>
                Morning briefing on goals & schedule
              </Text>
            </View>
            <Switch
              value={prefs.dailySummary}
              onValueChange={() => togglePref('dailySummary')}
              trackColor={{ false: '#94A3B8', true: theme.primary }}
            />
          </View>
        </Card>

        {/* Smart Daily Briefings & Milestone Alerts */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginTop: vs(SPACING.lg) }]}>
          Smart Daily Briefings & Milestones
        </Text>
        <Card isDarkMode={isDarkMode}>
          <View style={styles.prefRow}>
            <View style={{ flex: 1, marginRight: s(SPACING.sm) }}>
              <Text style={[styles.prefTitle, { color: theme.textPrimary }]}>🌅 8:00 AM Morning Briefing</Text>
              <Text style={[styles.prefSub, { color: theme.textSecondary }]}>
                Daily morning recap of pending tasks and daily plan
              </Text>
            </View>
            <Button
              title="Preview 🔔"
              size="sm"
              variant="outline"
              onPress={handleMorningBriefingTest}
              isDarkMode={isDarkMode}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.prefRow}>
            <View style={{ flex: 1, marginRight: s(SPACING.sm) }}>
              <Text style={[styles.prefTitle, { color: theme.textPrimary }]}>🌙 9:00 PM Night Recap</Text>
              <Text style={[styles.prefSub, { color: theme.textSecondary }]}>
                Evening achievements, habits completed and spending summary
              </Text>
            </View>
            <Button
              title="Preview 🔔"
              size="sm"
              variant="outline"
              onPress={handleNightRecapTest}
              isDarkMode={isDarkMode}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.prefRow}>
            <View style={{ flex: 1, marginRight: s(SPACING.sm) }}>
              <Text style={[styles.prefTitle, { color: theme.textPrimary }]}>🎯 Goal Milestone Alert</Text>
              <Text style={[styles.prefSub, { color: theme.textSecondary }]}>
                Instant push alerts when a goal hits 50% or 100%
              </Text>
            </View>
            <Button
              title="Preview 🔔"
              size="sm"
              variant="outline"
              onPress={handleMilestoneTest}
              isDarkMode={isDarkMode}
            />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  tokenCard: {
    marginBottom: SPACING.md,
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenTitle: {
    fontSize: fs(14),
    fontWeight: '700',
  },
  tokenSub: {
    fontSize: fs(12),
    marginTop: vs(2),
    fontFamily: 'monospace',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(SPACING.sm),
  },
  sectionTitle: {
    fontSize: fs(18),
    fontWeight: '700',
  },
  notifCard: {
    marginBottom: vs(SPACING.sm),
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconWrapper: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(RADIUS.full),
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifTitle: {
    fontSize: fs(15),
    fontWeight: '700',
  },
  notifBody: {
    fontSize: fs(13),
    marginTop: vs(2),
  },
  notifTime: {
    fontSize: fs(11),
    marginTop: vs(4),
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: vs(SPACING.xs),
  },
  prefTitle: {
    fontSize: fs(15),
    fontWeight: '600',
  },
  prefSub: {
    fontSize: fs(12),
    marginTop: vs(2),
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: vs(SPACING.xs),
  },
});
