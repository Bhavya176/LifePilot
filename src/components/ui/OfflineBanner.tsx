import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetwork } from '../../context/NetworkContext';
import { useTheme } from '../../context/ThemeContext';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { s, vs, ms, fs } from '../../utils/responsive';

export const OfflineBanner: React.FC = () => {
  const { isOnline, isOfflineModeManual, toggleOfflineMode } = useNetwork();
  const { isDarkMode } = useTheme();

  if (isOnline && !isOfflineModeManual) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#78350F' : '#FEF3C7', borderColor: '#F59E0B' }]}>
      <View style={styles.contentRow}>
        <Ionicons name="cloud-offline-outline" size={ms(18)} color={isDarkMode ? '#FDE68A' : '#D97706'} />
        <View style={styles.textWrapper}>
          <Text style={[styles.title, { color: isDarkMode ? '#FEF3C7' : '#92400E' }]}>
            Offline Mode Active
          </Text>
          <Text style={[styles.subtitle, { color: isDarkMode ? '#FDE68A' : '#B45309' }]}>
            All edits (tasks, notes, habits) are saved locally and auto-sync when reconnected.
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: isDarkMode ? '#F59E0B' : '#D97706' }]}
          onPress={toggleOfflineMode}
        >
          <Text style={styles.btnText}>Go Online</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: s(SPACING.md),
    paddingVertical: vs(SPACING.xs + 2),
    borderBottomWidth: 1,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textWrapper: {
    flex: 1,
    marginLeft: s(SPACING.xs + 4),
    marginRight: s(SPACING.xs),
  },
  title: {
    fontSize: fs(12),
    fontWeight: '700',
  },
  subtitle: {
    fontSize: fs(10.5),
    marginTop: vs(1),
  },
  actionBtn: {
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderRadius: ms(RADIUS.full),
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: fs(11),
    fontWeight: '700',
  },
});
