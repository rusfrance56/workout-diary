import { describe, expect, it } from 'vitest';
import {
  applyProgressionToSuggestions,
  recommendDoubleProgression,
  type ProgressionTarget,
} from './progression';

const TARGET: ProgressionTarget = {
  targetSets: 3,
  minReps: 8,
  maxReps: 12,
  rule: { type: 'double_progression', incrementKg: 2.5 },
};

describe('recommendDoubleProgression', () => {
  it('increases weight when all sets hit max reps', () => {
    const result = recommendDoubleProgression(
      [
        { weightKg: 80, reps: 12, completed: true },
        { weightKg: 80, reps: 12, completed: true },
        { weightKg: 80, reps: 12, completed: true },
      ],
      TARGET,
    );

    expect(result.action).toBe('increase_weight');
    expect(result.recommendedWeightKg).toBe(82.5);
    expect(result.recommendedReps).toBe(8);
  });

  it('holds weight when not all sets hit max', () => {
    const result = recommendDoubleProgression(
      [
        { weightKg: 80, reps: 12, completed: true },
        { weightKg: 80, reps: 11, completed: true },
        { weightKg: 80, reps: 9, completed: true },
      ],
      TARGET,
    );

    expect(result.action).toBe('hold_weight');
    expect(result.recommendedWeightKg).toBe(80);
  });

  it('holds weight at min reps and pushes for more reps', () => {
    const result = recommendDoubleProgression(
      [
        { weightKg: 80, reps: 8, completed: true },
        { weightKg: 80, reps: 8, completed: true },
        { weightKg: 80, reps: 8, completed: true },
      ],
      TARGET,
    );

    expect(result.action).toBe('hold_weight');
    expect(result.recommendedWeightKg).toBe(80);
    expect(result.recommendedReps).toBe(12);
  });

  it('marks incomplete when not enough completed sets', () => {
    const result = recommendDoubleProgression(
      [
        { weightKg: 80, reps: 12, completed: true },
        { weightKg: 80, reps: 12, completed: false },
        { weightKg: 80, reps: 12, completed: false },
      ],
      TARGET,
    );

    expect(result.action).toBe('incomplete');
  });

  it('returns none when rule is disabled', () => {
    const result = recommendDoubleProgression(
      [
        { weightKg: 80, reps: 12, completed: true },
        { weightKg: 80, reps: 12, completed: true },
        { weightKg: 80, reps: 12, completed: true },
      ],
      { ...TARGET, rule: { type: 'none', incrementKg: 0 } },
    );

    expect(result.action).toBe('none');
    expect(result.recommendedWeightKg).toBe(80);
  });
});

describe('applyProgressionToSuggestions', () => {
  it('rewrites drafts to new weight after increase', () => {
    const recommendation = recommendDoubleProgression(
      [
        { weightKg: 80, reps: 12, completed: true },
        { weightKg: 80, reps: 12, completed: true },
        { weightKg: 80, reps: 12, completed: true },
      ],
      TARGET,
    );

    const next = applyProgressionToSuggestions(
      [
        { weightKg: 80, reps: 12 },
        { weightKg: 80, reps: 12 },
        { weightKg: 80, reps: 12 },
      ],
      recommendation,
      3,
    );

    expect(next).toEqual([
      { weightKg: 82.5, reps: 8 },
      { weightKg: 82.5, reps: 8 },
      { weightKg: 82.5, reps: 8 },
    ]);
  });
});
