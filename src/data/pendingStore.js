const pending = new Map();

export function addPendingWhale(event) {
  pending.set(event.txid, event);
}

export function getPendingWhale(txid) {
  return pending.get(txid) || null;
}

export function markConfirmed(txid, blockHeight) {
  const item = pending.get(txid);
  if (!item) return null;

  const updated = {
    ...item,
    status: "confirmed",
    confirmedAt: new Date().toISOString(),
    confirmedBlockHeight: blockHeight
  };

  pending.set(txid, updated);
  return updated;
}

export function hasPendingWhale(txid) {
  return pending.has(txid);
}

export function removePendingWhale(txid) {
  pending.delete(txid);
}

export function listPendingWhales() {
  return Array.from(pending.values()).filter(
    (item) => item.status === "pending"
  );
}
