import React, { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { 
  AdMob, 
  BannerAdPluginEvents, 
  AdMobBannerSize 
} from '@capacitor-community/admob';
import { 
  X, 
  Wifi, 
  Pizza, 
  Sparkles, 
  ShieldCheck, 
  Megaphone, 
  ExternalLink,
  Crown
} from 'lucide-react';
import { BANNER_AD_UNIT_ID, showBanner, removeBanner } from '../services/adService';
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
    bgColor: "from-orange-50/30 to-rose-50/30 dark:from-orange-950/5 dark:to-rose-950/5"
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
    bgColor: "from-red-50/30 to-rose-50/30 dark:from-red-950/5 dark:to-rose-950/5"
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
    bgColor: "from-indigo-50/30 to-sky-50/30 dark:from-indigo-950/5 dark:to-sky-950/5"
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
    bgColor: "from-emerald-50/30 to-teal-50/30 dark:from-emerald-950/5 dark:to-teal-950/5"
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
    bgColor: "from-amber-50/30 to-orange-50/30 dark:from-amber-950/5 dark:to-orange-950/5"
  }
];

interface BannerAdProps {
  onOpenPremiumModal?: () => void;
}

export const BannerAd: React.FC<BannerAdProps> = ({ onOpenPremiumModal }) => {
  const { isRoomPremium } = useRoom();
  const isNative = Capacitor.isNativePlatform();
  const slotRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [nativeBannerHeight, setNativeBannerHeight] = useState<number>(60);
  const [nativeAdLoaded, setNativeAdLoaded] = useState<boolean>(false);

  // Mount and align real Google AdMob Banner (ca-app-pub-9364231981895017/6262161138) into this slot on Android APK
  // If the current room has active Room Premium (₹59/mo), immediately remove any native banner and hide ads for all room members
  useEffect(() => {
    if (isRoomPremium) {
      setNativeAdLoaded(false);
      removeBanner();
      return;
    }

    if (!isNative || !isVisible) return;

    let loadedListener: any;
    let sizeListener: any;
    let failedListener: any;

    const mountNativeBannerInSlot = async () => {
      try {
        loadedListener = await AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
          setNativeAdLoaded(true);
        });

        sizeListener = await AdMob.addListener(
          BannerAdPluginEvents.SizeChanged,
          (info: AdMobBannerSize) => {
            if (info && info.height > 0) {
              setNativeBannerHeight(info.height);
            }
          }
        );

        failedListener = await AdMob.addListener(BannerAdPluginEvents.FailedToLoad, () => {
          setNativeAdLoaded(false);
        });

        // Calculate top offset of the BannerAd slot in dp
        const rect = slotRef.current?.getBoundingClientRect();
        const topDp = rect ? Math.max(0, Math.round(rect.top)) : undefined;
        await showBanner(topDp);
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
  }, [isNative, isVisible, isRoomPremium]);

  // Rotate fallback promotional cards on Web or while native AdMob ad is loading
  useEffect(() => {
    if (!isVisible || isRoomPremium || (isNative && nativeAdLoaded)) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ADS_DATA.length);
    }, 12000);

    return () => clearInterval(interval);
  }, [isVisible, isNative, nativeAdLoaded, isRoomPremium]);

  // Hide all ads completely for every member in a Premium Room
  if (isRoomPremium || !isVisible) return null;

  // On Native Android when the real AdMob Banner (ca-app-pub-9364231981895017/6262161138) is loaded,
  // render the dedicated AdMob slot container matching the native AdView height
  if (isNative && nativeAdLoaded) {
    return (
      <div className="w-full px-1 space-y-1.5">
        <div
          ref={slotRef}
          data-ad-unit-id={BANNER_AD_UNIT_ID}
          style={{ minHeight: `${nativeBannerHeight}px` }}
          className="w-full flex items-center justify-center rounded-2xl border border-slate-100/60 dark:border-slate-800/50 bg-slate-50/40 dark:bg-slate-900/40"
        />
        {onOpenPremiumModal && (
          <div className="flex justify-end px-1">
            <button
              onClick={onOpenPremiumModal}
              className="text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Crown className="w-2.5 h-2.5" />
              <span>Remove Ads for Entire Room • ₹59/mo</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  const currentAd = ADS_DATA[currentIndex];
  const IconComponent = currentAd.icon;

  const handleAdClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentAd.url) {
      window.open(currentAd.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div ref={slotRef} data-ad-unit-id={BANNER_AD_UNIT_ID} className="w-full px-1 space-y-1.5">
      <div className={`relative overflow-hidden bg-gradient-to-r ${currentAd.bgColor} backdrop-blur-md rounded-2xl border border-slate-100/80 dark:border-slate-800/60 p-3 flex items-center justify-between gap-4 shadow-sm group hover:border-indigo-100 dark:hover:border-slate-700/80 transition-all duration-300`}>
        
        {/* Left Side: Badge, Icon and Text */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative shrink-0 flex items-center justify-center w-8 h-8 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100/50 dark:border-slate-800/50">
            <IconComponent className={`w-4 h-4 ${currentAd.textColor}`} />
          </div>

          <div className="min-w-0 flex-1 text-left">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[7.5px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-slate-200/50 text-slate-500 dark:bg-slate-800 dark:text-slate-450 select-none">
                Sponsored Ad
              </span>
              <h5 className="font-black text-slate-800 dark:text-white text-3xs md:text-2xs uppercase tracking-wider truncate">
                {currentAd.title}
              </h5>
            </div>
            <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5 leading-tight">
              {currentAd.body}
            </p>
          </div>
        </div>

        {/* Right Side: CTA Button, Remove Ads CTA, and Dismiss Close */}
        <div className="flex items-center gap-2 shrink-0">
          {onOpenPremiumModal && (
            <button
              onClick={onOpenPremiumModal}
              className="hidden sm:flex px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-xl text-[9px] font-extrabold uppercase tracking-wider items-center gap-1 transition-all cursor-pointer active:scale-95"
              title="Remove ads for all roommates in this room for ₹59/month"
            >
              <Crown className="w-3 h-3 shrink-0" />
              <span>Ad-Free ₹59</span>
            </button>
          )}

          <a
            href={currentAd.url}
            onClick={handleAdClick}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-150/40 dark:border-slate-750 text-slate-700 dark:text-slate-300 rounded-xl text-[9.5px] md:text-3xs font-extrabold uppercase tracking-wider flex items-center gap-1 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <span>{currentAd.actionText}</span>
            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
          </a>

          <button
            onClick={() => {
              setIsVisible(false);
              removeBanner();
            }}
            aria-label="Dismiss Advertisement"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-3 h-3 shrink-0" />
          </button>
        </div>

      </div>
      {onOpenPremiumModal && (
        <div className="flex sm:hidden justify-end px-1">
          <button
            onClick={onOpenPremiumModal}
            className="text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Crown className="w-2.5 h-2.5" />
            <span>Remove Ads for All Roommates • ₹59/mo</span>
          </button>
        </div>
      )}
    </div>
  );
};
