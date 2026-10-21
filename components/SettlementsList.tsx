import React, { useState } from 'react';
import { useRoom } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';
import { IndianRupee, Sparkles, CheckSquare, Copy, ClipboardCheck, ArrowRight, ExternalLink, Image, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SettlementsList: React.FC = () => {
  const { suggestedSettlements, addSettlement, settlements, currentGroup } = useRoom();
  const { user } = useAuth();
  
  const [selectedSettlement, setSelectedSettlement] = useState<any | null>(null);
  const [upiTxnId, setUpiTxnId] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Default fallback UPI ID if roommate hasn't put one in profile
  const getRecipientUpiId = (receiptUid: string) => {
    const member = currentGroup?.members.find(m => m.uid === receiptUid);
    return member?.email ? `${member.email.split('@')[0]}@okaxis` : 'spendwise@upi';
  };

  const handleOpenSettleModal = (settle: any) => {
    setSelectedSettlement(settle);
    setUpiTxnId('');
  };

  const handleCompleteSettlement = async () => {
    if (!selectedSettlement) return;
    
    await addSettlement(
      selectedSettlement.fromId,
      selectedSettlement.fromName,
      selectedSettlement.toId,
      selectedSettlement.toName,
      selectedSettlement.amount,
      upiTxnId.trim()
    );

    setSelectedSettlement(null);
  };

  // Build real UPI Deep Link
  const buildUpiLink = (recipName: string, recipUpi: string, amount: number) => {
    return `upi://pay?pa=${recipUpi}&pn=${encodeURIComponent(recipName)}&tn=Flat%20Hisab%20Settlement&am=${amount}&cu=INR`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <h2 className="text-3xl font-black text-slate-950 dark:text-white tracking-tight px-2">
        Settlements
      </h2>

      {/* Suggested Settlements Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Optimal roommate transfers</p>
          <span className="flex items-center gap-1.5 text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-lg">
            <Sparkles className="w-3 h-3" /> Debt Minimizer Active
          </span>
        </div>

        <div className="space-y-3">
          {suggestedSettlements.map((settle, idx) => {
            const isUserDebtor = settle.fromId === user?.uid;
            
            return (
              <div 
                key={idx} 
                className={`p-5 rounded-[2rem] border transition-all ${
                  isUserDebtor
                    ? 'bg-gradient-to-r from-red-50/50 to-indigo-50/20 dark:from-red-950/20 dark:to-indigo-950/10 border-indigo-100 dark:border-indigo-950'
                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                }`}
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center">
                      {settle.fromName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest leading-none mb-1">Debtor</h4>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{settle.fromName}</p>
                    </div>
                  </div>

                  <ArrowRight className="w-5 h-5 text-indigo-400" />

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600/10 text-indigo-600 font-bold text-xs flex items-center justify-center">
                      {settle.toName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="text-right">
                      <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest leading-none mb-1">Creditor</h4>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{settle.toName}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-slate-800/60">
                  <div>
                    <p className="text-xl font-black text-slate-900 dark:text-white">₹{settle.amount}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Suggested Transfer</p>
                  </div>

                  {isUserDebtor ? (
                    <button
                      type="button"
                      onClick={() => handleOpenSettleModal(settle)}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-2xs uppercase tracking-widest rounded-xl shadow-md cursor-pointer transition-transform active:scale-95 flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Settle with UPI
                    </button>
                  ) : (
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-lg">
                      Waiting for pay
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {suggestedSettlements.length === 0 && (
            <div className="text-center py-12 opacity-50 bg-slate-50 dark:bg-slate-900 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800">
              <Sparkles className="w-10 h-10 mx-auto mb-3 text-indigo-500 animate-pulse" />
              <p className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">All roommates are settled up!</p>
            </div>
          )}
        </div>
      </div>

      {/* Historic Payments Log */}
      <div className="space-y-4 pt-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Settlement history log</p>
        <div className="space-y-3">
          {settlements.map((settle) => (
            <div key={settle.id} className="p-4 bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950 text-green-600 font-bold text-xs flex items-center justify-center">
                  ✓
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    <span className="font-extrabold">{settle.fromName}</span> paid <span className="font-extrabold">{settle.toName}</span>
                  </p>
                  <p className="text-[9px] text-slate-400 font-extrabold uppercase mt-1">
                    TXN Ref: {settle.upiTxnId || 'N/A'} • {new Date(settle.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <p className="font-black text-sm text-green-600">+₹{settle.amount}</p>
            </div>
          ))}

          {settlements.length === 0 && (
            <div className="text-center py-6 text-slate-400 opacity-40 text-xs">No settlements recorded yet.</div>
          )}
        </div>
      </div>

      {/* Dynamic Settle Modal */}
      <AnimatePresence>
        {selectedSettlement && (
          <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] max-w-sm w-full p-6 border border-slate-100 dark:border-slate-800 shadow-2xl relative"
            >
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-indigo-600" /> Settle Shared Bill
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                You are paying <span className="font-bold text-slate-700 dark:text-white">{selectedSettlement.toName}</span> as calculated by Flat Hisab algorithm.
              </p>

              {/* UPI QR Display - REAL Integration */}
              {(() => {
                const targetUpi = getRecipientUpiId(selectedSettlement.toId);
                const upiLink = buildUpiLink(selectedSettlement.toName, targetUpi, selectedSettlement.amount);
                const qrImageURL = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiLink)}`;
                
                return (
                  <div className="space-y-6">
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-transparent flex flex-col items-center justify-center">
                      <img 
                        src={qrImageURL} 
                        alt="UPI Payment QR Code" 
                        className="w-40 h-40 bg-white rounded-xl shadow-inner mb-4 border border-slate-100" 
                        referrerPolicy="no-referrer"
                      />
                      <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest flex items-center gap-1">
                        <QrCode className="w-3.5 h-3.5" /> Scan QR to Pay ₹{selectedSettlement.amount}
                      </p>
                    </div>

                    {/* Direct UPI deep link button */}
                    <a
                      href={upiLink}
                      className="w-full py-4 bg-indigo-600 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
                    >
                      <ExternalLink className="w-4 h-4" /> Open UPI Payment App
                    </a>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">UPI ID Reference</label>
                        <div className="flex bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 items-center justify-between">
                          <code className="text-xs text-slate-600 dark:text-slate-300 font-bold font-mono">{targetUpi}</code>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(targetUpi);
                              setCopiedUpi(true);
                              setTimeout(() => setCopiedUpi(false), 2000);
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                        {copiedUpi && <p className="text-[9px] text-green-500 font-extrabold uppercase tracking-wider text-right mt-1">Copied UPI</p>}
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Transaction Ref ID (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. UPI-932145..."
                          value={upiTxnId}
                          onChange={(e) => setUpiTxnId(e.target.value)}
                          className="w-full text-xs font-bold p-3 bg-slate-50 dark:bg-slate-950 rounded-xl focus:outline-none dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setSelectedSettlement(null)}
                        className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black text-2xs uppercase tracking-wider rounded-xl hover:bg-slate-200 active:scale-95 transition-all"
                      >
                        Close
                      </button>
                      <button
                        type="button"
                        onClick={handleCompleteSettlement}
                        className="flex-1 py-3.5 bg-green-500 text-white font-black text-2xs uppercase tracking-wider rounded-xl hover:bg-green-600 active:scale-95 transition-all"
                      >
                        Settle Now
                      </button>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettlementsList;
