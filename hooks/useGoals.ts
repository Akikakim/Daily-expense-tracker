import { useContext } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { Goal } from '../types';
import { AuthContext } from '../contexts/AuthContext';

export const useGoals = () => {
    const auth = useContext(AuthContext);
    const storageKey = `goals_${auth?.currentUser?.id}`;
    
    const [goals, setGoals] = useLocalStorage<Goal[]>(storageKey, []);

    const addGoal = (goal: Omit<Goal, 'id'>) => {
        const newGoal: Goal = {
            ...goal,
            id: new Date().getTime().toString(),
        };
        setGoals(prevGoals => [...prevGoals, newGoal]);
    };

    const deleteGoal = (id: string) => {
        setGoals(prevGoals => prevGoals.filter(goal => goal.id !== id));
    };

    return { goals, addGoal, deleteGoal };
};
