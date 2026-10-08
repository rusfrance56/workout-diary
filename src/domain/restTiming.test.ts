import { describe, expect, it } from 'vitest';
import {
  REST_BATCH_GAP_SEC,
  REST_MAX_SEC,
  markSetCompleted,
  markSetUncompleted,
  recalculateRestSeconds,
  secondsBetween,
} from './restTiming';

function set(
  id: string,
  setNumber: number,
  completedAt?: string,
  completed = Boolean(completedAt),
) {
  return { id, setNumber, completed, completedAt, restSeconds: undefined as number | undefined };
}

describe('restTiming', () => {
  it('assigns rest from previous set', () => {
    const t0 = '2026-10-08T10:00:00.000Z';
    const t1 = '2026-10-08T10:03:00.000Z';
    const result = recalculateRestSeconds([
      set('a', 1, t0),
      set('b', 2, t1),
    ]);
    expect(result[0]!.restSeconds).toBeUndefined();
    expect(result[1]!.restSeconds).toBe(180);
  });

  it('splits rest across a rapid batch', () => {
    const t0 = '2026-10-08T10:00:00.000Z';
    const t1 = '2026-10-08T10:03:00.000Z';
    const t2 = '2026-10-08T10:03:05.000Z';
    const t3 = '2026-10-08T10:03:10.000Z';
    expect(secondsBetween(t1, t2)).toBeLessThan(REST_BATCH_GAP_SEC);

    const result = recalculateRestSeconds([
      set('a', 1, t0),
      set('b', 2, t1),
      set('c', 3, t2),
      set('d', 4, t3),
    ]);

    expect(result[0]!.restSeconds).toBeUndefined();
    // span t0→t3 = 190s, batch {b,c,d} → ~63 each
    expect(result[1]!.restSeconds).toBe(63);
    expect(result[2]!.restSeconds).toBe(63);
    expect(result[3]!.restSeconds).toBe(63);
  });

  it('drops rest above upper bound', () => {
    const t0 = '2026-10-08T10:00:00.000Z';
    const later = new Date(Date.parse(t0) + (REST_MAX_SEC + 60) * 1000).toISOString();
    const result = recalculateRestSeconds([set('a', 1, t0), set('b', 2, later)]);
    expect(result[1]!.restSeconds).toBeUndefined();
  });

  it('mark complete / uncomplete recalculates', () => {
    const t0 = '2026-10-08T10:00:00.000Z';
    const t1 = '2026-10-08T10:02:00.000Z';
    let sets = [set('a', 1), set('b', 2)];
    sets = markSetCompleted(sets, 'a', t0);
    sets = markSetCompleted(sets, 'b', t1);
    expect(sets[1]!.restSeconds).toBe(120);

    sets = markSetUncompleted(sets, 'a');
    expect(sets[0]!.completed).toBe(false);
    expect(sets[0]!.completedAt).toBeUndefined();
    expect(sets[1]!.restSeconds).toBeUndefined();
  });
});
