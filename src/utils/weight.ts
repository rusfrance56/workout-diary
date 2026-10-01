import type { WeightUnit } from '../domain';

const KG_PER_LB = 0.45359237;

/** Округление веса до шага (по умолчанию 0.25), чтобы снизить ошибки float. */
export function roundWeight(value: number, step = 0.25): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const rounded = Math.round(value / step) * step;
  return Number(rounded.toFixed(4));
}

export function kgToDisplay(weightKg: number, unit: WeightUnit): number {
  if (unit === 'lb') {
    return roundWeight(weightKg / KG_PER_LB, 0.5);
  }
  return roundWeight(weightKg, 0.25);
}

export function displayToKg(value: number, unit: WeightUnit): number {
  if (unit === 'lb') {
    return roundWeight(value * KG_PER_LB, 0.001);
  }
  return roundWeight(value, 0.001);
}

export function formatWeight(weightKg: number, unit: WeightUnit): string {
  const value = kgToDisplay(weightKg, unit);
  const unitLabel = unit === 'kg' ? 'кг' : 'lb';
  return `${trimTrailingZeros(value)} ${unitLabel}`;
}

function trimTrailingZeros(value: number): string {
  return String(Number(value.toFixed(2)));
}
