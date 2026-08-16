import {
  getRemoteConfig,
  fetchAndActivate,
  getValue,
  RemoteConfig,
} from 'firebase/remote-config';
import { app } from './config';

export interface AppRemoteConfig {
  maintenance_mode: boolean;
  minimum_supported_version: string;
  daily_quote_enabled: boolean;
  productivity_insights_enabled: boolean;
  max_free_documents: number;
  show_new_feature_banner: boolean;
}

// Safe fallback default configuration values
export const defaultConfigValues: AppRemoteConfig = {
  maintenance_mode: false,
  minimum_supported_version: '1.0.0',
  daily_quote_enabled: true,
  productivity_insights_enabled: true,
  max_free_documents: 25,
  show_new_feature_banner: true,
};

let remoteConfigInstance: RemoteConfig | null = null;
let activeRemoteValues: Partial<AppRemoteConfig> = {};

/**
 * Direct Firebase Remote Config REST API fetch for React Native / Expo environment
 */
async function fetchRemoteConfigFromRest(): Promise<Partial<AppRemoteConfig> | null> {
  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  const appId = process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:849309112742:web:975d3875bdf87ed7c2d767';

  if (!apiKey || !projectId) return null;

  try {
    const url = `https://firebaseremoteconfig.googleapis.com/v1/projects/${projectId}/namespaces/firebase:fetch?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appId,
        appInstanceId: '1234567890123456789012',
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.entries) {
        const parsed: Partial<AppRemoteConfig> = {};
        if (data.entries.max_free_documents !== undefined) {
          parsed.max_free_documents = Number(data.entries.max_free_documents);
        }
        if (data.entries.maintenance_mode !== undefined) {
          parsed.maintenance_mode = String(data.entries.maintenance_mode).toLowerCase() === 'true';
        }
        if (data.entries.daily_quote_enabled !== undefined) {
          parsed.daily_quote_enabled = String(data.entries.daily_quote_enabled).toLowerCase() === 'true';
        }
        if (data.entries.show_new_feature_banner !== undefined) {
          parsed.show_new_feature_banner = String(data.entries.show_new_feature_banner).toLowerCase() === 'true';
        }
        return parsed;
      }
    }
  } catch (error) {
    console.warn('[RemoteConfig REST fetch error]:', error);
  }
  return null;
}

/**
 * Initialize Remote Config with default fallback values and fetch remote updates
 */
export async function initRemoteConfig(): Promise<AppRemoteConfig> {
  // Direct REST fetch (Works 100% in React Native without IndexedDB requirements)
  const restConfig = await fetchRemoteConfigFromRest();
  if (restConfig) {
    activeRemoteValues = restConfig;
  }

  // Attempt Web SDK initialization
  try {
    remoteConfigInstance = getRemoteConfig(app);
    remoteConfigInstance.settings = {
      minimumFetchIntervalMillis: 0,
      fetchTimeoutMillis: 10000,
    };
    remoteConfigInstance.defaultConfig = defaultConfigValues as any;
    await fetchAndActivate(remoteConfigInstance);
  } catch (error) {
    // Expected fallback on native runtimes without IndexedDB
  }

  return getRemoteConfigValues();
}

/**
 * Get current active Remote Config values
 */
export function getRemoteConfigValues(): AppRemoteConfig {
  const result: AppRemoteConfig = { ...defaultConfigValues, ...activeRemoteValues };

  if (remoteConfigInstance) {
    try {
      const maxDocsVal = getValue(remoteConfigInstance, 'max_free_documents');
      // Only override with SDK value if it actually came from remote server ('remote')
      if (maxDocsVal.getSource() === 'remote') {
        const valNumber = maxDocsVal.asNumber() || Number(maxDocsVal.asString());
        if (valNumber) {
          result.max_free_documents = valNumber;
        }
      }
    } catch (e) {
      // Use REST/Default fallback
    }
  }

  console.log('[RemoteConfig Final Active Values]:', result);
  return result;
}
