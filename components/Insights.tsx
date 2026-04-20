
import React, { useMemo, useState, useEffect } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis
} from 'recharts';
import { BrainCircuit, Sparkles, MessageSquare } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#71717a'];

const Insights: React.FC = () => {
  const { transactions, loading } = useTransactions();
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const categoryData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const totals: Record<string, number> = {};
    expenses.forEach(t => {
      totals[t.category] = (totals[t.category] || 0) + t.amount;
    });
    return Object.entries(totals).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const generateAIInsight = async () => {
    if (transactions.length === 0) return;
    
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Analyze these financial transactions for the user. Summarize their spending habits in 3 short, actionable bullet points. Mention areas to save if possible. 
      Transactions: ${JSON.stringify(transactions.slice(0, 10))}`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      
      setAiInsight(response.text || "No insights available right now.");
    } catch (err) {
      console.error(err);
      setAiInsight("Unable to generate AI insights at the moment.");
    } finally {
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    if (transactions.length > 0 && !aiInsight && !isAiLoading) {
      generateAIInsight();
    }
  }, [transactions]);

  if (loading) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <h2 className="text-3xl font-black tracking-tight mb-8 px-2">Analysis</h2>

      {/* AI Box */}
      <div className="p-8 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12">
          <BrainCircuit className="w-32 h-32" />
        </div>
        <div className="flex items-center gap-2 mb-4 relative z-10">
          <Sparkles className="w-5 h-5 text-indigo-200" />
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-100">AI Spending Analysis</p>
        </div>
        
        {isAiLoading ? (
          <div className="flex flex-col items-center py-6">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-white rounded-full animate-spin mb-4"></div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-100">Analyzing your wall...</p>
          </div>
        ) : (
          <div className="relative z-10">
            <div className="text-sm font-medium leading-relaxed mb-6 whitespace-pre-wrap tracking-tight">
              {aiInsight || "Add a few more transactions to unlock smart AI insights!"}
            </div>
            <button 
              onClick={generateAIInsight}
              className="px-6 py-3 bg-white/20 hover:bg-white/30 active:scale-95 backdrop-blur-md rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Refresh Insights
            </button>
          </div>
        )}
      </div>

      {/* Category Breakdown */}
      <div className="android-card">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Category Split</p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={8}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={12} />
                ))}
              </Pie>
              <Tooltip 
                 contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '10px', fontWeight: 'bold' }}
              />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 leading-none">Main Category</p>
          <p className="text-xl font-black text-indigo-600 leading-none">
            {categoryData.sort((a,b) => b.value - a.value)[0]?.name || '-'}
          </p>
        </div>
        <div className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 leading-none">Avg. Spend</p>
          <p className="text-xl font-black text-indigo-600 leading-none truncate">
            ${transactions.length > 0 ? (transactions.reduce((acc, t) => acc + t.amount, 0) / transactions.length).toFixed(0) : '0'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Insights;
