export function getLargestOutputBtc(tx) {
  if (!tx?.vout?.length) return 0;

  let largest = 0;

  for (const out of tx.vout) {
    if (out.value > largest) {
      largest = out.value;
    }
  }

  return largest / 100000000;
}

export function getLargestOutputAddress(tx) {
  if (!tx?.vout?.length) return null;

  let largest = tx.vout[0];

  for (const out of tx.vout) {
    if (out.value > largest.value) {
      largest = out;
    }
  }

  if (typeof largest.scriptpubkey_address === "string") {
    return largest.scriptpubkey_address;
  }

  return null;
}

export function getFirstInputAddress(tx) {
  if (!tx?.vin?.length) return null;

  const input = tx.vin[0];

  if (typeof input?.prevout?.scriptpubkey_address === "string") {
    return input.prevout.scriptpubkey_address;
  }

  return null;
}

export function getShortTxid(txid) {
  if (!txid) return "-";

  return `${txid.slice(0, 8)}...`;
}