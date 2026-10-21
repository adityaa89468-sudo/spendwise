import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.adityaproductionspendwise.app',
  appName: 'Flat Hisab: Expense Splitter',
  webDir: 'dist',
  overrideUserAgent: 'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
  server: {
    androidScheme: 'https',
    hostname: 'com.adityaproductionspendwise.app',
    allowNavigation: [
      '*.firebaseapp.com',
      '*.googleapis.com',
      '*.google.com',
      'accounts.google.com'
    ]
  },
  plugins: {
    AdMob: {
      androidAppId: 'ca-app-pub-9364231981895017~7433331132',
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
