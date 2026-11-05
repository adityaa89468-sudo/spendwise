import React, { useEffect, useState, useMemo } from 'react';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, Group, Expense, Settlement, Campaign } from '../types';
import { SpendWiseLogo } from './SpendWiseLogo';
import {
  ShieldCheck,
  Users,
  Home,
  Crown,
  Coins,
  Search,
  RefreshCw,
  LogOut,
  Eye,
  Trash2,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ChevronRight,
  X,
  Sun,
  Moon,
  LayoutGrid,
  Activity,
  Sparkles,
  UserCheck,
  Mail,
  Calendar,
  Hash,
  Flame,
  Gift,
  Trophy,
  Plus,
  Image as ImageIcon,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PRESET_THUMBNAILS = [
  {
    label: 'Golden Trophy Giveaway',
    url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=900&q=80',
  },
  {
    label: 'Streak Fire Challenge',
    url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=80',
  },
  {
    label: 'Roommate Party Jackpot',
    url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80',
  },
  {
    label: 'Cashback & Gift Cards',
    url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=80',
  },
];

interface AdminDashboardProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onSignOut: () => Promise<void>;
  onSwitchToUserApp?: () => void;
  adminEmail: string;
}

interface EnrichedUser extends UserProfile {
  roomName?: string;
  roomCode?: string;
  roomRole?: 'admin' | 'member';
  isRoomPremium?: boolean;
}

interface EnrichedGroup extends Group {
  expensesCount: number;
  totalExpenseAmount: number;
  settlementsCount: number;
  expensesList: Expense[];
  settlementsList: Settlement[];
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  darkMode,
  setDarkMode,
  onSignOut,
  onSwitchToUserApp,
  adminEmail,
}) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'campaigns' | 'users' | 'rooms' | 'ledger'>('overview');
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [rawUsers, setRawUsers] = useState<UserProfile[]>([]);
  const [groups, setGroups] = useState<EnrichedGroup[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Search and filters
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'in_room' | 'no_room' | 'room_admin'>('all');
  const [roomSearch, setRoomSearch] = useState('');
  const [roomFilter, setRoomFilter] = useState<'all' | 'premium' | 'free'>('all');

  // Room detail modal state
  const [selectedRoom, setSelectedRoom] = useState<EnrichedGroup | null>(null);
  const [togglingPremiumId, setTogglingPremiumId] = useState<string | null>(null);
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<string | null>(null);
  const [confirmDeleteRoomId, setConfirmDeleteRoomId] = useState<string | null>(null);

  // Campaign creation & management state
  const [campTitle, setCampTitle] = useState('');
  const [campDesc, setCampDesc] = useState('');
  const [campThumbnail, setCampThumbnail] = useState(PRESET_THUMBNAILS[0].url);
  const [campReward, setCampReward] = useState('');
  const [campRewardDate, setCampRewardDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [campMinStreak, setCampMinStreak] = useState('7');
  const [campRequireInstagram, setCampRequireInstagram] = useState(true);
  const [campInstagramUrl, setCampInstagramUrl] = useState('https://www.instagram.com/flathisab');
  const [campConditionsText, setCampConditionsText] = useState(
    'Follow our official Instagram page @flathisab (https://www.instagram.com/flathisab)\nMaintain your daily check-in streak without missing a day\nBe part of an active Flat Hisab room with at least 2 members\nSplit or settle at least 1 shared bill before the reward date'
  );
  const [campStatus, setCampStatus] = useState<'active' | 'upcoming' | 'completed'>('active');
  const [isSavingCampaign, setIsSavingCampaign] = useState(false);
  const [campaignFormMsg, setCampaignFormMsg] = useState('');
  const [confirmDeleteCampId, setConfirmDeleteCampId] = useState<string | null>(null);
  const [winnerInputById, setWinnerInputById] = useState<Record<string, string>>({});

  const fetchAllAdminData = async () => {
    setLoadingData(true);
    try {
      // 1. Fetch all user profiles from /users and automatically deduplicate by email (1 account per 1 email)
      const usersSnap = await getDocs(collection(db, 'users'));
      const rawFetched: UserProfile[] = [];
      usersSnap.forEach((docSnap) => {
        const data = docSnap.data() as UserProfile;
        rawFetched.push({
          ...data,
          uid: docSnap.id || data.uid,
        });
      });

      const byEmailMap = new Map<string, UserProfile>();
      const duplicateUserIdsToDelete: string[] = [];
      const mergedToSave: UserProfile[] = [];

      for (const u of rawFetched) {
        const normEmail = (u.email || '').trim().toLowerCase();
        const key = normEmail || `uid:${u.uid}`;
        const existing = byEmailMap.get(key);

        if (!existing) {
          byEmailMap.set(key, {
            ...u,
            email: normEmail || u.email || '',
          });
        } else {
          // Pick primary record (prefer the one with an active currentGroupId or upiId)
          const preferNew = Boolean(
            (!existing.currentGroupId && u.currentGroupId) ||
            (!existing.upiId && u.upiId)
          );
          const primary = preferNew ? u : existing;
          const secondary = preferNew ? existing : u;

          const merged: UserProfile = {
            ...secondary,
            ...primary,
            uid: primary.uid,
            email: normEmail,
            displayName: primary.displayName || secondary.displayName || '',
            currentGroupId: primary.currentGroupId || secondary.currentGroupId,
            upiId: primary.upiId || secondary.upiId,
            createdAt: secondary.createdAt || primary.createdAt || new Date().toISOString(),
          };

          byEmailMap.set(key, merged);
          duplicateUserIdsToDelete.push(secondary.uid);
          mergedToSave.push(merged);
        }
      }

      if (duplicateUserIdsToDelete.length > 0) {
        await Promise.all([
          ...mergedToSave.map((m) => setDoc(doc(db, 'users', m.uid), m, { merge: true })),
          ...duplicateUserIdsToDelete.map((dupId) => deleteDoc(doc(db, 'users', dupId))),
        ]).catch((e) => console.warn('Auto-deduplication warning:', e));
      }

      const fetchedUsers: UserProfile[] = Array.from(byEmailMap.values());

      // 2. Fetch all groups from /groups and their subcollections
      const groupsSnap = await getDocs(collection(db, 'groups'));
      const rawGroups: Group[] = [];
      groupsSnap.forEach((docSnap) => {
        const data = docSnap.data() as Group;
        rawGroups.push({
          ...data,
          id: docSnap.id,
        });
      });

      const enrichedGroups: EnrichedGroup[] = await Promise.all(
        rawGroups.map(async (grp) => {
          let expensesList: Expense[] = [];
          let settlementsList: Settlement[] = [];
          try {
            const expSnap = await getDocs(collection(db, 'groups', grp.id, 'expenses'));
            expSnap.forEach((eDoc) => {
              const eData = eDoc.data() as Expense;
              const safeSplits: Expense['splits'] = Array.isArray(eData.splits)
                ? eData.splits
                : eData.splits && typeof eData.splits === 'object'
                ? (Object.values(eData.splits).filter((s: any) => s && typeof s === 'object' && s.uid) as Expense['splits'])
                : [];
              expensesList.push({ ...eData, id: eDoc.id, splits: safeSplits });
            });
          } catch (e) {
            console.warn(`Could not load expenses for group ${grp.id}:`, e);
          }

          try {
            const setSnap = await getDocs(collection(db, 'groups', grp.id, 'settlements'));
            setSnap.forEach((sDoc) => {
              settlementsList.push({ ...(sDoc.data() as Settlement), id: sDoc.id });
            });
          } catch (e) {
            console.warn(`Could not load settlements for group ${grp.id}:`, e);
          }

          expensesList.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
          settlementsList.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());

          const totalExpenseAmount = expensesList.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);

          return {
            ...grp,
            members: Array.isArray(grp.members) ? grp.members : [],
            expensesCount: expensesList.length,
            totalExpenseAmount,
            settlementsCount: settlementsList.length,
            expensesList,
            settlementsList,
          };
        })
      );

      enrichedGroups.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      // 3. Fetch all Admin Campaigns from /campaigns
      const fetchedCampaigns: Campaign[] = [];
      try {
        const campSnap = await getDocs(collection(db, 'campaigns'));
        campSnap.forEach((cDoc) => {
          const cData = cDoc.data() as Campaign;
          fetchedCampaigns.push({
            ...cData,
            id: cDoc.id,
            conditions: Array.isArray(cData.conditions) ? cData.conditions : [],
            participants: Array.isArray(cData.participants) ? cData.participants : [],
            minStreakRequired: Number(cData.minStreakRequired) || 0,
          });
        });
        fetchedCampaigns.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      } catch (campErr) {
        console.warn('Could not load campaigns:', campErr);
      }

      setRawUsers(fetchedUsers);
      setGroups(enrichedGroups);
      setCampaigns(fetchedCampaigns);
      setLastRefreshed(new Date());

      if (selectedRoom) {
        const updatedRoom = enrichedGroups.find((g) => g.id === selectedRoom.id);
        if (updatedRoom) setSelectedRoom(updatedRoom);
      }
    } catch (error) {
      console.error('Error fetching admin dashboard data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchAllAdminData();
  }, []);

  // Merge users from /users collection AND group.members, strictly enforcing 1 account per 1 email
  const allUsers: EnrichedUser[] = useMemo(() => {
    const userMap = new Map<string, EnrichedUser>();
    const emailToKeyMap = new Map<string, string>();

    const getCanonicalKey = (uid: string, email?: string) => {
      const normEmail = (email || '').trim().toLowerCase();
      if (normEmail && emailToKeyMap.has(normEmail)) {
        return emailToKeyMap.get(normEmail)!;
      }
      if (userMap.has(uid)) {
        if (normEmail) emailToKeyMap.set(normEmail, uid);
        return uid;
      }
      const key = normEmail ? `email:${normEmail}` : `uid:${uid}`;
      if (normEmail) emailToKeyMap.set(normEmail, key);
      return key;
    };

    rawUsers.forEach((u) => {
      if (!u.uid) return;
      const normEmail = (u.email || '').trim().toLowerCase();
      const key = getCanonicalKey(u.uid, normEmail);
      userMap.set(key, {
        ...u,
        email: normEmail || u.email || '',
      });
    });

    groups.forEach((grp) => {
      const isGrpPremium = Boolean(
        grp.isPremium && (!grp.premiumUntil || new Date(grp.premiumUntil).getTime() > Date.now())
      );
      (grp.members || []).forEach((m) => {
        if (!m || !m.uid) return;
        const normEmail = (m.email || '').trim().toLowerCase();
        const key = getCanonicalKey(m.uid, normEmail);
        const existing = userMap.get(key);
        if (existing) {
          userMap.set(key, {
            ...existing,
            displayName: existing.displayName || m.displayName || 'User',
            email: existing.email || normEmail || '',
            currentGroupId: existing.currentGroupId || grp.id,
            roomName: grp.name,
            roomCode: grp.code,
            roomRole: m.role,
            isRoomPremium: isGrpPremium,
          });
        } else {
          userMap.set(key, {
            uid: m.uid,
            email: normEmail || '',
            displayName: m.displayName || 'Roommate',
            roommateScore: m.score || 100,
            streak: 0,
            currentGroupId: grp.id,
            createdAt: m.joinedAt || grp.createdAt || new Date().toISOString(),
            roomName: grp.name,
            roomCode: grp.code,
            roomRole: m.role,
            isRoomPremium: isGrpPremium,
          });
        }
      });
    });

    // Also link room info for users whose currentGroupId matches a group
    userMap.forEach((u, key) => {
      if (u.currentGroupId && !u.roomName) {
        const foundGrp = groups.find((g) => g.id === u.currentGroupId);
        if (foundGrp) {
          const isGrpPremium = Boolean(
            foundGrp.isPremium && (!foundGrp.premiumUntil || new Date(foundGrp.premiumUntil).getTime() > Date.now())
          );
          const normEmail = (u.email || '').trim().toLowerCase();
          const memberRecord = (foundGrp.members || []).find(
            (m) =>
              m.uid === u.uid ||
              (normEmail && (m.email || '').trim().toLowerCase() === normEmail)
          );
          userMap.set(key, {
            ...u,
            roomName: foundGrp.name,
            roomCode: foundGrp.code,
            roomRole: memberRecord?.role || (foundGrp.adminId === u.uid ? 'admin' : 'member'),
            isRoomPremium: isGrpPremium,
          });
        }
      }
    });

    return Array.from(userMap.values()).sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }, [rawUsers, groups]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return allUsers.filter((u) => {
      const q = userSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (u.displayName || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.uid || '').toLowerCase().includes(q) ||
        (u.roomName || '').toLowerCase().includes(q) ||
        (u.roomCode || '').toLowerCase().includes(q) ||
        (u.upiId || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (userFilter === 'in_room') return Boolean(u.roomName || u.currentGroupId);
      if (userFilter === 'no_room') return !u.roomName && !u.currentGroupId;
      if (userFilter === 'room_admin') return u.roomRole === 'admin';
      return true;
    });
  }, [allUsers, userSearch, userFilter]);

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return groups.filter((g) => {
      const q = roomSearch.trim().toLowerCase();
      const isPrem = Boolean(g.isPremium && (!g.premiumUntil || new Date(g.premiumUntil).getTime() > Date.now()));
      const matchesSearch =
        !q ||
        (g.name || '').toLowerCase().includes(q) ||
        (g.code || '').toLowerCase().includes(q) ||
        (g.members || []).some(
          (m) =>
            (m.displayName || '').toLowerCase().includes(q) ||
            (m.email || '').toLowerCase().includes(q)
        );

      if (!matchesSearch) return false;
      if (roomFilter === 'premium') return isPrem;
      if (roomFilter === 'free') return !isPrem;
      return true;
    });
  }, [groups, roomSearch, roomFilter]);

  // Global metrics
  const metrics = useMemo(() => {
    const totalUsers = allUsers.length;
    const usersInRooms = allUsers.filter((u) => Boolean(u.roomName || u.currentGroupId)).length;
    const totalRooms = groups.length;
    const activePremiumRooms = groups.filter(
      (g) => g.isPremium && (!g.premiumUntil || new Date(g.premiumUntil).getTime() > Date.now())
    ).length;
    const totalExpensesCount = groups.reduce((acc, g) => acc + g.expensesCount, 0);
    const totalSplitVolume = groups.reduce((acc, g) => acc + g.totalExpenseAmount, 0);
    const totalSettlementsCount = groups.reduce((acc, g) => acc + g.settlementsCount, 0);
    const estimatedMonthlyRev = activePremiumRooms * 59;

    return {
      totalUsers,
      usersInRooms,
      totalRooms,
      activePremiumRooms,
      totalExpensesCount,
      totalSplitVolume,
      totalSettlementsCount,
      estimatedMonthlyRev,
    };
  }, [allUsers, groups]);

  // Global activity feed (all expenses across all groups)
  const globalExpenses = useMemo(() => {
    const list: Array<Expense & { groupName: string; groupCode: string }> = [];
    groups.forEach((g) => {
      g.expensesList.forEach((exp) => {
        list.push({
          ...exp,
          groupName: g.name,
          groupCode: g.code,
        });
      });
    });
    return list.sort(
      (a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
    );
  }, [groups]);

  // Admin Action: Toggle Room Premium (Grant 30 days or Revoke)
  const handleToggleRoomPremium = async (group: EnrichedGroup) => {
    setTogglingPremiumId(group.id);
    try {
      const currentlyPremium = Boolean(
        group.isPremium && (!group.premiumUntil || new Date(group.premiumUntil).getTime() > Date.now())
      );

      if (currentlyPremium) {
        await updateDoc(doc(db, 'groups', group.id), {
          isPremium: false,
          premiumUntil: null,
        });
      } else {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
        await updateDoc(doc(db, 'groups', group.id), {
          isPremium: true,
          premiumUntil: expiresAt,
          premiumPurchasedBy: 'ADMIN',
          premiumPurchasedByName: 'Admin (Aditya)',
          premiumPurchasedAt: now.toISOString(),
        });
      }
      await fetchAllAdminData();
    } catch (err) {
      console.error('Failed to toggle room premium:', err);
    } finally {
      setTogglingPremiumId(null);
    }
  };

  const handleDeleteUserDoc = async (uid: string) => {
    try {
      const targetUser = allUsers.find((u) => u.uid === uid);
      const targetEmail = (targetUser?.email || '').trim().toLowerCase();

      // 1. Delete primary and any duplicate documents from /users collection matching UID or email
      const usersSnap = await getDocs(collection(db, 'users'));
      const docsToDelete: string[] = [uid];
      usersSnap.forEach((uDoc) => {
        const uData = uDoc.data() as UserProfile;
        if (
          uDoc.id === uid ||
          (targetEmail && (uData.email || '').trim().toLowerCase() === targetEmail)
        ) {
          if (!docsToDelete.includes(uDoc.id)) {
            docsToDelete.push(uDoc.id);
          }
        }
      });
      await Promise.all(docsToDelete.map((id) => deleteDoc(doc(db, 'users', id))));

      // 2. Also remove this user (by UID or email) from any room's members list
      const groupsWithUser = groups.filter((g) =>
        (g.members || []).some(
          (m) =>
            m &&
            (m.uid === uid ||
              (targetEmail && (m.email || '').trim().toLowerCase() === targetEmail))
        )
      );
      await Promise.all(
        groupsWithUser.map((g) => {
          const updatedMembers = (g.members || []).filter(
            (m) =>
              m &&
              m.uid !== uid &&
              (!targetEmail || (m.email || '').trim().toLowerCase() !== targetEmail)
          );
          return updateDoc(doc(db, 'groups', g.id), { members: updatedMembers });
        })
      );

      setConfirmDeleteUserId(null);
      await fetchAllAdminData();
    } catch (err) {
      console.error('Failed to delete user document:', err);
    }
  };

  const handleDeleteRoomDoc = async (groupId: string) => {
    try {
      await deleteDoc(doc(db, 'groups', groupId));
      setConfirmDeleteRoomId(null);
      if (selectedRoom?.id === groupId) setSelectedRoom(null);
      await fetchAllAdminData();
    } catch (err) {
      console.error('Failed to delete group document:', err);
    }
  };

  // Handle thumbnail file upload (converts to compressed Data URL so no external bucket is required)
  const handleThumbnailFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 800;
        const scale = Math.min(1, maxW / img.width);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setCampThumbnail(dataUrl);
        }
      };
      if (typeof ev.target?.result === 'string') {
        img.src = ev.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  // Create & Publish New Campaign
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campTitle.trim() || !campReward.trim() || !campRewardDate) {
      setCampaignFormMsg('Please fill in Campaign Title, Winning Reward, and Reward Date.');
      return;
    }

    setIsSavingCampaign(true);
    setCampaignFormMsg('');

    try {
      const campId = doc(collection(db, 'campaigns')).id;
      const conditionsList = campConditionsText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      const newCampaign: Campaign = {
        id: campId,
        title: campTitle.trim(),
        description: campDesc.trim(),
        thumbnailUrl: campThumbnail.trim() || PRESET_THUMBNAILS[0].url,
        conditions: conditionsList,
        minStreakRequired: Math.max(0, parseInt(campMinStreak, 10) || 0),
        requireInstagramFollow: campRequireInstagram,
        instagramUrl: campInstagramUrl.trim() || 'https://www.instagram.com/flathisab',
        winningReward: campReward.trim(),
        rewardDate: campRewardDate,
        status: campStatus,
        participants: [],
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'campaigns', campId), newCampaign);
      setCampTitle('');
      setCampDesc('');
      setCampReward('');
      setCampaignFormMsg('🎉 Campaign published! All roommates can now see it on their Streaks & Campaigns page.');
      await fetchAllAdminData();
      setTimeout(() => setCampaignFormMsg(''), 4000);
    } catch (err) {
      console.error('Failed to publish campaign:', err);
      setCampaignFormMsg('Error publishing campaign. Check permissions.');
    } finally {
      setIsSavingCampaign(false);
    }
  };

  const handleDeleteCampaign = async (campId: string) => {
    try {
      await deleteDoc(doc(db, 'campaigns', campId));
      setConfirmDeleteCampId(null);
      await fetchAllAdminData();
    } catch (err) {
      console.error('Failed to delete campaign:', err);
    }
  };

  const handleUpdateCampaignStatus = async (campId: string, status: 'active' | 'upcoming' | 'completed') => {
    try {
      await updateDoc(doc(db, 'campaigns', campId), { status });
      await fetchAllAdminData();
    } catch (err) {
      console.error('Failed to update campaign status:', err);
    }
  };

  const handleSaveWinnerAnnouncement = async (campId: string) => {
    const text = (winnerInputById[campId] || '').trim();
    try {
      await updateDoc(doc(db, 'campaigns', campId), {
        winnerAnnouncement: text,
        status: text ? 'completed' : 'active',
      });
      await fetchAllAdminData();
    } catch (err) {
      console.error('Failed to save winner announcement:', err);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-slate-950 text-white dark' : 'bg-slate-50 text-slate-900'}`}>
      {/* Top Admin Command Header */}
      <header className="sticky top-0 z-30 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-800/80 px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <SpendWiseLogo variant="icon" className="w-10 h-10 rounded-xl shadow-md" darkMode={darkMode} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-base tracking-tight text-slate-900 dark:text-white leading-none">
                  Flat Hisab Admin
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-indigo-600 text-white">
                  <ShieldCheck className="w-3 h-3" /> Super Admin
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-1">
                {adminEmail} • Updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchAllAdminData}
              disabled={loadingData}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin text-indigo-500' : ''}`} />
              <span>Sync Live DB</span>
            </button>

            {onSwitchToUserApp && (
              <button
                onClick={onSwitchToUserApp}
                className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 border border-indigo-200/60 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">User App View</span>
              </button>
            )}

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 hover:opacity-80 transition-all cursor-pointer"
              title="Toggle Theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            <button
              onClick={onSignOut}
              className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/60 border border-rose-200/50 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 space-y-8">
        {/* Top KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Users */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Registered Users
              </span>
              <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                {metrics.totalUsers}
              </div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
                {metrics.usersInRooms} active in rooms • {metrics.totalUsers - metrics.usersInRooms} unjoined
              </p>
            </div>
          </div>

          {/* Card 2: Active Rooms */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Active Flat Rooms
              </span>
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Home className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                {metrics.totalRooms}
              </div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
                {metrics.totalExpensesCount} expenses • {metrics.totalSettlementsCount} settlements
              </p>
            </div>
          </div>

          {/* Card 3: Room Premium Subscriptions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Ad-Free Rooms (₹59/mo)
              </span>
              <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Crown className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  {metrics.activePremiumRooms}
                </span>
                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                  ₹{metrics.estimatedMonthlyRev}/mo
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
                {metrics.totalRooms - metrics.activePremiumRooms} rooms on Free Ad-Supported tier
              </p>
            </div>
          </div>

          {/* Card 4: Total Split Ledger Volume */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Total Split Volume
              </span>
              <div className="w-9 h-9 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                ₹{Math.round(metrics.totalSplitVolume).toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
                Across {metrics.totalExpensesCount} shared bills recorded
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'Users & Rooms Overview', icon: LayoutGrid },
            { id: 'campaigns', label: `Campaigns & Streaks (${campaigns.length})`, icon: Gift },
            { id: 'users', label: `All Users (${allUsers.length})`, icon: Users },
            { id: 'rooms', label: `All Rooms (${groups.length})`, icon: Home },
            { id: 'ledger', label: `Global Expenses (${globalExpenses.length})`, icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`px-4 py-3 text-xs font-black uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                  active
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* CAMPAIGNS & STREAKS MANAGER SECTION */}
        {(activeSection === 'campaigns' || activeSection === 'overview') && (
          <section className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Gift className="w-5 h-5 text-orange-500" />
                  Post & Manage Streak Campaigns ({campaigns.length})
                </h2>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">
                  Publish campaigns with a thumbnail, participation conditions, minimum streak, and a winning reward on a specific date
                </p>
              </div>
              <span className="self-start md:self-auto px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-orange-500" /> Instant Sync to All Rooms
              </span>
            </div>

            {/* Create Campaign Form */}
            <form onSubmit={handleCreateCampaign} className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50/70 dark:bg-slate-950/50 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
              <div className="lg:col-span-7 space-y-4 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                      Campaign Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={campTitle}
                      onChange={(e) => setCampTitle(e.target.value)}
                      placeholder="e.g. 14-Day Roommate Streak Challenge"
                      className="w-full px-3.5 py-2.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                      Winning Reward *
                    </label>
                    <input
                      type="text"
                      required
                      value={campReward}
                      onChange={(e) => setCampReward(e.target.value)}
                      placeholder="e.g. ₹1,000 Amazon Voucher + Free Pro"
                      className="w-full px-3.5 py-2.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                      Reward / Winner Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={campRewardDate}
                      onChange={(e) => setCampRewardDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                      Min Daily Streak (Days)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={365}
                      value={campMinStreak}
                      onChange={(e) => setCampMinStreak(e.target.value)}
                      placeholder="e.g. 7"
                      className="w-full px-3.5 py-2.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                      Campaign Status
                    </label>
                    <select
                      value={campStatus}
                      onChange={(e) => setCampStatus(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="active">Active (Open Now)</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Short Description
                  </label>
                  <input
                    type="text"
                    value={campDesc}
                    onChange={(e) => setCampDesc(e.target.value)}
                    placeholder="e.g. Keep your daily roommate streak alive and split bills on time to win!"
                    className="w-full px-3.5 py-2.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Conditions to Participate (One condition per line) *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={campConditionsText}
                    onChange={(e) => setCampConditionsText(e.target.value)}
                    placeholder="Enter each condition on a new line..."
                    className="w-full px-3.5 py-2.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Instagram Follow Condition Option */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-pink-50/80 via-rose-50/60 to-purple-50/80 dark:from-pink-950/30 dark:via-rose-950/20 dark:to-purple-950/30 border border-pink-200/70 dark:border-pink-800/50 space-y-2.5">
                  <label className="flex items-center justify-between gap-3 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={campRequireInstagram}
                        onChange={(e) => setCampRequireInstagram(e.target.checked)}
                        className="w-4 h-4 accent-pink-600 rounded cursor-pointer"
                      />
                      <span className="text-xs font-black text-slate-800 dark:text-white">
                        Require Following Official Instagram (@flathisab)
                      </span>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-pink-600 text-white">
                      Instagram Condition
                    </span>
                  </label>

                  {campRequireInstagram && (
                    <input
                      type="url"
                      value={campInstagramUrl}
                      onChange={(e) => setCampInstagramUrl(e.target.value)}
                      placeholder="https://www.instagram.com/flathisab"
                      className="w-full px-3 py-2 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-pink-200 dark:border-pink-800/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  )}
                </div>
              </div>

              {/* Thumbnail Picker & Live Preview */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-4 text-left">
                <div className="space-y-3">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Campaign Thumbnail (URL, Upload, or Preset)
                  </label>

                  <input
                    type="text"
                    value={campThumbnail}
                    onChange={(e) => setCampThumbnail(e.target.value)}
                    placeholder="Paste image URL or upload below..."
                    className="w-full px-3.5 py-2 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />

                  <div className="flex flex-wrap items-center gap-2">
                    <label className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider cursor-pointer flex items-center gap-1.5 border border-indigo-200/60 dark:border-indigo-800/50">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Upload Thumbnail</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailFileUpload}
                        className="hidden"
                      />
                    </label>

                    {PRESET_THUMBNAILS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCampThumbnail(preset.url)}
                        className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:border-indigo-500 cursor-pointer"
                      >
                        Preset {idx + 1}
                      </button>
                    ))}
                  </div>

                  {/* Live Thumbnail Card Preview */}
                  <div className="relative h-36 w-full rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-rose-500 border border-slate-200 dark:border-slate-800">
                    {campThumbnail && (
                      <img
                        src={campThumbnail}
                        alt="Campaign Thumbnail Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
                    <div className="absolute bottom-3 inset-x-4 flex items-end justify-between gap-2">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-amber-300 block">
                          {campReward || 'Winning Reward Preview'}
                        </span>
                        <h4 className="text-sm font-black text-white truncate">
                          {campTitle || 'Campaign Title Preview'}
                        </h4>
                      </div>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-orange-500 text-white shrink-0">
                        {campMinStreak || 0}d Streak
                      </span>
                    </div>
                  </div>
                </div>

                {campaignFormMsg && (
                  <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                    {campaignFormMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSavingCampaign}
                  className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isSavingCampaign ? 'Publishing Campaign...' : 'Publish Campaign to App'}</span>
                </button>
              </div>
            </form>

            {/* Existing Campaigns List */}
            {campaigns.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {campaigns.map((camp) => (
                  <div
                    key={camp.id}
                    className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative h-32 w-full bg-gradient-to-r from-indigo-600 to-rose-500">
                        {camp.thumbnailUrl && (
                          <img
                            src={camp.thumbnailUrl}
                            alt={camp.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent" />
                        <div className="absolute top-3 inset-x-3 flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500 text-white">
                            {camp.status}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-orange-500 text-white">
                            Min {camp.minStreakRequired || 0}d Streak
                          </span>
                        </div>
                        <div className="absolute bottom-2.5 inset-x-4 text-left">
                          <h4 className="text-sm font-black text-white">{camp.title}</h4>
                        </div>
                      </div>

                      <div className="p-4 space-y-3 text-left text-xs">
                        <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/40">
                          <div>
                            <span className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 block">
                              Winning Reward
                            </span>
                            <span className="font-black text-slate-900 dark:text-white">
                              {camp.winningReward}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] font-black uppercase text-slate-400 block">
                              Reward Date
                            </span>
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                              {camp.rewardDate}
                            </span>
                          </div>
                        </div>

                        <div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                            Conditions ({camp.conditions.length})
                          </span>
                          <ul className="list-disc list-inside text-[11px] text-slate-600 dark:text-slate-300 space-y-0.5">
                            {camp.conditions.map((c, i) => (
                              <li key={i}>{c}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Participants List */}
                        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 block mb-1.5">
                            Participants Joined ({(camp.participants || []).length})
                          </span>
                          {(camp.participants || []).length === 0 ? (
                            <p className="text-[11px] text-slate-400 italic">No participants joined yet.</p>
                          ) : (
                            <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                              {(camp.participants || []).map((p, idx) => (
                                <div
                                  key={`${p.uid}-${idx}`}
                                  className="flex items-center justify-between text-[11px] py-1 px-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
                                >
                                  <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {p.displayName} <span className="text-slate-400 font-mono">({p.email})</span>
                                  </span>
                                  <span className="text-orange-600 dark:text-orange-400 font-black">
                                    🔥 {p.streakAtJoin}d
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Winner Announcement Input */}
                        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center gap-2">
                          <input
                            type="text"
                            value={winnerInputById[camp.id] ?? camp.winnerAnnouncement ?? ''}
                            onChange={(e) =>
                              setWinnerInputById((prev) => ({ ...prev, [camp.id]: e.target.value }))
                            }
                            placeholder="Announce winner on reward date (e.g. Won by Rahul - Room #482910)..."
                            className="flex-1 px-3 py-1.5 text-[11px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveWinnerAnnouncement(camp.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase cursor-pointer"
                          >
                            Announce
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="px-4 py-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {(['active', 'upcoming', 'completed'] as const).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleUpdateCampaignStatus(camp.id, st)}
                            className={`px-2 py-1 rounded text-[9px] font-black uppercase cursor-pointer ${
                              camp.status === st
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-200/70 dark:bg-slate-800 text-slate-500'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>

                      {confirmDeleteCampId === camp.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDeleteCampaign(camp.id)}
                            className="px-2.5 py-1 bg-rose-600 text-white rounded-lg text-[9px] font-black uppercase cursor-pointer"
                          >
                            Confirm Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteCampId(null)}
                            className="px-2 py-1 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[9px] font-black uppercase cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteCampId(camp.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                          title="Delete Campaign"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Loading State */}
        {loadingData && allUsers.length === 0 && (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">
              Loading Users & Rooms from Firestore...
            </p>
          </div>
        )}

        {/* SECTION 1: OVERVIEW (Shows both Users Table & Rooms Table) */}
        {(activeSection === 'overview' || activeSection === 'users') && (
          <section className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-500" />
                  Registered Users Directory ({filteredUsers.length})
                </h2>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">
                  Complete list of users, emails, assigned rooms, UPI IDs, and membership status
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search name, email, room code..."
                    className="w-full pl-9 pr-4 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value as any)}
                  className="px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="all">All Users ({allUsers.length})</option>
                  <option value="in_room">In a Room</option>
                  <option value="no_room">No Room Joined</option>
                  <option value="room_admin">Room Admins</option>
                </select>
              </div>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="py-12 text-center text-xs font-bold text-slate-400">
                No users match your current search filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <th className="py-3 px-3">User / Name</th>
                      <th className="py-3 px-3">Email Address</th>
                      <th className="py-3 px-3">Active Room</th>
                      <th className="py-3 px-3">Role & Tier</th>
                      <th className="py-3 px-3">UPI ID</th>
                      <th className="py-3 px-3">Joined Date</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                    {filteredUsers.map((u) => (
                      <tr
                        key={u.uid}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-950/40 transition-colors"
                      >
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-black text-xs flex items-center justify-center shrink-0">
                              {(u.displayName || u.email || 'U').substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-900 dark:text-white leading-none">
                                {u.displayName || 'Unnamed User'}
                              </p>
                              <span className="text-[10px] font-mono text-slate-400 block mt-1">
                                UID: {u.uid.slice(0, 10)}...
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 font-semibold text-slate-600 dark:text-slate-300">
                          {u.email ? (
                            <span className="inline-flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {u.email}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Not provided</span>
                          )}
                        </td>

                        <td className="py-3.5 px-3">
                          {u.roomName ? (
                            <div>
                              <span className="font-extrabold text-slate-800 dark:text-slate-200 block">
                                {u.roomName}
                              </span>
                              <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                                Code: {u.roomCode}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-400">
                              No Room
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {u.roomRole && (
                              <span
                                className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                  u.roomRole === 'admin'
                                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                }`}
                              >
                                {u.roomRole === 'admin' ? 'Flat Admin' : 'Member'}
                              </span>
                            )}
                            {u.isRoomPremium ? (
                              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                <Crown className="w-2.5 h-2.5" /> Pro
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-400">
                                Free
                              </span>
                            )}
                            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center gap-1">
                              🔥 {u.streak || 0}d
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {u.upiId || '—'}
                        </td>

                        <td className="py-3.5 px-3 text-[11px] text-slate-500 dark:text-slate-400">
                          {u.createdAt
                            ? new Date(u.createdAt).toLocaleDateString(undefined, {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '—'}
                        </td>

                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {u.currentGroupId && (
                              <button
                                onClick={() => {
                                  const grp = groups.find((g) => g.id === u.currentGroupId);
                                  if (grp) setSelectedRoom(grp);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider cursor-pointer"
                              >
                                View Room
                              </button>
                            )}

                            {confirmDeleteUserId === u.uid ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDeleteUserDoc(u.uid)}
                                  className="px-2 py-1 bg-rose-600 text-white rounded-lg text-[9px] font-black uppercase cursor-pointer"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteUserId(null)}
                                  className="px-2 py-1 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[9px] font-black uppercase cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteUserId(u.uid)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                                title="Delete User Document"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* SECTION 2: ROOMS / GROUPS MANAGEMENT */}
        {(activeSection === 'overview' || activeSection === 'rooms') && (
          <section className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Home className="w-4 h-4 text-emerald-500" />
                  Active Flatmate Rooms ({filteredRooms.length})
                </h2>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">
                  Inspect room members, total split expenses, and manage ₹59/mo Ad-Free subscriptions
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={roomSearch}
                    onChange={(e) => setRoomSearch(e.target.value)}
                    placeholder="Search room name, 6-digit code..."
                    className="w-full pl-9 pr-4 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <select
                  value={roomFilter}
                  onChange={(e) => setRoomFilter(e.target.value as any)}
                  className="px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="all">All Rooms ({groups.length})</option>
                  <option value="premium">Ad-Free Premium Rooms</option>
                  <option value="free">Free Tier Rooms</option>
                </select>
              </div>
            </div>

            {filteredRooms.length === 0 ? (
              <div className="py-12 text-center text-xs font-bold text-slate-400">
                No rooms found matching your criteria.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredRooms.map((grp) => {
                  const isPrem = Boolean(
                    grp.isPremium && (!grp.premiumUntil || new Date(grp.premiumUntil).getTime() > Date.now())
                  );
                  return (
                    <div
                      key={grp.id}
                      className="p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col justify-between gap-4 hover:border-indigo-500/40 transition-all"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                                {grp.name}
                              </h3>
                              <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/40 dark:border-indigo-800/40">
                                #{grp.code}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                              Created {grp.createdAt ? new Date(grp.createdAt).toLocaleDateString() : '—'} • ID: {grp.id.slice(0, 8)}...
                            </p>
                          </div>

                          <span
                            className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1 ${
                              isPrem
                                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50'
                                : 'bg-slate-200/70 dark:bg-slate-800 text-slate-500'
                            }`}
                          >
                            {isPrem ? (
                              <>
                                <Crown className="w-3 h-3 text-amber-500" /> Ad-Free Pro
                              </>
                            ) : (
                              'Free Tier (Ads)'
                            )}
                          </span>
                        </div>

                        {/* Room Stats Row */}
                        <div className="grid grid-cols-3 gap-2 pt-1">
                          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80">
                            <span className="text-[9px] font-black uppercase text-slate-400 block">
                              Flatmates
                            </span>
                            <span className="text-sm font-black text-slate-800 dark:text-white">
                              {(grp.members || []).length}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80">
                            <span className="text-[9px] font-black uppercase text-slate-400 block">
                              Bills Split
                            </span>
                            <span className="text-sm font-black text-slate-800 dark:text-white">
                              {grp.expensesCount}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80">
                            <span className="text-[9px] font-black uppercase text-slate-400 block">
                              Volume
                            </span>
                            <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                              ₹{Math.round(grp.totalExpenseAmount).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>

                        {/* Members Chips */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {(grp.members || []).map((m) => (
                            <span
                              key={m.uid}
                              className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                            >
                              {m.displayName} {m.role === 'admin' ? '★' : ''}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Room Admin Controls */}
                      <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between gap-2">
                        <button
                          onClick={() => setSelectedRoom(grp)}
                          className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" /> Inspect Room
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleRoomPremium(grp)}
                            disabled={togglingPremiumId === grp.id}
                            className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all ${
                              isPrem
                                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60'
                                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60'
                            }`}
                          >
                            {togglingPremiumId === grp.id
                              ? 'Updating...'
                              : isPrem
                              ? 'Revoke Pro'
                              : 'Grant 30d Pro'}
                          </button>

                          {confirmDeleteRoomId === grp.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDeleteRoomDoc(grp.id)}
                                className="px-2 py-1.5 bg-rose-600 text-white rounded-lg text-[9px] font-black uppercase cursor-pointer"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => setConfirmDeleteRoomId(null)}
                                className="px-2 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[9px] font-black uppercase cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteRoomId(grp.id)}
                              className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                              title="Delete Room"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* SECTION 3: GLOBAL LEDGER FEED */}
        {activeSection === 'ledger' && (
          <section className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-500" />
                Global Expense Splits Feed ({globalExpenses.length})
              </h2>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                Real-time chronological log of every bill split across all rooms
              </p>
            </div>

            {globalExpenses.length === 0 ? (
              <div className="py-12 text-center text-xs font-bold text-slate-400">
                No expenses recorded across any rooms yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {globalExpenses.map((exp) => (
                  <div key={`${exp.groupCode}-${exp.id}`} className="py-3.5 flex items-center justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-mono text-[10px] font-black">
                          {exp.groupName} (#{exp.groupCode})
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 text-[9px] font-black uppercase">
                          {exp.category}
                        </span>
                        <h4 className="font-extrabold text-slate-900 dark:text-white">{exp.title}</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                        Paid by <span className="font-bold text-slate-700 dark:text-slate-200">{exp.payerName}</span> • Split among {(exp.splits || []).map((s) => s.displayName).join(', ')}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-black text-slate-900 dark:text-white block">
                        ₹{Math.round(exp.amount).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {exp.date}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Room Inspector Modal */}
      <AnimatePresence>
        {selectedRoom && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      {selectedRoom.name}
                    </h3>
                    <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                      Code: {selectedRoom.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">
                    Room ID: {selectedRoom.id}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedRoom(null)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 text-left">
                {/* Room Members */}
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                    Room Members ({(selectedRoom.members || []).length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(selectedRoom.members || []).map((m) => (
                      <div
                        key={m.uid}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                            {m.displayName}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">{m.email || m.uid}</p>
                        </div>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                          {m.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Room Expenses */}
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                    Recorded Bills ({selectedRoom.expensesList.length}) • Total ₹{Math.round(selectedRoom.totalExpenseAmount).toLocaleString('en-IN')}
                  </h4>
                  {selectedRoom.expensesList.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No expenses recorded in this room.</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {selectedRoom.expensesList.map((exp) => (
                        <div
                          key={exp.id}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div>
                            <p className="font-extrabold text-slate-800 dark:text-white">{exp.title}</p>
                            <p className="text-[10px] text-slate-400">
                              Paid by {exp.payerName} • {exp.date}
                            </p>
                          </div>
                          <span className="font-black text-indigo-600 dark:text-indigo-400">
                            ₹{Math.round(exp.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
