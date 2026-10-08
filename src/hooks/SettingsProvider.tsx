import { createContext, useContext, type ReactNode } from 'react';
import { useSettings } from './useSettings';

type SettingsApi = ReturnType<typeof useSettings>;

const SettingsContext = createContext<SettingsApi | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const value = useSettings();
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettingsContext(): SettingsApi {
  const value = useContext(SettingsContext);
  if (!value) {
    throw new Error('useSettingsContext вне SettingsProvider');
  }
  return value;
}
