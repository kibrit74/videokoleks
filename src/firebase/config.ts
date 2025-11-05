
import { getApps, initializeApp, type FirebaseOptions } from 'firebase/app';

// Firebase config is now hardcoded to prevent environment variable issues.
const firebaseConfig: FirebaseOptions = {
  "apiKey": "mock-api-key",
  "authDomain": "mock-auth-domain-35510.firebaseapp.com",
  "projectId": "mock-project-id-35510",
  "storageBucket": "mock-storage-bucket-35510.appspot.com",
  "messagingSenderId": "mock-messaging-sender-id",
  "appId": "mock-app-id"
};

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
