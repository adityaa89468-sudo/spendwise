import React, { useState, useEffect, useMemo } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useRoom } from '../context/RoomContext';
import { Campaign, CampaignParticipant } from '../types';
import {
  Flame,
  Trophy,
  Calendar,
  CheckCircle2,
  Sparkles,
  Gift,
  Users,
  Clock,
  ShieldCheck,
  Award,
  Check,
  Lock,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_INSTAGRAM_URL = 'https://www.instagram.com/flathisab';

const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const StreaksAndCampaigns: React.FC = () => {
  const { user, profile } = useAuth();
  const { currentGroup } = useRoom();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState<boolean>(true);
  const [isCheckingIn, setIsCheckingIn] = useState<boolean>(false);
  const [checkInToast, setCheckInToast] = useState<string>('');
  const [joiningCampaignId, setJoiningCampaignId] = useState<string | null>(null);
  const [campaignFeedback, setCampaignFeedback] = useState<{ id: string; text: string; type: 'success' | 'error' } | null>(null);
  const [localFollowedInsta, setLocalFollowedInsta] = useState<boolean>(() => {
    try {
      return localStorage.getItem('flathisab_insta_followed') === 'true';
    } catch {
      return false;
    }
  });

  const hasFollowedInstagram = Boolean(profile?.followedInstagram || localFollowedInsta);

  const handleMarkInstagramFollowed = async () => {
    setLocalFollowedInsta(true);
    try {
      localStorage.setItem('flathisab_insta_followed', 'true');
    } catch {
      // ignore storage errors
    }
    if (user) {
      try {
        await setDoc(
          doc(db, 'users', user.uid),
          { followedInstagram: true },
          { merge: true }
        );
      } catch (err) {
        console.warn('Could not persist Instagram follow status:', err);
      }
    }
  };

  const todayStr = useMemo(() => getLocalDateString(new Date()), []);
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return getLocalDateString(d);
  }, []);

  // Check if user already checked in today
  const hasCheckedInToday = useMemo(() => {
    if (!profile) return false;
    if (profile.lastCheckInDate === todayStr) return true;
    if (Array.isArray(profile.checkInHistory) && profile.checkInHistory.includes(todayStr)) return true;
    return false;
  }, [profile, todayStr]);

  // Last 7 days array for visual streak calendar
  const last7Days = useMemo(() => {
    const days: Array<{ dateStr: string; dayLabel: string; dayNum: string; checked: boolean; isToday: boolean }> = [];
    const historySet = new Set<string>(Array.isArray(profile?.checkInHistory) ? profile!.checkInHistory! : []);
    if (profile?.lastCheckInDate) {
      historySet.add(profile.lastCheckInDate);
    }

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = getLocalDateString(d);
      days.push({
        dateStr: dStr,
        dayLabel: d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 3),
        dayNum: String(d.getDate()),
        checked: historySet.has(dStr),
        isToday: i === 0,
      });
    }
    return days;
  }, [profile, todayStr]);

  // Listen to live campaigns posted by Admin
  useEffect(() => {
    setLoadingCampaigns(true);
    const unsub = onSnapshot(
      collection(db, 'campaigns'),
      (snap) => {
        const list: Campaign[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data() as Campaign;
          list.push({
            ...data,
            id: docSnap.id,
            conditions: Array.isArray(data.conditions) ? data.conditions : [],
            participants: Array.isArray(data.participants) ? data.participants : [],
            minStreakRequired: Number(data.minStreakRequired) || 0,
          });
        });
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setCampaigns(list);
        setLoadingCampaigns(false);
      },
      (err) => {
        console.warn('Campaigns listener warning:', err);
        setLoadingCampaigns(false);
      }
    );

    return () => unsub();
  }, []);

  // Handle Daily Streak Check-In
  const handleDailyCheckIn = async () => {
    if (!user || !profile || hasCheckedInToday || isCheckingIn) return;
    setIsCheckingIn(true);
    setCheckInToast('');

    try {
      const currentStreak = Number(profile.streak) || 0;
      const wasYesterdayChecked =
        profile.lastCheckInDate === yesterdayStr ||
        (Array.isArray(profile.checkInHistory) && profile.checkInHistory.includes(yesterdayStr));

      // If checked in yesterday or first check-in with existing streak, increment; if gap > 1 day and had previous checkInDate, reset to 1
      const nextStreak =
        !profile.lastCheckInDate || wasYesterdayChecked
          ? currentStreak + 1
          : 1;

      const nextLongest = Math.max(nextStreak, Number(profile.longestStreak) || currentStreak, 1);
      const prevHistory = Array.isArray(profile.checkInHistory) ? profile.checkInHistory : [];
      const nextHistory = Array.from(new Set([...prevHistory, todayStr])).slice(-60);
      const nextScore = Math.min(100, (Number(profile.roommateScore) || 100) + 2);

      await setDoc(
        doc(db, 'users', user.uid),
        {
          streak: nextStreak,
          longestStreak: nextLongest,
          lastCheckInDate: todayStr,
          checkInHistory: nextHistory,
          roommateScore: nextScore,
        },
        { merge: true }
      );

      setCheckInToast(`🔥 Awesome! Daily streak increased to ${nextStreak} ${nextStreak === 1 ? 'day' : 'days'}!`);
      setTimeout(() => setCheckInToast(''), 4500);
    } catch (err) {
      console.error('Daily check-in error:', err);
    } finally {
      setIsCheckingIn(false);
    }
  };

  // Join / Participate in an Admin Campaign
  const handleJoinCampaign = async (campaign: Campaign) => {
    if (!user || !profile) return;
    const currentStreak = Number(profile.streak) || 0;
    const minRequired = Number(campaign.minStreakRequired) || 0;
    const requiresInstagram = campaign.requireInstagramFollow !== false;

    if (requiresInstagram && !hasFollowedInstagram) {
      setCampaignFeedback({
        id: campaign.id,
        type: 'error',
        text: 'Please complete the condition to follow our official Instagram page @flathisab (click the "Follow @flathisab" button above) before joining!',
      });
      return;
    }

    if (currentStreak < minRequired) {
      setCampaignFeedback({
        id: campaign.id,
        type: 'error',
        text: `You need at least a ${minRequired}-day daily streak to join this campaign (Your current streak: ${currentStreak} days). Check in daily to unlock!`,
      });
      return;
    }

    setJoiningCampaignId(campaign.id);
    setCampaignFeedback(null);

    try {
      const existingParticipants = Array.isArray(campaign.participants) ? campaign.participants : [];
      const normEmail = (profile.email || user.email || '').trim().toLowerCase();

      const alreadyJoined = existingParticipants.some(
        (p) =>
          p.uid === user.uid ||
          (normEmail && (p.email || '').trim().toLowerCase() === normEmail)
      );

      if (alreadyJoined) {
        setCampaignFeedback({
          id: campaign.id,
          type: 'success',
          text: 'You are already registered for this campaign!',
        });
        return;
      }

      const newParticipant: CampaignParticipant = {
        uid: user.uid,
        displayName: profile.displayName || user.displayName || 'Roommate',
        email: normEmail || profile.email || '',
        roomName: currentGroup?.name || '',
        roomCode: currentGroup?.code || '',
        streakAtJoin: currentStreak,
        followedInstagram: hasFollowedInstagram,
        joinedAt: new Date().toISOString(),
      };

      await updateDoc(doc(db, 'campaigns', campaign.id), {
        participants: [...existingParticipants, newParticipant],
      });

      setCampaignFeedback({
        id: campaign.id,
        type: 'success',
        text: `🎉 You have officially entered "${campaign.title}"! Keep your streak active until ${new Date(campaign.rewardDate).toLocaleDateString()}!`,
      });
    } catch (err) {
      console.error('Failed to join campaign:', err);
      setCampaignFeedback({
        id: campaign.id,
        type: 'error',
        text: 'Could not register participation right now. Please try again.',
      });
    } finally {
      setJoiningCampaignId(null);
    }
  };

  const currentStreak = Number(profile?.streak) || 0;
  const longestStreak = Math.max(Number(profile?.longestStreak) || 0, currentStreak);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* SECTION 1: DAILY STREAK COUNTER & CHECK-IN HUB */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-orange-500 via-amber-500 to-rose-600 text-white p-6 md:p-8 shadow-xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-black/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Streak Counter Info */}
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black uppercase tracking-widest">
              <Flame className="w-3.5 h-3.5 text-yellow-200 fill-yellow-200" />
              <span>Roommate Daily Streak Counter</span>
            </div>

            <div className="flex items-baseline gap-4">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl md:text-6xl font-black tracking-tight leading-none">
                  {currentStreak}
                </span>
                <span className="text-lg font-extrabold uppercase tracking-wider text-orange-100">
                  {currentStreak === 1 ? 'Day Streak 🔥' : 'Days Streak 🔥'}
                </span>
              </div>
            </div>

            <p className="text-xs md:text-sm text-orange-50/95 font-semibold leading-relaxed">
              Check in every day and settle roommate bills on time to build your daily streak and unlock exclusive **Flat Hisab Campaign Rewards**!
            </p>

            {/* Mini Stats Badges */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="px-3.5 py-2 rounded-2xl bg-black/20 backdrop-blur-sm flex items-center gap-2 text-xs font-extrabold">
                <Trophy className="w-4 h-4 text-yellow-300" />
                <span>Best Streak: {longestStreak} Days</span>
              </div>
              <div className="px-3.5 py-2 rounded-2xl bg-black/20 backdrop-blur-sm flex items-center gap-2 text-xs font-extrabold">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span>Roommate Score: {profile?.roommateScore || 100}</span>
              </div>
              {currentGroup && (
                <div className="px-3.5 py-2 rounded-2xl bg-black/20 backdrop-blur-sm flex items-center gap-2 text-xs font-extrabold">
                  <Users className="w-4 h-4 text-indigo-200" />
                  <span>Room: {currentGroup.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Action & 7-Day Tracker */}
          <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-3xl p-5 flex flex-col justify-between gap-4 min-w-[280px]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-100">
                Last 7 Days Activity
              </span>
              <span className="text-[10px] font-bold text-white/90">
                {hasCheckedInToday ? '✓ Checked In Today' : 'Pending Today'}
              </span>
            </div>

            {/* 7-Day Pills */}
            <div className="grid grid-cols-7 gap-1.5 text-center">
              {last7Days.map((d) => (
                <div
                  key={d.dateStr}
                  className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all ${
                    d.checked
                      ? 'bg-white text-orange-600 border-white font-black shadow-sm'
                      : d.isToday
                      ? 'bg-white/20 text-white border-white/60 border-dashed'
                      : 'bg-black/15 text-orange-100/70 border-transparent'
                  }`}
                >
                  <span className="text-[8px] font-black uppercase">{d.dayLabel}</span>
                  {d.checked ? (
                    <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                  ) : (
                    <span className="text-xs font-extrabold">{d.dayNum}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Daily Check-In Button */}
            <button
              onClick={handleDailyCheckIn}
              disabled={hasCheckedInToday || isCheckingIn}
              className={`w-full py-3.5 px-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg ${
                hasCheckedInToday
                  ? 'bg-emerald-500/90 text-white cursor-default'
                  : 'bg-white text-orange-600 hover:bg-orange-50 active:scale-95 cursor-pointer'
              }`}
            >
              {hasCheckedInToday ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Today's Streak Claimed!</span>
                </>
              ) : isCheckingIn ? (
                <span>Updating Streak...</span>
              ) : (
                <>
                  <Flame className="w-4 h-4 fill-orange-600" />
                  <span>Claim Today's Streak (+1)</span>
                </>
              )}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {checkInToast && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mt-4 p-3 rounded-2xl bg-black/30 backdrop-blur-md text-white text-xs font-extrabold text-center"
            >
              {checkInToast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SECTION 2: LIVE CAMPAIGNS & REWARD GIVEAWAYS */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Live Campaigns & Winning Rewards
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
              Complete the campaign conditions and maintain your daily streak to win rewards on the announcement date!
            </p>
          </div>

          <span className="self-start sm:self-auto px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/50 dark:border-indigo-800/50 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest">
            {campaigns.length} {campaigns.length === 1 ? 'Campaign' : 'Campaigns'} Posted
          </span>
        </div>

        {loadingCampaigns ? (
          <div className="p-12 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center space-y-3">
            <Sparkles className="w-8 h-8 text-indigo-500 animate-pulse mx-auto" />
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">
              Loading Live Campaigns...
            </p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-12 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center space-y-3">
            <div className="w-14 h-14 rounded-3xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
              <Trophy className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white">
              New Campaigns Coming Soon!
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold max-w-md mx-auto">
              Keep building your daily streak above! As soon as the Admin posts a new reward campaign, it will appear right here with participation rules and winning prizes.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {campaigns.map((camp) => {
              const normEmail = (profile?.email || user?.email || '').trim().toLowerCase();
              const isJoined = (camp.participants || []).some(
                (p) =>
                  p.uid === user?.uid ||
                  (normEmail && (p.email || '').trim().toLowerCase() === normEmail)
              );
              const meetsStreak = currentStreak >= (camp.minStreakRequired || 0);
              const requiresInstagram = camp.requireInstagramFollow !== false;
              const instagramUrl = camp.instagramUrl?.trim() || DEFAULT_INSTAGRAM_URL;
              const canParticipate = meetsStreak && (!requiresInstagram || hasFollowedInstagram);
              const rewardDateObj = camp.rewardDate ? new Date(camp.rewardDate) : null;
              const daysRemaining = rewardDateObj
                ? Math.ceil((rewardDateObj.getTime() - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24))
                : null;

              // Filter out raw condition lines that duplicate the dedicated Instagram follow box
              const filteredConditions = (camp.conditions || []).filter(
                (c) => !requiresInstagram || !c.toLowerCase().includes('instagram.com/flathisab')
              );

              return (
                <div
                  key={camp.id}
                  className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.25rem] overflow-hidden shadow-xl flex flex-col justify-between transition-all hover:border-indigo-500/40"
                >
                  <div>
                    {/* Campaign Thumbnail Banner */}
                    <div className="relative h-48 w-full bg-gradient-to-br from-indigo-600 via-purple-600 to-rose-500 overflow-hidden">
                      {camp.thumbnailUrl && (
                        <img
                          src={camp.thumbnailUrl}
                          alt={camp.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent" />

                      {/* Status & Streak Requirement Badges */}
                      <div className="absolute top-4 inset-x-4 flex items-center justify-between gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md ${
                            camp.status === 'completed'
                              ? 'bg-slate-900/80 text-slate-300'
                              : camp.status === 'upcoming'
                              ? 'bg-amber-500/90 text-white'
                              : 'bg-emerald-500/90 text-white'
                          }`}
                        >
                          {camp.status === 'completed'
                            ? 'Completed'
                            : camp.status === 'upcoming'
                            ? 'Upcoming'
                            : '● Live Campaign'}
                        </span>

                        {camp.minStreakRequired > 0 && (
                          <span className="px-3 py-1 rounded-full bg-orange-500/95 text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm">
                            <Flame className="w-3 h-3 fill-white" />
                            Min {camp.minStreakRequired}-Day Streak
                          </span>
                        )}
                      </div>

                      {/* Title overlay on bottom of thumbnail */}
                      <div className="absolute bottom-3 inset-x-5 text-left">
                        <h4 className="text-lg font-black text-white leading-tight drop-shadow-sm">
                          {camp.title}
                        </h4>
                      </div>
                    </div>

                    {/* Campaign Body */}
                    <div className="p-6 space-y-5 text-left">
                      {camp.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold leading-relaxed">
                          {camp.description}
                        </p>
                      )}

                      {/* Winning Reward & Specific Date Highlight Card */}
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/60 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/70 dark:border-amber-800/50 space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                              <Trophy className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="block text-[9px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">
                                Winning Reward
                              </span>
                              <p className="text-sm font-black text-slate-900 dark:text-white">
                                {camp.winningReward}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-amber-200/50 dark:border-amber-800/40 flex items-center justify-between text-[11px] font-extrabold text-amber-800 dark:text-amber-300">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            Reward Date:{' '}
                            {rewardDateObj
                              ? rewardDateObj.toLocaleDateString(undefined, {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : camp.rewardDate}
                          </span>
                          {daysRemaining !== null && camp.status !== 'completed' && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-black">
                              {daysRemaining > 0
                                ? `${daysRemaining}d left`
                                : daysRemaining === 0
                                ? 'Reward Day Today!'
                                : 'Draw Date Reached'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Winner Announcement if posted by Admin */}
                      {camp.winnerAnnouncement && (
                        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2.5 text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
                          <Award className="w-5 h-5 text-emerald-500 shrink-0" />
                          <div>
                            <span className="block text-[9px] font-black uppercase tracking-widest">
                              Official Winner Announcement
                            </span>
                            <span>{camp.winnerAnnouncement}</span>
                          </div>
                        </div>
                      )}

                      {/* Conditions to Participate */}
                      <div className="space-y-2.5">
                        <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Conditions to Participate
                        </span>
                        <ul className="space-y-2.5">
                          {/* Condition 1: Follow Official Instagram Page @flathisab */}
                          {requiresInstagram && (
                            <li className="p-3 rounded-2xl bg-gradient-to-r from-pink-50 via-rose-50 to-amber-50 dark:from-pink-950/30 dark:via-rose-950/25 dark:to-amber-950/20 border border-pink-200/80 dark:border-pink-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                              <div className="flex items-start gap-2 text-xs font-bold">
                                <CheckCircle2
                                  className={`w-4 h-4 shrink-0 mt-0.5 ${
                                    hasFollowedInstagram ? 'text-emerald-500' : 'text-pink-600 dark:text-pink-400'
                                  }`}
                                />
                                <div>
                                  <span className="text-slate-800 dark:text-slate-100 block">
                                    Follow our official Instagram page <strong>@flathisab</strong>
                                  </span>
                                  <a
                                    href={instagramUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={handleMarkInstagramFollowed}
                                    className="text-[10px] font-extrabold text-pink-600 dark:text-pink-400 underline break-all"
                                  >
                                    {instagramUrl}
                                  </a>
                                </div>
                              </div>

                              <a
                                href={instagramUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={handleMarkInstagramFollowed}
                                className={`shrink-0 px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                                  hasFollowedInstagram
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-gradient-to-r from-pink-600 via-rose-600 to-orange-500 hover:opacity-95 text-white'
                                }`}
                              >
                                {hasFollowedInstagram ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Followed @flathisab</span>
                                  </>
                                ) : (
                                  <>
                                    <span>Follow @flathisab</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </>
                                )}
                              </a>
                            </li>
                          )}

                          {/* Condition 2: Minimum Daily Streak */}
                          {camp.minStreakRequired > 0 && (
                            <li className="flex items-start gap-2 text-xs font-bold">
                              <CheckCircle2
                                className={`w-4 h-4 shrink-0 mt-0.5 ${
                                  meetsStreak ? 'text-emerald-500' : 'text-amber-500'
                                }`}
                              />
                              <span className="text-slate-700 dark:text-slate-300">
                                Maintain at least a <strong>{camp.minStreakRequired}-day streak</strong>{' '}
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded font-black ${
                                    meetsStreak
                                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                                      : 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
                                  }`}
                                >
                                  Your Streak: {currentStreak}/{camp.minStreakRequired}
                                </span>
                              </span>
                            </li>
                          )}

                          {/* Additional Conditions */}
                          {filteredConditions.map((cond, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                              <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                              <span>{cond}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {campaignFeedback && campaignFeedback.id === camp.id && (
                        <div
                          className={`p-3 rounded-xl text-xs font-bold ${
                            campaignFeedback.type === 'success'
                              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50'
                              : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200/50'
                          }`}
                        >
                          {campaignFeedback.text}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer: Participants Count & Participate CTA */}
                  <div className="px-6 pb-6 pt-3 border-t border-slate-100 dark:border-slate-800/70 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                      <Users className="w-4 h-4 text-indigo-500" />
                      <span>{(camp.participants || []).length} Participating</span>
                    </div>

                    {isJoined ? (
                      <span className="px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                        <Check className="w-4 h-4" /> Entered Campaign
                      </span>
                    ) : camp.status === 'completed' ? (
                      <span className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-black uppercase tracking-wider">
                        Campaign Ended
                      </span>
                    ) : (
                      <button
                        onClick={() => handleJoinCampaign(camp)}
                        disabled={joiningCampaignId === camp.id}
                        className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                          canParticipate
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:opacity-90'
                        }`}
                      >
                        {!canParticipate && <Lock className="w-3.5 h-3.5" />}
                        <span>
                          {joiningCampaignId === camp.id
                            ? 'Joining...'
                            : !requiresInstagram || hasFollowedInstagram
                            ? meetsStreak
                              ? 'Participate Now'
                              : `Need ${camp.minStreakRequired}d Streak`
                            : 'Follow @flathisab First'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};
