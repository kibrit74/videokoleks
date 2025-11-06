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
    return await updateProfile(user, profile);
}
