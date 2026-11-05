package com.adityaproductionspendwise.app;

import android.app.Activity;
import android.graphics.Rect;
import android.util.DisplayMetrics;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewTreeObserver;
import android.webkit.WebView;
import androidx.coordinatorlayout.widget.CoordinatorLayout;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AdSlot")
public class AdSlotPlugin extends Plugin {

    private View adContainerView = null;
    private boolean slotVisible = false;
    private float lastViewportTopPx = -10000f;
    private float slotWidthPx = 0f;
    private float slotHeightPx = 0f;
    private float safeTopPx = 0f;
    private float safeBottomPx = 10000f;
    private int scrollYAtLastSync = 0;
    private boolean listenersAttached = false;

    @Override
    public void load() {
        super.load();
        attachHierarchyAndScrollListeners();
    }

    private void attachHierarchyAndScrollListeners() {
        final Activity activity = getActivity();
        if (activity == null) return;

        activity.runOnUiThread(() -> {
            if (listenersAttached) return;
            try {
                ViewGroup contentRoot = activity.findViewById(android.R.id.content);
                if (contentRoot == null || contentRoot.getChildCount() == 0) return;

                View firstChild = contentRoot.getChildAt(0);
                if (!(firstChild instanceof ViewGroup)) return;

                final ViewGroup coordinator = (ViewGroup) firstChild;
                final WebView webView = getBridge() != null ? getBridge().getWebView() : null;

                // Intercept any AdMob banner container added to CoordinatorLayout so it never floats at BOTTOM_CENTER
                coordinator.setOnHierarchyChangeListener(new ViewGroup.OnHierarchyChangeListener() {
                    @Override
                    public void onChildViewAdded(View parent, View child) {
                        if (child != webView) {
                            adContainerView = child;
                            configureAdViewForInlineSlot(child);
                            updateAdViewPositionOnUiThread();
                        }
                    }

                    @Override
                    public void onChildViewRemoved(View parent, View child) {
                        if (child == adContainerView) {
                            adContainerView = null;
                        }
                    }
                });

                // Check if AdMob banner container is already present
                for (int i = 0; i < coordinator.getChildCount(); i++) {
                    View child = coordinator.getChildAt(i);
                    if (child != webView) {
                        adContainerView = child;
                        configureAdViewForInlineSlot(child);
                    }
                }

                if (webView != null) {
                    webView.getViewTreeObserver().addOnScrollChangedListener(new ViewTreeObserver.OnScrollChangedListener() {
                        @Override
                        public void onScrollChanged() {
                            updateAdViewPositionOnUiThread();
                        }
                    });
                }

                listenersAttached = true;
                updateAdViewPositionOnUiThread();
            } catch (Exception ignored) {
            }
        });
    }

    private void configureAdViewForInlineSlot(View view) {
        if (view == null) return;
        ViewGroup.LayoutParams params = view.getLayoutParams();
        if (params instanceof CoordinatorLayout.LayoutParams) {
            CoordinatorLayout.LayoutParams clp = (CoordinatorLayout.LayoutParams) params;
            clp.gravity = Gravity.TOP | Gravity.CENTER_HORIZONTAL;
            clp.setMargins(0, 0, 0, 0);
            view.setLayoutParams(clp);
        }
    }

    private View findAdContainerView() {
        if (adContainerView != null && adContainerView.getParent() != null) {
            return adContainerView;
        }
        Activity activity = getActivity();
        if (activity == null) return null;
        ViewGroup contentRoot = activity.findViewById(android.R.id.content);
        if (contentRoot == null || contentRoot.getChildCount() == 0) return null;
        View firstChild = contentRoot.getChildAt(0);
        if (!(firstChild instanceof ViewGroup)) return null;
        ViewGroup coordinator = (ViewGroup) firstChild;
        WebView webView = getBridge() != null ? getBridge().getWebView() : null;

        for (int i = 0; i < coordinator.getChildCount(); i++) {
            View child = coordinator.getChildAt(i);
            if (child != webView) {
                adContainerView = child;
                configureAdViewForInlineSlot(child);
                return adContainerView;
            }
        }
        return null;
    }

    private void updateAdViewPositionOnUiThread() {
        View target = findAdContainerView();
        if (target == null) return;

        if (!slotVisible) {
            target.setVisibility(View.GONE);
            return;
        }

        WebView webView = getBridge() != null ? getBridge().getWebView() : null;
        int currentScrollY = webView != null ? webView.getScrollY() : 0;
        int deltaScrollY = currentScrollY - scrollYAtLastSync;

        float currentTopPx = lastViewportTopPx - deltaScrollY;
        int adHeight = target.getHeight() > 0 ? target.getHeight() : Math.round(slotHeightPx);
        int adWidth = target.getWidth() > 0 ? target.getWidth() : Math.round(slotWidthPx);

        if (adHeight <= 0) {
            adHeight = 160;
        }
        if (adWidth <= 0 && webView != null) {
            adWidth = webView.getWidth();
        }

        int clipTop = Math.max(0, Math.round(safeTopPx - currentTopPx));
        int clipBottom = Math.min(adHeight, Math.round(safeBottomPx - currentTopPx));

        // Hide completely if the ad slot is scrolled outside the safe visible content area
        if (clipBottom <= clipTop || (clipBottom - clipTop) < 8) {
            target.setVisibility(View.GONE);
            return;
        }

        target.setVisibility(View.VISIBLE);
        target.setTranslationY(currentTopPx);

        if (clipTop > 0 || clipBottom < adHeight) {
            target.setClipBounds(new Rect(0, clipTop, Math.max(adWidth, 2000), clipBottom));
        } else {
            target.setClipBounds(null);
        }
    }

    @PluginMethod
    public void syncSlot(PluginCall call) {
        final Activity activity = getActivity();
        if (activity == null) {
            call.resolve();
            return;
        }

        final boolean visible = Boolean.TRUE.equals(call.getBoolean("visible", false));
        final float viewportTopDp = call.getFloat("viewportTop", -10000f);
        final float widthDp = call.getFloat("width", 0f);
        final float heightDp = call.getFloat("height", 60f);
        final float safeTopDp = call.getFloat("safeTop", 0f);
        final float safeBottomDp = call.getFloat("safeBottom", 10000f);

        DisplayMetrics metrics = activity.getResources().getDisplayMetrics();
        final float density = metrics.density;

        activity.runOnUiThread(() -> {
            if (!listenersAttached) {
                attachHierarchyAndScrollListeners();
            }
            WebView webView = getBridge() != null ? getBridge().getWebView() : null;
            scrollYAtLastSync = webView != null ? webView.getScrollY() : 0;

            slotVisible = visible;
            lastViewportTopPx = viewportTopDp * density;
            slotWidthPx = widthDp * density;
            slotHeightPx = heightDp * density;
            safeTopPx = safeTopDp * density;
            safeBottomPx = safeBottomDp * density;

            updateAdViewPositionOnUiThread();
            call.resolve();
        });
    }
}
