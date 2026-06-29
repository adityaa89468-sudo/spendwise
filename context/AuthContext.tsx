
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setUser(user);
        if (user) {
          // Fetch or create profile
          const profileRef = doc(db, 'users', user.uid);
          
          try {
            const profileSnap = await getDoc(profileRef);
            if (profileSnap.exists()) {
              setProfile(profileSnap.data() as UserProfile);
            } else {
              const newProfile: UserProfile = {
                uid: user.uid,
                email: user.email || '',
                displayName: user.displayName || '',
                roommateScore: 100,
                streak: 0,
                createdAt: new Date().toISOString(),
              };
              await setDoc(profileRef, newProfile);
              setProfile(newProfile);
            }
          } catch (profileError: any) {
            console.warn("Retrying profile fetch locally due to:", profileError.message);
            // Fallback to local profile if Firestore is unavailable/permissions issues occur during boot
            setProfile({
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || '',
              roommateScore: 100,
              streak: 0,
              createdAt: new Date().toISOString(),
            });
          }
        } else {
          setProfile(null);
        }
      } catch (error: any) {
        console.error("Auth Profile Error:", error);
        
        // If we are offline and doc is not in cache, fallback to a basic profile
        if (user && (error.message?.includes('offline') || error.code === 'unavailable')) {
          setProfile({
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || '',
            roommateScore: 100,
            streak: 0,
            createdAt: new Date().toISOString(),
          });
        } else {
          setProfile(null);
        }
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        console.log("Sign-in cancelled by user (popup closed).");
        return;
      }
      if (error.code === 'auth/cancelled-by-user') {
        console.log("Sign-in cancelled by user.");
        return;
      }
      console.error("Auth Error:", error);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const registeredUser = userCredential.user;
    
    await updateProfile(registeredUser, { displayName });
    
    const profileRef = doc(db, 'users', registeredUser.uid);
    const newProfile: UserProfile = {
      uid: registeredUser.uid,
      email: registeredUser.email || '',
      displayName: displayName || '',
      roommateScore: 100,
      streak: 0,
      createdAt: new Date().toISOString(),
    };
    await setDoc(profileRef, newProfile);
    setProfile(newProfile);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
