const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const { register, login, refreshToken, logout } = require('../controllers/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const RefreshToken = require('../models/RefreshToken');

// Local auth
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

// ─── Google OAuth ─────────────────────────────────────────────────────────────

// Step 1: Redirect to Google
router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

// Step 2: Google redirects back here
router.get(
    '/google/callback',
    passport.authenticate('google', {
        failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_failed`,
        session: false,
    }),
    async (req, res) => {
        try {
            const user = req.user;
            const accessToken = generateAccessToken(user._id);
            const newRefreshToken = generateRefreshToken(user._id);

            await RefreshToken.create({
                token: newRefreshToken,
                user: user._id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            });

            // Use lax so cookie is sent on the redirect
            res.cookie('refreshToken', newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            // Redirect frontend with token — callback page will call /users/me
            res.redirect(
                `${process.env.FRONTEND_URL}/auth/callback?token=${accessToken}`
            );
        } catch (err) {
            console.error('Google callback error:', err);
            res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
        }
    }
);

module.exports = router;
