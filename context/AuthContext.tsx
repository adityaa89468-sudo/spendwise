
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
  updateUserProfile: (displayName: string, upiId?: string) => Promise<void>;
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
        throw error;
      }
      if (error.code === 'auth/cancelled-by-user') {
        console.log("Sign-in cancelled by user.");
        throw error;
      }
      console.error("Auth Error:", error);
      throw error;
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

  const updateUserProfile = async (displayName: string, upiId?: string) => {
    if (!user) throw new Error("No authenticated user found.");
    
    // 1. Update Firebase auth profile
    await updateProfile(user, { displayName });
    
    // 2. Update Firestore user document
    const profileRef = doc(db, 'users', user.uid);
    const updatedData: Partial<UserProfile> = {
      displayName: displayName.trim(),
    };
    if (upiId !== undefined) {
      updatedData.upiId = upiId.trim();
    }
    await setDoc(profileRef, updatedData, { merge: true });
    
    // 3. Update local React state
    if (profile) {
      setProfile({
        ...profile,
        displayName: displayName.trim(),
        ...(upiId !== undefined ? { upiId: upiId.trim() } : {}),
      });
    }

    // 4. Update the user's name inside the members array of their current group
    if (profile?.currentGroupId) {
      const groupRef = doc(db, 'groups', profile.currentGroupId);
      const groupSnap = await getDoc(groupRef);
      if (groupSnap.exists()) {
        const groupData = groupSnap.data();
        const updatedMembers = (groupData.members || []).map((m: any) => {
          if (m.uid === user.uid) {
            return { ...m, displayName: displayName.trim() };
          }
          return m;
        });
        await setDoc(groupRef, { members: updatedMembers }, { merge: true });
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut, updateUserProfile }}>
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
