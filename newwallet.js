const ethers = require('ethers');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();


// Number of wallets to generate
const numberOfWallets = process.env.NUMBER_OF_WALLET;

// Generate wallets
const wallets = [];
const privateKeys = [];

// Generate wallets
for (let i = 0; i < numberOfWallets; i++) {
    const wallet = ethers.Wallet.createRandom();
    const mnemonic = wallet.mnemonic.phrase;

    wallets.push({
        address: wallet.address,
        privateKey: wallet.privateKey.replace('0x', ''),
        mnemonic: mnemonic,
    });

    // Remove '0x' prefix from private keys and store them
    privateKeys.push(wallet.privateKey.replace('0x', ''));
}

// Convert wallet information to JSON format
const walletsJSON = JSON.stringify(wallets, null, 2);
const privateKeysText = privateKeys.join('\n') + '\n'; // Ensure each private key is on a new line

// Append wallet information to wallets.json
fs.appendFileSync('wallets.json', walletsJSON);
console.log('Wallets information appended to wallets.json.');

// Append private keys (without '0x' prefix) to privateKeys.txt
fs.appendFileSync('privateKeys.txt', privateKeysText);
console.log('Private keys (without "0x" prefix) appended to privateKeys.txt.');