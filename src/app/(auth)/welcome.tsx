import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuthContext } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { s, vs, ms, fs } from '../../utils/responsive';
import { HapticsService } from '../../services/hapticsService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  tag: string;
  title: string;
  description: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  bgColor: string;
  badgeText: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: 'tasks',
    tag: 'DEADLINE CONTROL',
    title: 'Smart Tasks & Alarms',
    description:
      'Never miss critical to-dos. Schedule tasks with interactive grids and 5x repeat alarms that ring until stopped.',
    iconName: 'alarm',
    iconColor: '#EF4444',
    bgColor: 'rgba(239, 68, 68, 0.12)',
    badgeText: '5x Repeat Alarms',
  },
  {
    id: 'habits',
    tag: 'CONSISTENCY ENGINE',
    title: 'Daily Habits & Heatmaps',
    description:
      'Build unbreakable streaks with 1-tap daily check-ins and visual GitHub-style 30-day consistency matrices.',
    iconName: 'flame',
    iconColor: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.12)',
    badgeText: 'Streak Heatmaps',
  },
  {
    id: 'expenses',
    tag: 'FINANCIAL CLARITY',
    title: 'Expenses & Smart Budgets',
    description:
      'Take charge of your money with instant donut spending breakdowns, category budgets, and PDF reports.',
    iconName: 'pie-chart',
    iconColor: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.12)',
    badgeText: 'Budget Thresholds',
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { continueAsGuest } = useAuthContext();
  const theme = isDarkMode ? COLORS.dark : COLORS.light;

  const [activeIndex, setActiveIndex] = useState(0);
  const [guestLoading, setGuestLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index !== activeIndex && index >= 0 && index < SLIDES.length) {
      setActiveIndex(index);
    }
  };

  const handleNext = async () => {
    await HapticsService.light();
    if (activeIndex < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({
        x: (activeIndex + 1) * SCREEN_WIDTH,
        animated: true,
      });
      setActiveIndex(activeIndex + 1);
    } else {
      router.push('/(auth)/register');
    }
  };

  const handleSkip = () => {
    scrollRef.current?.scrollTo({
      x: (SLIDES.length - 1) * SCREEN_WIDTH,
      animated: true,
    });
    setActiveIndex(SLIDES.length - 1);
  };

  const handleContinueAsGuest = async () => {
    await HapticsService.medium();
    setGuestLoading(true);
    try {
      await continueAsGuest();
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Guest Mode Error', err?.message || 'Could not start guest session.');
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Header Row with App Brand & Skip */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={[styles.brandIconWrapper, { backgroundColor: theme.primaryLight }]}>
            <Ionicons name="compass" size={20} color={theme.primary} />
          </View>
          <Text style={[styles.brandText, { color: theme.textPrimary }]}>LifePilot</Text>
        </View>

        {activeIndex < SLIDES.length - 1 ? (
          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
            <Text style={[styles.skipText, { color: theme.textSecondary }]}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: s(40) }} />
        )}
      </View>

      {/* Horizontal Swipable Slide Pager */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.pager}
      >
        {SLIDES.map((slide) => (
          <View key={slide.id} style={styles.slide}>
            {/* Slide Hero Graphic / Icon */}
            <View style={[styles.iconCircle, { backgroundColor: slide.bgColor }]}>
              <Ionicons name={slide.iconName} size={ms(68)} color={slide.iconColor} />
            </View>

            {/* Feature Tag */}
            <View style={[styles.tagBadge, { backgroundColor: isDarkMode ? '#1E1B38' : '#EEF2FF' }]}>
              <Text style={[styles.tagText, { color: theme.primary }]}>{slide.tag}</Text>
            </View>

            {/* Title & Description */}
            <Text style={[styles.slideTitle, { color: theme.textPrimary }]}>
              {slide.title}
            </Text>
            <Text style={[styles.slideDescription, { color: theme.textSecondary }]}>
              {slide.description}
            </Text>

            {/* Feature Highlight Pill */}
            <View style={[styles.highlightPill, { borderColor: theme.border }]}>
              <Ionicons name="sparkles" size={14} color={slide.iconColor} />
              <Text style={[styles.highlightText, { color: theme.textSecondary }]}>
                {slide.badgeText}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Navigation & Actions */}
      <View style={styles.bottomSection}>
        {/* Pagination Dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    idx === activeIndex
                      ? theme.primary
                      : isDarkMode
                      ? '#334155'
                      : '#CBD5E1',
                  width: idx === activeIndex ? s(24) : s(8),
                },
              ]}
            />
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button
            title={activeIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
            onPress={handleNext}
            isDarkMode={isDarkMode}
            size="lg"
            style={{ marginBottom: vs(SPACING.sm) }}
          />

          <Button
            title="I already have an account"
            variant="outline"
            onPress={() => router.push('/(auth)/login')}
            isDarkMode={isDarkMode}
            size="lg"
            style={{ marginBottom: vs(SPACING.sm) }}
          />

          {/* Instant Guest Explorer Option */}
          <TouchableOpacity
            style={[
              styles.guestBtn,
              { backgroundColor: isDarkMode ? '#1E1B38' : '#F1F5F9', borderColor: theme.border },
            ]}
            onPress={handleContinueAsGuest}
            disabled={guestLoading}
            activeOpacity={0.8}
          >
            {guestLoading ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <>
                <Ionicons name="flash-outline" size={16} color={theme.primary} />
                <Text style={[styles.guestBtnText, { color: theme.textPrimary }]}>
                  Explore as Guest (No signup needed)
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: s(SPACING.lg),
    paddingVertical: vs(SPACING.sm),
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
  },
  brandIconWrapper: {
    width: ms(34),
    height: ms(34),
    borderRadius: ms(17),
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: fs(18),
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  skipBtn: {
    paddingHorizontal: s(SPACING.sm),
    paddingVertical: vs(4),
  },
  skipText: {
    fontSize: fs(14),
    fontWeight: '600',
  },
  pager: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(SPACING.xl + 4),
  },
  iconCircle: {
    width: ms(130),
    height: ms(130),
    borderRadius: ms(65),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(SPACING.lg),
  },
  tagBadge: {
    paddingHorizontal: s(12),
    paddingVertical: vs(5),
    borderRadius: ms(RADIUS.full),
    marginBottom: vs(SPACING.xs + 2),
  },
  tagText: {
    fontSize: fs(11),
    fontWeight: '800',
    letterSpacing: 1,
  },
  slideTitle: {
    fontSize: fs(24),
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: vs(SPACING.sm),
  },
  slideDescription: {
    fontSize: fs(14),
    textAlign: 'center',
    lineHeight: fs(21),
    marginBottom: vs(SPACING.md),
  },
  highlightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    paddingHorizontal: s(12),
    paddingVertical: vs(6),
    borderRadius: ms(RADIUS.full),
    borderWidth: 1,
  },
  highlightText: {
    fontSize: fs(12),
    fontWeight: '600',
  },
  bottomSection: {
    paddingHorizontal: s(SPACING.lg),
    paddingBottom: vs(SPACING.lg),
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: s(6),
    marginBottom: vs(SPACING.lg),
  },
  dot: {
    height: vs(8),
    borderRadius: ms(4),
  },
  actionsContainer: {
    width: '100%',
  },
  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(12),
    borderRadius: ms(RADIUS.md),
    borderWidth: 1,
    gap: s(6),
    marginTop: vs(2),
  },
  guestBtnText: {
    fontSize: fs(13),
    fontWeight: '700',
  },
});
