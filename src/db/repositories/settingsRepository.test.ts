import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../database';
import { settingsRepository } from './settingsRepository';

describe('settingsRepository', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  it('returns defaults and persists weight unit', async () => {
    const initial = await settingsRepository.get();
    expect(initial.weightUnit).toBe('kg');
    expect(initial.theme).toBe('light');

    const updated = await settingsRepository.setWeightUnit('lb');
    expect(updated.weightUnit).toBe('lb');

    const reloaded = await settingsRepository.get();
    expect(reloaded.weightUnit).toBe('lb');
  });

  it('persists theme', async () => {
    await settingsRepository.setTheme('dark');
    const settings = await settingsRepository.get();
    expect(settings.theme).toBe('dark');
  });
});
