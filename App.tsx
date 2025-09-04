import React, { useState, useContext } from 'react';
import { Dashboard } from './components/Dashboard';
import { AddExpenseModal } from './components/AddExpenseModal';
import { useExpenses } from './hooks/useExpenses';
import type { Expense } from './types';
import { PlusIcon, UserIcon, LogoutIcon } from './components/Icons';
import { AuthContext } from './contexts/AuthContext';
import { LoginScreen } from './components/LoginScreen';
import { CURRENCIES } from './constants';

const AuthenticatedApp: React.FC = () => {
    const { 
        expenses, 
        addExpense, 
        updateExpense, 
        deleteExpense,
        getAIInsights,
        aiInsight,
        isAIInsightLoading
    } = useExpenses();
    const auth = useContext(AuthContext);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

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
            <header className="bg-white shadow-sm sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-primary-700">AI Expense Tracker Pro</h1>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => handleOpenModal()}
                            className="flex items-center gap-2 bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-transform transform hover:scale-105"
                        >
                            <PlusIcon className="w-5 h-5" />
                            Add Expense
                        </button>
                        <div className="relative">
                            <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="p-2 rounded-full hover:bg-slate-100">
                                <UserIcon className="w-6 h-6 text-slate-600" />
                            </button>
                            {isProfileOpen && (
                                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl py-2 z-30">
                                    <div className="px-4 py-2">
                                        <p className="font-semibold text-slate-800">{auth?.currentUser?.username}</p>
                                        <p className="text-sm text-slate-500">Welcome back!</p>
                                    </div>
                                    <div className="border-t border-slate-200 my-2"></div>
                                    <div className="px-4 py-2">
                                        <label htmlFor="currency" className="block text-sm font-medium text-slate-600 mb-1">Currency</label>
                                        <select
                                            id="currency"
                                            value={auth?.currency.code}
                                            onChange={(e) => auth?.setCurrency(CURRENCIES.find(c => c.code === e.target.value)!)}
                                            className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                        >
                                            {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.name} ({c.symbol})</option>)}
                                        </select>
                                    </div>
                                    <div className="border-t border-slate-200 my-2"></div>
                                    <button
                                        onClick={auth?.logout}
                                        className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                                    >
                                        <LogoutIcon className="w-5 h-5" />
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
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
            <footer className="py-4 text-center text-sm text-slate-500">
                Powered by Aqeel Serani Digital Agency
            </footer>
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

const App: React.FC = () => {
    const auth = useContext(AuthContext);

    if (auth?.isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
            </div>
        );
    }
    
    return auth?.currentUser ? <AuthenticatedApp /> : <LoginScreen />;
}

export default App;