export {
  type WeightUnit,
  type ThemeMode,
  type MuscleGroup,
  type Equipment,
  type ProgressionRuleType,
  type ProgressionRule,
  type Exercise,
  type WorkoutProgram,
  type WorkoutTemplate,
  type PlannedSet,
  type WorkoutTemplateExercise,
  type Workout,
  type WorkoutExercise,
  type WorkoutSet,
  type AppSettings,
  type CreateExerciseInput,
  type UpdateExerciseInput,
} from './types';

export {
  recommendDoubleProgression,
  applyProgressionToSuggestions,
  type ProgressionTarget,
  type ProgressionSetInput,
  type ProgressionAction,
  type ProgressionRecommendation,
} from './progression';

export {
  normalizePlannedSets,
  deriveTargetsFromPlannedSets,
  ensurePlannedSets,
} from './plannedSets';

export {
  normalizeExercise,
  normalizeMuscleGroup,
  normalizeMuscleGroups,
  formatMuscleGroups,
} from './exerciseNormalize';

export {
  estimateEpley1Rm,
  setVolumeKg,
  summarizeSession,
  compareSessions,
  computeExerciseStats,
  type HistorySet,
  type HistorySession,
  type SessionComparison,
  type ExerciseStats,
} from './stats';

export {
  REST_BATCH_GAP_SEC,
  REST_MAX_SEC,
  recalculateRestSeconds,
  markSetCompleted,
  markSetUncompleted,
  secondsBetween,
  type TimedSet,
} from './restTiming';
