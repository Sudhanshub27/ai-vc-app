# SignBridge Frontend

Next.js 14 + Tailwind CSS frontend for the SignBridge AI video calling application.

## Setup

### Step 1 — Install dependencies
```bash
npm install
```

### Step 2 — Configure environment
`.env.local` is already created. If you change the backend port, update it:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

### Step 3 — Start development server
```bash
npm run dev
```
Frontend runs on `http://localhost:3000`

## Pages

| Route | Page |
|---|---|
| `/` | Landing page with hero, features |
| `/login` | Sign in |
| `/signup` | Create account (choose deaf/hearing/both role) |
| `/dashboard` | Home: start calls, search users, recent calls |
| `/call/[roomId]` | Live video call with captions |
| `/profile` | Edit name & role |
| `/history` | Paginated call history |

## Features

- **WebRTC** peer-to-peer video calling via `simple-peer`
- **Socket.IO** for real-time signaling and caption relay
- **Web Speech API** — hearing user's speech auto-captioned for deaf user
- **Sign language captions** — displayed when AI team integrates `/api/ai/caption`
- Dark mode glassmorphism UI with violet/teal gradient theme
