#!/bin/bash

echo "Setting up Email Verification and Push Notifications..."

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install nodemailer@^6.9.4 crypto@^1.0.1 web-push@^3.6.6

# Generate VAPID keys
echo "Generating VAPID keys..."
node generate-vapid-keys.js

echo ""
echo "Setup Instructions:"
echo "1. Update your .env file with:"
echo "   - EMAIL_USER: Your Gmail address"
echo "   - EMAIL_PASS: Your Gmail app password (not regular password)"
echo "   - FRONTEND_URL: Your frontend URL (e.g., http://localhost:3000)"
echo "   - VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY from the output above"
echo ""
echo "2. Enable 2-factor authentication on Gmail and generate an app password"
echo "3. Add the VAPID_PUBLIC_KEY to your frontend environment as REACT_APP_VAPID_PUBLIC_KEY"
echo ""
echo "Features added:"
echo "✅ Email verification on registration"
echo "✅ Email verification required for login"
echo "✅ Push notifications for new messages"
echo "✅ Service worker for background notifications"
