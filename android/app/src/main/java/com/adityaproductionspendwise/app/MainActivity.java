package com.adityaproductionspendwise.app;

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
    private boolean showOnColdStart = true;
    private long loadTime = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        MobileAds.initialize(this, initializationStatus -> {
            if (!isCurrentRoomPremium()) {
                loadAppOpenAd();
            }
        });
    }

    @Override
    public void onResume() {
        super.onResume();
        if (!showOnColdStart && !isCurrentRoomPremium()) {
            showAdIfAvailable();
        }
    }

    /**
     * Checks if the active logged-in user is currently inside an active Premium Room.
     * Returns false when logged out or in a free-tier room so ads resume immediately.
     */
    private boolean isCurrentRoomPremium() {
        try {
            SharedPreferences prefs = getSharedPreferences("CapacitorStorage", MODE_PRIVATE);
            String premiumVal = prefs.getString("flathisab_room_premium", "false");
            return "true".equals(premiumVal);
        } catch (Exception e) {
            return false;
        }
    }

    private void loadAppOpenAd() {
        if (isCurrentRoomPremium() || isLoadingAd || isAdAvailable()) {
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
                    Log.d(TAG, "App Open Ad loaded.");

                    if (showOnColdStart) {
                        showOnColdStart = false;
                        if (!isCurrentRoomPremium()) {
                            showAdIfAvailable();
                        }
                    }
                }

                @Override
                public void onAdFailedToLoad(@NonNull LoadAdError loadAdError) {
                    isLoadingAd = false;
                    showOnColdStart = false;
                    Log.w(TAG, "App Open Ad failed to load: " + loadAdError.getMessage());
                }
            }
        );
    }

    private boolean wasLoadTimeLessThanNHoursAgo(long numHours) {
        long dateDifference = (new Date()).getTime() - loadTime;
        long numMilliSecondsPerHour = 3600000;
        return (dateDifference < (numMilliSecondsPerHour * numHours));
    }

    private boolean isAdAvailable() {
        return appOpenAd != null && wasLoadTimeLessThanNHoursAgo(4);
    }

    private void showAdIfAvailable() {
        if (isShowingAd || isCurrentRoomPremium()) {
            return;
        }

        if (!isAdAvailable()) {
            loadAppOpenAd();
            return;
        }

        appOpenAd.setFullScreenContentCallback(new FullScreenContentCallback() {
            @Override
            public void onAdDismissedFullScreenContent() {
                appOpenAd = null;
                isShowingAd = false;
                loadAppOpenAd();
            }

            @Override
            public void onAdFailedToShowFullScreenContent(@NonNull AdError adError) {
                appOpenAd = null;
                isShowingAd = false;
                loadAppOpenAd();
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
