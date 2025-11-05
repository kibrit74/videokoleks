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
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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
          const userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName, 
            photoURL: user.photoURL,
            lastLogin: serverTimestamp(),
          };
          
          // Non-blocking write with contextual error handling
          setDoc(userRef, userData, { merge: true })
            .catch(serverError => {
                const permissionError = new FirestorePermissionError({
                    path: userRef.path,
                    operation: 'write',
                    requestResourceData: userData,
                });
                errorEmitter.emit('permission-error', permissionError);
            });

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
    // This action can be awaited as it's part of the user interaction flow, not background sync
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const displayName = email.split('@')[0];
    await updateProfile(userCredential.user, { displayName });
    return userCredential;
}

// Auth action: Sign in with email and password
export async function signInWithEmail(auth: Auth, email: string, password: string) {
    if (!auth) throw new Error("Auth service not available");
    // This action can be awaited
    return await signInWithEmailAndPassword(auth, email, password);
}

// Auth action: Sign out
export async function signOutUser(auth: Auth) {
    if (!auth) return;
    await signOut(auth);
}
