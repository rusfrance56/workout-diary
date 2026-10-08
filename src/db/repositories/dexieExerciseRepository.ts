import type { CreateExerciseInput, Exercise, UpdateExerciseInput } from '../../domain';
import { normalizeExercise } from '../../domain';
import { createId, nowIso } from '../../utils/id';
import { db } from '../database';
import type { ExerciseRepository } from './exerciseRepository';

export class DexieExerciseRepository implements ExerciseRepository {
  async getAll(): Promise<Exercise[]> {
    const items = await db.exercises.orderBy('name').toArray();
    return items.map(normalizeExercise);
  }

  async getById(id: string): Promise<Exercise | undefined> {
    const item = await db.exercises.get(id);
    return item ? normalizeExercise(item) : undefined;
  }

  async create(input: CreateExerciseInput): Promise<Exercise> {
    const timestamp = nowIso();
    const exercise = normalizeExercise({
      ...input,
      id: createId(),
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    await db.exercises.add(exercise);
    return exercise;
  }

  async update(id: string, input: UpdateExerciseInput): Promise<Exercise> {
    const existing = await db.exercises.get(id);
    if (!existing) {
      throw new Error(`Упражнение не найдено: ${id}`);
    }

    const updated = normalizeExercise({
      ...existing,
      ...input,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: nowIso(),
    });

    await db.exercises.put(updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    await db.exercises.delete(id);
  }
}

export const exerciseRepository = new DexieExerciseRepository();
