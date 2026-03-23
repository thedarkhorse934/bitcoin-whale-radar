import fs from "fs";

export function logEvent(event) {
  const line = JSON.stringify(event) + "\n";
  fs.appendFileSync("./data/events.jsonl", line, "utf8");
}
