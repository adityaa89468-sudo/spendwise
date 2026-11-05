import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  browserLocalPersistence, 
  setPersistence 
} from 'firebase/auth';
import { 
  doc, 
  getDoc,
  getDocFromServer, 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  setLogLevel
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Suppress noisy internal Firestore transport fallback warnings in iframe/proxy environments
setLogLevel('silent');

const app = initializeApp(firebaseConfig);

const configAny = firebaseConfig as any;
export const db = initializeFirestore(
  app,
  {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    experimentalAutoDetectLongPolling: true,
  },
  configAny.firestoreDatabaseId && configAny.firestoreDatabaseId !== '(default)'
    ? configAny.firestoreDatabaseId
    : undefined
);

export const auth = getAuth(app);

// Enable local persistence for persistent login across app restarts
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn("Firebase Persistence Warning:", err);
});

export const googleProvider = new GoogleAuthProvider();

// Test connection silently without blocking main thread
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    // Fallback to cache/silent check if offline
    try {
      await getDoc(doc(db, 'test', 'connection'));
    } catch {
      // Ignore offline/connection check errors silently
    }
  }
}
setTimeout(testConnection, 2000);

