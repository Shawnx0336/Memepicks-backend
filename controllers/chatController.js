const ChatMessage = require('../models/ChatMessage');

// GET /chat/history/:coin
exports.getChatHistory = async (req, res, next) => {
    const room = req.params.coin || 'global';
    const limit = parseInt(req.query.limit) || 50;

    try {
        const messages = await ChatMessage.find({ room })
            .sort({ timestamp: -1 })
            .limit(limit)
            .select('username walletAddress message timestamp -_id');

        res.status(200).json(messages.reverse());
    } catch (error) {
        next(error);
    }
};
