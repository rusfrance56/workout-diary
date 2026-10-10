import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { moveId, sameOrder } from '../utils/reorder';

const ATTR = 'data-reorder-id';

export function usePointerReorder(
  baselineIds: string[],
  onCommit: (orderedIds: string[]) => void | Promise<void>,
) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOrder, setDragOrder] = useState<string[] | null>(null);
  const dragIdRef = useRef<string | null>(null);
  const dragOrderRef = useRef<string[] | null>(null);
  const baselineRef = useRef(baselineIds);

  useEffect(() => {
    baselineRef.current = baselineIds;
  }, [baselineIds]);

  const orderedIds = dragOrder ?? baselineIds;

  const handleProps = useMemo(
    () => ({
      onPointerDown: (id: string, event: ReactPointerEvent<HTMLElement>) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        const ids = [...baselineRef.current];
        dragIdRef.current = id;
        dragOrderRef.current = ids;
        setDragId(id);
        setDragOrder(ids);
      },
      onPointerMove: (event: ReactPointerEvent<HTMLElement>) => {
        const dragging = dragIdRef.current;
        const current = dragOrderRef.current;
        if (!dragging || !current) {
          return;
        }

        let overId = current[current.length - 1]!;
        for (const id of current) {
          const row = document.querySelector<HTMLElement>(`[${ATTR}="${id}"]`);
          if (!row) {
            continue;
          }
          const rect = row.getBoundingClientRect();
          if (event.clientY < rect.top + rect.height / 2) {
            overId = id;
            break;
          }
        }

        if (overId === dragging) {
          return;
        }
        const next = moveId(current, dragging, overId);
        if (sameOrder(next, current)) {
          return;
        }
        dragOrderRef.current = next;
        setDragOrder(next);
      },
      end: () => {
        const next = dragOrderRef.current;
        const baseline = baselineRef.current;
        dragIdRef.current = null;
        dragOrderRef.current = null;
        setDragId(null);
        setDragOrder(null);
        if (!next || sameOrder(next, baseline)) {
          return;
        }
        void onCommit(next);
      },
    }),
    [onCommit],
  );

  function itemAttr(id: string) {
    return { [ATTR]: id } as { 'data-reorder-id': string };
  }

  return { dragId, orderedIds, handleProps, itemAttr };
}
