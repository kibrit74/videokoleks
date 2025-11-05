'use client';
import { useEffect, useState } from 'react';
import { onIdTokenChanged, signInWithPopup, GoogleAuthProvider, signOut, type Auth } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

import { useAuth, useFirestore } from '@/firebase';
import type { User } from 'firebase/auth';

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
    };

    const unsubscribe = onIdTokenChanged(
      auth,
      async (user) => {
        setLoading(true);
        setError(null);
        if (user) {
          setUser(user);
          const userRef = doc(firestore, 'users', user.uid);
          try {
            // This will create the user doc if it doesn't exist, and update it if it does.
            await setDoc(
              userRef,
              {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                lastLogin: serverTimestamp(),
              },
              { merge: true } // Use merge to avoid overwriting existing fields
            );
          } catch (e) {
            console.error("Error writing user to firestore", e);
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


export async function signInWithGoogle(auth: Auth) {
  if (!auth) return;
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("Error signing in with Google", error);
    // Re-throw the error to be caught by the caller if needed
    throw error;
  }
}

export async function signOutUser(auth: Auth) {
    if (!auth) return;
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Error signing out", error);
        throw error;
    }
}
