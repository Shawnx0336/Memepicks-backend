const mongoose = require('mongoose');

const ReferralSchema = new mongoose.Schema({
  referrerAddress: { type: String, required: true, index: true },
  referredAddress: { type: String, required: true, unique: true, index: true },
  firstSlipId: { type: mongoose.Schema.Types.ObjectId, ref: 'Slip', default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Referral', ReferralSchema);
