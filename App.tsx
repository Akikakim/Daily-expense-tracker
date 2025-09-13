import React, { useState, useContext, useRef } from 'react';
import { Dashboard } from './components/Dashboard';
import { AddExpenseModal } from './components/AddExpenseModal';
import { useExpenses } from './hooks/useExpenses';
import type { Expense, BackupData } from './types';
import { PlusIcon, UserIcon, LogoutIcon, DownloadIcon, UploadIcon } from './components/Icons';
import { AuthContext } from './contexts/AuthContext';
import { LoginScreen } from './components/LoginScreen';
import { LicenseScreen } from './components/LicenseScreen';
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
    const restoreInputRef = useRef<HTMLInputElement>(null);

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
    
    const handleBackup = () => {
        const userId = auth?.currentUser?.id;
        if (!userId) return;

        const expenses = localStorage.getItem(`expenses_${userId}`) || '[]';
        const budgets = localStorage.getItem(`budgets_${userId}`) || '[]';
        const goals = localStorage.getItem(`goals_${userId}`) || '[]';

        const backupData: BackupData = {
            expenses: JSON.parse(expenses),
            budgets: JSON.parse(budgets),
            goals: JSON.parse(goals),
        };
        
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `expense-tracker-backup-${new Date().toISOString().split('T')[0]}.json`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsProfileOpen(false);
    };

    const handleRestoreChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File is not valid text.");
                
                const data: BackupData = JSON.parse(text);

                // Basic validation
                if (!Array.isArray(data.expenses) || !Array.isArray(data.budgets) || !Array.isArray(data.goals)) {
                    throw new Error("Invalid backup file structure.");
                }

                if (window.confirm("Are you sure you want to restore? This will overwrite your current data for this user.")) {
                    const userId = auth?.currentUser?.id;
                    if (!userId) return;
                    localStorage.setItem(`expenses_${userId}`, JSON.stringify(data.expenses));
                    localStorage.setItem(`budgets_${userId}`, JSON.stringify(data.budgets));
                    localStorage.setItem(`goals_${userId}`, JSON.stringify(data.goals));
                    window.location.reload(); // Easiest way to force all hooks to re-read from storage
                }
            } catch (error: any) {
                alert(`Error restoring data: ${error.message}`);
            } finally {
                 if(restoreInputRef.current) {
                    restoreInputRef.current.value = '';
                }
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="bg-slate-50 min-h-screen font-sans text-slate-800">
             <input
                type="file"
                ref={restoreInputRef}
                className="hidden"
                accept=".json"
                onChange={handleRestoreChange}
            />
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
                                        onClick={handleBackup}
                                        className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                                    >
                                        <DownloadIcon className="w-5 h-5" />
                                        Backup Data
                                    </button>
                                     <button
                                        onClick={() => restoreInputRef.current?.click()}
                                        className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                                    >
                                        <UploadIcon className="w-5 h-5" />
                                        Restore Data
                                    </button>
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
    
    if (!auth?.isLicensed) {
        return <LicenseScreen />;
    }

    if (!auth.currentUser) {
        return <LoginScreen />;
    }

    return <AuthenticatedApp />;
}

export default App;
