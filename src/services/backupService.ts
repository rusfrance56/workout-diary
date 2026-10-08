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
import { db } from '../db/database';
import { nowIso } from '../utils/id';

const BACKUP_VERSION = 1;

export interface BackupPayload {
  version: number;
  exportedAt: string;
  exercises: Exercise[];
  programs: WorkoutProgram[];
  templates: WorkoutTemplate[];
  templateExercises: WorkoutTemplateExercise[];
  workouts: Workout[];
  workoutExercises: WorkoutExercise[];
  workoutSets: WorkoutSet[];
  settings: AppSettings[];
}

export class BackupService {
  async exportJson(): Promise<string> {
    const payload = await this.collect();
    return JSON.stringify(payload, null, 2);
  }

  async exportCsv(): Promise<string> {
    const { workouts, workoutExercises, workoutSets, exercises } = await this.collect();
    const exerciseName = new Map(exercises.map((item) => [item.id, item.name]));
    const workoutById = new Map(workouts.map((item) => [item.id, item]));
    const weById = new Map(workoutExercises.map((item) => [item.id, item]));

    const lines = [
      'workoutId,workoutName,startedAt,finishedAt,exerciseId,exerciseName,setNumber,weightKg,reps,completed,skipped,notes',
    ];

    for (const set of workoutSets) {
      const we = weById.get(set.workoutExerciseId);
      if (!we) {
        continue;
      }
      const workout = workoutById.get(we.workoutId);
      if (!workout) {
        continue;
      }
      lines.push(
        [
          csvCell(workout.id),
          csvCell(workout.name),
          csvCell(workout.startedAt),
          csvCell(workout.finishedAt ?? ''),
          csvCell(we.exerciseId),
          csvCell(we.exerciseNameSnapshot || exerciseName.get(we.exerciseId) || ''),
          String(set.setNumber),
          String(set.weightKg),
          String(set.reps),
          set.completed ? '1' : '0',
          we.skipped ? '1' : '0',
          csvCell(workout.notes ?? ''),
        ].join(','),
      );
    }

    return lines.join('\n');
  }

  async importJson(raw: string): Promise<void> {
    const parsed = JSON.parse(raw) as BackupPayload;
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.workouts)) {
      throw new Error('Некорректный файл бэкапа');
    }

    await db.transaction(
      'rw',
      db.exercises,
      db.programs,
      db.templates,
      db.templateExercises,
      db.workouts,
      db.workoutExercises,
      db.workoutSets,
      db.settings,
      async () => {
        await Promise.all([
          db.workoutSets.clear(),
          db.workoutExercises.clear(),
          db.workouts.clear(),
          db.templateExercises.clear(),
          db.templates.clear(),
          db.programs.clear(),
          db.exercises.clear(),
          db.settings.clear(),
        ]);

        if (parsed.exercises?.length) {
          await db.exercises.bulkAdd(parsed.exercises);
        }
        if (parsed.programs?.length) {
          await db.programs.bulkAdd(parsed.programs);
        }
        if (parsed.templates?.length) {
          await db.templates.bulkAdd(parsed.templates);
        }
        if (parsed.templateExercises?.length) {
          await db.templateExercises.bulkAdd(parsed.templateExercises);
        }
        if (parsed.workouts?.length) {
          await db.workouts.bulkAdd(parsed.workouts);
        }
        if (parsed.workoutExercises?.length) {
          await db.workoutExercises.bulkAdd(parsed.workoutExercises);
        }
        if (parsed.workoutSets?.length) {
          await db.workoutSets.bulkAdd(parsed.workoutSets);
        }
        if (parsed.settings?.length) {
          await db.settings.bulkAdd(parsed.settings);
        }
      },
    );
  }

  private async collect(): Promise<BackupPayload> {
    const [
      exercises,
      programs,
      templates,
      templateExercises,
      workouts,
      workoutExercises,
      workoutSets,
      settings,
    ] = await Promise.all([
      db.exercises.toArray(),
      db.programs.toArray(),
      db.templates.toArray(),
      db.templateExercises.toArray(),
      db.workouts.toArray(),
      db.workoutExercises.toArray(),
      db.workoutSets.toArray(),
      db.settings.toArray(),
    ]);

    return {
      version: BACKUP_VERSION,
      exportedAt: nowIso(),
      exercises,
      programs,
      templates,
      templateExercises,
      workouts,
      workoutExercises,
      workoutSets,
      settings,
    };
  }
}

export const backupService = new BackupService();

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function downloadTextFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
