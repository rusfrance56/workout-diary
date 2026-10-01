import { useCallback, useEffect, useState } from 'react';
import type { AppSettings, WeightUnit } from '../domain';
import { settingsService } from '../services/settingsService';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void settingsService.get().then((value) => {
      if (!cancelled) {
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

  return { settings, loading, setWeightUnit };
}
