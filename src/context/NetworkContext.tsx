import React, { createContext, useContext, useState, useEffect } from 'react';
import { setFirestoreNetworkEnabled } from '../firebase/firestore';

interface NetworkContextType {
  isOnline: boolean;
  isOfflineModeManual: boolean;
  toggleOfflineMode: () => Promise<void>;
  pendingSyncItems: number;
}

const NetworkContext = createContext<NetworkContextType>({
  isOnline: true,
  isOfflineModeManual: false,
  toggleOfflineMode: async () => {},
  pendingSyncItems: 0,
});

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOfflineModeManual, setIsOfflineModeManual] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingSyncItems] = useState<number>(0);

  const toggleOfflineMode = async () => {
    const nextManualState = !isOfflineModeManual;
    setIsOfflineModeManual(nextManualState);
    setIsOnline(!nextManualState);

    // Toggle Firestore network synchronization engine
    await setFirestoreNetworkEnabled(!nextManualState);
  };

  return (
    <NetworkContext.Provider
      value={{
        isOnline,
        isOfflineModeManual,
        toggleOfflineMode,
        pendingSyncItems,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => useContext(NetworkContext);
