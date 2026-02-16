# ⚙️ PulsePoll Backend

The robust Node.js/Express server powering PulsePoll's real-time voting capabilities.

## 🚀 Performance Metrics (Local Host Baseline)

Tests executed via TestSprite & Custom Node.js Script:

| Metric                     | Result       | UX Assessment |
| -------------------------- | ------------ | ------------- |
| **API Health Check RTT**   | **5.85 ms**  | ⚡ Instant    |
| **WebSocket Handshake**    | **11.65 ms** | ⚡ Instant    |
| **Poll Join to Data Load** | **250 ms**   | 🟢 Fast       |

> **Note on Low Network Areas:**
> The architecture uses **Socket.IO over WebSocket**, which maintains a single persistent connection. This is significantly better for low-bandwidth environments than standard REST polling, as it avoids repeated HTTP handshake overhead. Even with 300ms network latency, the app will remain responsive.

## 🛠 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Real-Time:** Socket.IO
- **Database:** Supabase (PostgreSQL)
- **Cache/Rate Limit:** Redis
- **Security:** Helmet, CORS, Cookie-Parser, Rate-Limit

## 🏃‍♂️ Getting Started

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file:

   ```env
   PORT=4000
   CLIENT_URL=http://localhost:5173
   SUPABASE_URL=...
   SUPABASE_ANON_KEY=...
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_USERNAME=default
   REDIS_PASSWORD=...
   ```

3. **Database Setup**
   Run the SQL migrations found in `sql/` against your Supabase project.

4. **Run Development Server**
   ```bash
   npm run dev
   ```

## 🔌 API Endpoints

- `POST /api/polls` - Create a new poll
- `GET /api/polls/:shareCode` - Get poll details
- `POST /api/polls/:shareCode/vote` - Cast a vote

## 📡 Socket.IO Events

- `join-poll`: Client joins a poll room (room: `poll:<shareCode>`)
- `leave-poll`: Client leaves a poll room
- `poll-state`: Server sends initial state (tallies, viewer count)
- `vote-update`: Server broadcasts updated tallies
- `viewer-count`: Server broadcasts updated viewer count
