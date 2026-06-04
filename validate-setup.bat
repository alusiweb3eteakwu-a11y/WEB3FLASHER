@echo off
REM Setup Validation Script for Windows
REM W€B3flasher Production Setup Validator

echo.
echo ========================================================
echo   W€B3flasher - Production Setup Validator
echo ========================================================
echo.

REM Check files
echo Checking Project Files...
if exist "index.html" (echo [OK] index.html) else (echo [MISSING] index.html)
if exist "admin.html" (echo [OK] admin.html) else (echo [MISSING] admin.html)
if exist "store.html" (echo [OK] store.html) else (echo [MISSING] store.html)
if exist "firebase-config.js" (echo [OK] firebase-config.js) else (echo [MISSING] firebase-config.js)
if exist "firestore-service.js" (echo [OK] firestore-service.js) else (echo [MISSING] firestore-service.js)
if exist "package.json" (echo [OK] package.json) else (echo [MISSING] package.json)

echo.
echo Checking Configuration...
if exist ".env" (echo [OK] .env file found) else (echo [WARNING] No .env file - create from .env.example)

echo.
echo Checking Node.js...
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('node -v') do echo [OK] Node.js %%i
) else (
    echo [ERROR] Node.js not found - install from https://nodejs.org/
)

echo.
echo Checking npm...
where npm >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('npm -v') do echo [OK] npm %%i
) else (
    echo [ERROR] npm not found
)

echo.
echo ========================================================
echo   Setup Instructions:
echo ========================================================
echo.
echo 1. Update firebase-config.js with Firebase credentials:
echo    - Go to https://console.firebase.google.com/
echo    - Get Web app config and paste in firebase-config.js
echo.
echo 2. Deploy Firestore Security Rules (see SETUP.md)
echo.
echo 3. Create admin user in Firebase Console
echo.
echo 4. Run: npm install
echo 5. Run: npm run dev
echo.
echo ========================================================
