'use client';
import { useEffect, useState } from 'react';
import { onIdTokenChanged, signInAnonymously } from 'firebase/auth';
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
    if (!auth || !firestore) return;

    const unsubscribe = onIdTokenChanged(
      auth,
      async (user) => {
        setLoading(true);
        setError(null);
        if (user) {
          setUser(user);
          const userRef = doc(firestore, 'users', user.uid);
          try {
            await setDoc(
              userRef,
              {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                lastLogin: serverTimestamp(),
              },
              { merge: true }
            );
          } catch (e) {
            setError(e as Error);
          }
        } else {
          try {
            const { user: anonUser } = await signInAnonymously(auth);
            setUser(anonUser);
          } catch (e) {
            setError(e as Error);
          }
        }
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [auth, firestore]);

  return { user, loading, error };
}
