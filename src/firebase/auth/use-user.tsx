'use client';
import { useEffect, useState } from 'react';
import { 
    onIdTokenChanged, 
    signOut, 
    updateProfile,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    type Auth, 
    type User,
    type UserCredential
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

// Auth action: Sign up with email and password
export async function signUpWithEmail(auth: Auth, email: string, password: string): Promise<UserCredential> {
    if (!auth) throw new Error("Auth service not available");
    return await createUserWithEmailAndPassword(auth, email, password);
}

// Auth action: Sign in with email and password
export async function signInWithEmail(auth: Auth, email: string, password: string): Promise<UserCredential> {
    if (!auth) throw new Error("Auth service not available");
    return await signInWithEmailAndPassword(auth, email, password);
}

// Auth action: Sign out
export async function signOutUser(auth: Auth) {
    if (!auth) return;
    await signOut(auth);
}

// Auth action: Update user profile
export async function updateUserProfile(user: User, profile: { displayName?: string, photoURL?: string}) {
    await updateProfile(user, profile);
}
