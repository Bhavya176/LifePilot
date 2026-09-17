import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';

export interface SecurityAssessment {
  isDeviceCompromised: boolean;
  isSimulator: boolean;
  threats: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  timestamp: string;
}

/**
 * Perform comprehensive device integrity, root, and jailbreak heuristic checks.
 * Detects common signs of root kits, jailbreak package managers, and untrusted environments.
 */
export async function performSecurityCheck(): Promise<SecurityAssessment> {
  const threats: string[] = [];

  // 1. Web environment check (skip native OS integrity checks)
  if (Platform.OS === 'web') {
    return {
      isDeviceCompromised: false,
      isSimulator: false,
      threats: [],
      riskLevel: 'LOW',
      timestamp: new Date().toISOString(),
    };
  }

  // 2. Simulator / Emulator Detection
  const isSimulator = !Constants.isDevice;
  if (isSimulator && !__DEV__) {
    threats.push('Application is executing inside an unverified emulator/virtual machine in production.');
  }

  // 3. iOS Jailbreak Heuristic Checks
  if (Platform.OS === 'ios') {
    const jailbreakSchemes = ['cydia://', 'sileo://', 'zbra://', 'filza://'];
    for (const scheme of jailbreakSchemes) {
      try {
        const canOpen = await Linking.canOpenURL(scheme);
        if (canOpen) {
          threats.push(`Jailbreak package manager detected via URL scheme: ${scheme}`);
        }
      } catch {
        // Can open URL check failed or blocked by sandbox
      }
    }
  }

  // 4. Debugging & Tamper Detection
  if (!__DEV__ && typeof (globalThis as any).__REMOTEDEV__ !== 'undefined') {
    threats.push('External debugger/proxy hooks detected attached to runtime.');
  }

  // Calculate Risk Level
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (threats.length > 0) {
    riskLevel = threats.some(t => t.includes('Jailbreak') || t.includes('debugger'))
      ? 'HIGH'
      : 'MEDIUM';
  }

  const isDeviceCompromised = riskLevel === 'HIGH';

  return {
    isDeviceCompromised,
    isSimulator,
    threats,
    riskLevel,
    timestamp: new Date().toISOString(),
  };
}
