const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');

// POST /api/auth/register
const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'Email is already registered.' });
        }

        const user = await User.create({ name, email, password, role: role || 'both' });

        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        await RefreshToken.create({
            token: refreshToken,
            user: user._id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(201).json({
            success: true,
            message: 'Account created successfully.',
            data: {
                accessToken,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    avatar: user.avatar,
                },
            },
        });
    } catch (err) {
        console.error('Register error:', err);
        return res.status(500).json({ success: false, message: 'Server error during registration.' });
    }
};

// POST /api/auth/login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        await RefreshToken.create({
            token: refreshToken,
            user: user._id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.json({
            success: true,
            message: 'Logged in successfully.',
            data: {
                accessToken,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    avatar: user.avatar,
                },
            },
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ success: false, message: 'Server error during login.' });
    }
};

// POST /api/auth/refresh
const refreshToken = async (req, res) => {
    try {
        const token = req.cookies.refreshToken;
        if (!token) {
            return res.status(401).json({ success: false, message: 'No refresh token.' });
        }

        const decoded = verifyRefreshToken(token);
        const storedToken = await RefreshToken.findOne({ token });

        if (!storedToken) {
            return res.status(401).json({ success: false, message: 'Refresh token revoked.' });
        }

        // Rotate refresh token
        await RefreshToken.deleteOne({ token });
        const newRefreshToken = generateRefreshToken(decoded.id);
        const newAccessToken = generateAccessToken(decoded.id);

        await RefreshToken.create({
            token: newRefreshToken,
            user: decoded.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.json({ success: true, data: { accessToken: newAccessToken } });
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
    }
};

// POST /api/auth/logout
const logout = async (req, res) => {
    try {
        const token = req.cookies.refreshToken;
        if (token) {
            await RefreshToken.deleteOne({ token });
        }
        res.clearCookie('refreshToken');
        return res.json({ success: true, message: 'Logged out successfully.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Logout failed.' });
    }
};

module.exports = { register, login, refreshToken, logout };
