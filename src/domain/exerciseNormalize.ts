import type { Exercise, MuscleGroup } from './types';
import { MUSCLE_GROUPS } from './labels';

const LEGACY_MUSCLE_MAP: Record<string, MuscleGroup> = {
  back: 'lats',
  shoulders: 'sideShoulders',
  legs: 'quads',
  arms: 'biceps',
  core: 'abs',
  fullBody: 'other',
};

const KNOWN = new Set<string>(MUSCLE_GROUPS);

export function normalizeMuscleGroup(value: string): MuscleGroup {
  if (KNOWN.has(value)) {
    return value as MuscleGroup;
  }
  return LEGACY_MUSCLE_MAP[value] ?? 'other';
}

export function normalizeMuscleGroups(groups: string[] | undefined): MuscleGroup[] {
  if (!groups?.length) {
    return [];
  }
  const unique: MuscleGroup[] = [];
  for (const group of groups) {
    const normalized = normalizeMuscleGroup(group);
    if (!unique.includes(normalized)) {
      unique.push(normalized);
    }
  }
  return unique;
}

export function normalizeExercise(exercise: Exercise): Exercise {
  const primary =
    exercise.primaryMuscleGroups?.length > 0
      ? normalizeMuscleGroups(exercise.primaryMuscleGroups)
      : ([normalizeMuscleGroup(exercise.muscleGroup ?? 'other')] as MuscleGroup[]);

  return {
    ...exercise,
    primaryMuscleGroups: primary,
    secondaryMuscleGroups: normalizeMuscleGroups(exercise.secondaryMuscleGroups).filter(
      (group) => !primary.includes(group),
    ),
    defaultIncrementKg:
      exercise.defaultIncrementKg > 0 ? exercise.defaultIncrementKg : 2.5,
    imageDataUrl: exercise.imageDataUrl || undefined,
  };
}

export function formatMuscleGroups(
  groups: MuscleGroup[],
  labels: Record<MuscleGroup, string>,
): string {
  if (!groups.length) {
    return '—';
  }
  return groups.map((group) => labels[group] ?? group).join(', ');
}
