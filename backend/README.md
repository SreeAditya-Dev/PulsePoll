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

## 🛠 Tech Stack & Architecture Choices

### Core Runtime

- **Node.js**: Selected for its event-driven, non-blocking I/O model, which is ideal for real-time applications handling concurrent WebSocket connections and API requests.
- **Express.js**: simple, unopinioned web framework that allows for rapid API development and easy middleware integration (CORS, Rate Limiting).

### Real-Time Communication

- **Socket.IO**: Chosen over raw WebSockets because:
  - **Reliability**: Auto-reconnection and fallback to HTTP long-polling if WebSockets are blocked.
  - **Rooms**: Built-in support for "rooms" (one room per poll) makes broadcasting updates to specific groups of users trivial.
  - **Events**: Event-based architecture matches the "action -> reaction" flow of voting.

### Data Persistence

- **PostgreSQL (via Supabase)**:
  - **Relational Integrity**: Strict schema ensures valid relationships between Polls, Options, and Votes.
  - **ACID Compliance**: Crucial for ensuring that every vote is recorded accurately and permanent, preventing data loss during server restarts.
  - **Row Level Security**: While not used in this anonymous MVP, Supabase offers RLS for future auth-based features.

### Performance & Security

- **Redis**:
  - **High-Performance Caching**: Used to cache real-time vote counts (`poll_votes:<id>`), reducing DB load by serving reads from memory.
  - **Rate Limiting (Anti-Abuse)**: Stores short-lived keys (`vote_lock:<ip>`) to block spam voting at the network edge with sub-millisecond latency.
  - **Transient State**: Perfect for data that needs to expire automatically (like 24h IP locks).

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

- `POST /api/v1/polls` - Create a new poll
- `GET /api/v1/polls/:shareCode` - Get poll details
- `POST /api/v1/polls/:shareCode/vote` - Cast a vote
- `GET /api/v1/health` - Service health check

## 📡 Socket.IO Events

- `join-poll`: Client joins a poll room (room: `poll:<shareCode>`)
- `leave-poll`: Client leaves a poll room
- `poll-state`: Server sends initial state (tallies, viewer count)
- `vote-update`: Server broadcasts updated tallies
- `viewer-count`: Server broadcasts updated viewer count
