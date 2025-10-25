# Separate Firebase Configuration for Seller Notifications

## Overview
The system now supports **separate Firebase service accounts** for seller and deliveryman notifications. This allows you to:
- Use different Firebase projects for Seller App and Deliveryman App
- Maintain separate analytics and monitoring
- Have different notification configurations per app
- Better security isolation

## Architecture

### Firebase Instances
1. **Default Firebase (Deliverymen)**: `firebase-service-account.json`
   - Used for deliveryman notifications
   - App name: `default`

2. **Seller Firebase**: `firebase-seller-service-account.json`
   - Used for seller notifications
   - App name: `seller`

## Setup Instructions

### Step 1: Create Firebase Project for Seller App

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing project for Seller App
3. Enable **Cloud Messaging** (FCM)

### Step 2: Generate Service Account Key

1. In Firebase Console, go to **Project Settings** → **Service Accounts**
2. Click **Generate New Private Key**
3. Download the JSON file

### Step 3: Configure Backend

1. Place the downloaded JSON file at:
   ```
   backend/config/firebase-seller-service-account.json
   ```

2. Update the JSON content with your credentials:
   ```json
   {
     "type": "service_account",
     "project_id": "YOUR_SELLER_PROJECT_ID",
     "private_key_id": "YOUR_PRIVATE_KEY_ID",
     "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n",
     "client_email": "firebase-adminsdk-xxxxx@YOUR_PROJECT_ID.iam.gserviceaccount.com",
     "client_id": "YOUR_CLIENT_ID",
     "auth_uri": "https://accounts.google.com/o/oauth2/auth",
     "token_uri": "https://oauth2.googleapis.com/token",
     "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
     "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/YOUR_CLIENT_EMAIL",
     "universe_domain": "googleapis.com"
   }
   ```

3. **Important**: Add this file to `.gitignore` to avoid committing sensitive credentials:
   ```
   backend/config/firebase-seller-service-account.json
   ```

### Step 4: Update Seller App (React Native)

1. Add the `google-services.json` (Android) from your Seller Firebase project:
   ```
   Seller_App/android/app/google-services.json
   ```

2. Add the `GoogleService-Info.plist` (iOS) from your Seller Firebase project:
   ```
   Seller_App/ios/GoogleService-Info.plist
   ```

3. Rebuild the Seller App to use the new Firebase configuration

## Fallback Behavior

If `firebase-seller-service-account.json` is not configured:
- System will use the **default Firebase** for both sellers and deliverymen
- A warning will be logged at startup:
  ```
  ⚠️ Seller Firebase service account not configured. Using default Firebase for sellers.
  ```

## Code Implementation

### FCM Service (`backend/utils/fcmService.js`)

```javascript
// Default Firebase for Deliverymen
const admin = require("firebase-admin");
if (!admin.apps.length) {
  const serviceAccount = require("../config/firebase-service-account.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Separate Firebase for Sellers
let adminSeller;
try {
  const sellerServiceAccount = require("../config/firebase-seller-service-account.json");
  const sellerApp = admin.apps.find(app => app.name === 'seller');
  
  if (!sellerApp) {
    adminSeller = admin.initializeApp({
      credential: admin.credential.cert(sellerServiceAccount),
    }, 'seller');
  } else {
    adminSeller = sellerApp;
  }
  
  console.log("✅ Seller Firebase Admin initialized successfully");
} catch (error) {
  adminSeller = admin; // Fallback to default
}
```

### Seller Notification Function

```javascript
const sendFCMNotificationToSeller = async (shop, order) => {
  // Uses adminSeller.messaging().send() instead of admin.messaging().send()
  const response = await adminSeller.messaging().send(message);
  return {
    success: true,
    messageId: response,
    firebaseInstance: adminSeller.name || 'default'
  };
};
```

## Testing

### Test Script
```bash
cd backend
node test-seller-notification.js
```

### Expected Output
```
✅ Connected to database
✅ Seller Firebase Admin initialized successfully

📱 Shop found:
   Name: Test Shop
   ID: 507f1f77bcf86cd799439011
   Has Token: true

🔔 Sending FCM notification to seller...
   Using Firebase instance: seller

✅ Notification sent successfully!
   Message ID: projects/YOUR_PROJECT/messages/0:1234567890
```

## Verification

### Check Firebase Instance
The notification response includes `firebaseInstance`:
```json
{
  "success": true,
  "messageId": "projects/YOUR_PROJECT/messages/0:1234567890",
  "fcmToken": "eXXXXX...",
  "firebaseInstance": "seller"
}
```

### Check Logs
Server logs will show:
```
Sending FCM notification to seller: Shop Name (ID: 507f1f77bcf86cd799439011)
Using Firebase instance: seller
FCM notification sent successfully to seller: Shop Name
```

## Security Best Practices

1. **Never commit service account files to Git**
   ```bash
   # Add to .gitignore
   backend/config/firebase-service-account.json
   backend/config/firebase-seller-service-account.json
   ```

2. **Use environment variables for production**
   - Store credentials in secure vault (AWS Secrets Manager, etc.)
   - Load credentials at runtime

3. **Restrict service account permissions**
   - Only grant necessary Firebase permissions
   - Use separate service accounts for different environments

## Troubleshooting

### Error: "Seller Firebase service account not configured"
**Solution**: Create `firebase-seller-service-account.json` with valid credentials

### Error: "Invalid credentials"
**Solution**: 
- Verify JSON format is correct
- Ensure service account has Cloud Messaging Admin role
- Re-download service account key from Firebase Console

### Error: "Invalid FCM token"
**Solution**:
- Ensure Seller App is using matching Firebase project
- Verify `google-services.json` matches the backend service account
- Re-register FCM token in Seller App

### Notifications Not Received
**Solution**:
1. Check Seller App has correct `google-services.json`
2. Verify FCM token is registered in database (`shop.expoPushToken`)
3. Check Firebase Console → Cloud Messaging for delivery status
4. Ensure notification permissions are granted in Seller App

## File Structure
```
backend/
├── config/
│   ├── firebase-service-account.json          # Deliverymen (default)
│   └── firebase-seller-service-account.json   # Sellers (separate)
├── utils/
│   └── fcmService.js                          # Dual Firebase initialization
└── controller/
    └── order.js                               # Calls seller notifications

Seller_App/
├── android/
│   └── app/
│       └── google-services.json               # Seller Firebase config
└── ios/
    └── GoogleService-Info.plist               # Seller Firebase config
```

## Benefits

✅ **Isolation**: Separate projects = better security
✅ **Analytics**: Track seller vs deliveryman notifications separately
✅ **Scalability**: Different rate limits and quotas per project
✅ **Flexibility**: Different notification settings per app
✅ **Monitoring**: Separate Firebase Console dashboards

## Migration from Single Firebase

If you're currently using one Firebase for both:

1. **Keep existing setup working**: Don't create `firebase-seller-service-account.json` yet
2. **Create new Firebase project** for Seller App
3. **Add service account** to backend
4. **Update Seller App** with new `google-services.json`
5. **Test notifications** work from both Firebase projects
6. **Deploy** and verify in production

## Current Status

✅ Backend supports dual Firebase instances
✅ Automatic fallback to default Firebase
✅ Seller notifications use separate Firebase (if configured)
✅ Deliveryman notifications use default Firebase
✅ Backward compatible with single Firebase setup

## Summary

The system now supports **two Firebase instances**:
- **Deliverymen**: `firebase-service-account.json` (default)
- **Sellers**: `firebase-seller-service-account.json` (separate)

Configure the seller service account to enable separate Firebase projects, or leave unconfigured to use the default Firebase for both.
