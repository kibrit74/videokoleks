// Inspired by https://usehooks.com/useLocalStorage

import { useState, useEffect } from 'react';

// This is a browser-only hook.
export function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.log(error);
      return initialValue;
    }
  });

  // useEffect to update local storage when the state changes
  // This is a separate effect so we can better handle SSR
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      // Save state to local storage
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.log(error);
    }
  }, [key, storedValue]);


  return [storedValue, setStoredValue] as const;
}
