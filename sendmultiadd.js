const ethers = require('ethers');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

const rpcUrl = process.env.RPC;

const walletData = fs.readFileSync('pri_key.txt', 'utf-8');
const privateKeys = walletData.split(/\r?\n/);
const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
// Create wallets from private keys
const wallets = privateKeys.map(privateKey => {
    // Ensure private key has '0x' prefix
    const prefixedPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
    return new ethers.Wallet(prefixedPrivateKey, provider);
});



function sleep(ms) {
    return new Promise((resolve) => {
      console.log("Sleep " + ms + " miliseconds");
      setTimeout(resolve, ms);
  
    });
}

//get nonce
async function getCurrentNonce(wallet) {
    try {
      const nonce = await wallet.getTransactionCount("pending");
      console.log("Nonce:", nonce);
      return nonce;
    } catch (error) {
      console.error("Error fetching nonce:", error.message);
      throw error;
    }
  }
  
  // Get the current price of gas on the mainnet
  async function getGasPrice(provider) {
    const gasPrice = await provider.getGasPrice();
    return gasPrice;
  }
  
  // Get real-time gasLimit on the chain
  async function getGasLimit(address,provider) {
    const gasLimit = await provider.estimateGas({
      to: address,
      value: ethers.utils.parseEther("0"),
      //data: hexData,
    });
    //console.log("GAS: ", gasLimit)
    return gasLimit.toNumber();
  }


(async () => {
    try {
        const senderWallet = wallets[0];
        const recipients = wallets.slice(1); // Exclude the first wallet (sender)

        const amount =  process.env.AMOUNT_TO_SEND
        const amountToSend = ethers.utils.parseEther(amount);

        const gasLimit = await getGasLimit(senderWallet.address,provider);
        console.log("Gas limit :",gasLimit)

        const currentGasPrice = await getGasPrice(provider);
        console.log("GasPrice: ",currentGasPrice)

        const startNonce = await getCurrentNonce(senderWallet);

        for (let i = 0; i < recipients.length; i++) {
            const recipientWallet = recipients[i];
            const nonce = startNonce + i;
            try {
            const tx = await senderWallet.sendTransaction({
                to: recipientWallet.address,
                value: amountToSend,
                nonce: nonce,
                gasPrice: currentGasPrice,
                gasLimit: gasLimit,
            });
            await sleep(1000);
            console.log(`Transaction hash ${i + 1}: ${tx.hash}`);
            console.log(`Sent ${ethers.utils.formatEther(amountToSend)} BNB from ${senderWallet.address} to ${recipientWallet.address} with nonce ${nonce}`);
            } catch (e) {
                console.error(`Send failed with nonce ${nonce}:`, e.message);
                await sleep(1000)
            }
        }


    } catch (error) {
        console.error('Error sending transactions:', error);
    }
})();