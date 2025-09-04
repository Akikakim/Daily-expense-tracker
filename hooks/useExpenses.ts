import { useState, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
// FIX: Imported Category enum to use its values, and specified Expense as a type import.
import { Category, type Expense } from '../types';
import { generateInsights } from '../services/geminiService';

const initialExpenses: Expense[] = [
    // FIX: Used Category enum instead of string literals for type safety.
    { id: '1', title: 'Groceries', amount: 75.50, category: Category.Food, date: new Date().toISOString().split('T')[0] },
    // FIX: Used Category enum instead of string literals for type safety.
    { id: '2', title: 'Train Ticket', amount: 22.00, category: Category.Transport, date: new Date().toISOString().split('T')[0] },
    // FIX: Used Category enum instead of string literals for type safety.
    { id: '3', title: 'Netflix Subscription', amount: 15.99, category: Category.Entertainment, date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
    // FIX: Used Category enum instead of string literals for type safety.
    { id: '4', title: 'Coffee', amount: 4.75, category: Category.Food, date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
];

export const useExpenses = () => {
    const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', initialExpenses);
    const [aiInsight, setAiInsight] = useState<string | null>(null);
    const [isAIInsightLoading, setIsAIInsightLoading] = useState(false);

    const addExpense = (expense: Omit<Expense, 'id'>) => {
        const newExpense: Expense = {
            ...expense,
            id: new Date().getTime().toString(),
        };
        setExpenses(prevExpenses => [...prevExpenses, newExpense].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    };

    const updateExpense = (id: string, updatedExpense: Omit<Expense, 'id'>) => {
        setExpenses(prevExpenses =>
            prevExpenses.map(expense =>
                expense.id === id ? { ...updatedExpense, id } : expense
            ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        );
    };

    const deleteExpense = (id: string) => {
        setExpenses(prevExpenses => prevExpenses.filter(expense => expense.id !== id));
    };

    const getAIInsights = useCallback(async (expensesForPeriod: Expense[], timePeriod: string) => {
        setIsAIInsightLoading(true);
        setAiInsight(null);
        try {
            const insight = await generateInsights(expensesForPeriod, timePeriod);
            setAiInsight(insight);
        } catch (error) {
            console.error("Failed to get AI insights:", error);
            setAiInsight("Sorry, I couldn't generate insights at the moment. Please try again later.");
        } finally {
            setIsAIInsightLoading(false);
        }
    }, []);

    return { expenses, addExpense, updateExpense, deleteExpense, getAIInsights, aiInsight, isAIInsightLoading };
};