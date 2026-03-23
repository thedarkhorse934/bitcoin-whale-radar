import fs from "fs";

const file = "./data/events.jsonl";

if (!fs.existsSync(file)) {
  console.log("No events file found.");
  process.exit();
}

const lines = fs.readFileSync(file, "utf8")
  .trim()
  .split("\n")
  .map(JSON.parse);

const now = Date.now();
const last24h = lines.filter(e => {
  const ts = new Date(e.timestamp).getTime();
  return now - ts < 24 * 60 * 60 * 1000;
});

last24h.sort((a, b) => b.valueBtc - a.valueBtc);

console.log("");
console.log("🐳 TOP WHALES LAST 24H");
console.log("");

last24h.slice(0, 10).forEach((e, i) => {

  const from = e.fromLabel || "Unknown";
  const to = e.toLabel || "Unknown";

  console.log(
    `${i + 1}. ${e.valueBtc.toFixed(2)} BTC  |  ${from} → ${to}`
  );
});

console.log("");
console.log(`Total whale events: ${last24h.length}`);
console.log("");
