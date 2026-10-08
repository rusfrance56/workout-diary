export type WeightUnit = 'kg' | 'lb';

export type ThemeMode = 'light' | 'dark';

/** Практичная таксономия как в Hevy/Strong / MusclesWorked. */
export type MuscleGroup =
  | 'chest'
  | 'lats'
  | 'upperBack'
  | 'lowerBack'
  | 'frontShoulders'
  | 'sideShoulders'
  | 'rearShoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'obliques'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'adductors'
  | 'abductors'
  | 'hipFlexors'
  | 'neck'
  | 'other';

export type Equipment = 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight' | 'other';

export type ProgressionRuleType = 'double_progression' | 'none';

export interface ProgressionRule {
  type: ProgressionRuleType;
  incrementKg: number;
}

export interface Exercise {
  id: string;
  name: string;
  primaryMuscleGroups: MuscleGroup[];
  secondaryMuscleGroups: MuscleGroup[];
  notes?: string;
  /** data URL (опционально) */
  imageDataUrl?: string;
  /** Для прогрессии, в UI не показывается */
  defaultIncrementKg: number;
  createdAt: string;
  updatedAt: string;
  /** @deprecated старые записи */
  muscleGroup?: MuscleGroup;
  /** @deprecated старые записи */
  equipment?: Equipment;
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

/** Плановый подход в дне программы (вес/повторы как в тренировке). */
export interface PlannedSet {
  setNumber: number;
  weightKg: number;
  reps: number;
}

export interface WorkoutTemplateExercise {
  id: string;
  templateId: string;
  exerciseId: string;
  order: number;
  /** Синхронизируется с plannedSets.length */
  targetSets: number;
  minReps: number;
  maxReps: number;
  targetRir?: number;
  progressionRule: ProgressionRule;
  plannedSets: PlannedSet[];
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
  skipped?: boolean;
  replacedFromName?: string;
  /** Личные комментарии к упражнению в этой тренировке */
  notes?: string;
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
  /** Момент нажатия «Готово» */
  completedAt?: string;
  /**
   * Расчётный отдых до подхода (сек).
   * Пачка быстрых «Готово» делит интервал поровну; свыше REST_MAX_SEC — не пишем.
   */
  restSeconds?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  id: 'default';
  weightUnit: WeightUnit;
  theme: ThemeMode;
  createdAt: string;
  updatedAt: string;
}

export type CreateExerciseInput = Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateExerciseInput = Partial<Omit<Exercise, 'id' | 'createdAt'>>;
