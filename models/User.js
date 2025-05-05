const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  walletAddress: { type: String, required: true, unique: true, index: true },
  username: { type: String, trim: true, default: null },
  avatar: { type: String, default: null },
  badge: { type: String, default: 'Newbie' },
  totalWins: { type: Number, default: 0 },
  totalLosses: { type: Number, default: 0 },
  totalWagered: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

UserSchema.pre('save', function (next) {
  if (!this.username) {
    this.username = `${this.walletAddress.substring(0, 6)}...${this.walletAddress.substring(this.walletAddress.length - 4)}`;
  }
  next();
});

module.exports = mongoose.model('User', UserSchema);
