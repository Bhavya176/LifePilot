import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './Card';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { s, vs, ms, fs } from '../../utils/responsive';

interface DynamicDailyQuoteCardProps {
  enabled: boolean;
  text: string;
  author: string;
  onRefresh?: () => Promise<void>;
  isDarkMode?: boolean;
}

export const DynamicDailyQuoteCard: React.FC<DynamicDailyQuoteCardProps> = ({
  enabled,
  text,
  author,
  onRefresh,
  isDarkMode = false,
}) => {
  const theme = isDarkMode ? COLORS.dark : COLORS.light;
  const [refreshing, setRefreshing] = useState(false);

  if (!enabled || !text) {
    return null;
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: `"${text}" — ${author}\n\nShared via LifePilot App`,
      });
    } catch {
      // Ignored
    }
  };

  const handleRefresh = async () => {
    if (!onRefresh || refreshing) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Card isDarkMode={isDarkMode} style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Ionicons name="sparkles" size={ms(16)} color={theme.accent} />
          <Text style={[styles.cardTitle, { color: theme.accent }]}>
            DAILY MOTIVATION
          </Text>
          <View style={[styles.pill, { backgroundColor: isDarkMode ? '#312E81' : '#EEF2FF' }]}>
            <Text style={[styles.pillText, { color: theme.primary }]}>Inspiration</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          {onRefresh && (
            <TouchableOpacity
              onPress={handleRefresh}
              style={styles.iconBtn}
              activeOpacity={0.7}
              disabled={refreshing}
            >
              {refreshing ? (
                <ActivityIndicator size="small" color={theme.textSecondary} />
              ) : (
                <Ionicons name="sync-outline" size={ms(18)} color={theme.textSecondary} />
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleShare} style={styles.iconBtn} activeOpacity={0.7}>
            <Ionicons name="share-outline" size={ms(18)} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.quoteBody}>
        <Text style={[styles.quoteSymbol, { color: theme.primaryLight }]}>“</Text>
        <Text style={[styles.quoteText, { color: theme.textPrimary }]}>{text}</Text>
      </View>

      <View style={styles.authorRow}>
        <Text style={[styles.authorText, { color: theme.textSecondary }]}>
          — <Text style={{ fontWeight: '700', color: theme.primary }}>{author}</Text>
        </Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: s(SPACING.md),
    marginBottom: vs(SPACING.md),
    borderLeftWidth: 3,
    borderLeftColor: '#6366F1',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(SPACING.xs),
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: fs(11),
    fontWeight: '800',
    letterSpacing: 0.5,
    marginLeft: s(4),
  },
  pill: {
    paddingHorizontal: s(6),
    paddingVertical: vs(1.5),
    borderRadius: ms(RADIUS.full),
    marginLeft: s(6),
  },
  pillText: {
    fontSize: fs(9.5),
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    padding: s(4),
    marginLeft: s(6),
  },
  quoteBody: {
    marginTop: vs(2),
    position: 'relative',
  },
  quoteSymbol: {
    fontSize: fs(32),
    position: 'absolute',
    left: -s(8),
    top: -vs(12),
    opacity: 0.6,
  },
  quoteText: {
    fontSize: fs(13.5),
    lineHeight: fs(19),
    fontStyle: 'italic',
    fontWeight: '500',
  },
  authorRow: {
    marginTop: vs(SPACING.xs + 2),
    alignSelf: 'flex-end',
  },
  authorText: {
    fontSize: fs(12),
  },
});
