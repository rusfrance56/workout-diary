import type {
  HistorySession,
  ProgressionRecommendation,
  ProgressionTarget,
  Workout,
  WorkoutSet,
  WorkoutTemplateExercise,
} from '../domain';
import {
  applyProgressionToSuggestions,
  compareSessions,
  computeExerciseStats,
  ensurePlannedSets,
  markSetCompleted,
  markSetUncompleted,
  recommendDoubleProgression,
  summarizeSession,
} from '../domain';
import { createId, nowIso } from '../utils/id';
import { exerciseRepository } from '../db/repositories/dexieExerciseRepository';
import { programRepository } from '../db/repositories/programRepository';
import {
  buildNewSet,
  workoutRepository,
  type PreviousSetSuggestion,
  type WorkoutDetails,
} from '../db/repositories/workoutRepository';

export class WorkoutService {
  getActive(): Promise<Workout | undefined> {
    return workoutRepository.getActive();
  }

  getRecent(limit = 5): Promise<Workout[]> {
    return workoutRepository.getRecent(limit);
  }

  getDetails(id: string): Promise<WorkoutDetails | undefined> {
    return workoutRepository.getDetails(id);
  }

  getPrograms() {
    return programRepository.getAllWithTemplates();
  }

  async startFromTemplate(templateId: string): Promise<Workout> {
    const active = await workoutRepository.getActive();
    if (active) {
      throw new Error('Уже есть незавершённая тренировка. Продолжите её или завершите.');
    }

    const template = await programRepository.getTemplateById(templateId);
    if (!template) {
      throw new Error('Шаблон тренировки не найден');
    }

    const templateExercises = await programRepository.getTemplateExercises(templateId);
    if (templateExercises.length === 0) {
      throw new Error('В шаблоне нет упражнений');
    }

    const timestamp = nowIso();
    const workout: Workout = {
      id: createId(),
      templateId: template.id,
      name: template.name,
      startedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await workoutRepository.create(workout);

    for (const templateExercise of templateExercises) {
      const exercise = await exerciseRepository.getById(templateExercise.exerciseId);
      if (!exercise) {
        continue;
      }

      const workoutExercise = {
        id: createId(),
        workoutId: workout.id,
        exerciseId: exercise.id,
        order: templateExercise.order,
        exerciseNameSnapshot: exercise.name,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      await workoutRepository.addExercise(workoutExercise);

      const previous = await workoutRepository.getPreviousCompletedSets(
        exercise.id,
        workout.startedAt,
      );

      const sets = createSuggestedSets(workoutExercise.id, templateExercise, previous);
      await workoutRepository.addSets(sets);
    }

    return workout;
  }

  async getProgressionRecommendation(
    workoutId: string,
    workoutExerciseId: string,
  ): Promise<ProgressionRecommendation | null> {
    const details = await workoutRepository.getDetails(workoutId);
    const entry = details?.exercises.find((item) => item.exercise.id === workoutExerciseId);
    if (!details || !entry) {
      return null;
    }

    const target = await this.resolveProgressionTarget(
      details.workout.templateId,
      entry.exercise.exerciseId,
    );
    if (!target) {
      return null;
    }

    return recommendDoubleProgression(entry.sets, target);
  }

  private async resolveProgressionTarget(
    templateId: string | undefined,
    exerciseId: string,
  ): Promise<ProgressionTarget | null> {
    if (!templateId) {
      return null;
    }

    const templateExercise = await programRepository.getTemplateExercise(templateId, exerciseId);
    if (!templateExercise) {
      return null;
    }

    const planned = ensurePlannedSets(templateExercise);
    return toProgressionTarget(templateExercise, planned.length);
  }

  async completeSet(
    setId: string,
    input: { weightKg: number; reps: number; rir?: number; rpe?: number },
  ): Promise<WorkoutSet> {
    const set = await workoutRepository.getSetById(setId);
    if (!set) {
      throw new Error('Подход не найден');
    }

    const timestamp = nowIso();
    const siblings = await workoutRepository.getSetsByWorkoutExercise(set.workoutExerciseId);
    const withValues = siblings.map((item) =>
      item.id === setId
        ? {
            ...item,
            weightKg: input.weightKg,
            reps: input.reps,
            rir: input.rir,
            rpe: input.rpe,
          }
        : item,
    );
    const timed = markSetCompleted(withValues, setId, timestamp).map((item) => ({
      ...item,
      updatedAt: timestamp,
    }));

    await workoutRepository.updateSets(timed);
    const updated = timed.find((item) => item.id === setId);
    if (!updated) {
      throw new Error('Подход не найден');
    }
    return updated;
  }

  async updateSetDraft(
    setId: string,
    input: { weightKg: number; reps: number; rir?: number; rpe?: number },
  ): Promise<WorkoutSet> {
    const set = await workoutRepository.getSetById(setId);
    if (!set) {
      throw new Error('Подход не найден');
    }

    const updated: WorkoutSet = {
      ...set,
      weightKg: input.weightKg,
      reps: input.reps,
      rir: input.rir,
      rpe: input.rpe,
      updatedAt: nowIso(),
    };

    await workoutRepository.updateSet(updated);
    return updated;
  }

  async uncompleteSet(setId: string): Promise<WorkoutSet> {
    const set = await workoutRepository.getSetById(setId);
    if (!set) {
      throw new Error('Подход не найден');
    }

    const timestamp = nowIso();
    const siblings = await workoutRepository.getSetsByWorkoutExercise(set.workoutExerciseId);
    const timed = markSetUncompleted(siblings, setId).map((item) => ({
      ...item,
      updatedAt: timestamp,
    }));

    await workoutRepository.updateSets(timed);
    const updated = timed.find((item) => item.id === setId);
    if (!updated) {
      throw new Error('Подход не найден');
    }
    return updated;
  }

  async addSet(workoutExerciseId: string): Promise<WorkoutSet> {
    const workoutExercise = await workoutRepository.getWorkoutExerciseById(workoutExerciseId);
    if (!workoutExercise) {
      throw new Error('Упражнение тренировки не найдено');
    }

    const details = await workoutRepository.getDetails(workoutExercise.workoutId);
    const entry = details?.exercises.find((item) => item.exercise.id === workoutExerciseId);
    if (!entry) {
      throw new Error('Упражнение тренировки не найдено');
    }

    const last = entry.sets[entry.sets.length - 1];
    const set = buildNewSet({
      workoutExerciseId,
      setNumber: entry.sets.length + 1,
      weightKg: last?.weightKg ?? 0,
      reps: last?.reps ?? 0,
      completed: false,
    });

    await workoutRepository.addSet(set);
    return set;
  }

  async updateNotes(workoutId: string, notes: string): Promise<Workout> {
    const workout = await workoutRepository.getById(workoutId);
    if (!workout) {
      throw new Error('Тренировка не найдена');
    }

    const updated: Workout = {
      ...workout,
      notes: notes.trim() || undefined,
      updatedAt: nowIso(),
    };
    await workoutRepository.update(updated);
    return updated;
  }

  async updateExerciseNotes(workoutExerciseId: string, notes: string): Promise<void> {
    const workoutExercise = await workoutRepository.getWorkoutExerciseById(workoutExerciseId);
    if (!workoutExercise) {
      throw new Error('Упражнение тренировки не найдено');
    }

    await workoutRepository.updateExercise({
      ...workoutExercise,
      notes: notes.trim() || undefined,
      updatedAt: nowIso(),
    });
  }

  async skipExercise(workoutExerciseId: string): Promise<void> {
    const workoutExercise = await workoutRepository.getWorkoutExerciseById(workoutExerciseId);
    if (!workoutExercise) {
      throw new Error('Упражнение тренировки не найдено');
    }

    await workoutRepository.updateExercise({
      ...workoutExercise,
      skipped: true,
      updatedAt: nowIso(),
    });
  }

  async unskipExercise(workoutExerciseId: string): Promise<void> {
    const workoutExercise = await workoutRepository.getWorkoutExerciseById(workoutExerciseId);
    if (!workoutExercise) {
      throw new Error('Упражнение тренировки не найдено');
    }

    await workoutRepository.updateExercise({
      ...workoutExercise,
      skipped: false,
      updatedAt: nowIso(),
    });
  }

  async replaceExercise(workoutExerciseId: string, newExerciseId: string): Promise<void> {
    const workoutExercise = await workoutRepository.getWorkoutExerciseById(workoutExerciseId);
    if (!workoutExercise) {
      throw new Error('Упражнение тренировки не найдено');
    }

    const exercise = await exerciseRepository.getById(newExerciseId);
    if (!exercise) {
      throw new Error('Упражнение не найдено');
    }

    const workout = await workoutRepository.getById(workoutExercise.workoutId);
    if (!workout) {
      throw new Error('Тренировка не найдена');
    }

    const previousName = workoutExercise.exerciseNameSnapshot;
    const timestamp = nowIso();

    await workoutRepository.updateExercise({
      ...workoutExercise,
      exerciseId: exercise.id,
      exerciseNameSnapshot: exercise.name,
      skipped: false,
      replacedFromName:
        workoutExercise.replacedFromName ??
        (previousName !== exercise.name ? previousName : undefined),
      updatedAt: timestamp,
    });

    await workoutRepository.deleteSetsByWorkoutExercise(workoutExerciseId);

    const previous = await workoutRepository.getPreviousCompletedSets(
      exercise.id,
      workout.startedAt,
    );

    let templateExercise: WorkoutTemplateExercise | undefined;
    if (workout.templateId) {
      templateExercise = await programRepository.getTemplateExercise(
        workout.templateId,
        exercise.id,
      );
    }

    const sets =
      templateExercise != null
        ? createSuggestedSets(workoutExerciseId, templateExercise, previous)
        : createSetsFromPrevious(workoutExerciseId, previous);

    await workoutRepository.addSets(sets);
  }

  hasIncompleteSets(details: WorkoutDetails): boolean {
    return details.exercises.some(
      ({ exercise, sets }) =>
        !exercise.skipped && sets.some((set) => !set.completed),
    );
  }

  async finishWorkout(workoutId: string): Promise<Workout> {
    const workout = await workoutRepository.getById(workoutId);
    if (!workout) {
      throw new Error('Тренировка не найдена');
    }

    const updated: Workout = {
      ...workout,
      finishedAt: nowIso(),
      updatedAt: nowIso(),
    };
    await workoutRepository.update(updated);
    return updated;
  }

  async deleteWorkout(workoutId: string): Promise<void> {
    await workoutRepository.deleteWorkout(workoutId);
  }

  getPreviousForExercise(exerciseId: string, beforeIso: string): Promise<PreviousSetSuggestion[]> {
    return workoutRepository.getPreviousCompletedSets(exerciseId, beforeIso);
  }

  async getExerciseHistory(exerciseId: string): Promise<{
    sessions: HistorySession[];
    stats: ReturnType<typeof computeExerciseStats>;
  }> {
    const entries = await workoutRepository.getExerciseHistory(exerciseId);
    const sessions: HistorySession[] = entries.map((entry) => {
      const sets = entry.sets.map((set) => ({
        setNumber: set.setNumber,
        weightKg: set.weightKg,
        reps: set.reps,
      }));
      return {
        workoutId: entry.workoutId,
        workoutName: entry.workoutName,
        startedAt: entry.startedAt,
        sets,
        ...summarizeSession(sets),
      };
    });

    return {
      sessions,
      stats: computeExerciseStats(sessions),
    };
  }

  compareWithPrevious(sessions: HistorySession[], index: number) {
    return compareSessions(sessions[index]!, sessions[index + 1]);
  }
}

export const workoutService = new WorkoutService();

function createSuggestedSets(
  workoutExerciseId: string,
  templateExercise: WorkoutTemplateExercise,
  previous: PreviousSetSuggestion[],
): WorkoutSet[] {
  const planned = ensurePlannedSets(templateExercise);
  const target = toProgressionTarget(templateExercise, planned.length);

  if (previous.length === 0) {
    return planned.map((set) =>
      buildNewSet({
        workoutExerciseId,
        setNumber: set.setNumber,
        weightKg: set.weightKg,
        reps: set.reps,
        completed: false,
      }),
    );
  }

  const recommendation = recommendDoubleProgression(
    previous.map((set) => ({ ...set, completed: true })),
    target,
  );
  const adjusted = applyProgressionToSuggestions(previous, recommendation, planned.length);
  const count = Math.max(planned.length, adjusted.length, 1);
  const sets: WorkoutSet[] = [];

  for (let index = 0; index < count; index += 1) {
    const suggestion = adjusted[index];
    const plan = planned[index];
    sets.push(
      buildNewSet({
        workoutExerciseId,
        setNumber: index + 1,
        weightKg: suggestion?.weightKg ?? plan?.weightKg ?? 0,
        reps: suggestion?.reps ?? plan?.reps ?? templateExercise.minReps,
        completed: false,
      }),
    );
  }

  return sets;
}

function createSetsFromPrevious(
  workoutExerciseId: string,
  previous: PreviousSetSuggestion[],
): WorkoutSet[] {
  if (previous.length === 0) {
    return [
      buildNewSet({
        workoutExerciseId,
        setNumber: 1,
        weightKg: 0,
        reps: 0,
        completed: false,
      }),
    ];
  }

  return previous.map((set) =>
    buildNewSet({
      workoutExerciseId,
      setNumber: set.setNumber,
      weightKg: set.weightKg,
      reps: set.reps,
      completed: false,
    }),
  );
}

function toProgressionTarget(
  templateExercise: WorkoutTemplateExercise,
  plannedCount: number,
): ProgressionTarget {
  return {
    targetSets: plannedCount || templateExercise.targetSets,
    minReps: templateExercise.minReps,
    maxReps: templateExercise.maxReps,
    rule: templateExercise.progressionRule,
  };
}
