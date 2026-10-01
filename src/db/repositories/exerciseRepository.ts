import type { CreateExerciseInput, Exercise, UpdateExerciseInput } from '../../domain';

export interface ExerciseRepository {
  getAll(): Promise<Exercise[]>;
  getById(id: string): Promise<Exercise | undefined>;
  create(input: CreateExerciseInput): Promise<Exercise>;
  update(id: string, input: UpdateExerciseInput): Promise<Exercise>;
  delete(id: string): Promise<void>;
}
