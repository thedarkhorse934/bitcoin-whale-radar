import fs from "fs";

export function loadExchangeLabels() {
  try {
    const raw = fs.readFileSync("./labels/exchanges.json", "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error loading exchange labels:", err.message);
    return {};
  }
}

export function getExchangeLabel(address, labels) {
  if (!address) return null;
  return labels[address] || null;
}