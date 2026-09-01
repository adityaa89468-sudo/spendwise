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
  
  const isProduction = import.meta.env.VITE_ADMOB_PRODUCTION !== 'false';
  
  await AdMob.initialize({
    requestTrackingAuthorization: true,
    testingDevices: isProduction ? [] : ['2077ef9a62d87ee38686f1a07b4ee10b'],
    initializeForTesting: !isProduction,
  } as any);

  // Handle UMP Consent
  try {
    const consentInfo = await AdMob.requestConsentInfo();
    if (consentInfo.isConsentFormAvailable && consentInfo.status === 'REQUIRED') {
      await AdMob.showConsentForm();
    }
  } catch (error) {
    console.error('Consent error:', error);
  }
};

export const showConsentForm = async () => {
  if (!isNative()) return;
  try {
    await AdMob.showConsentForm();
  } catch (error) {
    console.error('Show Consent Form Error:', error);
  }
};

export const showBanner = async () => {
  if (!isNative()) return;

  const isProduction = import.meta.env.VITE_ADMOB_PRODUCTION !== 'false';

  await AdMob.showBanner({
    adId: import.meta.env.VITE_ADMOB_BANNER_ID || 'ca-app-pub-9364231981895017/6262161138',
    adSize: BannerAdSize.ADAPTIVE_BANNER,
    position: BannerAdPosition.BOTTOM_CENTER,
    margin: 85, // Positioned safely above the bottom navigation bar
    isTesting: !isProduction 
  });
};

export const hideBanner = async () => {
  if (!isNative()) return;
  await AdMob.hideBanner();
};

export const showRewardedAd = async (): Promise<AdMobRewardItem | null> => {
  if (!isNative()) return null;

  const isProduction = import.meta.env.VITE_ADMOB_PRODUCTION !== 'false';

  try {
    await AdMob.prepareRewardVideoAd({
      adId: import.meta.env.VITE_ADMOB_REWARD_ID || 'ca-app-pub-9364231981895017/3144105484',
      isTesting: !isProduction
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

  const isProduction = import.meta.env.VITE_ADMOB_PRODUCTION !== 'false';

  try {
    await AdMob.prepareInterstitial({
      adId: import.meta.env.VITE_ADMOB_INTERSTITIAL_ID || 'ca-app-pub-9364231981895017/1460394593',
      isTesting: !isProduction
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
