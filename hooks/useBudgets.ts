import { useContext } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { Budget, Category } from '../types';
import { AuthContext } from '../contexts/AuthContext';

export const useBudgets = () => {
    const { currentUser } = useContext(AuthContext);
    const storageKey = `budgets_${currentUser?.id}`;

    const [budgets, setBudgets] = useLocalStorage<Budget[]>(storageKey, []);

    const updateBudget = (category: Category, amount: number) => {
        setBudgets(prevBudgets => {
            const existingBudget = prevBudgets.find(b => b.category === category);
            if (existingBudget) {
                return prevBudgets.map(b => b.category === category ? { ...b, amount } : b);
            } else {
                return [...prevBudgets, { category, amount }];
            }
        });
    };
    
    return { budgets, updateBudget };
};