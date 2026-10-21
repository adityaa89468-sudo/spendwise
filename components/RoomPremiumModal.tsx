import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Crown, 
  X, 
  ShieldCheck, 
  Sparkles, 
  Users, 
  CheckCircle2, 
  Smartphone,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Group } from '../types';
import {
  ROOM_PREMIUM_PRODUCT_ID,
  ROOM_PREMIUM_BASE_PLAN_ID,
  queryRoomPremiumSubscription,
  purchaseRoomPremiumWithGooglePlay,
  restoreRoomPremiumFromGooglePlay,
  PlaySubscriptionDetails
} from '../services/billingService';

interface RoomPremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGroup: Group | null;
  isRoomPremium: boolean;
  onPurchaseSuccess: () => Promise<void>;
  onSplitPremiumWithRoommates?: () => Promise<void>;
}

export const RoomPremiumModal: React.FC<RoomPremiumModalProps> = ({
  isOpen,
  onClose,
  currentGroup,
  isRoomPremium,
  onPurchaseSuccess,
  onSplitPremiumWithRoommates
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [autoSplitExpense, setAutoSplitExpense] = useState(true);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [productDetails, setProductDetails] = useState<PlaySubscriptionDetails | null>(null);

  useEffect(() => {
    if (isOpen && !isRoomPremium) {
      setBillingError(null);
      queryRoomPremiumSubscription()
        .then((details) => setProductDetails(details))
        .catch(() => {});
    }
  }, [isOpen, isRoomPremium]);

  if (!isOpen || !currentGroup) return null;

  const memberCount = Math.max(1, currentGroup.members?.length || 1);
  const perMemberCost = Math.ceil(59 / memberCount);
  const displayPrice = productDetails?.formattedPrice || '₹59';

  const handleCompletePurchase = async () => {
    setIsProcessing(true);
    setBillingError(null);
    try {
      const result = await purchaseRoomPremiumWithGooglePlay();
      if (result.purchased) {
        await onPurchaseSuccess();
        if (autoSplitExpense && onSplitPremiumWithRoommates && memberCount > 1) {
          await onSplitPremiumWithRoommates();
        }
        setShowSuccessScreen(true);
      }
    } catch (err: any) {
      const msg = err?.message || 'Google Play Billing checkout could not be completed.';
      console.error('Failed to activate Room Premium:', err);
      setBillingError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestoreSubscription = async () => {
    setIsRestoring(true);
    setBillingError(null);
    try {
      const res = await restoreRoomPremiumFromGooglePlay();
      if (res.hasActiveSubscription) {
        await onPurchaseSuccess();
        setShowSuccessScreen(true);
      } else {
        setBillingError('No active Room Premium subscription found on your Google Play account.');
      }
    } catch (err: any) {
      setBillingError(err?.message || 'Unable to check existing Google Play subscriptions.');
    } finally {
      setIsRestoring(false);
    }
  };

  const formattedExpiry = currentGroup.premiumUntil
    ? new Date(currentGroup.premiumUntil).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[2rem] shadow-2xl overflow-hidden text-left"
        >
          {/* Top Gradient Header */}
          <div className="relative bg-gradient-to-br from-amber-500 via-orange-500 to-indigo-600 p-6 text-white overflow-hidden">
            <div className="absolute -right-10 -top-10 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none" />

            <button
              onClick={() => {
                setShowSuccessScreen(false);
                setBillingError(null);
                onClose();
              }}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/30 text-white transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                <Crown className="w-5 h-5 text-amber-200" />
              </div>
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest bg-black/25 px-2.5 py-0.5 rounded-full">
                  Shared Room Pass
                </span>
                <h3 className="text-lg font-black tracking-tight mt-0.5">
                  Flat Hisab Room Premium
                </h3>
              </div>
            </div>

            <p className="text-xs text-white/90 font-medium leading-relaxed">
              1 roommate upgrades → <strong>Every roommate in "{currentGroup.name}"</strong> gets 100% Ad-Free access!
            </p>
          </div>

          <div className="p-6 space-y-5">
            {showSuccessScreen || isRoomPremium ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                    ● AD-FREE ROOM ACTIVE
                  </span>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white">
                    {currentGroup.name} is Ad-Free!
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                    All Banner Ads, App Open Ads, and Interstitial Ads are disabled for all {memberCount} roommates in this room.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Activated By</span>
                    <span className="font-extrabold text-slate-800 dark:text-white">
                      {currentGroup.premiumPurchasedByName || 'Roommate'}
                    </span>
                  </div>
                  {formattedExpiry && (
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold">Valid Until</span>
                      <span className="font-extrabold text-amber-600 dark:text-amber-400">
                        {formattedExpiry}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Roommates Covered</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                      All {memberCount} Members
                    </span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Note: Ad-free status applies exclusively to <strong>{currentGroup.name}</strong>. Ads resume if you log out or switch to a free-tier room.
                </p>

                <button
                  onClick={() => {
                    setShowSuccessScreen(false);
                    setBillingError(null);
                    onClose();
                  }}
                  className="w-full py-3.5 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-widest cursor-pointer"
                >
                  Back to Room Dashboard
                </button>
              </div>
            ) : (
              <>
                {/* Price Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50/60 dark:from-amber-950/25 dark:to-orange-950/15 border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400 block">
                      30-Day Room Pass
                    </span>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-2xl font-black text-slate-900 dark:text-white">{displayPrice}</span>
                      <span className="text-xs font-bold text-slate-500">/ month</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-black">
                      Only ~₹{perMemberCost}/roommate
                    </span>
                    <span className="block text-[9px] text-slate-400 font-bold mt-1">
                      Covers all {memberCount} members
                    </span>
                  </div>
                </div>

                {/* Benefits List */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-start gap-2.5">
                    <Users className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <p className="text-slate-700 dark:text-slate-300 font-bold">
                      <strong>1 Purchase = Whole Room Ad-Free:</strong> Every roommate joined in "{currentGroup.name}" sees zero ads immediately.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-slate-700 dark:text-slate-300 font-bold">
                      <strong>Removes All Ads:</strong> Disables App Open ads, Banner ads, and Split Bill Interstitial ads.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-slate-700 dark:text-slate-300 font-bold">
                      <strong>Room-Scoped Protection:</strong> Active while inside this room (ads automatically resume if a user logs out or joins another free room).
                    </p>
                  </div>
                </div>

                {/* Auto-split ₹59 among roommates checkbox */}
                {memberCount > 1 && (
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoSplitExpense}
                      onChange={(e) => setAutoSplitExpense(e.target.checked)}
                      className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                    />
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Automatically split ₹59 equally among all {memberCount} roommates (₹{perMemberCost} each) in room ledger
                    </span>
                  </label>
                )}

                {billingError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/50 flex items-start gap-2 text-rose-600 dark:text-rose-400 text-[11px] font-bold">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p>{billingError}</p>
                      <p className="text-[10px] font-mono opacity-80">
                        Play Console Subscription ID: {ROOM_PREMIUM_PRODUCT_ID} (Base Plan: {ROOM_PREMIUM_BASE_PLAN_ID})
                      </p>
                    </div>
                  </div>
                )}

                {/* Google Play Billing Exclusive Checkout Action */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCompletePurchase}
                    disabled={isProcessing || isRestoring}
                    className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                  >
                    {isProcessing ? (
                      <span>Connecting to Google Play Billing...</span>
                    ) : (
                      <>
                        <Smartphone className="w-4 h-4" />
                        <span>Subscribe {displayPrice}/mo via Google Play</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between pt-1">
                    <p className="text-[10px] text-slate-400 font-semibold">
                      Secured by Google Play Billing • Product ID: <span className="font-mono">{ROOM_PREMIUM_PRODUCT_ID}</span>
                    </p>
                    <button
                      type="button"
                      onClick={handleRestoreSubscription}
                      disabled={isProcessing || isRestoring}
                      className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${isRestoring ? 'animate-spin' : ''}`} />
                      <span>Restore</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
