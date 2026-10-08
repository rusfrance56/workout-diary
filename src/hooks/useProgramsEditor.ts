import { useCallback, useEffect, useState } from 'react';
import type { ProgramWithTemplates } from '../db/repositories/programRepository';
import {
  programService,
  type AddDayExerciseInput,
  type CreateDayInput,
  type CreateProgramInput,
  type UpdateDayExerciseInput,
} from '../services/programService';

export function useProgramsList() {
  const [programs, setPrograms] = useState<ProgramWithTemplates[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    const items = await programService.getAll();
    setPrograms(items);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void programService
      .getAll()
      .then((items) => {
        if (!cancelled) {
          setPrograms(items);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Не удалось загрузить');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const create = useCallback(
    async (input: CreateProgramInput) => {
      const program = await programService.createProgram(input);
      await refresh();
      return program;
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      await programService.deleteProgram(id);
      await refresh();
    },
    [refresh],
  );

  return { programs, loading, error, refresh, create, remove };
}

export function useProgramDetails(programId: string | undefined) {
  const [details, setDetails] = useState<ProgramWithTemplates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!programId) {
      setDetails(null);
      setLoading(false);
      return;
    }
    const next = await programService.getById(programId);
    setDetails(next ?? null);
    setError(next ? null : 'Программа не найдена');
    setLoading(false);
  }, [programId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!programId) {
        if (!cancelled) {
          setLoading(false);
        }
        return;
      }
      try {
        const next = await programService.getById(programId);
        if (!cancelled) {
          setDetails(next ?? null);
          setError(next ? null : 'Программа не найдена');
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Ошибка загрузки');
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [programId]);

  const rename = useCallback(
    async (name: string) => {
      if (!programId) {
        return;
      }
      await programService.renameProgram(programId, name);
      await refresh();
    },
    [programId, refresh],
  );

  const addDay = useCallback(
    async (input: CreateDayInput) => {
      if (!programId) {
        throw new Error('Нет программы');
      }
      const day = await programService.addDay(programId, input);
      await refresh();
      return day;
    },
    [programId, refresh],
  );

  const removeDay = useCallback(
    async (templateId: string) => {
      await programService.deleteDay(templateId);
      await refresh();
    },
    [refresh],
  );

  const moveDay = useCallback(
    async (templateId: string, direction: -1 | 1) => {
      await programService.moveDay(templateId, direction);
      await refresh();
    },
    [refresh],
  );

  return { details, loading, error, refresh, rename, addDay, removeDay, moveDay };
}

export function useTemplateEditor(templateId: string | undefined) {
  const [data, setData] = useState<Awaited<
    ReturnType<typeof programService.getTemplateDetails>
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!templateId) {
      setData(null);
      setLoading(false);
      return;
    }
    const next = await programService.getTemplateDetails(templateId);
    setData(next);
    setError(next ? null : 'День не найден');
    setLoading(false);
  }, [templateId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!templateId) {
        if (!cancelled) {
          setLoading(false);
        }
        return;
      }
      try {
        const next = await programService.getTemplateDetails(templateId);
        if (!cancelled) {
          setData(next);
          setError(next ? null : 'День не найден');
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Ошибка загрузки');
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [templateId]);

  const rename = useCallback(
    async (name: string) => {
      if (!templateId) {
        return;
      }
      await programService.renameDay(templateId, name);
      await refresh();
    },
    [templateId, refresh],
  );

  const addExercise = useCallback(
    async (input: AddDayExerciseInput) => {
      if (!templateId) {
        throw new Error('Нет дня');
      }
      const item = await programService.addExercise(templateId, input);
      await refresh();
      return item;
    },
    [templateId, refresh],
  );

  const updateExercise = useCallback(
    async (id: string, input: UpdateDayExerciseInput) => {
      await programService.updateExercise(id, input);
      await refresh();
    },
    [refresh],
  );

  const removeExercise = useCallback(
    async (id: string) => {
      await programService.removeExercise(id);
      await refresh();
    },
    [refresh],
  );

  const moveExercise = useCallback(
    async (id: string, direction: -1 | 1) => {
      await programService.moveExercise(id, direction);
      await refresh();
    },
    [refresh],
  );

  const reorderExercises = useCallback(
    async (orderedIds: string[]) => {
      if (!templateId) {
        return;
      }
      await programService.reorderExercises(templateId, orderedIds);
      await refresh();
    },
    [templateId, refresh],
  );

  return {
    data,
    loading,
    error,
    refresh,
    rename,
    addExercise,
    updateExercise,
    removeExercise,
    moveExercise,
    reorderExercises,
  };
}
