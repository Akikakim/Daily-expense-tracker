import React, { useState, useMemo, useContext, useRef } from 'react';
import type { Expense } from '../types';
import { TimeView, Category } from '../types';
import { StatCard } from './StatCard';
import { ExpenseChart } from './ExpenseChart';
import { ExpenseList } from './ExpenseList';
import { AIInsights } from './AIInsights';
import { Budgets } from './Budgets';
import { isSameDay, isSameWeek, isSameMonth, isSameYear, format, startOfWeek, endOfWeek } from 'date-fns';
import { AuthContext } from '../contexts/AuthContext';
import { CATEGORIES } from '../constants';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
    const { currency, currentUser } = useContext(AuthContext);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<Category | 'All'>('All');
    const reportRef = useRef<HTMLDivElement>(null);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);

    const { filteredExpenses, title } = useMemo(() => {
        const now = new Date();
        let periodExpenses: Expense[];
        let periodTitle: string;

        switch (timeView) {
            case TimeView.Daily:
                periodExpenses = expenses.filter(e => isSameDay(new Date(e.date), now));
                periodTitle = `Today's Expenses (${format(now, 'MMMM do')})`;
                break;
            case TimeView.Weekly:
                periodExpenses = expenses.filter(e => isSameWeek(new Date(e.date), now, { weekStartsOn: 1 }));
                periodTitle = `This Week's Expenses (${format(startOfWeek(now, { weekStartsOn: 1 }), 'MMM d')} - ${format(endOfWeek(now, { weekStartsOn: 1 }), 'MMM d')})`;
                break;
            case TimeView.Yearly:
                periodExpenses = expenses.filter(e => isSameYear(new Date(e.date), now));
                periodTitle = `This Year's Expenses (${format(now, 'yyyy')})`;
                break;
            case TimeView.Monthly:
            default:
                periodExpenses = expenses.filter(e => isSameMonth(new Date(e.date), now));
                periodTitle = `This Month's Expenses (${format(now, 'MMMM yyyy')})`;
                break;
        }

        const searchedAndFilteredExpenses = periodExpenses.filter(expense => {
            const matchesSearch = expense.title.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = categoryFilter === 'All' || expense.category === categoryFilter;
            return matchesSearch && matchesCategory;
        });

        return { filteredExpenses: searchedAndFilteredExpenses, title: periodTitle };
    }, [expenses, timeView, searchTerm, categoryFilter]);

    const totalExpense = useMemo(() => filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0), [filteredExpenses]);
    const expensesByCategory = useMemo(() => {
        const categoryMap = new Map<string, number>();
        filteredExpenses.forEach(expense => {
            const currentAmount = categoryMap.get(expense.category) || 0;
            categoryMap.set(expense.category, currentAmount + expense.amount);
        });
        return Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));
    }, [filteredExpenses]);
    
    const handleGetAIInsights = () => getAIInsights(filteredExpenses, timeView);

    const exportToCSV = () => {
        const headers = "ID,Title,Amount,Category,Date\n";
        const csvContent = filteredExpenses.map(e => `${e.id},"${e.title}",${e.amount},${e.category},${e.date}`).join("\n");
        const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `expenses-${timeView}-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadReport = async () => {
        setIsGeneratingReport(true);
        const reportElement = reportRef.current;
        if (reportElement) {
            const canvas = await html2canvas(reportElement, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`report-${timeView}-${new Date().toISOString().split('T')[0]}.pdf`);
        }
        setIsGeneratingReport(false);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-center bg-white p-2 rounded-lg shadow-sm mb-6">
                {Object.values(TimeView).map(view => (
                    <button key={view} onClick={() => setTimeView(view)} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors w-full ${timeView === view ? 'bg-primary-600 text-white shadow' : 'text-slate-600 hover:bg-primary-100'}`}>
                        {view}
                    </button>
                ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title={`Total ${timeView} Spending`} value={totalExpense} currency={currency} />
                <StatCard title="Transactions" value={filteredExpenses.length} isCurrency={false} currency={currency} />
                <StatCard title="Avg. Transaction" value={filteredExpenses.length > 0 ? totalExpense / filteredExpenses.length : 0} currency={currency} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-bold mb-4">Spending by Category</h2>
                    <ExpenseChart data={expensesByCategory} currency={currency} />
                </div>
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
                    <AIInsights onGenerate={handleGetAIInsights} insight={aiInsight} isLoading={isAIInsightLoading} />
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
                 <Budgets expenses={filteredExpenses.filter(e => isSameMonth(new Date(e.date), new Date()))} />
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
                    </div>
                    <div className="flex items-center gap-2">
                       <button onClick={exportToCSV} className="py-2 px-4 bg-emerald-600 text-white font-semibold rounded-lg shadow-md hover:bg-emerald-700 transition-colors text-sm">Export CSV</button>
                       <button onClick={downloadReport} disabled={isGeneratingReport} className="py-2 px-4 bg-rose-600 text-white font-semibold rounded-lg shadow-md hover:bg-rose-700 transition-colors text-sm disabled:bg-rose-300">
                           {isGeneratingReport ? 'Generating...' : 'Download Report'}
                       </button>
                    </div>
                </div>
                <ExpenseList expenses={filteredExpenses} onEdit={onEditExpense} onDelete={onDeleteExpense} currency={currency} />
            </div>

            {/* Hidden report for PDF generation */}
            <div className="absolute -left-[9999px] top-0">
                <div ref={reportRef} className="p-10 bg-white" style={{width: '210mm'}}>
                    <h1 className="text-3xl font-bold text-primary-700 mb-2">Expense Report</h1>
                    <p className="text-slate-600">Generated for: {currentUser?.username}</p>
                    <p className="text-slate-600">Period: {title}</p>
                    <p className="text-slate-500 mb-8">Powered by Aqeel Serani Digital Agency</p>
                    <div className="grid grid-cols-3 gap-6 mb-8">
                        <StatCard title={`Total Spending`} value={totalExpense} currency={currency} />
                        <StatCard title="Transactions" value={filteredExpenses.length} isCurrency={false} currency={currency} />
                        <StatCard title="Avg. Transaction" value={filteredExpenses.length > 0 ? totalExpense / filteredExpenses.length : 0} currency={currency} />
                    </div>
                    <div className="mb-8">
                         <h2 className="text-xl font-bold mb-4">Spending by Category</h2>
                         <ExpenseChart data={expensesByCategory} currency={currency} />
                    </div>
                    {aiInsight && !isAIInsightLoading && (
                        <div className="mb-8 p-6 bg-slate-50 rounded-lg">
                           <AIInsights onGenerate={()=>{}} insight={aiInsight} isLoading={false} />
                        </div>
                    )}
                    <div>
                        <h2 className="text-xl font-bold mb-4">All Transactions</h2>
                        <ExpenseList expenses={filteredExpenses} onEdit={()=>{}} onDelete={()=>{}} currency={currency} />
                    </div>
                </div>
            </div>
        </div>
    );
};