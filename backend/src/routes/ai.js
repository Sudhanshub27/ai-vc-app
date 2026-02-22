const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

const mockPhrases = [
    "Hello", "How are you?", "Thank you", "Yes", "No",
    "Please", "I understand", "Good morning", "Goodbye", "Nice to meet you"
];

/**
 * POST /api/ai/caption
 * 
 * AI STUB ENDPOINT — Hand Gesture Recognition
 * ============================================
 * Expected request body:
 *   { frame: "<base64 encoded image frame>" }
 * 
 * Expected response:
 *   { success: true, data: { text: "<recognized sign language text>", confidence: <number> } }
 */
router.post('/caption', protect, async (req, res) => {
    try {
        const { frame } = req.body;

        if (!frame) {
            return res.status(400).json({ success: false, message: 'No frame provided.' });
        }

        const aiServiceUrl = process.env.AI_SERVICE_URL;

        // --- LIVE MODE ---
        if (aiServiceUrl) {
            try {
                // Call the actual Python AI service
                const response = await fetch(`${aiServiceUrl}/predict`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ frame: frame })
                });

                if (!response.ok) {
                    throw new Error(`AI service responded with status: ${response.status}`);
                }

                const data = await response.json();
                return res.json({
                    success: true,
                    data: {
                        text: data.text || '', // Assuming the AI returns { text: "..." }
                        confidence: data.confidence || 0,
                        stub: false,
                    }
                });

            } catch (error) {
                console.error('Error calling live AI service:', error.message);
                return res.status(502).json({ success: false, message: 'Failed to communicate with AI service.', error: error.message });
            }
        }

        // --- MOCK MODE ---
        // If no AI_SERVICE_URL is provided, simulate processing and return a random phrase
        
        // Simulate a small delay (e.g., 200ms to 600ms)
        const delay = Math.floor(Math.random() * 400) + 200;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Pick a random phrase and confidence
        const randomPhrase = mockPhrases[Math.floor(Math.random() * mockPhrases.length)];
        const randomConfidence = (Math.random() * (0.99 - 0.85) + 0.85).toFixed(2); // Random between 0.85 and 0.99

        return res.json({
            success: true,
            data: {
                text: randomPhrase,
                confidence: parseFloat(randomConfidence),
                stub: true,
            },
        });

    } catch (err) {
        console.error('AI caption error:', err);
        return res.status(500).json({ success: false, message: 'Internal AI service error.' });
    }
});

module.exports = router;
