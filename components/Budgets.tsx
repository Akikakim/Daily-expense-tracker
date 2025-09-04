import React, { useMemo, useState, useContext } from 'react';
import { useBudgets } from '../hooks/useBudgets';
import type { Expense, Category, Currency } from '../types';
import { CATEGORIES, CATEGORY_DETAILS } from '../constants';
import { AuthContext } from '../contexts/AuthContext';
import { EditIcon } from './Icons';

interface BudgetsProps {
    expenses: Expense[];
}

const BudgetProgressBar: React.FC<{ category: Category; spent: number; budget: number; currency: Currency; }> = ({ category, spent, budget, currency }) => {
    const percentage = budget > 0 ? (spent / budget) * 100 : 0;
    const { color } = CATEGORY_DETAILS[category];
    const isOverBudget = percentage > 100;
    const barColor = isOverBudget ? 'bg-red-500' : color;
    const formattedSpent = new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.code }).format(spent);
    const formattedBudget = new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.code }).format(budget);

    return (
        <div>
            <div className="flex justify-between items-center mb-1 text-sm">
                <span className="font-semibold text-slate-700">{category}</span>
                <span className={`font-medium ${isOverBudget ? 'text-red-600' : 'text-slate-500'}`}>{formattedSpent} / {formattedBudget}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5">
                <div className={`${barColor} h-2.5 rounded-full`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
            </div>
        </div>
    );
};

const EditBudgetsModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const { budgets, updateBudget } = useBudgets();
    const [localBudgets, setLocalBudgets] = useState<Record<Category, string>>(() => 
        Object.fromEntries(budgets.map(b => [b.category, b.amount.toString()])) as Record<Category, string>
    );

    const handleSave = () => {
        CATEGORIES.forEach(cat => {
            const amount = parseFloat(localBudgets[cat]) || 0;
            updateBudget(cat, amount);
        });
        onClose();
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg m-4" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-6 text-slate-800">Set Monthly Budgets</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2">
                    {CATEGORIES.map(cat => (
                        <div key={cat}>
                            <label htmlFor={`budget-${cat}`} className="block text-sm font-medium text-slate-600">{cat}</label>
                            <input 
                                type="number" 
                                id={`budget-${cat}`}
                                value={localBudgets[cat] || ''}
                                onChange={e => setLocalBudgets({...localBudgets, [cat]: e.target.value})}
                                placeholder="0.00"
                                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                    ))}
                </div>
                <div className="flex justify-end gap-4 pt-6">
                    <button type="button" onClick={onClose} className="py-2 px-4 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300">Cancel</button>
                    <button type="button" onClick={handleSave} className="py-2 px-4 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700">Save Budgets</button>
                </div>
            </div>
        </div>
    );
};

export const Budgets: React.FC<BudgetsProps> = ({ expenses }) => {
    const { budgets } = useBudgets();
    const { currency } = useContext(AuthContext);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const spendingByCategory = useMemo(() => {
        const spending = new Map<Category, number>();
        expenses.forEach(expense => {
            spending.set(expense.category, (spending.get(expense.category) || 0) + expense.amount);
        });
        return spending;
    }, [expenses]);

    const hasBudgets = budgets.some(b => b.amount > 0);

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Monthly Budget Progress</h2>
                <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-800">
                    <EditIcon className="w-4 h-4"/> Set Budgets
                </button>
            </div>
            {hasBudgets ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                    {CATEGORIES.map(cat => {
                        const budget = budgets.find(b => b.category === cat)?.amount || 0;
                        if (budget > 0) {
                            return (
                                <BudgetProgressBar 
                                    key={cat}
                                    category={cat}
                                    spent={spendingByCategory.get(cat) || 0}
                                    budget={budget}
                                    currency={currency}
                                />
                            );
                        }
                        return null;
                    })}
                </div>
            ) : (
                 <p className="text-center text-slate-500 py-8">You haven't set any budgets for this month. Click "Set Budgets" to get started!</p>
            )}
            <EditBudgetsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
};