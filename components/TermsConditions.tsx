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
          <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mb-8">Effective Date: May 31, 2026</p>

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-slate-700 dark:text-slate-300">
            <section>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3">1. Acceptance of Terms</h2>
              <p>
                By downloading, installing, or utilising <strong>Spendwise</strong>, these Terms & Conditions automatically apply to you in full. If you do not agree with any of the terms outlined herein, you must immediately terminate use of the app and uninstall it. You are granted a personal, non-transferrable, non-exclusive license to use Spendwise for your personal or household budget collaboration.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3">2. Service Modifications & Pricing Policy</h2>
              <p>
                We reserve the right to modify, suspend, or discontinue any aspect of Spendwise or charge for services or optional premium tier updates, at any time and for any reason. We will never introduce a fee without providing full, transparent disclosures regarding pricing structures and features in advance.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3">3. User Obligations & Device Integrity</h2>
              <p>
                Spendwise processes financial logs and calculations that reside either locally or are synchronised with Google Cloud Firebase. It is your absolute responsibility to keep your device, account parameters, and login credentials protected. We strongly advise against jailbreaking, rooting, or otherwise modifying your mobile operating system, as this compromises security defenses and may lead to data leakage or incorrect application operation.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3">4. Third-Party Licenses & External Terms</h2>
              <p>
                The app incorporates verified external SDKs that operate under their own independent terms of service. You are bound by the respective policies of the following third-party integrations:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <a target="_blank" rel="noopener noreferrer" href="https://policies.google.com/privacy" className="text-indigo-600 dark:text-indigo-400 underline font-medium">Google Play Services Terms of Use</a>
                </li>
                <li>
                  <a target="_blank" rel="noopener noreferrer" href="https://support.google.com/admob/answer/6128543" className="text-indigo-600 dark:text-indigo-400 underline font-medium">Google AdMob Terms</a>
                </li>
                <li>
                  <a target="_blank" rel="noopener noreferrer" href="https://firebase.google.com/terms" className="text-indigo-600 dark:text-indigo-400 underline font-medium">Firebase Terms of Service</a>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3">5. Disclaimer of Liability & Accuracy of Calculations</h2>
              <p>
                Spendwise is provided strictly on an "as-is" and "as available" basis without warranties of any kind, whether express or implied. Though we utilize a robust algorithmic debt reduction pipeline to compute roommates' optimal settlements, physical currency handovers and external UPI transfers are performed exclusively by you outside of our direct application environment. The Developer is not responsible for any tracking disputes, banking transaction failures, or inaccurate calculations stemming from invalid manual parameters.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3">6. Updates to These Terms</h2>
              <p>
                We may revise these Terms and Conditions periodically to align with Google Play rules or statutory provisions. Revisions take effect immediately upon being posted on this view. We advise users to check this page regularly.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3">7. Contact Information</h2>
              <p>
                If you have any feedback, legal queries, or questions regarding these Terms & Conditions, please contact us directly at:
              </p>
              <p className="font-extrabold text-indigo-600 dark:text-indigo-400 mt-2">
                Developer Contact: adityaa89468@gmail.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsConditions;
