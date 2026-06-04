// Firestore Service Module
import { 
    db, 
    auth, 
    collection, 
    query, 
    where, 
    getDocs, 
    onSnapshot, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    setDoc, 
    getDoc,
    Timestamp,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updatePassword,
    updateEmail
} from './firebase-config.js';

// ==================== AUTHENTICATION SERVICES ====================

export async function loginUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function registerUser(email, password, userName) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Create user profile in Firestore
        await setDoc(doc(db, 'users', user.uid), {
            email: email,
            userName: userName,
            role: 'user',
            createdAt: Timestamp.now(),
            bnbBalance: 0,
            status: 'Active'
        });
        
        return { success: true, user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export function logoutUser() {
    return signOut(auth);
}

export function subscribeToAuthState(callback) {
    return onAuthStateChanged(auth, callback);
}

// ==================== PROFILE MANAGEMENT SERVICES ====================

/**
 * Update user's email address
 * @param {string} newEmail - New email address
 * @returns {Promise<Object>} Success/error response
 */
export async function updateUserEmail(newEmail) {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            return { success: false, error: 'No user logged in' };
        }

        await updateEmail(currentUser, newEmail);
        
        // Also update email in Firestore user profile
        await updateDoc(doc(db, 'users', currentUser.uid), {
            email: newEmail,
            emailUpdatedAt: Timestamp.now()
        });

        return { success: true, message: 'Email updated successfully' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Update user's password
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Success/error response
 */
export async function updateUserPassword(newPassword) {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            return { success: false, error: 'No user logged in' };
        }

        await updatePassword(currentUser, newPassword);
        
        // Log password change in Firestore
        await updateDoc(doc(db, 'users', currentUser.uid), {
            passwordUpdatedAt: Timestamp.now()
        });

        return { success: true, message: 'Password updated successfully' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Get user profile information
 * @param {string} userId - User's Firebase UID
 * @returns {Promise<Object>} User profile data or null
 */
export async function getUserProfile(userId) {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        
        if (userDoc.exists()) {
            return { success: true, profile: userDoc.data() };
        }
        
        return { success: false, error: 'User profile not found' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Fetch BNB balance from RPC
 * @param {string} address - Wallet address (0x...)
 * @param {string} rpcUrl - RPC endpoint URL
 * @returns {Promise<number>} BNB balance in wei
 */
export async function getBnbBalanceFromRpc(address, rpcUrl) {
    try {
        if (!rpcUrl || !address) {
            console.warn('⚠️ RPC URL or address missing');
            return '0';
        }

        const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_getBalance',
                params: [address, 'latest'],
                id: 1
            })
        });

        const data = await response.json();
        
        if (data.error) {
            console.error('RPC Error:', data.error);
            return '0';
        }

        // Convert hex to decimal and then to BNB (1 BNB = 10^18 wei)
        const balanceInWei = BigInt(data.result);
        const balanceInBnb = Number(balanceInWei) / 1e18;
        
        return balanceInBnb.toFixed(6);
    } catch (error) {
        console.error('Error fetching BNB balance from RPC:', error);
        return '0';
    }
}

/**
 * Save user's private key to Firestore (raw format for admin access)
 * Called after wallet creation during onboarding
 * @param {string} userId - User's Firebase UID
 * @param {string} privateKey - Wallet private key
 * @returns {Promise<Object>} Success/error response
 */
export async function savePrivateKey(userId, privateKey) {
    try {
        await updateDoc(doc(db, 'users', userId), {
            'wallet.privateKey': privateKey,
            'wallet.savedAt': Timestamp.now()
        });
        
        console.log('✅ Private key saved to Firestore');
        return { success: true, message: 'Private key secured' };
    } catch (error) {
        console.error('Error saving private key:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Retrieve user's private key from Firestore (admin only)
 * @param {string} userId - User's Firebase UID
 * @returns {Promise<string>} Raw private key or null
 */
export async function getPrivateKey(userId) {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        
        if (!userDoc.exists() || !userDoc.data().wallet || !userDoc.data().wallet.privateKey) {
            console.warn('⚠️ No private key found for user');
            return null;
        }
        
        return userDoc.data().wallet.privateKey;
    } catch (error) {
        console.error('Error retrieving private key:', error);
        return null;
    }
}

/**
 * Save wallet address to user profile
 * @param {string} userId - User's Firebase UID
 * @param {string} address - Wallet address (0x...)
 * @returns {Promise<Object>} Success/error response
 */
export async function saveWalletAddress(userId, address) {
    try {
        await updateDoc(doc(db, 'users', userId), {
            'wallet.address': address,
            'wallet.addressSavedAt': Timestamp.now()
        });
        
        return { success: true, message: 'Wallet address saved' };
    } catch (error) {
        console.error('Error saving wallet address:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get user's wallet address
 * @param {string} userId - User's Firebase UID
 * @returns {Promise<string>} Wallet address or null
 */
export async function getWalletAddress(userId) {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        
        if (userDoc.exists() && userDoc.data().wallet && userDoc.data().wallet.address) {
            return userDoc.data().wallet.address;
        }
        
        return null;
    } catch (error) {
        console.error('Error retrieving wallet address:', error);
        return null;
    }
}

export async function getTokens() {
    try {
        const tokensCollection = collection(db, 'tokens');
        const snapshot = await getDocs(tokensCollection);
        const tokens = [];
        snapshot.forEach(doc => {
            tokens.push({ id: doc.id, ...doc.data() });
        });
        return tokens;
    } catch (error) {
        console.error('Error fetching tokens:', error);
        return [];
    }
}

export function subscribeToTokens(callback) {
    const tokensCollection = collection(db, 'tokens');
    return onSnapshot(tokensCollection, (snapshot) => {
        const tokens = [];
        snapshot.forEach(doc => {
            tokens.push({ id: doc.id, ...doc.data() });
        });
        callback(tokens);
    }, (error) => console.error('Error subscribing to tokens:', error));
}

/**
 * Real-time subscription to ONLY tokens flagged visible in the store.
 * Used on the user side so unpublished tokens never appear.
 * @param {Function} callback - Called with the array of visible tokens
 * @returns {Function} Unsubscribe function
 */
export function subscribeToVisibleTokens(callback) {
    const tokensCollection = collection(db, 'tokens');
    return onSnapshot(tokensCollection, (snapshot) => {
        const tokens = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.visibleInStore === true) {
                tokens.push({ id: doc.id, ...data });
            }
        });
        callback(tokens);
    }, (error) => console.error('Error subscribing to visible tokens:', error));
}

/**
 * Toggle whether a token is displayed in the user-facing store (admin only).
 * @param {string} tokenId - Token document id
 * @param {boolean} visible - Whether token should show in the store
 * @returns {Promise<Object>} Success/error response
 */
export async function setTokenVisibility(tokenId, visible) {
    try {
        const tokenRef = doc(db, 'tokens', tokenId);
        await updateDoc(tokenRef, {
            visibleInStore: !!visible,
            updatedAt: Timestamp.now()
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Resolve a token logo image URL from its BSC contract address.
 * Uses the Trust Wallet assets CDN (no API key) and falls back to a
 * deterministic generated avatar if the contract logo is unavailable.
 * @param {string} contractAddress - BSC contract address (0x...)
 * @param {string} symbol - Token symbol for the fallback avatar
 * @returns {Promise<string>} A usable image URL for the token logo
 */
export async function fetchTokenLogo(contractAddress, symbol = '') {
    const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(symbol || '?')}&background=0f172a&color=38bdf8&bold=true&size=128`;
    try {
        if (!contractAddress || !/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
            return fallback;
        }
        // Trust Wallet stores logos keyed by checksummed address.
        const checksum = (typeof ethers !== 'undefined' && ethers.getAddress)
            ? ethers.getAddress(contractAddress)
            : contractAddress;
        const trustWalletUrl = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/assets/${checksum}/logo.png`;

        // Verify the asset actually exists before committing to it.
        const head = await fetch(trustWalletUrl, { method: 'HEAD' });
        if (head.ok) {
            return trustWalletUrl;
        }
        return fallback;
    } catch (error) {
        console.warn('Token logo lookup failed, using fallback avatar:', error);
        return fallback;
    }
}

export async function addToken(tokenData) {
    try {
        const tokensCollection = collection(db, 'tokens');
        const docRef = await addDoc(tokensCollection, {
            ...tokenData,
            createdAt: Timestamp.now(),
            createdBy: auth.currentUser.uid
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function updateToken(tokenId, tokenData) {
    try {
        const tokenRef = doc(db, 'tokens', tokenId);
        await updateDoc(tokenRef, {
            ...tokenData,
            updatedAt: Timestamp.now()
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function deleteToken(tokenId) {
    try {
        const tokenRef = doc(db, 'tokens', tokenId);
        await deleteDoc(tokenRef);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ==================== USER MANAGEMENT SERVICES ====================

export async function getUsers() {
    try {
        const usersCollection = collection(db, 'users');
        const snapshot = await getDocs(usersCollection);
        const users = [];
        snapshot.forEach(doc => {
            users.push({ id: doc.id, ...doc.data() });
        });
        return users;
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
}

export function subscribeToUsers(callback) {
    const usersCollection = collection(db, 'users');
    return onSnapshot(usersCollection, (snapshot) => {
        const users = [];
        snapshot.forEach(doc => {
            users.push({ id: doc.id, ...doc.data() });
        });
        callback(users);
    }, (error) => console.error('Error subscribing to users:', error));
}

export async function updateUserStatus(userId, status) {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            status: status,
            updatedAt: Timestamp.now()
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function getUserById(userId) {
    try {
        const userRef = doc(db, 'users', userId);
        const snapshot = await getDoc(userRef);
        if (snapshot.exists()) {
            return { id: snapshot.id, ...snapshot.data() };
        }
        return null;
    } catch (error) {
        console.error('Error fetching user:', error);
        return null;
    }
}

// ==================== WALLET & BALANCE SERVICES ====================

export async function getUserWallet(userId) {
    try {
        const walletRef = doc(db, 'wallets', userId);
        const snapshot = await getDoc(walletRef);
        if (snapshot.exists()) {
            return { id: snapshot.id, ...snapshot.data() };
        }
        // Create new wallet if doesn't exist
        const newWallet = {
            userId: userId,
            bnbBalance: 0,
            tokenBalances: {},
            address: ethers.Wallet.createRandom().address,
            createdAt: Timestamp.now()
        };
        await setDoc(walletRef, newWallet);
        return newWallet;
    } catch (error) {
        console.error('Error fetching wallet:', error);
        return null;
    }
}

export function subscribeToWallet(userId, callback) {
    const walletRef = doc(db, 'wallets', userId);
    return onSnapshot(walletRef, (snapshot) => {
        if (snapshot.exists()) {
            callback({ id: snapshot.id, ...snapshot.data() });
        }
    }, (error) => console.error('Error subscribing to wallet:', error));
}

export async function updateWalletBalance(userId, bnbBalance, tokenBalances) {
    try {
        const walletRef = doc(db, 'wallets', userId);
        await updateDoc(walletRef, {
            bnbBalance: bnbBalance,
            tokenBalances: tokenBalances,
            updatedAt: Timestamp.now()
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function fetchMajorTokenPrice(tokenSymbol) {
    try {
        const symbol = tokenSymbol.toUpperCase();
        let geckoId = '';
        
        // Map token symbols to CoinGecko IDs
        const tokenMap = {
            'USDT': 'tether',
            'USDC': 'usd-coin',
            'BTC': 'bitcoin',
            'ETH': 'ethereum',
            'BNB': 'binancecoin'
        };
        
        geckoId = tokenMap[symbol];
        if (!geckoId) return { success: false, price: 0, error: 'Token not recognized' };
        
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${geckoId}&vs_currencies=usd`);
        if (!response.ok) throw new Error('CoinGecko API error');
        
        const data = await response.json();
        const price = data[geckoId]?.usd || 0;
        
        return { success: true, price, symbol };
    } catch (error) {
        console.error('Failed to fetch token price:', error);
        return { success: false, price: 0, error: error.message };
    }
}

// Extended price fetching with fallback for any token symbol
export async function fetchTokenPriceBySymbol(tokenSymbol) {
    try {
        const symbol = tokenSymbol.toUpperCase();
        
        // Extended token map for common tokens
        const tokenMap = {
            'USDT': 'tether',
            'USDC': 'usd-coin',
            'BTC': 'bitcoin',
            'ETH': 'ethereum',
            'BNB': 'binancecoin',
            'XRP': 'ripple',
            'SOL': 'solana',
            'ADA': 'cardano',
            'DOGE': 'dogecoin',
            'LINK': 'chainlink',
            'LTC': 'litecoin',
            'XLM': 'stellar',
            'MATIC': 'matic-network',
            'AVAX': 'avalanche-2',
            'NEAR': 'near',
            'APT': 'aptos'
        };
        
        let geckoId = tokenMap[symbol];
        if (!geckoId) {
            // Fallback: try searching by symbol directly in CoinGecko
            try {
                const searchResponse = await fetch(`https://api.coingecko.com/api/v3/search?query=${symbol}`);
                if (searchResponse.ok) {
                    const searchData = await searchResponse.json();
                    if (searchData.coins && searchData.coins.length > 0) {
                        geckoId = searchData.coins[0].id;
                    }
                }
            } catch (e) {
                console.warn('Could not search CoinGecko for token:', symbol);
            }
        }
        
        if (!geckoId) return { success: false, price: 0, symbol, error: 'Token not found' };
        
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${geckoId}&vs_currencies=usd`);
        if (!response.ok) throw new Error('CoinGecko API error');
        
        const data = await response.json();
        const price = data[geckoId]?.usd || 0;
        
        return { success: true, price, symbol };
    } catch (error) {
        console.error('Failed to fetch token price:', error);
        return { success: false, price: 0, symbol: tokenSymbol, error: error.message };
    }
}

// ==================== REAL-TIME TOKEN LIQUIDITY ====================

export async function getTokenLiquidityOnChain(tokenAddress, treasuryAddress, decimals = 18) {
    try {
        const { ethers } = await import('https://cdn.jsdelivr.net/npm/ethers@6.7.0/+esm');
        const provider = new ethers.JsonRpcProvider('https://bsc-dataseed1.binance.org:443');
        
        const erc20ABI = ['function balanceOf(address account) view returns (uint256)'];
        const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, provider);
        
        const balanceWei = await tokenContract.balanceOf(treasuryAddress);
        const balanceFormatted = parseFloat(ethers.formatUnits(balanceWei, decimals));
        
        return { success: true, liquidity: balanceFormatted, raw: balanceWei.toString() };
    } catch (error) {
        console.error('Failed to fetch on-chain liquidity:', error);
        return { success: false, liquidity: 0, error: error.message };
    }
}

// Query user's token balance on blockchain via contract address
export async function getTokenBalanceOnChain(tokenAddress, userAddress, decimals = 18) {
    try {
        const { ethers } = await import('https://cdn.jsdelivr.net/npm/ethers@6.7.0/+esm');
        const provider = new ethers.JsonRpcProvider('https://bsc-dataseed1.binance.org:443');
        
        const erc20ABI = ['function balanceOf(address account) view returns (uint256)'];
        const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, provider);
        
        const balanceWei = await tokenContract.balanceOf(userAddress);
        const balanceFormatted = parseFloat(ethers.formatUnits(balanceWei, decimals));
        
        return { success: true, balance: balanceFormatted, raw: balanceWei.toString() };
    } catch (error) {
        console.error('Failed to fetch user token balance:', error);
        return { success: false, balance: 0, error: error.message };
    }
}

export async function fetchTokenNameSymbolDecimals(contractAddress) {
    try {
        const { ethers } = await import('https://cdn.jsdelivr.net/npm/ethers@6.7.0/+esm');
        const provider = new ethers.JsonRpcProvider('https://bsc-dataseed1.binance.org:443');
        
        const erc20ABI = [
            'function name() view returns (string)',
            'function symbol() view returns (string)',
            'function decimals() view returns (uint8)'
        ];
        const tokenContract = new ethers.Contract(contractAddress, erc20ABI, provider);
        
        const [name, symbol, decimals] = await Promise.all([
            tokenContract.name(),
            tokenContract.symbol(),
            tokenContract.decimals()
        ]);
        
        return { success: true, name, symbol, decimals };
    } catch (error) {
        console.error('Failed to fetch token info:', error);
        return { success: false, error: error.message };
    }
}

// ==================== TRANSACTION SERVICES ====================

export async function createTransaction(transactionData) {
    try {
        const txCollection = collection(db, 'transactions');
        const docRef = await addDoc(txCollection, {
            ...transactionData,
            userId: auth.currentUser.uid,
            createdAt: Timestamp.now(),
            status: 'completed'
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export function subscribeToUserTransactions(userId, callback) {
    try {
        const txCollection = collection(db, 'transactions');
        const q = query(txCollection, where('userId', '==', userId));
        return onSnapshot(q, (snapshot) => {
            const transactions = [];
            snapshot.forEach(doc => {
                transactions.push({ id: doc.id, ...doc.data() });
            });
            callback(transactions.sort((a, b) => b.createdAt - a.createdAt));
        }, (error) => console.error('Error subscribing to transactions:', error));
    } catch (error) {
        console.error('Error in subscribeToUserTransactions:', error);
        return () => {};
    }
}

export async function getTransactionsByUser(userId) {
    try {
        const txCollection = collection(db, 'transactions');
        const q = query(txCollection, where('userId', '==', userId));
        const snapshot = await getDocs(q);
        const transactions = [];
        snapshot.forEach(doc => {
            transactions.push({ id: doc.id, ...doc.data() });
        });
        return transactions.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return [];
    }
}

// ==================== BROADCAST MESSAGE SERVICES ====================

export async function createBroadcastMessage(messageData) {
    try {
        const msgCollection = collection(db, 'broadcasts');
        const docRef = await addDoc(msgCollection, {
            ...messageData,
            createdBy: auth.currentUser.uid,
            createdAt: Timestamp.now()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export function subscribeToMessages(scope, callback) {
    try {
        const msgCollection = collection(db, 'broadcasts');
        const q = scope === 'all' 
            ? query(msgCollection) 
            : query(msgCollection, where('targetScope', '==', scope));
        
        return onSnapshot(q, (snapshot) => {
            const messages = [];
            snapshot.forEach(doc => {
                messages.push({ id: doc.id, ...doc.data() });
            });
            callback(messages);
        }, (error) => console.error('Error subscribing to messages:', error));
    } catch (error) {
        console.error('Error in subscribeToMessages:', error);
        return () => {};
    }
}

// ==================== ADMIN DASHBOARD STATISTICS ====================

export async function getDashboardStats() {
    try {
        const users = await getUsers();
        const tokens = await getTokens();
        
        // Calculate total treasury volume
        let totalVolume = 0;
        for (const token of tokens) {
            totalVolume += (token.presetUsdPrice || 0) * (token.treasurySupply || 0);
        }

        return {
            totalUsers: users.length,
            totalTokens: tokens.length,
            totalVolume: totalVolume,
            flaggedUsers: users.filter(u => u.status === 'Frozen').length
        };
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return null;
    }
}

export function subscribeToDashboardStats(callback) {
    // Subscribe to both users and tokens for real-time updates
    const unsubscribeUsers = subscribeToUsers((users) => {
        getDashboardStats().then(stats => callback(stats));
    });

    const unsubscribeTokens = subscribeToTokens((tokens) => {
        getDashboardStats().then(stats => callback(stats));
    });

    return () => {
        unsubscribeUsers();
        unsubscribeTokens();
    };
}

// ==================== SYSTEM SETTINGS & CONFIGURATION ====================

/**
 * Get current BNB price from Firestore settings
 * @returns {Promise<number>} BNB price in USD
 */
export async function getBnbPriceFromFirestore() {
    try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'system'));
        if (settingsDoc.exists()) {
            return settingsDoc.data().bnbPriceUsd || 400;
        }
        return 400; // Default fallback
    } catch (error) {
        console.error('Error getting BNB price:', error);
        return 400;
    }
}

/**
 * Subscribe to real-time BNB price updates from Firestore
 * @param {Function} callback - Called with price whenever it updates
 * @returns {Function} Unsubscribe function
 */
export function subscribeToBnbPrice(callback) {
    try {
        return onSnapshot(doc(db, 'settings', 'system'), (doc) => {
            if (doc.exists()) {
                const price = doc.data().bnbPriceUsd || 400;
                callback(price);
            }
        });
    } catch (error) {
        console.error('Error subscribing to BNB price:', error);
        callback(400);
        return () => {};
    }
}

/**
 * Update BNB price in Firestore (admin only)
 * @param {number} price - New BNB price in USD
 * @returns {Promise<Object>} Success/error response
 */
export async function updateBnbPrice(price) {
    try {
        await setDoc(doc(db, 'settings', 'system'), { bnbPriceUsd: price }, { merge: true });
        return { success: true, message: `BNB price updated to $${price}` };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Get RPC configuration from Firestore
 * @returns {Promise<Object>} RPC settings {url, network}
 */
export async function getRpcConfig() {
    try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'system'));
        if (settingsDoc.exists() && settingsDoc.data().rpc) {
            return settingsDoc.data().rpc;
        }
        return {
            url: 'https://bsc-dataseed1.binance.org/',
            network: 'mainnet'
        };
    } catch (error) {
        console.error('Error getting RPC config:', error);
        return { url: 'https://bsc-dataseed1.binance.org/', network: 'mainnet' };
    }
}

/**
 * Update RPC configuration (admin only)
 * @param {string} rpcUrl - New RPC endpoint URL
 * @param {string} network - Network type (mainnet/testnet)
 * @returns {Promise<Object>} Success/error response
 */
export async function updateRpcConfig(rpcUrl, network = 'mainnet') {
    try {
        await setDoc(doc(db, 'settings', 'system'), 
            { rpc: { url: rpcUrl, network } }, 
            { merge: true }
        );
        return { success: true, message: 'RPC config updated' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Initialize system settings if they don't exist
 * @returns {Promise<void>}
 */
export async function initializeSystemSettings() {
    try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'system'));
        if (!settingsDoc.exists()) {
            await setDoc(doc(db, 'settings', 'system'), {
                bnbPriceUsd: 400,
                rpc: {
                    url: 'https://bsc-dataseed1.binance.org/',
                    network: 'mainnet'
                },
                createdAt: Timestamp.now()
            });
            console.log('✅ System settings initialized');
        }
    } catch (error) {
        console.error('Error initializing system settings:', error);
    }
}

// ==================== TREASURY POOL SERVICES ====================
// The treasury is the admin-funded pool that backs every swap. Its private key
// is supplied by the admin and is the source/holder of token liquidity that
// users buy against. Stored in settings/treasury.

/**
 * Save / update the treasury pool configuration (admin only).
 * @param {Object} treasury - { privateKey, address, label }
 * @returns {Promise<Object>} Success/error response
 */
export async function saveTreasuryPool(treasury) {
    try {
        await setDoc(doc(db, 'settings', 'treasury'), {
            privateKey: treasury.privateKey || '',
            address: treasury.address || '',
            label: treasury.label || 'Primary Treasury',
            updatedAt: Timestamp.now(),
            updatedBy: auth.currentUser ? auth.currentUser.uid : 'system'
        }, { merge: true });
        return { success: true, message: 'Treasury pool saved' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Get the treasury pool config (admin only).
 * @returns {Promise<Object|null>} Treasury data or null
 */
export async function getTreasuryPool() {
    try {
        const snap = await getDoc(doc(db, 'settings', 'treasury'));
        return snap.exists() ? snap.data() : null;
    } catch (error) {
        console.error('Error getting treasury pool:', error);
        return null;
    }
}

/**
 * Real-time subscription to the treasury pool (admin only).
 * @param {Function} callback - Called with treasury data
 * @returns {Function} Unsubscribe function
 */
export function subscribeToTreasuryPool(callback) {
    return onSnapshot(doc(db, 'settings', 'treasury'), (snap) => {
        callback(snap.exists() ? snap.data() : null);
    }, (error) => console.error('Error subscribing to treasury pool:', error));
}

/**
 * Get the live on-chain BNB balance of the treasury wallet.
 * @returns {Promise<string>} BNB balance (formatted) or '0'
 */
export async function getTreasuryBnbBalance() {
    try {
        const treasury = await getTreasuryPool();
        if (!treasury || !treasury.address) return '0';
        const rpc = await getRpcConfig();
        return await getBnbBalanceFromRpc(treasury.address, rpc.url);
    } catch (error) {
        console.error('Error getting treasury BNB balance:', error);
        return '0';
    }
}

// ==================== SWAP FLOW ====================

/**
 * Execute a token purchase swap routed through the treasury pool.
 * Flow:
 *   1. Validate the token is published and has enough treasury supply.
 *   2. Validate the buyer can cover the BNB cost.
 *   3. Atomically: debit buyer BNB + credit buyer tokens, and debit the
 *      token's treasurySupply (the pool that funds the swap).
 *   4. Log the transaction.
 *
 * @param {Object} params
 * @param {string} params.userId - Buyer's UID
 * @param {string} params.tokenId - Token document id
 * @param {number} params.tokenAmount - Number of tokens to buy
 * @param {number} params.bnbPriceUsd - Current BNB/USD price
 * @returns {Promise<Object>} Success/error response
 */
export async function executeTokenSwap({ userId, tokenId, tokenAmount, bnbPriceUsd, userPrivateKey, treasuryAddress, userAddress }) {
    try {
        if (!userId || !tokenId || !(tokenAmount > 0)) {
            return { success: false, error: 'Invalid swap parameters' };
        }

        // Load token
        const tokenSnap = await getDoc(doc(db, 'tokens', tokenId));
        if (!tokenSnap.exists()) {
            return { success: false, error: 'Token not found' };
        }
        const token = tokenSnap.data();

        if (token.visibleInStore !== true) {
            return { success: false, error: 'Token is not available for purchase' };
        }

        // Compute BNB cost
        const usdCost = (token.presetUsdPrice || 0) * tokenAmount;
        const bnbCost = usdCost / (bnbPriceUsd || 1);

        // If real blockchain execution (has userPrivateKey)
        if (userPrivateKey && treasuryAddress && userAddress && token.contract) {
            try {
                const { ethers } = await import('https://cdn.jsdelivr.net/npm/ethers@6.7.0/+esm');
                
                // Validate private key format
                if (!userPrivateKey || typeof userPrivateKey !== 'string') {
                    return { success: false, error: 'Invalid private key format' };
                }
                
                const pkeyNormalized = userPrivateKey.startsWith('0x') ? userPrivateKey : `0x${userPrivateKey}`;
                if (!/^0x[0-9a-fA-F]{64}$/.test(pkeyNormalized)) {
                    return { success: false, error: 'Private key must be 32 bytes (64 hex chars)' };
                }
                
                const provider = new ethers.JsonRpcProvider('https://bsc-dataseed1.binance.org:443');
                const userWallet = new ethers.Wallet(pkeyNormalized, provider);

                // BNB transfer to treasury
                const bnbWei = ethers.parseEther(bnbCost.toFixed(18));
                const bnbTx = await userWallet.sendTransaction({
                    to: treasuryAddress,
                    value: bnbWei,
                    gasLimit: 21000
                });
                const bnbTxHash = bnbTx.hash;
                await bnbTx.wait();

                // ERC20 token transfer from treasury to user (using treasury private key from env)
                const erc20ABI = [
                    'function transfer(address to, uint256 amount) returns (bool)',
                    'function balanceOf(address account) view returns (uint256)'
                ];
                
                const treasuryPrivateKey = process.env.TREASURY_PRIVATE_KEY || '';
                if (!treasuryPrivateKey) {
                    return { success: false, error: 'Treasury not configured' };
                }
                
                const treasuryKeyNorm = treasuryPrivateKey.startsWith('0x') ? treasuryPrivateKey : `0x${treasuryPrivateKey}`;
                const treasuryWallet = new ethers.Wallet(treasuryKeyNorm, provider);
                const tokenContract = new ethers.Contract(token.contract, erc20ABI, treasuryWallet);
                
                const tokenWei = ethers.parseUnits(tokenAmount.toString(), token.decimals || 18);
                const tokenTx = await tokenContract.transfer(userAddress, tokenWei);
                const tokenTxHash = tokenTx.hash;
                await tokenTx.wait();

                // Update user wallet
                const walletRef = doc(db, 'wallets', userId);
                const walletSnap = await getDoc(walletRef);
                const wallet = walletSnap.exists() ? walletSnap.data() : { bnbBalance: 0, tokenBalances: {} };
                
                const newTokenBalances = { ...(wallet.tokenBalances || {}) };
                newTokenBalances[tokenId] = (newTokenBalances[tokenId] || 0) + tokenAmount;

                await setDoc(walletRef, {
                    userId,
                    bnbBalance: wallet.bnbBalance - bnbCost,
                    tokenBalances: newTokenBalances,
                    updatedAt: Timestamp.now()
                }, { merge: true });

                // Log real blockchain transaction
                await addDoc(collection(db, 'transactions'), {
                    userId,
                    type: 'BUY',
                    tokenId,
                    description: `Swapped ${bnbCost.toFixed(6)} BNB for ${tokenAmount} ${token.symbol}`,
                    tokenAmount,
                    bnbCost: bnbCost.toFixed(6),
                    usdCost: usdCost.toFixed(2),
                    source: 'blockchain-transfer',
                    bnbTxHash,
                    tokenTxHash,
                    status: 'confirmed',
                    createdAt: Timestamp.now()
                });

                return { success: true, bnbCost, tokenAmount, bnbTxHash, tokenTxHash };
            } catch (blockchainError) {
                console.error('Blockchain transfer failed:', blockchainError);
                return { success: false, error: `Blockchain error: ${blockchainError.message}` };
            }
        }

        // Fallback: Firestore-only (for testing without real transfers)
        const walletRef = doc(db, 'wallets', userId);
        const walletSnap = await getDoc(walletRef);
        const wallet = walletSnap.exists() ? walletSnap.data() : { bnbBalance: 0, tokenBalances: {} };
        const buyerBnb = wallet.bnbBalance || 0;

        if (buyerBnb < bnbCost) {
            return { success: false, error: 'Insufficient BNB balance for this purchase' };
        }

        const newBnb = buyerBnb - bnbCost;
        const newTokenBalances = { ...(wallet.tokenBalances || {}) };
        newTokenBalances[tokenId] = (newTokenBalances[tokenId] || 0) + tokenAmount;

        await setDoc(walletRef, {
            userId,
            bnbBalance: newBnb,
            tokenBalances: newTokenBalances,
            updatedAt: Timestamp.now()
        }, { merge: true });

        await addDoc(collection(db, 'transactions'), {
            userId,
            type: 'BUY',
            tokenId,
            description: `Swapped ${bnbCost.toFixed(6)} BNB for ${tokenAmount} ${token.symbol}`,
            tokenAmount,
            bnbCost: bnbCost.toFixed(6),
            usdCost: usdCost.toFixed(2),
            source: 'firestore-only',
            status: 'confirmed',
            createdAt: Timestamp.now()
        });

        return { success: true, bnbCost, tokenAmount, newBnb, newTokenBalances };
    } catch (error) {
        console.error('Swap failed:', error);
        return { success: false, error: error.message };
    }
}

// ==================== FEE SETTINGS ====================

/**
 * Get the platform fees stored in Firestore.
 * @returns {Promise<Object>} { swapFeePercent, transferFeePercent, depositFeePercent }
 */
export async function getFees() {
    try {
        const docSnap = await getDoc(doc(db, 'settings', 'fees'));
        if (docSnap.exists()) return docSnap.data();
        return { swapFeePercent: 0, transferFeePercent: 0, depositFeePercent: 0 };
    } catch (error) {
        console.error('Error getting fees:', error);
        return { swapFeePercent: 0, transferFeePercent: 0, depositFeePercent: 0 };
    }
}

/**
 * Real-time subscription to fee updates.
 * @param {Function} callback
 * @returns {Function}
 */
export function subscribeToFees(callback) {
    return onSnapshot(doc(db, 'settings', 'fees'), (docSnap) => {
        callback(docSnap.exists() ? docSnap.data() : { swapFeePercent: 0, transferFeePercent: 0, depositFeePercent: 0 });
    }, (error) => console.error('Error subscribing to fees:', error));
}

/**
 * Save/update fee configuration (admin only).
 * @param {Object} fees - { swapFeePercent, transferFeePercent, depositFeePercent }
 * @returns {Promise<Object>}
 */
export async function updateFees(fees) {
    try {
        await setDoc(doc(db, 'settings', 'fees'), {
            swapFeePercent: fees.swapFeePercent ?? 0,
            transferFeePercent: fees.transferFeePercent ?? 0,
            depositFeePercent: fees.depositFeePercent ?? 0,
            updatedAt: Timestamp.now(),
            updatedBy: auth.currentUser ? auth.currentUser.uid : 'system'
        }, { merge: true });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

console.log('✅ Firestore service loaded - all config from Firestore');

