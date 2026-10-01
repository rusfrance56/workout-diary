import type { CreateExerciseInput, Exercise, UpdateExerciseInput } from '../../domain';
import { createId, nowIso } from '../../utils/id';
import { db } from '../database';
import type { ExerciseRepository } from './exerciseRepository';

export class DexieExerciseRepository implements ExerciseRepository {
  async getAll(): Promise<Exercise[]> {
    return db.exercises.orderBy('name').toArray();
  }

  async getById(id: string): Promise<Exercise | undefined> {
    return db.exercises.get(id);
  }

  async create(input: CreateExerciseInput): Promise<Exercise> {
    const timestamp = nowIso();
    const exercise: Exercise = {
      ...input,
      id: createId(),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await db.exercises.add(exercise);
    return exercise;
  }

  async update(id: string, input: UpdateExerciseInput): Promise<Exercise> {
    const existing = await db.exercises.get(id);
    if (!existing) {
      throw new Error(`Упражнение не найдено: ${id}`);
    }

    const updated: Exercise = {
      ...existing,
      ...input,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: nowIso(),
    };

    await db.exercises.put(updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    await db.exercises.delete(id);
  }
}

export const exerciseRepository = new DexieExerciseRepository();
