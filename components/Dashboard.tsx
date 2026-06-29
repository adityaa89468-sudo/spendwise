import React, { useState } from 'react';
import { useRoom } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Sparkles, 
  Wallet, 
  Users, 
  ArrowRight,
  TrendingDown,
  ShoppingBag,
  Clock,
  Trash2
} from 'lucide-react';
import GroupsManager from './GroupsManager';

const CATEGORY_COLORS: { [cat: string]: string } = {
  'Groceries': '#10b981',
  'Maggi/Snacks': '#f59e0b',
  'Milk': '#3b82f6',
  'Internet': '#8b5cf6',
  'Electricity': '#ef4444',
  'Water': '#06b6d4',
  'Cleaning Supplies': '#13b194',
  'Gas Cylinder': '#f97316',
  'Party/Food Orders': '#ec4899',
};

interface DashboardProps {
  onNavigateToRoom?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigateToRoom }) => {
  const { currentGroup, expenses, memberBalances, suggestedSettlements, deleteExpense, createGroup, joinGroup } = useRoom();
  const { user } = useAuth();
  
  const [selectedExpense, setSelectedExpense] = useState<any | null>(null);
  const [showAllExpenses, setShowAllExpenses] = useState(false);

  // States for when no room is linked yet
  const [formTab, setFormTab] = useState<'join' | 'create'>('join');
  const [groupName, setGroupName] = useState('');
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
    setSuccess('');
    setSubmitting(true);
    try {
      await createGroup(groupName.trim());
      setSuccess('Room created successfully! Landing in Room...');
      if (onNavigateToRoom) {
        setTimeout(() => {
          onNavigateToRoom();
        }, 1200);
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
    setSuccess('');
    setSubmitting(true);
    try {
      const ok = await joinGroup(joinCode.trim());
      if (ok) {
        setSuccess('Successfully joined Room! Opening Room...');
        if (onNavigateToRoom) {
          setTimeout(() => {
            onNavigateToRoom();
          }, 1200);
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

  if (!currentGroup) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-12">
        {/* Hero Section */}
        <div className="text-center py-8 px-4 bg-gradient-to-br from-indigo-50 to-indigo-100/40 dark:from-indigo-950/20 dark:to-indigo-900/10 rounded-[2.5rem] border border-indigo-100/20 dark:border-indigo-900/10">
          <div className="w-16 h-16 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-100 dark:shadow-none">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1.5">Welcome to SpendWise</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-xs max-w-xs mx-auto leading-relaxed">
            Simple, real-time bill splitting and shared expense tracking for roommates.
          </p>
        </div>

        {/* Dynamic Inline Setup Card */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-100/10 dark:shadow-none space-y-6">
          <div className="flex bg-slate-150/55 dark:bg-slate-950 p-1.5 rounded-2xl">
            <button
              onClick={() => { setFormTab('join'); setError(''); setSuccess(''); }}
              type="button"
              className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                formTab === 'join' 
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-md shadow-slate-200/50 dark:shadow-none' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
              }`}
            >
              Join Flatmates
            </button>
            <button
              onClick={() => { setFormTab('create'); setError(''); setSuccess(''); }}
              type="button"
              className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                formTab === 'create' 
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-md shadow-slate-200/50 dark:shadow-none' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
              }`}
            >
              Create New Room
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl text-[11px] font-black text-center border border-red-100 dark:border-red-900/50">
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl text-[11px] font-black text-center border border-emerald-100/50 dark:border-emerald-900/30">
              🎉 {success}
            </div>
          )}

          {formTab === 'join' ? (
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-2">
                  6-Digit Room Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 542918"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-[0.4em] text-xl font-black py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-150 dark:focus:ring-indigo-900/30 text-slate-800 dark:text-white placeholder:tracking-normal placeholder:text-xs placeholder:font-bold"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black uppercase tracking-widest text-2xs rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? 'Connecting...' : 'Join SpendWise flat'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-2">
                  Room or Flat Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Room B-402, Block 3"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full text-xs font-bold p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-150 dark:focus:ring-indigo-900/30 text-slate-800 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black uppercase tracking-widest text-2xs rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? 'Creating...' : 'Create SpendWise Room'}
              </button>
            </form>
          )}
        </div>

        {/* Feature Highlights */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-450 uppercase tracking-widest px-2">Key Core Benefits</h3>
          <div className="space-y-3">
            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-850 shadow-sm flex gap-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-650 dark:text-indigo-400 shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black tracking-tight text-slate-800 dark:text-slate-100">Automatic Debt Simplifier</h4>
                <p className="text-[10px] text-slate-450 dark:text-slate-400 leading-relaxed mt-0.5">
                  Calculates minimum debt loops automatically. Rent, cleaning services, or gas splits resolved instantly.
                </p>
              </div>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-850 shadow-sm flex gap-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-650 dark:text-indigo-400 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black tracking-tight text-slate-800 dark:text-slate-100">Live Member Ledgers</h4>
                <p className="text-[10px] text-slate-450 dark:text-slate-400 leading-relaxed mt-0.5">
                  Real-time database sync keeps whole flats updated. No more tedious Excel sheets or notebooks!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Blur Locked State Preview illustration */}
        <div className="relative rounded-[2.5rem] overflow-hidden border border-slate-150/40 dark:border-slate-850 p-3 bg-white dark:bg-slate-950">
          <div className="absolute inset-0 bg-slate-50/70 dark:bg-slate-950/80 backdrop-blur-[4px] z-10 flex flex-col items-center justify-center text-center p-6">
            <span className="bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-3.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider mb-2 border border-indigo-100/50 dark:border-indigo-900/30">
              Preview Mode
            </span>
            <p className="text-[11px] text-slate-650 dark:text-slate-350 font-extrabold max-w-[240px] leading-relaxed">
              Connect or create a roommate group above to unlock real-time activity ledgers and insights!
            </p>
          </div>

          <div className="space-y-5 pointer-events-none opacity-20 select-none">
            <div className="p-6 bg-indigo-600 rounded-[2rem] text-white">
              <span className="text-[9px] uppercase tracking-widest opacity-60">My Status</span>
              <p className="text-2xl font-black mt-0.5">₹0.00</p>
            </div>
            <div className="p-4 bg-slate-55 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-between">
              <div className="flex gap-2.5">
                <div className="w-2.5 h-8 bg-amber-500 rounded-full" />
                <div>
                  <p className="font-extrabold text-xs">Aesthetic Roommate Split</p>
                  <p className="text-[9px] text-slate-400">Paid by Roommate</p>
                </div>
              </div>
              <p className="font-black text-xs">₹450</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate user's specific room balance
  const myBalance = user ? (memberBalances[user.uid] || 0) : 0;
  
  const totalGroupExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);

  // Who Paid Last Tracker? (Dynamic Room Insight)
  const getWhoPaidLastInsight = () => {
    if (expenses.length === 0) return "No entries logged yet";
    const lastExp = expenses[0];
    return `${lastExp.payerName} paid ₹${lastExp.amount} for ${lastExp.title}`;
  };

  // Who Should Pay Next?
  const getWhoShouldPayNext = () => {
    if (!currentGroup || currentGroup.members.length === 0) return "N/A";
    
    // Sort members by their current balance ascending (lowest balance has paid the least / owes the most, meaning they should pay next)
    const membersWithBal = currentGroup.members.map(m => ({
      uid: m.uid,
      displayName: m.displayName,
      balance: memberBalances[m.uid] || 0
    }));

    membersWithBal.sort((a, b) => a.balance - b.balance);
    return membersWithBal[0]?.displayName || "Anyone";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* 1. Dynamic Room Balance Header Card (Glassmorphic) */}
      <div className="relative p-10 bg-indigo-600 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-150 overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Wallet className="w-40 h-40" />
        </div>
        
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">My Settlement status</p>
            <h2 className="text-4xl font-extrabold tracking-tighter">
              {myBalance > 0 ? `+₹${Math.round(myBalance)}` : myBalance < 0 ? `-₹${Math.round(Math.abs(myBalance))}` : '₹0'}
            </h2>
            <p className="text-[10px] opacity-75 font-bold mt-1 uppercase tracking-wider">
              {myBalance > 0 ? 'You are owed in Room' : myBalance < 0 ? 'You owe money to Roommates' : 'You are settled up perfectly'}
            </p>
          </div>

          <span className="bg-white/10 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wider uppercase border border-white/10 backdrop-blur-md">
            {currentGroup.name}
          </span>
        </div>

        {/* Mini stats row */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Total Group Spending</p>
            <p className="text-sm font-black text-yellow-300">₹{totalGroupExpenses.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Room Members</p>
            <p className="text-sm font-black text-white">{currentGroup.members.length} Active</p>
          </div>
        </div>

        {/* Navigation shortcut */}
        {onNavigateToRoom && (
          <button 
            type="button"
            onClick={onNavigateToRoom}
            className="mt-6 w-full bg-white text-indigo-700 hover:bg-slate-50 font-black text-2xs uppercase tracking-widest py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
          >
            <Users className="w-4 h-4 text-indigo-600" />
            Manage Roommates
            <ArrowRight className="w-4 h-4 ml-1 text-indigo-600" />
          </button>
        )}
      </div>



      {/* 2. Innovative Student Toolboxes: "Who Paid Last?" & "Should Pay Next" */}
      <div className="grid grid-cols-2 gap-4">
        {/* Who Paid Last */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Who Paid Last?
          </p>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug">
            {getWhoPaidLastInsight()}
          </p>
        </div>

        {/* Who should pay next */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" /> Should Pay Next
          </p>
          <p className="text-sm font-black text-indigo-600 leading-none mb-1">
            {getWhoShouldPayNext()}
          </p>
          <p className="text-[9px] font-bold text-slate-400 uppercase leading-none">Owes the most</p>
        </div>
      </div>

      {/* 3. Debt Summary widget on homepage */}
      {suggestedSettlements.length > 0 && (
        <div className="p-5 bg-gradient-to-br from-indigo-50/20 to-indigo-50/5 dark:from-indigo-950/10 dark:to-indigo-950/5 rounded-3xl border border-indigo-100/30">
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-3 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Live Room Debts
          </p>
          <div className="space-y-2">
            {suggestedSettlements.slice(0, 2).map((item, id) => (
              <div key={id} className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-600 dark:text-slate-400">
                  {item.fromName} pays {item.toName}
                </span>
                <span className="font-black text-red-500">₹{item.amount}</span>
              </div>
            ))}
            {suggestedSettlements.length > 2 && (
              <p className="text-[10px] text-indigo-600 font-extrabold uppercase text-right pt-1 cursor-pointer">
                + {suggestedSettlements.length - 2} more suggested transfers
              </p>
            )}
          </div>
        </div>
      )}

      {/* 4. Recent Group Activity log */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xl font-black tracking-tight">Recent Activity</h3>
          {expenses.length > 5 && (
            <button
              onClick={() => setShowAllExpenses(!showAllExpenses)}
              className="text-[10px] text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-wider hover:underline bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800"
            >
              {showAllExpenses ? 'Hide Older' : `See All (${expenses.length})`}
            </button>
          )}
        </div>
        <div className="space-y-3">
          {(showAllExpenses ? expenses : expenses.slice(0, 5)).map((exp) => {
            const color = CATEGORY_COLORS[exp.category] || '#71717a';
            return (
              <div 
                key={exp.id} 
                onClick={() => setSelectedExpense(exp)}
                className="p-4 bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer hover:border-indigo-100/50 dark:hover:border-slate-700"
              >
                <div className="flex items-center gap-3.5">
                  {/* Category bullet indicator */}
                  <div className="w-2.5 h-10 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 tracking-tight">{exp.title}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                      Paid by {exp.payerId === user?.uid ? 'You' : exp.payerName} • {new Date(exp.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-black text-sm text-slate-900 dark:text-white">₹{exp.amount}</p>
                  <span className="text-[9px] font-black uppercase text-indigo-600 tracking-wider bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
                    {exp.category}
                  </span>
                </div>
              </div>
            );
          })}

          {expenses.length === 0 && (
            <div className="text-center py-12 opacity-50 bg-slate-50 dark:bg-slate-900 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">No SpendWise expenses yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Expense Detail Modal Overlay */}
      {selectedExpense && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded">
                  {selectedExpense.category}
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight mt-1 ml-0.5 leading-snug">
                  {selectedExpense.title}
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 ml-0.5">
                  Logged on {new Date(selectedExpense.date).toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <button 
                onClick={() => setSelectedExpense(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-55 dark:bg-slate-950 rounded-2xl mb-4 space-y-2 border border-slate-100 dark:border-slate-850">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-500 uppercase tracking-widest text-[9px]">Payer (Who Paid)</span>
                <span className="font-extrabold text-slate-900 dark:text-white">
                  {selectedExpense.payerId === user?.uid ? 'You' : selectedExpense.payerName}
                </span>
              </div>
              <div className="flex justify-between text-xs pt-2 border-t border-slate-150/40 dark:border-slate-900">
                <span className="font-bold text-slate-500 uppercase tracking-widest text-[9px]">Total Bill</span>
                <span className="font-black text-indigo-600 dark:text-indigo-400 text-base">₹{selectedExpense.amount}</span>
              </div>
            </div>

            <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">
              Ledger Splits ({selectedExpense.splitType === 'equal' ? 'Equally Shared' : selectedExpense.splitType})
            </h4>
            
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 mb-6">
              {selectedExpense.splits?.map((split: any, idx: number) => {
                const isMe = split.uid === user?.uid;
                return (
                  <div key={idx} className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-100 dark:border-slate-850">
                    <span className="text-xs font-extrabold text-slate-700 dark:text-slate-350">
                      {isMe ? 'You' : split.displayName}
                    </span>
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      ₹{split.amount}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedExpense(null)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold uppercase tracking-widest text-3xs rounded-xl"
              >
                Close details
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (confirm('Are you sure you want to delete this expense? This will instantly adjust all roommates balances.')) {
                    await deleteExpense(selectedExpense.id);
                    setSelectedExpense(null);
                  }
                }}
                className="py-3 px-4 bg-rose-600 hover:bg-rose-700 hover:text-white text-white font-extrabold uppercase tracking-widest text-3xs rounded-xl flex items-center justify-center gap-1 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
