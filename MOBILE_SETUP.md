# Mobile App Setup with Capacitor

This guide explains how to set up and run your mobile app with native capabilities.

## Development in Lovable

The mobile features are already set up and working in the Lovable environment:
- **Camera**: Document scanning and photo capture
- **GPS Tracking**: Enhanced location services with high accuracy
- **Push Notifications**: Local and push notification support
- **Offline Sync**: Data synchronization capabilities

## Running on Physical Device or Emulator

To run this app on your mobile device or emulator:

### 1. Export to GitHub
Click the "Export to GitHub" button in Lovable to transfer your project.

### 2. Setup Local Environment
```bash
git clone your-repo-url
cd your-project
npm install
```

### 3. Add Mobile Platforms
```bash
# For Android
npx cap add android

# For iOS (Mac with Xcode required)
npx cap add ios
```

### 4. Build and Sync
```bash
npm run build
npx cap sync
```

### 5. Run on Device/Emulator
```bash
# For Android
npx cap run android

# For iOS
npx cap run ios
```

## Native Features Available

- **📷 Camera**: Take photos for inventory, documents, and reports
- **📍 GPS**: Real-time location tracking with high accuracy
- **🔔 Notifications**: Push and local notifications for alerts
- **💾 Offline**: Data sync when connection is restored

## Permissions Required

The app will request these permissions:
- Camera access for photo capture
- Location access for GPS tracking
- Notification permissions for alerts

## Development Tips

- Use the hot-reload URL in capacitor.config.ts for live development
- Run `npx cap sync` after any native capability changes
- Test on actual devices for best GPS and camera performance

For more detailed mobile development guidance, visit: https://lovable.dev/blogs/TODO