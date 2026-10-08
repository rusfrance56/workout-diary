import { roundWeight } from '../utils/weight';

/** Epley: 1RM = weight × (1 + reps / 30). Для reps=1 возвращает вес. */
export function estimateEpley1Rm(weightKg: number, reps: number): number {
  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    return 0;
  }
  if (!Number.isFinite(reps) || reps <= 1) {
    return roundWeight(weightKg, 0.25);
  }
  return roundWeight(weightKg * (1 + reps / 30), 0.25);
}

export function setVolumeKg(weightKg: number, reps: number): number {
  if (!Number.isFinite(weightKg) || !Number.isFinite(reps)) {
    return 0;
  }
  return Math.max(0, weightKg) * Math.max(0, reps);
}

export interface HistorySet {
  setNumber: number;
  weightKg: number;
  reps: number;
}

export interface HistorySession {
  workoutId: string;
  workoutName: string;
  startedAt: string;
  sets: HistorySet[];
  volumeKg: number;
  maxWeightKg: number;
  bestE1rmKg: number;
}

export interface SessionComparison {
  volumeDeltaKg: number;
  maxWeightDeltaKg: number;
  e1rmDeltaKg: number;
}

export interface ExerciseStats {
  sessionsCount: number;
  totalVolumeKg: number;
  maxWeightKg: number;
  bestE1rmKg: number;
  workingWeightTrend: Array<{ date: string; weightKg: number }>;
}

export function summarizeSession(sets: HistorySet[]): Omit<
  HistorySession,
  'workoutId' | 'workoutName' | 'startedAt' | 'sets'
> {
  const completed = sets.filter((set) => set.reps > 0);
  const volumeKg = completed.reduce(
    (sum, set) => sum + setVolumeKg(set.weightKg, set.reps),
    0,
  );
  const maxWeightKg = completed.reduce((max, set) => Math.max(max, set.weightKg), 0);
  const bestE1rmKg = completed.reduce(
    (max, set) => Math.max(max, estimateEpley1Rm(set.weightKg, set.reps)),
    0,
  );
  return { volumeKg, maxWeightKg, bestE1rmKg };
}

export function compareSessions(
  current: Pick<HistorySession, 'volumeKg' | 'maxWeightKg' | 'bestE1rmKg'>,
  previous: Pick<HistorySession, 'volumeKg' | 'maxWeightKg' | 'bestE1rmKg'> | undefined,
): SessionComparison | null {
  if (!previous) {
    return null;
  }
  return {
    volumeDeltaKg: roundWeight(current.volumeKg - previous.volumeKg, 0.25),
    maxWeightDeltaKg: roundWeight(current.maxWeightKg - previous.maxWeightKg, 0.25),
    e1rmDeltaKg: roundWeight(current.bestE1rmKg - previous.bestE1rmKg, 0.25),
  };
}

export function computeExerciseStats(sessions: HistorySession[]): ExerciseStats {
  const newestFirst = [...sessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  const totalVolumeKg = newestFirst.reduce((sum, item) => sum + item.volumeKg, 0);
  const maxWeightKg = newestFirst.reduce((max, item) => Math.max(max, item.maxWeightKg), 0);
  const bestE1rmKg = newestFirst.reduce((max, item) => Math.max(max, item.bestE1rmKg), 0);

  const workingWeightTrend = [...newestFirst]
    .reverse()
    .map((session) => ({
      date: session.startedAt,
      weightKg: session.maxWeightKg,
    }));

  return {
    sessionsCount: newestFirst.length,
    totalVolumeKg: roundWeight(totalVolumeKg, 0.25),
    maxWeightKg,
    bestE1rmKg,
    workingWeightTrend,
  };
}
