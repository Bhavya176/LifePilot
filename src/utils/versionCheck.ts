import { Platform, Linking } from 'react-native';
import Constants from 'expo-constants';
import { AppRemoteConfig } from '../firebase/remoteConfig';

export type UpdateStatusType = 'UP_TO_DATE' | 'SOFT_UPDATE' | 'FORCE_UPDATE' | 'MAINTENANCE';

export interface UpdateEvaluation {
  status: UpdateStatusType;
  currentVersion: string;
  latestVersion: string;
  minimumVersion: string;
  title: string;
  message: string;
  storeUrl: string;
}

/**
 * Compare two semver strings (e.g. "1.0.0" vs "1.1.0")
 * Returns:
 *  -1 if v1 < v2
 *   0 if v1 === v2
 *   1 if v1 > v2
 */
export function compareSemver(v1: string, v2: string): number {
  const clean1 = (v1 || '0.0.0').replace(/^v/, '').split('-')[0];
  const clean2 = (v2 || '0.0.0').replace(/^v/, '').split('-')[0];

  const p1 = clean1.split('.').map((n) => parseInt(n, 10) || 0);
  const p2 = clean2.split('.').map((n) => parseInt(n, 10) || 0);

  const len = Math.max(p1.length, p2.length, 3);
  for (let i = 0; i < len; i++) {
    const num1 = p1[i] || 0;
    const num2 = p2[i] || 0;
    if (num1 < num2) return -1;
    if (num1 > num2) return 1;
  }
  return 0;
}

/**
 * Get current running app version from Expo Config
 */
export function getCurrentAppVersion(): string {
  return Constants.expoConfig?.version || '1.0.0';
}

/**
 * Get default store link for the current platform
 */
export function getDefaultStoreUrl(): string {
  const androidPackage = Constants.expoConfig?.android?.package || 'com.bhavya.LifePilot';
  if (Platform.OS === 'android') {
    return `market://details?id=${androidPackage}`;
  }
  return 'https://apps.apple.com/app/id6400000000';
}

/**
 * Open store page directly
 */
export async function openStorePage(customUrl?: string): Promise<void> {
  const targetUrl = customUrl || getDefaultStoreUrl();
  try {
    const canOpen = await Linking.canOpenURL(targetUrl);
    if (canOpen) {
      await Linking.openURL(targetUrl);
    } else {
      // Web fallback for Android market:// link
      const androidPackage = Constants.expoConfig?.android?.package || 'com.bhavya.LifePilot';
      const webFallback =
        Platform.OS === 'android'
          ? `https://play.google.com/store/apps/details?id=${androidPackage}`
          : targetUrl;
      await Linking.openURL(webFallback);
    }
  } catch (err) {
    console.warn('[VersionCheck] Error opening store URL:', err);
  }
}

/**
 * Evaluate update status against remote config
 */
export function evaluateAppVersion(
  remoteConfig: AppRemoteConfig,
  forcedCurrentVersion?: string
): UpdateEvaluation {
  const currentVersion = forcedCurrentVersion || getCurrentAppVersion();
  const latestVersion = remoteConfig.latest_version || '1.0.0';
  const minimumVersion = remoteConfig.minimum_supported_version || '1.0.0';
  const storeUrl =
    Platform.OS === 'android'
      ? remoteConfig.update_url_android || getDefaultStoreUrl()
      : remoteConfig.update_url_ios || getDefaultStoreUrl();

  // 1. Check Maintenance Mode
  if (remoteConfig.maintenance_mode) {
    return {
      status: 'MAINTENANCE',
      currentVersion,
      latestVersion,
      minimumVersion,
      title: 'Under Scheduled Maintenance',
      message:
        remoteConfig.maintenance_message ||
        'LifePilot is temporarily undergoing scheduled maintenance and system upgrades. Please check back shortly.',
      storeUrl,
    };
  }

  // 2. Check Critical / Force Update (Current < Minimum Supported)
  if (compareSemver(currentVersion, minimumVersion) < 0) {
    return {
      status: 'FORCE_UPDATE',
      currentVersion,
      latestVersion,
      minimumVersion,
      title: remoteConfig.update_title || 'Critical Update Required',
      message:
        remoteConfig.update_message ||
        `Your installed version (v${currentVersion}) is no longer supported. Please update to continue enjoying LifePilot.`,
      storeUrl,
    };
  }

  // 3. Check Soft / Flexible Update (Current < Latest)
  if (compareSemver(currentVersion, latestVersion) < 0) {
    return {
      status: 'SOFT_UPDATE',
      currentVersion,
      latestVersion,
      minimumVersion,
      title: remoteConfig.update_title || 'New Update Available 🚀',
      message:
        remoteConfig.update_message ||
        `A new version of LifePilot (v${latestVersion}) is available on the store with exciting new features and performance enhancements!`,
      storeUrl,
    };
  }

  // 4. Up to date
  return {
    status: 'UP_TO_DATE',
    currentVersion,
    latestVersion,
    minimumVersion,
    title: 'App Up to Date',
    message: 'You are running the latest version of LifePilot.',
    storeUrl,
  };
}
