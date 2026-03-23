export function getBucket(valueBtc) {
  if (valueBtc >= 5000) return "EXTREME";
  if (valueBtc >= 1000) return "CRITICAL";
  if (valueBtc >= 500) return "HIGH";
  if (valueBtc >= 100) return "ELEVATED";
  if (valueBtc >= 25) return "WATCH";
  return "INFO";
}

export function getDriver(valueBtc) {
  if (valueBtc >= 5000) return "Extreme Whale Transfer";
  if (valueBtc >= 1000) return "Mega Whale Transfer";
  if (valueBtc >= 500) return "Major Whale Movement";
  if (valueBtc >= 100) return "Large Whale";
  if (valueBtc >= 25) return "Notable Transfer";
  return "Minor Whale";
}