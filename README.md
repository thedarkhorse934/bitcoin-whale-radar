# 🐋 Bitcoin Whale Radar

![Node](https://img.shields.io/badge/node-%3E%3D18-green)
![Status](https://img.shields.io/badge/status-active-success)
![License](https://img.shields.io/badge/license-MIT-blue)

A **Node.js blockchain monitoring tool** that detects large confirmed Bitcoin transactions ("whales") and displays them in a **live terminal-style dashboard**.

Bitcoin Whale Radar continuously watches new blocks, identifies high-value transactions, filters noise such as self-transfers, and streams the results into a clean monitoring interface.

The goal of the project is to provide a **simple way to observe large Bitcoin movements in real time.**

---

# 📊 Dashboard

### Live Dashboard

![Dashboard](screenshots/dashboard.png)

### Terminal Monitor

![Terminal](screenshots/terminal.png)

Example dashboard row:

```
✓ CONFIRMED [08:09:05] BLOCK 941399 • 29.58 BTC • ≈ £1,567,902 • 0 blocks ago • bc1qstpz...
```

The dashboard displays:

- Latest Block (Tip)
- Latest Whale Block
- BTC → GBP price
- Biggest Whale (24h)
- Live Confirmed Whale Feed

---

# 🚀 Features

- Monitors **new Bitcoin blocks**
- Detects **large transactions ("whales")**
- Filters **self-transfers and exchange noise**
- Stores events for historical reference
- Displays a **live terminal-style dashboard**
- Tracks **GBP value of whale movements**
- Provides block distance context ("blocks ago")

---

# 🧠 How It Works

The system consists of two main components.

---

## 1️⃣ Blockchain Monitor (`index.js`)

The monitoring engine continuously checks for new Bitcoin blocks and scans their transactions.

When a transaction exceeds a defined **whale threshold**, it is classified as a whale event.

The monitor:

1. Parses transactions in each new block  
2. Calculates BTC values transferred  
3. Filters out noise such as:
   - self transfers
   - internal exchange movements
4. Classifies whale activity  
5. Saves events to a local log file  

Events are stored as JSON lines in:

```
data/events.jsonl
```

Example event:

```json
{
  "block": 941399,
  "btc": 29.58,
  "gbp": 1567902,
  "address": "bc1qstpz...",
  "timestamp": "08:09:05"
}
```

---

## 2️⃣ Dashboard Server (`server.js`)

An **Express server** exposes an API that powers the dashboard.

Endpoints include:

```
/api/events
/api/tip
/api/stats
```

These endpoints feed live whale data to the UI.

---

## 3️⃣ Dashboard UI (`dashboard/`)

The dashboard is built using:

- HTML
- CSS
- Vanilla JavaScript

The interface is designed to resemble a **terminal monitoring system**.

Design features include:

- Black background
- Silver border panels
- Monospace typography
- Colour-coded whale classifications

The UI polls the backend API to update whale events.

---

# 🏗 Project Structure

```
bitcoin-whale-radar
│
├─ index.js
├─ server.js
├─ routes.js
├─ leaderboard.js
├─ summary.js
├─ config.json
├─ package.json
│
├─ dashboard/
│   ├─ index.html
│   ├─ style.css
│   └─ app.js
│
├─ src/
│   ├─ api/
│   │   └─ bitcoinApi.js
│   │
│   ├─ core/
│   │   ├─ monitor.js
│   │   ├─ mempoolMonitor.js
│   │   └─ txParser.js
│   │
│   ├─ data/
│   │   ├─ labels.js
│   │   ├─ logger.js
│   │   └─ pendingStore.js
│   │
│   └─ signals/
│       ├─ flow.js
│       └─ scorer.js
│
├─ labels/
│   └─ exchanges.json
│
├─ data/
│   └─ events.jsonl
│
└─ README.md
```

---

# ⚙️ Running the Project

### 1️⃣ Clone the repository

```
git clone https://github.com/thedarkhorse934/bitcoin-whale-radar.git
cd bitcoin-whale-radar
```

---

### 2️⃣ Install dependencies

```
npm install
```

---

### 3️⃣ Start the blockchain monitor

```
node index.js
```

---

### 4️⃣ Start the dashboard server

Open another terminal and run:

```
node server.js
```

---

### 5️⃣ Open the dashboard

Navigate to:

```
http://localhost:3000
```

You should now see the **Bitcoin Whale Radar dashboard running locally**.

---

# 📈 Example Whale Event

Example terminal output:

```
🐋 WHALE EVENT

block: 941824
value: 20.01 BTC
from: bc1qyy36...
to: bc1qzjge...
flow: UNKNOWN_FLOW
bucket: INFO
driver: Minor Whale
```

Meaning:

- A **20 BTC transfer**
- detected in **block 941824**
- logged and displayed on the dashboard

---

# 🎨 UI Design

The dashboard follows a **terminal monitoring aesthetic** inspired by trading terminals and network monitoring tools.

Design principles:

- Black background
- Silver bordered panels
- Monospace typography
- Colour-coded whale events
- Minimal UI

---

# 🐳 Whale Detection Logic

Transactions are classified as whales based on configurable **BTC thresholds**.

Noise reduction includes filtering:

- self-transfers
- exchange internal movements
- fragmented multi-input transactions

This allows the system to focus on **meaningful large-value Bitcoin transfers**.

---

# 📦 Data Storage

Whale events are stored locally as JSON lines in:

```
data/events.jsonl
```

Benefits:

- fast appends
- easy parsing
- simple historical analysis

---

# 🔮 Future Improvements

### Real-Time Improvements

- WebSocket live feed
- whale alert notifications
- sound alerts

### Data Intelligence

- exchange wallet detection
- whale wallet tracking
- historical whale statistics

### Dashboard Improvements

- whale activity heatmap
- whale size categories
- 24h whale activity charts

### Infrastructure

- Docker container
- hosted monitoring service
- multi-chain whale monitoring

---

# 🛠 Built With

- Node.js
- Express
- Bitcoin public APIs
- Vanilla JavaScript
- HTML / CSS

---

# 📜 License

MIT License

---

# 👨‍💻 Author

Built by **thedarkhorse934**

Junior Web3 developer exploring:

- blockchain monitoring tools
- smart contracts
- on-chain analytics
