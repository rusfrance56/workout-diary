import Dexie, { type EntityTable } from 'dexie';
import type {
  AppSettings,
  Exercise,
  Workout,
  WorkoutExercise,
  WorkoutProgram,
  WorkoutSet,
  WorkoutTemplate,
  WorkoutTemplateExercise,
} from '../domain';
import { seedDatabase } from './seed';

export class WorkoutDiaryDB extends Dexie {
  exercises!: EntityTable<Exercise, 'id'>;
  programs!: EntityTable<WorkoutProgram, 'id'>;
  templates!: EntityTable<WorkoutTemplate, 'id'>;
  templateExercises!: EntityTable<WorkoutTemplateExercise, 'id'>;
  workouts!: EntityTable<Workout, 'id'>;
  workoutExercises!: EntityTable<WorkoutExercise, 'id'>;
  workoutSets!: EntityTable<WorkoutSet, 'id'>;
  settings!: EntityTable<AppSettings, 'id'>;

  constructor() {
    super('WorkoutDiaryDB');

    this.version(1).stores({
      exercises: 'id, name, muscleGroup, equipment, updatedAt',
      programs: 'id, name, updatedAt',
      templates: 'id, programId, order, updatedAt',
      templateExercises: 'id, templateId, exerciseId, order, updatedAt',
      workouts: 'id, templateId, startedAt, finishedAt, updatedAt',
      workoutExercises: 'id, workoutId, exerciseId, order, updatedAt',
      workoutSets: 'id, workoutExerciseId, setNumber, completed, updatedAt',
      settings: 'id',
    });

    this.on('populate', (transaction) => {
      seedDatabase(transaction.db as WorkoutDiaryDB);
    });
  }
}

export const db = new WorkoutDiaryDB();
