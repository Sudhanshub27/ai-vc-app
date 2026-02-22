const mongoose = require('mongoose');

const CallSchema = new mongoose.Schema(
    {
        roomId: {
            type: String,
            required: true,
            unique: true,
        },
        initiator: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        participants: [
            {
                user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                joinedAt: { type: Date, default: Date.now },
                leftAt: { type: Date },
            },
        ],
        status: {
            type: String,
            enum: ['waiting', 'active', 'ended'],
            default: 'waiting',
        },
        startedAt: {
            type: Date,
        },
        endedAt: {
            type: Date,
        },
        duration: {
            type: Number, // seconds
            default: 0,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Call', CallSchema);
