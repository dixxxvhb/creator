import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dancewithdixon.creator',
  appName: 'Creator',
  webDir: 'dist',
  server: {
    // During development, load from Vite dev server
    // Comment this out for production builds
    // url: 'http://localhost:5173',
    // cleartext: true,
  },
  ios: {
    // iPad-first
    preferredContentMode: 'mobile', // Use mobile viewport even on iPad for our custom layout
    scheme: 'Creator',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#0F1117', // Dark mode base
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK', // Light text on dark background
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
