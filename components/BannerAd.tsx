import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { 
  AdMob, 
  BannerAdPluginEvents, 
  AdMobBannerSize 
} from '@capacitor-community/admob';
import { 
  Wifi, 
  Pizza, 
  Sparkles, 
  ShieldCheck, 
  Megaphone, 
  ExternalLink,
  Crown
} from 'lucide-react';
import {
  BANNER_AD_UNIT_ID,
  showBanner,
  removeBanner,
  syncNativeBannerSlot
} from '../services/adService';
import { useRoom } from '../context/RoomContext';

interface AdItem {
  id: number;
  title: string;
  body: string;
  actionText: string;
  url: string;
  icon: React.ComponentType<any>;
  badgeColor: string;
  textColor: string;
  bgColor: string;
}

const ADS_DATA: AdItem[] = [
  {
    id: 1,
    title: "Domino's Roommate Combo",
    body: "Get 2 Medium Pizzas + Pepsi for ₹399. Split with roommates instantly!",
    actionText: "Order Pizza",
    url: "https://www.dominos.co.in",
    icon: Pizza,
    badgeColor: "bg-orange-100 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400",
    textColor: "text-orange-600 dark:text-orange-450",
    bgColor: "from-orange-50/40 to-rose-50/40 dark:from-orange-950/15 dark:to-rose-950/15"
  },
  {
    id: 2,
    title: "Airtel Xstream Room Plan",
    body: "WiFi with unlimited data starting at ₹499/mo. Check coverage in your sector.",
    actionText: "Check Coverage",
    url: "https://www.airtel.in/xstream-fiber",
    icon: Wifi,
    badgeColor: "bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400",
    textColor: "text-red-600 dark:text-red-450",
    bgColor: "from-red-50/40 to-rose-50/40 dark:from-red-950/15 dark:to-rose-950/15"
  },
  {
    id: 3,
    title: "ChoreWise Smart Addon",
    body: "Tired of chore cleaning arguments? Automate roommates duties smoothly.",
    actionText: "Install Free",
    url: "https://play.google.com/store/search?q=chores+flatmate&c=apps",
    icon: Sparkles,
    badgeColor: "bg-indigo-100 text-indigo-650 dark:bg-indigo-950/30 dark:text-indigo-400",
    textColor: "text-indigo-650 dark:text-indigo-400",
    bgColor: "from-indigo-50/40 to-sky-50/40 dark:from-indigo-950/15 dark:to-sky-950/15"
  },
  {
    id: 4,
    title: "NestSecure Rent Shield",
    body: "Keep security deposits protected from unexpected roommates breakages. Starts at ₹99.",
    actionText: "Secure Flat",
    url: "https://play.google.com/store/apps/details?id=com.adityaproductionspendwise.app",
    icon: ShieldCheck,
    badgeColor: "bg-emerald-100 text-emerald-650 dark:bg-emerald-950/30 dark:text-emerald-400",
    textColor: "text-emerald-655 dark:text-emerald-400",
    bgColor: "from-emerald-50/40 to-teal-50/40 dark:from-emerald-950/15 dark:to-teal-950/15"
  },
  {
    id: 5,
    title: "Auto UPI QR Reminders",
    body: "Let Flat Hisab ping lazy roommates automatically. Enable direct WhatsApp links.",
    actionText: "Learn More",
    url: "https://play.google.com/store/apps/details?id=com.adityaproductionspendwise.app",
    icon: Megaphone,
    badgeColor: "bg-amber-100 text-amber-650 dark:bg-amber-950/30 dark:text-amber-400",
    textColor: "text-amber-650 dark:text-amber-400",
    bgColor: "from-amber-50/40 to-orange-50/40 dark:from-amber-950/15 dark:to-orange-950/15"
  }
];

interface BannerAdProps {
  onOpenPremiumModal?: () => void;
  isOverlayOpen?: boolean;
}

export const BannerAd: React.FC<BannerAdProps> = ({ onOpenPremiumModal, isOverlayOpen = false }) => {
  const { isRoomPremium } = useRoom();
  const isNative = Capacitor.isNativePlatform();
  const slotRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nativeBannerHeight, setNativeBannerHeight] = useState<number>(60);
  const [nativeAdLoaded, setNativeAdLoaded] = useState<boolean>(false);

  // Sync the inline DOM slot coordinates with the native Android AdView so it stays inside the slot and never floats
  const syncSlotCoordinates = useCallback(() => {
    if (!isNative) return;

    if (isRoomPremium || isOverlayOpen || !slotRef.current) {
      syncNativeBannerSlot({
        visible: false,
        viewportTop: -10000,
        width: 0,
        height: 0,
        safeTop: 0,
        safeBottom: 0,
      });
      return;
    }

    const rect = slotRef.current.getBoundingClientRect();
    const headerEl = document.querySelector('header');
    const bottomNavEl = document.getElementById('bottom-nav-bar');

    const safeTop = headerEl ? Math.max(0, headerEl.getBoundingClientRect().bottom) : 0;
    const safeBottom = bottomNavEl
      ? Math.min(window.innerHeight, bottomNavEl.getBoundingClientRect().top - 4)
      : window.innerHeight;

    const isSlotInViewport =
      rect.width > 0 &&
      rect.height > 0 &&
      rect.bottom > safeTop &&
      rect.top < safeBottom;

    syncNativeBannerSlot({
      visible: isSlotInViewport,
      viewportTop: rect.top,
      width: rect.width,
      height: Math.max(56, nativeBannerHeight, rect.height),
      safeTop,
      safeBottom,
    });
  }, [isNative, isRoomPremium, isOverlayOpen, nativeBannerHeight]);

  useEffect(() => {
    if (isRoomPremium || isOverlayOpen) {
      setNativeAdLoaded(false);
      removeBanner();
      return;
    }

    if (!isNative) return;

    let loadedListener: any;
    let sizeListener: any;
    let failedListener: any;

    const mountNativeBannerInSlot = async () => {
      try {
        // Sync slot coordinates before showing so the native view is already anchored to the slot
        syncSlotCoordinates();

        loadedListener = await AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
          setNativeAdLoaded(true);
          syncSlotCoordinates();
        });

        sizeListener = await AdMob.addListener(
          BannerAdPluginEvents.SizeChanged,
          (info: AdMobBannerSize) => {
            if (info && info.height > 0) {
              setNativeBannerHeight(info.height);
            }
            syncSlotCoordinates();
          }
        );

        failedListener = await AdMob.addListener(BannerAdPluginEvents.FailedToLoad, () => {
          setNativeAdLoaded(false);
        });

        await showBanner();
        syncSlotCoordinates();
      } catch (err) {
        console.error('AdMob slot banner mount error:', err);
      }
    };

    mountNativeBannerInSlot();

    return () => {
      if (loadedListener) loadedListener.remove();
      if (sizeListener) sizeListener.remove();
      if (failedListener) failedListener.remove();
      removeBanner();
    };
  }, [isNative, isRoomPremium, isOverlayOpen, syncSlotCoordinates]);

  // Keep native AdView locked to the inline slot on scroll, resize, or layout shifts
  useEffect(() => {
    if (!isNative || isRoomPremium || isOverlayOpen) return;

    let rafId: number | null = null;
    const onScrollOrResize = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        syncSlotCoordinates();
      });
    };

    window.addEventListener('scroll', onScrollOrResize, { passive: true, capture: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(onScrollOrResize);
      if (slotRef.current) resizeObserver.observe(slotRef.current);
      resizeObserver.observe(document.body);
    }

    syncSlotCoordinates();

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScrollOrResize, { capture: true } as any);
      window.removeEventListener('resize', onScrollOrResize);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [isNative, isRoomPremium, isOverlayOpen, syncSlotCoordinates]);

  useEffect(() => {
    if (isRoomPremium || isOverlayOpen || (isNative && nativeAdLoaded)) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ADS_DATA.length);
    }, 12000);

    return () => clearInterval(interval);
  }, [isNative, nativeAdLoaded, isRoomPremium, isOverlayOpen]);

  if (isRoomPremium || isOverlayOpen) return null;

  const currentAd = ADS_DATA[currentIndex];
  const IconComponent = currentAd.icon;

  return (
    <div className="w-full rounded-2xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 p-2.5 space-y-2 shadow-sm">
      {/* Ad Slot Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
          Sponsored Ad Slot
        </span>
        {onOpenPremiumModal && (
          <button
            onClick={onOpenPremiumModal}
            className="text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Crown className="w-2.5 h-2.5" />
            <span>Remove Ads for Entire Room • ₹59/mo</span>
          </button>
        )}
      </div>

      {/* Inline Banner Ad Slot Container (Non-Floating) */}
      <div
        ref={slotRef}
        data-ad-unit-id={BANNER_AD_UNIT_ID}
        style={isNative && nativeAdLoaded ? { height: `${Math.max(56, nativeBannerHeight)}px` } : undefined}
        className="w-full overflow-hidden rounded-xl"
      >
        {!(isNative && nativeAdLoaded) && (
          <div className={`relative overflow-hidden bg-gradient-to-r ${currentAd.bgColor} rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-3 flex items-center justify-between gap-3 transition-all duration-300`}>
            {/* Left Side: Icon and Text */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative shrink-0 flex items-center justify-center w-8 h-8 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100/50 dark:border-slate-800/50">
                <IconComponent className={`w-4 h-4 ${currentAd.textColor}`} />
              </div>

              <div className="min-w-0 flex-1 text-left">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[7.5px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-600 dark:bg-slate-800 dark:text-slate-400 select-none">
                    Ad
                  </span>
                  <h5 className="font-black text-slate-800 dark:text-white text-[10px] md:text-xs uppercase tracking-wider truncate">
                    {currentAd.title}
                  </h5>
                </div>
                <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5 leading-tight">
                  {currentAd.body}
                </p>
              </div>
            </div>

            {/* Right Side: CTA Button */}
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={currentAd.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200/70 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-[9.5px] font-extrabold uppercase tracking-wider flex items-center gap-1 transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <span>{currentAd.actionText}</span>
                <ExternalLink className="w-2.5 h-2.5 shrink-0" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

