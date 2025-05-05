const Slip = require('../models/Slip');
const User = require('../models/User');
const Referral = require('../models/Referral');
const { generateRngSeed, hashSeed, deriveResultFromSeed } = require('../utils/rngUtils');
const { calculateExpiry } = require('../utils/timerUtils');
const { slipCooldownStore } = require('../middleware/rateLimitMiddleware');

const SLIP_COOLDOWN_SECONDS = 30;

// POST /submit-slip
exports.submitSlip = async (req, res, next) => {
    const { picks, wager, duration, referrerWallet } = req.body;
    const walletAddress = req.user.walletAddress;

    // --- Basic Validation ---
    if (!picks || !Array.isArray(picks) || picks.length < 2 || picks.length > 5) {
        return res.status(400).json({ message: 'Invalid number of picks (must be 2-5).' });
    }
    if (typeof wager !== 'number' || wager < 0.1 || wager > 10) {
        return res.status(400).json({ message: 'Invalid wager amount (must be 0.1-10).' });
    }
    if (!duration || !['5m', '1h', '24h'].includes(duration)) {
        return res.status(400).json({ message: 'Invalid or missing duration (5m, 1h, 24h).' });
    }

    // --- Calculate Multiplier & Expiry ---
    const multipliers = { 2: 2, 3: 5, 4: 10, 5: 20 };
    const multiplier = multipliers[picks.length];
    if (!multiplier) {
        return res.status(400).json({ message: 'Could not determine multiplier for picks.' });
    }
    const expiresAt = calculateExpiry(duration);
    if (!expiresAt) {
        return res.status(400).json({ message: 'Invalid duration format.' });
    }

    // --- Provably Fair RNG ---
    const seed = generateRngSeed();
    const seedHash = hashSeed(seed);

    // --- TODO: Wallet Balance Check / Faucet Logic ---
    const isFaucetMode = !walletAddress;
    if (!isFaucetMode) {
        console.log(`Wallet mode submission for ${walletAddress}`);
    } else {
        console.log(`Faucet mode submission`);
    }

    try {
        // --- Create and Save Slip ---
        const newSlip = new Slip({
            walletAddress,
            picks,
            wager,
            multiplier,
            duration,
            expiresAt,
            rngSeedHash: seedHash,
            referrerAddress: referrerWallet || null,
        });

        const savedSlip = await newSlip.save();

        // --- Update Cooldown ---
        slipCooldownStore.set(walletAddress, Date.now());

        // --- Update User Stats ---
        await User.findOneAndUpdate(
            { walletAddress },
            { $inc: { totalWagered: wager } },
            { upsert: true, new: true }
        );

        // --- Handle Referral Tracking ---
        if (referrerWallet) {
            const existingReferral = await Referral.findOne({ referredAddress: walletAddress });
            if (!existingReferral) {
                if (referrerWallet !== walletAddress) {
                    console.log(`Tracking referral: ${referrerWallet} referred ${walletAddress}`);
                    await Referral.create({
                        referrerAddress: referrerWallet,
                        referredAddress: walletAddress,
                        firstSlipId: savedSlip._id,
                    });
                } else {
                    console.warn(`Self-referral attempt blocked for ${walletAddress}`);
                }
            } else {
                console.log(`Referral already tracked for ${walletAddress}`);
            }
        }

        // --- Respond to Frontend ---
        res.status(201).json({
            message: 'Slip submitted successfully!',
            slipId: savedSlip._id,
            seedHash: savedSlip.rngSeedHash,
            expiresAt: savedSlip.expiresAt,
        });

    } catch (error) {
        next(error);
    }
};

// GET /slip-result/:slipId
exports.getSlipResult = async (req, res, next) => {
    const { slipId } = req.params;
    const walletAddress = req.user.walletAddress;

    try {
        const slip = await Slip.findById(slipId);

        if (!slip) {
            return res.status(404).json({ message: 'Slip not found.' });
        }

        if (slip.walletAddress !== walletAddress) {
            return res.status(403).json({ message: 'Forbidden: You do not own this slip.' });
        }

        if (slip.status === 'pending' && new Date() < slip.expiresAt) {
            return res.status(400).json({ message: 'Slip has not expired yet.' });
        }

        if (slip.status === 'pending' && !slip.isResolved) {
            const derivedResults = deriveResultFromSeed(slip.rngSeed, slip.picks.length);
            const actualOutcomes = slip.picks.map(() => Math.random() > 0.5);
            console.log(`Simulated actual outcomes for slip ${slipId}:`, actualOutcomes);

            const won = actualOutcomes.every((outcome, i) => outcome === derivedResults[i]);

            slip.status = won ? 'won' : 'lost';
            if (new Date() >= slip.expiresAt && slip.status === 'pending') {
                slip.status = 'expired';
            }
            slip.rngResult = derivedResults;
            slip.isResolved = true;
            slip.resolvedAt = new Date();

            await slip.save();

            const updateField = won ? 'totalWins' : 'totalLosses';
            await User.findOneAndUpdate(
                { walletAddress: slip.walletAddress },
                { $inc: { [updateField]: 1 } }
            );
        } else if (slip.status === 'pending' && slip.isResolved) {
            console.warn(`Slip ${slipId} was marked resolved but still pending. Re-evaluating status.`);
            slip.status = 'error';
            await slip.save();
        }

        res.status(200).json({
            slipId: slip._id,
            status: slip.status,
            picks: slip.picks,
            wager: slip.wager,
            multiplier: slip.multiplier,
            potentialPayout: slip.potentialPayout,
            createdAt: slip.createdAt,
            resolvedAt: slip.resolvedAt,
            rngSeedHash: slip.rngSeedHash,
            rngSeed: slip.rngSeed,
            rngResult: slip.rngResult,
        });

    } catch (error) {
        next(error);
    }
};

// GET /slips/history/:walletAddress
exports.getSlipHistory = async (req, res, next) => {
    const walletAddress = req.user.walletAddress;
    const { limit = 20, page = 1, status } = req.query;

    try {
        const query = { walletAddress };
        if (status && ['pending', 'won', 'lost', 'expired'].includes(status)) {
            query.status = status;
        }

        const options = {
            sort: { createdAt: -1 },
            limit: parseInt(limit),
            skip: (parseInt(page) - 1) * parseInt(limit),
        };

        const slips = await Slip.find(query, null, options)
            .select('-rngSeed');

        const totalSlips = await Slip.countDocuments(query);

        res.status(200).json({
            slips,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalSlips / parseInt(limit)),
            totalSlips,
        });
    } catch (error) {
        next(error);
    }
};
