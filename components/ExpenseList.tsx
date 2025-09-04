import React from 'react';
import type { Expense, Currency } from '../types';
import { CATEGORY_DETAILS } from '../constants';
import { EditIcon, DeleteIcon } from './Icons';
import { format, parseISO } from 'date-fns';

interface ExpenseListProps {
    expenses: Expense[];
    onEdit: (expense: Expense) => void;
    onDelete: (id: string) => void;
    currency: Currency;
}

const ExpenseListItem: React.FC<{ expense: Expense; onEdit: (expense: Expense) => void; onDelete: (id: string) => void; currency: Currency; }> = ({ expense, onEdit, onDelete, currency }) => {
    const { icon: Icon, color } = CATEGORY_DETAILS[expense.category];

    return (
        <li className="flex items-center p-4 space-x-4 border-b border-slate-100 hover:bg-slate-50 transition-colors">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color} flex-shrink-0`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 truncate">{expense.title}</p>
                <p className="text-sm text-slate-500">{format(parseISO(expense.date), 'MMMM d, yyyy')}</p>
            </div>
            <div className="text-right">
                <p className="font-bold text-lg text-slate-800">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.code }).format(expense.amount)}
                </p>
                 <p className="text-sm text-slate-500">{expense.category}</p>
            </div>
            <div className="flex items-center space-x-2 ml-4">
                <button onClick={() => onEdit(expense)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors" aria-label={`Edit ${expense.title}`}>
                    <EditIcon className="w-5 h-5" />
                </button>
                <button onClick={() => onDelete(expense.id)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors" aria-label={`Delete ${expense.title}`}>
                    <DeleteIcon className="w-5 h-5" />
                </button>
            </div>
        </li>
    );
};

export const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onEdit, onDelete, currency }) => {
    if (expenses.length === 0) {
        return <p className="text-center text-slate-500 py-8">No expenses found. Try adjusting your filters or adding a new expense!</p>;
    }

    return (
        <ul className="divide-y divide-slate-200">
            {expenses.map(expense => (
                <ExpenseListItem key={expense.id} expense={expense} onEdit={onEdit} onDelete={onDelete} currency={currency} />
            ))}
        </ul>
    );
};