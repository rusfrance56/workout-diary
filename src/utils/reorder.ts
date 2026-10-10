export function moveId(ids: string[], fromId: string, toId: string): string[] {
  if (fromId === toId) {
    return ids;
  }
  const from = ids.indexOf(fromId);
  const to = ids.indexOf(toId);
  if (from < 0 || to < 0) {
    return ids;
  }
  const next = [...ids];
  next.splice(from, 1);
  next.splice(to, 0, fromId);
  return next;
}

export function sameOrder(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}
