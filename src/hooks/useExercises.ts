import { useCallback, useEffect, useState } from 'react';
import type { CreateExerciseInput, Exercise, UpdateExerciseInput } from '../domain';
import { exerciseService } from '../services/exerciseService';

interface UseExercisesResult {
  exercises: Exercise[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (input: CreateExerciseInput) => Promise<Exercise>;
  update: (id: string, input: UpdateExerciseInput) => Promise<Exercise>;
  remove: (id: string) => Promise<void>;
}

export function useExercises(): UseExercisesResult {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await exerciseService.getAll();
      setExercises(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить упражнения');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const items = await exerciseService.getAll();
        if (!cancelled) {
          setExercises(items);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Не удалось загрузить упражнения');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const create = useCallback(
    async (input: CreateExerciseInput) => {
      const created = await exerciseService.create(input);
      await refresh();
      return created;
    },
    [refresh],
  );

  const update = useCallback(
    async (id: string, input: UpdateExerciseInput) => {
      const updated = await exerciseService.update(id, input);
      await refresh();
      return updated;
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      await exerciseService.delete(id);
      await refresh();
    },
    [refresh],
  );

  return { exercises, loading, error, refresh, create, update, remove };
}
