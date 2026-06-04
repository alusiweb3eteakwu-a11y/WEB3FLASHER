#!/bin/bash
# Setup Validation Script for W€B3flasher
# Checks if all requirements are met for production deployment

echo "════════════════════════════════════════════════════════════"
echo "  W€B3flasher - Production Setup Validator"
echo "════════════════════════════════════════════════════════════"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check functions
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} Found: $1"
        return 0
    else
        echo -e "${RED}✗${NC} Missing: $1"
        return 1
    fi
}

check_env_var() {
    if grep -q "$1" firebase-config.js && ! grep -q "Replace with" firebase-config.js; then
        echo -e "${GREEN}✓${NC} Firebase config appears configured"
        return 0
    else
        echo -e "${YELLOW}⚠${NC} Firebase config not set - update firebase-config.js with credentials"
        return 1
    fi
}

echo "📁 Checking Project Files..."
check_file "index.html"
check_file "admin.html"
check_file "store.html"
check_file "firebase-config.js"
check_file "firestore-service.js"
check_file "package.json"

echo ""
echo "🔧 Checking Configuration..."
if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} Found .env file"
else
    echo -e "${YELLOW}⚠${NC} No .env file found - create from .env.example"
fi

echo ""
echo "📦 Checking Node.js Installation..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓${NC} Node.js installed: $NODE_VERSION"
else
    echo -e "${RED}✗${NC} Node.js not installed - visit https://nodejs.org/"
fi

echo ""
echo "📚 Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓${NC} npm installed: $NPM_VERSION"
else
    echo -e "${RED}✗${NC} npm not installed"
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  Setup Instructions:"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "1. Update firebase-config.js with your Firebase credentials:"
echo "   - Go to https://console.firebase.google.com/"
echo "   - Create a project or use existing"
echo "   - Copy Web app config"
echo "   - Paste values in firebase-config.js"
echo ""
echo "2. Deploy Firestore Security Rules:"
echo "   - See SETUP.md for complete rules"
echo ""
echo "3. Create initial admin user in Firebase Console"
echo ""
echo "4. Run: npm install"
echo "5. Run: npm run dev"
echo ""
echo "════════════════════════════════════════════════════════════"
echo "  Status: Ready for Setup"
echo "════════════════════════════════════════════════════════════"
