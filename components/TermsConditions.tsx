
import React from 'react';
import { FileText, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TermsConditions: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-6 pb-20">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => navigate('/')}
          className="mb-8 p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-2 font-bold text-sm"
        >
          <ArrowLeft className="w-5 h-5" /> Back to App
        </button>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-100">
            <FileText className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-3xl font-black tracking-tight mb-2">Terms & Conditions</h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mb-8">Effective Date: April 20, 2026</p>

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-slate-700 dark:text-slate-300">
            <section>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3">1. Acceptance of Terms</h2>
              <p>By downloading or using SpendWise, these terms will automatically apply to you – you should make sure therefore that you read them carefully before using the app.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3">2. Service Usage</h2>
              <p>You are not allowed to copy, or modify the app, any part of the app, or our trademarks in any way. You are not allowed to attempt to extract the source code of the app.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3">3. Personal Data</h2>
              <p>SpendWise stores and processes personal data that you have provided to us, in order to provide our Service. It is your responsibility to keep your phone and access to the app secure.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3">4. AdMob Advertising</h2>
              <p>The app uses third-party services (AdMob) that declare their own Terms and Conditions. By using the app, you agree to the ad-serving practices of our partners.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3">5. Disclaimer</h2>
              <p>The app is provided "as is" without warranty of any kind. We are not responsible for any financial decisions made based on the records or insights provided by SpendWise.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsConditions;
