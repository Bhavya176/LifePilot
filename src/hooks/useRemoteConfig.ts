import { useState, useEffect, useCallback } from 'react';
import {
  initRemoteConfig,
  getRemoteConfigValues,
  AppRemoteConfig,
  defaultConfigValues,
} from '../firebase/remoteConfig';

export function useRemoteConfig() {
  const [config, setConfig] = useState<AppRemoteConfig>(defaultConfigValues);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const activeConfig = await initRemoteConfig();
      setConfig(activeConfig);
    } catch {
      setConfig(getRemoteConfigValues());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return {
    config,
    loading,
    refetchConfig: fetchConfig,
    isMaintenanceMode: config.maintenance_mode,
    maxDocuments: config.max_free_documents,
    showBanner: config.show_new_feature_banner,
    dailyQuote: {
      enabled: config.daily_quote_enabled,
      text: config.daily_quote_text,
      author: config.daily_quote_author,
    },
    announcement: {
      enabled: config.announcement_banner_enabled,
      text: config.announcement_banner_text,
      type: config.announcement_banner_type,
      actionTitle: config.announcement_banner_action_title,
    },
  };
}
