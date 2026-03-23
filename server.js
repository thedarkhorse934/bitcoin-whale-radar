import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const eventsFile = path.join(__dirname, "data", "events.jsonl");
const dashboardDir = path.join(__dirname, "dashboard");

app.use(express.static(dashboardDir));

const DEDUPE_WINDOW_MS = 10 * 60 * 1000;
const BIG_SELF_TRANSFER_BTC = 500;
const LEADERBOARD_WINDOW_HOURS = 12;

/* ---------------- BTC/GBP FALLBACK CACHE ---------------- */

let lastSuccessfulBtcGbp = null;
let lastSuccessfulBtcGbpAt = 0;

async function fetchBtcGbpWithFallback() {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=gbp"
    );

    if (!response.ok) {
      throw new Error(`CoinGecko HTTP ${response.status}`);
    }

    const data = await response.json();
    const priceGbp = Number(data?.bitcoin?.gbp);

    if (Number.isFinite(priceGbp) && priceGbp > 0) {
      lastSuccessfulBtcGbp = priceGbp;
      lastSuccessfulBtcGbpAt = Date.now();
      return priceGbp;
    }

    throw new Error("Invalid BTC/GBP price");
  } catch (err) {
    if (lastSuccessfulBtcGbp != null) {
      console.warn(
        `[btc-price] using cached fallback price after fetch failure: ${err.message}`
      );
      return lastSuccessfulBtcGbp;
    }

    console.warn(`[btc-price] no cached fallback available: ${err.message}`);
    return null;
  }
}

// Warm cache on startup, then refresh every 60s in background
fetchBtcGbpWithFallback();
setInterval(() => {
  fetchBtcGbpWithFallback().catch(() => {});
}, 60 * 1000);

/* ---------------- EXISTING HELPERS ---------------- */

function readEvents() {
  if (!fs.existsSync(eventsFile)) return [];

  const raw = fs.readFileSync(eventsFile, "utf8").trim();
  if (!raw) return [];

  return raw
    .split("\n")
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function toMs(value) {
  if (!value) return 0;

  if (typeof value === "number") {
    return value < 1e12 ? value * 1000 : value;
  }

  const num = Number(value);
  if (!Number.isNaN(num)) {
    return num < 1e12 ? num * 1000 : num;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function eventTime(event) {
  return (
    toMs(event.timestamp) ||
    toMs(event.time) ||
    toMs(event.ts) ||
    toMs(event.detectedAt) ||
    toMs(event.createdAt) ||
    toMs(event.firstSeenAt) ||
    0
  );
}

function eventBtc(event) {
  const value =
    event.valueBtc ??
    event.btc ??
    event.btcValue ??
    event.amountBtc ??
    event.value ??
    0;

  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function eventBlock(event) {
  return event.blockHeight ?? event.block ?? event.height ?? 0;
}

function normalizeLabel(value) {
  return String(value || "").trim().toLowerCase();
}

function getLastHoursEvents(events, hours) {
  const now = Date.now();
  const windowMs = hours * 60 * 60 * 1000;

  return events.filter((event) => {
    const ts = eventTime(event);
    if (!ts) return false;
    return now - ts <= windowMs;
  });
}

function getLast24hEvents(events) {
  return getLastHoursEvents(events, 24);
}

function isConfirmedEvent(event) {
  return (
    event.eventType === "BLOCK_WHALE" ||
    event.eventType === "CONFIRMED_WHALE"
  );
}

function isExtremeEvent(event) {
  const bucket = String(event.bucket || "").toUpperCase();
  return bucket === "EXTREME" || eventBtc(event) >= 5000;
}

function isBigSelfTransfer(event) {
  return eventBtc(event) >= BIG_SELF_TRANSFER_BTC;
}

function isSelfTransfer(event) {
  const fromAddr = normalizeLabel(event.from);
  const toAddr = normalizeLabel(event.to);
  const fromLabel = normalizeLabel(event.fromLabel);
  const toLabel = normalizeLabel(event.toLabel);

  if (fromAddr && toAddr && fromAddr === toAddr) return true;
  if (fromLabel && toLabel && fromLabel === toLabel) return true;

  return false;
}

function shouldKeepConfirmedEvent(event) {
  if (!isConfirmedEvent(event)) return false;
  if (!isSelfTransfer(event)) return true;
  return isBigSelfTransfer(event) || isExtremeEvent(event);
}

function dedupeConfirmedRoutes(events) {
  const seen = new Map();
  const output = [];

  for (const event of events) {
    const from = normalizeLabel(event.from);
    const to = normalizeLabel(event.to);

    if (!from || !to) {
      output.push(event);
      continue;
    }

    const key = `${from}__${to}`;
    const ts = eventTime(event);
    const lastSeen = seen.get(key) || 0;

    if (lastSeen && ts && Math.abs(ts - lastSeen) < DEDUPE_WINDOW_MS) {
      continue;
    }

    seen.set(key, ts);
    output.push(event);
  }

  return output;
}

function normaliseMinerName(value) {
  const miner = String(value || "").trim().toLowerCase();

  if (!miner) return "Unknown";
  if (miner.includes("antpool")) return "AntPool";
  if (miner.includes("foundry")) return "Foundry USA";
  if (miner.includes("viabtc")) return "ViaBTC";
  if (miner.includes("f2pool")) return "F2Pool";

  return value;
}

function buildConfirmedFeed(events) {
  return dedupeConfirmedRoutes(
    events
      .filter(shouldKeepConfirmedEvent)
      .sort((a, b) => eventTime(b) - eventTime(a))
  )
    .slice(0, 50)
    .map((event) => {
      const time = eventTime(event);
      const blockHeight = eventBlock(event);
      const btc = eventBtc(event);

      return {
        time,
        ts: time,
        timestamp: time,
        blockHeight,
        block: blockHeight,
        btc,
        value: btc,
        from: event.from || "Unknown",
        to: event.to || "Unknown",
        fromLabel: event.fromLabel || event.from || "Unknown",
        toLabel: event.toLabel || event.to || "Unknown",
        bucket: event.bucket || ""
      };
    });
}

function buildLeaderboard(events) {
  return events
    .filter(shouldKeepConfirmedEvent)
    .sort((a, b) => eventBtc(b) - eventBtc(a))
    .slice(0, 10)
    .map((event) => {
      const time = eventTime(event);

      return {
        name: event.toLabel || event.to || "Unknown",
        btc: eventBtc(event),
        time,
        ts: time,
        timestamp: time,
        blockHeight: eventBlock(event),
        bucket: event.bucket || ""
      };
    });
}

function getLatestWhaleTime(feed) {
  if (!feed.length) return 0;
  return feed[0]?.time ?? feed[0]?.timestamp ?? feed[0]?.ts ?? 0;
}

function getLatestTipFromEvents(events) {
  return events.reduce((max, event) => {
    const block = eventBlock(event);
    return block > max ? block : max;
  }, 0);
}

function getLatestWhaleBlock(events) {
  return events.reduce((max, event) => {
    const block = eventBlock(event);
    return block > max ? block : max;
  }, 0);
}

app.get("/api/events", (req, res) => {
  const events = buildConfirmedFeed(readEvents());
  res.json(events.slice(0, 100));
});

app.get("/api/leaderboard", (req, res) => {
  const events = getLastHoursEvents(readEvents(), LEADERBOARD_WINDOW_HOURS);
  res.json(buildLeaderboard(events));
});

app.get("/api/summary", (req, res) => {
  const events = getLast24hEvents(readEvents());
  const confirmed = events.filter(shouldKeepConfirmedEvent);

  const biggest = confirmed.reduce((max, event) => {
    const btc = eventBtc(event);
    return btc > max ? btc : max;
  }, 0);

  const latestWhaleBlock = getLatestWhaleBlock(confirmed);
  const latestTip = getLatestTipFromEvents(events);

  let lastBlockMiner = "Unknown";

  const latestBlockEvent = confirmed
    .filter((event) => eventBlock(event))
    .sort((a, b) => eventBlock(b) - eventBlock(a))[0];

  if (latestBlockEvent?.minerName) {
    lastBlockMiner = normaliseMinerName(latestBlockEvent.minerName);
  }

  res.json({
    confirmed24h: confirmed.length,
    biggest24h: biggest,
    latestTip,
    latestWhaleBlock,
    lastBlockMiner
  });
});

app.get("/api/routes", (req, res) => {
  const events = getLast24hEvents(readEvents()).filter(shouldKeepConfirmedEvent);

  const counts = new Map();

  for (const event of events) {
    if (!event.from || !event.to) continue;
    const key = `${event.from} -> ${event.to}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const routes = Array.from(counts.entries())
    .map(([route, count]) => ({ route, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  res.json(routes);
});

app.get("/api/exchanges", (req, res) => {
  const events = getLast24hEvents(readEvents()).filter(shouldKeepConfirmedEvent);

  const inflows = {};
  const outflows = {};

  for (const event of events) {
    const btc = eventBtc(event);

    if (event.toLabel) {
      inflows[event.toLabel] = (inflows[event.toLabel] || 0) + btc;
    }

    if (event.fromLabel) {
      outflows[event.fromLabel] = (outflows[event.fromLabel] || 0) + btc;
    }
  }

  const topInflows = Object.entries(inflows)
    .map(([label, btc]) => ({ label, btc }))
    .sort((a, b) => b.btc - a.btc)
    .slice(0, 10);

  const topOutflows = Object.entries(outflows)
    .map(([label, btc]) => ({ label, btc }))
    .sort((a, b) => b.btc - a.btc)
    .slice(0, 10);

  res.json({ topInflows, topOutflows });
});

app.get("/api/btc-price", async (req, res) => {
  const gbp = await fetchBtcGbpWithFallback();
  res.json({
    gbp,
    cached: gbp != null && lastSuccessfulBtcGbp != null,
    updatedAt: lastSuccessfulBtcGbpAt || null
  });
});

app.get("/api/dashboard", async (req, res) => {
  try {
    const allEvents = readEvents();
    const events24h = getLast24hEvents(allEvents);
    const events12h = getLastHoursEvents(allEvents, LEADERBOARD_WINDOW_HOURS);
    const confirmed24h = events24h.filter(shouldKeepConfirmedEvent);

    const confirmedFeed = buildConfirmedFeed(allEvents);
    const leaderboard = buildLeaderboard(events12h);

    const biggest24h = confirmed24h.reduce((max, event) => {
      const btc = eventBtc(event);
      return btc > max ? btc : max;
    }, 0);

    const latestTip = getLatestTipFromEvents(allEvents);
    const latestWhaleBlock = getLatestWhaleBlock(confirmed24h);
    const latestWhaleTime = getLatestWhaleTime(confirmedFeed);

    let lastBlockMiner = "Unknown";

    const latestBlockEvent = confirmed24h
      .filter((event) => eventBlock(event))
      .sort((a, b) => eventBlock(b) - eventBlock(a))[0];

    if (latestBlockEvent?.minerName) {
      lastBlockMiner = normaliseMinerName(latestBlockEvent.minerName);
    }

    const btcGbp = await fetchBtcGbpWithFallback();

    res.json({
      confirmedFeed,
      leaderboard,
      latestTip,
      latestWhaleBlock,
      latestWhaleTime,
      lastBlockMiner,
      btcGbp,
      biggest24h,
      confirmed24h: confirmed24h.length
    });
  } catch (err) {
    console.error("Dashboard API failed", err);

    res.status(500).json({
      confirmedFeed: [],
      leaderboard: [],
      latestTip: 0,
      latestWhaleBlock: 0,
      latestWhaleTime: 0,
      lastBlockMiner: "Unknown",
      btcGbp: lastSuccessfulBtcGbp,
      biggest24h: 0,
      confirmed24h: 0
    });
  }
});

app.listen(PORT, () => {
  console.log(`Dashboard running at http://localhost:${PORT}`);
});
