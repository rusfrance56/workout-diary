import type {
  Workout,
  WorkoutExercise,
  WorkoutSet,
} from '../../domain';
import { createId, nowIso } from '../../utils/id';
import { db } from '../database';

export interface WorkoutExerciseWithSets {
  exercise: WorkoutExercise;
  sets: WorkoutSet[];
}

export interface WorkoutDetails {
  workout: Workout;
  exercises: WorkoutExerciseWithSets[];
}

export interface PreviousSetSuggestion {
  setNumber: number;
  weightKg: number;
  reps: number;
}

export interface ExerciseHistoryEntry {
  workoutId: string;
  workoutName: string;
  startedAt: string;
  workoutExerciseId: string;
  sets: WorkoutSet[];
}

export interface WorkoutRepository {
  getById(id: string): Promise<Workout | undefined>;
  getActive(): Promise<Workout | undefined>;
  getRecent(limit: number): Promise<Workout[]>;
  getDetails(id: string): Promise<WorkoutDetails | undefined>;
  getSetById(id: string): Promise<WorkoutSet | undefined>;
  getWorkoutExerciseById(id: string): Promise<WorkoutExercise | undefined>;
  create(workout: Workout): Promise<void>;
  update(workout: Workout): Promise<void>;
  /** Переименовать все тренировки, созданные из дня программы. */
  renameByTemplateId(templateId: string, name: string): Promise<number>;
  addExercise(exercise: WorkoutExercise): Promise<void>;
  updateExercise(exercise: WorkoutExercise): Promise<void>;
  addSets(sets: WorkoutSet[]): Promise<void>;
  updateSet(set: WorkoutSet): Promise<void>;
  updateSets(sets: WorkoutSet[]): Promise<void>;
  addSet(set: WorkoutSet): Promise<void>;
  getSetsByWorkoutExercise(workoutExerciseId: string): Promise<WorkoutSet[]>;
  deleteSetsByWorkoutExercise(workoutExerciseId: string): Promise<void>;
  getPreviousCompletedSets(exerciseId: string, beforeIso: string): Promise<PreviousSetSuggestion[]>;
  getExerciseHistory(exerciseId: string): Promise<ExerciseHistoryEntry[]>;
  deleteWorkout(id: string): Promise<void>;
  getAllForBackup(): Promise<{
    workouts: Workout[];
    workoutExercises: WorkoutExercise[];
    workoutSets: WorkoutSet[];
  }>;
  replaceAllWorkoutData(data: {
    workouts: Workout[];
    workoutExercises: WorkoutExercise[];
    workoutSets: WorkoutSet[];
  }): Promise<void>;
}

export class DexieWorkoutRepository implements WorkoutRepository {
  async getById(id: string): Promise<Workout | undefined> {
    return db.workouts.get(id);
  }

  async getActive(): Promise<Workout | undefined> {
    const all = await db.workouts.orderBy('startedAt').reverse().toArray();
    return all.find((workout) => !workout.finishedAt);
  }

  async getRecent(limit: number): Promise<Workout[]> {
    return db.workouts.orderBy('startedAt').reverse().limit(limit).toArray();
  }

  async getDetails(id: string): Promise<WorkoutDetails | undefined> {
    const workout = await db.workouts.get(id);
    if (!workout) {
      return undefined;
    }

    const exercises = await db.workoutExercises.where('workoutId').equals(id).sortBy('order');
    const withSets: WorkoutExerciseWithSets[] = [];

    for (const exercise of exercises) {
      const sets = await db.workoutSets
        .where('workoutExerciseId')
        .equals(exercise.id)
        .sortBy('setNumber');
      withSets.push({ exercise, sets });
    }

    return { workout, exercises: withSets };
  }

  async getSetById(id: string): Promise<WorkoutSet | undefined> {
    return db.workoutSets.get(id);
  }

  async getWorkoutExerciseById(id: string): Promise<WorkoutExercise | undefined> {
    return db.workoutExercises.get(id);
  }

  async create(workout: Workout): Promise<void> {
    await db.workouts.add(workout);
  }

  async update(workout: Workout): Promise<void> {
    await db.workouts.put(workout);
  }

  async renameByTemplateId(templateId: string, name: string): Promise<number> {
    const matches = await db.workouts
      .filter((workout) => workout.templateId === templateId)
      .toArray();
    if (matches.length === 0) {
      return 0;
    }
    const timestamp = nowIso();
    await db.workouts.bulkPut(
      matches.map((workout) => ({
        ...workout,
        name,
        updatedAt: timestamp,
      })),
    );
    return matches.length;
  }

  async addExercise(exercise: WorkoutExercise): Promise<void> {
    await db.workoutExercises.add(exercise);
  }

  async updateExercise(exercise: WorkoutExercise): Promise<void> {
    await db.workoutExercises.put(exercise);
  }

  async addSets(sets: WorkoutSet[]): Promise<void> {
    if (sets.length === 0) {
      return;
    }
    await db.workoutSets.bulkAdd(sets);
  }

  async updateSet(set: WorkoutSet): Promise<void> {
    await db.workoutSets.put(set);
  }

  async updateSets(sets: WorkoutSet[]): Promise<void> {
    if (sets.length === 0) {
      return;
    }
    await db.workoutSets.bulkPut(sets);
  }

  async addSet(set: WorkoutSet): Promise<void> {
    await db.workoutSets.add(set);
  }

  async getSetsByWorkoutExercise(workoutExerciseId: string): Promise<WorkoutSet[]> {
    return db.workoutSets.where('workoutExerciseId').equals(workoutExerciseId).sortBy('setNumber');
  }

  async deleteSetsByWorkoutExercise(workoutExerciseId: string): Promise<void> {
    await db.workoutSets.where('workoutExerciseId').equals(workoutExerciseId).delete();
  }

  async getExerciseHistory(exerciseId: string): Promise<ExerciseHistoryEntry[]> {
    const workoutExercises = await db.workoutExercises.where('exerciseId').equals(exerciseId).toArray();
    if (workoutExercises.length === 0) {
      return [];
    }

    const workoutIds = [...new Set(workoutExercises.map((item) => item.workoutId))];
    const workouts = await db.workouts.bulkGet(workoutIds);
    const finished = workouts
      .filter((workout): workout is Workout => Boolean(workout?.finishedAt))
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt));

    const result: ExerciseHistoryEntry[] = [];
    for (const workout of finished) {
      const workoutExercise = workoutExercises.find((item) => item.workoutId === workout.id);
      if (!workoutExercise || workoutExercise.skipped) {
        continue;
      }
      const sets = await db.workoutSets
        .where('workoutExerciseId')
        .equals(workoutExercise.id)
        .sortBy('setNumber');
      const completed = sets.filter((set) => set.completed);
      if (completed.length === 0) {
        continue;
      }
      result.push({
        workoutId: workout.id,
        workoutName: workout.name,
        startedAt: workout.startedAt,
        workoutExerciseId: workoutExercise.id,
        sets: completed,
      });
    }
    return result;
  }

  async deleteWorkout(id: string): Promise<void> {
    const exercises = await db.workoutExercises.where('workoutId').equals(id).toArray();
    await db.transaction('rw', db.workouts, db.workoutExercises, db.workoutSets, async () => {
      for (const exercise of exercises) {
        await db.workoutSets.where('workoutExerciseId').equals(exercise.id).delete();
      }
      await db.workoutExercises.where('workoutId').equals(id).delete();
      await db.workouts.delete(id);
    });
  }

  async getAllForBackup(): Promise<{
    workouts: Workout[];
    workoutExercises: WorkoutExercise[];
    workoutSets: WorkoutSet[];
  }> {
    const [workouts, workoutExercises, workoutSets] = await Promise.all([
      db.workouts.toArray(),
      db.workoutExercises.toArray(),
      db.workoutSets.toArray(),
    ]);
    return { workouts, workoutExercises, workoutSets };
  }

  async replaceAllWorkoutData(data: {
    workouts: Workout[];
    workoutExercises: WorkoutExercise[];
    workoutSets: WorkoutSet[];
  }): Promise<void> {
    await db.transaction('rw', db.workouts, db.workoutExercises, db.workoutSets, async () => {
      await db.workoutSets.clear();
      await db.workoutExercises.clear();
      await db.workouts.clear();
      if (data.workouts.length) {
        await db.workouts.bulkAdd(data.workouts);
      }
      if (data.workoutExercises.length) {
        await db.workoutExercises.bulkAdd(data.workoutExercises);
      }
      if (data.workoutSets.length) {
        await db.workoutSets.bulkAdd(data.workoutSets);
      }
    });
  }

  async getPreviousCompletedSets(
    exerciseId: string,
    beforeIso: string,
  ): Promise<PreviousSetSuggestion[]> {
    const workoutExercises = await db.workoutExercises.where('exerciseId').equals(exerciseId).toArray();
    if (workoutExercises.length === 0) {
      return [];
    }

    const workoutIds = [...new Set(workoutExercises.map((item) => item.workoutId))];
    const workouts = await db.workouts.bulkGet(workoutIds);
    const finished = workouts
      .filter((workout): workout is Workout => Boolean(workout?.finishedAt))
      .filter((workout) => workout.startedAt < beforeIso)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt));

    for (const previous of finished) {
      const previousExercise = workoutExercises.find((item) => item.workoutId === previous.id);
      if (!previousExercise || previousExercise.skipped) {
        continue;
      }

      const sets = await db.workoutSets
        .where('workoutExerciseId')
        .equals(previousExercise.id)
        .sortBy('setNumber');
      const completed = sets.filter((set) => set.completed);
      if (completed.length === 0) {
        continue;
      }

      return completed.map((set) => ({
        setNumber: set.setNumber,
        weightKg: set.weightKg,
        reps: set.reps,
      }));
    }

    return [];
  }
}

export const workoutRepository = new DexieWorkoutRepository();

export function buildNewSet(partial: Omit<WorkoutSet, 'id' | 'createdAt' | 'updatedAt'>): WorkoutSet {
  const timestamp = nowIso();
  return {
    ...partial,
    id: createId(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
