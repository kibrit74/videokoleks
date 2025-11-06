'use client';
import { 
    signOut, 
    updateProfile,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    type Auth, 
    type User,
    type UserCredential
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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
    const firestore = useFirestore();

    if (firestore) {
        const userRef = doc(firestore, 'users', user.uid);
        const userData = {
            uid: user.uid,
            email: user.email,
            displayName: profile.displayName, 
            photoURL: profile.photoURL,
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
    }
}
