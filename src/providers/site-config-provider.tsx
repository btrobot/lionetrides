'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';

export type SiteConfig = Record<string, string>;

interface SiteConfigContextValue {
  config: SiteConfig;
  loading: boolean;
  refresh: () => Promise<void>;
}

const SiteConfigContext = createContext<SiteConfigContextValue>({
  config: {},
  loading: true,
  refresh: async () => {},
});

export function useSiteConfig() {
  return useContext(SiteConfigContext);
}

interface SiteConfigProviderProps {
  children: ReactNode;
  locale?: string;
  initialConfig?: SiteConfig;
}

export function SiteConfigProvider({ children, locale = 'en', initialConfig = {} }: SiteConfigProviderProps) {
  const [config, setConfig] = useState<SiteConfig>(initialConfig);
  const [loading, setLoading] = useState(!initialConfig || Object.keys(initialConfig).length === 0);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/site-settings?locale=${locale}`);
      const json = await res.json();
      if (json.success && json.data) {
        setConfig(json.data);
      }
    } catch (err) {
      console.error('Failed to load site config:', err);
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    if (Object.keys(config).length === 0) {
      fetchConfig();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SiteConfigContext.Provider value={{ config, loading, refresh: fetchConfig }}>
      {children}
    </SiteConfigContext.Provider>
  );
}