const { transferSOL } = require('../utils/solanaUtils');
const User = require('../models/User');

// POST /tip
exports.sendTip = async (req, res, next) => {
    const { toWalletAddress, amountSOL } = req.body;
    const fromWalletAddress = req.user.walletAddress;

    if (fromWalletAddress === toWalletAddress) {
        return res.status(400).json({ message: "You cannot tip yourself." });
    }
    if (!toWalletAddress || typeof amountSOL !== 'number' || amountSOL <= 0 || amountSOL > 1) {
        return res.status(400).json({ message: "Invalid recipient address or amount (0 < amount <= 1)." });
    }

    try {
        console.warn(`Balance check skipped for tip from ${fromWalletAddress}. Ensure sufficient funds before calling transfer.`);

        const recipientExists = await User.exists({ walletAddress: toWalletAddress });
        if (!recipientExists) {
            return res.status(404).json({ message: "Recipient user not found." });
        }

        const result = await transferSOL(fromWalletAddress, toWalletAddress, amountSOL);

        if (result.success) {
            console.log(`Tip successful: ${fromWalletAddress} -> ${toWalletAddress} (${amountSOL} SOL), Tx: ${result.signature}`);
            res.status(200).json({
                message: `Successfully tipped ${amountSOL} SOL.`,
                signature: result.signature,
            });
        } else {
            throw new Error("Simulated transfer failed.");
        }

    } catch (error) {
        console.error(`Tipping error from ${fromWalletAddress} to ${toWalletAddress}:`, error);
        res.status(500).json({ message: "Tipping failed. Please try again later." });
    }
};
