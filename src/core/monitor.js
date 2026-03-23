import {
  getTipHeight,
  getBlockHash,
  getBlock,
  getBlockTxs
} from "../api/bitcoinApi.js";

import {
  getLargestOutputBtc,
  getShortTxid,
  getLargestOutputAddress,
  getFirstInputAddress
} from "./txParser.js";

import { getBucket, getDriver } from "../signals/scorer.js";
import { logEvent } from "../data/logger.js";
import { loadExchangeLabels, getExchangeLabel } from "../data/labels.js";
import { classifyFlow } from "../signals/flow.js";
import { trackRoute } from "../data/routes.js";
import {
  getPendingWhale,
  markConfirmed
} from "../data/pendingStore.js";

function shortTxid(txid) {
  return `${txid.slice(0, 8)}...`;
}

function getPrettyTime() {
  const now = new Date();
  return (
    now.toLocaleDateString("en-GB") +
    " " +
    now.toLocaleTimeString("en-GB")
  );
}

function getBucketEmoji(bucket) {
  if (bucket === "INFO") return "🔹";
  if (bucket === "WATCH") return "👀";
  if (bucket === "ELEVATED") return "🟡";
  if (bucket === "HIGH") return "🟠";
  if (bucket === "CRITICAL") return "🔴";
  if (bucket === "EXTREME") return "🚨";
  return "🐋";
}

function getMinerName(block) {
  if (block?.extras?.pool?.name) return block.extras.pool.name;
  return "Unknown";
}

function printBlockHeader({
  height,
  txCount,
  minerName,
  thresholdBtc,
  whaleCount,
  printedCount
}) {
  console.log("========================================");
  console.log("🐳 BITCOIN WHALE RADAR V1");
  console.log("time:", getPrettyTime());
  console.log("block:", height);
  console.log("tx count:", txCount);
  console.log("miner:", minerName);
  console.log("threshold:", thresholdBtc, "BTC");
  console.log("whale candidates:", whaleCount);
  console.log("printed alerts:", printedCount);
  console.log("========================================");
  console.log("");
}

function maybeConfirmPendingWhale(tx, blockHeight) {
  const pending = getPendingWhale(tx.txid);

  if (!pending || pending.status === "confirmed") {
    return;
  }

  const confirmed = markConfirmed(tx.txid, blockHeight);

  if (!confirmed) {
    return;
  }

  const confirmEvent = {
    ...confirmed,
    eventType: "CONFIRMED_WHALE",
    lane: "confirmed",
    timestamp: new Date().toISOString(),
    status: "confirmed",
    blockHeight,
    confirmationDelaySec: Math.floor(
      (Date.now() - new Date(pending.firstSeenAt).getTime()) / 1000
    )
  };

  logEvent(confirmEvent);

  console.log("");
  console.log("✅ CONFIRMED WHALE");
  console.log("block:", blockHeight);
  console.log("value:", confirmEvent.valueBtc.toFixed(2), "BTC");
  console.log("tx:", shortTxid(confirmEvent.txid));
  console.log("");
}

async function processBlock(height, config, exchangeLabels) {
  console.log("PROCESSING BLOCK:", height);

  const hash = await getBlockHash(config.apiBaseUrl, height);
  const block = await getBlock(config.apiBaseUrl, hash);
  const txs = await getBlockTxs(config.apiBaseUrl, hash);
  const minerName = getMinerName(block);

  console.log("Block tx count:", block.tx_count);
  console.log("Miner:", minerName);

  let whaleCount = 0;
  let printedCount = 0;

  for (const tx of txs) {
    maybeConfirmPendingWhale(tx, height);

    const largestOutputBtc = getLargestOutputBtc(tx);

    if (largestOutputBtc >= config.whaleThresholdBtc) {
      whaleCount++;

      const bucket = getBucket(largestOutputBtc);
      const toAddr = getLargestOutputAddress(tx);
      const fromAddr = getFirstInputAddress(tx);

      const fromLabel = getExchangeLabel(fromAddr, exchangeLabels);
      const toLabel = getExchangeLabel(toAddr, exchangeLabels);
      const flow = classifyFlow(fromLabel, toLabel, fromAddr, toAddr);

      const { routeKey, routeCount } = trackRoute(fromAddr, toAddr);

      let driver = getDriver(largestOutputBtc);

      if (routeCount >= 2) {
        driver = `Repeated Route x${routeCount}`;
      }

      const event = {
        lane: "block",
        eventType: "BLOCK_WHALE",
        timestamp: new Date().toISOString(),
        blockHeight: height,
        blockTxCount: block.tx_count,
        minerName,
        txid: tx.txid,
        valueBtc: Number(largestOutputBtc.toFixed(8)),
        from: fromAddr,
        to: toAddr,
        fromLabel,
        toLabel,
        flow,
        routeKey,
        routeCount,
        bucket,
        driver
      };

      logEvent(event);

      const suppressFromConsole =
        flow === "POSSIBLE_SELF_TRANSFER" &&
        largestOutputBtc < config.suppressSelfTransfersUnderBtc;

      if (suppressFromConsole) {
        continue;
      }

      printedCount++;

      if (largestOutputBtc >= 5000) {
        console.log("🐳🐳 EXTREME WHALE DETECTED");
      } else if (largestOutputBtc >= 1000) {
        console.log("🐳 MEGA WHALE DETECTED");
      }

      console.log("🐋 WHALE EVENT");
      console.log("block:", height);
      console.log("miner:", minerName);
      console.log("tx:", getShortTxid(tx.txid));
      console.log("value:", largestOutputBtc.toFixed(2), "BTC");
      console.log("from:", fromAddr.slice(0, 12) + "...");
      console.log("to:", toAddr.slice(0, 12) + "...");
      if (fromLabel) console.log("from label:", fromLabel);
      if (toLabel) console.log("to label:", toLabel);
      console.log("flow:", flow);
      if (routeCount >= 2) console.log("route repeat count:", routeCount);
      console.log("bucket:", `${getBucketEmoji(bucket)} ${bucket}`);
      console.log("driver:", driver);
      console.log("");
    }
  }

  if (printedCount === 0) {
    console.log("No printable whale alerts in this block.");
    console.log("");
  }

  printBlockHeader({
    height,
    txCount: block.tx_count,
    minerName,
    thresholdBtc: config.whaleThresholdBtc,
    whaleCount,
    printedCount
  });
}

export async function startMonitor(config) {
  console.log("BITCOIN WHALE RADAR v1");
  console.log("");
  console.log("Whale threshold:", config.whaleThresholdBtc, "BTC");
  console.log("API base:", config.apiBaseUrl);
  console.log("Poll interval:", config.pollIntervalMs, "ms");
  console.log(
    "Self-transfer suppress under:",
    config.suppressSelfTransfersUnderBtc,
    "BTC"
  );
  console.log("");

  const exchangeLabels = loadExchangeLabels();

  let lastHeight = await getTipHeight(config.apiBaseUrl);

  console.log("Latest block:", lastHeight);
  console.log("");

  await processBlock(lastHeight, config, exchangeLabels);

  console.log("Waiting for new block...");
  console.log("");

  setInterval(async () => {
    try {
      const currentHeight = await getTipHeight(config.apiBaseUrl);

      if (currentHeight > lastHeight) {
        for (let h = lastHeight + 1; h <= currentHeight; h++) {
          console.log("NEW BLOCK DETECTED:", h);
          await processBlock(h, config, exchangeLabels);
          lastHeight = h;
        }
      }
    } catch (err) {
      console.error("Error checking block height:", err.message);
    }
  }, config.pollIntervalMs);
}