const express = require('express');
const chatController = require('../controllers/chatController');
// const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/history/:coin', chatController.getChatHistory);
router.get('/history', chatController.getChatHistory);

module.exports = router;
