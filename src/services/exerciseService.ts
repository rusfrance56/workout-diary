import type { CreateExerciseInput, Exercise, UpdateExerciseInput } from '../domain';
import { exerciseRepository } from '../db/repositories/dexieExerciseRepository';
import type { ExerciseRepository } from '../db/repositories/exerciseRepository';

export class ExerciseService {
  private readonly repository: ExerciseRepository;

  constructor(repository: ExerciseRepository = exerciseRepository) {
    this.repository = repository;
  }

  getAll(): Promise<Exercise[]> {
    return this.repository.getAll();
  }

  getById(id: string): Promise<Exercise | undefined> {
    return this.repository.getById(id);
  }

  create(input: CreateExerciseInput): Promise<Exercise> {
    const name = input.name.trim();
    if (!name) {
      throw new Error('Название упражнения обязательно');
    }

    return this.repository.create({
      ...input,
      name,
      notes: input.notes?.trim() || undefined,
      defaultIncrementKg: input.defaultIncrementKg > 0 ? input.defaultIncrementKg : 2.5,
    });
  }

  update(id: string, input: UpdateExerciseInput): Promise<Exercise> {
    if (input.name !== undefined && !input.name.trim()) {
      throw new Error('Название упражнения обязательно');
    }

    return this.repository.update(id, {
      ...input,
      name: input.name?.trim(),
      notes: input.notes?.trim() || undefined,
    });
  }

  delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}

export const exerciseService = new ExerciseService();
