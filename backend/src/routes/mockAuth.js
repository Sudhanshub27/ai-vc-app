/**
 * Mock Auth Routes — provides Google-like sign-in without real Google OAuth or MongoDB.
 * Uses an in-memory user store and real JWT tokens so the rest of the app works normally.
 */
const express = require('express');
const router = express.Router();
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');

// ─── In-memory user store (persists for the lifetime of the server process) ───
const mockUsers = new Map(); // keyed by a deterministic "mock" id

function getOrCreateMockUser() {
    const mockId = 'mock-google-user-001';
    if (!mockUsers.has(mockId)) {
        mockUsers.set(mockId, {
            _id: mockId,
            id: mockId,
            name: 'Demo User',
            email: 'demo@signbridge.app',
            avatar: '',
            role: 'both',
            authProvider: 'google',
            isOnline: true,
        });
    }
    return mockUsers.get(mockId);
}

// GET /api/auth/google/mock — one-click "Google" sign in (no real OAuth)
router.get('/google/mock', (req, res) => {
    try {
        const user = getOrCreateMockUser();
        const accessToken = generateAccessToken(user._id);

        // Redirect to the existing frontend callback page with the token
        res.redirect(
            `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?token=${accessToken}&mock=true`
        );
    } catch (err) {
        console.error('Mock Google login error:', err);
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=server_error`);
    }
});

// GET /api/users/me — override only when user is a mock user (checked via mock id in JWT)
// We handle this in a separate middleware so it doesn't conflict with the real route.

module.exports = router;

// Also export the mock users map so the middleware can look up mock users
module.exports.mockUsers = mockUsers;
module.exports.getOrCreateMockUser = getOrCreateMockUser;
