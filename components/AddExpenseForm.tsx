import React, { useState, useEffect } from 'react';
import { useRoom } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, Send, IndianRupee, Users, Sparkles, Percent, CheckSquare, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface AddExpenseFormProps {
  onClose: () => void;
}

const CATEGORIES = [
  { name: 'Groceries', icon: 'Apple', color: '#10b981' },
  { name: 'Maggi/Snacks', icon: 'Cookie', color: '#f59e0b' },
  { name: 'Milk', icon: 'Droplets', color: '#3b82f6' },
  { name: 'Internet', icon: 'Wifi', color: '#8b5cf6' },
  { name: 'Electricity', icon: 'Zap', color: '#ef4444' },
  { name: 'Water', icon: 'GlassWater', color: '#06b6d4' },
  { name: 'Cleaning Supplies', icon: 'Sparkles', color: '#13b194' },
  { name: 'Gas Cylinder', icon: 'Flame', color: '#f97316' },
  { name: 'Party/Food Orders', icon: 'Beef', color: '#ec4899' }
];

const AddExpenseForm: React.FC<AddExpenseFormProps> = ({ onClose }) => {
  const { currentGroup, addExpense } = useRoom();
  const { user } = useAuth();
  
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Groceries');
  const [splitType, setSplitType] = useState<'equal' | 'percentage' | 'selected'>('equal');
  const [payerId, setPayerId] = useState(user?.uid || '');
  
  // Selection of whom to split with (defaults to all)
  const [checkedMembers, setCheckedMembers] = useState<{ [uid: string]: boolean }>({});
  // Percentage allocation details (defaults to equal percent)
  const [customPercentages, setCustomPercentages] = useState<{ [uid: string]: string }>({});

  const members = currentGroup?.members || [];

  // Reset checked members when group loads
  useEffect(() => {
    const initialCheck: { [uid: string]: boolean } = {};
    const initialPerc: { [uid: string]: string } = {};
    members.forEach(m => {
      initialCheck[m.uid] = true;
      initialPerc[m.uid] = Math.round(100 / members.length).toString();
    });
    setCheckedMembers(initialCheck);
    setCustomPercentages(initialPerc);
  }, [currentGroup]);

  const toggleMember = (uid: string) => {
    setCheckedMembers(prev => ({ ...prev, [uid]: !prev[uid] }));
  };

  const setPercent = (uid: string, val: string) => {
    setCustomPercentages(prev => ({ ...prev, [uid]: val }));
  };

  // Pre-calculate exact split values for visual preview
  const getSplitsPreview = (): Array<{ uid: string; displayName: string; amount: number; percentage: number }> => {
    const totalAmount = parseFloat(amount) || 0;
    if (totalAmount <= 0) return [];

    const activeUids = Object.keys(checkedMembers).filter(uid => checkedMembers[uid]);
    if (activeUids.length === 0) return [];

    if (splitType === 'equal' || splitType === 'selected') {
      const perPerson = parseFloat((totalAmount / activeUids.length).toFixed(2));
      return activeUids.map(uid => {
        const m = members.find(item => item.uid === uid);
        return {
          uid,
          displayName: m?.displayName || 'Roommate',
          amount: perPerson,
          percentage: 100 / activeUids.length
        };
      });
    }

    if (splitType === 'percentage') {
      let runTotalPerc = 0;
      activeUids.forEach(uid => {
        runTotalPerc += parseFloat(customPercentages[uid] || '0');
      });
      const divisor = runTotalPerc || 100;

      return activeUids.map(uid => {
        const m = members.find(item => item.uid === uid);
        const relativePerc = parseFloat(customPercentages[uid] || '0');
        const shareAmt = parseFloat(((totalAmount * relativePerc) / divisor).toFixed(2));
        return {
          uid,
          displayName: m?.displayName || 'Roommate',
          amount: shareAmt,
          percentage: relativePerc
        };
      });
    }

    return [];
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;

    const finalAmount = parseFloat(amount);
    if (isNaN(finalAmount) || finalAmount <= 0) return;

    const splitsPreview = getSplitsPreview();
    if (splitsPreview.length === 0) return;

    // Convert splits into final array
    const finalSplits = splitsPreview.map(sp => ({
      uid: sp.uid,
      displayName: sp.displayName,
      amount: sp.amount,
      share: sp.percentage
    }));

    const payerMember = members.find(m => m.uid === payerId) || members.find(m => m.uid === user?.uid);
    const finalPayerId = payerMember?.uid || user?.uid || '';
    const finalPayerName = payerMember?.displayName || 'You';

    try {
      await addExpense(title.trim(), finalAmount, category, splitType, finalSplits, finalPayerId, finalPayerName);
      
      // Trigger native interstitial with 33% chance to follow ethical non-annoyance AdMob policies
      if (Math.random() < 0.33) {
        import('../services/adService').then(m => m.showInterstitialAd());
      }
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  const checkCount = Object.values(checkedMembers).filter(Boolean).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <h2 className="text-3xl font-black text-slate-950 dark:text-white tracking-tight px-2">
        Add Expense
      </h2>

      <form onSubmit={handleAdd} className="space-y-6">
        {/* Core details card */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="relative">
            <span className="absolute left-4 top-4 text-slate-400">
              <ShoppingCart className="w-5 h-5" />
            </span>
            <input
              type="text"
              required
              placeholder="What did you pay for?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-sm font-bold pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-transparent focus:border-indigo-600 focus:outline-none dark:text-white"
            />
          </div>

          <div className="relative">
            <span className="absolute left-4 top-4 text-slate-800 dark:text-slate-100 font-bold">
              ₹
            </span>
            <input
              type="number"
              step="any"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full text-xl font-black pl-10 pr-4 py-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-transparent focus:border-indigo-600 focus:outline-none dark:text-white"
            />
          </div>

          <div className="pt-2 border-t border-slate-100/50 dark:border-slate-800/50">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 px-0.5">
              Who Paid This Bill?
            </label>
            <select
              value={payerId}
              onChange={(e) => setPayerId(e.target.value)}
              className="w-full text-xs font-bold p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800/80 focus:border-indigo-600 focus:outline-none dark:text-white"
            >
              <option value={user?.uid || ''}>You Paid</option>
              {members.filter(m => m.uid !== user?.uid).map(m => (
                <option key={m.uid} value={m.uid}>{m.displayName} Paid</option>
              ))}
            </select>
          </div>
        </div>

        {/* Split options tabs */}
        <div>
          <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 px-3 mb-3">
            Split Method
          </label>
          <div className="grid grid-cols-3 bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setSplitType('equal')}
              className={`py-3.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                splitType === 'equal' 
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' 
                  : 'text-slate-500'
              }`}
            >
              Equal Split
            </button>
            <button
              type="button"
              onClick={() => setSplitType('selected')}
              className={`py-3.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                splitType === 'selected' 
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' 
                  : 'text-slate-500'
              }`}
            >
              Selected
            </button>
            <button
              type="button"
              onClick={() => setSplitType('percentage')}
              className={`py-3.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                splitType === 'percentage' 
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' 
                  : 'text-slate-500'
              }`}
            >
              Percentage
            </button>
          </div>
        </div>

        {/* Members Split Checklist */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
              {splitType === 'equal' ? 'Who is splitting? (Exclude absent)' : 'Adjust room splits'}
            </h3>
            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-1 rounded-lg">
              {checkCount}/{members.length} Selected
            </span>
          </div>

          <div className="space-y-3">
            {members.map(member => {
              const active = !!checkedMembers[member.uid];
              return (
                <div 
                  key={member.uid} 
                  onClick={() => toggleMember(member.uid)}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                    active 
                      ? 'bg-slate-50 dark:bg-slate-800/40 border-indigo-100 dark:border-indigo-900/40' 
                      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600/10 text-indigo-600 font-bold text-xs flex items-center justify-center">
                      {member.displayName.slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{member.displayName}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        {member.uid === user?.uid ? 'Payer (You)' : 'Member'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    {splitType === 'percentage' && active && (
                      <div className="flex items-center gap-1.5 bg-white dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
                        <input
                          type="number"
                          value={customPercentages[member.uid] || ''}
                          onChange={(e) => setPercent(member.uid, e.target.value)}
                          className="w-8 text-center text-xs font-bold bg-transparent border-none outline-none dark:text-white"
                        />
                        <span className="text-[10px] font-black text-slate-400">%</span>
                      </div>
                    )}

                    <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors ${
                      active ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 dark:border-slate-700'
                    }`}>
                      {active && <span className="text-[9px] font-black">✓</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Real-time split preview calculation */}
        {parseFloat(amount) > 0 && getSplitsPreview().length > 0 && (
          <div className="p-5 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-3xl border border-dashed border-indigo-100 dark:border-indigo-950/50">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-4 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Live Split Calculation
            </p>
            <div className="space-y-3">
              {getSplitsPreview().map(sp => (
                <div key={sp.uid} className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-600 dark:text-slate-400">{sp.displayName} ({Math.round(sp.percentage)}%)</span>
                  <span className="font-black text-slate-800 dark:text-white">₹{sp.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black uppercase tracking-widest text-xs rounded-2xl active:scale-95 transition-transform"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" /> Add Expense
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddExpenseForm;
