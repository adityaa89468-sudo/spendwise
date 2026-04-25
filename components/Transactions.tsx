
import React, { useState } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { useCategories } from '../hooks/useCategories';
import { 
  Search, 
  Filter, 
  Trash2, 
  Calendar,
  Tag
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import CategoryIcon from './CategoryIcon';

import { formatCurrency } from '../lib/utils';

const Transactions: React.FC = () => {
  const { profile } = useAuth();
  const { transactions, loading, deleteTransaction } = useTransactions();
  const { categories } = useCategories();
  const currency = profile?.currency || 'INR';
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState('all');

  const getCategoryInfo = (catName: string) => {
    return categories.find(c => c.name === catName) || { color: '#71717a', icon: 'Tag' };
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.category.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (t.note && t.note.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
    return matchesSearch && matchesType && matchesCategory;
  });

  if (loading) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black tracking-tight mb-8 px-2">Transactions</h2>

      {/* Search and Filters */}
      <div className="space-y-4 px-2">
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Search by category or note..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 ring-indigo-50 dark:ring-indigo-900/20 shadow-sm font-medium transition-all text-sm"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
          <button 
            onClick={() => setFilterType('all')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${filterType === 'all' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-800'}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilterType('income')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${filterType === 'income' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-800'}`}
          >
            Income
          </button>
          <button 
            onClick={() => setFilterType('expense')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${filterType === 'expense' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-800'}`}
          >
            Expenses
          </button>
        </div>
      </div>

      {/* Ad slot integration */}
      <div className="mx-2 h-[60px] bg-white/50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center opacity-40">
        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-400">Sponsored Record</p>
      </div>

      {/* Transactions List */}
      <div className="space-y-3 pb-24">
        {filteredTransactions.map((tx) => {
          const catInfo = getCategoryInfo(tx.category);
          return (
            <div 
              key={tx.id} 
              className="group p-4 bg-white dark:bg-slate-900 rounded-[1.75rem] border border-slate-100 dark:border-slate-800 shadow-sm active:scale-[0.98] transition-all relative overflow-hidden"
            >
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm"
                    style={{ backgroundColor: catInfo.color }}
                  >
                    <CategoryIcon iconName={catInfo.icon} type={tx.type} />
                  </div>
                  <div>
                    <p className="font-bold text-sm tracking-tight mb-0.5">{tx.category}</p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(tx.date), 'MMM d')}</span>
                      {tx.note && <span className="flex items-center gap-1 max-w-[100px] truncate"><Tag className="w-3 h-3" /> {tx.note}</span>}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <p className={`text-base font-black tracking-tight ${tx.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                  </p>
                  <button 
                    onClick={() => deleteTransaction(tx.id)}
                    className="p-2.5 text-slate-300 hover:text-red-500 active:bg-red-50 dark:active:bg-red-900/20 rounded-xl transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredTransactions.length === 0 && (
          <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800">
            <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-200 dark:text-slate-800 shadow-sm">
              <Filter className="w-8 h-8" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No matching records found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
