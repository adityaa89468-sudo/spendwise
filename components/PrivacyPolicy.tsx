
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
          <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mb-8">Effective Date: May 31, 2026</p>

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-slate-700 dark:text-slate-300">
            <section>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3">1. Introduction & Identity</h2>
              <p>
                <strong>SpendWise</strong> ("we", "our", "us", or "Developer") is committed to protecting your privacy. This Privacy Policy is designed to comply with Google Play Store Developer Policies, including the Google Play Developer Distribution Agreement. It explains how we collect, use, process, store, and request erasure of your personal information when you install, access, or use the SpendWise mobile application.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3">2. Information We Collect & Permission Usage</h2>
              <p>To provide a functional and synchronized budgeting environment for flatmates and roommates, we collect the following types of information:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Account Profile Information:</strong> When you sign in through Google, we request and securely receive your email address, primary profile display name, and unique user identifier (UID).
                </li>
                <li>
                  <strong>Financial Ledger Data:</strong> We store the raw transaction amounts, custom item descriptions, categories, payment logs, and calculation splits that you voluntarily input to manage roommate expenses.
                </li>
                <li>
                  <strong>Camera Permission Notice:</strong> The application includes an AI-based Receipt OCR Scanner. If you choose to upload a photo of a receipt, the app securely transmits the image to Google Gemini AI service solely to extract item names and prices. Images are processed ephemerally and are not permanently stored on our servers.
                </li>
                <li>
                  <strong>Device & Identifier Logs:</strong> We collect hardware information, operating system metadata, and mobile advertising identifiers (such as Android Advertising ID / AAID) strictly to serve advertisements and analyze analytical events.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3">3. Use of Your Personal Data</h2>
              <p>We process the collected variables on the following valid legal bases:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>To maintain, synchronize, and update your list of flats, members, and dynamic group expenses.</li>
                <li>To execute debt minimization calculations and process UPI transactions.</li>
                <li>To deliver context-aware, personalized budgeting tips via our server-side secure integration with Google Gemini AI.</li>
                <li>To serve advertisements through Google AdMob in full compliance with the Google Publisher Policies.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3">4. Third-Party Services & Dynamic Integration</h2>
              <p>The SpendWise application incorporates SDKs and safe API links provided by verified third-party partners. These operators may handle data according to their respective policies:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Google Firebase (Firestore, Auth):</strong> Used for secure cloud-database synchronization, user profile management, and authentication records. See the <a target="_blank" rel="noopener noreferrer" href="https://firebase.google.com/support/privacy" className="text-indigo-600 dark:text-indigo-400 underline">Firebase Privacy Shield details</a>.
                </li>
                <li>
                  <strong>Google AdMob:</strong> Integrated for ad serving. It automatically utilizes standard advertising identifiers to supply non-personalized or personalized ads depending on state consent choices. See the <a target="_blank" rel="noopener noreferrer" href="https://policies.google.com/privacy" className="text-indigo-600 dark:text-indigo-400 underline">Google Privacy Page</a>.
                </li>
                <li>
                  <strong>Google Gemini AI SDK:</strong> Used for processing receipt bills and rendering budget insights. Your text or receipt image is passed to official Google Gemini API endpoints securely; no private data is utilized for model training.
                </li>
              </ul>
            </section>

            <section className="bg-indigo-50/50 dark:bg-indigo-950/20 p-5 rounded-[1.5rem] border border-indigo-100 dark:border-indigo-950">
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3">5. Data Deletion & Account Deletion Rights (Google Play Safety)</h2>
              <p className="mb-3 font-medium">
                In strict compliance with the Google Play Store User Data policy, we support your absolute right to erasure. Users can request complete account and data removal at any time:
              </p>
              <ol className="list-decimal pl-5 space-y-2 text-sm">
                <li>You can completely wipe your logged transaction history directly by removing expenses or leaving active groups.</li>
                <li>
                  You can submit a direct request for permanent account closure and erasure of all biographical profile details associated with your Google account by emailing our main developer support team at: <strong className="text-indigo-600 dark:text-indigo-400">adityaa89468@gmail.com</strong>.
                </li>
                <li>Upon receiving your request, all related user records, credentials, profile information, and transactional history will be permanently deleted from our active databases within 14 business days.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3">6. Children & Family Policy (COPPA Compliance)</h2>
              <p>
                The SpendWise application is strictly designed and targeted for young students, hostel room occupants, and adults aged 13 and older. We do not knowingly collect, request, or maintain personally identifiable information from children under the age of 13. If you have reason to believe that a child under 13 has provided us with personal information, please contact us immediately to purge the records immediately.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3">7. Policy Modifications</h2>
              <p>
                We reserve the right to modify this Privacy Policy as laws, Google Play regulations, or application features change. Any revisions will be accompanied by an updated "Effective Date" at the top of this document. We advise you to review this compliance page regularly.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3">8. Developer Contact Information</h2>
              <p>If you have any feedback, questions, or data privacy concerns regarding SpendWise, please contact us directly at:</p>
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

export default PrivacyPolicy;

