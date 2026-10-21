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

export const APP_OPEN_AD_UNIT_ID = import.meta.env.VITE_ADMOB_APP_OPEN_ID || 'ca-app-pub-9364231981895017/3883779302';
export const BANNER_AD_UNIT_ID = import.meta.env.VITE_ADMOB_BANNER_ID || 'ca-app-pub-9364231981895017/6262161138';

// In-memory & storage state tracking whether the currently joined room has active Premium (₹59/mo)
let currentRoomHasPremium = false;

export const setRoomPremiumAdFreeState = async (isAdFree: boolean) => {
  currentRoomHasPremium = isAdFree;
  try {
    localStorage.setItem('flathisab_room_premium', isAdFree ? 'true' : 'false');
  } catch (e) {
    // ignore storage errors
  }

  if (isAdFree) {
    await removeBanner();
  }
};

export const isRoomPremiumAdFree = (): boolean => {
  return currentRoomHasPremium;
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

export const showBanner = async (topMarginDp?: number) => {
  if (!isNative() || currentRoomHasPremium) return;

  const isProduction = import.meta.env.VITE_ADMOB_PRODUCTION !== 'false';

  try {
    await AdMob.showBanner({
      adId: BANNER_AD_UNIT_ID,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: topMarginDp !== undefined ? BannerAdPosition.TOP_CENTER : BannerAdPosition.BOTTOM_CENTER,
      margin: topMarginDp !== undefined ? topMarginDp : 85,
      isTesting: !isProduction
    });
  } catch (error) {
    console.error('Show Banner Error:', error);
  }
};

export const hideBanner = async () => {
  if (!isNative()) return;
  try {
    await AdMob.hideBanner();
  } catch (error) {
    console.error('Hide Banner Error:', error);
  }
};

export const removeBanner = async () => {
  if (!isNative()) return;
  try {
    await AdMob.removeBanner();
  } catch (error) {
    console.error('Remove Banner Error:', error);
  }
};

export const showRewardedAd = async (): Promise<AdMobRewardItem | null> => {
  if (!isNative() || currentRoomHasPremium) return null;

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
  if (!isNative() || currentRoomHasPremium) return;

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
  if (!isNative() || currentRoomHasPremium) return;

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
