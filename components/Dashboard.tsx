
import React, { useState, useMemo } from 'react';
import type { Expense } from '../types';
import { TimeView } from '../types';
import { StatCard } from './StatCard';
import { ExpenseChart } from './ExpenseChart';
import { ExpenseList } from './ExpenseList';
import { AIInsights } from './AIInsights';
import { isSameDay, isSameWeek, isSameMonth, isSameYear, startOfWeek, endOfWeek, format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

interface DashboardProps {
    expenses: Expense[];
    onEditExpense: (expense: Expense) => void;
    onDeleteExpense: (id: string) => void;
    getAIInsights: (expenses: Expense[], timePeriod: string) => void;
    aiInsight: string | null;
    isAIInsightLoading: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ expenses, onEditExpense, onDeleteExpense, getAIInsights, aiInsight, isAIInsightLoading }) => {
    const [timeView, setTimeView] = useState<TimeView>(TimeView.Monthly);
    
    const { filteredExpenses, title } = useMemo(() => {
        const now = new Date();
        switch (timeView) {
            case TimeView.Daily:
                return {
                    filteredExpenses: expenses.filter(e => isSameDay(new Date(e.date), now)),
                    title: `Today's Expenses (${format(now, 'MMMM do')})`
                };
            case TimeView.Weekly:
                 return {
                    filteredExpenses: expenses.filter(e => isSameWeek(new Date(e.date), now, { weekStartsOn: 1 })),
                    title: `This Week's Expenses (${format(startOfWeek(now, { weekStartsOn: 1 }), 'MMM d')} - ${format(endOfWeek(now, { weekStartsOn: 1 }), 'MMM d')})`
                };
            case TimeView.Yearly:
                return {
                    filteredExpenses: expenses.filter(e => isSameYear(new Date(e.date), now)),
                    title: `This Year's Expenses (${format(now, 'yyyy')})`
                };
            case TimeView.Monthly:
            default:
                 return {
                    filteredExpenses: expenses.filter(e => isSameMonth(new Date(e.date), now)),
                    title: `This Month's Expenses (${format(now, 'MMMM yyyy')})`
                };
        }
    }, [expenses, timeView]);

    const totalExpense = useMemo(() => {
        return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    }, [filteredExpenses]);

    const expensesByCategory = useMemo(() => {
        const categoryMap = new Map<string, number>();
        filteredExpenses.forEach(expense => {
            const currentAmount = categoryMap.get(expense.category) || 0;
            categoryMap.set(expense.category, currentAmount + expense.amount);
        });
        return Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));
    }, [filteredExpenses]);
    
    const handleGetAIInsights = () => {
        getAIInsights(filteredExpenses, timeView);
    };

    return (
        <div className="space-y-8">
            <div>
                <div className="flex justify-center bg-white p-2 rounded-lg shadow-sm mb-6">
                    {Object.values(TimeView).map(view => (
                        <button
                            key={view}
                            onClick={() => setTimeView(view)}
                            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors w-full ${timeView === view ? 'bg-primary-600 text-white shadow' : 'text-slate-600 hover:bg-primary-100'}`}
                        >
                            {view}
                        </button>
                    ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard title={`Total ${timeView} Spending`} value={totalExpense} />
                    <StatCard title="Transactions" value={filteredExpenses.length} isCurrency={false} />
                    <StatCard title="Avg. Transaction" value={filteredExpenses.length > 0 ? totalExpense / filteredExpenses.length : 0} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-bold mb-4">Spending by Category</h2>
                    <ExpenseChart data={expensesByCategory} />
                </div>
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
                    <AIInsights 
                        onGenerate={handleGetAIInsights}
                        insight={aiInsight}
                        isLoading={isAIInsightLoading}
                    />
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-bold mb-4">{title}</h2>
                <ExpenseList
                    expenses={filteredExpenses}
                    onEdit={onEditExpense}
                    onDelete={onDeleteExpense}
                />
            </div>
        </div>
    );
};
