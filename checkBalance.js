const ethers = require('ethers');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

const rpcUrl = process.env.RPC;
const walletsFile = process.env.WALLET_FILE;

// Read private keys from privateKeys.txt file
const walletData = fs.readFileSync(walletsFile, 'utf-8');
const privateKeys = walletData.split(/\r?\n/);

const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

// Create wallets from private keys
const wallets = privateKeys.map(privateKey => {
    // Ensure private key has '0x' prefix
    const prefixedPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
    return new ethers.Wallet(prefixedPrivateKey, provider);
});

// Get the addresses associated with the wallets
//const addresses = wallets.map(wallet => wallet.address);

// Check balance of each wallet address
(async () => {
    try {
        for (let i = 0; i < wallets.length; i++) {
            const balance = await provider.getBalance(wallets[i].address);
            console.log(`Balance of Address ${i + 1} (${wallets[i].address}): ${ethers.utils.formatEther(balance)} BNB`);
        }
    } catch (error) {
        console.error('Error checking balance:', error);
    }
})();