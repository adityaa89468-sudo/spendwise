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
export const INTERSTITIAL_AD_UNIT_ID = import.meta.env.VITE_ADMOB_INTERSTITIAL_ID || 'ca-app-pub-9364231981895017/2896633718';
export const REWARDED_AD_UNIT_ID = import.meta.env.VITE_ADMOB_REWARD_ID || 'ca-app-pub-9364231981895017/3144105484';

let currentRoomHasPremium = false;

try {
  currentRoomHasPremium = localStorage.getItem('flathisab_room_premium') === 'true';
} catch (e) {
  // ignore storage errors
}

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

    if (!currentRoomHasPremium) {
      await prepareInterstitial();
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
  if (!isNative() || currentRoomHasPremium) return;

  try {
    await AdMob.showBanner({
      adId: BANNER_AD_UNIT_ID,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
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

export const removeBanner = async () => {
  if (!isNative()) return;
  try {
    await AdMob.removeBanner();
  } catch (err) {
    console.error('AdMob removeBanner error:', err);
  }
};

export const showRewardedAd = async (): Promise<AdMobRewardItem | null> => {
  if (!isNative() || currentRoomHasPremium) return null;

  try {
    await AdMob.prepareRewardVideoAd({
      adId: REWARDED_AD_UNIT_ID,
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
  if (!isNative() || currentRoomHasPremium) return;

  try {
    await AdMob.prepareInterstitial({
      adId: INTERSTITIAL_AD_UNIT_ID,
      isTesting: false
    });
  } catch (error) {
    console.error('Prepare Interstitial Error:', error);
  }
};

export const showInterstitialAd = async () => {
  if (!isNative() || currentRoomHasPremium) return;

  try {
    await AdMob.showInterstitial();
    await prepareInterstitial();
  } catch (error) {
    console.error('Interstitial Ad Error:', error);
    await prepareInterstitial();
    try {
      await AdMob.showInterstitial();
    } catch (e) {
      console.error('Final Interstitial Ad Error:', e);
    }
  }
};

