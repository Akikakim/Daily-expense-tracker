import React, { useContext } from 'react';
import type { Goal, Currency } from '../types';
import { AuthContext } from '../contexts/AuthContext';
import { TargetIcon, PlusIcon, DeleteIcon } from './Icons';

interface FinancialGoalsProps {
    goals: Goal[];
    onDeleteGoal: (id: string) => void;
    onAddGoal: () => void;
    currency: Currency;
}

export const FinancialGoals: React.FC<FinancialGoalsProps> = ({ goals, onDeleteGoal, onAddGoal, currency }) => {
    
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Financial Goals</h2>
                <button onClick={onAddGoal} className="flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-800">
                    <PlusIcon className="w-4 h-4"/> Add Goal
                </button>
            </div>

            {goals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {goals.map(goal => (
                        <div key={goal.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col">
                            <div className="flex-grow">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-slate-800">{goal.title}</p>
                                        <p className="font-semibold text-primary-600 text-lg">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.code }).format(goal.targetAmount)}
                                        </p>
                                    </div>
                                    <TargetIcon className="w-8 h-8 text-primary-400"/>
                                </div>
                                {goal.aiPlan && (
                                    <div className="mt-3 text-sm text-slate-600 bg-primary-50 p-3 rounded-md border border-primary-200">
                                        <p className="font-semibold mb-1 text-primary-700">AI Savings Plan:</p>
                                        <p>{goal.aiPlan}</p>
                                    </div>
                                )}
                            </div>
                            <div className="mt-4 text-right">
                                <button onClick={() => onDeleteGoal(goal.id)} className="p-1 text-slate-400 hover:text-red-600" aria-label={`Delete ${goal.title} goal`}>
                                    <DeleteIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-slate-500 py-8">You haven't set any financial goals yet. Click "Add Goal" to create one!</p>
            )}
        </div>
    );
};