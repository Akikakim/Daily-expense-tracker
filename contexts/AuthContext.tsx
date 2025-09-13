import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { User, Currency } from '../types';
import { CURRENCIES } from '../constants';
import { VALID_LICENSE_KEYS } from '../licenseKeys';

interface AuthContextType {
    currentUser: User | null;
    login: (username: string, password?: string) => Promise<boolean>;
    signup: (username: string, password?: string) => Promise<boolean>;
    logout: () => void;
    isLoading: boolean;
    currency: Currency;
    setCurrency: React.Dispatch<React.SetStateAction<Currency>>;
    isLicensed: boolean;
    activateLicense: (key: string) => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [activatedKey, setActivatedKey] = useLocalStorage<string | null>('activated_license_key', null);
    const [isLicensed, setIsLicensed] = useState(false);

    const [users, setUsers] = useLocalStorage<User[]>('users', []);
    const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);
    const [isLoading, setIsLoading] = useState(true);
    const [currency, setCurrency] = useLocalStorage<Currency>(`currency_${currentUser?.id || 'guest'}`, CURRENCIES[0]);
    
    useEffect(() => {
        if (activatedKey && VALID_LICENSE_KEYS.has(activatedKey)) {
            setIsLicensed(true);
        }
        setIsLoading(false);
    }, [activatedKey]);

    const activateLicense = async (key: string): Promise<boolean> => {
        if (VALID_LICENSE_KEYS.has(key)) {
            setActivatedKey(key);
            setIsLicensed(true);
            return true;
        }
        return false;
    };

    const signup = async (username: string, password?: string): Promise<boolean> => {
        if (!isLicensed) return false;
        if (users.find(u => u.username === username)) {
            return false; // User already exists
        }
        const newUser: User = { id: Date.now().toString(), username, password };
        setUsers([...users, newUser]);
        setCurrentUser(newUser);
        return true;
    };

    const login = async (username: string, password?: string): Promise<boolean> => {
        if (!isLicensed) return false;
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            setCurrentUser(user);
            return true;
        }
        // For this simulation, if user exists but no password was set, allow login
        const userWithoutPassword = users.find(u => u.username === username && !u.password);
        if(userWithoutPassword && !password) {
            setCurrentUser(userWithoutPassword);
            return true;
        }

        return false;
    };

    const logout = () => {
        setCurrentUser(null);
    };

    const value = {
        currentUser,
        login,
        signup,
        logout,
        isLoading,
        currency,
        setCurrency,
        isLicensed,
        activateLicense,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
