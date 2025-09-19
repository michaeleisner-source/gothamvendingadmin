import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.e7bd0b3ccdca4ce6a627ada1c55857ef',
  appName: 'gothamvendingadmin',
  webDir: 'dist',
  server: {
    url: 'https://e7bd0b3c-cdca-4ce6-a627-ada1c55857ef.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    },
    Geolocation: {
      permissions: ['location']
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;