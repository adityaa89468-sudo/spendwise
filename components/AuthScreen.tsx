import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  Home, 
  Mail, 
  Lock, 
  User, 
  AlertCircle, 
  ArrowRight, 
  Sun, 
  Moon, 
  Eye, 
  EyeOff,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthScreenProps {
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ darkMode, setDarkMode }) => {
  const { signInWithGoogleDirect, signInWithEmail, signUpWithEmail } = useAuth();
  
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Friendly error translations for Play Store production polish:
  const getFriendlyError = (err: any): string => {
    const code = err?.code || '';
    const message = err?.message || err?.msg || (typeof err === 'string' ? err : '');

    switch (code) {
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      case 'auth/user-not-found':
        return 'No account matches this email. Please sign up first!';
      case 'auth/wrong-password':
        return 'Incorrect password. Please verify and try again.';
      case 'auth/email-already-in-use':
        return 'This email address is already registered. Choose Log In instead!';
      case 'auth/weak-password':
        return 'Password is too weak. Please use at least 6 characters.';
      case 'auth/operation-not-allowed':
        return 'Email/Password signup is not currently enabled.';
      case 'auth/network-request-failed':
        return 'Network connection error. Check your internet connectivity.';
      default:
        return message || 'Authentication failed. Please try again.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    // Form inputs pre-validation
    if (!email.trim() || !password.trim()) {
      setErrorMsg('All fields are required.');
      setIsSubmitting(false);
      return;
    }

    if (authMode === 'signup' && !fullName.trim()) {
      setErrorMsg('Please specify your Full Name.');
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password should be at least 6 characters.');
      setIsSubmitting(false);
      return;
    }

    try {
      if (authMode === 'login') {
        await signInWithEmail(email.trim(), password);
      } else {
        await signUpWithEmail(email.trim(), password, fullName.trim());
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(getFriendlyError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await signInWithGoogleDirect();
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' || 
        err?.code === 'auth/cancelled-by-user' || 
        err?.message?.includes('closed') ||
        err?.message?.includes('cancel')
      ) {
        setIsSubmitting(false);
        return;
      }
      console.error(err);
      if (window.self !== window.top) {
        setErrorMsg("Google Sign-In popup is restricted inside embedded iframe previews by standard browser privacy controls. Please use the Email & Password login, or click the 'Open in a new tab' button at the top-right of your preview frame to sign in with Google.");
      } else {
        setErrorMsg(getFriendlyError(err));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col justify-between p-6 ${darkMode ? 'bg-slate-950 text-white dark' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Top Header - Icon / Theme Switcher */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md">
            <Home className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-xs uppercase tracking-widest text-slate-400 dark:text-slate-550">
            SpendWise SecOps
          </span>
        </div>
        
        <button 
          type="button"
          onClick={() => setDarkMode(!darkMode)}
          className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-150/40 dark:border-slate-800 shadow-sm transition-all active:scale-95 cursor-pointer"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
        </button>
      </div>

      {/* Main card box */}
      <div className="max-w-md w-full mx-auto my-auto py-6">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-slate-200/40 dark:shadow-none border border-slate-100 dark:border-slate-800 relative z-10 transition-all">
          
          {/* Logo brand & greeting */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">
              SpendWise
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
              Roommate Expense Splitter
            </p>
          </div>

          {/* Toggle Tab Switcher */}
          <div className="relative grid grid-cols-2 gap-1 p-1 bg-slate-50 dark:bg-slate-950/80 rounded-2xl mb-6 border border-slate-100 dark:border-slate-900">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setErrorMsg('');
              }}
              className={`relative py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md border border-slate-100 dark:border-slate-800'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setErrorMsg('');
              }}
              className={`relative py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                authMode === 'signup'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md border border-slate-100 dark:border-slate-800'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Sign Up
            </button>
          </div>

          <p className="text-center text-slate-500 dark:text-slate-400 font-medium text-xs mb-6 leading-relaxed">
            {authMode === 'login' 
              ? 'Enter your credentials to sign in and view your shared bills.'
              : 'Register an account to split bills, track balances, and request roommate settlements.'}
          </p>

          {/* Display Custom Error */}
          <AnimatePresence mode="wait">
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-5 p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{errorMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login/Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name input (Sign Up Only) */}
            <AnimatePresence>
              {authMode === 'signup' && (
                <motion.div
                  initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                  animate={{ height: 'auto', opacity: 1, marginBottom: 16 }}
                  exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 px-0.5">
                    Your Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Aditya Shaw"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full text-xs font-bold pl-11 pr-4 py-3.5 bg-slate-55 dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 border border-slate-100 dark:border-slate-850 dark:text-white"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Address */}
            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 px-0.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="contact@yourdomain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs font-bold pl-11 pr-4 py-3.5 bg-slate-55 dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 border border-slate-100 dark:border-slate-855 dark:text-white"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 px-0.5">
                Secret Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs font-bold pl-11 pr-10 py-3.5 bg-slate-55 dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 border border-slate-100 dark:border-slate-855 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black uppercase tracking-widest text-2xs rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 pt-4 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{authMode === 'login' ? 'Proceed to App' : 'Create My Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Social login divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-100 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest leading-none">
              <span className="px-3 bg-white dark:bg-slate-900 text-slate-400">
                Or Fast-Sign
              </span>
            </div>
          </div>

          {/* Google Sign In option */}
          <button 
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full py-3.5 px-6 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-800 dark:text-white font-black uppercase tracking-widest text-3xs rounded-xl shadow-sm border border-slate-100 dark:border-slate-850 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <img src="https://www.google.com/favicon.ico" className="w-3.5 h-3.5" alt="Google" />
            Continue with Google ID
          </button>

          {window.self !== window.top && (
            <div className="mt-4 p-3.5 bg-indigo-50/80 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-xl text-indigo-700 dark:text-indigo-300 text-3xs font-semibold leading-relaxed">
              <span className="font-black uppercase tracking-wider block mb-1">💡 Sandbox Preview Info:</span>
              Google Sign-In is restricted inside embedded previews due to standard browser cookie rules. If a white screen appears or login fails, please click the <strong className="text-indigo-600 dark:text-indigo-400">"Open in a new tab"</strong> button in the top right corner of the screen, or use the <strong className="text-indigo-600 dark:text-indigo-400">Email & Password</strong> form.
            </div>
          )}
        </div>
      </div>

      {/* Legals & Footer */}
      <div className="max-w-md w-full mx-auto flex justify-center gap-4 text-[9px] font-black uppercase tracking-widest text-slate-400 pt-4">
        <Link to="/privacy" className="hover:text-indigo-600 transition-colors">Privacy Policy</Link>
        <span className="opacity-20 text-slate-300">|</span>
        <Link to="/terms" className="hover:text-indigo-600 transition-colors">Terms of Service</Link>
      </div>

    </div>
  );
};

export default AuthScreen;
