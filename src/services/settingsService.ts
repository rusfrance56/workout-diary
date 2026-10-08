import { settingsRepository } from '../db/repositories/settingsRepository';
import type { AppSettings, ThemeMode, WeightUnit } from '../domain';

export class SettingsService {
  get(): Promise<AppSettings> {
    return settingsRepository.get();
  }

  setWeightUnit(unit: WeightUnit): Promise<AppSettings> {
    return settingsRepository.setWeightUnit(unit);
  }

  setTheme(theme: ThemeMode): Promise<AppSettings> {
    return settingsRepository.setTheme(theme);
  }
}

export const settingsService = new SettingsService();
