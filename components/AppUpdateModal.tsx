import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DownloadCloud, 
  Sparkles, 
  ShieldCheck, 
  X, 
  ExternalLink, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle,
  Zap,
  ArrowRight
} from 'lucide-react';
import { AppUpdateInfo } from '../types';
import { openPlayStore, snoozeUpdate } from '../services/appUpdateService';
import { SpendWiseLogo } from './SpendWiseLogo';

interface AppUpdateModalProps {
  isOpen: boolean;
  updateInfo: AppUpdateInfo | null;
  onClose: () => void;
  darkMode?: boolean;
}

export const AppUpdateModal: React.FC<AppUpdateModalProps> = ({
  isOpen,
  updateInfo,
  onClose,
  darkMode = true
}) => {
  const [isOpeningStore, setIsOpeningStore] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  if (!isOpen || !updateInfo) return null;

  const handleUpdate = () => {
    setIsOpeningStore(true);
    setTimeout(() => {
      openPlayStore(updateInfo.playStoreUrl);
      setIsOpeningStore(false);
    }, 400);
  };

  const handleSnooze = () => {
    snoozeUpdate(updateInfo.latestVersion);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto"
        >
          {/* Header Graphic Banner */}
          <div className="relative bg-gradient-to-br from-emerald-600 via-teal-600 to-indigo-700 p-6 text-white overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute left-1/2 -top-10 w-40 h-40 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />

            {/* Top Bar with Play Store Badge & Close Button */}
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold text-white tracking-wide">
                <svg className="w-3.5 h-3.5 fill-current text-emerald-300" viewBox="0 0 24 24">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L18.81,13.12C19.43,12.5 19.43,11.5 18.81,10.88L16.81,8.88L14.81,10.88L12.81,12.88M4.27,1.28L15.27,12.28L4.27,23.28C4.09,23.46 3.85,23.56 3.6,23.56C3.35,23.56 3.11,23.46 2.93,23.28C2.56,22.91 2.56,22.31 2.93,21.94L12.87,12L2.93,2.06C2.56,1.69 2.56,1.09 2.93,0.72C3.3,0.35 3.9,0.35 4.27,0.72" />
                </svg>
                Google Play Store
              </div>

              {!updateInfo.forceUpdate && (
                <button
                  onClick={handleSnooze}
                  className="p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white/80 hover:text-white transition-colors"
                  title="Close popup"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* App Icon & Title */}
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 p-2.5 shadow-xl border border-white/20 flex items-center justify-center shrink-0">
                <SpendWiseLogo variant="icon" className="w-full h-full text-white" darkMode={true} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white leading-tight">
                  Update Available!
                </h3>
                <p className="text-xs text-emerald-100 font-medium mt-0.5">
                  Spendwise Co-Living Ledger
                </p>
              </div>
            </div>
          </div>

          {/* Modal Content */}
          <div className="p-6 space-y-5">
            {/* Version Badge Bar */}
            <div className="flex items-center justify-between p-3.5 bg-slate-100 dark:bg-slate-800/70 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Current:</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">v{updateInfo.currentVersion}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Latest:</span>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                  v{updateInfo.latestVersion}
                </span>
              </div>
            </div>

            {/* Mandatory Warning Banner if forceUpdate is true */}
            {updateInfo.forceUpdate && (
              <div className="flex items-start gap-3 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-600 dark:text-rose-400">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-xs font-medium leading-relaxed">
                  <span className="font-bold">Required Update:</span> This release includes critical database and settlement security enhancements. Please update to continue using Spendwise.
                </div>
              </div>
            )}

            {/* What's New List */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  What's New in v{updateInfo.latestVersion}
                </h4>
                {updateInfo.downloadSize && (
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    {updateInfo.downloadSize}
                  </span>
                )}
              </div>

              <ul className="space-y-2">
                {updateInfo.releaseNotes.map((note, idx) => (
                  <motion.li 
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * idx }}
                    className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{note}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* App Package Info metadata */}
            <div className="pt-1 text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between font-mono">
              <span className="truncate">pkg: com.adityaproductionspendwise.app</span>
              {updateInfo.releaseDate && (
                <span className="shrink-0">{updateInfo.releaseDate}</span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleUpdate}
                disabled={isOpeningStore}
                className="w-full relative py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {isOpeningStore ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Opening Play Store...</span>
                  </>
                ) : (
                  <>
                    <DownloadCloud className="w-4 h-4" />
                    <span>Update from Play Store</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-70 ml-1" />
                  </>
                )}
              </button>

              {!updateInfo.forceUpdate && (
                <button
                  onClick={handleSnooze}
                  className="w-full py-2.5 px-4 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs rounded-xl transition-colors"
                >
                  Remind Me Later
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
