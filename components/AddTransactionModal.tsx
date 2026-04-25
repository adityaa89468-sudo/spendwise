
import React, { useState } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { useCategories } from '../hooks/useCategories';
import { showInterstitialAd, prepareInterstitial } from '../services/adService';
import { 
  X, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Calendar, 
  Tag, 
  Plus, 
  Check,
  Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const AddTransactionModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { addTransaction } = useTransactions();
  const { categories, addCategory } = useCategories();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#6366f1');

  React.useEffect(() => {
    if (isOpen) {
      prepareInterstitial();
    }
  }, [isOpen]);

  const filteredCategories = categories.filter(c => c.type === type);

  const handleAddNewCategory = async () => {
    if (!newCatName) return;
    await addCategory(newCatName, type, newCatColor);
    setCategory(newCatName);
    setNewCatName('');
    setShowAddCategory(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    setIsSubmitting(true);
    try {
      await addTransaction({
        amount: parseFloat(amount),
        type,
        category,
        date,
        note,
      });
      setAmount('');
      setNote('');
      onClose();
      
      // Show full screen ad after saving
      showInterstitialAd();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 w-full h-[92vh] bg-white dark:bg-slate-900 rounded-t-[2.5rem] z-50 px-6 pt-6 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-2xl flex flex-col"
          >
            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-6 flex-shrink-0" />
            
            <div className="flex items-center justify-between mb-6">
              <button onClick={onClose} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400 active:scale-90 transition-transform">
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-black tracking-tight">Add Record</h2>
              <div className="w-12"></div>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-6 pb-6 scrollbar-hide">
              {/* Type Switcher */}
              <div className="flex p-1.5 bg-slate-50 dark:bg-slate-800 rounded-[1.75rem] border border-slate-100 dark:border-slate-800">
                <button 
                  type="button"
                  onClick={() => setType('expense')}
                  className={`flex-1 py-4 flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all ${type === 'expense' ? 'bg-white dark:bg-slate-700 text-red-500 shadow-sm' : 'text-slate-400'}`}
                >
                  <ArrowDownCircle className="w-4 h-4" /> Expense
                </button>
                <button 
                  type="button"
                  onClick={() => setType('income')}
                  className={`flex-1 py-4 flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all ${type === 'income' ? 'bg-white dark:bg-slate-700 text-green-500 shadow-sm' : 'text-slate-400'}`}
                >
                  <ArrowUpCircle className="w-4 h-4" /> Income
                </button>
              </div>

              {/* Amount Input */}
              <div className="text-center py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Transaction Amount</p>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-4xl font-black text-slate-300">₹</span>
                  <input 
                    type="number" 
                    inputMode="decimal"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="w-full max-w-[240px] bg-transparent text-6xl font-black tracking-tighter text-center outline-none text-slate-900 dark:text-white focus:text-indigo-600 dark:focus:text-indigo-400 transition-colors placeholder:text-slate-200 dark:placeholder:text-slate-800"
                  />
                </div>
              </div>

              {/* Category Selection */}
              <div>
                <div className="flex items-center justify-between mb-4 ml-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Category</p>
                  <button 
                    type="button"
                    onClick={() => setShowAddCategory(!showAddCategory)}
                    className="text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> New
                  </button>
                </div>

                {showAddCategory && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 mb-4 space-y-3"
                  >
                    <input 
                      type="text" 
                      placeholder="Category name..."
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 p-3 rounded-xl text-sm font-bold outline-none border border-slate-100 dark:border-slate-800"
                    />
                    <div className="flex items-center gap-3">
                      <div className="flex-1 flex items-center gap-2 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        <Palette className="w-4 h-4 text-slate-400" />
                        <input 
                          type="color" 
                          value={newCatColor}
                          onChange={(e) => setNewCatColor(e.target.value)}
                          className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none"
                        />
                      </div>
                      <button 
                        type="button"
                        onClick={handleAddNewCategory}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest"
                      >
                        Add
                      </button>
                    </div>
                  </motion.div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {filteredCategories.map((cat) => (
                    <button 
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.name)}
                      className={`p-4 rounded-2xl border flex items-center justify-between font-bold transition-all active:scale-[0.97] ${category === cat.name ? 'border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}
                      style={{ 
                        backgroundColor: category === cat.name ? cat.color : undefined,
                        color: category === cat.name ? '#fff' : undefined,
                        borderColor: category === cat.name ? cat.color : undefined
                      }}
                    >
                      <span className="text-sm">{cat.name}</span>
                      {category === cat.name && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date and Note */}
              <div className="grid grid-cols-1 gap-3">
                <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Date</p>
                    <input 
                      type="date" 
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-transparent font-bold outline-none text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                    <Tag className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Note</p>
                    <input 
                      type="text" 
                      placeholder="What was this for?"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full bg-transparent font-bold outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full h-16 bg-indigo-600 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-xl flex items-center justify-center gap-4 active:scale-95 transition-all"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Plus className="w-5 h-5" /> Save Transaction
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AddTransactionModal;
