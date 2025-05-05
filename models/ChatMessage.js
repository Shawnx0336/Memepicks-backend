const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  room: { type: String, required: true, index: true },
  walletAddress: { type: String, required: true },
  username: { type: String, required: true },
  message: { type: String, required: true, trim: true },
  timestamp: { type: Date, default: Date.now, index: true },
});

// Optional: Uncomment to auto-delete messages older than 7 days
// ChatMessageSchema.index({ timestamp: 1 }, { expireAfterSeconds: 604800 });

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);
