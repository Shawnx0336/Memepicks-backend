const mongoose = require('mongoose');

const PickSchema = new mongoose.Schema({
  propId: { type: String, required: true },
  token: { type: String, required: true },
  description: { type: String },
  choice: { type: String, required: true },
}, { _id: false });

const SlipSchema = new mongoose.Schema({
  walletAddress: { type: String, required: true, index: true },
  picks: {
    type: [PickSchema],
    required: true,
    validate: [val => val.length >= 2 && val.length <= 5, '{PATH} must have 2–5 picks']
  },
  wager: { type: Number, required: true, min: 0.1, max: 10 },
  multiplier: { type: Number, required: true },
  potentialPayout: { type: Number, required: true },
  rngSeed: { type: String, default: null },
  rngSeedHash: { type: String, required: true },
  rngResult: { type: [Boolean], default: null },
  status: { type: String, enum: ['pending', 'won', 'lost', 'expired', 'error'], default: 'pending', index: true },
  isResolved: { type: Boolean, default: false },
  resolvedAt: { type: Date },
  duration: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: true },
  referrerAddress: { type: String, default: null, index: true },
  createdAt: { type: Date, default: Date.now },
});

SlipSchema.pre('save', function (next) {
  this.potentialPayout = this.wager * this.multiplier;
  next();
});

module.exports = mongoose.model('Slip', SlipSchema);
