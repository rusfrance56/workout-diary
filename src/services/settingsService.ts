import { settingsRepository } from '../db/repositories/settingsRepository';
import type { AppSettings, WeightUnit } from '../domain';

export class SettingsService {
  get(): Promise<AppSettings> {
    return settingsRepository.get();
  }

  setWeightUnit(unit: WeightUnit): Promise<AppSettings> {
    return settingsRepository.setWeightUnit(unit);
  }
}

export const settingsService = new SettingsService();
