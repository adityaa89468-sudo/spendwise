import { Capacitor, registerPlugin } from '@capacitor/core';

/**
 * Product ID & Base Plan ID to configure in Google Play Console:
 * 1. Go to Google Play Console -> Monetize -> Products -> Subscriptions
 * 2. Create a subscription with Product ID: `room_premium_monthly`
 * 3. Add a Base Plan with Base Plan ID: `monthly-59` (Monthly auto-renewing or prepaid, ₹59)
 */
export const ROOM_PREMIUM_PRODUCT_ID = 'room_premium_monthly';
export const ROOM_PREMIUM_BASE_PLAN_ID = 'monthly-59';

export interface PlaySubscriptionDetails {
  found: boolean;
  productId: string;
  title?: string;
  description?: string;
  formattedPrice?: string;
  priceCurrencyCode?: string;
  basePlanId?: string;
  offerToken?: string;
  responseCode?: number;
  debugMessage?: string;
}

export interface PlayPurchaseResult {
  purchased: boolean;
  purchaseToken: string;
  orderId?: string;
  productId: string;
}

export interface PlayRestoreResult {
  hasActiveSubscription: boolean;
  purchaseToken?: string;
}

interface PlayBillingPluginInterface {
  querySubscription(options: { productId: string }): Promise<PlaySubscriptionDetails>;
  purchaseSubscription(options: {
    productId: string;
    basePlanId?: string;
  }): Promise<PlayPurchaseResult>;
  restorePurchases(): Promise<PlayRestoreResult>;
}

const PlayBilling = registerPlugin<PlayBillingPluginInterface>('PlayBilling');

/**
 * Queries the Room Premium subscription product details from Google Play Billing.
 */
export const queryRoomPremiumSubscription = async (): Promise<PlaySubscriptionDetails> => {
  if (!Capacitor.isNativePlatform()) {
    return {
      found: true,
      productId: ROOM_PREMIUM_PRODUCT_ID,
      title: 'Flat Hisab Room Premium (Ad-Free Room)',
      description: 'Removes all ads for every roommate in your room for 1 month.',
      formattedPrice: '₹59.00',
      priceCurrencyCode: 'INR',
      basePlanId: ROOM_PREMIUM_BASE_PLAN_ID,
    };
  }

  try {
    return await PlayBilling.querySubscription({
      productId: ROOM_PREMIUM_PRODUCT_ID,
    });
  } catch (error) {
    console.warn('Google Play Billing query warning:', error);
    return {
      found: false,
      productId: ROOM_PREMIUM_PRODUCT_ID,
    };
  }
};

/**
 * Launches the native Google Play Billing subscription sheet for `room_premium_monthly`.
 */
export const purchaseRoomPremiumWithGooglePlay = async (): Promise<PlayPurchaseResult> => {
  if (!Capacitor.isNativePlatform()) {
    // Web preview simulation fallback
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return {
      purchased: true,
      purchaseToken: 'web-preview-token-' + Date.now(),
      orderId: 'GPA.WEB-PREVIEW-' + Date.now(),
      productId: ROOM_PREMIUM_PRODUCT_ID,
    };
  }

  return await PlayBilling.purchaseSubscription({
    productId: ROOM_PREMIUM_PRODUCT_ID,
    basePlanId: ROOM_PREMIUM_BASE_PLAN_ID,
  });
};

/**
 * Checks if the user already has an active Google Play subscription on their Google account.
 */
export const restoreRoomPremiumFromGooglePlay = async (): Promise<PlayRestoreResult> => {
  if (!Capacitor.isNativePlatform()) {
    return { hasActiveSubscription: false };
  }

  try {
    return await PlayBilling.restorePurchases();
  } catch (error) {
    console.error('Failed to restore Google Play purchases:', error);
    return { hasActiveSubscription: false };
  }
};
