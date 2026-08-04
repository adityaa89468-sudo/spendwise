import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Wifi, 
  Pizza, 
  Sparkles, 
  ShieldCheck, 
  Megaphone, 
  ExternalLink 
} from 'lucide-react';

interface AdItem {
  id: number;
  title: string;
  body: string;
  actionText: string;
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
    icon: ShieldCheck,
    badgeColor: "bg-emerald-100 text-emerald-650 dark:bg-emerald-950/30 dark:text-emerald-400",
    textColor: "text-emerald-655 dark:text-emerald-400",
    bgColor: "from-emerald-50/30 to-teal-50/30 dark:from-emerald-950/5 dark:to-teal-950/5"
  },
  {
    id: 5,
    title: "Auto UPI QR Reminders",
    body: "Let SpendWise ping lazy roommates automatically. Enable direct WhatsApp links.",
    actionText: "Learn More",
    icon: Megaphone,
    badgeColor: "bg-amber-100 text-amber-650 dark:bg-amber-950/30 dark:text-amber-400",
    textColor: "text-amber-650 dark:text-amber-400",
    bgColor: "from-amber-50/30 to-orange-50/30 dark:from-amber-950/5 dark:to-orange-950/5"
  }
];

export const BannerAd: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!isVisible) return;
    
    // Rotate every 12 seconds
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ADS_DATA.length);
    }, 12000);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  const currentAd = ADS_DATA[currentIndex];
  const IconComponent = currentAd.icon;

  return (
    <div className="w-full px-1">
      <div className={`relative overflow-hidden bg-gradient-to-r ${currentAd.bgColor} backdrop-blur-md rounded-2xl border border-slate-100/80 dark:border-slate-800/60 p-3 flex items-center justify-between gap-4 shadow-sm group hover:border-indigo-100 dark:hover:border-slate-700/80 transition-all duration-300`}>
        
        {/* Left Side: Badge, Icon and Text */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Subtle animated status ping */}
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

        {/* Right Side: CTA Button and Dismiss Close */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="#sponsored-action"
            onClick={(e) => {
              e.preventDefault();
              // Gentle notification for demo purposes
              alert(`Thank you for supporting SpendWise! This opens the sponsor portal: "${currentAd.title}"`);
            }}
            className="px-3 py-1.5 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-150/40 dark:border-slate-750 text-slate-700 dark:text-slate-300 rounded-xl text-[9.5px] md:text-3xs font-extrabold uppercase tracking-wider flex items-center gap-1 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <span>{currentAd.actionText}</span>
            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
          </a>

          <button
            onClick={() => setIsVisible(false)}
            aria-label="Dismiss Advertisement"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-3 h-3 shrink-0" />
          </button>
        </div>

      </div>
    </div>
  );
};
