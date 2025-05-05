const Referral = require('../models/Referral');
const User = require('../models/User');

// GET /referral/:walletAddress
exports.getReferralStats = async (req, res, next) => {
    const walletAddress = req.user.walletAddress;

    try {
        const referralCount = await Referral.countDocuments({ referrerAddress: walletAddress });
        const totalEarnings = 0;

        res.status(200).json({
            walletAddress: walletAddress,
            successfulReferrals: referralCount,
            totalEarnings: totalEarnings,
        });
    } catch (error) {
        next(error);
    }
};
