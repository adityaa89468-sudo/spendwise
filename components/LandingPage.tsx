import React from 'react';
import { motion } from 'framer-motion';
import { 
  Coins, 
  ArrowRight, 
  CheckCircle, 
  Users, 
  Zap, 
  CreditCard, 
  ShieldCheck, 
  Sparkles,
  HelpCircle,
  FileText
} from 'lucide-react';
import { SpendWiseLogo } from './SpendWiseLogo';
import { Link } from 'react-router-dom';

interface LandingPageProps {
  onGetStarted: () => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, darkMode, setDarkMode }) => {
  return (
    <div className={`min-h-screen flex flex-col justify-between overflow-x-hidden relative ${darkMode ? 'bg-slate-950 text-white dark' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Background Decorative Elements */}
      <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-indigo-50/40 dark:from-indigo-950/10 to-transparent pointer-events-none z-0" />
      <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-indigo-200/10 dark:bg-indigo-900/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-emerald-200/10 dark:bg-emerald-900/5 rounded-full blur-3xl pointer-events-none" />

      {/* Navigation Header */}
      <header className="py-5 px-6 max-w-6xl w-full mx-auto flex justify-between items-center relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-indigo-650 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/10">
            <SpendWiseLogo variant="icon" className="w-8 h-8 text-white" darkMode={true} />
          </div>
          <div>
            <h1 className="font-black text-base tracking-tight text-slate-900 dark:text-white leading-none">Flat Hisab</h1>
            <span className="text-[9px] font-black tracking-widest uppercase text-indigo-600 dark:text-indigo-400">
              Co-Living Ledger
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme switcher */}
          <button 
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className="p-2.5 bg-white dark:bg-slate-900 border border-slate-150/50 dark:border-slate-800 rounded-xl shadow-xs hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            {darkMode ? <span className="text-xs">☀️</span> : <span className="text-xs">🌙</span>}
          </button>

          <button
            onClick={onGetStarted}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-3xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer active:scale-95"
          >
            Sign In
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 md:py-20 relative z-10 flex flex-col items-center justify-center">
        
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100/40 dark:border-indigo-900/40 text-indigo-650 dark:text-indigo-400 rounded-full text-[9px] font-black uppercase tracking-widest mb-6"
          >
            <Sparkles className="w-3 h-3 text-indigo-500 animate-pulse" />
            <span>100% Free Roommate Expense Splitter</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-none text-slate-900 dark:text-white mb-6"
          >
            Roommate expenses, <br className="hidden md:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-400 dark:from-indigo-400 dark:to-indigo-300">
              perfectly simplified.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-sm md:text-base text-slate-500 dark:text-slate-400 leading-relaxed font-semibold max-w-2xl mx-auto mb-10"
          >
            The ultimate co-living utility built specifically for flatmates and roommates. 
            Instantly split rent, electricity bills, household groceries, and domestic supplies. 
            Automate calculations to eliminate roommate arguments.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button
              onClick={onGetStarted}
              className="group px-8 py-4.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-2xs rounded-2xl shadow-xl shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-3 cursor-pointer relative overflow-hidden"
            >
              <span className="relative z-10">Get Started Now</span>
              <ArrowRight className="w-4 h-4 relative z-10 transition-transform group-hover:translate-x-1" />
            </button>
            
            <a
              href="#features"
              className="px-6 py-4.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-150/45 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 font-black uppercase tracking-widest text-2xs rounded-2xl shadow-xs transition-colors cursor-pointer"
            >
              Explore Features
            </a>
          </motion.div>
        </div>

        {/* Feature Bento Grid Section */}
        <section id="features" className="w-full pt-16 border-t border-slate-200/40 dark:border-slate-900">
          <div className="text-center mb-12">
            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">
              Everything You Need
            </h3>
            <h4 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white uppercase tracking-wide">
              Built for Roommates & Flatmates
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850/60 rounded-[2rem] shadow-xs flex flex-col justify-between group hover:border-indigo-100 dark:hover:border-slate-800 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-650 dark:text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                <Coins className="w-6 h-6" />
              </div>
              <div>
                <h5 className="font-extrabold text-sm uppercase tracking-wider text-slate-800 dark:text-white mb-2">
                  Equal & Custom Splits
                </h5>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                  Split any utility bill, dinner, or domestic item cleanly. Choose whether to split equally, or customize shares based on specific flatmates who shared the expense.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850/60 rounded-[2rem] shadow-xs flex flex-col justify-between group hover:border-indigo-100 dark:hover:border-slate-800 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-650 dark:text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h5 className="font-extrabold text-sm uppercase tracking-wider text-slate-800 dark:text-white mb-2">
                  Debt Simplification
                </h5>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                  Our smart algorithmic engine automatically computes net balances and group dynamics to minimize the total number of transactions needed to completely settle up.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850/60 rounded-[2rem] shadow-xs flex flex-col justify-between group hover:border-indigo-100 dark:hover:border-slate-800 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-655 dark:text-amber-400 mb-6 group-hover:scale-110 transition-transform">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h5 className="font-extrabold text-sm uppercase tracking-wider text-slate-800 dark:text-white mb-2">
                  Integrated UPI / QR Settle
                </h5>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                  No more manually typing bank account numbers. Pay flatmates directly via standard UPI scanner prompts or direct deep links to complete the payment instantly.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850/60 rounded-[2rem] shadow-xs flex flex-col justify-between group hover:border-indigo-100 dark:hover:border-slate-800 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-pink-50 dark:bg-pink-950/40 flex items-center justify-center text-pink-650 dark:text-pink-400 mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h5 className="font-extrabold text-sm uppercase tracking-wider text-slate-800 dark:text-white mb-2">
                  Seamless Flat Onboarding
                </h5>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                  Create a virtual roommate flat in 3 seconds. Share a secure 6-digit numeric invite code or instant deep link with your flatmates to connect them to the network.
                </p>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850/60 rounded-[2rem] shadow-xs flex flex-col justify-between group hover:border-indigo-100 dark:hover:border-slate-800 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-650 dark:text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h5 className="font-extrabold text-sm uppercase tracking-wider text-slate-800 dark:text-white mb-2">
                  Secure & Compliant
                </h5>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                  Built on top of secure Firebase Firestore DB and standard OAuth guidelines. We respect your data confidentiality and maintain full compliance with Google Publisher Guidelines.
                </p>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850/60 rounded-[2rem] shadow-xs flex flex-col justify-between group hover:border-indigo-100 dark:hover:border-slate-800 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-650 dark:text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h5 className="font-extrabold text-sm uppercase tracking-wider text-slate-800 dark:text-white mb-2">
                  Ethical AdModel
                </h5>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                  Flat Hisab is supported by completely non-obtrusive, hand-picked roommate sponsorships (e.g. broadband deals, roommate pizzas). No popups, no tracking.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* CTA section */}
        <section className="w-full text-center mt-20 p-8 md:p-12 bg-gradient-to-br from-indigo-550 to-indigo-750 text-white rounded-[2.5rem] shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
          <div className="relative z-10 max-w-xl mx-auto space-y-6">
            <h4 className="text-3xl font-black uppercase tracking-tight leading-none">
              Start splitting bills today
            </h4>
            <p className="text-xs text-indigo-100 leading-relaxed font-medium">
              Join thousands of flatmates who trust Flat Hisab to handle roommate group bills. No spreadsheets, no arguments, just perfect harmony.
            </p>
            <button
              onClick={onGetStarted}
              className="px-8 py-4 bg-white text-indigo-700 font-black uppercase tracking-widest text-2xs rounded-2xl shadow-lg hover:bg-slate-55 transition-colors cursor-pointer active:scale-95"
            >
              Get Started Free
            </button>
          </div>
        </section>

      </main>

      {/* Footer & Policies */}
      <footer className="pt-10 pb-8 border-t border-slate-250/20 dark:border-slate-900 bg-white/40 dark:bg-slate-950/40 relative z-10 text-center flex flex-col items-center justify-center gap-4">
        <div className="flex flex-wrap items-center justify-center gap-6 px-4">
          <Link
            to="/privacy"
            className="text-[10px] text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Privacy Policy</span>
          </Link>
          <span className="text-slate-300 dark:text-slate-800 text-xs hidden sm:inline">|</span>
          <Link
            to="/terms"
            className="text-[10px] text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Terms & Conditions</span>
          </Link>
        </div>

        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider space-y-1">
          <p>Flat Hisab: Expense Splitter © {new Date().getFullYear()}</p>
          <p className="text-[9.5px] text-slate-500 dark:text-slate-400 normal-case font-semibold">Made by Aditya</p>
        </div>
      </footer>

    </div>
  );
};
