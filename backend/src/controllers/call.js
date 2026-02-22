const { randomUUID } = require('crypto');
const Call = require('../models/Call');

// POST /api/calls/create
const createCall = async (req, res) => {
    try {
        const roomId = randomUUID();
        const call = await Call.create({
            roomId,
            initiator: req.userId,
            participants: [{ user: req.userId }],
        });
        return res.status(201).json({ success: true, data: { call } });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to create call.' });
    }
};

// GET /api/calls/history
const getCallHistory = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const calls = await Call.find({ 'participants.user': req.userId })
            .populate('initiator', 'name email avatar')
            .populate('participants.user', 'name email avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Call.countDocuments({ 'participants.user': req.userId });

        return res.json({
            success: true,
            data: {
                calls,
                pagination: { page, limit, total, pages: Math.ceil(total / limit) },
            },
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to fetch call history.' });
    }
};

// PATCH /api/calls/:id/end
const endCall = async (req, res) => {
    try {
        const call = await Call.findOne({ roomId: req.params.id });
        if (!call) return res.status(404).json({ success: false, message: 'Call not found.' });

        const now = new Date();
        call.status = 'ended';
        call.endedAt = now;
        if (call.startedAt) {
            call.duration = Math.floor((now - call.startedAt) / 1000);
        }
        await call.save();

        return res.json({ success: true, data: { call } });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to end call.' });
    }
};

// GET /api/calls/:id
const getCall = async (req, res) => {
    try {
        const call = await Call.findOne({ roomId: req.params.id })
            .populate('initiator', 'name email avatar')
            .populate('participants.user', 'name email avatar');
        if (!call) return res.status(404).json({ success: false, message: 'Call not found.' });
        return res.json({ success: true, data: { call } });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to fetch call.' });
    }
};

module.exports = { createCall, getCallHistory, endCall, getCall };
