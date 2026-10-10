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

function groupAdjacentByWeight(
  sets: Array<{ weightKg: number; reps: number }>,
): Array<{ weightKg: number; reps: number[] }> {
  const groups: Array<{ weightKg: number; reps: number[] }> = [];
  for (const set of sets) {
    const last = groups[groups.length - 1];
    if (last && last.weightKg === set.weightKg) {
      last.reps.push(set.reps);
    } else {
      groups.push({ weightKg: set.weightKg, reps: [set.reps] });
    }
  }
  return groups;
}

/** Чипы: `80 кг × 6-6-5` (смежный одинаковый вес склеивается) */
export function formatSetGroups(
  sets: Array<{ weightKg: number; reps: number }>,
  unit: WeightUnit = 'kg',
): string[] {
  return groupAdjacentByWeight(sets).map(
    (group) => `${formatWeight(group.weightKg, unit)} × ${group.reps.join('-')}`,
  );
}

/** Единый вид: `50кг×12 · 70кг×10 · 80кг×6-6-5` */
export function formatSetsCompact(
  sets: Array<{ weightKg: number; reps: number }>,
  unit: WeightUnit = 'kg',
): string {
  if (sets.length === 0) {
    return '';
  }

  const unitLabel = unit === 'kg' ? 'кг' : 'lb';
  return groupAdjacentByWeight(sets)
    .map((group) => {
      const value = trimTrailingZeros(kgToDisplay(group.weightKg, unit));
      return `${value}${unitLabel}×${group.reps.join('-')}`;
    })
    .join(' · ');
}

function trimTrailingZeros(value: number): string {
  return String(Number(value.toFixed(2)));
}
