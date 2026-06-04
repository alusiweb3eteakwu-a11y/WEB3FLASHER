// Blockchain RPC Service
// Provides real-time transaction capabilities via BSC (Binance Smart Chain) RPC

// Get RPC URL from environment variables
const BSC_RPC_URL = import.meta.env.VITE_BSC_RPC_URL || 'https://bsc-dataseed1.binance.org/';
const BSC_TESTNET_RPC = import.meta.env.VITE_BSC_TESTNET_RPC || 'https://data-seed-prebsc-1-b.binance.org:8545';
const NETWORK_TYPE = import.meta.env.VITE_NETWORK_TYPE || 'mainnet';

// Create Ethers.js provider
const provider = new ethers.JsonRpcProvider(NETWORK_TYPE === 'testnet' ? BSC_TESTNET_RPC : BSC_RPC_URL);

// BSC Chain IDs
const BSC_CHAIN_ID = 56; // Mainnet
const BSC_TESTNET_CHAIN_ID = 97; // Testnet

/**
 * Get the currently active RPC provider
 * @returns {ethers.JsonRpcProvider} Ethers.js provider instance
 */
export function getProvider() {
    return provider;
}

/**
 * Get current active RPC URL
 * @returns {string} RPC endpoint URL
 */
export function getRpcUrl() {
    return NETWORK_TYPE === 'testnet' ? BSC_TESTNET_RPC : BSC_RPC_URL;
}

/**
 * Get the active network type
 * @returns {string} 'mainnet' or 'testnet'
 */
export function getNetworkType() {
    return NETWORK_TYPE;
}

/**
 * Get chain ID based on network type
 * @returns {number} Chain ID (56 for mainnet, 97 for testnet)
 */
export function getChainId() {
    return NETWORK_TYPE === 'testnet' ? BSC_TESTNET_CHAIN_ID : BSC_CHAIN_ID;
}

/**
 * Check if wallet is connected to correct network
 * @returns {Promise<boolean>} True if on correct network
 */
export async function checkNetwork() {
    try {
        const network = await provider.getNetwork();
        const expectedChainId = getChainId();
        
        if (network.chainId !== expectedChainId) {
            console.warn(`⚠️ Wrong network! Expected chain ${expectedChainId}, but on ${network.chainId}`);
            return false;
        }
        
        console.log(`✅ Connected to correct network: ${network.name} (Chain ID: ${network.chainId})`);
        return true;
    } catch (error) {
        console.error('❌ Failed to check network:', error);
        return false;
    }
}

/**
 * Get BNB balance of an address
 * @param {string} address - Wallet address
 * @returns {Promise<string>} Balance in BNB
 */
export async function getBnbBalance(address) {
    try {
        const balanceWei = await provider.getBalance(address);
        return ethers.formatEther(balanceWei);
    } catch (error) {
        console.error('❌ Failed to get BNB balance:', error);
        return '0';
    }
}

/**
 * Send BNB transaction
 * @param {ethers.Signer} signer - Wallet signer
 * @param {string} toAddress - Recipient address
 * @param {string} bnbAmount - Amount in BNB
 * @returns {Promise<Object>} Transaction receipt
 */
export async function sendBnbTransaction(signer, toAddress, bnbAmount) {
    try {
        if (!ethers.isAddress(toAddress)) {
            throw new Error('Invalid recipient address');
        }

        const tx = await signer.sendTransaction({
            to: toAddress,
            value: ethers.parseEther(bnbAmount)
        });

        console.log(`✅ Transaction sent: ${tx.hash}`);
        
        const receipt = await tx.wait();
        console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
        
        return receipt;
    } catch (error) {
        console.error('❌ Transaction failed:', error);
        throw error;
    }
}

/**
 * Get transaction details
 * @param {string} txHash - Transaction hash
 * @returns {Promise<Object>} Transaction details
 */
export async function getTransaction(txHash) {
    try {
        const tx = await provider.getTransaction(txHash);
        return tx;
    } catch (error) {
        console.error('❌ Failed to get transaction:', error);
        return null;
    }
}

/**
 * Wait for transaction confirmation
 * @param {string} txHash - Transaction hash
 * @param {number} confirmations - Number of confirmations to wait for (default: 1)
 * @returns {Promise<Object>} Transaction receipt
 */
export async function waitForTransaction(txHash, confirmations = 1) {
    try {
        const receipt = await provider.waitForTransaction(txHash, confirmations);
        console.log(`✅ Transaction confirmed with ${confirmations} confirmation(s)`);
        return receipt;
    } catch (error) {
        console.error('❌ Failed waiting for transaction:', error);
        return null;
    }
}

/**
 * Get gas price in Gwei
 * @returns {Promise<string>} Gas price in Gwei
 */
export async function getGasPrice() {
    try {
        const gasPriceWei = await provider.getGasPrice();
        const gasPriceGwei = ethers.formatUnits(gasPriceWei, 'gwei');
        return gasPriceGwei;
    } catch (error) {
        console.error('❌ Failed to get gas price:', error);
        return '0';
    }
}

/**
 * Estimate gas for transaction
 * @param {Object} txData - Transaction data {to, from, value, data}
 * @returns {Promise<string>} Estimated gas in Wei
 */
export async function estimateGas(txData) {
    try {
        const gasEstimate = await provider.estimateGas(txData);
        return gasEstimate.toString();
    } catch (error) {
        console.error('❌ Failed to estimate gas:', error);
        return '21000'; // Standard gas limit
    }
}

/**
 * Get current block number
 * @returns {Promise<number>} Current block number
 */
export async function getCurrentBlockNumber() {
    try {
        const blockNumber = await provider.getBlockNumber();
        return blockNumber;
    } catch (error) {
        console.error('❌ Failed to get block number:', error);
        return 0;
    }
}

/**
 * Monitor address balance in real-time
 * @param {string} address - Address to monitor
 * @param {Function} onBalanceChange - Callback function
 * @returns {Function} Unsubscribe function
 */
export function monitorAddressBalance(address, onBalanceChange) {
    const interval = setInterval(async () => {
        try {
            const balanceWei = await provider.getBalance(address);
            const balanceBnb = ethers.formatEther(balanceWei);
            onBalanceChange(balanceBnb);
        } catch (error) {
            console.error('Error monitoring balance:', error);
        }
    }, 15000); // Check every 15 seconds

    return () => clearInterval(interval);
}

/**
 * Get token balance (ERC20)
 * @param {string} tokenAddress - Token contract address
 * @param {string} walletAddress - Wallet address
 * @returns {Promise<string>} Token balance (formatted based on decimals)
 */
export async function getTokenBalance(tokenAddress, walletAddress) {
    try {
        const erc20Abi = [
            'function balanceOf(address account) public view returns (uint256)',
            'function decimals() public view returns (uint8)'
        ];
        
        const contract = new ethers.Contract(tokenAddress, erc20Abi, provider);
        const balance = await contract.balanceOf(walletAddress);
        const decimals = await contract.decimals();
        
        return ethers.formatUnits(balance, decimals);
    } catch (error) {
        console.error('❌ Failed to get token balance:', error);
        return '0';
    }
}

/**
 * Check connection to RPC endpoint
 * @returns {Promise<boolean>} True if connected
 */
export async function isRpcConnected() {
    try {
        const blockNumber = await provider.getBlockNumber();
        console.log(`✅ RPC Connected - Current block: ${blockNumber}`);
        return true;
    } catch (error) {
        console.error('❌ RPC Connection failed:', error);
        return false;
    }
}

// Initialize and check connection
console.log(`🔗 Blockchain RPC Service loaded`);
console.log(`📡 Network: ${NETWORK_TYPE.toUpperCase()}`);
console.log(`🌐 RPC URL: ${getRpcUrl()}`);

// Verify connection
isRpcConnected().catch(err => console.error('Initial RPC connection check failed:', err));
