import fs from "fs";

function loadEvents() {
  try {
    const raw = fs.readFileSync("./data/events.jsonl", "utf8");

    return raw
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.startsWith("{"))
      .map(line => JSON.parse(line));
  } catch (err) {
    console.error("Error reading events file:", err.message);
    return [];
  }
}

function short(addr) {
  if (!addr) return "unknown";
  if (addr.length <= 16) return addr;
  return `${addr.slice(0, 12)}...`;
}

function countBy(items, keyFn) {
  const map = new Map();

  for (const item of items) {
    const key = keyFn(item);
    map.set(key, (map.get(key) || 0) + 1);
  }

  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

function topN(arr, n = 5) {
  return arr.slice(0, n);
}

const events = loadEvents();

if (events.length === 0) {
  console.log("No events found in data/events.jsonl");
  process.exit(0);
}

const sortedByValue = [...events].sort((a, b) => b.valueBtc - a.valueBtc);
const biggest = sortedByValue[0];

const bucketCounts = countBy(events, e => e.bucket);
const flowCounts = countBy(events, e => e.flow || "UNKNOWN_FLOW");
const topDestinations = countBy(events, e => e.toLabel || e.to);
const topSources = countBy(events, e => e.fromLabel || e.from);
const topRoutes = countBy(events, e => `${e.fromLabel || short(e.from)} -> ${e.toLabel || short(e.to)}`);

console.log("BITCOIN WHALE RADAR SUMMARY");
console.log("");

console.log("Total events:", events.length);
console.log("Largest transfer:", `${biggest.valueBtc.toFixed(2)} BTC`);
console.log("Largest tx:", biggest.txid);
console.log("Largest block:", biggest.blockHeight);
console.log("");

console.log("BUCKET COUNTS");
for (const [bucket, count] of bucketCounts) {
  console.log(`${bucket}: ${count}`);
}
console.log("");

console.log("FLOW COUNTS");
for (const [flow, count] of flowCounts) {
  console.log(`${flow}: ${count}`);
}
console.log("");

console.log("TOP DESTINATIONS");
for (const [dest, count] of topN(topDestinations, 5)) {
  console.log(`${dest}: ${count}`);
}
console.log("");

console.log("TOP SOURCES");
for (const [src, count] of topN(topSources, 5)) {
  console.log(`${src}: ${count}`);
}
console.log("");

console.log("TOP ROUTES");
for (const [route, count] of topN(topRoutes, 5)) {
  console.log(`${route}: ${count}`);
}
console.log("");

console.log("TOP 10 BIGGEST EVENTS");
for (const event of topN(sortedByValue, 10)) {
  const from = event.fromLabel || short(event.from);
  const to = event.toLabel || short(event.to);
  console.log(
    `${event.valueBtc.toFixed(2)} BTC | block ${event.blockHeight} | ${from} -> ${to} | ${event.flow}`
  );
}
