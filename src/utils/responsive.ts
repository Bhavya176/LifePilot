/**
 * Comprehensive Responsive Utility for React Native & Expo
 *
 * Base design dimensions: 390 × 844 (iPhone 14 / Pixel 7).
 * Provides robust scaling functions, percentage calculators, device detection,
 * and a reactive `useResponsive()` hook for dynamic orientation/split-screen support.
 */

import { Dimensions, PixelRatio, Platform, useWindowDimensions } from 'react-native';

const { width: INITIAL_WIDTH, height: INITIAL_HEIGHT } = Dimensions.get('window');

/** Base design canvas width & height */
export const BASE_WIDTH = 390;
export const BASE_HEIGHT = 844;

/** Max scaling threshold to prevent excessive enlargement on tablets */
const MAX_SCALE = 1.3;
const MIN_SCALE = 0.85;

/**
 * Get clamped scale factor for width
 */
const getWidthScale = (w: number = Dimensions.get('window').width): number => {
  const scale = w / BASE_WIDTH;
  return Math.min(Math.max(scale, MIN_SCALE), MAX_SCALE);
};

/**
 * Get clamped scale factor for height
 */
const getHeightScale = (h: number = Dimensions.get('window').height): number => {
  const scale = h / BASE_HEIGHT;
  return Math.min(Math.max(scale, MIN_SCALE), MAX_SCALE);
};

/**
 * Scale horizontally (widths, horizontal padding/margins, horizontal positions)
 */
export function s(size: number): number {
  const scale = getWidthScale();
  return Math.round(PixelRatio.roundToNearestPixel(size * scale));
}

/**
 * Scale vertically (heights, vertical padding/margins, vertical offsets)
 */
export function vs(size: number): number {
  const scale = getHeightScale();
  return Math.round(PixelRatio.roundToNearestPixel(size * scale));
}

/**
 * Moderate scale (fonts, border radii, icon sizes)
 * Blends linear scaling with a dampening factor (default 0.4)
 */
export function ms(size: number, factor: number = 0.4): number {
  const scale = getWidthScale();
  return Math.round(PixelRatio.roundToNearestPixel(size + (size * scale - size) * factor));
}

/**
 * Moderate vertical scale
 */
export function mvs(size: number, factor: number = 0.4): number {
  const scale = getHeightScale();
  return Math.round(PixelRatio.roundToNearestPixel(size + (size * scale - size) * factor));
}

/**
 * Font scaling with moderation and upper-bound protection
 */
export function fs(size: number, factor: number = 0.35): number {
  return ms(size, factor);
}

/**
 * Screen Width percentage (e.g. wp(50) = 50% of screen width)
 */
export function wp(percent: number): number {
  const { width } = Dimensions.get('window');
  return Math.round(PixelRatio.roundToNearestPixel((width * percent) / 100));
}

/**
 * Screen Height percentage (e.g. hp(20) = 20% of screen height)
 */
export function hp(percent: number): number {
  const { height } = Dimensions.get('window');
  return Math.round(PixelRatio.roundToNearestPixel((height * percent) / 100));
}

/** Static screen metrics */
export const screen = {
  get width() {
    return Dimensions.get('window').width;
  },
  get height() {
    return Dimensions.get('window').height;
  },
};

/** Device category flags */
export const isSmallDevice = INITIAL_WIDTH < 375;
export const isTablet = INITIAL_WIDTH >= 600 || (INITIAL_HEIGHT / INITIAL_WIDTH < 1.6 && INITIAL_WIDTH >= 500);
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

/**
 * React Hook for dynamic responsive calculations that automatically
 * updates on screen rotation or window resize.
 */
export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const wScale = Math.min(Math.max(width / BASE_WIDTH, MIN_SCALE), MAX_SCALE);
  const hScale = Math.min(Math.max(height / BASE_HEIGHT, MIN_SCALE), MAX_SCALE);

  const responsiveS = (size: number) =>
    Math.round(PixelRatio.roundToNearestPixel(size * wScale));

  const responsiveVs = (size: number) =>
    Math.round(PixelRatio.roundToNearestPixel(size * hScale));

  const responsiveMs = (size: number, factor: number = 0.4) =>
    Math.round(PixelRatio.roundToNearestPixel(size + (size * wScale - size) * factor));

  const responsiveFs = (size: number, factor: number = 0.35) =>
    responsiveMs(size, factor);

  const responsiveWp = (percent: number) =>
    Math.round(PixelRatio.roundToNearestPixel((width * percent) / 100));

  const responsiveHp = (percent: number) =>
    Math.round(PixelRatio.roundToNearestPixel((height * percent) / 100));

  return {
    width,
    height,
    isSmall: width < 375,
    isTablet: width >= 600 || (height / width < 1.6 && width >= 500),
    isLandscape: width > height,
    s: responsiveS,
    vs: responsiveVs,
    ms: responsiveMs,
    fs: responsiveFs,
    wp: responsiveWp,
    hp: responsiveHp,
  };
}

export default {
  s,
  vs,
  ms,
  mvs,
  fs,
  wp,
  hp,
  screen,
  isSmallDevice,
  isTablet,
  isIOS,
  isAndroid,
  useResponsive,
};