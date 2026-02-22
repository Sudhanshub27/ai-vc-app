# SignBridge Backend API

Express + Socket.IO + MongoDB backend for the SignBridge AI video calling application.

## Setup

### Step 1 — Install dependencies
```bash
npm install
```

### Step 2 — Create `.env` file
Copy the example and fill in your values:
```bash
copy .env.example .env
```

Edit `.env` with your actual values:

| Variable | Description |
|---|---|
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `JWT_ACCESS_SECRET` | Random 64-char secret (run: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`) |
| `JWT_REFRESH_SECRET` | Different random 64-char secret (same command) |
| `FRONTEND_URL` | `http://localhost:3000` for development |

> **To get your MongoDB URI:**
> 1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
> 2. Click your cluster → **Connect** → **Drivers** → **Node.js**
> 3. Copy the connection string and replace `<password>` with your DB user password

### Step 3 — Start the server
```bash
npm run dev
```
Server runs on `http://localhost:5000`

## API Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Login |
| POST | `/api/auth/refresh` | Cookie | Refresh access token |
| POST | `/api/auth/logout` | Cookie | Logout |
| GET | `/api/users/me` | Bearer | Get my profile |
| PUT | `/api/users/me` | Bearer | Update profile |
| GET | `/api/users/search?q=` | Bearer | Search users |
| POST | `/api/calls/create` | Bearer | Create a call room |
| GET | `/api/calls/history` | Bearer | Paginated call history |
| GET | `/api/calls/:id` | Bearer | Get call by roomId |
| PATCH | `/api/calls/:id/end` | Bearer | End a call |
| POST | `/api/ai/caption` | Bearer | **AI stub** — see route file |

## Socket.IO Events

| Event | Direction | Description |
|---|---|---|
| `join-room` | Client → Server | Join a video call room |
| `offer` | Client → Server | Send WebRTC SDP offer |
| `answer` | Client → Server | Send WebRTC SDP answer |
| `ice-candidate` | Client → Server | Send ICE candidate |
| `speech-caption` | Client → Server | Broadcast STT caption |
| `sign-caption` | Client → Server | Broadcast AI sign caption |
| `user-joined` | Server → Client | New user joined |
| `user-left` | Server → Client | User left |
| `room-users` | Server → Client | Current room participants |

## AI Integration

See `src/routes/ai.js` for detailed instructions on integrating the Python AI model into the `/api/ai/caption` endpoint.
