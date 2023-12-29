const { ethers,JsonRpcProvider } = require("ethers");
const { readFileSync } = require("fs");
const dotenv = require('dotenv');
dotenv.config();

//sleep function
function sleep(ms) {
    return new Promise((resolve) => {
      console.log("Sleep " + ms + " miliseconds");
      setTimeout(resolve, ms);
  
    });
}


const connectToProviderWithRetry = async (url, maxRetries = 5, retryInterval = 3000) => {
    let retries = 0;
    let provider;

    while (retries < maxRetries) {
        try {
            provider = new ethers.providers.JsonRpcProvider(url);
            console.log('Connected to provider successfully!');
            return provider;
        } catch (error) {
            console.error(`Connection error (Attempt ${retries + 1}/${maxRetries}): ${error.message}`);
            retries++;
            await new Promise(resolve => setTimeout(resolve, retryInterval));
        }
    }

    throw new Error(`Failed to connect to provider after ${maxRetries} attempts.`);
};

// Convert to hexadecimal
const convertToHexa = (str = '') =>{
    const res = [];
    const { length: len } = str;
    for (let n = 0, l = len; n < l; n ++) {
       const hex = Number(str.charCodeAt(n)).toString(16);
       res.push(hex);
    };
    return `0x${res.join('')}`;
 }

 // Get the current account's nonce
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
  async function getGasLimit(hexData, address,provider) {
    const gasLimit = await provider.estimateGas({
      to: address,
      value: ethers.utils.parseEther("0"),
      data: hexData,
    });
    //console.log("GAS: ", gasLimit)
    return gasLimit.toNumber();
  }

  // Transfer transactions
async function sendTransaction(privateKeys,provider) {

    const privateKey = `0x${privateKeys}`;
    const wallet = new ethers.Wallet(privateKey,provider);
    let address = await wallet.getAddress();

    const receiveAddress = process.env.RECEIVE_ADD 
    // Get the current gasLimit limit
    const data = process.env.DATA;
    const hexData = convertToHexa(data);
    console.log("DATA: "+ data + " ====> HEX DATA: " + hexData);
    const numberOfTimes = process.env.TX_CALL;
    const delayTime = process.env.DELAY_TIME;

    let successCount = 0;
    let attemptCount = 0;

    while (successCount < numberOfTimes) {
        const gasLimit = await getGasLimit(hexData, address,provider);
        //console.log("Gas limit :",gasLimit)

        const currentGasPrice = await getGasPrice(provider);
        //console.log("GasPrice: ",currentGasPrice)

        const nonce = await getCurrentNonce(wallet);
        if(nonce>99) {
            break;
        }

        const payPrice = process.env.PAY_PRICE
        const transaction = {
          to: receiveAddress,
          value: ethers.utils.parseEther(payPrice),
          data: hexData,
          nonce: nonce,
          gasPrice: currentGasPrice,
          gasLimit: gasLimit,
        };

        try {
            const tx = await wallet.sendTransaction(transaction);
            console.log(`${address}, No ${successCount + 1} Transaction with nonce ${nonce} hash:`, tx.hash);
            successCount++;
            await sleep(delayTime);
        } catch (error) {
            console.error(`Number of attempts ${attemptCount + 1} failed with nonce ${nonce}:`, error.message);
            await sleep(1000)
        }
        attemptCount++;
    }
    console.log(`Total attempts: ${attemptCount}, Number of successes: ${successCount}`);

}

async function main(){

    const walletsFile = process.env.WALLET_FILE;
    const walletData = readFileSync(walletsFile, 'utf-8').trim();
    const privateKeys = walletData.split(/\r?\n/);
    console.log("Private Key:",privateKeys)

    const rpcUrl = process.env.RPC;
    const maxRetries = 5; // Maximum number of retries
    const retryInterval = 3000; // Retry interval in milliseconds

    const provider = await connectToProviderWithRetry(rpcUrl, maxRetries, retryInterval);

    Promise.all(privateKeys.map(privateKeys =>sendTransaction(privateKeys,provider)))
    .then(() => {
      console.log("All operations completed");
    })
    .catch(error => {
      console.error("An error occurred during operation: ", error);
    });

}

main();


