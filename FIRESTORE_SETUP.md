# Firestore Collections Setup Guide

This file provides step-by-step instructions for creating and configuring Firestore collections manually via Firebase Console.

---

## Prerequisites

1. Firebase project created
2. Firestore database initialized (production mode)
3. Authentication enabled (Email/Password)
4. Logged into Firebase Console

---

## Collection 1: users

### Create Collection

1. Go to **Firestore Database**
2. Click **+ Start collection**
3. Collection name: `users`
4. Document ID: `{Auto ID}` for now, then click **Save**

### Document Structure

First admin user (copy this entire JSON):

```json
{
  "email": "admin@web3flasher.com",
  "userName": "Admin",
  "role": "admin",
  "status": "Active",
  "bnbBalance": 100,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**Steps:**
1. In Firestore, go to users collection
2. Click **+ Add document**
3. Document ID: Get from Firebase Auth user ID (see step below)
4. Paste fields above
5. Click **Save**

### How to get Firebase Auth UID

1. Go to **Authentication** tab
2. Click **Users**
3. If no users exist, create one:
   - Click **+ Add user**
   - Email: `admin@web3flasher.com`
   - Password: `AdminPassword123!`
   - Click **Add user**
4. Copy the UID from the users list
5. Use this UID as the document ID in Firestore

---

## Collection 2: tokens

### Create Collection

1. In Firestore, click **+ Start collection**
2. Collection name: `tokens`
3. Document ID: Click **Auto ID**

### Add Sample Token 1: DogeWaste

```json
{
  "name": "DogeWaste",
  "symbol": "DGWST",
  "contract": "0x1a23ff4494833211119b",
  "presetUsdPrice": 0.001,
  "treasurySupply": 1420000,
  "icon": "🐕",
  "color": "from-amber-500 to-yellow-600",
  "createdAt": "2024-01-01T00:00:00Z",
  "createdBy": "[ADMIN_UID_HERE]"
}
```

### Add Sample Token 2: PepeScrap

```json
{
  "name": "PepeScrap",
  "symbol": "PPSCP",
  "contract": "0x5f44b2219983de3233aa",
  "presetUsdPrice": 0.0025,
  "treasurySupply": 890000,
  "icon": "🐸",
  "color": "from-emerald-500 to-green-600",
  "createdAt": "2024-01-01T00:00:00Z",
  "createdBy": "[ADMIN_UID_HERE]"
}
```

### Add Sample Token 3: ShibaRust

```json
{
  "name": "ShibaRust",
  "symbol": "SBRST",
  "contract": "0x9e123faac48293ddbb22",
  "presetUsdPrice": 0.0005,
  "treasurySupply": 4500000,
  "icon": "🦊",
  "color": "from-orange-500 to-red-600",
  "createdAt": "2024-01-01T00:00:00Z",
  "createdBy": "[ADMIN_UID_HERE]"
}
```

### Add Sample Token 4: BinanceTrash

```json
{
  "name": "BinanceTrash",
  "symbol": "BTRSH",
  "contract": "0x3c21a4de1182283994ab",
  "presetUsdPrice": 0.012,
  "treasurySupply": 120500,
  "icon": "🗑️",
  "color": "from-yellow-500 to-amber-600",
  "createdAt": "2024-01-01T00:00:00Z",
  "createdBy": "[ADMIN_UID_HERE]"
}
```

---

## Collection 3: wallets

### Create Collection

1. Click **+ Start collection**
2. Collection name: `wallets`
3. Document ID: Click **Auto ID** first

### First Wallet Document

**For the admin user**, create document with:

```json
{
  "userId": "[ADMIN_UID_HERE]",
  "bnbBalance": 100,
  "tokenBalances": {
    "[AUTO_ID_FROM_TOKEN_1]": 0,
    "[AUTO_ID_FROM_TOKEN_2]": 0,
    "[AUTO_ID_FROM_TOKEN_3]": 0,
    "[AUTO_ID_FROM_TOKEN_4]": 0
  },
  "address": "0x1234567890abcdef1234567890abcdef12345678",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**Important:** 
- Document ID should be the same as Admin UID (change ID after creating)
- For `address`, use any valid Ethereum address or generate one

---

## Collection 4: transactions

### Create Collection

1. Click **+ Start collection**
2. Collection name: `transactions`
3. Document ID: Click **Auto ID**

### Sample Transaction (Optional)

```json
{
  "userId": "[ADMIN_UID_HERE]",
  "type": "BUY",
  "description": "Bought 1 DGWST",
  "gasPaid": "0.000025",
  "tokenId": "[TOKEN_1_AUTO_ID]",
  "status": "completed",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

## Collection 5: broadcasts

### Create Collection

1. Click **+ Start collection**
2. Collection name: `broadcasts`
3. Document ID: Click **Auto ID**

### Sample Broadcast (Optional)

```json
{
  "message": "System maintenance scheduled for midnight UTC",
  "targetScope": "all",
  "createdBy": "[ADMIN_UID_HERE]",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

## Security Rules (CRITICAL)

Go to **Firestore** → **Rules** tab and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users - read/write own, admin read all
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Tokens - read authenticated, admin write
    match /tokens/{document=**} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Wallets - user reads/writes own
    match /wallets/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Transactions - create own, read own
    match /transactions/{document=**} {
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow read: if request.auth.uid == resource.data.userId;
    }
    
    // Broadcasts - read all, admin write
    match /broadcasts/{document=**} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

Click **Publish** button.

---

## Verification Checklist

- [ ] `users` collection created with admin user
- [ ] `tokens` collection created with 4 sample tokens
- [ ] `wallets` collection created with admin wallet
- [ ] `transactions` collection created (can be empty)
- [ ] `broadcasts` collection created (can be empty)
- [ ] All document IDs match UIDs appropriately
- [ ] Security rules deployed
- [ ] Test login works in app
- [ ] Test admin dashboard loads
- [ ] Test tokens appear in store

---

## Auto-Generated Document IDs

When adding documents without specifying ID:
- Firestore auto-generates random IDs
- These IDs are used in references
- Important: Replace `[AUTO_ID]` placeholders with actual IDs in your documents

### Finding Auto-Generated IDs

1. In Firestore, view collection
2. Look at each document
3. The ID is shown in the document list
4. Copy and use in other documents

---

## Next Steps After Setup

1. ✅ All collections created
2. ✅ Sample data added
3. ✅ Security rules deployed
4. Go to **firebase-config.js**
5. Update with your Firebase credentials
6. Run `npm install`
7. Run `npm run dev`
8. Test the application

---

## Troubleshooting

### Collections not appearing
- Refresh Firestore console
- Check you're in correct database (should be `(default)`)
- Verify you're not in test mode (should be production)

### Permission denied errors
- Check security rules are published
- Verify user is authenticated
- Check user role is set correctly

### Data not syncing
- Open browser DevTools Console (F12)
- Check for JavaScript errors
- Verify Firestore connection

### Can't add documents
- Ensure collection is in production mode
- Try creating collection first, then adding documents
- Use **Auto ID** for new collections

---

## Data Backup

Before major changes:
1. Go to Firestore
2. Click **hamburger menu** (☰)
3. Click **Settings**
4. Click **Backup & Restore**
5. Export data regularly

---

**Last Updated:** June 3, 2026  
**Status:** ✅ Complete Guide
