import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithCredential,
  GoogleAuthProvider,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
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

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    }
  };
  console.warn('Firestore Warning/Error:', JSON.stringify(errInfo));
};

interface AuthContextType {
  user: SupabaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdminSession: boolean;
  setIsAdminSession: (val: boolean) => void;
  signInWithGoogle: () => Promise<void>;
  signInWithGoogleDirect: () => Promise<void>;
  initializeGoogleBtn: (containerId: string) => void;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (displayName: string, upiId?: string) => Promise<void>;
  sendResetEmail: (email: string) => Promise<void>;
}

const ADMIN_EMAIL = 'adityaa89468@gmail.com';
const ADMIN_PASSWORDS = ['84 blades arc-flow', '[ 84 blades arc-flow ]', '[84 blades arc-flow]'];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SupabaseUser | null>(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('flathisab_admin_session') === 'true') {
      return {
        uid: 'admin-aditya',
        email: ADMIN_EMAIL,
        displayName: 'Aditya (Admin)',
      };
    }
    return null;
  });
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdminSession, setIsAdminSession] = useState<boolean>(() => {
    return typeof window !== 'undefined' && sessionStorage.getItem('flathisab_admin_session') === 'true';
  });

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
    // Process redirect result if returning from an auth redirect (especially on mobile / Capacitor)
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log("Redirect sign-in success:", result.user.email);
        }
      })
      .catch((error) => {
        console.warn("Redirect sign-in result error:", error);
      });
  }, []);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    // Safety fallback timeout to prevent infinite loading screen on cold start / offline
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 4000);

    // Listen for Firebase Auth state changes
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(safetyTimeout);
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

          // Fetch or create profile inside our Firestore database (enforcing 1 account per 1 email)
          const profileRef = doc(db, 'users', mappedUser.uid);
          const normalizedEmail = (mappedUser.email || '').trim().toLowerCase();
          
          try {
            const profileSnap = await getDoc(profileRef);
            let mergedProfile: UserProfile | null = profileSnap.exists()
              ? (profileSnap.data() as UserProfile)
              : null;

            // Check if any duplicate /users documents exist for this same email under another UID
            if (normalizedEmail) {
              const allUsersSnap = await getDocs(collection(db, 'users'));
              const duplicateDocs: { id: string; data: UserProfile }[] = [];
              allUsersSnap.forEach((uDoc) => {
                const uData = uDoc.data() as UserProfile;
                if (
                  uDoc.id !== mappedUser.uid &&
                  (uData.email || '').trim().toLowerCase() === normalizedEmail
                ) {
                  duplicateDocs.push({ id: uDoc.id, data: uData });
                }
              });

              if (duplicateDocs.length > 0) {
                for (const dup of duplicateDocs) {
                  mergedProfile = {
                    uid: mappedUser.uid,
                    email: normalizedEmail,
                    displayName:
                      mergedProfile?.displayName ||
                      dup.data.displayName ||
                      mappedUser.displayName ||
                      '',
                    roommateScore: mergedProfile?.roommateScore ?? dup.data.roommateScore ?? 100,
                    streak: mergedProfile?.streak ?? dup.data.streak ?? 0,
                    currentGroupId: mergedProfile?.currentGroupId || dup.data.currentGroupId,
                    upiId: mergedProfile?.upiId || dup.data.upiId,
                    createdAt: dup.data.createdAt || mergedProfile?.createdAt || new Date().toISOString(),
                  };

                  // If the duplicate account belonged to a group, migrate member UID to the canonical UID
                  if (dup.data.currentGroupId) {
                    try {
                      const grpRef = doc(db, 'groups', dup.data.currentGroupId);
                      const grpSnap = await getDoc(grpRef);
                      if (grpSnap.exists()) {
                        const grpData = grpSnap.data();
                        const rawMembers = Array.isArray(grpData.members) ? grpData.members : [];
                        const seenEmails = new Set<string>();
                        const dedupedMembers = rawMembers
                          .map((m: any) => {
                            if (
                              m.uid === dup.id ||
                              (m.email && m.email.trim().toLowerCase() === normalizedEmail)
                            ) {
                              return {
                                ...m,
                                uid: mappedUser.uid,
                                email: normalizedEmail,
                                displayName:
                                  mergedProfile?.displayName || m.displayName || 'Roommate',
                              };
                            }
                            return m;
                          })
                          .filter((m: any) => {
                            const key = (m.email || m.uid || '').trim().toLowerCase();
                            if (!key || seenEmails.has(key)) return false;
                            seenEmails.add(key);
                            return true;
                          });
                        await updateDoc(grpRef, {
                          members: dedupedMembers,
                          ...(grpData.adminId === dup.id ? { adminId: mappedUser.uid } : {}),
                        });
                      }
                    } catch (grpErr) {
                      console.warn('Could not migrate group member for duplicate email:', grpErr);
                    }
                  }

                  // Delete duplicate /users document so strictly 1 account exists per email
                  await deleteDoc(doc(db, 'users', dup.id));
                }
              }
            }

            if (!mergedProfile) {
              const newProfile: UserProfile = {
                uid: mappedUser.uid,
                email: normalizedEmail,
                displayName: mappedUser.displayName || '',
                roommateScore: 100,
                streak: 0,
                createdAt: new Date().toISOString(),
              };
              await setDoc(profileRef, newProfile);
              setProfile(newProfile);
            } else {
              const canonicalProfile: UserProfile = {
                ...mergedProfile,
                uid: mappedUser.uid,
                email: normalizedEmail || mergedProfile.email || '',
              };
              await setDoc(profileRef, canonicalProfile, { merge: true });
              setProfile(canonicalProfile);
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
            handleFirestoreError(err, OperationType.GET, 'users/' + mappedUser.uid);
          });
        } else {
          if (sessionStorage.getItem('flathisab_admin_session') === 'true') {
            setUser({
              uid: 'admin-aditya',
              email: ADMIN_EMAIL,
              displayName: 'Aditya (Admin)',
            });
            setIsAdminSession(true);
          } else {
            setUser(null);
            setProfile(null);
          }
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
    sessionStorage.removeItem('flathisab_admin_session');
    setIsAdminSession(false);
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    const isNativeCapacitor = Boolean(
      (window as any).Capacitor?.isNativePlatform?.() ||
      (window as any).Capacitor?.getPlatform?.() === 'android' ||
      window.location.protocol === 'capacitor:'
    );

    // 1. Try Native Android Google Auth plugin if running in Capacitor
    if (isNativeCapacitor && (window as any).Capacitor?.Plugins?.NativeGoogleAuth) {
      const activeClientId = googleClientId || '733361691954-33lme627bg6bm5bp4i0964uaqnphu697.apps.googleusercontent.com';
      try {
        const res = await (window as any).Capacitor.Plugins.NativeGoogleAuth.signIn({
          serverClientId: activeClientId
        });
        if (res?.idToken) {
          setLoading(true);
          const credential = GoogleAuthProvider.credential(res.idToken);
          const userCredential = await signInWithCredential(auth, credential);
          if (userCredential?.user) {
            const mappedUser: SupabaseUser = {
              uid: userCredential.user.uid,
              email: userCredential.user.email,
              displayName: userCredential.user.displayName,
            };
            setUser(mappedUser);
          }
          return;
        }
      } catch (nativeErr: any) {
        console.error("Native Google Auth error:", nativeErr);
        const errMsg = nativeErr?.message || String(nativeErr);
        if (
          errMsg.includes("cancelled") ||
          errMsg.includes("Code 12501") ||
          errMsg.includes("12501")
        ) {
          console.log("Native Google Sign-In cancelled by user.");
          return;
        }
        throw new Error(errMsg || "Google Sign-In failed.");
      } finally {
        setLoading(false);
      }
    }

    // 2. Try Google Identity Services (GIS) One-Tap / Account Picker if Client ID is configured
    if (googleClientId && window.google?.accounts?.id) {
      try {
        let gisResolved = false;
        await new Promise<void>((resolve, reject) => {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: async (response: any) => {
              gisResolved = true;
              try {
                setLoading(true);
                const credential = GoogleAuthProvider.credential(response.credential);
                await signInWithCredential(auth, credential);
                resolve();
              } catch (err) {
                reject(err);
              } finally {
                setLoading(false);
              }
            }
          });
          window.google.accounts.id.prompt((notification: any) => {
            if (!gisResolved && (notification.isNotDisplayed() || notification.isSkippedMoment())) {
              reject(new Error("GIS_PROMPT_NOT_DISPLAYED"));
            }
          });
        });
        return;
      } catch (gisErr) {
        console.info("GIS One-Tap prompt not displayed or skipped, falling back to standard provider flow:", gisErr);
      }
    }

    try {
      if (isNativeCapacitor) {
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectErr: any) {
          console.warn("Native redirect failed, attempting popup fallback:", redirectErr);
          await signInWithPopup(auth, googleProvider);
        }
      } else {
        try {
          await signInWithPopup(auth, googleProvider);
        } catch (popupErr: any) {
          if (
            popupErr.code === 'auth/popup-blocked' ||
            popupErr.code === 'operation-not-supported-in-this-environment'
          ) {
            await signInWithRedirect(auth, googleProvider);
          } else {
            throw popupErr;
          }
        }
      }
    } catch (error: any) {
      if (
        error.code === 'auth/popup-closed-by-user' || 
        error.code === 'auth/cancelled-popup-request'
      ) {
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
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (cleanEmail === ADMIN_EMAIL && ADMIN_PASSWORDS.includes(cleanPassword)) {
      sessionStorage.setItem('flathisab_admin_session', 'true');
      setIsAdminSession(true);
      const firebaseAdminPass = '84 blades arc-flow';
      try {
        await signInWithEmailAndPassword(auth, ADMIN_EMAIL, firebaseAdminPass);
      } catch (signInErr: any) {
        // Activate the verified Admin session directly without creating a duplicate account for the email
        setUser({
          uid: auth.currentUser?.uid || 'admin-aditya',
          email: ADMIN_EMAIL,
          displayName: auth.currentUser?.displayName || 'Aditya (Admin)',
        });
      }
      return;
    }

    sessionStorage.removeItem('flathisab_admin_session');
    setIsAdminSession(false);
    await signInWithEmailAndPassword(auth, cleanEmail, password);
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    sessionStorage.removeItem('flathisab_admin_session');
    setIsAdminSession(false);
    const normalizedEmail = email.trim().toLowerCase();

    // Enforce strictly 1 account per 1 email across Firestore /users before creating Auth user
    try {
      const existingUsersSnap = await getDocs(collection(db, 'users'));
      let emailExists = false;
      existingUsersSnap.forEach((docSnap) => {
        const data = docSnap.data() as UserProfile;
        if ((data.email || '').trim().toLowerCase() === normalizedEmail) {
          emailExists = true;
        }
      });
      if (emailExists) {
        const dupErr: any = new Error('This email address is already registered. Choose Log In instead!');
        dupErr.code = 'auth/email-already-in-use';
        throw dupErr;
      }
    } catch (checkErr: any) {
      if (checkErr?.code === 'auth/email-already-in-use') {
        throw checkErr;
      }
    }

    const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
    if (userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
      
      const registeredUser = {
        uid: userCredential.user.uid,
        email: normalizedEmail,
        displayName: displayName,
      };

      // Keep Firestore profile persistence in sync
      const profileRef = doc(db, 'users', registeredUser.uid);
      const newProfile: UserProfile = {
        uid: registeredUser.uid,
        email: normalizedEmail,
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
    sessionStorage.removeItem('flathisab_admin_session');
    setIsAdminSession(false);
    setUser(null);
    setProfile(null);
    await firebaseSignOut(auth);
  };

  const sendResetEmail = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
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
    <AuthContext.Provider value={{ user, profile, loading, isAdminSession, setIsAdminSession, signInWithGoogle, signInWithGoogleDirect, initializeGoogleBtn, signInWithEmail, signUpWithEmail, signOut, updateUserProfile, sendResetEmail }}>
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
