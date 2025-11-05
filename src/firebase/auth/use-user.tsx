'use client';
import { useEffect, useState } from 'react';
import { 
    onIdTokenChanged, 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut, 
    updateProfile,
    type Auth, 
    type User 
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useAuth, useFirestore } from '@/firebase';

// Main hook to get the current user state
export function useUser() {
  const auth = useAuth();
  const firestore = useFirestore();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!auth || !firestore) {
      setLoading(false);
      return;
    }

    const unsubscribe = onIdTokenChanged(
      auth,
      async (user) => {
        setLoading(true);
        setError(null);
        if (user) {
          setUser(user);
          const userRef = doc(firestore, 'users', user.uid);
          try {
            // This ensures user document is created/updated on every login/token change
            await setDoc(
              userRef,
              {
                uid: user.uid,
                email: user.email,
                // displayName and photoURL might be null on creation, but updated later
                displayName: user.displayName, 
                photoURL: user.photoURL,
                lastLogin: serverTimestamp(),
              },
              { merge: true }
            );
          } catch (e) {
            console.error("Error writing user to Firestore", e);
            setError(e as Error);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Auth state change error", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [auth, firestore]);

  return { user, isUserLoading: loading, error };
}

// Auth action: Create user with email and password
export async function createUserWithEmail(auth: Auth, email: string, password: string) {
    if (!auth) throw new Error("Auth service not available");
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Set a default display name from the email prefix
        const displayName = email.split('@')[0];
        await updateProfile(userCredential.user, { displayName });
        return userCredential;
    } catch (error) {
        console.error("Error creating user with email and password", error);
        throw error;
    }
}

// Auth action: Sign in with email and password
export async function signInWithEmail(auth: Auth, email: string, password: string) {
    if (!auth) throw new Error("Auth service not available");
    try {
        return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.error("Error signing in with email and password", error);
        throw error;
    }
}

// Auth action: Sign out
export async function signOutUser(auth: Auth) {
    if (!auth) return;
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Error signing out", error);
        throw error;
    }
}
