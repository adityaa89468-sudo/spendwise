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
    // @ts-ignore
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
    margin: 85, // Positioned safely above the bottom navigation bar
    isTesting: true 
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

export const prepareInterstitial = async () => {
  if (!isNative()) return;

  try {
    await AdMob.prepareInterstitial({
      adId: 'ca-app-pub-9364231981895017/1460394593',
      isTesting: true // REMOVE FOR PRODUCTION
    });
  } catch (error) {
    console.error('Prepare Interstitial Error:', error);
  }
};

export const showInterstitialAd = async () => {
  if (!isNative()) return;

  try {
    // Attempt to show immediately (assumes prepared)
    await AdMob.showInterstitial();
  } catch (error) {
    console.error('Interstitial Ad Error:', error);
    // Fallback: prepare and try once more if it failed because it wasn't ready
    await prepareInterstitial();
    try {
      await AdMob.showInterstitial();
    } catch (e) {
      console.error('Final Interstitial Ad Error:', e);
    }
  }
};
