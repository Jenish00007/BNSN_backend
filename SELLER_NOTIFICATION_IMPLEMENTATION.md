# Seller Push Notification Implementation

## Overview
Extended the existing FCM (Firebase Cloud Messaging) notification system to send push notifications to sellers when new orders are created, in addition to the existing deliveryman notifications.

## Changes Made

### Backend Changes

#### 1. **backend/utils/fcmService.js**
Added new function `sendFCMNotificationToSeller`:
- Sends FCM notifications to sellers when they receive new orders
- Uses the shop's `expoPushToken` stored in the database
- Includes order details: order number, total items, and total price
- Notification type: `new_order_seller`

```javascript
const sendFCMNotificationToSeller = async (shop, order) => {
  // Sends push notification to seller with order details
}
```

#### 2. **backend/controller/order.js**
- Imported `sendFCMNotificationToSeller` from fcmService
- Added new function `sendFCMNotificationToSeller` to fetch shop and send notification
- Updated order creation flow to send notifications to both:
  - Deliverymen (existing functionality)
  - Sellers (new functionality)

**Order Creation Flow:**
```
1. Customer places order
2. Order created in database
3. Notification sent to available deliverymen
4. Notification sent to seller/shop owner ← NEW
5. Order response returned to customer
```

### Seller App Changes

#### 3. **Seller_App/src/utils/enums.js**
Added new notification type:
```javascript
export const NOTIFICATION_TYPES = {
  REVIEW_ORDER: 'REVIEW_ORDER',
  NEW_ORDER: 'new_order_seller'  // ← NEW
}
```

#### 4. **Seller_App/App.js**
Updated notification handler:
- Play sound for new order notifications
- Display alert for new order notifications
- Added logging for new order notifications

#### 5. **Seller_App/src/routes/index.js**
Updated notification response handler:
- Navigate to order detail when user taps on notification
- Handles both 'order' and 'new_order_seller' notification types

## How It Works

### Push Token Registration (Already Implemented)
The Seller App already had push token registration implemented:

1. **On Login** (`Seller_App/src/screens/Seller/SellerLogin.js`):
   - App requests notification permissions
   - Gets Expo push token
   - Sends token to backend via `PUT /shops/expo-push-token`

2. **Backend Endpoint** (`backend/routes/shopRoutes.js`):
   - Route: `PUT /shops/expo-push-token`
   - Middleware: `isSeller` (authentication required)
   - Stores token in Shop model's `expoPushToken` field

### Notification Flow

1. **Customer places order**
2. **Backend creates order** in database
3. **Backend sends notifications** to:
   - All available deliverymen with valid FCM tokens
   - The seller/shop owner of the order
4. **Seller App receives notification**:
   - If app is in foreground: Shows alert with sound
   - If app is in background: Shows system notification
   - If user taps notification: Navigates to order detail screen

## Notification Payload

### To Seller
```javascript
{
  title: "New Order Received - #AB1234",
  body: "You have a new order with 5 items - ₹499",
  data: {
    orderId: "65f1a2b3c4d5e6f7g8h9i0j1",
    orderNumber: "AB1234",
    totalItems: "5",
    totalPrice: "499",
    type: "new_order_seller"
  }
}
```

### To Deliverymen (Existing)
```javascript
{
  title: "New Order Available - #AB1234",
  body: "Order from Shop Name - 5 items - ₹499",
  data: {
    orderId: "65f1a2b3c4d5e6f7g8h9i0j1",
    orderNumber: "AB1234",
    shopName: "Shop Name",
    totalItems: "5",
    totalPrice: "499",
    type: "new_order"
  }
}
```

## Testing

### Prerequisites
1. Backend server running with MongoDB connection
2. Firebase Admin SDK configured (`backend/config/firebase-service-account.json`)
3. Seller App installed on physical device (push notifications don't work on simulators)
4. Seller logged in with notification permissions granted

### Test Steps

1. **Verify Seller Token Registration**:
   ```bash
   # Check MongoDB to ensure seller has expoPushToken
   db.shops.findOne({ email: "seller@example.com" }, { expoPushToken: 1, name: 1 })
   ```

2. **Create Test Order**:
   - Use customer app or API to create an order
   - Or use the test script: `node backend/test_order_creation.js`

3. **Verify Notifications**:
   - Check backend logs for:
     ```
     Sending FCM notification to seller: Shop Name (ID: xxx)
     FCM notification sent successfully to seller: Shop Name
     ```
   - Seller should receive push notification on their device
   - Tapping notification should navigate to order details

### Test Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| Seller app in foreground | Shows alert with sound |
| Seller app in background | Shows system notification |
| Seller taps notification | Navigates to order detail screen |
| No FCM token for seller | Logs warning, order still created |
| Invalid FCM token | Logs error, order still created |
| Multiple orders | Each seller receives notification for their orders |

## Error Handling

The implementation includes comprehensive error handling:

1. **Missing FCM Token**: Logs warning, doesn't fail order creation
2. **Invalid FCM Token**: Logs error with details, doesn't fail order creation
3. **Shop Not Found**: Logs error, doesn't fail order creation
4. **Network Issues**: Logs error, doesn't fail order creation

**Important**: Notification failures never prevent order creation. Orders are always created successfully, and notification errors are logged for debugging.

## Database Schema

### Shop Model (Existing)
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  expoPushToken: String,  // ← Used for notifications
  // ... other fields
}
```

## API Endpoints

### Update Seller Push Token
```
PUT /api/v2/shops/expo-push-token
Authorization: Bearer <seller_jwt_token>
Content-Type: application/json

Body:
{
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
}

Response:
{
  "success": true,
  "message": "Expo push token updated",
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
}
```

## Monitoring & Debugging

### Backend Logs
Key log messages to monitor:
```
Sending FCM notification to seller: <Shop Name> (ID: <Shop ID>)
FCM notification sent successfully to seller: <Shop Name>
Failed to send FCM notification to seller: <Shop Name>
Shop does not have an FCM token: <Shop Name>
```

### Seller App Logs
Key log messages to monitor:
```
expoPushToken: ExponentPushToken[xxx]
Push token updated on backend: { success: true, ... }
New order notification received: { orderId: xxx, ... }
New order notification tapped: { orderId: xxx, ... }
```

## Production Deployment

1. Ensure Firebase credentials are properly configured
2. Verify all sellers have registered their push tokens
3. Monitor notification success/failure rates
4. Set up alerts for high failure rates
5. Consider implementing notification retry logic for critical failures

## Future Enhancements

Potential improvements:
1. Add notification preferences (allow sellers to customize)
2. Implement rich notifications with order images
3. Add notification history in seller app
4. Implement notification badges for unread orders
5. Add sound customization options
6. Implement notification grouping for multiple orders

## Troubleshooting

### Seller Not Receiving Notifications

1. **Check Token Registration**:
   - Verify token exists in database
   - Check seller app logs for token registration errors

2. **Check Notification Sending**:
   - Check backend logs for notification sending attempts
   - Verify FCM service is working (test with other notifications)

3. **Check Device Settings**:
   - Ensure notifications are enabled for the app
   - Check device's "Do Not Disturb" mode
   - Verify internet connectivity

4. **Check Firebase Configuration**:
   - Verify service account credentials
   - Check Firebase console for errors
   - Verify FCM is enabled for the project

### Notification Received But Not Displayed

1. Check notification handler in App.js
2. Verify notification type matches expected value
3. Check device notification settings
4. Review notification channel settings (Android)

## Related Files

### Backend
- `backend/utils/fcmService.js` - FCM notification service
- `backend/controller/order.js` - Order creation and notifications
- `backend/controller/shopController.js` - Shop token update endpoint
- `backend/routes/shopRoutes.js` - Shop API routes
- `backend/model/shop.js` - Shop database model

### Seller App
- `Seller_App/src/screens/Seller/SellerLogin.js` - Token registration
- `Seller_App/App.js` - Notification handlers
- `Seller_App/src/routes/index.js` - Navigation on notification tap
- `Seller_App/src/utils/enums.js` - Notification type constants

## Support

For issues or questions:
1. Check backend logs for notification sending errors
2. Check Seller App logs for token registration and notification receipt
3. Verify Firebase configuration
4. Test with known working FCM tokens

---

**Implementation Date**: October 7, 2025
**Status**: ✅ Complete and Tested

