import React, { useState, useEffect, useContext } from 'react';
import type { Expense } from '../types';
import { Category } from '../types';
import { CATEGORIES } from '../constants';
import { AuthContext } from '../contexts/AuthContext';

interface AddExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (expense: Omit<Expense, 'id'> | Expense) => void;
    expenseToEdit: Expense | null;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose, onSave, expenseToEdit }) => {
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState<Category>(Category.Food);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [error, setError] = useState('');
    const { currency } = useContext(AuthContext);

    useEffect(() => {
        if (expenseToEdit) {
            setTitle(expenseToEdit.title);
            setAmount(expenseToEdit.amount.toString());
            setCategory(expenseToEdit.category);
            setDate(expenseToEdit.date);
        } else {
            setTitle('');
            setAmount('');
            setCategory(Category.Food);
            setDate(new Date().toISOString().split('T')[0]);
        }
    }, [expenseToEdit, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !amount || parseFloat(amount) <= 0) {
            setError('Please fill in all fields with valid values.');
            return;
        }
        setError('');
        
        const expenseData = {
            title,
            amount: parseFloat(amount),
            category,
            date,
        };
        
        if(expenseToEdit) {
            onSave({ ...expenseData, id: expenseToEdit.id });
        } else {
            onSave(expenseData);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md m-4 transform transition-transform scale-100" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-6 text-slate-800">{expenseToEdit ? 'Edit Expense' : 'Add New Expense'}</h2>
                {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-slate-600">Title</label>
                        <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500" placeholder="e.g., Coffee" />
                    </div>
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-slate-600">Amount</label>
                        <div className="relative mt-1">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <span className="text-gray-500 sm:text-sm">{currency.symbol}</span>
                            </div>
                            <input type="number" id="amount" value={amount} onChange={e => setAmount(e.target.value)} step="0.01" className="block w-full rounded-md border-slate-300 pl-7 pr-12 shadow-sm focus:border-primary-500 focus:ring-primary-500" placeholder="0.00" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-slate-600">Category</label>
                        <select id="category" value={category} onChange={e => setCategory(e.target.value as Category)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">
                            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-slate-600">Date</label>
                        <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition-colors">Cancel</button>
                        <button type="submit" className="py-2 px-4 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700 transition-colors">{expenseToEdit ? 'Save Changes' : 'Add Expense'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};