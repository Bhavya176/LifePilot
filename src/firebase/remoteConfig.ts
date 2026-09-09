import {
  getRemoteConfig,
  fetchAndActivate,
  getValue,
  RemoteConfig,
} from 'firebase/remote-config';
import { app } from './config';

export interface AppRemoteConfig {
  maintenance_mode: boolean;
  maintenance_message: string;
  minimum_supported_version: string;
  latest_version: string;
  update_title: string;
  update_message: string;
  update_url_android: string;
  update_url_ios: string;
  daily_quote_enabled: boolean;
  daily_quote_text: string;
  daily_quote_author: string;
  productivity_insights_enabled: boolean;
  max_free_documents: number;
  show_new_feature_banner: boolean;
  announcement_banner_enabled: boolean;
  announcement_banner_text: string;
  announcement_banner_type: 'info' | 'warning' | 'celebration' | 'maintenance';
  announcement_banner_action_title: string;
}

// Safe fallback default configuration values
export const defaultConfigValues: AppRemoteConfig = {
  maintenance_mode: false,
  maintenance_message: 'LifePilot is currently undergoing scheduled system upgrades. Please check back shortly.',
  minimum_supported_version: '1.0.0',
  latest_version: '1.0.0',
  update_title: 'New Update Available 🚀',
  update_message: 'A new version of LifePilot is available on the store with exciting new features and performance enhancements!',
  update_url_android: '',
  update_url_ios: '',
  daily_quote_enabled: true,
  daily_quote_text: 'Small daily disciplines repeated consistently lead to monumental lifetime achievements.',
  daily_quote_author: 'Robin Sharma',
  productivity_insights_enabled: true,
  max_free_documents: 25,
  show_new_feature_banner: true,
  announcement_banner_enabled: true,
  announcement_banner_text: '🎉 Welcome to LifePilot v2.0! Real-time Focus Rooms, Instant Chat & Expense Analytics are now live.',
  announcement_banner_type: 'celebration',
  announcement_banner_action_title: 'Explore',
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
        if (data.entries.daily_quote_text !== undefined) {
          parsed.daily_quote_text = String(data.entries.daily_quote_text);
        }
        if (data.entries.daily_quote_author !== undefined) {
          parsed.daily_quote_author = String(data.entries.daily_quote_author);
        }
        if (data.entries.announcement_banner_enabled !== undefined) {
          parsed.announcement_banner_enabled = String(data.entries.announcement_banner_enabled).toLowerCase() === 'true';
        }
        if (data.entries.announcement_banner_text !== undefined) {
          parsed.announcement_banner_text = String(data.entries.announcement_banner_text);
        }
        if (data.entries.announcement_banner_type !== undefined) {
          parsed.announcement_banner_type = data.entries.announcement_banner_type as any;
        }
        if (data.entries.announcement_banner_action_title !== undefined) {
          parsed.announcement_banner_action_title = String(data.entries.announcement_banner_action_title);
        }
        if (data.entries.show_new_feature_banner !== undefined) {
          parsed.show_new_feature_banner = String(data.entries.show_new_feature_banner).toLowerCase() === 'true';
        }
        if (data.entries.minimum_supported_version !== undefined) {
          parsed.minimum_supported_version = String(data.entries.minimum_supported_version);
        }
        if (data.entries.latest_version !== undefined) {
          parsed.latest_version = String(data.entries.latest_version);
        }
        if (data.entries.update_title !== undefined) {
          parsed.update_title = String(data.entries.update_title);
        }
        if (data.entries.update_message !== undefined) {
          parsed.update_message = String(data.entries.update_message);
        }
        if (data.entries.update_url_android !== undefined) {
          parsed.update_url_android = String(data.entries.update_url_android);
        }
        if (data.entries.update_url_ios !== undefined) {
          parsed.update_url_ios = String(data.entries.update_url_ios);
        }
        if (data.entries.maintenance_message !== undefined) {
          parsed.maintenance_message = String(data.entries.maintenance_message);
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
  const restConfig = await fetchRemoteConfigFromRest();
  if (restConfig) {
    activeRemoteValues = restConfig;
  }

  try {
    remoteConfigInstance = getRemoteConfig(app);
    remoteConfigInstance.settings = {
      minimumFetchIntervalMillis: 0,
      fetchTimeoutMillis: 10000,
    };
    remoteConfigInstance.defaultConfig = defaultConfigValues as any;
    await fetchAndActivate(remoteConfigInstance);
  } catch (error) {
    // Native fallback
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
      if (maxDocsVal.getSource() === 'remote') {
        const valNumber = maxDocsVal.asNumber() || Number(maxDocsVal.asString());
        if (valNumber) {
          result.max_free_documents = valNumber;
        }
      }
      const quoteTextVal = getValue(remoteConfigInstance, 'daily_quote_text');
      if (quoteTextVal.getSource() === 'remote' && quoteTextVal.asString()) {
        result.daily_quote_text = quoteTextVal.asString();
      }
      const quoteAuthorVal = getValue(remoteConfigInstance, 'daily_quote_author');
      if (quoteAuthorVal.getSource() === 'remote' && quoteAuthorVal.asString()) {
        result.daily_quote_author = quoteAuthorVal.asString();
      }
      const bannerTextVal = getValue(remoteConfigInstance, 'announcement_banner_text');
      if (bannerTextVal.getSource() === 'remote' && bannerTextVal.asString()) {
        result.announcement_banner_text = bannerTextVal.asString();
      }
      const minVerVal = getValue(remoteConfigInstance, 'minimum_supported_version');
      if (minVerVal.getSource() === 'remote' && minVerVal.asString()) {
        result.minimum_supported_version = minVerVal.asString();
      }
      const latestVerVal = getValue(remoteConfigInstance, 'latest_version');
      if (latestVerVal.getSource() === 'remote' && latestVerVal.asString()) {
        result.latest_version = latestVerVal.asString();
      }
      const updateTitleVal = getValue(remoteConfigInstance, 'update_title');
      if (updateTitleVal.getSource() === 'remote' && updateTitleVal.asString()) {
        result.update_title = updateTitleVal.asString();
      }
      const updateMsgVal = getValue(remoteConfigInstance, 'update_message');
      if (updateMsgVal.getSource() === 'remote' && updateMsgVal.asString()) {
        result.update_message = updateMsgVal.asString();
      }
      const maintVal = getValue(remoteConfigInstance, 'maintenance_mode');
      if (maintVal.getSource() === 'remote') {
        result.maintenance_mode = maintVal.asBoolean();
      }
      const maintMsgVal = getValue(remoteConfigInstance, 'maintenance_message');
      if (maintMsgVal.getSource() === 'remote' && maintMsgVal.asString()) {
        result.maintenance_message = maintMsgVal.asString();
      }
    } catch (e) {
      // Use REST/Default fallback
    }
  }

  return result;
}
