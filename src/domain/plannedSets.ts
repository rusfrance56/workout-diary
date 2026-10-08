import type { PlannedSet } from './types';

export function normalizePlannedSets(
  sets: Array<{ weightKg: number; reps: number }>,
): PlannedSet[] {
  const safe = sets.length > 0 ? sets : [{ weightKg: 0, reps: 8 }];
  return safe.map((set, index) => ({
    setNumber: index + 1,
    weightKg: Number.isFinite(set.weightKg) ? Math.max(0, set.weightKg) : 0,
    reps: Math.max(1, Math.round(set.reps) || 1),
  }));
}

export function deriveTargetsFromPlannedSets(plannedSets: PlannedSet[]): {
  targetSets: number;
  minReps: number;
  maxReps: number;
} {
  const reps = plannedSets.map((set) => set.reps);
  const minReps = Math.min(...reps);
  const maxReps = Math.max(...reps);
  return {
    targetSets: plannedSets.length,
    minReps,
    maxReps: maxReps >= minReps ? maxReps : minReps,
  };
}

/** Для старых записей без plannedSets. */
export function ensurePlannedSets(item: {
  plannedSets?: PlannedSet[];
  targetSets: number;
  minReps: number;
  maxReps: number;
}): PlannedSet[] {
  if (item.plannedSets && item.plannedSets.length > 0) {
    return normalizePlannedSets(item.plannedSets);
  }

  const count = Math.max(1, item.targetSets || 1);
  const reps = Math.max(1, item.minReps || 8);
  return Array.from({ length: count }, (_, index) => ({
    setNumber: index + 1,
    weightKg: 0,
    reps,
  }));
}
