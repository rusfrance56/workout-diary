import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { createId, nowIso } from '../../utils/id';
import { db } from '../database';
import { buildNewSet, workoutRepository } from './workoutRepository';

describe('workoutRepository', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  it('creates workout details and tracks active', async () => {
    const timestamp = nowIso();
    const workoutId = createId();
    await workoutRepository.create({
      id: workoutId,
      name: 'Тест',
      startedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    const exerciseId = createId();
    await workoutRepository.addExercise({
      id: exerciseId,
      workoutId,
      exerciseId: createId(),
      order: 1,
      exerciseNameSnapshot: 'Жим',
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    const set = buildNewSet({
      workoutExerciseId: exerciseId,
      setNumber: 1,
      weightKg: 80,
      reps: 8,
      completed: false,
    });
    await workoutRepository.addSet(set);

    const active = await workoutRepository.getActive();
    expect(active?.id).toBe(workoutId);

    const details = await workoutRepository.getDetails(workoutId);
    expect(details?.exercises).toHaveLength(1);
    expect(details?.exercises[0]?.sets).toHaveLength(1);
    expect(details?.exercises[0]?.sets[0]?.weightKg).toBe(80);
  });

  it('stores completedAt and restSeconds on set update', async () => {
    const timestamp = nowIso();
    const workoutId = createId();
    await workoutRepository.create({
      id: workoutId,
      name: 'Тест',
      startedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    const workoutExerciseId = createId();
    await workoutRepository.addExercise({
      id: workoutExerciseId,
      workoutId,
      exerciseId: createId(),
      order: 1,
      exerciseNameSnapshot: 'Жим',
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    const set = buildNewSet({
      workoutExerciseId,
      setNumber: 1,
      weightKg: 60,
      reps: 10,
      completed: false,
    });
    await workoutRepository.addSet(set);

    const completedAt = nowIso();
    await workoutRepository.updateSet({
      ...set,
      completed: true,
      completedAt,
      restSeconds: 90,
      updatedAt: completedAt,
    });

    const loaded = await workoutRepository.getSetById(set.id);
    expect(loaded?.completed).toBe(true);
    expect(loaded?.completedAt).toBe(completedAt);
    expect(loaded?.restSeconds).toBe(90);
  });

  it('deletes workout with nested exercises and sets', async () => {
    const timestamp = nowIso();
    const workoutId = createId();
    await workoutRepository.create({
      id: workoutId,
      name: 'Удалить',
      startedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    const workoutExerciseId = createId();
    await workoutRepository.addExercise({
      id: workoutExerciseId,
      workoutId,
      exerciseId: createId(),
      order: 1,
      exerciseNameSnapshot: 'Тяга',
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    await workoutRepository.addSet(
      buildNewSet({
        workoutExerciseId,
        setNumber: 1,
        weightKg: 40,
        reps: 10,
        completed: false,
      }),
    );

    await workoutRepository.deleteWorkout(workoutId);

    expect(await workoutRepository.getById(workoutId)).toBeUndefined();
    expect(await workoutRepository.getSetsByWorkoutExercise(workoutExerciseId)).toEqual([]);
  });
});
