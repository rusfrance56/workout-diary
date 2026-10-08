import { useCallback, useEffect, useState } from 'react';
import type { Workout } from '../domain';
import type { ProgramWithTemplates } from '../db/repositories/programRepository';
import type { WorkoutDetails } from '../db/repositories/workoutRepository';
import { workoutService } from '../services/workoutService';

export function useHomeWorkoutSummary() {
  const [active, setActive] = useState<Workout | null>(null);
  const [recent, setRecent] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [activeWorkout, recentWorkouts] = await Promise.all([
      workoutService.getActive(),
      workoutService.getRecent(5),
    ]);
    setActive(activeWorkout ?? null);
    setRecent(recentWorkouts);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [activeWorkout, recentWorkouts] = await Promise.all([
        workoutService.getActive(),
        workoutService.getRecent(5),
      ]);
      if (!cancelled) {
        setActive(activeWorkout ?? null);
        setRecent(recentWorkouts);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { active, recent, loading, refresh };
}

export function usePrograms() {
  const [programs, setPrograms] = useState<ProgramWithTemplates[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const items = await workoutService.getPrograms();
        if (!cancelled) {
          setPrograms(items);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Не удалось загрузить программы');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { programs, loading, error };
}

export function useWorkoutDetails(workoutId: string | undefined) {
  const [details, setDetails] = useState<WorkoutDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!workoutId) {
      setDetails(null);
      setLoading(false);
      return;
    }

    try {
      const next = await workoutService.getDetails(workoutId);
      setDetails(next ?? null);
      setError(next ? null : 'Тренировка не найдена');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [workoutId]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (!workoutId) {
        if (!cancelled) {
          setLoading(false);
        }
        return;
      }

      try {
        const next = await workoutService.getDetails(workoutId);
        if (!cancelled) {
          setDetails(next ?? null);
          setError(next ? null : 'Тренировка не найдена');
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Ошибка загрузки');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [workoutId]);

  return { details, loading, error, refresh };
}
