// server.js
require('dotenv').config(); // Load environment variables
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const connectDB = require('./config/db');
const initializeSocket = require('./socket/chat'); // Import socket setup

// --- Middleware Imports ---
const authenticateToken = require('./middleware/authMiddleware');
const { rateLimiter, slipCooldown } = require('./middleware/rateLimitMiddleware');

// --- Route Imports ---
const slipRoutes = require('./routes/slipRoutes');
const priceRoutes = require('./routes/priceRoutes');
const referralRoutes = require('./routes/referralRoutes');
const userRoutes = require('./routes/userRoutes');
const questRoutes = require('./routes/questRoutes');
const tipRoutes = require('./routes/tipRoutes');
const chatRoutes = require('./routes/chatRoutes');
const miscRoutes = require('./routes/miscRoutes'); // ✅ Added

// --- Basic Configuration ---
const PORT = process.env.PORT || 5001; // Use environment variable or default
const app = express();
const server = http.createServer(app);

// --- Database Connection ---
connectDB();

// --- Core Middleware ---
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Middleware to parse JSON bodies

// --- Public Routes ---
app.use('/', miscRoutes); // ✅ Added - for /health and /props/trending
app.use('/api/price', priceRoutes);
app.use('/api/chat', chatRoutes); // Chat history endpoint

// --- Protected Routes (Apply JWT Auth) ---
app.use('/api/slips', authenticateToken, slipRoutes); // History needs auth
app.use('/api/submit-slip', authenticateToken, rateLimiter, slipCooldown, slipRoutes); // Submit needs auth + rate limits
app.use('/api/slip-result', authenticateToken, slipRoutes); // Result needs auth
app.use('/api/referral', authenticateToken, referralRoutes);
app.use('/api/user', authenticateToken, userRoutes);
app.use('/api/quests', authenticateToken, questRoutes);
app.use('/api/tip', authenticateToken, rateLimiter, tipRoutes); // Tip needs auth + rate limit

// --- Socket.io Setup ---
const io = initializeSocket(server); // Pass the HTTP server to Socket.io setup
app.set('io', io); // Make io accessible in request handlers if needed

// --- Basic Error Handling Middleware (Example) ---
app.use((err, req, res, next) => {
  console.error("Error:", err.stack || err.message || err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {} // Only show stack trace in development
  });
});

// --- Start Server ---
server.listen(PORT, () => {
  console.log(`MemePicks backend server running on port ${PORT}`);
});

module.exports = { app, server }; // Export for potential testing
