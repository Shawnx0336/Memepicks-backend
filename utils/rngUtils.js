const crypto = require('crypto');

function generateRngSeed() {
  return crypto.randomBytes(32).toString('hex');
}

function hashSeed(seed) {
  return crypto.createHash('sha256').update(seed).digest('hex');
}

function deriveResultFromSeed(seed, numPicks) {
  if (numPicks < 2 || numPicks > 5) {
    throw new Error("Invalid number of picks for result derivation.");
  }
  const results = [];
  for (let i = 0; i < numPicks; i++) {
    const pickHash = crypto.createHash('sha256').update(seed + i).digest('hex');
    const firstCharValue = parseInt(pickHash[0], 16);
    results.push(firstCharValue % 2 === 0);
  }
  console.log(`Derived results for seed ${seed.substring(0,8)}... and ${numPicks} picks:`, results);
  return results;
}

module.exports = {
  generateRngSeed,
  hashSeed,
  deriveResultFromSeed,
};
