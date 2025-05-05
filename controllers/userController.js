const User = require('../models/User');

// GET /user/:walletAddress
exports.getUserProfile = async (req, res, next) => {
    const walletAddress = req.user.walletAddress;

    try {
        const user = await User.findOne({ walletAddress });

        if (!user) {
            const newUser = await User.create({ walletAddress });
            console.log(`Created basic profile for ${walletAddress} on profile fetch.`);
            return res.status(200).json({
                walletAddress: newUser.walletAddress,
                username: newUser.username,
                avatar: newUser.avatar,
                badge: newUser.badge,
                totalWins: newUser.totalWins,
                totalLosses: newUser.totalLosses,
                totalWagered: newUser.totalWagered,
                createdAt: newUser.createdAt,
            });
        }

        res.status(200).json({
            walletAddress: user.walletAddress,
            username: user.username,
            avatar: user.avatar,
            badge: user.badge,
            totalWins: user.totalWins,
            totalLosses: user.totalLosses,
            totalWagered: user.totalWagered,
            createdAt: user.createdAt,
        });
    } catch (error) {
        next(error);
    }
};

// POST /user/update
exports.updateUserProfile = async (req, res, next) => {
    const walletAddress = req.user.walletAddress;
    const { username, avatar } = req.body;

    const updateData = {};
    if (username && typeof username === 'string' && username.trim().length > 2) {
        updateData.username = username.trim();
    }
    if (avatar && typeof avatar === 'string' && avatar.startsWith('http')) {
        updateData.avatar = avatar;
    }

    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: 'No valid fields provided for update.' });
    }

    try {
        const updatedUser = await User.findOneAndUpdate(
            { walletAddress },
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json({
            message: 'Profile updated successfully.',
            user: {
                username: updatedUser.username,
                avatar: updatedUser.avatar,
            }
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Username already taken.' });
        }
        next(error);
    }
};
