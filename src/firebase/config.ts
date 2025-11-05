
import { getApps, initializeApp, type FirebaseOptions } from 'firebase/app';

// Firebase config is now hardcoded to prevent environment variable issues.
const firebaseConfig: FirebaseOptions = {
  "projectId": "studio-1000335014-1d7fa",
  "appId": "1:777808779830:web:4e84823e117d607e935697",
  "apiKey": "AIzaSyCT6BGe3pn3G2UBKw3sZiOkfz3C4GwvtZs",
  "authDomain": "studio-1000335014-1d7fa.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "777808779830"
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
