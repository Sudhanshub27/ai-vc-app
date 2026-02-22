const express = require('express');
const router = express.Router();
const { createCall, getCallHistory, endCall, getCall } = require('../controllers/call');
const { protect } = require('../middleware/auth');

router.post('/create', protect, createCall);
router.get('/history', protect, getCallHistory);
router.get('/:id', protect, getCall);
router.patch('/:id/end', protect, endCall);

module.exports = router;
