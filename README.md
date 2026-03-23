🐋 Bitcoin Whale Radar

A Node.js blockchain monitoring tool that detects large confirmed Bitcoin transactions ("whales") and displays them in a live terminal-style dashboard.

Bitcoin Whale Radar continuously watches new blocks, identifies high-value transactions, filters noise such as self-transfers, and streams the results into a clean monitoring interface.

The goal of the project is to provide a simple, readable way to observe large Bitcoin movements in real time.

📊 Dashboard Preview

(Add screenshots here after uploading images to your repo)

Example dashboard view:

✓ CONFIRMED [08:09:05] BLOCK 941399 • 29.58 BTC • ≈ £1,567,902 • 0 blocks ago • bc1qstpz...

The dashboard displays:

Latest Block (Tip)

Latest Whale Block

BTC → GBP price

Biggest Whale (24h)

Live Confirmed Whale Feed

🚀 Features

Monitors new Bitcoin blocks

Detects large transactions ("whales")

Filters self-transfers and exchange noise

Stores events for historical reference

Displays a live terminal-style dashboard

Tracks GBP value of whale movements

Provides block distance context ("blocks ago")

🧠 How It Works

The system consists of two main components:

1️⃣ Blockchain Monitor (index.js)

The monitoring engine continuously checks for new Bitcoin blocks and scans their transactions.

When a transaction exceeds a defined whale threshold, it is classified as a whale event.

The monitor then:

Parses all transactions in the new block

Calculates BTC values transferred

Filters out:

self transfers

internal exchange movements

Classifies whale activity

Saves events to a local log file

Events are stored as JSON lines in:

data/events.jsonl

Example event:

{
  "block": 941399,
  "btc": 29.58,
  "gbp": 1567902,
  "address": "bc1qstpz...",
  "timestamp": "08:09:05"
}
2️⃣ Dashboard Server (server.js)

An Express server exposes a simple API that the dashboard reads from.

Endpoints include:

/api/events
/api/tip
/api/stats

These endpoints power the live UI.

3️⃣ Dashboard UI (dashboard/)

The dashboard is a lightweight frontend built using:

HTML

CSS

Vanilla JavaScript

The interface is designed to resemble a terminal monitor with:

black background

silver borders

monospace typography

colour-coded whale events

The UI automatically refreshes using polling to fetch new whale activity.

🏗 Project Structure
bitcoin-whale-radar
│
├─ index.js            # Bitcoin blockchain monitoring engine
├─ server.js           # Express dashboard API server
├─ package.json
├─ exchanges.json      # Known exchange wallet labels
│
├─ data/
│   └─ events.jsonl    # Stored whale events
│
└─ dashboard/
    ├─ index.html      # Dashboard layout
    ├─ style.css       # Terminal theme styling
    └─ app.js          # Dashboard logic
⚙️ Running the Project
1️⃣ Clone the repository
git clone https://github.com/YOUR_USERNAME/bitcoin-whale-radar.git
cd bitcoin-whale-radar
2️⃣ Install dependencies
npm install
3️⃣ Start the monitor

Run the blockchain monitoring engine:

node index.js
4️⃣ Start the dashboard server

In another terminal:

node server.js
5️⃣ Open the dashboard

Navigate to:

http://localhost:3000

You should now see the Bitcoin Whale Radar dashboard running locally.

📈 Example Whale Event

Example output shown on the dashboard:

✓ CONFIRMED [08:09:05]
BLOCK 941399
29.58 BTC
≈ £1,567,902
0 blocks ago
bc1qstpz...

Meaning:

A 29.58 BTC transfer

confirmed in block 941399

worth ~£1.56M

detected immediately after confirmation

🎨 UI Design

The dashboard follows a terminal monitoring aesthetic inspired by trading terminals and network monitors.

Design elements include:

Black background

Silver border panels

SF Mono typography

Colour-coded whale classifications

Minimal UI for readability

🐳 Whale Detection Logic

Transactions are classified as whales based on BTC thresholds.

The system also attempts to reduce noise by filtering:

self-transfers

exchange internal movements

small high-input transactions

This helps focus on meaningful large-value movements across the Bitcoin network.

📦 Data Storage

Detected whale events are stored locally in:

data/events.jsonl

Using JSON lines allows:

fast appends

easy parsing

simple historical analysis

🔮 Future Improvements

Possible enhancements:

Real-Time Improvements

WebSocket live feed instead of polling

Whale alerts

sound notifications

Data Intelligence

Exchange wallet detection

Whale wallet tracking

historical whale statistics

Dashboard Improvements

Whale heatmap

whale size categories

24h whale activity chart

Infrastructure

Docker container

hosted dashboard

multi-chain whale monitoring

💡 Why This Project

Large Bitcoin transactions often signal:

exchange movements

institutional transfers

OTC trading

whale accumulation or distribution

This tool provides a simple monitoring interface to observe these movements in real time.

🛠 Built With

Node.js

Express

Bitcoin public APIs

Vanilla JavaScript

HTML / CSS

📜 License

MIT License

👨‍💻 Author

Built by thedarkhorse934

Junior Web3 developer exploring:

blockchain monitoring tools

smart contracts

on-chain data analysis
