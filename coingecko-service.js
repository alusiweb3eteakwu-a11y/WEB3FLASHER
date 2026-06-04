// CoinGecko Real-Time Price Service
// Provides real-time cryptocurrency prices via CoinGecko API (no auth required, free tier)

const COINGECKO_API = 'https://api.coingecko.com/api/v3';
let bnbPriceCache = null;
let lastPriceFetchTime = 0;
const CACHE_DURATION = 60000; // Cache for 60 seconds to avoid rate limiting

// Real-time BNB price listeners
let priceListeners = [];

/**
 * Get current BNB price in USD from CoinGecko
 * Uses cache to avoid excessive API calls
 * @returns {Promise<number>} BNB price in USD
 */
export async function getBnbPrice() {
    try {
        const now = Date.now();
        
        // Return cached price if still fresh
        if (bnbPriceCache && (now - lastPriceFetchTime) < CACHE_DURATION) {
            return bnbPriceCache;
        }

        const response = await fetch(
            `${COINGECKO_API}/simple/price?ids=binancecoin&vs_currencies=usd&include_market_cap=false&include_24hr_vol=false&include_24hr_change=false`
        );

        if (!response.ok) {
            throw new Error(`CoinGecko API error: ${response.status}`);
        }

        const data = await response.json();
        const price = data.binancecoin.usd;

        // Update cache
        bnbPriceCache = price;
        lastPriceFetchTime = now;

        // Notify all listeners
        notifyPriceListeners(price);

        return price;
    } catch (error) {
        console.error('❌ Failed to fetch BNB price from CoinGecko:', error);
        
        // Return cached price as fallback
        if (bnbPriceCache) {
            return bnbPriceCache;
        }
        
        // Last resort fallback
        return 400; // Conservative estimate
    }
}

/**
 * Subscribe to real-time BNB price updates
 * Polls CoinGecko API periodically and notifies listeners
 * @param {Function} callback - Called with new price whenever it updates
 * @returns {Function} Unsubscribe function
 */
export function subscribeToBnbPrice(callback) {
    // Add listener to subscribers list
    priceListeners.push(callback);

    // Fetch initial price
    getBnbPrice().then(price => callback(price));

    // Set up periodic polling (every 30 seconds)
    const intervalId = setInterval(async () => {
        // Force cache invalidation to get fresh price
        if (Date.now() - lastPriceFetchTime >= CACHE_DURATION) {
            const freshPrice = await getBnbPrice();
            callback(freshPrice);
        }
    }, 30000);

    // Return unsubscribe function
    return () => {
        priceListeners = priceListeners.filter(l => l !== callback);
        clearInterval(intervalId);
    };
}

/**
 * Notify all price listeners of price change
 * @param {number} price - New BNB price
 */
function notifyPriceListeners(price) {
    priceListeners.forEach(listener => {
        try {
            listener(price);
        } catch (error) {
            console.error('Error in price listener:', error);
        }
    });
}

/**
 * Convert USD amount to BNB equivalent
 * @param {number} usdAmount - Amount in USD
 * @returns {Promise<number>} Amount in BNB
 */
export async function convertUsdToBnb(usdAmount) {
    const bnbPrice = await getBnbPrice();
    return usdAmount / bnbPrice;
}

/**
 * Convert BNB amount to USD equivalent
 * @param {number} bnbAmount - Amount in BNB
 * @returns {Promise<number>} Amount in USD
 */
export async function convertBnbToUsd(bnbAmount) {
    const bnbPrice = await getBnbPrice();
    return bnbAmount * bnbPrice;
}

/**
 * Get BNB price with additional market data
 * @returns {Promise<Object>} Price data with market cap and volume
 */
export async function getBnbMarketData() {
    try {
        const response = await fetch(
            `${COINGECKO_API}/simple/price?ids=binancecoin&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`
        );

        if (!response.ok) {
            throw new Error(`CoinGecko API error: ${response.status}`);
        }

        const data = await response.json();
        return {
            price: data.binancecoin.usd,
            marketCap: data.binancecoin.usd_market_cap,
            volume24h: data.binancecoin.usd_24h_vol,
            change24h: data.binancecoin.usd_24h_change
        };
    } catch (error) {
        console.error('❌ Failed to fetch BNB market data:', error);
        return {
            price: bnbPriceCache || 400,
            marketCap: null,
            volume24h: null,
            change24h: null
        };
    }
}

/**
 * Format price for display
 * @param {number} price - Price to format
 * @returns {string} Formatted price string
 */
export function formatPrice(price) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(price);
}

/**
 * Format BNB amount for display
 * @param {number} bnbAmount - BNB amount
 * @returns {string} Formatted BNB string
 */
export function formatBnb(bnbAmount) {
    return parseFloat(bnbAmount).toFixed(6) + ' BNB';
}

console.log('✅ CoinGecko real-time price service loaded');
