const mongoose = require('mongoose');

const RefreshTokenSchema = new mongoose.Schema({
    token: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 7 }, // auto-delete after 7 days
});

module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);
