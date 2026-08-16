import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { s, vs, ms, fs } from '../../utils/responsive';

interface DynamicAnnouncementBannerProps {
  enabled: boolean;
  text: string;
  type?: 'info' | 'warning' | 'celebration' | 'maintenance';
  actionTitle?: string;
  onAction?: () => void;
  isDarkMode?: boolean;
}

export const DynamicAnnouncementBanner: React.FC<DynamicAnnouncementBannerProps> = ({
  enabled,
  text,
  type = 'celebration',
  actionTitle = 'Explore',
  onAction,
  isDarkMode = false,
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (!enabled || dismissed || !text) {
    return null;
  }

  // Type styling
  let bgColor = '#4F46E5';
  let iconName: any = 'sparkles';
  let badgeLabel = 'ANNOUNCEMENT';

  if (type === 'warning') {
    bgColor = '#D97706';
    iconName = 'warning-outline';
    badgeLabel = 'NOTICE';
  } else if (type === 'maintenance') {
    bgColor = '#DC2626';
    iconName = 'construct-outline';
    badgeLabel = 'MAINTENANCE';
  } else if (type === 'info') {
    bgColor = '#2563EB';
    iconName = 'information-circle-outline';
    badgeLabel = 'UPDATE';
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.contentRow}>
        <View style={styles.iconWrapper}>
          <Ionicons name={iconName} size={ms(20)} color="#FFFFFF" />
        </View>

        <View style={styles.textCol}>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badgeLabel}</Text>
            </View>
          </View>
          <Text style={styles.messageText} numberOfLines={3}>
            {text}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setDismissed(true)}
          style={styles.closeBtn}
          activeOpacity={0.8}
        >
          <Ionicons name="close" size={ms(18)} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: ms(RADIUS.md),
    paddingHorizontal: s(SPACING.md),
    paddingVertical: vs(SPACING.sm + 2),
    marginBottom: vs(SPACING.md),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconWrapper: {
    marginRight: s(SPACING.sm),
    marginTop: vs(2),
  },
  textCol: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vs(2),
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: s(6),
    paddingVertical: vs(1.5),
    borderRadius: ms(4),
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: fs(9),
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: fs(12.5),
    lineHeight: fs(17),
    fontWeight: '600',
  },
  closeBtn: {
    padding: s(4),
    marginLeft: s(6),
  },
});
