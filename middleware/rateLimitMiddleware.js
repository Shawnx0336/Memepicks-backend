const rateLimitStore = new Map();
const slipCooldownStore = new Map();

const MAX_REQUESTS_PER_HOUR = 10;
const SLIP_COOLDOWN_SECONDS = 30;

const rateLimiter = (req, res, next) => {
    const walletAddress = req.user?.walletAddress;
    if (!walletAddress) return res.status(401).json({ message: 'Unauthorized' });

    const now = Date.now();
    const windowStart = now - (60 * 60 * 1000);

    const userRequests = (rateLimitStore.get(walletAddress) || [])
        .filter(timestamp => timestamp > windowStart);

    if (userRequests.length >= MAX_REQUESTS_PER_HOUR) {
        return res.status(429).json({ message: 'Too many requests, please try again later.' });
    }

    userRequests.push(now);
    rateLimitStore.set(walletAddress, userRequests);
    next();
};

const slipCooldown = (req, res, next) => {
    const walletAddress = req.user?.walletAddress;
    if (!walletAddress) return res.status(401).json({ message: 'Unauthorized' });

    const now = Date.now();
    const last = slipCooldownStore.get(walletAddress);

    if (last && (now - last) / 1000 < SLIP_COOLDOWN_SECONDS) {
        const remaining = Math.ceil(SLIP_COOLDOWN_SECONDS - (now - last) / 1000);
        return res.status(429).json({ message: `Wait ${remaining}s before submitting again.` });
    }

    next();
};

module.exports = { rateLimiter, slipCooldown };
