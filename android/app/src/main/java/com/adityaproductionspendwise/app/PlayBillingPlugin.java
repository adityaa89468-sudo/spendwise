package com.adityaproductionspendwise.app;

import android.app.Activity;
import android.util.Log;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@CapacitorPlugin(name = "PlayBilling")
public class PlayBillingPlugin extends Plugin implements PurchasesUpdatedListener {
    private static final String TAG = "FlatHisabPlayBilling";
    public static final String DEFAULT_SUBSCRIPTION_ID = "room_premium_monthly";

    private BillingClient billingClient;
    private PluginCall pendingPurchaseCall;

    @Override
    public void load() {
        super.load();
        initBillingClient();
    }

    private synchronized void initBillingClient() {
        if (billingClient != null && billingClient.isReady()) {
            return;
        }
        billingClient = BillingClient.newBuilder(getContext())
            .setListener(this)
            .enablePendingPurchases(
                PendingPurchasesParams.newBuilder()
                    .enableOneTimeProducts()
                    .build()
            )
            .build();

        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(@NonNull BillingResult billingResult) {
                Log.d(TAG, "Play Billing setup finished: " + billingResult.getResponseCode() + " " + billingResult.getDebugMessage());
            }

            @Override
            public void onBillingServiceDisconnected() {
                Log.w(TAG, "Play Billing service disconnected. Will reconnect on next request.");
            }
        });
    }

    private void ensureConnected(@NonNull final Runnable onConnected, @NonNull final PluginCall call) {
        if (billingClient != null && billingClient.isReady()) {
            onConnected.run();
            return;
        }

        if (billingClient == null) {
            billingClient = BillingClient.newBuilder(getContext())
                .setListener(this)
                .enablePendingPurchases(
                    PendingPurchasesParams.newBuilder()
                        .enableOneTimeProducts()
                        .build()
                )
                .build();
        }

        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(@NonNull BillingResult billingResult) {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    onConnected.run();
                } else {
                    call.reject("Google Play Billing unavailable (" + billingResult.getResponseCode() + "): " + billingResult.getDebugMessage());
                }
            }

            @Override
            public void onBillingServiceDisconnected() {
                call.reject("Google Play Billing service disconnected.");
            }
        });
    }

    @PluginMethod
    public void querySubscription(final PluginCall call) {
        final String productId = call.getString("productId", DEFAULT_SUBSCRIPTION_ID);

        ensureConnected(() -> {
            QueryProductDetailsParams subsParams = QueryProductDetailsParams.newBuilder()
                .setProductList(
                    Collections.singletonList(
                        QueryProductDetailsParams.Product.newBuilder()
                            .setProductId(productId)
                            .setProductType(BillingClient.ProductType.SUBS)
                            .build()
                    )
                )
                .build();

            billingClient.queryProductDetailsAsync(subsParams, (billingResult, productDetailsList) -> {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK
                        && productDetailsList != null
                        && !productDetailsList.isEmpty()) {
                    ProductDetails details = productDetailsList.get(0);
                    JSObject ret = new JSObject();
                    ret.put("found", true);
                    ret.put("productId", details.getProductId());
                    ret.put("title", details.getTitle());
                    ret.put("description", details.getDescription());
                    ret.put("productType", BillingClient.ProductType.SUBS);

                    List<ProductDetails.SubscriptionOfferDetails> offers = details.getSubscriptionOfferDetails();
                    if (offers != null && !offers.isEmpty()) {
                        ProductDetails.SubscriptionOfferDetails offer = offers.get(0);
                        ret.put("offerToken", offer.getOfferToken());
                        ret.put("basePlanId", offer.getBasePlanId());
                        List<ProductDetails.PricingPhase> phases = offer.getPricingPhases().getPricingPhaseList();
                        if (!phases.isEmpty()) {
                            ret.put("formattedPrice", phases.get(0).getFormattedPrice());
                            ret.put("priceCurrencyCode", phases.get(0).getPriceCurrencyCode());
                        }
                    }
                    call.resolve(ret);
                } else {
                    JSObject ret = new JSObject();
                    ret.put("found", false);
                    ret.put("productId", productId);
                    ret.put("responseCode", billingResult.getResponseCode());
                    ret.put("debugMessage", billingResult.getDebugMessage());
                    call.resolve(ret);
                }
            });
        }, call);
    }

    @PluginMethod
    public void purchaseSubscription(final PluginCall call) {
        final String productId = call.getString("productId", DEFAULT_SUBSCRIPTION_ID);
        final String preferredBasePlanId = call.getString("basePlanId", "");

        ensureConnected(() -> {
            QueryProductDetailsParams subsParams = QueryProductDetailsParams.newBuilder()
                .setProductList(
                    Collections.singletonList(
                        QueryProductDetailsParams.Product.newBuilder()
                            .setProductId(productId)
                            .setProductType(BillingClient.ProductType.SUBS)
                            .build()
                    )
                )
                .build();

            billingClient.queryProductDetailsAsync(subsParams, (billingResult, productDetailsList) -> {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK
                        && productDetailsList != null
                        && !productDetailsList.isEmpty()) {
                    launchSubscriptionFlow(call, productDetailsList.get(0), preferredBasePlanId);
                } else {
                    // Fallback: check if configured as INAPP product in Play Console
                    QueryProductDetailsParams inappParams = QueryProductDetailsParams.newBuilder()
                        .setProductList(
                            Collections.singletonList(
                                QueryProductDetailsParams.Product.newBuilder()
                                    .setProductId(productId)
                                    .setProductType(BillingClient.ProductType.INAPP)
                                    .build()
                            )
                        )
                        .build();

                    billingClient.queryProductDetailsAsync(inappParams, (inappResult, inappList) -> {
                        if (inappResult.getResponseCode() == BillingClient.BillingResponseCode.OK
                                && inappList != null
                                && !inappList.isEmpty()) {
                            launchInAppFlow(call, inappList.get(0));
                        } else {
                            call.reject(
                                "Subscription '" + productId + "' was not found in Google Play Console. " +
                                "Ensure you have created and activated a Subscription with Product ID '" + productId + "' in Play Console > Monetize > Subscriptions."
                            );
                        }
                    });
                }
            });
        }, call);
    }

    private void launchSubscriptionFlow(
        final PluginCall call,
        final ProductDetails productDetails,
        final String preferredBasePlanId
    ) {
        List<ProductDetails.SubscriptionOfferDetails> offers = productDetails.getSubscriptionOfferDetails();
        if (offers == null || offers.isEmpty()) {
            call.reject("No active base plan or offer found for subscription '" + productDetails.getProductId() + "'.");
            return;
        }

        ProductDetails.SubscriptionOfferDetails selectedOffer = offers.get(0);
        if (preferredBasePlanId != null && !preferredBasePlanId.isEmpty()) {
            for (ProductDetails.SubscriptionOfferDetails offer : offers) {
                if (preferredBasePlanId.equalsIgnoreCase(offer.getBasePlanId())) {
                    selectedOffer = offer;
                    break;
                }
            }
        }

        final String offerToken = selectedOffer.getOfferToken();
        final Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity unavailable to launch Google Play Billing flow.");
            return;
        }

        pendingPurchaseCall = call;

        activity.runOnUiThread(() -> {
            List<BillingFlowParams.ProductDetailsParams> productDetailsParamsList = Collections.singletonList(
                BillingFlowParams.ProductDetailsParams.newBuilder()
                    .setProductDetails(productDetails)
                    .setOfferToken(offerToken)
                    .build()
            );

            BillingFlowParams billingFlowParams = BillingFlowParams.newBuilder()
                .setProductDetailsParamsList(productDetailsParamsList)
                .build();

            BillingResult result = billingClient.launchBillingFlow(activity, billingFlowParams);
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                pendingPurchaseCall = null;
                call.reject("Failed to launch Google Play Billing (" + result.getResponseCode() + "): " + result.getDebugMessage());
            }
        });
    }

    private void launchInAppFlow(final PluginCall call, final ProductDetails productDetails) {
        final Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity unavailable to launch Google Play Billing flow.");
            return;
        }

        pendingPurchaseCall = call;

        activity.runOnUiThread(() -> {
            List<BillingFlowParams.ProductDetailsParams> productDetailsParamsList = Collections.singletonList(
                BillingFlowParams.ProductDetailsParams.newBuilder()
                    .setProductDetails(productDetails)
                    .build()
            );

            BillingFlowParams billingFlowParams = BillingFlowParams.newBuilder()
                .setProductDetailsParamsList(productDetailsParamsList)
                .build();

            BillingResult result = billingClient.launchBillingFlow(activity, billingFlowParams);
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                pendingPurchaseCall = null;
                call.reject("Failed to launch Google Play Billing (" + result.getResponseCode() + "): " + result.getDebugMessage());
            }
        });
    }

    @Override
    public void onPurchasesUpdated(@NonNull BillingResult billingResult, @Nullable List<Purchase> purchases) {
        if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK && purchases != null && !purchases.isEmpty()) {
            for (Purchase purchase : purchases) {
                handleVerifiedPurchase(purchase);
            }
        } else if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED) {
            if (pendingPurchaseCall != null) {
                pendingPurchaseCall.reject("Purchase cancelled by user.");
                pendingPurchaseCall = null;
            }
        } else {
            if (pendingPurchaseCall != null) {
                pendingPurchaseCall.reject("Google Play purchase failed (" + billingResult.getResponseCode() + "): " + billingResult.getDebugMessage());
                pendingPurchaseCall = null;
            }
        }
    }

    private void handleVerifiedPurchase(@NonNull final Purchase purchase) {
        if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
            if (!purchase.isAcknowledged()) {
                AcknowledgePurchaseParams acknowledgePurchaseParams = AcknowledgePurchaseParams.newBuilder()
                    .setPurchaseToken(purchase.getPurchaseToken())
                    .build();

                billingClient.acknowledgePurchase(acknowledgePurchaseParams, billingResult -> {
                    Log.d(TAG, "Purchase acknowledged: " + billingResult.getResponseCode());
                    resolvePendingPurchase(purchase);
                });
            } else {
                resolvePendingPurchase(purchase);
            }
        } else if (purchase.getPurchaseState() == Purchase.PurchaseState.PENDING) {
            if (pendingPurchaseCall != null) {
                pendingPurchaseCall.reject("Payment is pending confirmation in Google Play.");
                pendingPurchaseCall = null;
            }
        }
    }

    private void resolvePendingPurchase(@NonNull final Purchase purchase) {
        if (pendingPurchaseCall != null) {
            JSObject ret = new JSObject();
            ret.put("purchased", true);
            ret.put("purchaseToken", purchase.getPurchaseToken());
            ret.put("orderId", purchase.getOrderId());
            List<String> products = purchase.getProducts();
            ret.put("productId", products != null && !products.isEmpty() ? products.get(0) : DEFAULT_SUBSCRIPTION_ID);
            pendingPurchaseCall.resolve(ret);
            pendingPurchaseCall = null;
        }
    }

    @PluginMethod
    public void restorePurchases(final PluginCall call) {
        ensureConnected(() -> {
            QueryPurchasesParams params = QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.SUBS)
                .build();

            billingClient.queryPurchasesAsync(params, (billingResult, purchasesList) -> {
                boolean hasActiveSub = false;
                String activeToken = "";
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK && purchasesList != null) {
                    for (Purchase purchase : purchasesList) {
                        if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                            hasActiveSub = true;
                            activeToken = purchase.getPurchaseToken();
                            break;
                        }
                    }
                }
                JSObject ret = new JSObject();
                ret.put("hasActiveSubscription", hasActiveSub);
                ret.put("purchaseToken", activeToken);
                call.resolve(ret);
            });
        }, call);
    }
}
