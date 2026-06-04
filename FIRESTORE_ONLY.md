# Simplified Firestore-Only Architecture

## ✅ What Changed

All complex environment setup has been removed. The system now uses **Firestore as the single source of truth** for:

- ✅ BNB prices (real-time, updatable by admin)
- ✅ RPC configuration (mainnet/testnet, updatable by admin)
- ✅ User data & wallets
- ✅ Tokens & transactions
- ✅ System settings

**Result:** Zero environment files needed. Just use the app!

---

## 🎯 New Architecture

```
┌─────────────────────────────────────┐
│     HTML Pages                      │
│  (store.html, admin.html)           │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│  firestore-service.js               │
│  (All business logic)               │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│     Firestore Database              │
│  (Single source of truth)           │
│                                     │
│  Collections:                       │
│  - users                            │
│  - tokens                           │
│  - wallets                          │
│  - transactions                     │
│  - broadcasts                       │
│  - settings ← NEW!                  │
└─────────────────────────────────────┘
```

---

## 📊 Settings Collection (NEW)

### Document: `settings/system`

```json
{
  "bnbPriceUsd": 400,
  "rpc": {
    "url": "https://bsc-dataseed1.binance.org/",
    "network": "mainnet"
  },
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

## 🚀 How to Use

### 1. **Initialize System (First Time)**
```javascript
import { initializeSystemSettings } from './firestore-service.js';

// Automatically creates settings in Firestore if missing
await initializeSystemSettings();
```

### 2. **Get BNB Price (Real-Time)**
```javascript
import { subscribeToBnbPrice } from './firestore-service.js';

// Subscribe to real-time price updates
subscribeToBnbPrice((price) => {
    console.log(`BNB Price: $${price}`);
});
```

### 3. **Update BNB Price (Admin)**
```javascript
import { updateBnbPrice } from './firestore-service.js';

// Admin updates price
await updateBnbPrice(450);
```

### 4. **Get RPC Config**
```javascript
import { getRpcConfig } from './firestore-service.js';

const rpcConfig = await getRpcConfig();
console.log(rpcConfig.url);
console.log(rpcConfig.network);
```

### 5. **Update RPC Config (Admin)**
```javascript
import { updateRpcConfig } from './firestore-service.js';

// Switch to testnet
await updateRpcConfig(
    'https://data-seed-prebsc-1-b.binance.org:8545',
    'testnet'
);
```

---

## 📋 Available Functions

### **Price Management**
- `getBnbPriceFromFirestore()` - Get current price
- `subscribeToBnbPrice(callback)` - Real-time price updates
- `updateBnbPrice(price)` - Admin: update price

### **RPC Configuration**
- `getRpcConfig()` - Get RPC settings
- `updateRpcConfig(url, network)` - Admin: update RPC

### **System**
- `initializeSystemSettings()` - Create default settings

---

## 🗑️ Removed Files (No Longer Needed)

These are now obsolete - functionality moved to Firestore:

- ❌ `coingecko-service.js` - Prices now in Firestore
- ❌ `blockchain-rpc-service.js` - RPC now in Firestore
- ❌ `.env` file - All config in Firestore
- ❌ `.env.example` - Reference only

**Keep them for reference, but they're not used anymore.**

---

## ⚙️ Admin Dashboard Features

### Update BNB Price
Create a new admin panel section:

```html
<div class="settings-panel">
    <h3>System Settings</h3>
    <label>BNB Price (USD)</label>
    <input id="bnbPriceInput" type="number" value="400">
    <button onclick="updateBnbPriceAdmin()">Save Price</button>
</div>
```

```javascript
async function updateBnbPriceAdmin() {
    const price = parseFloat(document.getElementById("bnbPriceInput").value);
    await updateBnbPrice(price);
    showToast('Price updated!');
}
```

### Update RPC Endpoint
```html
<label>RPC URL</label>
<input id="rpcUrlInput" type="text" value="https://bsc-dataseed1.binance.org/">
<label>Network</label>
<select id="networkSelect">
    <option value="mainnet">Mainnet</option>
    <option value="testnet">Testnet</option>
</select>
<button onclick="updateRpcAdmin()">Save RPC</button>
```

```javascript
async function updateRpcAdmin() {
    const url = document.getElementById("rpcUrlInput").value;
    const network = document.getElementById("networkSelect").value;
    await updateRpcConfig(url, network);
    showToast('RPC updated!');
}
```

---

## 🎁 Benefits

### Before (Complex)
- ❌ 3+ external services (Firebase, CoinGecko, RPC)
- ❌ Environment file required
- ❌ Hard to update prices/RPC without redeploying
- ❌ Multiple places to configure

### After (Simple)
- ✅ Single Firestore database
- ✅ Zero environment files
- ✅ Admin can update prices/RPC instantly
- ✅ Real-time updates across all users
- ✅ One place for everything

---

## 📱 Real-Time Flow

### **Price Update Example**

```
Admin updates price in dashboard
    ↓
updateBnbPrice(450) call
    ↓
Firestore: settings/system → bnbPriceUsd = 450
    ↓
All subscribers notified instantly
    ↓
Store.html: BNB_PRICE_USD = 450
    ↓
UI re-renders with new prices
    ↓
User sees updated prices in real-time
```

---

## 🔐 Security

### Firestore Rules (Keep These)

```javascript
// settings - admin read/write only
match /settings/{document=**} {
  allow read, write: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

---

## ✨ Quick Start

1. ✅ System automatically initializes settings on first load
2. ✅ BNB price defaults to $400 if not set
3. ✅ RPC defaults to BSC Mainnet if not set
4. ✅ Admin can update both anytime
5. ✅ All changes propagate instantly to all users

---

## 🎯 No Configuration Needed!

Just open the app and start using it. Everything is managed through Firestore.

**No .env files. No complex setup. Just Firestore.**

---

**Last Updated:** June 3, 2026  
**Status:** ✅ Firestore-First Architecture  
**Version:** 2.0 - Simplified
