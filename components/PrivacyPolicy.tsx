
import React from 'react';
import { Shield, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
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
            <Shield className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-3xl font-black tracking-tight mb-2">Privacy Policy</h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mb-8">Effective Date: April 20, 2026</p>

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-slate-700 dark:text-slate-300">
            <section>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3">1. Information We Collect</h2>
              <p>SpendWise collects information to provide a better user experience. This includes:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Personal Information:</strong> Contact details such as name and email address when you sign in via Google.</li>
                <li><strong>Transaction Data:</strong> Amounts, categories, and dates of transactions you record.</li>
                <li><strong>Device Information:</strong> Data about your mobile device for ad delivery and app performance monitoring.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3">2. How We Use Information</h2>
              <p>We use your data to synchronize your records across devices via Firebase, provide AI-powered spending insights, and display personalized ads through Google AdMob.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3">3. Data Security</h2>
              <p>We implement robust security measures via Google Firebase to protect your information. However, no electronic storage method is 100% secure.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3">4. Third-Party Services</h2>
              <p>SpendWise uses third-party services that may collect information used to identify you:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Google Play Services</li>
                <li>AdMob</li>
                <li>Firebase Analytics</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3">5. Contact Us</h2>
              <p>If you have questions about this Privacy Policy, please contact us at adityaa89468@gmail.com.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
