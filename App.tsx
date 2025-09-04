
import React, { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { AddExpenseModal } from './components/AddExpenseModal';
import { useExpenses } from './hooks/useExpenses';
import type { Expense } from './types';
import { PlusIcon } from './components/Icons';

const App: React.FC = () => {
    const { 
        expenses, 
        addExpense, 
        updateExpense, 
        deleteExpense,
        getAIInsights,
        aiInsight,
        isAIInsightLoading
    } = useExpenses();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

    const handleOpenModal = (expense?: Expense) => {
        setExpenseToEdit(expense || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setExpenseToEdit(null);
        setIsModalOpen(false);
    };

    const handleSaveExpense = (expense: Omit<Expense, 'id'> | Expense) => {
        if ('id' in expense) {
            updateExpense(expense.id, expense);
        } else {
            addExpense(expense);
        }
        handleCloseModal();
    };
    
    return (
        <div className="bg-slate-50 min-h-screen font-sans text-slate-800">
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-primary-700">AI Expense Tracker Pro</h1>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-transform transform hover:scale-105"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Add Expense
                    </button>
                </div>
            </header>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Dashboard 
                    expenses={expenses}
                    onEditExpense={handleOpenModal} 
                    onDeleteExpense={deleteExpense}
                    getAIInsights={getAIInsights}
                    aiInsight={aiInsight}
                    isAIInsightLoading={isAIInsightLoading}
                />
            </main>
            {isModalOpen && (
                <AddExpenseModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSave={handleSaveExpense}
                    expenseToEdit={expenseToEdit}
                />
            )}
        </div>
    );
};

export default App;
