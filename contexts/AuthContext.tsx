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
    activateLicense: (key: string) => Promise<{ success: boolean; message?: string }>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

const DEVICE_LIMIT = 5;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [activatedKey, setActivatedKey] = useLocalStorage<string | null>('activated_license_key', null);
    const [isLicensed, setIsLicensed] = useState(false);
    
    // Create or retrieve a unique ID for this device.
    // FIX: The useLocalStorage hook now supports a function for lazy initialization, resolving the type error.
    const [deviceId] = useLocalStorage<string>('device_id', () => crypto.randomUUID());
    // Store all license activations
    const [licenseActivations, setLicenseActivations] = useLocalStorage<Record<string, string[]>>('license_activations', {});

    const [users, setUsers] = useLocalStorage<User[]>('users', []);
    const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);
    const [isLoading, setIsLoading] = useState(true);
    const [currency, setCurrency] = useLocalStorage<Currency>(`currency_${currentUser?.id || 'guest'}`, CURRENCIES[0]);
    
    useEffect(() => {
        if (activatedKey && VALID_LICENSE_KEYS.has(activatedKey)) {
             // Verify this device is part of the activation list
            const activations = licenseActivations[activatedKey] || [];
            if (activations.includes(deviceId)) {
                setIsLicensed(true);
            } else {
                // This device is not licensed, even if a key is stored.
                setActivatedKey(null);
            }
        }
        setIsLoading(false);
    }, [activatedKey, deviceId, licenseActivations, setActivatedKey]);

    const activateLicense = async (key: string): Promise<{ success: boolean; message?: string }> => {
        if (!VALID_LICENSE_KEYS.has(key)) {
            return { success: false, message: 'Invalid license key.' };
        }

        const activations = licenseActivations[key] || [];

        if (activations.includes(deviceId)) {
            // This device is already activated with this key.
            setActivatedKey(key);
            setIsLicensed(true);
            return { success: true };
        }

        if (activations.length >= DEVICE_LIMIT) {
            return {
                success: false,
                message: `This key has reached its maximum of ${DEVICE_LIMIT} device activations.`
            };
        }

        // Add this device to the list of activations for this key
        const newActivations = { ...licenseActivations, [key]: [...activations, deviceId] };
        setLicenseActivations(newActivations);
        setActivatedKey(key);
        setIsLicensed(true);
        return { success: true };
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