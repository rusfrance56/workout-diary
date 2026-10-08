import type { ProgressionRule } from './types';

export interface ProgressionTarget {
  targetSets: number;
  minReps: number;
  maxReps: number;
  rule: ProgressionRule;
}

export interface ProgressionSetInput {
  weightKg: number;
  reps: number;
  completed: boolean;
}

export type ProgressionAction = 'increase_weight' | 'hold_weight' | 'none' | 'incomplete';

export interface ProgressionRecommendation {
  action: ProgressionAction;
  currentWeightKg: number;
  recommendedWeightKg: number;
  recommendedReps: number;
  incrementKg: number;
  minReps: number;
  maxReps: number;
  targetSets: number;
  messageRu: string;
}

/**
 * Double progression: сначала добиваем maxReps во всех целевых подходах,
 * затем повышаем вес на incrementKg и снова начинаем с minReps.
 */
export function recommendDoubleProgression(
  sets: ProgressionSetInput[],
  target: ProgressionTarget,
): ProgressionRecommendation {
  const incrementKg = resolveIncrement(target.rule);
  const base = {
    incrementKg,
    minReps: target.minReps,
    maxReps: target.maxReps,
    targetSets: target.targetSets,
  };

  if (target.rule.type === 'none') {
    const weightKg = firstCompletedWeight(sets);
    return {
      ...base,
      action: 'none',
      currentWeightKg: weightKg,
      recommendedWeightKg: weightKg,
      recommendedReps: target.minReps,
      messageRu: 'Прогрессия для этого упражнения не задана',
    };
  }

  const completed = sets.filter((set) => set.completed);
  if (completed.length < target.targetSets) {
    const weightKg = firstCompletedWeight(sets);
    return {
      ...base,
      action: 'incomplete',
      currentWeightKg: weightKg,
      recommendedWeightKg: weightKg,
      recommendedReps: target.minReps,
      messageRu: `Цель: ${target.targetSets}×${target.minReps}–${target.maxReps}. Завершите подходы`,
    };
  }

  const evaluated = completed.slice(0, target.targetSets);
  const currentWeightKg = pickWorkingWeight(evaluated);
  const allHitMax = evaluated.every((set) => set.reps >= target.maxReps);

  if (allHitMax) {
    const recommendedWeightKg = roundKg(currentWeightKg + incrementKg);
    return {
      ...base,
      action: 'increase_weight',
      currentWeightKg,
      recommendedWeightKg,
      recommendedReps: target.minReps,
      messageRu: `Все подходы на ${target.maxReps}+ → следующий вес ${formatKg(recommendedWeightKg)} (+${formatKg(incrementKg)})`,
    };
  }

  return {
    ...base,
    action: 'hold_weight',
    currentWeightKg,
    recommendedWeightKg: currentWeightKg,
    recommendedReps: target.maxReps,
    messageRu: `Держите ${formatKg(currentWeightKg)}, наращивайте повторения до ${target.maxReps}`,
  };
}

export function applyProgressionToSuggestions(
  previous: Array<{ weightKg: number; reps: number }>,
  recommendation: ProgressionRecommendation,
  targetSets: number,
): Array<{ weightKg: number; reps: number }> {
  if (previous.length === 0) {
    return [];
  }

  if (recommendation.action === 'increase_weight') {
    const count = Math.max(targetSets, previous.length);
    return Array.from({ length: count }, () => ({
      weightKg: recommendation.recommendedWeightKg,
      reps: recommendation.recommendedReps,
    }));
  }

  return previous.map((set) => ({ weightKg: set.weightKg, reps: set.reps }));
}

function resolveIncrement(rule: ProgressionRule): number {
  if (rule.type === 'none') {
    return 0;
  }
  return rule.incrementKg > 0 ? rule.incrementKg : 2.5;
}

function firstCompletedWeight(sets: ProgressionSetInput[]): number {
  return sets.find((set) => set.completed)?.weightKg ?? 0;
}

function pickWorkingWeight(sets: ProgressionSetInput[]): number {
  const counts = new Map<number, number>();
  for (const set of sets) {
    counts.set(set.weightKg, (counts.get(set.weightKg) ?? 0) + 1);
  }

  let bestWeight = sets[0]?.weightKg ?? 0;
  let bestCount = 0;
  for (const [weight, count] of counts) {
    if (count > bestCount) {
      bestWeight = weight;
      bestCount = count;
    }
  }
  return bestWeight;
}

function roundKg(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Number((Math.round(value / 0.25) * 0.25).toFixed(4));
}

function formatKg(value: number): string {
  return `${Number(value.toFixed(2))} кг`;
}
