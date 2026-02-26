# Email Verification & Push Notifications Setup

This document explains the new features added to your Prayuj Teams chat application.

## 🆕 New Features

### 1. Email Verification
- **Registration**: Users must verify their email before accessing the chat
- **Login**: Email verification is required to log in
- **Verification Flow**: Users receive an email with a verification link
- **Automatic Login**: After verification, users are automatically logged in

### 2. Push Notifications
- **Real-time Notifications**: Users receive push notifications for new messages
- **Background Support**: Notifications work even when the app is closed
- **Permission Request**: Users are prompted to allow notifications
- **Cross-platform**: Works on desktop and mobile browsers

## 🔧 Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install nodemailer crypto web-push
```

### 2. Generate VAPID Keys
```bash
cd backend
node generate-vapid-keys.js
```

### 3. Configure Environment Variables

#### Backend (.env)
```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
FRONTEND_URL=http://localhost:3000

# Push Notifications
VAPID_PUBLIC_KEY=your-generated-public-key
VAPID_PRIVATE_KEY=your-generated-private-key
```

#### Frontend (.env)
```env
REACT_APP_VAPID_PUBLIC_KEY=your-generated-public-key
```

### 4. Gmail Setup
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
   - Use this password in EMAIL_PASS

## 📁 New Files Added

### Backend
- `utils/emailService.js` - Email sending functionality
- `utils/pushService.js` - Push notification service
- `generate-vapid-keys.js` - VAPID key generation script

### Frontend
- `pages/EmailVerification.js` - Email verification page
- `utils/pushNotifications.js` - Push notification utilities
- `public/sw.js` - Service worker for notifications

## 🔄 Modified Files

### Backend
- `models/User.js` - Added email verification fields
- `routes/auth.js` - Added verification endpoints
- `server.js` - Added push notifications to messages
- `package.json` - Added new dependencies

### Frontend
- `context/AuthContext.js` - Added verification handling
- `pages/Login.js` - Added verification error handling
- `pages/Register.js` - Added verification success message
- `App.js` - Added verification route

## 🚀 How It Works

### Email Verification Flow
1. User registers → Email sent with verification token
2. User clicks email link → Token verified
3. User automatically logged in → Can access chat

### Push Notification Flow
1. User logs in → Permission requested
2. User allows → Subscription saved to database
3. Message sent → Push notification sent to offline users
4. User clicks notification → App opens

## 🔒 Security Features

- **Token Expiration**: Email verification tokens expire in 24 hours
- **Secure Tokens**: Cryptographically secure random tokens
- **Email Validation**: Server-side email format validation
- **Permission-based**: Push notifications require user consent

## 🐛 Troubleshooting

### Email Not Sending
- Check Gmail app password is correct
- Verify 2FA is enabled on Gmail
- Check EMAIL_USER and EMAIL_PASS in .env

### Push Notifications Not Working
- Ensure HTTPS (required for push notifications)
- Check browser permissions
- Verify VAPID keys are correct
- Check service worker registration

### Common Issues
- **"Invalid credentials"**: Check email verification status
- **"Server error"**: Check MongoDB connection and .env variables
- **Notifications not showing**: Check browser notification permissions

## 📱 Browser Support

### Email Verification
- ✅ All modern browsers
- ✅ Mobile browsers

### Push Notifications
- ✅ Chrome/Chromium browsers
- ✅ Firefox
- ✅ Safari (macOS/iOS 16.4+)
- ❌ Internet Explorer

## 🔮 Future Enhancements

- Email templates with better styling
- SMS verification as alternative
- Rich push notifications with images
- Notification preferences/settings
- Email notification digest
- Push notification categories
