import React, { useState, useContext } from 'react';
import type { Goal, Expense } from '../types';
import { AuthContext } from '../contexts/AuthContext';
import { generateGoalPlan } from '../services/geminiService';
import { SparklesIcon } from './Icons';

interface AddGoalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (goal: Omit<Goal, 'id'>) => void;
    expenses: Expense[];
}

enum View {
    Form,
    Confirm,
}

export const AddGoalModal: React.FC<AddGoalModalProps> = ({ isOpen, onClose, onSave, expenses }) => {
    const [title, setTitle] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [view, setView] = useState<View>(View.Form);
    const [aiPlan, setAiPlan] = useState<string>('');
    const { currency } = useContext(AuthContext);

    const resetState = () => {
        setTitle('');
        setTargetAmount('');
        setError('');
        setIsLoading(false);
        setView(View.Form);
        setAiPlan('');
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleGeneratePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !targetAmount || parseFloat(targetAmount) <= 0) {
            setError('Please enter a valid title and target amount.');
            return;
        }
        setError('');
        setIsLoading(true);

        try {
            const plan = await generateGoalPlan(title, parseFloat(targetAmount), expenses, currency);
            setAiPlan(plan);
            setView(View.Confirm);
        } catch (err: any) {
            setError(err.message || "Failed to generate AI plan. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmSave = () => {
        const goalData = {
            title,
            targetAmount: parseFloat(targetAmount),
            aiPlan,
        };
        onSave(goalData);
        handleClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity" onClick={handleClose}>
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md m-4 transform transition-transform scale-100 relative" onClick={e => e.stopPropagation()}>
                {isLoading && (
                    <div className="absolute inset-0 bg-white bg-opacity-80 flex flex-col items-center justify-center z-10 rounded-xl">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                        <p className="mt-4 text-slate-600 font-semibold">Generating your AI plan...</p>
                    </div>
                )}
                {view === View.Form && (
                    <>
                        <h2 className="text-2xl font-bold mb-6 text-slate-800">Set a New Financial Goal</h2>
                        {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</p>}
                        <form onSubmit={handleGeneratePlan} className="space-y-4">
                            <div>
                                <label htmlFor="goal-title" className="block text-sm font-medium text-slate-600">Goal Title</label>
                                <input type="text" id="goal-title" value={title} onChange={e => setTitle(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm" placeholder="e.g., Vacation Fund" />
                            </div>
                            <div>
                                <label htmlFor="goal-amount" className="block text-sm font-medium text-slate-600">Target Amount</label>
                                <div className="relative mt-1">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <span className="text-gray-500 sm:text-sm">{currency.symbol}</span>
                                    </div>
                                    <input type="number" id="goal-amount" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} step="0.01" className="block w-full rounded-md border-slate-300 pl-7 pr-12 shadow-sm" placeholder="0.00" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-4 pt-4">
                                <button type="button" onClick={handleClose} className="py-2 px-4 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300">Cancel</button>
                                <button type="submit" className="py-2 px-4 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700 flex items-center gap-2">
                                    <SparklesIcon className="w-5 h-5"/>
                                    Generate AI Plan
                                </button>
                            </div>
                        </form>
                    </>
                )}
                {view === View.Confirm && (
                     <>
                        <h2 className="text-2xl font-bold mb-4 text-slate-800">Your AI Savings Plan</h2>
                        <div className="bg-primary-50 p-4 rounded-lg border border-primary-200 text-slate-700 space-y-2">
                           <p><strong>Goal:</strong> {title}</p>
                           <p><strong>Target:</strong> {new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.code }).format(parseFloat(targetAmount))}</p>
                           <div className="border-t border-primary-200 my-2"></div>
                           <p className="font-semibold text-primary-800">Here's how you can get there:</p>
                           <p>{aiPlan}</p>
                        </div>
                        <div className="flex justify-end gap-4 pt-6">
                            <button type="button" onClick={() => setView(View.Form)} className="py-2 px-4 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300">Back</button>
                            <button type="button" onClick={handleConfirmSave} className="py-2 px-4 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700">Save Goal & Plan</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};