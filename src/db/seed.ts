import type { CreateExerciseInput } from '../domain';
import { createId, nowIso } from '../utils/id';
import type { WorkoutDiaryDB } from './database';

const SEED_EXERCISES: CreateExerciseInput[] = [
  {
    name: 'Жим лёжа',
    muscleGroup: 'chest',
    equipment: 'barbell',
    defaultIncrementKg: 2.5,
  },
  {
    name: 'Приседания',
    muscleGroup: 'legs',
    equipment: 'barbell',
    defaultIncrementKg: 2.5,
  },
  {
    name: 'Становая тяга',
    muscleGroup: 'back',
    equipment: 'barbell',
    defaultIncrementKg: 2.5,
  },
  {
    name: 'Жим стоя',
    muscleGroup: 'shoulders',
    equipment: 'barbell',
    defaultIncrementKg: 2.5,
  },
  {
    name: 'Тяга штанги в наклоне',
    muscleGroup: 'back',
    equipment: 'barbell',
    defaultIncrementKg: 2.5,
  },
  {
    name: 'Подтягивания',
    muscleGroup: 'back',
    equipment: 'bodyweight',
    defaultIncrementKg: 1.25,
  },
  {
    name: 'Тяга верхнего блока',
    muscleGroup: 'back',
    equipment: 'cable',
    defaultIncrementKg: 2.5,
  },
  {
    name: 'Жим гантелей лёжа',
    muscleGroup: 'chest',
    equipment: 'dumbbell',
    defaultIncrementKg: 2,
  },
  {
    name: 'Тяга гантели в наклоне',
    muscleGroup: 'back',
    equipment: 'dumbbell',
    defaultIncrementKg: 2,
  },
  {
    name: 'Жим ногами',
    muscleGroup: 'legs',
    equipment: 'machine',
    defaultIncrementKg: 5,
  },
  {
    name: 'Сгибания ног',
    muscleGroup: 'legs',
    equipment: 'machine',
    defaultIncrementKg: 2.5,
  },
  {
    name: 'Разгибания ног',
    muscleGroup: 'legs',
    equipment: 'machine',
    defaultIncrementKg: 2.5,
  },
  {
    name: 'Сгибания на бицепс',
    muscleGroup: 'arms',
    equipment: 'dumbbell',
    defaultIncrementKg: 1,
  },
  {
    name: 'Разгибания на трицепс',
    muscleGroup: 'arms',
    equipment: 'cable',
    defaultIncrementKg: 2.5,
  },
];

export async function seedDatabase(database: WorkoutDiaryDB): Promise<void> {
  const timestamp = nowIso();

  await database.exercises.bulkAdd(
    SEED_EXERCISES.map((exercise) => ({
      ...exercise,
      id: createId(),
      createdAt: timestamp,
      updatedAt: timestamp,
    })),
  );

  await database.settings.add({
    id: 'default',
    weightUnit: 'kg',
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}
