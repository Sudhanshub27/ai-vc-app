const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

/**
 * POST /api/ai/caption
 * 
 * AI STUB ENDPOINT — Hand Gesture Recognition
 * ============================================
 * This endpoint is a placeholder for the AI team to implement.
 * 
 * Expected request body:
 *   { frame: "<base64 encoded image frame>" }
 * 
 * Expected response:
 *   { success: true, data: { text: "<recognized sign language text>", confidence: 0.95 } }
 * 
 * The frontend's CaptionsOverlay component polls this endpoint during a call
 * and displays the returned text as captions to the hearing user.
 * 
 * TO INTEGRATE:
 *   1. Replace the stub implementation below with a call to your Python AI service
 *   2. Example: const response = await fetch(process.env.AI_SERVICE_URL + '/predict', ...)
 */
router.post('/caption', protect, async (req, res) => {
    try {
        const { frame } = req.body;

        if (!frame) {
            return res.status(400).json({ success: false, message: 'No frame provided.' });
        }

        // === STUB: Replace this with actual AI model call ===
        // const aiResponse = await callAIModel(frame);
        // return res.json({ success: true, data: { text: aiResponse.text, confidence: aiResponse.confidence } });

        return res.json({
            success: true,
            data: {
                text: '', // AI team: return recognized sign language text here
                confidence: 0,
                stub: true,
            },
        });
    } catch (err) {
        console.error('AI caption error:', err);
        return res.status(500).json({ success: false, message: 'AI service error.' });
    }
});

module.exports = router;
