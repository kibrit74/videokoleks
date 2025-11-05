
import { getApps, initializeApp, type FirebaseOptions } from 'firebase/app';

let firebaseConfig: FirebaseOptions = {};

try {
  if (process.env.NEXT_PUBLIC_FIREBASE_CONFIG) {
    firebaseConfig = JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG);
  }
} catch (e) {
  console.error("Failed to parse Firebase config", e);
}


// This function is not 'use client' and can be used on the server.
export function initializeFirebase() {
  if (!firebaseConfig.apiKey) {
    throw new Error('Firebase config is not set. Check your .env file and NEXT_PUBLIC_FIREBASE_CONFIG variable.');
  }

  const apps = getApps();
  if (apps.length > 0) {
    return apps[0];
  }
  return initializeApp(firebaseConfig);
}
