
import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { App as CapacitorApp } from '@capacitor/app';
import { 
  BarChart3, 
  History, 
  Plus, 
  MoreHorizontal, 
  LogOut, 
  LayoutDashboard,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  Search,
  Filter,
  PieChart as PieChartIcon,
  Bell,
  Sparkles,
  Settings as SettingsIcon,
  Moon,
  Sun
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Insights from './components/Insights';
import AddTransactionModal from './components/AddTransactionModal';
import { motion, AnimatePresence } from 'framer-motion';

import { initializeAdMob, showBanner } from './services/adService';

const App: React.FC = () => {
  const { user, profile, loading, signInWithGoogle, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'insights' | 'settings'>('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    initializeAdMob().then(() => {
      showBanner();
    });

    // Handle Android hardware back button
    const backButtonListener = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) {
        CapacitorApp.exitApp();
      } else {
        window.history.back();
      }
    });

    return () => {
      backButtonListener.then(l => l.remove());
    };
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`h-full flex items-center justify-center p-6 ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200 dark:shadow-none border border-slate-100 dark:border-slate-700 text-center">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-indigo-100">
            <Wallet className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
            SpendWise
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 leading-relaxed">
            Take control of your finances with our clean, minimalist expense tracker.
          </p>
          <button 
            onClick={signInWithGoogle}
            className="w-full py-4 px-6 bg-slate-900 dark:bg-indigo-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
          >
            <img src="https://www.google.com/favicon.ico" className="w-4 h-4 invert" alt="Google" />
            Continue with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${darkMode ? 'bg-slate-950 text-white dark' : 'bg-slate-50 text-slate-900'}`}>
      {/* Native-feeling Header with Safe Area */}
      <header className="px-6 pt-[calc(env(safe-area-inset-top)+1rem)] pb-6 flex items-center justify-between sticky top-0 bg-inherit z-10 backdrop-blur-md bg-opacity-80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">SpendWise</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest -mt-1">
              Hi, {profile?.displayName?.split(' ')[0] || 'User'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95 transition-transform"
          >
            {darkMode ? <Sun className="w-5 h-5 text-indigo-400" /> : <Moon className="w-5 h-5 text-slate-400" />}
          </button>
          <button className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 relative active:scale-95 transition-transform">
            <Bell className="w-5 h-5 text-slate-400" />
            <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>
          </button>
        </div>
      </header>

      {/* Main Content Area - Scrollable with safe area handling built-in */}
      <main className="flex-1 px-6 overflow-y-auto pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.15 }}
            className="h-full"
          >
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'transactions' && <Transactions />}
            {activeTab === 'insights' && <Insights />}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h2 className="text-3xl font-black tracking-tight mb-8">Settings</h2>
                <div className="space-y-4">
                  <div className="p-6 bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Account</p>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <img src={user.photoURL || ''} className="w-12 h-12 rounded-2xl border-2 border-indigo-50" alt="Avatar" />
                        <div>
                          <p className="font-bold">{profile?.displayName}</p>
                          <p className="text-sm text-slate-400">{profile?.email}</p>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={signOut}
                      className="w-full py-4 text-red-500 font-bold bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center gap-2 active:bg-red-100 dark:active:bg-red-900/40 transition-colors mb-4"
                    >
                      <LogOut className="w-5 h-5" />
                      Sign Out
                    </button>

                    <button 
                      onClick={async () => {
                        const reward = await import('./services/adService').then(m => m.showRewardedAd());
                        if (reward) {
                          alert(`Thank you for supporting us! You earned a virtual high five!`);
                        }
                      }}
                      className="w-full py-4 text-indigo-600 font-bold bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center gap-2 active:bg-indigo-100 transition-all"
                    >
                      <Sparkles className="w-5 h-5" />
                      Watch Ad to Support Us
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating Add Button - Native Fabric placement */}
      <button 
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+6.5rem)] right-6 w-14 h-14 bg-indigo-600 text-white rounded-[1.25rem] shadow-xl flex items-center justify-center active:scale-90 transition-all z-20"
      >
        <Plus className="w-8 h-8" />
      </button>

      {/* Android Material Bottom Navigation with Safe Area */}
      <nav className="fixed bottom-0 left-0 w-full px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 z-10 transition-colors">
        <div className="max-w-md mx-auto flex items-center justify-around">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
            { id: 'transactions', icon: History, label: 'History' },
            { id: 'insights', icon: BarChart3, label: 'Insights' },
            { id: 'settings', icon: SettingsIcon, label: 'Profile' }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center gap-1.5 py-2 px-4 rounded-2xl transition-all relative ${
                activeTab === tab.id 
                  ? 'text-indigo-600' 
                  : 'text-slate-400 dark:text-slate-500 active:bg-slate-100 dark:active:bg-slate-800'
              }`}
            >
              <div className={`p-1.5 rounded-full transition-colors ${activeTab === tab.id ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''}`}>
                <tab.icon className={`w-6 h-6 ${activeTab === tab.id ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${activeTab === tab.id ? 'opacity-100' : 'opacity-60'}`}>
                {tab.label}
              </span>
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute -top-1 w-1 h-1 bg-indigo-600 rounded-full"
                />
              )}
            </button>
          ))}
        </div>
      </nav>

      <AddTransactionModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
};

export default App;
