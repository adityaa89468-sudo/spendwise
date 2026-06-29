import React, { useState } from 'react';
import { useRoom } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';
import { Home, UserPlus, Users, Plus, ShieldCheck, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface GroupsManagerProps {
  onSuccess?: () => void;
}

const GroupsManager: React.FC<GroupsManagerProps> = ({ onSuccess }) => {
  const { createGroup, joinGroup } = useRoom();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'join' | 'create'>('join');
  
  // Create Group Input
  const [groupName, setGroupName] = useState('');
  
  // Join Group Input
  const [joinCode, setJoinCode] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      setError('Please provide a Room or Flat name');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await createGroup(groupName.trim());
      setSuccess('Room created successfully!');
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 800);
      }
    } catch (err) {
      setError('Failed to create Room. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.length < 6) {
      setError('Please provide a valid 6-digit Room code');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const ok = await joinGroup(joinCode.trim());
      if (ok) {
        setSuccess('Successfully joined Room!');
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 800);
        }
      } else {
        setError('Room Code not found. Please double-check with roommate.');
      }
    } catch (err) {
      setError('Error joining room. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 px-4 flex flex-col justify-center min-h-[80vh] animate-in fade-in duration-500">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-100">
          <Home className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">SpendWise</h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">
          Shared expenses management for flatmates and college roommates
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl mb-8">
        <button
          onClick={() => { setActiveTab('join'); setError(''); }}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'join' 
              ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-md shadow-slate-200/50 dark:shadow-none' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          Join Room
        </button>
        <button
          onClick={() => { setActiveTab('create'); setError(''); }}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'create' 
              ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-md shadow-slate-200/50 dark:shadow-none' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Plus className="w-4 h-4" />
          Create Room
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl text-xs font-bold text-center border border-red-100 dark:border-red-900/50 animate-bounce">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-2xl text-xs font-bold text-center border border-green-100 dark:border-green-900/50">
          🎉 {success}
        </div>
      )}

      {/* Join Form */}
      {activeTab === 'join' ? (
        <motion.form 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onSubmit={handleJoin}
          className="space-y-6"
        >
          <div>
            <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">
              Room Join Code
            </label>
            <input
              type="text"
              maxLength={6}
              placeholder="e.g. 542918"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, ''))}
              className="w-full text-center tracking-[0.5em] text-2xl font-black py-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 text-slate-800 dark:text-white placeholder:tracking-normal placeholder:text-sm placeholder:font-bold"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            {submitting ? 'Verifying...' : 'Join SpendWise flat'}
          </button>
        </motion.form>
      ) : (
        <motion.form 
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          onSubmit={handleCreate}
          className="space-y-6"
        >
          <div>
            <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">
              Room or Flat Name
            </label>
            <input
              type="text"
              placeholder="e.g. Room B-402, Block 3"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full text-sm font-bold p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 text-slate-800 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            {submitting ? 'Creating...' : 'Create SpendWise group'}
          </button>
        </motion.form>
      )}

      {/* Trust & Policy Badge for Play Store adherence */}
      <div className="mt-12 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start gap-4">
        <div className="p-2.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl mt-0.5">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-1">AdMob & Play Store Policy Compliant</h4>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Your data is encrypted and synced in real-time. Ad preferences can be customized within legal profiles inside settings at any time.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GroupsManager;
