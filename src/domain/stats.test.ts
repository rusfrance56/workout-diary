import { describe, expect, it } from 'vitest';
import {
  compareSessions,
  computeExerciseStats,
  estimateEpley1Rm,
  setVolumeKg,
  summarizeSession,
} from './stats';

describe('estimateEpley1Rm', () => {
  it('returns weight for single rep', () => {
    expect(estimateEpley1Rm(100, 1)).toBe(100);
  });

  it('estimates for multi-rep set', () => {
    expect(estimateEpley1Rm(100, 10)).toBe(133.25);
  });
});

describe('volume and session summary', () => {
  it('computes set volume', () => {
    expect(setVolumeKg(80, 10)).toBe(800);
  });

  it('summarizes session', () => {
    const summary = summarizeSession([
      { setNumber: 1, weightKg: 80, reps: 10 },
      { setNumber: 2, weightKg: 85, reps: 8 },
    ]);
    expect(summary.volumeKg).toBe(1480);
    expect(summary.maxWeightKg).toBe(85);
    expect(summary.bestE1rmKg).toBeGreaterThan(85);
  });
});

describe('compare and stats', () => {
  it('compares with previous session', () => {
    const comparison = compareSessions(
      { volumeKg: 1500, maxWeightKg: 90, bestE1rmKg: 110 },
      { volumeKg: 1400, maxWeightKg: 85, bestE1rmKg: 105 },
    );
    expect(comparison).toEqual({
      volumeDeltaKg: 100,
      maxWeightDeltaKg: 5,
      e1rmDeltaKg: 5,
    });
  });

  it('builds trend ascending by date', () => {
    const stats = computeExerciseStats([
      {
        workoutId: '2',
        workoutName: 'B',
        startedAt: '2026-10-08T10:00:00.000Z',
        sets: [{ setNumber: 1, weightKg: 90, reps: 5 }],
        volumeKg: 450,
        maxWeightKg: 90,
        bestE1rmKg: 105,
      },
      {
        workoutId: '1',
        workoutName: 'A',
        startedAt: '2026-10-01T10:00:00.000Z',
        sets: [{ setNumber: 1, weightKg: 80, reps: 5 }],
        volumeKg: 400,
        maxWeightKg: 80,
        bestE1rmKg: 93,
      },
    ]);
    expect(stats.sessionsCount).toBe(2);
    expect(stats.maxWeightKg).toBe(90);
    expect(stats.workingWeightTrend.map((item) => item.weightKg)).toEqual([80, 90]);
  });
});
