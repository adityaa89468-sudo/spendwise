import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithCredential,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { UserProfile } from '../types';

declare global {
  interface Window {
    google?: any;
  }
}

export interface SupabaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthContextType {
  user: SupabaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithGoogleDirect: () => Promise<void>;
  initializeGoogleBtn: (containerId: string) => void;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (displayName: string, upiId?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Dynamically load Google Identity Services Client SDK
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    return () => {
      // Clean up script on unmount safely
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    // Listen for Firebase Auth state changes
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const mappedUser: SupabaseUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
          };
          setUser(mappedUser);

          if (unsubscribeProfile) {
            unsubscribeProfile();
            unsubscribeProfile = null;
          }

          // Fetch or create profile inside our Firestore database
          const profileRef = doc(db, 'users', mappedUser.uid);
          
          try {
            const profileSnap = await getDoc(profileRef);
            if (!profileSnap.exists()) {
              const newProfile: UserProfile = {
                uid: mappedUser.uid,
                email: mappedUser.email || '',
                displayName: mappedUser.displayName || '',
                roommateScore: 100,
                streak: 0,
                createdAt: new Date().toISOString(),
              };
              await setDoc(profileRef, newProfile);
              setProfile(newProfile);
            } else {
              setProfile(profileSnap.data() as UserProfile);
            }
          } catch (profileError: any) {
            console.warn("Retrying profile fetch locally due to:", profileError.message);
            // Fallback to local profile if Firestore is unavailable/permissions issues occur during boot
            setProfile({
              uid: mappedUser.uid,
              email: mappedUser.email || '',
              displayName: mappedUser.displayName || '',
              roommateScore: 100,
              streak: 0,
              createdAt: new Date().toISOString(),
            });
          }

          // Realtime listener for the Firestore user document
          unsubscribeProfile = onSnapshot(profileRef, (snapshot) => {
            if (snapshot.exists()) {
              setProfile(snapshot.data() as UserProfile);
            }
          }, (err) => {
            console.error("Profile snapshot listener error:", err);
          });
        } else {
          setUser(null);
          setProfile(null);
          if (unsubscribeProfile) {
            unsubscribeProfile();
            unsubscribeProfile = null;
          }
        }
      } catch (error: any) {
        console.error("Auth Profile Error:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      // Use standard popup sign in which works seamlessly on mobile and desktop
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        console.log("Sign-in cancelled by user.");
        return;
      }
      console.error("Auth Error:", error);
      throw error;
    }
  };

  const signInWithGoogleDirect = async () => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      console.warn("Direct Google Login: VITE_GOOGLE_CLIENT_ID is not configured. Falling back to default auth popup.");
      await signInWithGoogle();
      return;
    }

    return new Promise<void>((resolve, reject) => {
      if (window.google?.accounts?.oauth2) {
        try {
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: googleClientId,
            scope: 'openid email profile',
            callback: async (tokenResponse: any) => {
              if (tokenResponse?.error) {
                reject(new Error(tokenResponse.error_description || tokenResponse.error));
                return;
              }
              if (tokenResponse?.access_token) {
                try {
                  setLoading(true);
                  const credential = GoogleAuthProvider.credential(null, tokenResponse.access_token);
                  await signInWithCredential(auth, credential);
                  resolve();
                } catch (fbError) {
                  reject(fbError);
                } finally {
                  setLoading(false);
                }
              } else {
                reject(new Error("No access token received from Google."));
              }
            }
          });
          client.requestAccessToken();
        } catch (err) {
          reject(err);
        }
      } else {
        signInWithGoogle().then(() => resolve()).catch(reject);
      }
    });
  };

  const initializeGoogleBtn = (containerId: string) => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      console.info("Direct Google Sign-In Button: VITE_GOOGLE_CLIENT_ID is not configured yet.");
      return;
    }

    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response: any) => {
            const idToken = response.credential;
            try {
              setLoading(true);
              const credential = GoogleAuthProvider.credential(idToken);
              await signInWithCredential(auth, credential);
            } catch (error) {
              console.error("Firebase Sign-In with GIS Credential Error:", error);
            } finally {
              setLoading(false);
            }
          }
        });

        const btnElement = document.getElementById(containerId);
        if (btnElement) {
          window.google.accounts.id.renderButton(
            btnElement,
            { theme: "outline", size: "large", width: btnElement.clientWidth || 320 }
          );
        }
      } catch (err) {
        console.error("GIS Button Render Error:", err);
      }
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
      
      const registeredUser = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: displayName,
      };

      // Keep Firestore profile persistence in sync
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
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const updateUserProfile = async (displayName: string, upiId?: string) => {
    if (!auth.currentUser || !user) throw new Error("No authenticated user found.");
    
    // 1. Update Firebase auth profile
    await updateProfile(auth.currentUser, { displayName: displayName.trim() });
    
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
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, signInWithGoogleDirect, initializeGoogleBtn, signInWithEmail, signUpWithEmail, signOut, updateUserProfile }}>
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
