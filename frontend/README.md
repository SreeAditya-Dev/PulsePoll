# 🌐 PulsePoll Frontend

The responsive, real-time React application for PulsePoll. Built for speed and instant interactivity.

## ⚡ Performance Note (Client-Side)

Designed for low-latency environments:

- **Optimized Bundle Size:** Uses Vite for tree-shaking and code-splitting.
- **WebSocket Efficiency:** Maintains a single persistent connection for updates, avoiding HTTP overhead.
- **Instant UI Feedback:** Optimistic UI updates and local storage caching for immediate responsiveness even on slower networks (3G).

## 🛠 Tech Stack

- **Framework:** React 19 + Vite 7
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Components:** shadcn/ui (Radix Primitives)
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **State Management:** React Hooks + Context API

## 🏃‍♂️ Getting Started

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file (optional for local dev):

   ```env
   VITE_API_URL=http://localhost:4000/api
   VITE_SOCKET_URL=http://localhost:4000
   ```

3. **Run Development Server**

   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

## 📱 Key Features

- **Responsive Design:** Optimized for mobile, tablet, and desktop viewports.
- **Dark Mode:** Cosmic theme with deep blues and purples.
- **Real-Time Charts:** Live bar charts that animate as votes come in.
- **Share Modal:** Easy sharing via link copy or QR code.
