const Call = require('../models/Call');
const SignClassifier = require('../utils/signClassifier');

// Track active rooms: roomId -> { socketId -> userId }
const rooms = new Map();

const initSocketHandlers = (io) => {
    // JWT-lite verification for socket connections
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error('Authentication required'));
        try {
            const jwt = require('jsonwebtoken');
            const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            socket.userId = decoded.id;
            next();
        } catch {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`🔌 Socket connected: ${socket.id} (user: ${socket.userId})`);

        // Join a call room
        socket.on('join-room', async ({ roomId }) => {
            socket.join(roomId);

            if (!rooms.has(roomId)) rooms.set(roomId, new Map());
            rooms.get(roomId).set(socket.id, socket.userId);

            // Notify others in the room
            socket.to(roomId).emit('user-joined', {
                socketId: socket.id,
                userId: socket.userId,
            });

            // Update call record
            try {
                const call = await Call.findOne({ roomId });
                if (call && call.status === 'waiting') {
                    call.status = 'active';
                    call.startedAt = new Date();
                    const alreadyIn = call.participants.some(
                        (p) => p.user?.toString() === socket.userId
                    );
                    if (!alreadyIn) {
                        call.participants.push({ user: socket.userId });
                    }
                    await call.save();
                }
            } catch (err) {
                console.error('Socket join-room DB error:', err.message);
            }

            // Send room participants back to joiner
            const roomParticipants = rooms.get(roomId)
                ? [...rooms.get(roomId).entries()].map(([sid, uid]) => ({ socketId: sid, userId: uid }))
                : [];
            socket.emit('room-users', roomParticipants);
        });

        // WebRTC Offer (forwarding SDP offer to specific peer)
        socket.on('offer', ({ to, offer }) => {
            console.log(`📡 Offer: ${socket.id} -> ${to}`);
            io.to(to).emit('offer', { from: socket.id, offer });
        });

        // WebRTC Answer
        socket.on('answer', ({ to, answer }) => {
            console.log(`📡 Answer: ${socket.id} -> ${to}`);
            io.to(to).emit('answer', { from: socket.id, answer });
        });

        // ICE Candidate relay
        socket.on('ice-candidate', ({ to, candidate }) => {
            console.log(`📡 ICE: ${socket.id} -> ${to}`);
            io.to(to).emit('ice-candidate', { from: socket.id, candidate });
        });

        // Speech-to-text caption from hearing user → broadcast to room
        socket.on('speech-caption', ({ roomId, text }) => {
            socket.to(roomId).emit('speech-caption', { text, from: socket.userId });
        });

        // Hand landmarks from deaf user → process and broadcast caption
        socket.on('hand-landmarks', ({ roomId, landmarks }) => {
            if (landmarks && landmarks.length > 0) {
                // Throttle: once per second
                const now = Date.now();
                if (!socket.lastSignCaptionAt || now - socket.lastSignCaptionAt > 1000) {
                    
                    // We take the first hand detected for simplicity
                    const detectedSign = SignClassifier.classify(landmarks[0]);
                    
                    if (detectedSign) {
                        socket.lastSignCaptionAt = now;
                        console.log(`🤖 AI: Detected "${detectedSign}" sign from ${socket.id}`);
                        io.to(roomId).emit('sign-caption', { 
                            text: detectedSign, 
                            confidence: 0.95, 
                            from: socket.userId 
                        });
                    }
                }
            }
        });

        // Sign language caption from AI → broadcast to room
        // AI team: emit this event from backend after processing
        socket.on('sign-caption', ({ roomId, text, confidence }) => {
            socket.to(roomId).emit('sign-caption', { text, confidence, from: socket.userId });
        });

        // Handle disconnect
        socket.on('disconnect', async () => {
            console.log(`❌ Socket disconnected: ${socket.id}`);
            for (const [roomId, participants] of rooms.entries()) {
                if (participants.has(socket.id)) {
                    participants.delete(socket.id);
                    socket.to(roomId).emit('user-left', { socketId: socket.id, userId: socket.userId });

                    if (participants.size === 0) {
                        rooms.delete(roomId);
                        // End the call when everyone leaves
                        try {
                            const call = await Call.findOne({ roomId });
                            if (call && call.status !== 'ended') {
                                call.status = 'ended';
                                call.endedAt = new Date();
                                if (call.startedAt) {
                                    call.duration = Math.floor((call.endedAt - call.startedAt) / 1000);
                                }
                                await call.save();
                            }
                        } catch (err) {
                            console.error('Socket disconnect DB error:', err.message);
                        }
                    }
                    break;
                }
            }
        });
    });
};

module.exports = { initSocketHandlers };
