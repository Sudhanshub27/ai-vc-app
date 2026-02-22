const express = require('express');
const router = express.Router();
const { getMe, updateMe, searchUsers } = require('../controllers/user');
const { protect } = require('../middleware/auth');

router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.get('/search', protect, searchUsers);

module.exports = router;
