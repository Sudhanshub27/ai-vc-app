const express = require('express');
const router = express.Router();
const { register, login, refreshToken, logout } = require('../controllers/auth');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

module.exports = router;
