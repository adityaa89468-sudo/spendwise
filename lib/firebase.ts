
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize Firestore with enhanced connectivity settings for web previews
// Using experimentalForceLongPolling can help bypass proxy/firewall blockers in iframes
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)' 
  ? firebaseConfig.firestoreDatabaseId 
  : undefined
);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Test connection silently - move to a more resilient approach
async function testConnection() {
  try {
    console.log("Firebase: Testing connection to project:", firebaseConfig.projectId);
    // Attempt a silent read to check connectivity
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase: Connection successful.");
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('the client is offline')) {
        console.warn("Firebase Connection Warning: The SDK is reporting as offline.");
        console.info("TIP: Ensure your domain is listed in Firebase Console > Authentication > Settings > Authorized Domains.");
        console.info("Current Domain:", window.location.hostname);
      } else if (error.message.includes('permission-denied')) {
        console.log("Firebase: Connection reached, but permissions were denied (this is expected for the 'test' collection).");
      } else {
        console.warn("Firebase Connection Info:", error.message);
      }
    }
  }
}
// Start connection check after a short delay to not block main thread
setTimeout(testConnection, 2000);
