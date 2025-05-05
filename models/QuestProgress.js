const mongoose = require('mongoose');

const QuestProgressSchema = new mongoose.Schema({
  walletAddress: { type: String, required: true, index: true },
  questId: { type: String, required: true, index: true },
  progress: { type: Number, default: 0 },
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date },
  periodIdentifier: { type: String, required: true, index: true },
  lastUpdatedAt: { type: Date, default: Date.now },
});

QuestProgressSchema.index({ walletAddress: 1, questId: 1, periodIdentifier: 1 }, { unique: true });

module.exports = mongoose.model('QuestProgress', QuestProgressSchema);
