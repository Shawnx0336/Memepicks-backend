const mongoose = require('mongoose');

const QuestSchema = new mongoose.Schema({
  questId: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  type: { type: String, enum: ['daily', 'weekly'], required: true },
  goal: { type: Number, required: true },
  metric: { type: String, required: true },
  reward: { type: Number, default: 0.1 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Quest', QuestSchema);
