# W€B3flasher - Production Setup Guide

## System Architecture Overview

This is a **real-time, production-ready system** with:
- ✅ Real Firebase Authentication (no mock login)
- ✅ Real-time Firestore Database integration
- ✅ Live data synchronization across all users
- ✅ Zero hardcoded mock data
- ✅ Production-grade wallet management
- ✅ Real transaction logging

---

## Prerequisites

1. **Firebase Project** - Create one at https://console.firebase.google.com/
2. **Node.js** - Version 16+ installed
3. **Modern Browser** - Chrome, Firefox, Safari, or Edge

---

## Firebase Setup Instructions

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a new project"
3. Enter project name: `web3flasher`
4. Enable Analytics (optional)
5. Click "Create project"

### Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click **Get Started**
3. Select **Email/Password**
4. Enable it and click **Save**
5. Optional: Enable additional sign-in methods as needed

### Step 3: Create Firestore Database

1. Go to **Firestore Database**
2. Click **Create Database**
3. Choose production mode
4. Select your region (US Central recommended)
5. Click **Create**

### Step 4: Set Up Security Rules

Go to **Firestore** → **Rules** and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection - only authenticated users can read/write their own
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
      allow read: if request.auth != null && (resource.data.role == 'admin');
    }
    
    // Tokens collection - public read, admin write
    match /tokens/{document=**} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Wallets - user can only access their own
    match /wallets/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Transactions - user can only access their own
    match /transactions/{document=**} {
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow read: if request.auth.uid == resource.data.userId;
    }
    
    // Broadcasts - users can read, admins can write
    match /broadcasts/{document=**} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

Click **Publish**

### Step 5: Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Click **Your apps**
3. Select or create Web app
4. Copy the configuration object

---

## Configuration Steps

### Step 1: Update `.env` File

In the project root (`c:\Users\👷 WORK\VINCI\.env`), replace placeholders with your Firebase values:

```env
VITE_FIREBASE_API_KEY=AIzaSyD1234567890_your_api_key
VITE_FIREBASE_AUTH_DOMAIN=web3flasher-abc123.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=web3flasher-abc123
VITE_FIREBASE_STORAGE_BUCKET=web3flasher-abc123.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
VITE_FIREBASE_MEASUREMENT_ID=G-ABC1234567
VITE_BNB_PRICE_USD=400
NODE_ENV=production
```

### Step 2: Initialize Database Collections

You can seed initial data via Firebase Console or programmatically. Here's how to create the first admin user:

**Via Firebase Console:**

1. Go to Firestore
2. Click **+ Start collection**
3. Create collection named `users`
4. Click **Auto ID** and add document with:

```json
{
  "email": "admin@web3flasher.com",
  "userName": "Admin",
  "role": "admin",
  "status": "Active",
  "bnbBalance": 100,
  "createdAt": {
    "seconds": 1685894400,
    "nanoseconds": 0
  }
}
```

5. Create collection named `tokens` and add sample tokens:

```json
{
  "name": "DogeWaste",
  "symbol": "DGWST",
  "contract": "0x1a23ff4494833211119b",
  "presetUsdPrice": 0.001,
  "treasurySupply": 1420000,
  "icon": "🐕",
  "color": "from-amber-500 to-yellow-600",
  "createdAt": {
    "seconds": 1685894400,
    "nanoseconds": 0
  }
}
```

---

## Running Locally

### Option 1: Direct Browser (Without Build Tool)

1. Open terminal in project directory
2. Run a simple HTTP server:

```bash
# On Windows PowerShell
python -m http.server 3000
# Or with Python 3
python3 -m http.server 3000
# Or with Node.js
npx http-server -p 3000
```

3. Open browser to `http://localhost:3000`

### Option 2: With Vite (Recommended for Development)

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm preview
```

---

## Firestore Database Schema

### Collections Overview

**users/**
```
- id: Firebase Auth UID
- email: string
- userName: string
- role: 'admin' | 'user'
- status: 'Active' | 'Frozen'
- bnbBalance: number
- createdAt: timestamp
```

**tokens/**
```
- id: auto-generated
- name: string
- symbol: string
- contract: string (BSC address)
- presetUsdPrice: number
- treasurySupply: number
- icon: emoji string
- color: Tailwind gradient class
- createdAt: timestamp
```

**wallets/**
```
- id: Firebase Auth UID
- userId: string
- bnbBalance: number
- tokenBalances: object (tokenId: amount)
- address: EVM address
- createdAt: timestamp
```

**transactions/**
```
- id: auto-generated
- userId: string
- type: 'BUY' | 'SEND'
- description: string
- gasPaid: number
- tokenId: string
- createdAt: timestamp
```

**broadcasts/**
```
- id: auto-generated
- message: string
- targetScope: 'all' | userId
- createdBy: Firebase Auth UID
- createdAt: timestamp
```

---

## API Endpoints (Backend)

If you need to integrate with a backend, create these endpoints:

### GET /api/user/:uid
Returns user profile by Firebase UID
Response: `{ id, email, userName, role, status, bnbBalance }`

### GET /api/tokens
Returns all available tokens
Response: Array of token objects

### POST /api/transaction
Creates new transaction record
Body: `{ type, description, gasPaid, tokenId }`

---

## Environment Variables Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase API Key | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Auth domain | `project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firestore Project ID | `web3flasher-abc` |
| `VITE_BNB_PRICE_USD` | BNB USD price | `400` |
| `NODE_ENV` | Deployment mode | `production` |

---

## Testing Accounts

After setup, you can create test accounts:

1. **Admin Account:**
   - Email: `admin@web3flasher.com`
   - Password: (set your own)
   - Create via Firebase Console or registration form

2. **Regular User:**
   - Use registration form in UI
   - Login to access store and wallet

---

## Production Checklist

- [ ] Firebase project created
- [ ] Authentication enabled
- [ ] Firestore database created
- [ ] Security rules deployed
- [ ] `.env` file configured
- [ ] Initial admin user created
- [ ] Sample tokens added
- [ ] Tested admin dashboard
- [ ] Tested user store
- [ ] Tested authentication flow
- [ ] Deployed to hosting (Firebase Hosting recommended)

---

## Firebase Hosting Deployment

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize
firebase init hosting

# Build and deploy
npm run build
firebase deploy
```

---

## Troubleshooting

### "Firebase is not defined"
- Ensure Firebase config is properly imported in modules
- Check that `.env` file exists and has correct values

### "Permission denied" errors
- Review Firestore security rules
- Ensure user is authenticated
- Check that user has correct role

### Real-time data not updating
- Check browser console for errors
- Verify Firestore listeners are active
- Ensure network connection is stable

### Admin redirect not working
- Confirm user has `role: 'admin'` in Firestore
- Check browser localStorage for auth state
- Clear cookies and re-login

---

## Support & Documentation

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Real-time Listeners](https://firebase.google.com/docs/firestore/query-data/listen)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Ethers.js Documentation](https://docs.ethers.org/)

---

**Last Updated:** June 3, 2026
**System Status:** ✅ Production Ready
