import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AppUpdateInfo } from '../types';

declare const __BUILD_GRADLE_VERSION_NAME__: string | undefined;
declare const __BUILD_GRADLE_VERSION_CODE__: number | undefined;

export const CURRENT_APP_VERSION = typeof __BUILD_GRADLE_VERSION_NAME__ !== 'undefined' ? __BUILD_GRADLE_VERSION_NAME__ : '1.00.01';
export const CURRENT_VERSION_CODE = typeof __BUILD_GRADLE_VERSION_CODE__ !== 'undefined' ? __BUILD_GRADLE_VERSION_CODE__ : 10001;
export const PLAY_STORE_PACKAGE_ID = 'com.adityaproductionspendwise.app';
export const DEFAULT_PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${PLAY_STORE_PACKAGE_ID}`;
export const NATIVE_MARKET_URL = `market://details?id=${PLAY_STORE_PACKAGE_ID}`;

const SNOOZE_KEY = 'spendwise_update_snooze_until';
const FORCE_TEST_UPDATE_KEY = 'spendwise_test_update_version';

/**
 * Compare two semver strings (e.g. "1.1.0" > "1.0.0")
 */
export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  const maxLength = Math.max(parts1.length, parts2.length);
  for (let i = 0; i < maxLength; i++) {
    const val1 = parts1[i] || 0;
    const val2 = parts2[i] || 0;
    if (val1 > val2) return 1;
    if (val1 < val2) return -1;
  }
  return 0;
}

/**
 * Check if the user has snoozed non-critical updates within 24 hours
 */
export function isUpdateSnoozed(version: string): boolean {
  try {
    const raw = localStorage.getItem(`${SNOOZE_KEY}_${version}`);
    if (!raw) return false;
    const snoozeUntil = parseInt(raw, 10);
    return Date.now() < snoozeUntil;
  } catch (e) {
    return false;
  }
}

/**
 * Snooze update modal for 24 hours
 */
export function snoozeUpdate(version: string) {
  try {
    const expireTime = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    localStorage.setItem(`${SNOOZE_KEY}_${version}`, expireTime.toString());
  } catch (e) {
    console.warn("Could not save snooze preference", e);
  }
}

/**
 * Check for updates from Firestore config or fallback test override
 */
export async function fetchAppUpdateInfo(ignoreSnooze: boolean = false): Promise<AppUpdateInfo> {
  let latestVersion = '1.1.0';
  let latestVersionCode = 101;
  let forceUpdate = false;
  let releaseNotes = [
    '⚡ Up to 3x faster bill splitting and automated roommate settlement calculation.',
    '🛡️ Enhanced Google Play security compliance & Firestore rule data isolation.',
    '🎨 Refined dark & light themes with smooth motion transitions.',
    '📱 Official Google Play Store mobile optimization & UPI deep links.'
  ];
  let playStoreUrl = DEFAULT_PLAY_STORE_URL;
  let downloadSize = '12.4 MB';
  let releaseDate = 'August 2026';

  // 1. Try fetching from Firestore app_config/version document
  try {
    const versionRef = doc(db, 'app_config', 'version');
    const docSnap = await getDoc(versionRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.latestVersion) latestVersion = data.latestVersion;
      if (data.latestVersionCode) latestVersionCode = data.latestVersionCode;
      if (typeof data.forceUpdate === 'boolean') forceUpdate = data.forceUpdate;
      if (Array.isArray(data.releaseNotes) && data.releaseNotes.length > 0) {
        releaseNotes = data.releaseNotes;
      }
      if (data.playStoreUrl) playStoreUrl = data.playStoreUrl;
      if (data.downloadSize) downloadSize = data.downloadSize;
      if (data.releaseDate) releaseDate = data.releaseDate;
    }
  } catch (err) {
    console.info("Using default or local version configuration:", err);
  }

  // 2. Check for manual developer/tester test override in localStorage
  try {
    const testOverride = localStorage.getItem(FORCE_TEST_UPDATE_KEY);
    if (testOverride) {
      const parsed = JSON.parse(testOverride);
      if (parsed.latestVersion) latestVersion = parsed.latestVersion;
      if (parsed.latestVersionCode) latestVersionCode = parsed.latestVersionCode;
      if (typeof parsed.forceUpdate === 'boolean') forceUpdate = parsed.forceUpdate;
    }
  } catch (e) {
    // Ignore invalid JSON
  }

  const isNewerVersion = compareVersions(latestVersion, CURRENT_APP_VERSION) > 0 || latestVersionCode > CURRENT_VERSION_CODE;
  const isSnoozed = !ignoreSnooze && !forceUpdate && isUpdateSnoozed(latestVersion);

  return {
    currentVersion: CURRENT_APP_VERSION,
    latestVersion,
    versionCode: CURRENT_VERSION_CODE,
    latestVersionCode,
    updateAvailable: isNewerVersion && !isSnoozed,
    forceUpdate,
    releaseNotes,
    playStoreUrl,
    releaseDate,
    downloadSize
  };
}

/**
 * Trigger Play Store redirect safely for both native app & web browser
 */
export function openPlayStore(url?: string) {
  const targetUrl = url || DEFAULT_PLAY_STORE_URL;
  
  // Try native intent if on Android native container
  const isAndroid = /android/i.test(navigator.userAgent);
  if (isAndroid) {
    try {
      window.location.href = NATIVE_MARKET_URL;
      // Fallback after short delay if native market scheme is unhandled
      setTimeout(() => {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      }, 800);
      return;
    } catch (e) {
      // Fallback
    }
  }

  window.open(targetUrl, '_blank', 'noopener,noreferrer');
}

/**
 * Set a test simulation override (e.g. for developer preview)
 */
export function setTestUpdateOverride(enabled: boolean, force: boolean = false, version: string = '1.2.0') {
  if (enabled) {
    localStorage.setItem(FORCE_TEST_UPDATE_KEY, JSON.stringify({
      latestVersion: version,
      latestVersionCode: 120,
      forceUpdate: force
    }));
    // Remove snooze if forcing test
    localStorage.removeItem(`${SNOOZE_KEY}_${version}`);
  } else {
    localStorage.removeItem(FORCE_TEST_UPDATE_KEY);
  }
}
