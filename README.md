<p align="center">
  <img src="https://img.shields.io/badge/⚡-PulsePoll-8B5CF6?style=for-the-badge&labelColor=030014" alt="PulsePoll" />
  <br/>
  <strong>Real-Time Poll Rooms</strong>
  <br/>
  <sub>Create instant polls · Share a link · Watch votes stream in live</sub>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_19-61DAFB?style=flat&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.IO-010101?style=flat&logo=socket.io&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_v4-06B6D4?style=flat&logo=tailwindcss&logoColor=white" />
</p>

---

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Anti-Abuse / Fairness Mechanisms](#-anti-abuse--fairness-mechanisms)
- [Edge Cases Handled](#-edge-cases-handled)
- [Known Limitations & Future Improvements](#-known-limitations--future-improvements)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)

---

## ✨ Features

| Feature                    | Description                                                                              |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| **Instant Poll Creation**  | Create a poll with a question and 2–10 options in seconds                                |
| **Shareable Links**        | Each poll gets a unique 8-character share code URL                                       |
| **Real-Time Results**      | All viewers see votes update instantly via WebSocket — no refresh needed                 |
| **Multi-Layer Anti-Abuse** | 4 defense layers prevent repeat/abusive voting (see below)                               |
| **Persistent Data**        | Polls, options, and votes stored in Supabase (Postgres) — survive refreshes and sessions |
| **Live Viewer Count**      | See how many people are viewing a poll in real-time                                      |
| **Responsive UI**          | Cosmic dark theme with Framer Motion animations, works on mobile/tablet/desktop          |

---

## ⚡ Performance Metrics (Local Host Baseline)

Tests executed via TestSprite & Custom Node.js Script:

| Metric                     | Result       | UX Assessment |
| -------------------------- | ------------ | ------------- |
| **API Health Check RTT**   | **5.85 ms**  | ⚡ Instant    |
| **WebSocket Handshake**    | **11.65 ms** | ⚡ Instant    |
| **Poll Join to Data Load** | **250 ms**   | 🟢 Fast       |

> **Note on Low Network Areas:**
> The architecture uses **Socket.IO over WebSocket**, which maintains a single persistent connection. This is significantly better for low-bandwidth environments than standard REST polling, as it avoids repeated HTTP handshake overhead. Even with 300ms network latency, the app will remain responsive.

---

## 🏗 Architecture

### High-Level System Design

```mermaid
graph TB
    subgraph Client["🌐 Frontend (React + Vite)"]
        UI["UI Layer<br/>React 19 + shadcn/ui"]
        FP["Hardware Fingerprint<br/>Canvas + WebGL + Screen"]
        WS["WebSocket Client<br/>Socket.IO"]
        LS["localStorage<br/>Vote Tracking"]
    end

    subgraph Server["⚙️ Backend (Node.js + Express)"]
        API["REST API<br/>/api/polls"]
        MW["Middleware Stack<br/>Rate Limit · Cookie · CORS"]
        SK["Socket.IO Server<br/>Poll Rooms"]
    end

    subgraph Data["💾 Data Layer"]
        SB["Supabase<br/>Postgres DB"]
        RD["Redis<br/>Cache + Rate Limit"]
    end

    UI -->|HTTP + Cookies| API
    UI -->|WebSocket| WS
    WS <-->|Real-time events| SK
    FP -->|SHA-256 hash| API
    API --> MW
    MW --> SB
    MW --> RD
    SK --> SB

    style Client fill:#1a1040,stroke:#8B5CF6,color:#fff
    style Server fill:#0f1729,stroke:#06B6D4,color:#fff
    style Data fill:#0a1628,stroke:#3ECF8E,color:#fff
```

### Request Flow: Creating & Voting on a Poll

```mermaid
sequenceDiagram
    participant U as 👤 User A
    participant F as 🌐 Frontend
    participant B as ⚙️ Backend
    participant DB as 💾 Supabase
    participant R as 🔴 Redis
    participant U2 as 👤 User B

    Note over U,U2: Poll Creation Flow
    U->>F: Fill question + options
    F->>F: Generate hardware fingerprint
    F->>B: POST /api/polls {question, options, fingerprint}
    B->>B: Validate & sanitize input
    B->>DB: INSERT poll + options
    DB-->>B: shareCode: "abc123xy"
    B-->>F: {shareCode, pollId}
    F-->>U: Show share modal with link

    Note over U,U2: Voting Flow (Real-Time)
    U2->>F: Open /poll/abc123xy
    F->>B: WebSocket: join-poll("abc123xy")
    B->>DB: Fetch current tallies
    B-->>F: poll-state {tallies, viewerCount}

    U2->>F: Select option + click Vote
    F->>F: Generate hardware fingerprint
    F->>B: POST /api/polls/abc123xy/vote

    Note over B: 4-Layer Anti-Abuse Check
    B->>B: Layer 3: Check HTTP-only cookie
    B->>R: Layer 2: Check IP lock
    B->>DB: Layer 1: INSERT (unique constraints)
    DB-->>B: ✅ Vote recorded

    B->>R: Set IP lock (24h TTL)
    B-->>F: Set HTTP-only cookie (24h)
    B->>B: Broadcast to Socket room

    B-->>U: 📡 vote-update {tallies}
    B-->>U2: 📡 vote-update {tallies}

    Note over U: Sees results update instantly!
```

---

## 🛡 Anti-Abuse / Fairness Mechanisms

PulsePoll uses a **4-layer defense system** to prevent repeat and abusive voting, modeled after how platforms like Strawpoll and Mentimeter handle anonymous poll fairness.

### Defense Layers Overview

```mermaid
graph TD
    A["🗳️ Vote Request"] --> B{"Layer 3<br/>🍪 HTTP-only Cookie"}
    B -->|Cookie exists| BLOCK["❌ Blocked<br/>Already Voted"]
    B -->|No cookie| C{"Layer 2<br/>🌐 IP + Redis Lock"}
    C -->|IP locked| BLOCK
    C -->|IP clear| D{"Layer 1a<br/>🔑 Fingerprint<br/>DB Constraint"}
    D -->|Duplicate FP| BLOCK
    D -->|FP clear| E{"Layer 1b<br/>📍 IP Address<br/>DB Constraint"}
    E -->|Duplicate IP| BLOCK
    E -->|All clear| F["✅ Vote Accepted"]

    F --> G["Set cookie 🍪"]
    F --> H["Lock IP in Redis 🔴"]
    F --> I["Save to localStorage 💾"]
    F --> J["Broadcast via Socket 📡"]

    style BLOCK fill:#7f1d1d,stroke:#ef4444,color:#fff
    style F fill:#14532d,stroke:#22c55e,color:#fff
    style A fill:#1e1b4b,stroke:#8B5CF6,color:#fff
```

### Detailed Breakdown

| Layer  | Mechanism                                       | Implementation                                                                                                             | Survives Browser Switch? | Survives Incognito? | Survives VPN? |
| :----: | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | :----------------------: | :-----------------: | :-----------: |
| **1a** | **Hardware Fingerprint** (DB unique constraint) | Canvas rendering + WebGL GPU + screen resolution + timezone → SHA-256 hash. Unique index on `(poll_id, voter_fingerprint)` |          ✅ Yes          |       ✅ Yes        |    ✅ Yes     |
| **1b** | **IP Address** (DB unique constraint)           | Partial unique index on `(poll_id, voter_ip)` in Supabase                                                                  |          ✅ Yes          |       ✅ Yes        |     ❌ No     |
| **2**  | **IP Redis Lock**                               | `vote_lock:<ip>:<pollId>` key with 24-hour TTL. Checked before DB insert for fast rejection                                |          ✅ Yes          |       ✅ Yes        |     ❌ No     |
| **3**  | **HTTP-only Cookie**                            | Server-set `pv_<pollId>=1` cookie. `httpOnly` flag prevents JS access. 24-hour `maxAge`                                    |          ❌ No           |        ❌ No        |    ✅ Yes     |
| **4**  | **localStorage** (client-side)                  | `voted_polls` array stored locally. Provides instant UI feedback before hitting the server                                 |          ❌ No           |        ❌ No        |    ✅ Yes     |

### How the Hardware Fingerprint Works

Unlike a random ID (which differs per browser), PulsePoll generates a **deterministic fingerprint** from hardware signals that produce the **same hash across all browsers on the same physical device**:

```mermaid
graph LR
    A["🎨 Canvas Fingerprint<br/><sub>GPU-specific text rendering</sub>"] --> HASH
    B["🖥️ WebGL Renderer<br/><sub>GPU vendor + model string</sub>"] --> HASH
    C["📐 Screen Signature<br/><sub>width × height × colorDepth × pixelRatio</sub>"] --> HASH
    D["🌍 Platform Signals<br/><sub>timezone · platform · language · cores</sub>"] --> HASH
    HASH["🔒 SHA-256 Hash<br/><sub>Same on Chrome, Firefox, Edge, Incognito</sub>"]

    style HASH fill:#1e1b4b,stroke:#8B5CF6,color:#fff
```

> **Why canvas fingerprinting works across browsers:** The HTML5 Canvas API renders text and shapes using the device's GPU and OS font rendering engine. The exact pixel output varies by hardware/driver/OS combination but is **identical regardless of which browser** is used on that machine.

---

## 🧩 Edge Cases Handled

### Input Validation & Sanitization

| Edge Case                    | How It's Handled                                                     |
| ---------------------------- | -------------------------------------------------------------------- |
| Empty question               | Server returns `400: Question is required`                           |
| Fewer than 2 options         | Server returns `400: At least 2 options are required`                |
| More than 10 options         | Server returns `400: Maximum 10 options allowed`                     |
| HTML/XSS in input            | All input is stripped of HTML tags and entities via `sanitizeText()` |
| Duplicate options            | Case-insensitive deduplication: `"React"` and `"react"` are caught   |
| Extremely long input         | Question truncated to 500 chars, options to 200 chars                |
| Empty options after sanitize | Filtered out; re-validated for minimum 2                             |

### Voting Integrity

| Edge Case                           | How It's Handled                                              |
| ----------------------------------- | ------------------------------------------------------------- |
| Invalid option ID                   | Server verifies option belongs to the poll before accepting   |
| Vote on inactive poll               | Server returns `403: This poll is no longer accepting votes`  |
| Missing fingerprint                 | Server returns `400: optionId and fingerprint are required`   |
| Race condition (simultaneous votes) | DB unique constraints handle atomically at the Postgres level |
| Option doesn't belong to poll       | Cross-verified: `option.poll_id === poll.id` check            |

### Infrastructure Resilience

| Edge Case                       | How It's Handled                                                                                    |
| ------------------------------- | --------------------------------------------------------------------------------------------------- |
| Redis down                      | **Fail-open** design — rate limiter and cache gracefully degrade; votes still recorded in Supabase  |
| Socket disconnects              | Viewer counts updated on `disconnecting` event; clients auto-reconnect                              |
| Multiple tabs                   | Socket rooms track unique connections; each tab joins independently                                 |
| DB rollback on creation failure | If option insert fails, the poll row is deleted (manual rollback)                                   |
| Vote count cache stale          | Cache invalidated on every new vote; 10-second TTL as safety net                                    |
| Share code collision            | 8-char code from 29-char alphabet = ~540 billion combinations; collision is astronomically unlikely |

---

## ⚠️ Known Limitations & Future Improvements

### Current Limitations

| Limitation                        | Why It Exists                                                          | Impact                                                                     |
| --------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **VPN bypass**                    | Different VPN = different IP, bypasses IP constraint                   | Low — fingerprint layer still catches same device                          |
| **Different physical device**     | Separate hardware = different fingerprint + different IP               | Expected — each person should get one vote                                 |
| **Canvas fingerprint collision**  | Two devices with identical GPU/OS/screen _could_ produce the same hash | Very rare — signals include multiple dimensions                            |
| **Cookie clearable via DevTools** | Power users can delete httpOnly cookies through browser DevTools       | Low — IP and fingerprint layers still active                               |
| **localStorage erasable**         | Clearing browser data removes local tracking                           | Mitigated — server-side layers (IP, cookie, fingerprint DB) are unaffected |
| **IP TTL is 24 hours**            | After 24h, the Redis IP lock expires                                   | Acceptable — matches industry standard for anonymous polls                 |
| **No authenticated voting**       | Anonymous voting means identity can't be 100% verified                 | By design — assignment specifies no login required                         |

### Future Improvements

| Improvement                       | Benefit                                                        |
| --------------------------------- | -------------------------------------------------------------- |
| **FingerprintJS Pro integration** | Industry-leading 99.5% accuracy device identification          |
| **CAPTCHA on vote**               | Prevents bot/scripted abuse                                    |
| **Poll expiration**               | Auto-close polls after configurable time                       |
| **Vote analytics dashboard**      | Geographic and temporal voting patterns                        |
| **Webhook notifications**         | Notify poll creator when votes come in                         |
| **Auth-optional mode**            | Allow poll creators to require login for higher-security polls |

---

## 🛠 Tech Stack

| Layer           | Technology                                | Purpose                                      |
| --------------- | ----------------------------------------- | -------------------------------------------- |
| **Frontend**    | React 19, Vite 7, TypeScript              | SPA framework                                |
| **Styling**     | Tailwind CSS v4, shadcn/ui, Framer Motion | Dark cosmic theme + animations               |
| **Icons**       | Lucide React                              | Consistent icon system                       |
| **Backend**     | Node.js, Express, TypeScript              | REST API + middleware                        |
| **Real-Time**   | Socket.IO                                 | WebSocket poll rooms                         |
| **Database**    | Supabase (Postgres 17)                    | Persistent storage for polls, options, votes |
| **Cache**       | Redis                                     | Rate limiting, IP locking, vote count cache  |
| **Fingerprint** | Canvas + WebGL + Web Crypto API           | Hardware-based device identification         |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Redis server (local or cloud)
- Supabase project (free tier works)

### Environment Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/SreeAditya-Dev/PulsePoll.git
   cd PulsePoll
   ```

2. **Backend setup**

   ```bash
   cd backend
   npm install
   ```

   Create `.env`:

   ```env
   PORT=4000
   CLIENT_URL=http://localhost:5173
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   REDIS_URL=redis://localhost:6379
   ```

3. **Run database migrations** — Execute the SQL files in `backend/sql/` in order against your Supabase project:

   ```
   001_create_polls.sql
   002_create_poll_options.sql
   003_create_votes.sql
   004_add_ip_constraint.sql
   ```

4. **Frontend setup**

   ```bash
   cd ../frontend
   npm install
   ```

5. **Start development servers**

   ```bash
   # Terminal 1 — Backend
   cd backend && npm run dev

   # Terminal 2 — Frontend
   cd frontend && npm run dev
   ```

6. **Open** [http://localhost:5173](http://localhost:5173)

---

## 📁 Project Structure

```
PulsePoll/
├── backend/
│   ├── src/
│   │   ├── config/          # Supabase + Redis clients
│   │   ├── middleware/       # Rate limiter + IP vote lock
│   │   ├── routes/           # REST endpoints (polls.ts)
│   │   ├── socket/           # Socket.IO room management
│   │   ├── utils/            # Fingerprint hashing, sanitization
│   │   └── index.ts          # Express + Socket.IO server
│   └── sql/                  # Database migration files
├── frontend/
│   ├── src/
│   │   ├── components/       # UI components (Navbar, VotePanel, etc.)
│   │   │   └── ui/           # shadcn/ui primitives
│   │   ├── hooks/            # usePollSocket WebSocket hook
│   │   ├── lib/              # API client, fingerprint, types, utils
│   │   └── pages/            # Home, Poll, NotFound
│   └── index.html
└── README.md
```

---

<p align="center">
  Built with ⚡ by <a href="https://github.com/SreeAditya-Dev">SreeAditya-Dev</a>
</p>
