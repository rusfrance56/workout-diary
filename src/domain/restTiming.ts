/** Соседние «Готово» ближе этого порога считаются одной пачкой логирования. */
export const REST_BATCH_GAP_SEC = 25;

/**
 * Если от якоря до конца пачки больше — пользователь скорее ушёл / забыл.
 * Не пишем в restSeconds, чтобы не портить средние.
 */
export const REST_MAX_SEC = 20 * 60;

export interface TimedSet {
  id: string;
  setNumber: number;
  completed: boolean;
  completedAt?: string;
  restSeconds?: number;
}

export function secondsBetween(fromIso: string, toIso: string): number {
  const from = Date.parse(fromIso);
  const to = Date.parse(toIso);
  if (!Number.isFinite(from) || !Number.isFinite(to)) {
    return 0;
  }
  return Math.max(0, Math.round((to - from) / 1000));
}

/** Пересчитать restSeconds у всех завершённых подходов упражнения. */
export function recalculateRestSeconds<T extends TimedSet>(sets: T[]): T[] {
  const byId = new Map(sets.map((set) => [set.id, { ...set }]));
  const completed = [...byId.values()]
    .filter((set) => set.completed && set.completedAt)
    .sort((a, b) => {
      const byTime = a.completedAt!.localeCompare(b.completedAt!);
      if (byTime !== 0) {
        return byTime;
      }
      return a.setNumber - b.setNumber;
    });

  for (const set of byId.values()) {
    if (!set.completed) {
      set.completedAt = undefined;
      set.restSeconds = undefined;
    } else {
      set.restSeconds = undefined;
    }
  }

  if (completed.length === 0) {
    return sets.map((set) => byId.get(set.id)!);
  }

  const batches: TimedSet[][] = [];
  for (const set of completed) {
    const current = byId.get(set.id)!;
    const lastBatch = batches[batches.length - 1];
    if (!lastBatch) {
      batches.push([current]);
      continue;
    }
    const prev = lastBatch[lastBatch.length - 1]!;
    const gap = secondsBetween(prev.completedAt!, current.completedAt!);
    if (gap < REST_BATCH_GAP_SEC) {
      lastBatch.push(current);
    } else {
      batches.push([current]);
    }
  }

  let previousAnchorAt: string | undefined;
  for (const batch of batches) {
    const last = batch[batch.length - 1]!;
    if (!previousAnchorAt) {
      for (const item of batch) {
        byId.get(item.id)!.restSeconds = undefined;
      }
    } else {
      const span = secondsBetween(previousAnchorAt, last.completedAt!);
      if (span > REST_MAX_SEC) {
        for (const item of batch) {
          byId.get(item.id)!.restSeconds = undefined;
        }
      } else {
        const share = Math.round(span / batch.length);
        for (const item of batch) {
          byId.get(item.id)!.restSeconds = share;
        }
      }
    }
    previousAnchorAt = last.completedAt;
  }

  return sets.map((set) => byId.get(set.id)!);
}

export function markSetCompleted<T extends TimedSet>(
  sets: T[],
  setId: string,
  completedAtIso: string,
): T[] {
  const next = sets.map((set) =>
    set.id === setId
      ? {
          ...set,
          completed: true,
          completedAt: completedAtIso,
          restSeconds: undefined,
        }
      : { ...set },
  );
  return recalculateRestSeconds(next);
}

export function markSetUncompleted<T extends TimedSet>(sets: T[], setId: string): T[] {
  const next = sets.map((set) =>
    set.id === setId
      ? {
          ...set,
          completed: false,
          completedAt: undefined,
          restSeconds: undefined,
        }
      : { ...set },
  );
  return recalculateRestSeconds(next);
}
