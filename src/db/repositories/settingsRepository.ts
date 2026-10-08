import type { AppSettings, ThemeMode, WeightUnit } from '../../domain';
import { nowIso } from '../../utils/id';
import { db } from '../database';

export interface SettingsRepository {
  get(): Promise<AppSettings>;
  setWeightUnit(unit: WeightUnit): Promise<AppSettings>;
  setTheme(theme: ThemeMode): Promise<AppSettings>;
}

export class DexieSettingsRepository implements SettingsRepository {
  async get(): Promise<AppSettings> {
    const existing = await db.settings.get('default');
    if (existing) {
      return normalizeSettings(existing);
    }

    const timestamp = nowIso();
    const defaults: AppSettings = {
      id: 'default',
      weightUnit: 'kg',
      theme: 'light',
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await db.settings.put(defaults);
    return defaults;
  }

  async setWeightUnit(unit: WeightUnit): Promise<AppSettings> {
    const current = await this.get();
    const updated: AppSettings = {
      ...current,
      weightUnit: unit,
      updatedAt: nowIso(),
    };
    await db.settings.put(updated);
    return updated;
  }

  async setTheme(theme: ThemeMode): Promise<AppSettings> {
    const current = await this.get();
    const updated: AppSettings = {
      ...current,
      theme,
      updatedAt: nowIso(),
    };
    await db.settings.put(updated);
    return updated;
  }
}

export const settingsRepository = new DexieSettingsRepository();

function normalizeSettings(settings: AppSettings): AppSettings {
  return {
    ...settings,
    theme: settings.theme === 'dark' ? 'dark' : 'light',
    weightUnit: settings.weightUnit === 'lb' ? 'lb' : 'kg',
  };
}
