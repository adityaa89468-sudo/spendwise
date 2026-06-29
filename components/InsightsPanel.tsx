import React from 'react';
import { useRoom } from '../context/RoomContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { ArrowUp, Sparkles, Flame, Award, FileSpreadsheet, Download, RefreshCw } from 'lucide-react';

const COLORS = ['#71717a', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4', '#13b194', '#f97316', '#ec4899'];

const InsightsPanel: React.FC = () => {
  const { expenses, currentGroup } = useRoom();

  const totalSpent = expenses.reduce((acc, current) => acc + current.amount, 0);

  // 1. Group expenses by Category
  const categoryMap: { [cat: string]: number } = {};
  expenses.forEach(exp => {
    categoryMap[exp.category] = (categoryMap[exp.category] || 0) + exp.amount;
  });

  const categoryData = Object.keys(categoryMap).map(key => ({
    name: key,
    value: categoryMap[key]
  }));

  // 2. Weekly / Daily history charting
  const dailyHistoryMap: { [date: string]: number } = {};
  expenses.slice(0, 15).forEach(exp => {
    dailyHistoryMap[exp.date] = (dailyHistoryMap[exp.date] || 0) + exp.amount;
  });

  const historyData = Object.keys(dailyHistoryMap).map(key => ({
    date: new Date(key).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }),
    amount: dailyHistoryMap[key]
  })).reverse();

  // 3. Roommate point rankings Sorted
  const rankings = currentGroup?.members ? [...currentGroup.members] : [];
  rankings.sort((a, b) => b.score - a.score);

  // Download logic simulation
  const exportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,Date,Title,Category,Amount,Payer\r\n";
    expenses.forEach(e => {
      csvContent += `${e.date},"${e.title.replace(/"/g, '""')}",${e.category},${e.amount},${e.payerName}\r\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${currentGroup?.name || 'Room'}_Expenses_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-3xl font-black text-slate-950 dark:text-white tracking-tight">
          Analytics
        </h2>
        <button
          onClick={exportCSV}
          disabled={expenses.length === 0}
          className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl font-black text-2xs uppercase tracking-widest text-indigo-600 dark:text-indigo-400 shadow-sm active:scale-95 transition-all flex items-center gap-1 hover:border-slate-200"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {/* Aggregate Spend banner */}
      <div className="p-6 bg-gradient-to-br from-indigo-50/50 to-indigo-50/10 dark:from-indigo-950/20 dark:to-indigo-950/5 rounded-[2rem] border border-indigo-100/30">
        <p className="text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-widest leading-none mb-1">Total Room Spending</p>
        <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">₹{totalSpent.toLocaleString()}</h3>
        <p className="text-[10px] text-slate-400 font-bold mt-2">Aggregated across all roommates since room inception</p>
      </div>

      {/* Expense Trend Charts */}
      {expenses.length > 0 ? (
        <div className="space-y-6">
          {/* Spend history chart */}
          <div className="android-card overflow-hidden">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Recent Spend Trends</p>
            <div className="h-44 w-full -mx-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData.length > 0 ? historyData : [{ date: "No data", amount: 0 }]}>
                  <defs>
                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                    cursor={{ stroke: '#4f46e5', strokeWidth: 1 }}
                  />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} fontWeight="bold" tickLine={false} axisLine={false} />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#trendGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Breakdown Bar chart */}
          <div className="android-card">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Category Distribution</p>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} fontWeight="bold" tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="value" fill="#4f46e5" radius={[8, 8, 0, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 opacity-30">No expenses spent to visualize. Add an entry in Dashboard or Chat!</div>
      )}

      {/* Leaderboard points & payments metrics */}
      <div className="space-y-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Roommate payments Leaderboard</p>
        
        <div className="space-y-3">
          {rankings.map((member, idx) => {
            const hasStreak = member.score >= 90;
            return (
              <div key={member.uid} className="p-4 bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center ${
                    idx === 0 ? 'bg-amber-100 text-amber-700' 
                      : idx === 1 ? 'bg-slate-200 text-slate-700'
                      : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400'
                  }`}>
                    {idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{member.displayName}</p>
                      {hasStreak && (
                        <span className="flex items-center gap-0.5 text-[8px] font-black uppercase text-orange-500 bg-orange-50 dark:bg-orange-950/40 px-1.5 py-0.5 rounded-lg">
                          <Flame className="w-3 h-3 fill-orange-500" /> ON FIRE
                        </span>
                      )}
                    </div>
                    <p className="text-[9px] text-slate-400 font-bold mt-1">XP points score indicator: {member.score} / 100</p>
                  </div>
                </div>

                <div className="w-16 bg-slate-100 dark:bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${member.score >= 80 ? 'bg-green-500' : member.score >= 50 ? 'bg-indigo-500' : 'bg-red-500'}`} style={{ width: `${member.score}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default InsightsPanel;
