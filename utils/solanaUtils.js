const solanaWeb3 = require('@solana/web3.js');

async function transferSOL(fromWalletAddress, toWalletAddress, amountSOL) {
  console.warn("--- SIMULATING SOL TRANSFER ---");
  console.log(`From: ${fromWalletAddress}`);
  console.log(`To: ${toWalletAddress}`);
  console.log(`Amount: ${amountSOL} SOL`);

  if (!fromWalletAddress || !toWalletAddress || amountSOL <= 0) {
    throw new Error("Invalid transfer parameters.");
  }

  const simulatedSignature = `simulated_tx_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  console.log(`Simulated success with signature: ${simulatedSignature}`);
  return { success: true, signature: simulatedSignature };
}

module.exports = {
  transferSOL,
};
