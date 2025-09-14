import React, { useState, useMemo, useContext, useRef } from 'react';
import type { Expense, Goal, Budget, Currency } from '../types';
import { Category } from '../types';
import { StatCard } from './StatCard';
import { ExpenseChart } from './ExpenseChart';
import { ExpenseList } from './ExpenseList';
import { AIInsights } from './AIInsights';
import { Budgets } from './Budgets';
// FIX: Changed date-fns imports to use named imports from the main package to resolve call signature errors.
import {
    isSameMonth,
    isSameYear,
    format,
    getDaysInMonth,
    addMonths,
    subMonths,
    parseISO,
} from 'date-fns';
import { AuthContext } from '../contexts/AuthContext';
import { CATEGORIES, CATEGORY_DETAILS } from '../constants';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useBudgets } from '../hooks/useBudgets';
import { AIChat } from './AIChat';
import { FinancialGoals } from './FinancialGoals';
import { AddGoalModal } from './AddGoalModal';
import { useGoals } from '../hooks/useGoals';
import { SpendingTrendsChart } from './SpendingTrendsChart';
import { TargetIcon } from './Icons';

interface ReportTemplateProps {
    expenses: Expense[];
    allExpenses: Expense[];
    budgets: Budget[];
    goals: Goal[];
    aiInsight: string | null;
    currency: Currency;
    user: { username: string };
    period: string;
    stats: {
        totalExpense: number;
        monthlySurplus: number;
        monthlyForecast: number;
        transactions: number;
    };
    expensesByCategory: { name: string; value: number }[];
}

const ReportTemplate = React.forwardRef<HTMLDivElement, ReportTemplateProps>((props, ref) => {
    const { expenses, allExpenses, budgets, goals, aiInsight, currency, user, period, stats, expensesByCategory } = props;

    const spendingForReportPeriod = useMemo(() => expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
    }, {} as Record<Category, number>), [expenses]);
    
    const activeBudgets = budgets.filter(b => b.amount > 0);

    const formattedInsight = aiInsight
        ?.replace(/### (.*?)\n/g, '<h3 class="text-lg font-semibold mt-4 mb-2 text-slate-700">$1</h3>')
        .replace(/## (.*?)\n/g, '<h2 class="text-xl font-bold mt-4 mb-3 text-slate-800">$1</h2>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\* (.*?)\n/g, '<li class="ml-5 list-disc text-slate-600 mb-2">$1</li>');

    return (
         <div ref={ref} className="bg-white font-sans text-slate-900 w-[794px]">
            {/* Page 1: Summary & Charts */}
            <div className="report-page w-[794px] h-[1123px] p-10 flex flex-col bg-white">
                <header className="flex justify-between items-center pb-4 border-b">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">Expense Report</h1>
                        <p className="text-slate-500">Report for: {user.username}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-slate-500">Period: {period}</p>
                        <p className="text-slate-500">Generated on: {format(new Date(), 'MMMM d, yyyy')}</p>
                    </div>
                </header>
                <section className="grid grid-cols-2 gap-6 my-8">
                     <div className="bg-slate-50 p-4 rounded-lg shadow-sm border"><h3 className="text-slate-500 font-medium">Total Spending</h3><p className="text-2xl font-bold text-slate-800 mt-1">{new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.code }).format(stats.totalExpense)}</p></div>
                     <div className="bg-slate-50 p-4 rounded-lg shadow-sm border"><h3 className="text-slate-500 font-medium">Transactions</h3><p className="text-2xl font-bold text-slate-800 mt-1">{stats.transactions}</p></div>
                     <div className="bg-slate-50 p-4 rounded-lg shadow-sm border"><h3 className="text-slate-500 font-medium">Avg. Transaction</h3><p className="text-2xl font-bold text-slate-800 mt-1">{new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.code }).format(stats.transactions > 0 ? stats.totalExpense / stats.transactions : 0)}</p></div>
                     <div className="bg-slate-50 p-4 rounded-lg shadow-sm border"><h3 className="text-slate-500 font-medium">This Month's Savings</h3><p className="text-2xl font-bold text-slate-800 mt-1">{new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.code }).format(stats.monthlySurplus)}</p></div>
                </section>
                <section className="grid grid-cols-2 gap-8 flex-grow">
                    <div className="bg-white p-4 rounded-lg shadow-md border flex flex-col">
                        <h3 className="text-lg font-bold text-center mb-2">Spending by Category</h3>
                        {expensesByCategory.length > 0 ? <ExpenseChart data={expensesByCategory} currency={currency} /> : <div className="h-full flex items-center justify-center text-slate-500">No data available</div>}
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-md border flex flex-col">
                         <h3 className="text-lg font-bold text-center mb-2">Spending Trends (Last 6 Months)</h3>
                         <SpendingTrendsChart allExpenses={allExpenses} currency={currency} />
                    </div>
                </section>
                <footer className="text-center text-xs text-slate-400 pt-4 mt-auto">Powered by Aqeel Serani Digital Agency</footer>
            </div>

            {/* Page 2: AI Financial Assistant */}
            <div className="report-page w-[794px] h-[1123px] p-10 flex flex-col bg-white">
                <header className="pb-4 border-b">
                    <h1 className="text-3xl font-bold text-primary-700 text-center">AI Financial Assistant</h1>
                </header>
                 {aiInsight ? (
                     <div className="mt-8 text-base prose max-w-none" dangerouslySetInnerHTML={{ __html: formattedInsight || ''}} />
                 ) : (
                    <div className="flex-grow flex items-center justify-center text-slate-500">No AI insights available for this period.</div>
                 )}
                 <footer className="text-center text-xs text-slate-400 pt-4 mt-auto">Powered by Aqeel Serani Digital Agency</footer>
            </div>
            
            {/* Page 3: Budgets & Goals */}
            <div className="report-page w-[794px] h-[1123px] p-10 flex flex-col bg-white">
                 <header className="pb-4 border-b">
                    <h1 className="text-3xl font-bold text-slate-800">Monthly Budget Progress</h1>
                </header>
                <section className="my-8 space-y-5">
                     {activeBudgets.length > 0 ? activeBudgets.map(budget => {
                         const spent = spendingForReportPeriod[budget.category] || 0;
                         const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
                         const isOverBudget = percentage > 100;
                         const barColor = isOverBudget ? 'bg-red-500' : CATEGORY_DETAILS[budget.category].color;
                         return (
                            <div key={budget.category}>
                                <div className="flex justify-between items-center mb-1 text-sm"><span className="font-semibold text-slate-700">{budget.category}</span><span className={`font-medium ${isOverBudget ? 'text-red-600' : 'text-slate-500'}`}>{new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.code }).format(spent)} / {new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.code }).format(budget.amount)}</span></div>
                                <div className="w-full bg-slate-200 rounded-full h-2.5"><div className={`${barColor} h-2.5 rounded-full`} style={{ width: `${Math.min(percentage, 100)}%` }}></div></div>
                            </div>
                         );
                     }) : <p className="text-center text-slate-500 py-8">No budgets have been set for this period.</p>}
                </section>
                <header className="pb-4 border-b mt-8">
                    <h1 className="text-3xl font-bold text-slate-800">Financial Goals</h1>
                </header>
                <section className="my-8 space-y-6">
                    {goals.length > 0 ? goals.map(goal => (
                        <div key={goal.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-slate-800 text-lg">{goal.title}</p>
                                    <p className="font-semibold text-primary-600 text-xl">{new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.code }).format(goal.targetAmount)}</p>
                                </div>
                                <TargetIcon className="w-8 h-8 text-primary-400"/>
                            </div>
                            {goal.aiPlan && <div className="mt-3 text-sm text-slate-600 bg-primary-50 p-3 rounded-md border border-primary-200"><p className="font-semibold mb-1 text-primary-700">AI Savings Plan:</p><p>{goal.aiPlan}</p></div>}
                        </div>
                    )) : <p className="text-center text-slate-500 py-8">No financial goals have been set.</p>}
                </section>
                <footer className="text-center text-xs text-slate-400 pt-4 mt-auto">Powered by Aqeel Serani Digital Agency</footer>
            </div>
            
             {/* Page 4: Transactions */}
            <div className="report-page w-[794px] h-[1123px] p-10 flex flex-col bg-white">
                 <header className="pb-4 border-b">
                    <h1 className="text-3xl font-bold text-slate-800">Detailed Transactions</h1>
                </header>
                <table className="w-full text-left mt-8 border-collapse">
                    <thead>
                        <tr className="border-b-2 border-slate-300">
                            <th className="p-2 text-sm font-semibold text-slate-600 w-1/4">Date</th>
                            <th className="p-2 text-sm font-semibold text-slate-600 w-2/5">Title</th>
                            <th className="p-2 text-sm font-semibold text-slate-600 w-1/5">Category</th>
                            <th className="p-2 text-sm font-semibold text-slate-600 text-right w-auto">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {expenses.map((expense, index) => (
                            <tr key={expense.id} className={`border-b border-slate-100 ${index % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}>
                                <td className="p-3 text-sm">{format(parseISO(expense.date), 'MMM d, yyyy')}</td>
                                <td className="p-3 text-sm truncate">{expense.title}</td>
                                <td className="p-3 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-3 h-3 rounded-full ${CATEGORY_DETAILS[expense.category].color}`}></span>
                                        {expense.category}
                                    </div>
                                </td>
                                <td className="p-3 text-sm font-mono text-right">{new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.code }).format(expense.amount)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="border-t-2 border-slate-300">
                            <td colSpan={3} className="p-3 text-right font-bold text-lg">Total</td>
                            <td className="p-3 font-bold font-mono text-lg text-right">{new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.code }).format(stats.totalExpense)}</td>
                        </tr>
                    </tfoot>
                </table>
                <footer className="text-center text-xs text-slate-400 pt-4 mt-auto">Powered by Aqeel Serani Digital Agency</footer>
            </div>
         </div>
    );
});

interface DashboardProps {
    expenses: Expense[];
    onEditExpense: (expense: Expense) => void;
    onDeleteExpense: (id: string) => void;
    getAIInsights: (expenses: Expense[], timePeriod: string) => void;
    aiInsight: string | null;
    isAIInsightLoading: boolean;
    currentDate: Date;
    setCurrentDate: React.Dispatch<React.SetStateAction<Date>>;
}

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
            active
                ? 'bg-primary-600 text-white shadow'
                : 'text-slate-600 hover:bg-slate-100'
        }`}
    >
        {children}
    </button>
);


export const Dashboard: React.FC<DashboardProps> = ({ expenses, onEditExpense, onDeleteExpense, getAIInsights, aiInsight, isAIInsightLoading, currentDate, setCurrentDate }) => {
    const { currency, currentUser } = useContext(AuthContext);
    const { budgets } = useBudgets();
    const { goals, addGoal, deleteGoal } = useGoals();
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<Category | 'All'>('All');
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('category');
    const reportRef = useRef<HTMLDivElement>(null);


    const { filteredExpenses, title } = useMemo(() => {
        const periodExpenses = expenses.filter(e => isSameMonth(new Date(e.date), currentDate) && isSameYear(new Date(e.date), currentDate));
        const periodTitle = `Expenses for ${format(currentDate, 'MMMM yyyy')}`;

        const searchedAndFilteredExpenses = periodExpenses.filter(expense => {
            const matchesSearch = expense.title.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = categoryFilter === 'All' || expense.category === categoryFilter;
            return matchesSearch && matchesCategory;
        });

        return { filteredExpenses: searchedAndFilteredExpenses, title: periodTitle };
    }, [expenses, currentDate, searchTerm, categoryFilter]);

    const totalExpense = useMemo(() => filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0), [filteredExpenses]);
    
    // Use the filtered expenses for the current month for these calculations
    const monthlyExpenses = useMemo(() => expenses.filter(e => isSameMonth(parseISO(e.date), new Date())), [expenses]);
    
    const { monthlyForecast, monthlySurplus } = useMemo(() => {
        const now = new Date();
        const totalSpentThisMonth = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const dayOfMonth = now.getDate();
        const daysInMonth = getDaysInMonth(now);
        const avgDailySpend = dayOfMonth > 0 ? totalSpentThisMonth / dayOfMonth : 0;
        const forecast = avgDailySpend * daysInMonth;

        const spendingByCategory = monthlyExpenses.reduce((acc, expense) => {
            acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
            return acc;
        }, {} as Record<Category, number>);

        const surplus = budgets.reduce((total, budget) => {
            const spent = spendingByCategory[budget.category] || 0;
            if (spent < budget.amount) {
                total += (budget.amount - spent);
            }
            return total;
        }, 0);

        return { monthlyForecast: forecast, monthlySurplus: surplus };
    }, [monthlyExpenses, budgets]);


    const expensesByCategory = useMemo(() => {
        const categoryMap = new Map<string, number>();
        filteredExpenses.forEach(expense => {
            const currentAmount = categoryMap.get(expense.category) || 0;
            categoryMap.set(expense.category, currentAmount + expense.amount);
        });
        return Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));
    }, [filteredExpenses]);
    
    const handleGetAIInsights = () => getAIInsights(filteredExpenses, format(currentDate, 'MMMM yyyy'));

    const handleSaveGoal = (goal: Omit<Goal, 'id'>) => {
        addGoal(goal);
        setIsAddGoalModalOpen(false);
    };

    const exportToCSV = () => {
        const headers = "ID,Title,Amount,Category,Date\n";
        const csvContent = filteredExpenses.map(e => `${e.id},"${e.title}",${e.amount},${e.category},${e.date}`).join("\n");
        const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `expenses-${format(currentDate, 'yyyy-MM')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadReport = async () => {
        setIsGeneratingReport(true);
        // Delay to allow the hidden report component to render with the latest data
        setTimeout(async () => {
            const reportElement = reportRef.current;
            if (!reportElement) {
                console.error("Report template element not found.");
                setIsGeneratingReport(false);
                alert("Could not generate report. Please try again.");
                return;
            }

            try {
                const pdf = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4' });
                const pageElements = reportElement.querySelectorAll<HTMLElement>('.report-page');
                const totalPages = pageElements.length;
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();

                for (let i = 0; i < totalPages; i++) {
                    const pageElement = pageElements[i];
                    const canvas = await html2canvas(pageElement, {
                        scale: 2,
                        useCORS: true,
                        logging: false,
                        backgroundColor: '#ffffff'
                    });
                    
                    if (i > 0) pdf.addPage();
                    const imgData = canvas.toDataURL('image/png');
                    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

                    pdf.setPage(i + 1);
                    pdf.setFontSize(8);
                    pdf.setTextColor(150, 150, 150);
                    pdf.text(`Page ${i + 1} of ${totalPages}`, pdfWidth - 40, pdfHeight - 20, { align: 'right' });
                }

                pdf.save(`Expense-Report-${format(currentDate, 'yyyy-MM')}.pdf`);
            } catch (error) {
                console.error("Error generating PDF:", error);
                alert("Sorry, there was an error generating the PDF report.");
            } finally {
                setIsGeneratingReport(false);
            }
        }, 500);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-center items-center bg-white p-2 rounded-lg shadow-sm">
                <button onClick={() => setCurrentDate(d => subMonths(d, 1))} className="p-2 rounded-md hover:bg-slate-100 text-slate-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h2 className="text-xl font-bold text-center w-60 mx-4">{format(currentDate, 'MMMM yyyy')}</h2>
                 <button onClick={() => setCurrentDate(d => addMonths(d, 1))} className="p-2 rounded-md hover:bg-slate-100 text-slate-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Spending" value={totalExpense} currency={currency} />
                <StatCard title="This Month's Savings" value={monthlySurplus} currency={currency} tooltip="Amount you are under budget so far this month." />
                <StatCard title="Monthly Forecast" value={monthlyForecast} currency={currency} tooltip="Projected spending for this month based on your current rate." />
                <StatCard title="Transactions" value={filteredExpenses.length} isCurrency={false} currency={currency} />
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                    <h2 className="text-xl font-bold">{title}</h2>
                    <div className="flex items-center gap-2">
                        <input type="text" placeholder="Search expenses..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-md shadow-sm w-40 focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
                        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value as Category | 'All')} className="px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">
                            <option value="All">All Categories</option>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                         <button onClick={exportToCSV} className="py-2 px-4 bg-emerald-600 text-white font-semibold rounded-lg shadow-md hover:bg-emerald-700 transition-colors text-sm">Export CSV</button>
                       <button onClick={downloadReport} disabled={isGeneratingReport} className="py-2 px-4 bg-rose-600 text-white font-semibold rounded-lg shadow-md hover:bg-rose-700 transition-colors text-sm disabled:bg-rose-300">
                           {isGeneratingReport ? 'Generating...' : 'Download Report'}
                       </button>
                    </div>
                </div>
                <ExpenseList expenses={filteredExpenses} onEdit={onEditExpense} onDelete={onDeleteExpense} currency={currency} />
                 <div className="flex justify-end items-center mt-4 pt-4 border-t-2">
                    <span className="text-lg font-bold text-slate-800">Total:</span>
                    <span className="text-lg font-bold text-slate-900 ml-4">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.code }).format(totalExpense)}
                    </span>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center gap-4 border-b border-slate-200 mb-4">
                    <TabButton active={activeTab === 'category'} onClick={() => setActiveTab('category')}>Spending by Category</TabButton>
                    <TabButton active={activeTab === 'trends'} onClick={() => setActiveTab('trends')}>Spending Trends</TabButton>
                    <TabButton active={activeTab === 'ai'} onClick={() => setActiveTab('ai')}>AI Insights</TabButton>
                </div>
                <div>
                    {activeTab === 'category' && (
                         <div>
                            <ExpenseChart data={expensesByCategory} currency={currency} />
                        </div>
                    )}
                     {activeTab === 'trends' && (
                        <div>
                            <SpendingTrendsChart allExpenses={expenses} currency={currency} />
                        </div>
                    )}
                    {activeTab === 'ai' && (
                         <AIInsights onGenerate={handleGetAIInsights} insight={aiInsight} isLoading={isAIInsightLoading} />
                    )}
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
                <FinancialGoals goals={goals} onDeleteGoal={deleteGoal} onAddGoal={() => setIsAddGoalModalOpen(true)} currency={currency} />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
                <AIChat expenses={filteredExpenses} budgets={budgets} currency={currency} />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
                 <Budgets expenses={monthlyExpenses} />
            </div>

            {isAddGoalModalOpen && (
                <AddGoalModal 
                    isOpen={isAddGoalModalOpen}
                    onClose={() => setIsAddGoalModalOpen(false)}
                    onSave={handleSaveGoal}
                    expenses={monthlyExpenses}
                />
            )}
            
            {/* Hidden container for PDF generation */}
             {isGeneratingReport && (
                <div className="absolute -left-[9999px] top-auto">
                    <ReportTemplate
                        ref={reportRef}
                        expenses={filteredExpenses}
                        allExpenses={expenses}
                        budgets={budgets}
                        goals={goals}
                        aiInsight={aiInsight}
                        currency={currency}
                        user={{ username: currentUser?.username || 'User' }}
                        period={format(currentDate, 'MMMM yyyy')}
                        stats={{ totalExpense, monthlySurplus, monthlyForecast, transactions: filteredExpenses.length }}
                        expensesByCategory={expensesByCategory}
                    />
                </div>
            )}
        </div>
    );
};