import { useCallback, useEffect, useState } from 'react';
import type { AppSettings, ThemeMode, WeightUnit } from '../domain';
import { settingsService } from '../services/settingsService';
import { applyTheme } from '../utils/theme';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void settingsService.get().then((value) => {
      if (!cancelled) {
        applyTheme(value.theme);
        setSettings(value);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const setWeightUnit = useCallback(async (unit: WeightUnit) => {
    const updated = await settingsService.setWeightUnit(unit);
    setSettings(updated);
    return updated;
  }, []);

  const setTheme = useCallback(async (theme: ThemeMode) => {
    applyTheme(theme);
    const updated = await settingsService.setTheme(theme);
    setSettings(updated);
    return updated;
  }, []);

  const toggleTheme = useCallback(async () => {
    const next: ThemeMode = settings?.theme === 'dark' ? 'light' : 'dark';
    return setTheme(next);
  }, [settings?.theme, setTheme]);

  return { settings, loading, setWeightUnit, setTheme, toggleTheme };
}
