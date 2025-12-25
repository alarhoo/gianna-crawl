# 🕷️ Browser-Based Web Crawler & Metadata Extractor

## 📌 Problem Statement

Manually collecting structured metadata from a paginated, JavaScript-heavy website is slow, error-prone, and not scalable. The target site:

* Uses **age-confirmation gates**
* Loads content dynamically
* Requires navigation from **grid/list pages** into **detail pages**
* Contains metadata scattered across the DOM
* Needs to support **resume**, **retry**, and **safe re-runs**
* Must avoid detection or throttling through aggressive crawling

A simple HTTP scraper is insufficient.

---

## 🎯 Solution Overview

This project implements a **production-grade browser crawler** using **Playwright**, designed to:

* Crawl paginated grid pages
* Navigate into detail pages
* Extract structured metadata
* Persist results safely into SQLite
* Support crash recovery and incremental re-runs
* Provide detailed crawl metrics and failure reporting

The crawler behaves like a real user:

* Uses a real browser engine
* Handles cookies and confirmation gates
* Applies rate limiting and retry logic

---

## 🧱 Architecture

```files
index.js
 └─ Orchestration (browser, context, modes)
     ├─ Grid crawler (pagination)
     ├─ Parallel detail workers
     ├─ Resume-from-DB logic
     ├─ Retry + rate limiting
     ├─ Metrics collection
     └─ Failure reporting
```

### Key Components

| Component          | Purpose                       |
| ------------------ | ----------------------------- |
| Playwright         | Browser automation            |
| SQLite             | Persistent, resumable storage |
| Worker pool        | Parallel crawling             |
| Retry with backoff | Transient error handling      |
| Rate limiting      | Avoid throttling              |
| Failure report     | Debug & re-run failures       |

---

## ✨ Features

### Core Crawling

* ✅ Paginated grid crawling (`?page=N`)
* ✅ Detail page navigation
* ✅ JavaScript-rendered DOM support
* ✅ Age/confirmation gate handling

### Reliability

* ✅ Resume-from-DB (idempotent runs)
* ✅ Retry with exponential backoff
* ✅ Rate limiting with jitter
* ✅ Parallel workers (configurable)

### Observability

* ✅ Crawl metrics (duration, throughput, success rate)
* ✅ Failure report with reasons
* ✅ Failed-only re-run mode

### Safety & Portability

* ✅ Windows-safe filename sanitization
* ✅ No duplicate DB records
* ✅ Safe to re-run anytime

---

## 🗂️ Extracted Data

Each crawled item stores:

* Title
* Subtitle
* Release date (YYYYMMDD)
* Studio
* Series
* Director
* Actors (comma-separated)
* Tags
* Thumbnail `srcset` (all resolutions)
* Hover preview M3U8 URL
* Preview iframe URL
* Source tab title
* Sanitized filename
* Source detail URL

---

## ⚙️ Configuration

### `.env`

```env
BASE_URL=https://example.com
GRID_URL=/shop-streaming-video-by-scene.html?cast=12345

MAX_CONCURRENCY=3
RATE_DELAY_MS=1500
```

| Variable          | Description                      |
| ----------------- | -------------------------------- |
| `BASE_URL`        | Website base URL                 |
| `GRID_URL`        | Grid/list page path (relative)   |
| `MAX_CONCURRENCY` | Number of parallel workers       |
| `RATE_DELAY_MS`   | Base delay between requests (ms) |

---

## 🚀 How to Run

### 1️⃣ Install dependencies

```bash
npm install
```

### 2️⃣ Install Playwright browsers

```bash
npx playwright install
```

### 3️⃣ Run a full crawl

```bash
node index.js
```

This will:

* Crawl all grid pages
* Visit each detail page
* Save results to `videos.db`
* Print metrics and failure report

---

### 4️⃣ Re-run only failed items

If failures occurred, a file is generated:

```text
failed-items.json
```

To retry **only failed pages**:

```bash
node index.js --failed-only
```

No grid crawl, no duplicates.

---

## 📊 Sample Crawl Metrics Output

```Metrics
📊 CRAWL METRICS
────────────────────────────────
Total items discovered : 128
Already crawled (skip): 52
Attempted this run    : 76
Successful crawls     : 70
Failures              : 6
Success rate          : 92.1%

Total duration        : 3m 42s
Avg time per item     : 2.9s
Throughput            : 18.9 items/min
────────────────────────────────
```

---

## 🧪 Failure Reporting

Failures are collected with:

* URL
* Crawl stage
* Error message
* Timestamp

Printed at the end of each run and persisted to:

```text
failed-items.json
```

---

## 🛑 Safe Re-runs & Idempotency

* `detailUrl` is UNIQUE in DB
* Uses `INSERT OR IGNORE`
* Resume logic skips already crawled items
* Database file is ignored by git

You can safely:

* Kill the process
* Restart the crawl
* Change concurrency
* Rerun failed-only mode

---

## 📁 Project Structure

```files
.
├── index.js
├── crawler/
│   ├── collect-grid.js
│   ├── run.js
│   ├── worker.js
│   ├── failures.js
│   ├── metrics.js
├── utils/
│   ├── retry.js
│   ├── rateLimiter.js
│   ├── sanitizeFilename.js
├── db/
│   └── index.js
├── failed-items.json
├── videos.db   (gitignored)
└── README.md
```

---

## 🔐 Ethics & Usage Notes

* Respect website terms of service
* Keep rate limits conservative
* Use this tool only on content you are authorized to crawl
* Designed for **personal research / archival use**

---

## 🧭 Future Enhancements

* CSV / JSON export
* Preview video download (M3U8 → MP4)
* CLI flags (`--pages`, `--workers`)
* Crawl session reports
* Dashboard visualization

---

## ✅ Status

**Stable. Production-ready. Extensible.**

---
