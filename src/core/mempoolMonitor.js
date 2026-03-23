import { getRecentMempoolTxs, getTx } from "../api/bitcoinApi.js";
import {
  getLargestOutputBtc,
  getLargestOutputAddress,
  getFirstInputAddress,
  getShortTxid
} from "./txParser.js";
import { getBucket, getDriver } from "../signals/scorer.js";
import { classifyFlow } from "../signals/flow.js";
import { logEvent } from "../data/logger.js";
import { loadExchangeLabels, getExchangeLabel } from "../data/labels.js";
import {
  addPendingWhale,
  hasPendingWhale
} from "../data/pendingStore.js";

const seenRecentTxids = new Map();

function pruneSeenRecent(maxAgeMs = 30 * 60 * 1000) {
  const now = Date.now();

  for (const [txid, seenAt] of seenRecentTxids.entries()) {
    if (now - seenAt > maxAgeMs) {
      seenRecentTxids.delete(txid);
    }
  }
}

function shouldSuppressFromConsole(flow, valueBtc, config) {
  return (
    flow === "POSSIBLE_SELF_TRANSFER" &&
    valueBtc < config.suppressSelfTransfersUnderBtc
  );
}

function getPrettyTime() {
  const now = new Date();
  return (
    now.toLocaleDateString("en-GB") +
    " " +
    now.toLocaleTimeString("en-GB")
  );
}

function cleanAddress(value) {
  if (!value) return null;

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object") {
    if (typeof value.address === "string") return value.address;
    if (typeof value.scriptpubkey_address === "string") {
      return value.scriptpubkey_address;
    }
  }

  return null;
}

async function handleRecentTx(recentTx, config, exchangeLabels) {
  const txid = recentTx.txid;

  if (!txid) return;
  if (hasPendingWhale(txid)) return;

  const quickValueBtc = Number(recentTx.value) / 1e8;

  if (quickValueBtc < config.whaleThresholdBtc) {
    return;
  }

  const fullTx = await getTx(config.apiBaseUrl, txid);

  const valueBtc = getLargestOutputBtc(fullTx);

  if (valueBtc < config.whaleThresholdBtc) {
    return;
  }

  const toAddr = cleanAddress(getLargestOutputAddress(fullTx));
  const fromAddr = cleanAddress(getFirstInputAddress(fullTx));

  const fromLabel = getExchangeLabel(fromAddr, exchangeLabels);
  const toLabel = getExchangeLabel(toAddr, exchangeLabels);
  const flow = classifyFlow(fromLabel, toLabel, fromAddr, toAddr);

  const bucket = getBucket(valueBtc);
  const driver = getDriver(valueBtc);

  const event = {
    lane: "mempool",
    eventType: "MEMPOOL_WHALE",
    timestamp: new Date().toISOString(),
    firstSeenAt: new Date().toISOString(),
    status: "pending",
    txid,
    valueBtc: Number(valueBtc.toFixed(8)),
    from: fromAddr,
    to: toAddr,
    fromLabel,
    toLabel,
    flow,
    bucket,
    driver
  };

  addPendingWhale(event);
  logEvent(event);

  const suppressFromConsole = shouldSuppressFromConsole(
    flow,
    valueBtc,
    config
  );

  if (suppressFromConsole) {
    return;
  }

  console.log("========================================");
  console.log("👀 MEMPOOL WHALE");
  console.log("time:", getPrettyTime());
  console.log("tx:", getShortTxid(txid));
  console.log("value:", valueBtc.toFixed(2), "BTC");
  console.log("status: pending");
  console.log("flow:", flow);
  if (fromLabel) console.log("from label:", fromLabel);
  if (toLabel) console.log("to label:", toLabel);
  if (!fromLabel && fromAddr) console.log("from:", fromAddr);
  if (!toLabel && toAddr) console.log("to:", toAddr);
  console.log("bucket:", bucket);
  console.log("driver:", driver);

  if (valueBtc >= 5000) {
    console.log("🐳🐳 EXTREME MEMPOOL WHALE");
  } else if (valueBtc >= 1000) {
    console.log("🐳 MEGA MEMPOOL WHALE");
  }

  console.log("========================================");
  console.log("");
}

async function pollMempool(config, exchangeLabels) {
  try {
    const recent = await getRecentMempoolTxs(config.apiBaseUrl);

    for (const tx of recent) {
      if (!tx?.txid) continue;
      if (seenRecentTxids.has(tx.txid)) continue;

      seenRecentTxids.set(tx.txid, Date.now());
      await handleRecentTx(tx, config, exchangeLabels);
    }

    pruneSeenRecent();
  } catch (err) {
    console.error("Error polling mempool:", err.message);
  }
}

export function startMempoolMonitor(config) {
  const exchangeLabels = loadExchangeLabels();

  console.log("MEMPOOL MONITOR: ON");
  console.log("Mempool poll interval:", config.mempoolPollIntervalMs, "ms");
  console.log("");

  pollMempool(config, exchangeLabels);

  setInterval(() => {
    pollMempool(config, exchangeLabels);
  }, config.mempoolPollIntervalMs);
}