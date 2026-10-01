export type WeightUnit = 'kg' | 'lb';

export type MuscleGroup =
  'chest' | 'back' | 'shoulders' | 'legs' | 'arms' | 'core' | 'fullBody' | 'other';

export type Equipment = 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight' | 'other';

export type ProgressionRuleType = 'double_progression' | 'none';

export interface ProgressionRule {
  type: ProgressionRuleType;
  incrementKg: number;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  notes?: string;
  defaultIncrementKg: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutProgram {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutTemplate {
  id: string;
  programId: string;
  name: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutTemplateExercise {
  id: string;
  templateId: string;
  exerciseId: string;
  order: number;
  targetSets: number;
  minReps: number;
  maxReps: number;
  targetRir?: number;
  progressionRule: ProgressionRule;
  createdAt: string;
  updatedAt: string;
}

export interface Workout {
  id: string;
  templateId?: string;
  name: string;
  startedAt: string;
  finishedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutExercise {
  id: string;
  workoutId: string;
  exerciseId: string;
  order: number;
  exerciseNameSnapshot: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutSet {
  id: string;
  workoutExerciseId: string;
  setNumber: number;
  /** Вес в килограммах (каноническое хранение). UI конвертирует по weightUnit. */
  weightKg: number;
  reps: number;
  rir?: number;
  rpe?: number;
  completed: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  id: 'default';
  weightUnit: WeightUnit;
  createdAt: string;
  updatedAt: string;
}

export type CreateExerciseInput = Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateExerciseInput = Partial<Omit<Exercise, 'id' | 'createdAt'>>;
