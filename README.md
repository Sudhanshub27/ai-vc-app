# SignBridge - AI-Powered Sign Language Video Calling

SignBridge is a full-stack web application designed to facilitate seamless communication between sign language users and non-signers during video calls. It leverages computer vision for sign language recognition and WebRTC for high-quality video communication.

## 🌟 Features

- **Real-time Sign Recognition**: Uses MediaPipe Hands on the frontend to detect and interpret sign language gestures.
- **AI-Powered Sentence Framing**: Integrates with Google Gemini AI to transform recognized words into coherent, natural sentences.
- **Video Calling**: Peer-to-peer video communication using WebRTC (Simple-Peer).
- **Secure Authentication**: User authentication via JWT and Google OAuth.
- **Real-time Updates**: Socket.io for instant messaging and call signaling.

## 🏗️ Project Structure

```text
ai-vc-app/
├── frontend/          # Next.js frontend application
│   ├── src/           # React components and hooks
│   └── public/        # Static assets
├── backend/           # Node.js Express server
│   ├── src/           # API routes, controllers, and models
│   └── .env           # Server environment variables
└── dev.sh             # Development startup script
```

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [MongoDB](https://www.mongodb.com/) (Atlas or local instance)
- [Google Gemini API Key](https://aistudio.google.com/) (Optional, with fallback)

### Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/ayushmaninbox/ai-vc-app.git
    cd ai-vc-app
    ```

2.  **Environment Variables**:
    Ensure `backend/.env` is configured with your credentials. You can use `backend/.env.example` as a template.

3.  **Run the Application**:
    The included `dev.sh` script installs dependencies and starts both the frontend and backend in development mode.

    ```bash
    ./dev.sh
    ```

## 📡 Endpoints

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

## 🛠️ Tech Stack

- **Frontend**: Next.js, React, MediaPipe, Socket.io-client, simple-peer, Tailwind CSS.
- **Backend**: Node.js, Express, MongoDB/Mongoose, Socket.io, Google Generative AI (Gemini).

---
Developed as an AI-powered accessibility solution.
