import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  TrendingDown, 
  TrendingUp, 
  Plus, 
  Users, 
  LogOut, 
  Clock, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  CheckCheck, 
  Bell, 
  Trash2, 
  Coins, 
  Share2, 
  Copy, 
  Info, 
  X, 
  ChevronDown,
  User,
  CheckCircle,
  HelpCircle,
  MessageSquare,
  DollarSign,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useRoom } from './context/RoomContext';
import AuthScreen from './components/AuthScreen';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsConditions from './components/TermsConditions';
import { PullToRefresh } from './components/PullToRefresh';
import { AppNotification, GroupMember, Expense, Settlement } from './types';

const App: React.FC = () => {
  const { user, profile, loading, signOut, updateUserProfile } = useAuth();
  const { 
    currentGroup, 
    expenses, 
    settlements, 
    notifications,
    loadingGroup, 
    createGroup, 
    joinGroup, 
    addExpense, 
    deleteExpense,
    addSettlement,
    markNotificationRead,
    memberBalances,
    suggestedSettlements,
    resetGroup,
    refreshData
  } = useRoom();

  // Navigation states
  const [activeTab, setActiveTab] = useState<'dashboard' | 'split' | 'settle' | 'history' | 'room'>('dashboard');
  
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('spendwise-dark');
    return saved ? saved === 'true' : true;
  });

  // Profile Edit states
  const [editName, setEditName] = useState('');
  const [editUpi, setEditUpi] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    if (profile) {
      setEditName(profile.displayName || '');
      setEditUpi(profile.upiId || '');
    }
  }, [profile]);

  // UI operational states
  const [newRoomName, setNewRoomName] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [isSubmittingRoom, setIsSubmittingRoom] = useState(false);
  const [roomError, setRoomError] = useState('');
  const [roomSuccess, setRoomSuccess] = useState('');
  const [onboardingChoice, setOnboardingChoice] = useState<'select' | 'create' | 'join'>('select');

  // Auto-join from URL invite state
  const [inviteJoinCode, setInviteJoinCode] = useState<string | null>(null);
  const [showInvitePrompt, setShowInvitePrompt] = useState(false);

  // New Expense form states
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Others');
  const [selectedPayer, setSelectedPayer] = useState('');
  const [selectedRoommates, setSelectedRoommates] = useState<string[]>([]);
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);
  const [expenseError, setExpenseError] = useState('');
  const [expenseSuccess, setExpenseSuccess] = useState('');

  // Settlement manual payment helper states
  const [currentSettlementTarget, setCurrentSettlementTarget] = useState<any | null>(null);
  const [isSubmittingSettlement, setIsSubmittingSettlement] = useState(false);

  // Notification panel drawer
  const [showNotifications, setShowNotifications] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Sync dark class on mount and mode changes
  useEffect(() => {
    localStorage.setItem('spendwise-dark', String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Read URL query parameter "?join=123456" for roommate invitation link auto-onboarding
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get('join');
    if (joinCode && joinCode.trim().length === 6) {
      setInviteJoinCode(joinCode.trim());
      setShowInvitePrompt(true);
      // Clean query parameter silently without refreshing
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Update roommate checked states once group details load
  useEffect(() => {
    if (currentGroup && currentGroup.members) {
      // Default checking all existing roommates to split list
      setSelectedRoommates((currentGroup.members || []).map(m => m?.uid).filter(Boolean));
      if (user) {
        setSelectedPayer(user.uid);
      }
    }
  }, [currentGroup, user]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) {
      setRoomError('Please specify an elegant Room name.');
      return;
    }
    setRoomError('');
    setRoomSuccess('');
    setIsSubmittingRoom(true);
    try {
      await createGroup(newRoomName.trim());
      setRoomSuccess(`Room "${newRoomName}" created successfully!`);
      setNewRoomName('');
    } catch (err: any) {
      setRoomError('Failed to create Room. Try again.');
      console.error(err);
    } finally {
      setIsSubmittingRoom(false);
    }
  };

  const handleJoinRoom = async (codeStr: string) => {
    const sanitized = codeStr.trim();
    if (sanitized.length !== 6) {
      setRoomError('Join code must be exactly 6 digits.');
      return;
    }
    setRoomError('');
    setRoomSuccess('');
    setIsSubmittingRoom(true);
    try {
      const isOk = await joinGroup(sanitized);
      if (isOk) {
        setRoomSuccess('Connected! Welcome to your roommate group!');
        setJoinCodeInput('');
        setShowInvitePrompt(false);
        setInviteJoinCode(null);
      } else {
        setRoomError('Invalid Room code. Verify the 6-digit invite.');
      }
    } catch (err: any) {
      setRoomError('Error joining Room. Recheck code.');
    } finally {
      setIsSubmittingRoom(false);
    }
  };

  const handleManualAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setExpenseError('');
    setExpenseSuccess('');

    const parsedAmount = parseFloat(expenseAmount);
    if (!expenseTitle.trim()) {
      setExpenseError('Please enter what the expense was for.');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setExpenseError('Please specify a positive price amount.');
      return;
    }
    if (selectedRoommates.length === 0) {
      setExpenseError('Please check at least 1 roommate to split with.');
      return;
    }

    setIsSubmittingExpense(true);
    try {
      // Calculate equal split values dynamically
      const shareAmount = parsedAmount / selectedRoommates.length;
      
      // Get display name mapping
      const memberNames: Record<string, string> = {};
      currentGroup?.members.forEach(m => {
        memberNames[m.uid] = m.displayName;
      });

      const splits = selectedRoommates.map(uid => ({
        uid,
        displayName: memberNames[uid] || 'Roommate',
        amount: shareAmount
      }));

      // Find selected payer details
      const payerId = selectedPayer || user?.uid || '';
      const payerName = currentGroup?.members.find(m => m.uid === payerId)?.displayName || profile?.displayName || 'Roommate';

      await addExpense(
        expenseTitle.trim(),
        parsedAmount,
        expenseCategory,
        'equal',
        splits,
        payerId,
        payerName
      );

      // Reset form states elegantly
      setExpenseTitle('');
      setExpenseAmount('');
      setExpenseSuccess('Expense added and split notifications sent out!');
      // Back to dashboard
      setTimeout(() => {
        setExpenseSuccess('');
        setActiveTab('dashboard');
      }, 1500);
    } catch (err: any) {
      setExpenseError('Failed to save expense splits. Check permissions.');
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  const triggerSettleUp = async () => {
    if (!currentSettlementTarget || !user) return;
    setIsSubmittingSettlement(true);
    try {
      const { fromId, fromName, toId, toName, amount } = currentSettlementTarget;
      // Register immediate database settlement log entries on the roommate network
      await addSettlement(fromId, fromName, toId, toName, amount);
      setCurrentSettlementTarget(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingSettlement(false);
    }
  };

  const handleCopyInviteLink = () => {
    if (!currentGroup) return;
    const invitationLink = `${window.location.origin}/?join=${currentGroup.code}`;
    navigator.clipboard.writeText(invitationLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      setProfileError('Display Name cannot be empty');
      return;
    }
    setIsSavingProfile(true);
    setProfileError('');
    setProfileSaveSuccess(false);
    try {
      await updateUserProfile(editName, editUpi);
      setProfileSaveSuccess(true);
      setTimeout(() => setProfileSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setProfileError(err?.message || 'Failed to update profile settings.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Pre-calculate user overall net debtor / creditor numbers
  const myNetBalance = user ? (memberBalances[user.uid] || 0) : 0;

  // Intercept Privacy Policy and Terms and Conditions pages
  const location = useLocation();
  if (location.pathname === '/privacy') {
    return <PrivacyPolicy />;
  }
  if (location.pathname === '/terms') {
    return <TermsConditions />;
  }
  
  // Loading skeleton screen
  if (loading || (user && loadingGroup)) {
    return (
      <div className={`min-h-screen flex flex-col justify-center items-center ${darkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-800'}`}>
        <div className="space-y-4 text-center">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-4 border-indigo-600/25 dark:border-indigo-400/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <Coins className="w-6 h-6 text-indigo-505 absolute inset-0 m-auto animate-pulse" />
          </div>
          <p className="text-xs uppercase tracking-widest font-black text-slate-400 dark:text-slate-500">
            Syncing Ledger Engine...
          </p>
        </div>
      </div>
    );
  }

  // Not logged in -> Show polished credentials access screen
  if (!user) {
    return <AuthScreen darkMode={darkMode} setDarkMode={setDarkMode} />;
  }

  // Logged-in but has no active Room -> Provide invitations & join panel
  if (!currentGroup) {
    return (
      <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-slate-950 text-white dark' : 'bg-slate-50 text-slate-900'}`}>
        
        {/* Subtle decorative background gradients */}
        <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-indigo-50/50 dark:from-indigo-950/10 to-transparent pointer-events-none" />

        {/* Global Nav for onboarding */}
        <header className="py-6 px-6 max-w-4xl w-full mx-auto flex justify-between items-center relative z-25">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Coins className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-slate-900 dark:text-white leading-none">SpendWise</h2>
              <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400">Flatmate Ledger</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Dark mode switcher */}
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 bg-white dark:bg-slate-900 border border-slate-150/40 dark:border-slate-800 rounded-xl shadow-sm hover:bg-slate-100 transition-all cursor-pointer"
            >
              {darkMode ? <span className="text-xs">☀️</span> : <span className="text-xs">🌙</span>}
            </button>
            <button 
              onClick={signOut}
              className="p-2 text-rose-500 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/20 dark:border-rose-900/40 rounded-xl flex items-center gap-1 text-xs font-bold transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </header>

        <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-8 flex flex-col justify-center relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-none text-slate-900 dark:text-white mb-3">
              Roommate Expenses, <span className="text-indigo-600 dark:text-indigo-400">Simplified</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              Instantly split rent, utility bills, groceries, and other shared expenses with your roommates. Automatically simplify balances to settle up quickly.
            </p>
          </div>

          {onboardingChoice === 'select' && (
            <div className="max-w-2xl mx-auto w-full space-y-6">
              <div className="text-center mb-2">
                <span className="inline-block px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-full text-[9px] font-black uppercase tracking-widest">
                  Getting Started
                </span>
                <h2 className="text-lg font-black text-slate-800 dark:text-slate-200 mt-2 uppercase tracking-wide">
                  Choose an Option to Continue
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                {/* Option 1: Create a Room */}
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setRoomError('');
                    setRoomSuccess('');
                    setOnboardingChoice('create');
                  }}
                  className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800 shadow-xl flex flex-col items-start text-left cursor-pointer transition-all group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <Plus className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-850 dark:text-slate-200 mb-2">
                    Create a New Room
                  </h3>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-4 text-indigo-600 dark:text-indigo-400">
                    Bootstrap flat code
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                    Set up a brand new roommate group. You will get a unique join code and invitations to easily add your roommates.
                  </p>
                  <div className="mt-6 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    <span>Create Room</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-all" />
                  </div>
                </motion.button>

                {/* Option 2: Join an Existing Room */}
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setRoomError('');
                    setRoomSuccess('');
                    setOnboardingChoice('join');
                  }}
                  className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800 shadow-xl flex flex-col items-start text-left cursor-pointer transition-all group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-850 dark:text-slate-200 mb-2">
                    Join Roommate Flat
                  </h3>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-4 text-emerald-600 dark:text-emerald-400">
                    Use Invite Code
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                    Belong to an ongoing flat configuration? Input the 6-digit invitation access key shared by your flatmates to synchronize with them.
                  </p>
                  <div className="mt-6 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    <span>Join Room</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-all" />
                  </div>
                </motion.button>
              </div>
            </div>
          )}

          {onboardingChoice === 'create' && (
            <div className="max-w-md mx-auto w-full">
              <button 
                onClick={() => setOnboardingChoice('select')}
                className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 hover:opacity-80 mb-6 transition-all"
              >
                <ArrowLeft className="w-4 h-4" /> Back to options
              </button>

              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800 shadow-xl"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <Plus className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-slate-850 dark:text-slate-200">Create Flat Code</h3>
                      <span className="text-[10px] text-slate-400">Bootstrap a new room for flatmates</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                    Create a private roommate group. You will get a unique join code and shareable invitation links to easily add your roommates.
                  </p>

                  <form onSubmit={handleCreateRoom} className="space-y-3 pt-2">
                    <div>
                      <label className="block text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">
                        Room / Flat Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Flat 302, Green Fields"
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                        className="w-full text-xs font-bold px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingRoom}
                      className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-750 disabled:opacity-50 text-white font-black text-2xs uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                    >
                      {isSubmittingRoom ? 'Generating...' : 'Establish Flat'}
                    </button>
                  </form>
                </div>
              </motion.div>
            </div>
          )}

          {onboardingChoice === 'join' && (
            <div className="max-w-md mx-auto w-full">
              <button 
                onClick={() => setOnboardingChoice('select')}
                className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 hover:opacity-80 mb-6 transition-all"
              >
                <ArrowLeft className="w-4 h-4" /> Back to options
              </button>

              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800 shadow-xl"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-slate-850 dark:text-slate-200">Join Roommate Flat</h3>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-emerald-600">Enter Invite Code</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                    Belong to an ongoing flat configuration? Input the 6-digit invitation access key shared by your flatmates to synchronize with them.
                  </p>

                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">
                        6-Digit Code
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="e.g. 564903"
                        value={joinCodeInput}
                        onChange={(e) => setJoinCodeInput(e.target.value)}
                        className="w-full text-center text-sm font-extrabold px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white uppercase tracking-widest"
                      />
                    </div>

                    <button
                      onClick={() => handleJoinRoom(joinCodeInput)}
                      disabled={isSubmittingRoom || joinCodeInput.trim().length !== 6}
                      className="w-full py-3.5 bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-white font-black text-2xs uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                    >
                      {isSubmittingRoom ? 'Verifying Room...' : 'Join Flat'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Messages display */}
          <div className="max-w-md mx-auto mt-6 text-center">
            {roomError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 rounded-xl text-xs font-semibold">
                {roomError}
              </div>
            )}
            {roomSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 rounded-xl text-xs font-semibold">
                {roomSuccess}
              </div>
            )}
          </div>
        </main>

        {/* Global Footer */}
        <footer className="py-6 text-center text-[10px] font-black uppercase tracking-widest text-slate-400/80">
          SpendWise Roommate Splitter
        </footer>

        {/* Invitation link popup triggers */}
        <AnimatePresence>
          {showInvitePrompt && inviteJoinCode && (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 max-w-sm w-full text-center space-y-4"
              >
                <div className="w-12 h-12 rounded-3xl bg-indigo-50 dark:bg-indigo-950/50 mx-auto flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Invitation Found!</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-bold">
                  You opened an invitation link to connect to Room Code <span className="font-mono text-indigo-600 dark:text-indigo-300 font-extrabold text-sm">{inviteJoinCode}</span>.
                </p>
                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={() => handleJoinRoom(inviteJoinCode)}
                    disabled={isSubmittingRoom}
                    className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-2xs uppercase tracking-widest font-black cursor-pointer"
                  >
                    Accept & Join
                  </button>
                  <button
                    onClick={() => {
                      setShowInvitePrompt(false);
                      setInviteJoinCode(null);
                    }}
                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 rounded-xl text-2xs uppercase tracking-widest font-black cursor-pointer"
                  >
                    Ignore
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Active room loaded -> Render main tab dashboard with beautiful roommate interface
  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-slate-950 text-white dark' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Decorative top ambient block */}
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-indigo-50/40 dark:from-indigo-950/5 to-transparent pointer-events-none" />

      {/* Main sticky high-contrast header */}
      <header className="sticky top-0 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md border-b border-slate-100 dark:border-slate-900/60 py-4 px-6 relative z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <Coins className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="block text-[8px] font-mono tracking-wider text-slate-400 dark:text-slate-500 uppercase font-black">
                Active FLAT
              </span>
              <h2 className="font-black text-sm text-slate-900 dark:text-white leading-none">
                {currentGroup.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Dark mode */}
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm hover:bg-slate-100 transition-all cursor-pointer"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>

            {/* Notification drop indicator */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm transition-all hover:bg-slate-100 cursor-pointer ${
                  notifications.filter(n => !n.read).length > 0 ? 'ring-2 ring-indigo-550 border-transparent animate-pulse' : ''
                }`}
              >
                <Bell className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                )}
              </button>

              {/* Notification Drawer Popover */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    className="absolute right-0 mt-2.5 w-80 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl p-4 space-y-3 z-50 text-left max-h-[360px] overflow-y-auto"
                  >
                    <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-850/40 pb-2">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
                        Roommate Splits Feed
                      </h4>
                      <button 
                        onClick={() => setShowNotifications(false)}
                        className="text-[10px] text-slate-400 uppercase font-black"
                      >
                        Close
                      </button>
                    </div>

                    <div className="space-y-2.5 divide-y divide-slate-50 dark:divide-slate-850/40">
                      {notifications.length === 0 ? (
                        <div className="text-center py-6 text-slate-400 text-[10px] font-bold">
                          All settled! No new split alerts.
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div 
                            key={notif.id} 
                            onClick={async () => {
                              if (!notif.read) {
                                await markNotificationRead(notif.id);
                              }
                            }}
                            className={`pt-2 flex items-start gap-2.5 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-950/20 p-1.5 rounded-lg transition-colors ${
                              !notif.read ? 'bg-indigo-50/30 dark:bg-indigo-950/10' : 'opacity-80'
                            }`}
                          >
                            <div className="w-2 h-2 mt-1.5 shrink-0 rounded-full bg-indigo-500" />
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold text-slate-700 dark:text-slate-350 leading-tight">
                                {notif.text}
                              </p>
                              <span className="block text-[8px] text-slate-400">
                                {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Avatar Widget */}
            <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-slate-100 dark:border-slate-850">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                <User className="w-4 h-4 text-slate-500" />
              </div>
              <span className="font-bold text-xs max-w-[80px] truncate">{profile?.displayName || 'Roommate'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Primary Workspace container */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 pt-8 pb-24 relative z-10">

        {/* Dynamic Navigation Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-900 mb-8 overflow-x-auto gap-2 no-scrollbar">
          {[
            { id: 'dashboard', name: 'Dashboard' },
            { id: 'split', name: '+ Split Bill' },
            { id: 'settle', name: 'Settle Debts' },
            { id: 'history', name: 'History Logs' },
            { id: 'room', name: 'My Profile & Room' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-indigo-650 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 font-bold'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Tab view routes */}
        <div className="min-h-[400px]">
          
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <PullToRefresh onRefresh={refreshData}>
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
              {/* Dynamic Overall Split Card */}
              <div className="relative overflow-hidden p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                
                {/* Background ambient subtle circle blur */}
                <div className="absolute -right-20 -bottom-20 w-48 h-48 bg-indigo-500/10 dark:bg-indigo-450/5 rounded-full blur-2xl pointer-events-none" />

                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 dark:text-slate-500 block mb-1">
                      Your General Debt standing
                    </span>
                    <h3 className="text-xl font-bold text-slate-850 dark:text-slate-200">
                      Balance Ledger Summary
                    </h3>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className={`text-4xl font-black ${
                      myNetBalance > 1 ? 'text-emerald-600 dark:text-emerald-400' :
                      myNetBalance < -1 ? 'text-rose-500 dark:text-rose-450' : 'text-slate-800 dark:text-white'
                    }`}>
                      ₹{Math.abs(Math.round(myNetBalance))}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">
                      {myNetBalance > 1 ? 'Owed to you overall' :
                       myNetBalance < -1 ? 'You owe overall' : 'Settle state reached'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-450 dark:text-slate-400 leading-relaxed font-semibold max-w-md">
                    {myNetBalance > 1 
                      ? 'Roommates have active splittages to return back to you. Click Settle Up to copy individual UPI values.'
                      : myNetBalance < -1 
                        ? 'Ensure to clear roommate dues on time to boost your Roommate Score metric!'
                        : 'Awesome! All flatmate accounts are perfectly synced and balanced.'}
                  </p>
                </div>

                {/* Quick actions box */}
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto shrink-0 relative z-10">
                  <button 
                    onClick={() => setActiveTab('split')}
                    className="px-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 shrink-0" /> Split Expense
                  </button>
                  <button 
                    onClick={() => setActiveTab('settle')}
                    className="px-5 py-3.5 bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Coins className="w-4 h-4 shrink-0 animate-bounce" /> Settle Up
                  </button>
                </div>
              </div>

              {/* Roommate Dues Breakdown Layout */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Peer Roommate list debt card */}
                <div className="md:col-span-7 bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 border border-slate-100 dark:border-slate-800 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-850 pb-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-indigo-500" />
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white">
                        Roommate Debt Split network
                      </h4>
                    </div>
                    <span className="text-[9px] font-mono font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/40 px-2 py-1 rounded-full border border-indigo-100/10">
                      State Checked
                    </span>
                  </div>

                  <div className="space-y-4 pt-1 max-h-[300px] overflow-y-auto pr-1">
                    {currentGroup.members.length <= 1 ? (
                      <div className="text-center py-8 space-y-2">
                        <Users className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                        <p className="text-xs text-slate-400 font-bold">No roommate joined yet.</p>
                        <p className="text-[10px] text-slate-450 dark:text-slate-500">Go to Room & Invites to text their join links now!</p>
                      </div>
                    ) : (
                      currentGroup.members
                        .filter(member => member.uid !== user?.uid)
                        .map((member) => {
                          // Find this roommate's net relative stand
                          // Note: simplified balances are suggested in suggested settlements
                          // For direct absolute: we locate individual contribution
                          const relativeBal = memberBalances[member.uid] || 0;
                          
                          return (
                            <div key={member.uid} className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 px-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-850/30">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-xs font-bold text-slate-500">
                                  {member.displayName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <h5 className="text-xs font-black text-slate-800 dark:text-white leading-none mb-1">
                                    {member.displayName}
                                  </h5>
                                  <span className="text-[9px] text-slate-400 font-bold block max-w-[140px] truncate">
                                    {member.email}
                                  </span>
                                </div>
                              </div>

                              <div className="text-right">
                                {/* We map balance: if relativeBal is positive, they are a creditor, if negative, they are a debtor.
                                    But in roommate relative stand, we show if we have to take or give. */}
                                {suggestedSettlements.some(s => s.fromId === member.uid && s.toId === user?.uid) ? (
                                  <div className="space-y-0.5">
                                    <span className="block text-[11px] font-black text-emerald-600 dark:text-emerald-450 leading-none">
                                      owes you ₹{Math.round(suggestedSettlements.find(s => s.fromId === member.uid && s.toId === user?.uid)?.amount || 0)}
                                    </span>
                                    <span className="text-[8px] uppercase tracking-widest text-slate-450 dark:text-slate-500 font-bold">
                                      Payable to you
                                    </span>
                                  </div>
                                ) : suggestedSettlements.some(s => s.fromId === user?.uid && s.toId === member.uid) ? (
                                  <div className="space-y-0.5">
                                    <span className="block text-[11px] font-black text-rose-550 dark:text-rose-450 leading-none">
                                      you owe them ₹{Math.round(suggestedSettlements.find(s => s.fromId === user?.uid && s.toId === member.uid)?.amount || 0)}
                                    </span>
                                    <span className="text-[8px] uppercase tracking-widest text-slate-450 dark:text-slate-500 font-bold">
                                      Due to roommate
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[10px] font-bold text-slate-400">
                                    Settled state
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>

                {/* Flat details & scorecard block */}
                <div className="md:col-span-5 flex flex-col gap-6">
                  
                  {/* Ledger Specs Card */}
                  <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 border border-slate-100 dark:border-slate-800 shadow-xl space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-50 dark:border-slate-850 pb-2">
                      <Info className="w-4 h-4 text-indigo-500" />
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white">
                        Group Statistics
                      </h4>
                    </div>

                    <div className="space-y-3.5 pt-1 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-850/50">
                        <span className="text-slate-400 font-bold">Flat Invite Code</span>
                        <span className="font-mono text-indigo-650 dark:text-indigo-400 font-black">
                          {currentGroup.code}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-850/50">
                        <span className="text-slate-400 font-bold">Total Expenses Logged</span>
                        <span className="font-black text-slate-800 dark:text-white">
                          {expenses.length} entries
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400 font-bold">Flatmate Score</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-lg text-[10px]">
                          {profile?.roommateScore || 100} / 100
                        </span>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-450 dark:text-slate-500 leading-relaxed font-bold">
                      Keep your roommate score at 100 by validating splitted billing settlements immediately when asked.
                    </p>
                  </div>

                  {/* Quick notification stream summary box */}
                  <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-[2rem] p-6 shadow-xl space-y-3 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] tracking-widest uppercase font-black opacity-80">
                        Roommate Notice
                      </p>
                      <h4 className="text-sm font-black mt-1 leading-snug">
                        Real-time Splits Alerts
                      </h4>
                      <p className="text-[10px] opacity-90 leading-relaxed font-bold mt-1 max-w-[200px]">
                        Every roommate is verified instantly when added to splits via live Web Sockets.
                      </p>
                    </div>

                    <div className="pt-3 border-t border-indigo-500/40 flex justify-between items-center text-[9px] font-black uppercase tracking-wider">
                      <span>UPI Standard Capable</span>
                      <span className="text-indigo-300">Enabled</span>
                    </div>
                  </div>

                </div>

              </div>
            </motion.div>
            </PullToRefresh>
          )}

          {/* TAB 2: SPLIT AN EXPENSE */}
          {activeTab === 'split' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-xl space-y-6">
                
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Split New Roommate Expense
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed mt-1 font-semibold">
                    Set up expenses to split equally among selected roommates automatically. Splitted alerts are fired immediately with real-time feedback.
                  </p>
                </div>

                <form onSubmit={handleManualAddExpense} className="space-y-4">
                  {/* Expense Error / Success alerts */}
                  {expenseError && (
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 rounded-xl text-xs font-semibold">
                      {expenseError}
                    </div>
                  )}
                  {expenseSuccess && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 rounded-xl text-xs font-semibold">
                      {expenseSuccess}
                    </div>
                  )}

                  {/* Row: Title and Amount */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 px-0.5">
                        Expense For (Name)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. WiFi Bill"
                        value={expenseTitle}
                        onChange={(e) => setExpenseTitle(e.target.value)}
                        className="w-full text-xs font-bold px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 px-0.5">
                        Price Amount (₹ INR)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="e.g. 1500"
                        value={expenseAmount}
                        onChange={(e) => setExpenseAmount(e.target.value)}
                        className="w-full text-xs font-bold px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Payer Selection */}
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 px-0.5">
                      Paid By
                    </label>
                    <select
                      value={selectedPayer}
                      onChange={(e) => setSelectedPayer(e.target.value)}
                      className="w-full text-xs font-bold px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white cursor-pointer"
                    >
                      {currentGroup.members.map(m => (
                        <option key={m.uid} value={m.uid}>
                          {m.uid === user?.uid ? `You (${m.displayName})` : m.displayName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Roommate Checklist selection */}
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-0.5">
                      Check Roommates to include in split
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto border border-slate-100 dark:border-slate-850/50 p-3 rounded-2xl">
                      {currentGroup.members.map((member) => (
                        <label 
                          key={member.uid} 
                          className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl hover:bg-slate-100/60 dark:hover:bg-slate-900 cursor-pointer transition-colors"
                        >
                          <input 
                            type="checkbox"
                            checked={selectedRoommates.includes(member.uid)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRoommates(prev => [...prev, member.uid]);
                              } else {
                                setSelectedRoommates(prev => prev.filter(id => id !== member.uid));
                              }
                            }}
                            className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 pointer-events-auto"
                          />
                          <div className="text-left">
                            <span className="block text-xs font-bold text-slate-700 dark:text-slate-350 leading-none">
                              {member.displayName}
                            </span>
                            <span className="text-[8px] text-slate-400">
                              {member.uid === user?.uid ? 'Payer focus' : 'Flatmate'}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic split layout calculator */}
                  {selectedRoommates.length > 0 && expenseAmount && parseFloat(expenseAmount) > 0 && (
                    <div className="p-4 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100/20 dark:border-indigo-900/40 rounded-2xl space-y-1 text-center">
                      <span className="text-[8px] uppercase tracking-widest text-slate-400 font-black block">
                        Auto equal split live calculator
                      </span>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        ₹{expenseAmount} split equally among {selectedRoommates.length} roommate{selectedRoommates.length > 1 ? 's' : ''} = 
                        <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 pl-1.5">
                          ₹{(parseFloat(expenseAmount) / selectedRoommates.length).toFixed(2)} each
                        </span>
                      </p>
                    </div>
                  )}

                  {/* Submit split */}
                  <button
                    type="submit"
                    disabled={isSubmittingExpense}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-750 text-white font-black uppercase tracking-widest text-2xs rounded-2xl shadow-lg transition-all active:scale-98 cursor-pointer"
                  >
                    {isSubmittingExpense ? 'Broadcasting Splits...' : 'Authorize Split Bill'}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* TAB 3: SETTLEMENT MATCHMAKING ENGINE */}
          {activeTab === 'settle' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Dynamic simplify matches section */}
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-xl space-y-4">
                
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Debt Simplification
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-450 font-semibold leading-relaxed mt-1">
                    SpendWise automatically optimizes debt chains to suggest the minimum number of transactions needed to settle all roommate dues.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  {suggestedSettlements.length === 0 ? (
                    <div className="text-center py-10 space-y-3 border border-dashed border-slate-150 dark:border-slate-800 rounded-3xl">
                      <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
                      <p className="text-xs text-slate-450 font-extrabold uppercase tracking-wider block">
                        All roommate accounts are settled!
                      </p>
                      <p className="text-[10px] text-slate-400">
                        No outstanding relative dues are active right now. Free of debts!
                      </p>
                    </div>
                  ) : (
                    suggestedSettlements.map((settle, i) => {
                      const isMeOwer = settle.fromId === user?.uid;
                      const isMeOwed = settle.toId === user?.uid;
                      
                      return (
                        <div 
                          key={i} 
                          className={`p-4 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all ${
                            isMeOwer 
                              ? 'bg-rose-50/20 border-rose-200/40 dark:bg-rose-950/5' 
                              : isMeOwed 
                                ? 'bg-emerald-50/20 border-emerald-200/40 dark:bg-emerald-950/5' 
                                : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-850/40'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-500 flex items-center justify-center font-bold">
                              {settle.fromName.charAt(0).toUpperCase()}
                            </div>
                            <div className="space-y-0.5 text-left">
                              <p className="text-xs font-black">
                                <span className="text-indigo-600 dark:text-indigo-400">{settle.fromName}</span> owes {' '}
                                <span className="text-emerald-600 dark:text-emerald-450">{settle.toName}</span>
                              </p>
                              <span className="block text-[8px] uppercase tracking-widest text-slate-400 font-bold">
                                Suggested split balance settlement
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3.5 w-full sm:w-auto justify-between sm:justify-start">
                            <span className="text-lg font-black text-slate-850 dark:text-white">
                              ₹{Math.round(settle.amount)}
                            </span>

                            {isMeOwer ? (
                              <button
                                onClick={() => setCurrentSettlementTarget(settle)}
                                className="px-3.5 py-2 bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl text-[10px] uppercase tracking-widest font-black transition-all cursor-pointer"
                              >
                                Clear Due Now
                              </button>
                            ) : (
                              <span className="text-[10px] uppercase font-mono bg-slate-100 dark:bg-slate-850 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-lg">
                                {isMeOwed ? 'Receive focus' : 'General network'}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Settlements log listings */}
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 border border-slate-100 dark:border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-850 pb-3">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white">
                    Verified Settlements Feed
                  </h4>
                  <span className="text-[9px] text-slate-450 uppercase font-bold bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded-lg">
                    Real-time Logs
                  </span>
                </div>

                <div className="space-y-3 pt-1 max-h-[220px] overflow-y-auto pr-1">
                  {settlements.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-[10px] font-bold">
                      No past settlement records present.
                    </div>
                  ) : (
                    settlements.map((set) => (
                      <div key={set.id} className="flex justify-between items-center text-xs py-2 border-b border-slate-50 dark:border-slate-850/30">
                        <div className="text-left">
                          <p className="font-extrabold text-slate-700 dark:text-slate-300">
                            {set.fromName} paid {set.toName}
                          </p>
                          <span className="text-[8px] font-mono text-slate-400 block tracking-wider mt-0.5">
                            UPI TXN: {set.upiTxnId} • {new Date(set.createdAt).toDateString()}
                          </span>
                        </div>
                        <span className="font-black text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded-lg text-[10.5px]">
                          ₹{Math.round(set.amount)} Paid
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Settle modal dialog box */}
              <AnimatePresence>
                {currentSettlementTarget && (
                  <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 max-w-sm w-full space-y-4"
                    >
                      <div className="flex justify-between items-center pb-2 border-b border-slate-50 dark:border-slate-850">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
                          Verify Settle Payment
                        </h4>
                        <button 
                          onClick={() => setCurrentSettlementTarget(null)}
                          className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-4 text-center py-2">
                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 rounded-3xl mx-auto flex items-center justify-center text-indigo-505">
                          <Coins className="w-6 h-6 animate-pulse" />
                        </div>
                        
                        <div className="space-y-1">
                          <span className="block text-[8px] uppercase tracking-widest text-slate-400 font-extrabold">
                            AMOUNT TO DEPOSIT
                          </span>
                          <span className="text-3xl font-black text-slate-900 dark:text-white">
                            ₹{Math.round(currentSettlementTarget.amount)}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                          You are recording a manual cash/UPI payment to settle your share with <span className="text-indigo-600 dark:text-indigo-300 font-extrabold">{currentSettlementTarget.toName}</span>. Proceed to record?
                        </p>
                      </div>

                      <div className="flex gap-2.5 pt-2">
                        <button
                          onClick={triggerSettleUp}
                          disabled={isSubmittingSettlement}
                          className="flex-1 py-3 bg-indigo-650 hover:bg-indigo-750 disabled:opacity-50 text-white rounded-xl text-2xs uppercase tracking-widest font-black transition-all cursor-pointer"
                        >
                          {isSubmittingSettlement ? 'Verifying...' : 'Yes, Settled'}
                        </button>
                        <button
                          onClick={() => setCurrentSettlementTarget(null)}
                          className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* TAB 4: HISTORY EXPENSES LOGGER */}
          {activeTab === 'history' && (
            <PullToRefresh onRefresh={refreshData}>
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-xl space-y-4"
              >
              <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-850 pb-3">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Roommate Expense History
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    A searchable ledger list of active splits and roommate flat payments
                  </p>
                </div>

                <span className="text-[10px] uppercase font-black bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 px-2.5 py-1 rounded-full">
                  {expenses.length} Split Entries
                </span>
              </div>

              <div className="space-y-4 pt-2 divide-y divide-slate-50 dark:divide-slate-850/40">
                {expenses.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs font-bold space-y-3">
                    <Clock className="w-10 h-10 mx-auto text-slate-200 dark:text-slate-700 animate-pulse" />
                    <p>No active splits mapped inside this roommate room.</p>
                  </div>
                ) : (
                  expenses.map((exp) => (
                    <div key={exp.id} className="pt-4 first:pt-1 flex justify-between items-start text-xs">
                      <div className="space-y-1.5 text-left">
                        <div>
                          <span className="inline-block px-2 py-0.5 text-[8.5px] uppercase tracking-wider font-extrabold bg-slate-50 dark:bg-slate-950 text-slate-500 rounded-lg mr-2 border border-slate-150/10">
                            {exp.category}
                          </span>
                          <h4 className="inline text-xs font-bold text-slate-800 dark:text-white">
                            {exp.title}
                          </h4>
                        </div>

                        <p className="text-[10px] text-slate-450 leading-relaxed font-bold">
                          Paid by <span className="font-extrabold text-slate-655 dark:text-slate-350">{exp.payerName}</span> • 
                          Split with: {exp.splits.map(s => s.displayName).join(', ')}
                        </p>

                        <span className="text-[8px] font-mono text-slate-400 block">
                          Recorded: {new Date(exp.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>

                      <div className="text-right space-y-2 pl-4 shrink-0">
                        <span className="block font-black text-slate-850 dark:text-white text-xs">
                          ₹{Math.round(exp.amount)}
                        </span>
                        
                        {/* Allowed everyone to inspect delete and correct entries */}
                        <button
                          onClick={async () => {
                            if (window.confirm('Delete this expenses split? Relative roommate networks will adjust values dynamically.')) {
                              await deleteExpense(exp.id);
                            }
                          }}
                          className="p-1 px-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-500 dark:text-rose-400 rounded-lg flex items-center gap-1 text-[9px] font-black uppercase transition-all cursor-pointer border border-rose-105/10"
                        >
                          <Trash2 className="w-3 h-3 shrink-0" /> Correction
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
            </PullToRefresh>
          )}

          {/* TAB 5: ROOM DETAILS & INVITES MANAGER */}
          {activeTab === 'room' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-xl mx-auto space-y-6"
            >
              {/* My Roommate Profile Settings Card */}
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-xl space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      My Roommate Profile
                    </h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5 text-indigo-650 dark:text-indigo-400">
                      Edit details other roommates can see
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 border border-indigo-100 dark:border-indigo-900">
                    {profile?.displayName?.charAt(1) ? profile.displayName.substring(0, 2).toUpperCase() : profile?.displayName?.charAt(0).toUpperCase() || 'RM'}
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  {profileError && (
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-3xs font-black uppercase tracking-wider rounded-xl border border-rose-100 dark:border-rose-900/40 text-left">
                      ⚠️ {profileError}
                    </div>
                  )}

                  {profileSaveSuccess && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-3xs font-black uppercase tracking-wider rounded-xl border border-emerald-100 dark:border-emerald-900/40 flex items-center gap-2 text-left">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> 
                      <span>Profile updated! Roommates see your new name immediately.</span>
                    </div>
                  )}

                  <div className="space-y-1.5 text-left">
                    <label className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-400">
                      My Name / Alias (Roommates see this)
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="e.g. Aditya, John, Sarah"
                      className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white font-extrabold rounded-xl border border-slate-100 dark:border-slate-850 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center justify-between">
                      <span>UPI ID / Payment Link (Optional)</span>
                      <span className="text-[7.5px] font-bold text-indigo-500">Generates Easy Pay QR Codes!</span>
                    </label>
                    <input
                      type="text"
                      value={editUpi}
                      onChange={(e) => setEditUpi(e.target.value)}
                      placeholder="e.g. aditya@okaxis or GooglePay link"
                      className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white font-extrabold rounded-xl border border-slate-100 dark:border-slate-850 focus:outline-none focus:ring-2 focus:ring-indigo-550 transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="w-full py-3.5 bg-slate-900 dark:bg-slate-800 hover:opacity-90 disabled:opacity-50 text-white rounded-xl text-3xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    {isSavingProfile ? (
                      'Saving Changes...'
                    ) : (
                      <>
                        Save Profile Settings
                      </>
                    )}
                  </button>
                </form>

                <div className="pt-4 border-t border-slate-50 dark:border-slate-850/50 flex flex-col space-y-2">
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 text-left">
                    Account Actions
                  </span>
                  <button 
                    onClick={signOut}
                    className="w-full py-3 text-rose-500 bg-rose-50 dark:bg-rose-950/10 border border-rose-200/20 dark:border-rose-900/40 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all cursor-pointer hover:bg-rose-100 dark:hover:bg-rose-950/40"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </div>

              {/* Room card box */}
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-xl space-y-6">
                
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Room invites & Flatmates
                    </h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider text-indigo-650 mt-0.5">
                      Share to connect flatmates
                    </p>
                  </div>

                  <span className="text-[9px] font-black uppercase bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 px-3 py-1 rounded-full border border-emerald-250/20">
                    Live Cloud Sync
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Join code display */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 text-center rounded-2xl border border-slate-150/10 space-y-1.5">
                    <span className="block text-[8px] uppercase tracking-widest text-slate-400 font-extrabold">
                      FLATMATE ROOM ACCESS CODE
                    </span>
                    <p className="font-mono text-2xl font-black text-indigo-650 dark:text-indigo-400 tracking-widest uppercase">
                      {currentGroup.code}
                    </p>
                  </div>

                  {/* Share button links */}
                  <div className="flex gap-2.5">
                    <button
                      onClick={handleCopyInviteLink}
                      className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-3xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-4 h-4" /> Copied Link!
                        </>
                      ) : (
                        <>
                          <Share2 className="w-4 h-4" /> Copy Invitation Link
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(currentGroup.code);
                        setCopiedLink(true); // Share toggle state
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                      className="py-3.5 px-4 bg-slate-900 dark:bg-slate-800 hover:opacity-80 text-white rounded-xl text-3xs font-black uppercase tracking-widest flex items-center gap-1.5 cursor-pointer"
                    >
                      <Copy className="w-4 h-4" /> Code
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-400/80 leading-relaxed font-bold text-center">
                    Roommates can enter code manually to link flat bills, or simply click the invitation link to login and auto-join flat ledger!
                  </p>
                </div>

                {/* Flatmates members list */}
                <div className="space-y-3.5 pt-4 border-t border-slate-50 dark:border-slate-850/50">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white text-left">
                    Flatmates Connected ({currentGroup.members.length})
                  </h4>

                  <div className="space-y-3">
                    {currentGroup.members.map((member) => (
                      <div key={member.uid} className="flex justify-between items-center text-xs py-1.5">
                        <div className="flex items-center gap-2.5 text-left">
                          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-655 flex items-center justify-center font-bold text-[11px]">
                            {member.displayName.charAt(1) ? member.displayName.substring(0, 2).toUpperCase() : member.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-800 dark:text-white leading-none mb-1">
                              {member.displayName} {member.uid === user?.uid && '(You)'}
                            </p>
                            <span className="text-[8.5px] text-slate-400 block leading-none">
                              Joined: {new Date(member.joinedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <span className="text-[9.5px] font-mono tracking-widest uppercase bg-slate-100 dark:bg-slate-850 text-slate-500 font-extrabold px-2.5 py-0.5 rounded-lg border border-transparent">
                          {member.role === 'admin' ? 'Flat Admin' : 'Flatmate'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Help & Legals Section */}
                <div className="pt-6 border-t border-slate-50 dark:border-slate-850/50 text-left">
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase mb-3">Help & Legals</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      to="/privacy"
                      className="p-4 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-100 dark:border-slate-850/60 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>Privacy Policy</span>
                    </Link>
                    <Link
                      to="/terms"
                      className="p-4 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-100 dark:border-slate-850/60 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>Terms & Conditions</span>
                    </Link>
                  </div>
                </div>

                {/* Leave Room action */}
                <div className="pt-6 border-t border-slate-50 dark:border-slate-850/50 text-left">
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase mb-2">Danger zone</p>
                  <button
                    onClick={async () => {
                      if (window.confirm('Disconnect from this roommate group? You can easily join back later using your room code.')) {
                        try {
                          await resetGroup();
                          setOnboardingChoice('select');
                          setActiveTab('dashboard');
                        } catch (err) {
                          console.error(err);
                        }
                      }
                    }}
                    className="w-full py-4 text-red-500 hover:text-red-650 bg-red-50 dark:bg-red-950/10 border border-red-200/15 dark:border-red-950 text-xs font-black uppercase tracking-widest rounded-2xl transition-all cursor-pointer"
                  >
                    Disconnect Room / Out-onboard
                  </button>
                </div>

              </div>
            </motion.div>
          )}

        </div>

      </main>

      {/* Global Bottom Sticky Info Bar */}
      <footer className="pt-6 pb-28 border-t border-slate-100 dark:border-slate-900 bg-white/40 dark:bg-slate-950/40 relative z-10 text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
        SpendWise Shared Expense Tracker
      </footer>

      {/* Floating Bottom Sticky Navigation Toolbar */}
      <div className="fixed bottom-4 inset-x-0 z-40 px-4 pointer-events-none flex justify-center">
        <div className="pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border border-slate-200/60 dark:border-slate-800/80 rounded-2xl md:rounded-3xl shadow-xl py-2.5 px-3 md:px-6 flex items-center justify-between gap-1 w-full max-w-md md:max-w-xl">
          {[
            { id: 'dashboard', name: 'Dashboard', icon: Coins },
            { id: 'split', name: 'Split Bill', icon: Plus },
            { id: 'settle', name: 'Settle', icon: CheckCheck },
            { id: 'history', name: 'History', icon: Clock },
            { id: 'room', name: 'Profile', icon: User },
          ].map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                id={`nav-${tab.id}`}
                className={`relative flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl text-center flex-1 transition-all cursor-pointer ${
                  isActive 
                    ? 'text-indigo-650 dark:text-indigo-400 font-black' 
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-bold'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-bottom-tab"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    className="absolute inset-x-1 inset-y-0.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg -z-10"
                  />
                )}
                <IconComponent className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'scale-115 text-indigo-600 dark:text-indigo-400' : 'hover:scale-105'}`} />
                <span className="text-[9px] md:text-2xs font-extrabold whitespace-nowrap tracking-tight">{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default App;
