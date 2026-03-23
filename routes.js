const routeCounts = new Map();

export function trackRoute(fromAddr, toAddr) {
  const key = `${fromAddr} -> ${toAddr}`;
  const current = routeCounts.get(key) || 0;
  const next = current + 1;

  routeCounts.set(key, next);

  return {
    routeKey: key,
    routeCount: next
  };
}
