const express = require('express');
const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.send('OK');
});

// Mock trending props endpoint
router.get('/props/trending', (req, res) => {
  res.json([
    {
      coin: 'SOL',
      prediction: 'up',
      odds: 1.75
    },
    {
      coin: 'BONK',
      prediction: 'down',
      odds: 2.0
    }
  ]);
});

module.exports = router;
