import React, { useState } from 'react';
import { useRoom } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  Layers, 
  Award, 
  Trash2, 
  Check, 
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ActiveRoom: React.FC = () => {
  const { 
    currentGroup, 
    addExpense
  } = useRoom();
  const { user, profile } = useAuth();

  // Quick targeted roommate expense modal state
  const [selectedMemberForExpense, setSelectedMemberForExpense] = useState<any | null>(null);
  const [quickExpTitle, setQuickExpTitle] = useState('');
  const [quickExpAmount, setQuickExpAmount] = useState('');
  const [quickExpMethod, setQuickExpMethod] = useState<'equal' | 'full'>('equal');
  const [quickExpCategory, setQuickExpCategory] = useState('Groceries');
  const [quickExpSuccess, setQuickExpSuccess] = useState('');
  const [quickExpSubmitting, setQuickExpSubmitting] = useState(false);

  const handleApplyQuickExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberForExpense || !quickExpTitle.trim() || !quickExpAmount || !user) return;
    const amt = parseFloat(quickExpAmount);
    if (isNaN(amt) || amt <= 0) return;

    setQuickExpSubmitting(true);
    try {
      let splits: any[] = [];
      if (quickExpMethod === 'equal') {
        splits = [
          {
            uid: user.uid,
            displayName: profile?.displayName || 'You',
            amount: parseFloat((amt / 2).toFixed(2)),
            share: 50
          },
          {
            uid: selectedMemberForExpense.uid,
            displayName: selectedMemberForExpense.displayName,
            amount: parseFloat((amt / 2).toFixed(2)),
            share: 50
          }
        ];
        await addExpense(quickExpTitle.trim(), amt, quickExpCategory, 'equal', splits);
      } else {
        splits = [
          {
            uid: selectedMemberForExpense.uid,
            displayName: selectedMemberForExpense.displayName,
            amount: amt,
            share: 100
          }
        ];
        await addExpense(quickExpTitle.trim(), amt, quickExpCategory, 'selected', splits);
      }

      setQuickExpSuccess('Expense logged successfully!');
      setTimeout(() => {
        setQuickExpSuccess('');
        setSelectedMemberForExpense(null);
        setQuickExpTitle('');
        setQuickExpAmount('');
        setQuickExpMethod('equal');
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setQuickExpSubmitting(false);
    }
  };

  if (!currentGroup) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Dynamic Glassmorphic Room Card */}
      <div className="relative p-8 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-100 dark:shadow-none overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Layers className="w-40 h-40" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Active Room</p>
        <h2 className="text-3xl font-black tracking-tighter mb-1">{currentGroup.name}</h2>
      </div>

      {/* Roommates Directory */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-sans">Roommates Directory</p>
          <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-amber-500 font-sans">
            <Award className="w-3.5 h-3.5" /> Split-Active Ledger
          </div>
        </div>

        <div className="space-y-3">
          {currentGroup.members.map((member) => (
            <div key={member.uid} className="p-4 bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-bold text-sm flex items-center justify-center">
                  {member.displayName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm leading-none">{member.displayName}</p>
                    {member.role === 'admin' && (
                      <span className="px-2 py-0.5 text-[8px] font-black uppercase bg-indigo-100 text-indigo-700 rounded-lg">Admin</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">Joined {new Date(member.joinedAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {member.uid !== user?.uid && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMemberForExpense(member);
                      setQuickExpTitle('');
                      setQuickExpAmount('');
                      setQuickExpCategory('Groceries');
                      setQuickExpMethod('equal');
                    }}
                    className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    + Split Spend
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Targeted Roommate Expense Modal */}
      <AnimatePresence>
        {selectedMemberForExpense && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 bg-opacity-70">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-2xl border border-slate-100 dark:border-slate-800"
            >
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Add Quick Expense</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                    with {selectedMemberForExpense.displayName}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedMemberForExpense(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {quickExpSuccess ? (
                <div className="py-8 text-center text-emerald-500 font-extrabold flex flex-col items-center justify-center gap-2">
                  <span className="text-3xl">🎉</span>
                  <p className="text-xs">{quickExpSuccess}</p>
                </div>
              ) : (
                <form onSubmit={handleApplyQuickExpense} className="space-y-4">
                  {/* Title Input */}
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 px-0.5">
                      Title / Spend Reason
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Milk crate, snacks, room rent"
                      value={quickExpTitle}
                      onChange={(e) => setQuickExpTitle(e.target.value)}
                      className="w-full text-xs font-bold p-3 bg-slate-50 dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-150 dark:text-white"
                    />
                  </div>

                  {/* Amount Input */}
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 px-0.5">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="0.00"
                      value={quickExpAmount}
                      onChange={(e) => setQuickExpAmount(e.target.value)}
                      className="w-full text-xs font-black p-3 bg-slate-50 dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-150 dark:text-white"
                    />
                  </div>

                  {/* Category Selection */}
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 px-0.5">
                      Category
                    </label>
                    <select
                      value={quickExpCategory}
                      onChange={(e) => setQuickExpCategory(e.target.value)}
                      className="w-full text-xs font-bold p-3 bg-slate-50 dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-150 dark:text-slate-300 border-none"
                    >
                      <option value="Groceries">Groceries</option>
                      <option value="Maggi/Snacks">Maggi/Snacks</option>
                      <option value="Milk">Milk</option>
                      <option value="Internet">Internet</option>
                      <option value="Electricity">Electricity</option>
                      <option value="Water">Water</option>
                      <option value="Cleaning Supplies">Cleaning Supplies</option>
                      <option value="Gas Cylinder">Gas Cylinder</option>
                      <option value="Party/Food Orders">Party/Food Orders</option>
                    </select>
                  </div>

                  {/* Split Options */}
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-0.5">
                      Split Model
                    </label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-50 dark:bg-slate-950 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setQuickExpMethod('equal')}
                        className={`py-2 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                          quickExpMethod === 'equal' 
                            ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' 
                            : 'text-slate-500'
                        }`}
                      >
                        Split 50/50
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickExpMethod('full')}
                        className={`py-2 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                          quickExpMethod === 'full' 
                            ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' 
                            : 'text-slate-500'
                        }`}
                      >
                        Full Bill to Roommate
                      </button>
                    </div>
                  </div>

                  {/* Submit / Cancel Buttons */}
                  <div className="flex gap-2 pt-4">
                    <button
                      type="button"
                      onClick={() => setSelectedMemberForExpense(null)}
                      className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold uppercase tracking-widest text-3xs rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={quickExpSubmitting}
                      className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold uppercase tracking-widest text-3xs rounded-xl shadow-md flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {quickExpSubmitting ? 'Logging...' : 'Apply Split'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ActiveRoom;
