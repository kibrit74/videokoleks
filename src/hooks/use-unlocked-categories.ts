'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'unlockedCategories';

export function useUnlockedCategories() {
    const [unlockedCategories, setUnlockedCategories] = useState<Set<string>>(new Set());

    // Load from sessionStorage on mount
    useEffect(() => {
        try {
            const stored = sessionStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored) as string[];
                setUnlockedCategories(new Set(parsed));
            }
        } catch (error) {
            console.error('Error loading unlocked categories:', error);
        }
    }, []);

    // Save to sessionStorage whenever it changes
    const saveToStorage = useCallback((categories: Set<string>) => {
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(categories)));
        } catch (error) {
            console.error('Error saving unlocked categories:', error);
        }
    }, []);

    const unlockCategory = useCallback((categoryId: string) => {
        setUnlockedCategories(prev => {
            const newSet = new Set(prev);
            newSet.add(categoryId);
            saveToStorage(newSet);
            return newSet;
        });
    }, [saveToStorage]);

    const isCategoryUnlocked = useCallback((categoryId: string) => {
        return unlockedCategories.has(categoryId);
    }, [unlockedCategories]);

    const lockCategory = useCallback((categoryId: string) => {
        setUnlockedCategories(prev => {
            const newSet = new Set(prev);
            newSet.delete(categoryId);
            saveToStorage(newSet);
            return newSet;
        });
    }, [saveToStorage]);

    return {
        unlockedCategories,
        unlockCategory,
        isCategoryUnlocked,
        lockCategory
    };
}
