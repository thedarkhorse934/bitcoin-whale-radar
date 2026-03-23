import config from "./config.json" with { type: "json" };
import { startMonitor } from "./src/core/monitor.js";
import { startMempoolMonitor } from "./src/core/mempoolMonitor.js";

startMonitor(config);
startMempoolMonitor(config);