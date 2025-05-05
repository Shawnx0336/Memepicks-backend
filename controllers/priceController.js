const axios = require('axios');

const priceCache = new Map();
const CACHE_DURATION_MS = 10 * 1000;

// GET /price/:coinSymbol
exports.getCoinPrice = async (req, res, next) => {
    const { coinSymbol } = req.params;
    const upperCaseSymbol = coinSymbol.toUpperCase();

    const cachedData = priceCache.get(upperCaseSymbol);
    if (cachedData && (Date.now() - cachedData.timestamp < CACHE_DURATION_MS)) {
        console.log(`Cache hit for ${upperCaseSymbol}`);
        return res.status(200).json(cachedData.data);
    }

    console.log(`Fetching live price for ${upperCaseSymbol}...`);

    try {
        await new Promise(resolve => setTimeout(resolve, 200));
        const priceData = {
            symbol: upperCaseSymbol,
            price: Math.random() * 100,
            change24h: (Math.random() - 0.5) * 20,
            source: 'Simulated DEX API',
            timestamp: new Date().toISOString(),
        };

        priceCache.set(upperCaseSymbol, { timestamp: Date.now(), data: priceData });

        res.status(200).json(priceData);

    } catch (error) {
        console.error(`Error fetching price for ${upperCaseSymbol}:`, error.message);
        next(error);
    }
};
