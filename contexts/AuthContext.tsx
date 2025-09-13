import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { User, Currency } from '../types';
import { CURRENCIES } from '../constants';

interface AuthContextType {
    currentUser: User | null;
    login: (username: string, password?: string) => Promise<boolean>;
    signup: (username: string, password?: string) => Promise<boolean>;
    logout: () => void;
    isLoading: boolean;
    currency: Currency;
    setCurrency: React.Dispatch<React.SetStateAction<Currency>>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [users, setUsers] = useLocalStorage<User[]>('users', []);
    const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);
    const [isLoading, setIsLoading] = useState(true);
    const [currency, setCurrency] = useLocalStorage<Currency>(`currency_${currentUser?.id || 'guest'}`, CURRENCIES[0]);
    
    // Effect to handle initial loading state
    useEffect(() => {
        setIsLoading(false);
    }, []);

    const signup = async (username: string, password?: string): Promise<boolean> => {
        if (users.find(u => u.username === username)) {
            return false; // User already exists
        }
        const newUser: User = { id: Date.now().toString(), username, password };
        setUsers([...users, newUser]);
        setCurrentUser(newUser);
        return true;
    };

    const login = async (username: string, password?: string): Promise<boolean> => {
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
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};