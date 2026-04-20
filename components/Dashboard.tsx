
import React from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  TrendingUp, 
  TrendingDown,
  Target
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { format, subDays, isSameDay } from 'date-fns';

const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const { transactions, loading } = useTransactions();

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = totalIncome - totalExpenses;
  const budget = profile?.monthlyBudget || 1000;
  const budgetProgress = Math.min((totalExpenses / budget) * 100, 100);

  // Chart data (last 7 days)
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayTransactions = transactions.filter(t => 
      t.type === 'expense' && isSameDay(new Date(t.date), date)
    );
    return {
      name: format(date, 'EEE'),
      amount: dayTransactions.reduce((acc, t) => acc + t.amount, 0),
    };
  });

  if (loading) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Balance Card */}
      <div className="relative p-10 bg-indigo-600 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-200 overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <TrendingUp className="w-40 h-40" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Total Balance</p>
        <h2 className="text-5xl font-black tracking-tighter mb-8">${balance.toLocaleString()}</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-sm">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1 flex items-center gap-1">
              <ArrowUpCircle className="w-3 h-3" /> Income
            </p>
            <p className="text-base font-black">${totalIncome.toLocaleString()}</p>
          </div>
          <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-sm">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1 flex items-center gap-1">
              <ArrowDownCircle className="w-3 h-3" /> Expenses
            </p>
            <p className="text-base font-black">${totalExpenses.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Budget Progress */}
      <div className="android-card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl">
              <Target className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Monthly Budget</p>
              <p className="font-bold text-sm leading-none">${totalExpenses.toLocaleString()} / ${budget.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-2xl font-black text-indigo-600">
            {Math.round(budgetProgress)}%
          </p>
        </div>
        <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 rounded-full ${budgetProgress > 90 ? 'bg-red-500' : 'bg-indigo-600'}`}
            style={{ width: `${budgetProgress}%` }}
          ></div>
        </div>
        {budgetProgress > 85 && (
          <p className="mt-4 text-[10px] font-black text-red-500 uppercase tracking-widest animate-pulse">
            Budget Warning: Limit reached.
          </p>
        )}
      </div>

      {/* Spending Chart */}
      <div className="android-card overflow-hidden">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Weekly Spending</p>
        <div className="h-44 w-full -mx-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '10px', fontWeight: 'bold', background: '#fff' }}
                cursor={{ stroke: '#4f46e5', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="#4f46e5" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorAmount)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="pb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black tracking-tight">Recent Activity</h3>
          <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest p-2 active:bg-indigo-50 dark:active:bg-indigo-900/20 rounded-xl transition-all">View All</button>
        </div>
        <div className="space-y-3">
          {transactions.slice(0, 4).map((tx) => (
            <div key={tx.id} className="p-4 bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 flex items-center justify-between active:scale-[0.98] transition-transform">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tx.type === 'income' ? 'bg-green-50 text-green-600 dark:bg-green-900/20' : 'bg-red-50 text-red-600 dark:bg-red-900/20'}`}>
                  {tx.type === 'income' ? <ArrowUpCircle className="w-6 h-6" /> : <ArrowDownCircle className="w-6 h-6" />}
                </div>
                <div>
                  <p className="font-bold text-sm tracking-tight">{tx.category}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{format(new Date(tx.date), 'MMM d, yyyy')}</p>
                </div>
              </div>
              <p className={`font-black tracking-tight ${tx.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString()}
              </p>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="text-center py-10 opacity-50 bg-slate-100/50 dark:bg-slate-900/50 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800">
              <Wallet className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p className="text-[10px] font-black uppercase tracking-widest">No transactions discovered</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
