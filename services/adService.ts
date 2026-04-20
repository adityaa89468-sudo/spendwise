import { 
  AdMob, 
  BannerAdSize, 
  BannerAdPosition, 
  AdMobRewardItem,
} from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

const isNative = () => {
  return Capacitor.isNativePlatform();
};

export const initializeAdMob = async () => {
  if (!isNative()) return;
  
  await AdMob.initialize({
    requestTrackingAuthorization: true,
    testingDevices: ['2077ef9a62d87ee38686f1a07b4ee10b'],
    initializeForTesting: true,
  });
};

export const showBanner = async () => {
  if (!isNative()) return;

  await AdMob.showBanner({
    adId: 'ca-app-pub-9364231981895017/2923766175',
    adSize: BannerAdSize.ADAPTIVE_BANNER,
    position: BannerAdPosition.BOTTOM_CENTER,
    margin: 50, // Avoid overlapping the tab bar
    isTesting: true // REMOVE FOR PRODUCTION
  });
};

export const hideBanner = async () => {
  if (!isNative()) return;
  await AdMob.hideBanner();
};

export const showRewardedAd = async (): Promise<AdMobRewardItem | null> => {
  if (!isNative()) return null;

  try {
    await AdMob.prepareRewardVideoAd({
      adId: 'ca-app-pub-9364231981895017/3144105484',
      isTesting: true // REMOVE FOR PRODUCTION
    });
    
    const reward = await AdMob.showRewardVideoAd();
    return reward;
  } catch (error) {
    console.error('AdMob Error:', error);
    return null;
  }
};
