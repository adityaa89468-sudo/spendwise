import React, { useState, useRef } from 'react';
import { useRoom } from '../context/RoomContext';
import { analyzeReceipt, chatWithAssistant, parseVoiceInput } from '../services/geminiService';
import { Sparkles, Send, Mic, FileText, Image, AlertCircle, ShoppingBag, Check, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const SAMPLE_QUESTIONS = [
  "How can we reduce our grocery bills?",
  "How does the dynamic settlement work?",
  "Best ways to split household utility bills"
];

const AIScreen: React.FC = () => {
  const { addExpense, currentGroup, expenses } = useRoom();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'assistant',
      text: "👋 Hi! I am SpendWise AI, your smart budgeting companion. Ask me any room spending questions or upload a receipt to parse items instantly!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  // Receipt Scanner States
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice Inputs States
  const [recording, setRecording] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [parsedVoiceExpense, setParsedVoiceExpense] = useState<any | null>(null);

  const currentExpensesTotal = expenses.reduce((acc, current) => acc + current.amount, 0);

  // Send standard chat message
  const handleSendText = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const response = await chatWithAssistant(text, currentExpensesTotal);
      const hostMsg: Message = {
        id: Math.random().toString(),
        sender: 'assistant',
        text: response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, hostMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger Gemini Receipt Analysis
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setScanning(true);
    setScanResult(null);

    try {
      const result = await analyzeReceipt(file, file.name);
      setScanResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setScanning(false);
    }
  };

  // Save Scanned Receipt Expense to Firestore
  const handleAcceptScanExpense = async () => {
    if (!scanResult || !currentGroup) return;
    
    // Equal split among all active room members
    const members = currentGroup.members;
    const perPerson = parseFloat((scanResult.amount / members.length).toFixed(2));
    const splits = members.map(m => ({
      uid: m.uid,
      displayName: m.displayName,
      amount: perPerson,
      share: 100 / members.length
    }));

    await addExpense(
      scanResult.title,
      scanResult.amount,
      scanResult.category || "Groceries",
      "equal",
      splits
    );

    setScanResult(null);
    setFileName('');
    
    // Announce transaction logged
    const alertMsg: Message = {
      id: Math.random().toString(),
      sender: 'assistant',
      text: `🛒 I've processed the scanned receipt and created a split transaction: **"${scanResult.title}" (₹${scanResult.amount})**. Check your Home tab!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, alertMsg]);
  };

  // Simulate Speaking to Microphone
  const simulateVoiceRecording = () => {
    if (recording) {
      setRecording(false);
      return;
    }

    setRecording(true);
    setParsedVoiceExpense(null);

    const simulationPhrases = [
      "I spent 600 for the gas cylinder yesterday",
      "John paid 340 for milk packets",
      "We bought Maggi stock for 480 rupees"
    ];
    const spoken = simulationPhrases[Math.floor(Math.random() * simulationPhrases.length)];
    
    setTimeout(async () => {
      setRecording(false);
      setVoiceText(spoken);
      
      const parsed = await parseVoiceInput(spoken);
      setParsedVoiceExpense(parsed);
    }, 2500);
  };

  const handleAcceptVoiceExpense = async () => {
    if (!parsedVoiceExpense || !currentGroup) return;

    const members = currentGroup.members;
    const perPerson = parseFloat((parsedVoiceExpense.amount / members.length).toFixed(2));
    const splits = members.map(m => ({
      uid: m.uid,
      displayName: m.displayName,
      amount: perPerson,
      share: 100 / members.length
    }));

    await addExpense(
      parsedVoiceExpense.title,
      parsedVoiceExpense.amount,
      parsedVoiceExpense.category,
      "equal",
      splits
    );

    setParsedVoiceExpense(null);
    setVoiceText('');

    const alertMsg: Message = {
      id: Math.random().toString(),
      sender: 'assistant',
      text: `🎙️ Voice Parsed Expense: Logged **"${parsedVoiceExpense.title}" (₹${parsedVoiceExpense.amount} in ${parsedVoiceExpense.category})** split equally among roommates.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, alertMsg]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <h2 className="text-3xl font-black text-slate-950 dark:text-white tracking-tight px-2 flex items-center gap-2">
        <Sparkles className="w-8 h-8 text-indigo-600" /> AI Assistant
      </h2>

      {/* Dual Tabs - Scanner controls at top, chat scrolling, vocal helper at bottom */}
      <div className="grid grid-cols-2 gap-3">
        {/* OCR Receipt Upload Panel */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <span className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl inline-block mb-3">
              <FileText className="w-5 h-5" />
            </span>
            <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 leading-tight">Gemini OCR Receipt Scan</h4>
            <p className="text-[10px] text-slate-400 mt-1">Upload meal bills or grocery receipts to extract splits instantly</p>
          </div>

          <div className="pt-4">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/50 dark:hover:bg-slate-950 text-indigo-600 dark:text-indigo-400 font-black text-3xs uppercase tracking-wider rounded-xl border border-dashed border-slate-200 dark:border-slate-800 transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Image className="w-3.5 h-3.5" /> Choose Bill
            </button>
          </div>
        </div>

        {/* Voice Parser input panel */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <span className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl inline-block mb-3">
              <Mic className="w-5 h-5" />
            </span>
            <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 leading-tight">AI Voice Parser Panel</h4>
            <p className="text-[10px] text-slate-400 mt-1">Speak details e.g. "Sunil paid 450 for milk tea packets"</p>
          </div>

          <div className="pt-4">
            <button
              onClick={simulateVoiceRecording}
              className={`w-full py-2.5 font-black text-3xs uppercase tracking-wider rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                recording 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              {recording ? 'Listening...' : 'Speak Bill'}
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic results previews (Scans and voice) */}
      <AnimatePresence>
        {/* Receipt Scan Loading Indicator */}
        {scanning && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 rounded-[2rem] border border-dashed border-indigo-200 flex items-center justify-center gap-3"
          >
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-bold">Scanning "{fileName}" with Gemini 3.5 OCR...</p>
          </motion.div>
        )}

        {/* OCR Scan extracted detail card */}
        {!scanning && scanResult && (
          <motion.div 
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -15, opacity: 0 }}
            className="p-5 bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-indigo-500/30 flex flex-col relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-black text-3xs uppercase tracking-wider rounded-lg">Extracted Receipt</span>
                <h4 className="font-black text-base text-slate-800 dark:text-slate-100 mt-2">{scanResult.title}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Suggested as {scanResult.category || 'Groceries'}</p>
              </div>

              <div className="text-right">
                <p className="text-2xl font-black text-slate-950 dark:text-white">₹{scanResult.amount}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">Total</p>
              </div>
            </div>

            {scanResult.items && scanResult.items.length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl space-y-2.5 mb-4">
                {scanResult.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-600 dark:text-slate-400">{item.name}</span>
                    <span className="font-black text-slate-800 dark:text-white">₹{item.price}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setScanResult(null)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 font-black text-3xs uppercase tracking-wider hover:bg-slate-200 transition-colors"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleAcceptScanExpense}
                className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-black text-3xs uppercase tracking-wider hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1"
              >
                <Check className="w-3.5 h-3.5" /> Save transaction Split
              </button>
            </div>
          </motion.div>
        )}

        {/* Voice Expense Parsed Card */}
        {recording && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-5 bg-red-50 dark:bg-red-950/20 text-red-600 rounded-[2rem] border border-dashed border-red-200 flex items-center justify-center gap-2.5"
          >
            <Mic className="w-5 h-5 animate-ping text-red-500" />
            <p className="text-xs font-black uppercase tracking-wider">Listening to vocal audio stream...</p>
          </motion.div>
        )}

        {!recording && parsedVoiceExpense && (
          <motion.div 
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="p-5 bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-red-500/30 flex flex-col"
          >
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Spoken Input Dialogue</p>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 italic bg-slate-50 dark:bg-slate-950 p-3 rounded-xl mb-4">"{voiceText}"</p>

            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="px-2.5 py-1 bg-red-50 dark:bg-red-950 text-red-600 rounded-lg text-3xs font-black uppercase tracking-wider">AI Voice Extracted</span>
                <h4 className="font-black text-base text-slate-800 dark:text-slate-100 mt-2">{parsedVoiceExpense.title}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Category {parsedVoiceExpense.category}</p>
              </div>

              <div className="text-right">
                <p className="text-2xl font-black text-slate-950 dark:text-white">₹{parsedVoiceExpense.amount}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest scroll-mt-2 leading-none mt-1">Amount</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setParsedVoiceExpense(null)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 font-black text-3xs uppercase tracking-wider hover:bg-slate-200 text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAcceptVoiceExpense}
                className="flex-[2] py-3 bg-red-500 text-white rounded-xl font-black text-3xs uppercase tracking-wider hover:bg-red-600 text-center flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" /> Log Split Transaction
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gemini Chat Scroll Screen Area */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mb-2">
          <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" /> Ask chatbot anything
        </h3>

        {/* Messages List Area */}
        <div className="space-y-4 max-h-72 overflow-y-auto pb-4 px-1 scrollbar-thin">
          {messages.map(msg => {
            const bot = msg.sender === 'assistant';
            return (
              <div 
                key={msg.id} 
                className={`flex flex-col max-w-[85%] ${bot ? 'self-start mr-auto' : 'self-end ml-auto items-end'}`}
              >
                <div 
                  className={`p-4 rounded-3xl text-sm leading-relaxed ${
                    bot 
                      ? 'bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200' 
                      : 'bg-indigo-600 text-white'
                  }`}
                  style={{ whiteSpace: 'pre-line' }}
                >
                  {msg.text}
                </div>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1 px-2">
                  {msg.timestamp}
                </span>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-2 self-start bg-slate-50 dark:bg-slate-950 p-4 rounded-3xl max-w-[40%] items-center">
              <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-100"></div>
              <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-200"></div>
            </div>
          )}
        </div>

        {/* Sample click questions triggers */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {SAMPLE_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendText(q)}
              className="text-[10px] font-bold py-2 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-indigo-600 dark:text-indigo-400 whitespace-nowrap active:scale-95 transition-all text-left shrink-0"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input box */}
        <div className="flex gap-2 pt-2 border-t border-slate-50 dark:border-slate-800/60">
          <input
            type="text"
            placeholder="Type message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendText(inputText)}
            className="flex-1 text-xs font-bold p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl focus:outline-none dark:text-white"
          />
          <button
            onClick={() => handleSendText(inputText)}
            className="p-3.5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 active:scale-90 transition-transform cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIScreen;
