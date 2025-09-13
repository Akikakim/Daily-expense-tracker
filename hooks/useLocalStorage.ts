import { useState, useEffect } from 'react';

// FIX: Update hook to support lazy initialization for the initialValue, similar to useState.
export const useLocalStorage = <T,>(key: string, initialValue: T | (() => T)): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const readValue = () => {
        // Helper to get initial value, executing if it's a function
        const getInitial = () => {
            if (typeof initialValue === 'function') {
                return (initialValue as () => T)();
            }
            return initialValue;
        };

        if (typeof window === 'undefined') {
            return getInitial();
        }
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : getInitial();
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return getInitial();
        }
    };

    const [storedValue, setStoredValue] = useState<T>(readValue);

    useEffect(() => {
        setStoredValue(readValue());
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);

    useEffect(() => {
        try {
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, JSON.stringify(storedValue));
            }
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    }, [key, storedValue]);

    return [storedValue, setStoredValue];
};