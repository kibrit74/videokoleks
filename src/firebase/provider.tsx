'use client';
import {
  type ReactNode,
  createContext,
  useContext,
  useMemo,
  useEffect,
} from 'react';
import { type FirebaseApp } from 'firebase/app';
import { type Auth, onAuthStateChanged } from 'firebase/auth';
import { type Firestore } from 'firebase/firestore';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from './auth/use-user';

const AUTH_ROUTES = ['/login', '/register'];
const PROTECTED_ROUTES = ['/profile', '/favorites', '/categories'];

export const FirebaseContext = createContext<{
  firebaseApp: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
}>({
  firebaseApp: null,
  auth: null,
  firestore: null,
});

export function FirebaseProvider({
  children,
  firebaseApp,
  auth,
  firestore,
}: {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}) {
  const contextValue = useMemo(() => {
    return { firebaseApp, auth, firestore };
  }, [firebaseApp, auth, firestore]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <AuthNavigator>{children}</AuthNavigator>
    </FirebaseContext.Provider>
  );
}


function AuthNavigator({ children }: { children: ReactNode }) {
  const { user, loading } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const isAuthRoute = AUTH_ROUTES.includes(pathname);
    const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));

    if (!user && isProtectedRoute) {
      router.push('/login');
    }
    if (user && isAuthRoute) {
      router.push('/profile');
    }

  }, [user, loading, pathname, router]);

  return <>{children}</>;
}


export const useFirebaseApp = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebaseApp must be used within a FirebaseProvider');
  }
  return context.firebaseApp;
};

export const useAuth = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a FirebaseProvider');
  }
  return context.auth;
};

export const useFirestore = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirestore must be used within a FirebaseProvider');
  }
  return context.firestore;
};

export const useFirebase = () => {
  const firebaseApp = useFirebaseApp();
  const auth = useAuth();
  const firestore = useFirestore();

  return { firebaseApp, auth, firestore };
};