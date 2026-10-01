import type { AppSettings, WeightUnit } from '../../domain';
import { nowIso } from '../../utils/id';
import { db } from '../database';

export interface SettingsRepository {
  get(): Promise<AppSettings>;
  setWeightUnit(unit: WeightUnit): Promise<AppSettings>;
}

export class DexieSettingsRepository implements SettingsRepository {
  async get(): Promise<AppSettings> {
    const existing = await db.settings.get('default');
    if (existing) {
      return existing;
    }

    const timestamp = nowIso();
    const defaults: AppSettings = {
      id: 'default',
      weightUnit: 'kg',
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
}

export const settingsRepository = new DexieSettingsRepository();
