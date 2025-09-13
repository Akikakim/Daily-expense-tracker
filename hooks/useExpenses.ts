import { useState, useCallback, useContext, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
// FIX: Imported Category enum to use its values, and specified Expense as a type import.
import { Category, type Expense } from '../types';
import { generateInsights } from '../services/geminiService';
import { AuthContext } from '../contexts/AuthContext';

export const useExpenses = () => {
    const { currentUser, currency } = useContext(AuthContext);
    const storageKey = `expenses_${currentUser?.id}`;

    const [expenses, setExpenses] = useLocalStorage<Expense[]>(storageKey, []);
    const [aiInsight, setAiInsight] = useState<string | null>(null);
    const [isAIInsightLoading, setIsAIInsightLoading] = useState(false);

    const sortedExpenses = useMemo(() => {
        return [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [expenses]);

    const addExpense = (expense: Omit<Expense, 'id'>) => {
        const newExpense: Expense = {
            ...expense,
            id: new Date().getTime().toString(),
        };
        setExpenses(prevExpenses => [...prevExpenses, newExpense]);
    };

    const updateExpense = (id: string, updatedExpense: Omit<Expense, 'id'>) => {
        setExpenses(prevExpenses =>
            prevExpenses.map(expense =>
                expense.id === id ? { ...updatedExpense, id } : expense
            )
        );
    };

    const deleteExpense = (id: string) => {
        setExpenses(prevExpenses => prevExpenses.filter(expense => expense.id !== id));
    };

    const getAIInsights = useCallback(async (expensesForPeriod: Expense[], timePeriod: string) => {
        setIsAIInsightLoading(true);
        setAiInsight(null);
        try {
            const insight = await generateInsights(expensesForPeriod, timePeriod, currency);
            setAiInsight(insight);
        } catch (error) {
            console.error("Failed to get AI insights:", error);
            setAiInsight("Sorry, I couldn't generate insights at the moment. Please try again later.");
        } finally {
            setIsAIInsightLoading(false);
        }
    }, [currency]);

    return { expenses: sortedExpenses, addExpense, updateExpense, deleteExpense, getAIInsights, aiInsight, isAIInsightLoading };
};