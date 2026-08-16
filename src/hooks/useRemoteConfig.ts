import { useState, useEffect } from 'react';
import { initRemoteConfig, getRemoteConfigValues, AppRemoteConfig, defaultConfigValues } from '../firebase/remoteConfig';

export function useRemoteConfig() {
  const [config, setConfig] = useState<AppRemoteConfig>(defaultConfigValues);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    initRemoteConfig()
      .then((activeConfig) => {
        setConfig(activeConfig);
      })
      .catch(() => {
        setConfig(getRemoteConfigValues());
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return {
    config,
    loading,
    isMaintenanceMode: config.maintenance_mode,
    maxDocuments: config.max_free_documents,
    showBanner: config.show_new_feature_banner,
  };
}
