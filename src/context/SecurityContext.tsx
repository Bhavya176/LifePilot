import React, { createContext, useContext, useState, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const STORAGE_KEY_BIOMETRIC = '@lifepilot_biometric_enabled';

interface SecurityContextType {
  isBiometricSupported: boolean;
  isBiometricEnabled: boolean;
  isVaultLocked: boolean;
  toggleBiometric: () => Promise<boolean>;
  authenticateWithBiometrics: (promptMessage?: string) => Promise<boolean>;
  unlockVault: () => Promise<boolean>;
  lockVault: () => void;
}

const SecurityContext = createContext<SecurityContextType>({
  isBiometricSupported: false,
  isBiometricEnabled: false,
  isVaultLocked: false,
  toggleBiometric: async () => false,
  authenticateWithBiometrics: async () => false,
  unlockVault: async () => false,
  lockVault: () => {},
});

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isBiometricSupported, setIsBiometricSupported] = useState<boolean>(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState<boolean>(false);
  const [isVaultLocked, setIsVaultLocked] = useState<boolean>(false);

  useEffect(() => {
    async function checkHardware() {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        setIsBiometricSupported(hasHardware && isEnrolled);

        const savedPref = await AsyncStorage.getItem(STORAGE_KEY_BIOMETRIC);
        const enabled = savedPref === 'true';
        setIsBiometricEnabled(enabled);
        if (enabled) {
          setIsVaultLocked(true);
        }
      } catch (err) {
        console.warn('Biometrics check error:', err);
      }
    }
    checkHardware();
  }, []);

  const authenticateWithBiometrics = async (
    promptMessage: string = 'Authenticate to access LifePilot Vault'
  ): Promise<boolean> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: 'Use Device Passcode',
        disableDeviceFallback: false,
        cancelLabel: 'Cancel',
      });
      return result.success;
    } catch (error) {
      console.warn('Authentication error:', error);
      return false;
    }
  };

  const toggleBiometric = async (): Promise<boolean> => {
    if (!isBiometricEnabled) {
      // Prompt user once before enabling
      const success = await authenticateWithBiometrics('Verify identity to enable Biometric Lock');
      if (success) {
        setIsBiometricEnabled(true);
        await AsyncStorage.setItem(STORAGE_KEY_BIOMETRIC, 'true');
        Alert.alert('Biometrics Enabled', 'Face ID / Fingerprint protection is now active for your Document Vault.');
        return true;
      }
      return false;
    } else {
      setIsBiometricEnabled(false);
      setIsVaultLocked(false);
      await AsyncStorage.setItem(STORAGE_KEY_BIOMETRIC, 'false');
      return true;
    }
  };

  const unlockVault = async (): Promise<boolean> => {
    if (!isBiometricEnabled) {
      setIsVaultLocked(false);
      return true;
    }
    const success = await authenticateWithBiometrics('Unlock LifePilot Document Vault');
    if (success) {
      setIsVaultLocked(false);
      return true;
    }
    return false;
  };

  const lockVault = () => {
    if (isBiometricEnabled) {
      setIsVaultLocked(true);
    }
  };

  return (
    <SecurityContext.Provider
      value={{
        isBiometricSupported,
        isBiometricEnabled,
        isVaultLocked,
        toggleBiometric,
        authenticateWithBiometrics,
        unlockVault,
        lockVault,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => useContext(SecurityContext);
