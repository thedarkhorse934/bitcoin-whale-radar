const byId = (id) => document.getElementById(id);

const clockEl = byId("clock");

const latestTipEl = byId("latestTip");
const latestWhaleBlockEl = byId("latestWhaleBlock");
const btcGbpEl = byId("btcGbp");
const biggest24hEl = byId("biggest24h");
const latestWhaleTimeEl = byId("latestWhaleTime");

const eventsTableEl = byId("eventsTable");
const leaderboardTableEl = byId("leaderboardTable");

function setClock() {
  if (!clockEl) return;
  clockEl.textContent = new Date().toLocaleTimeString("en-GB", { hour12: false });
}

function parseTime(value) {
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

function fmtTime(ts) {
  const ms = parseTime(ts);
  if (!ms) return "--:--:--";

  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "--:--:--";

  return d.toLocaleTimeString("en-GB", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function fmtShortTime(ts) {
  const ms = parseTime(ts);
  if (!ms) return "--:--";

  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "--:--";

  return d.toLocaleTimeString("en-GB", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit"
  });
}

function fmtBtc(value) {
  return `${Number(value || 0).toFixed(2)} BTC`;
}

function fmtGbp(value) {
  if (value == null) return "Unavailable";
  const num = Number(value);
  if (!Number.isFinite(num)) return "Unavailable";
  return `£${num.toLocaleString("en-GB")}`;
}

function shortAddr(str) {
  return str || "Unknown";
}

function getItemTime(item) {
  return (
    item?.time ??
    item?.timestamp ??
    item?.ts ??
    item?.firstSeenAt ??
    item?.confirmedAt ??
    0
  );
}

function getItemBlock(item) {
  return item?.blockHeight || item?.block || "-";
}

function getItemBtc(item) {
  return item?.btc ?? item?.value ?? 0;
}

function getItemFrom(item) {
  return item?.fromLabel || item?.from || "Unknown";
}

function getItemTo(item) {
  return item?.toLabel || item?.to || "Unknown";
}

function getBucket(item) {
  return String(item?.bucket || "").toUpperCase();
}

function getFeedClass(bucket) {
  if (bucket === "EXTREME" || bucket === "CRITICAL") return "feed-critical";
  if (bucket === "HIGH" || bucket === "MEGA") return "feed-mega";
  return "feed-standard";
}

function getBadgeClass(bucket, btc) {
  if (bucket === "EXTREME" || bucket === "CRITICAL") return "feed-badge-critical";
  if (bucket === "HIGH" || bucket === "MEGA") return "feed-badge-mega";
  if (btc >= 1000) return "feed-badge-mega";
  return "feed-badge-confirmed";
}

function getBadgeText(bucket, btc) {
  if (bucket === "EXTREME") return "🚨 EXTREME";
  if (bucket === "CRITICAL") return "🔴 CRITICAL";
  if (bucket === "HIGH") return "🐋 HIGH";
  if (bucket === "MEGA") return "🐋 MEGA";
  if (btc >= 5000) return "🚨 EXTREME";
  if (btc >= 1000) return "🐋 MEGA";
  if (btc >= 100) return "🐋 HIGH";
  return "✅ CONFIRMED";
}

function getBtcClass(btc) {
  if (btc >= 5000) return "feed-btc-extreme";
  if (btc >= 1000) return "feed-btc-mega";
  if (btc >= 100) return "feed-btc-high";
  return "feed-btc-standard";
}

function renderStats(data) {
  if (latestTipEl) latestTipEl.textContent = data.latestTip || "-";
  if (latestWhaleBlockEl) latestWhaleBlockEl.textContent = data.latestWhaleBlock || "-";
  if (btcGbpEl) btcGbpEl.textContent = fmtGbp(data.btcGbp);
  if (biggest24hEl) biggest24hEl.textContent = data.biggest24h ? fmtBtc(data.biggest24h) : "-";
  if (latestWhaleTimeEl) latestWhaleTimeEl.textContent = fmtTime(data.latestWhaleTime);
}

function renderConfirmedFeed(items) {
  if (!eventsTableEl) return;

  if (!items || !items.length) {
    eventsTableEl.innerHTML = `<div class="feed-row">No confirmed whale events.</div>`;
    return;
  }

  const btcPriceText = btcGbpEl ? btcGbpEl.textContent : null;
  const btcPrice = btcPriceText
    ? Number(btcPriceText.replace(/[£,]/g, ""))
    : null;

  eventsTableEl.innerHTML = items.slice(0, 24).map((item) => {
    const time = fmtTime(getItemTime(item));
    const block = getItemBlock(item);
    const latestTip = Number(latestTipEl?.textContent || 0);
    const blocksAgo = latestTip && block ? latestTip - block : null;
    const btc = getItemBtc(item);
    const btcText = fmtBtc(btc);

    const rawTo = getItemTo(item);
    const to = shortAddr(typeof rawTo === "object" ? rawTo.address : rawTo);

    const bucket = getBucket(item);

    const rowClass = getFeedClass(bucket);
    const badgeClass = getBadgeClass(bucket, btc);
    const badgeText = getBadgeText(bucket, btc);
    const btcClass = getBtcClass(btc);

    let gbpValueText = "";

    if (btcPrice && Number.isFinite(btc)) {
      const value = btc * btcPrice;

      gbpValueText = ` • ≈ £${value.toLocaleString("en-GB", {
        maximumFractionDigits: 0
      })}`;
    }

    return `
      <div class="feed-row ${rowClass}">
        <span class="feed-badge ${badgeClass}">${badgeText}</span>
        <span class="feed-time">[${time}]</span>
        <span class="feed-block">BLOCK ${block}</span>${blocksAgo !== null ? ` • ${blocksAgo} blocks ago` : ""}
        • <span class="feed-btc ${btcClass}">${btcText}</span>
        ${gbpValueText}
        <span class="feed-route">→ ${to}</span>
      </div>
    `;
  }).join("");
}

function renderLeaderboard(items) {
  if (!leaderboardTableEl) return;

  if (!items || !items.length) {
    leaderboardTableEl.innerHTML = `<div class="leader-row">No whale leaderboard data.</div>`;
    return;
  }

  leaderboardTableEl.innerHTML = items.slice(0, 10).map((item, i) => {
    const t = fmtShortTime(getItemTime(item));
    const name = shortAddr(item.name);
    const btc = fmtBtc(item.btc);

    return `
      <div class="leader-row">
        <span class="leader-rank">#${i + 1}</span>
        <span class="leader-time">${t}</span>
        <span class="leader-name">${name}</span>
        • <span class="leader-btc">${btc}</span>
      </div>
    `;
  }).join("");
}

async function fetchJson(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Fetch failed");
  return res.json();
}

async function loadDashboard() {
  try {
    const data = await fetchJson("/api/dashboard");

    renderStats(data);
    renderConfirmedFeed(data.confirmedFeed || []);
    renderLeaderboard(data.leaderboard || []);
  } catch (err) {
    console.error("Dashboard load failed", err);

    if (eventsTableEl) {
      eventsTableEl.innerHTML = `<div class="feed-row">Dashboard connection lost.</div>`;
    }
  }
}

setClock();
setInterval(setClock, 1000);

loadDashboard();
setInterval(loadDashboard, 5000);
