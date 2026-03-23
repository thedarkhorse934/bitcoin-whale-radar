export function classifyFlow(fromLabel, toLabel, fromAddr, toAddr) {
  if (fromAddr && toAddr && fromAddr === toAddr) {
    return "POSSIBLE_SELF_TRANSFER";
  }

  if (!fromLabel && !toLabel) return "UNKNOWN_FLOW";

  if (!fromLabel && toLabel) return "POSSIBLE_EXCHANGE_INFLOW";

  if (fromLabel && !toLabel) return "POSSIBLE_EXCHANGE_OUTFLOW";

  if (fromLabel && toLabel) {
    if (fromLabel === toLabel) {
      return "POSSIBLE_INTERNAL_EXCHANGE_MOVE";
    }

    return "POSSIBLE_EXCHANGE_TO_EXCHANGE";
  }

  return "UNKNOWN_FLOW";
}
