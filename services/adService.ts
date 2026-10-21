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

export const BANNER_AD_UNIT_ID = 'ca-app-pub-9364231981895017/6262161138';
export const INTERSTITIAL_AD_UNIT_ID = 'ca-app-pub-9364231981895017/9460467949';
export const REWARDED_AD_UNIT_ID = 'ca-app-pub-9364231981895017/3144105484';

export const initializeAdMob = async () => {
  if (!isNative()) return;

  try {
    await AdMob.initialize({
      requestTrackingAuthorization: true,
      testingDevices: [],
      initializeForTesting: false,
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
  } catch (err) {
    console.error('AdMob initialization error:', err);
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

  const adId = import.meta.env.VITE_ADMOB_BANNER_ID || BANNER_AD_UNIT_ID;

  try {
    await AdMob.showBanner({
      adId,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 85, // Positioned safely above the bottom navigation bar
      isTesting: false
    });
  } catch (err) {
    console.error('AdMob showBanner error:', err);
  }
};

export const hideBanner = async () => {
  if (!isNative()) return;
  try {
    await AdMob.hideBanner();
  } catch (err) {
    console.error('AdMob hideBanner error:', err);
  }
};

export const showRewardedAd = async (): Promise<AdMobRewardItem | null> => {
  if (!isNative()) return null;

  const adId = import.meta.env.VITE_ADMOB_REWARD_ID || REWARDED_AD_UNIT_ID;

  try {
    await AdMob.prepareRewardVideoAd({
      adId,
      isTesting: false
    });
    
    const reward = await AdMob.showRewardVideoAd();
    return reward;
  } catch (error) {
    console.error('AdMob Reward Error:', error);
    return null;
  }
};

export const prepareInterstitial = async () => {
  if (!isNative()) return;

  const adId = import.meta.env.VITE_ADMOB_INTERSTITIAL_ID || INTERSTITIAL_AD_UNIT_ID;

  try {
    await AdMob.prepareInterstitial({
      adId,
      isTesting: false
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
