import { describe, expect, it } from 'vitest';
import {
  displayToKg,
  formatSetsCompact,
  formatWeight,
  kgToDisplay,
  roundWeight,
} from './weight';

describe('weight utils', () => {
  it('rounds to step', () => {
    expect(roundWeight(22.499, 0.25)).toBe(22.5);
  });

  it('keeps kg as default display', () => {
    expect(kgToDisplay(80, 'kg')).toBe(80);
    expect(formatWeight(80, 'kg')).toBe('80 кг');
  });

  it('converts lb round-trip approximately', () => {
    const kg = displayToKg(100, 'lb');
    expect(kgToDisplay(kg, 'lb')).toBe(100);
  });

  it('groups adjacent same-weight sets', () => {
    expect(
      formatSetsCompact([
        { weightKg: 50, reps: 12 },
        { weightKg: 70, reps: 10 },
        { weightKg: 80, reps: 6 },
        { weightKg: 80, reps: 6 },
        { weightKg: 80, reps: 5 },
      ]),
    ).toBe('50кг×12 · 70кг×10 · 80кг×6-6-5');
  });
});
