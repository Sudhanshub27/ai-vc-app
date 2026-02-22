const User = require('../models/User');

// GET /api/users/me
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
        return res.json({ success: true, data: { user } });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// PUT /api/users/me
const updateMe = async (req, res) => {
    try {
        const { name, avatar, role } = req.body;
        const user = await User.findByIdAndUpdate(
            req.userId,
            { name, avatar, role },
            { new: true, runValidators: true }
        );
        return res.json({ success: true, data: { user } });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to update profile.' });
    }
};

// GET /api/users/search?q=
const searchUsers = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim().length < 2) {
            return res.status(400).json({ success: false, message: 'Search query must be at least 2 characters.' });
        }
        const regex = new RegExp(q, 'i');
        const users = await User.find({
            $or: [{ name: regex }, { email: regex }],
            _id: { $ne: req.userId },
        }).select('name email avatar role isOnline').limit(20);
        return res.json({ success: true, data: { users } });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Search failed.' });
    }
};

module.exports = { getMe, updateMe, searchUsers };
