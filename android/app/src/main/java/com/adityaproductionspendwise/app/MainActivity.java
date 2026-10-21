package com.adityaproductionspendwise.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.util.Log;
import androidx.annotation.NonNull;
import com.getcapacitor.BridgeActivity;
import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.appopen.AppOpenAd;
import java.util.Date;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "FlatHisabAppOpenAd";
    private static final String APP_OPEN_AD_UNIT_ID = "ca-app-pub-9364231981895017/3883779302";

    private AppOpenAd appOpenAd = null;
    private boolean isLoadingAd = false;
    private boolean isShowingAd = false;
    private long loadTime = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        MobileAds.initialize(this, initializationStatus -> {
            loadAppOpenAd(true);
        });
    }

    @Override
    public void onStart() {
        super.onStart();
        showAdIfAvailable();
    }

    private boolean isRoomPremiumAdFree() {
        try {
            // Check Capacitor localStorage / SharedPreferences if room premium is active
            SharedPreferences prefs = getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
            String val = prefs.getString("flathisab_room_premium", "false");
            return "true".equalsIgnoreCase(val);
        } catch (Exception e) {
            return false;
        }
    }

    private boolean wasLoadTimeLessThanNHoursAgo(long numHours) {
        long dateDifference = (new Date()).getTime() - this.loadTime;
        long numMilliSecondsPerHour = 3600000;
        return (dateDifference < (numMilliSecondsPerHour * numHours));
    }

    private boolean isAdAvailable() {
        return appOpenAd != null && wasLoadTimeLessThanNHoursAgo(4);
    }

    private void loadAppOpenAd(final boolean showImmediatelyOnColdStart) {
        if (isRoomPremiumAdFree()) {
            return;
        }
        if (isLoadingAd || isAdAvailable()) {
            return;
        }

        isLoadingAd = true;
        AdRequest request = new AdRequest.Builder().build();
        AppOpenAd.load(
            this,
            APP_OPEN_AD_UNIT_ID,
            request,
            new AppOpenAd.AppOpenAdLoadCallback() {
                @Override
                public void onAdLoaded(@NonNull AppOpenAd ad) {
                    appOpenAd = ad;
                    isLoadingAd = false;
                    loadTime = (new Date()).getTime();
                    Log.d(TAG, "App Open Ad loaded: " + APP_OPEN_AD_UNIT_ID);
                    if (showImmediatelyOnColdStart) {
                        showAdIfAvailable();
                    }
                }

                @Override
                public void onAdFailedToLoad(@NonNull LoadAdError loadAdError) {
                    isLoadingAd = false;
                    Log.e(TAG, "App Open Ad failed to load: " + loadAdError.getMessage());
                }
            }
        );
    }

    private void showAdIfAvailable() {
        if (isShowingAd || isRoomPremiumAdFree()) {
            return;
        }

        if (!isAdAvailable()) {
            loadAppOpenAd(false);
            return;
        }

        appOpenAd.setFullScreenContentCallback(new FullScreenContentCallback() {
            @Override
            public void onAdDismissedFullScreenContent() {
                appOpenAd = null;
                isShowingAd = false;
                loadAppOpenAd(false);
            }

            @Override
            public void onAdFailedToShowFullScreenContent(@NonNull AdError adError) {
                appOpenAd = null;
                isShowingAd = false;
                loadAppOpenAd(false);
            }

            @Override
            public void onAdShowedFullScreenContent() {
                isShowingAd = true;
            }
        });

        isShowingAd = true;
        appOpenAd.show(this);
    }
}

