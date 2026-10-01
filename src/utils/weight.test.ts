import { describe, expect, it } from 'vitest';
import { displayToKg, formatWeight, kgToDisplay, roundWeight } from './weight';

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
});
