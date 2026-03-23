export async function getTipHeight(apiBaseUrl) {
  const res = await fetch(`${apiBaseUrl}/blocks/tip/height`);
  const height = await res.text();
  return Number(height);
}

export async function getBlockHash(apiBaseUrl, height) {
  const res = await fetch(`${apiBaseUrl}/block-height/${height}`);
  return await res.text();
}

export async function getBlock(apiBaseUrl, hash) {
  const res = await fetch(`${apiBaseUrl}/block/${hash}`);
  return await res.json();
}

export async function getBlockTxs(apiBaseUrl, hash) {
  const res = await fetch(`${apiBaseUrl}/block/${hash}/txs`);
  return await res.json();
}

export async function getRecentMempoolTxs(apiBaseUrl) {
  const res = await fetch(`${apiBaseUrl}/mempool/recent`);
  return await res.json();
}

export async function getTx(apiBaseUrl, txid) {
  const res = await fetch(`${apiBaseUrl}/tx/${txid}`);
  return await res.json();
}

export async function getTxStatus(apiBaseUrl, txid) {
  const res = await fetch(`${apiBaseUrl}/tx/${txid}/status`);
  return await res.json();
}

export async function getBlockAudit(apiBaseUrl, hash) {
  const res = await fetch(`${apiBaseUrl}/block/${hash}/audit-summary`);
  return await res.json();
}