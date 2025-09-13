import React, { useState, useMemo, useContext, useRef } from 'react';
import type { Expense, Goal } from '../types';
import { Category } from '../types';
import { StatCard } from './StatCard';
import { ExpenseChart } from './ExpenseChart';
import { ExpenseList } from './ExpenseList';
import { AIInsights } from './AIInsights';
import { Budgets } from './Budgets';
// FIX: Changed date-fns imports to use named imports from the main package to resolve module resolution issues.
import { isSameMonth, isSameYear, format, getDaysInMonth, addMonths, subMonths, parseISO } from 'date-fns';
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
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('category');


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
        try {
            const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 40;
            let yPos = 0;
            let pageNumber = 1;

            const addPageHeaderAndFooter = (page: number, totalPages: number) => {
                 pdf.setPage(page);
                pdf.setFontSize(8);
                pdf.setTextColor(150);
                pdf.text(`Page ${page} of ${totalPages}`, pageWidth - margin, pageHeight - 15, { align: 'right' });
                pdf.text('Powered by Aqeel Serani Digital Agency', margin, pageHeight - 15);
            };

            // --- PAGE 1: SUMMARY ---
            pdf.setPage(pageNumber);
            yPos = margin;
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(24);
            pdf.text('Expense Report', pageWidth / 2, yPos, { align: 'center' });
            yPos += 30;

            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(12);
            pdf.text(`Report for: ${currentUser?.username || 'N/A'}`, margin, yPos);
            pdf.text(`Period: ${title.replace('Expenses for ', '')}`, pageWidth - margin, yPos, { align: 'right' });
            yPos += 20;
            pdf.text(`Generated on: ${format(new Date(), 'MMMM d, yyyy')}`, pageWidth - margin, yPos, { align: 'right' });

            yPos += 20;
            pdf.setLineWidth(0.5);
            pdf.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 30;

            // Stats Cards
             const stats = [
                { title: `Total Spending`, value: new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.code }).format(totalExpense) },
                { title: "Transactions", value: filteredExpenses.length.toLocaleString() },
                { title: "Avg. Transaction", value: new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.code }).format(filteredExpenses.length > 0 ? totalExpense / filteredExpenses.length : 0) },
                { title: "This Month's Savings", value: new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.code }).format(monthlySurplus) },
            ];
            const cardWidth = (pageWidth - margin * 3) / 2;
            const cardHeight = 60;
            stats.forEach((stat, index) => {
                const x = margin + (index % 2) * (cardWidth + 20);
                const y = yPos + Math.floor(index / 2) * (cardHeight + 20);
                pdf.setFontSize(10);
                pdf.setTextColor(100);
                pdf.text(stat.title, x + 10, y + 20);
                pdf.setFontSize(18);
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(20);
                pdf.text(stat.value, x + 10, y + 45);
                pdf.setFont('helvetica', 'normal');
                pdf.roundedRect(x, y, cardWidth, cardHeight, 5, 5, 'S');
            });
            yPos += Math.ceil(stats.length / 2) * (cardHeight + 20);
            
            // Spending Chart on Page 1
            const chartElement = chartContainerRef.current;
            if (chartElement && expensesByCategory.length > 0) {
                 const canvas = await html2canvas(chartElement, { scale: 3, backgroundColor: '#ffffff' });
                 const imgData = canvas.toDataURL('image/png');
                 const availableHeight = pageHeight - yPos - margin - 20;
                 const imgHeight = 250;
                 const imgWidth = (canvas.width * imgHeight) / canvas.height;

                 if (imgHeight < availableHeight) {
                    yPos += 20;
                    pdf.setFontSize(16);
                    pdf.setFont('helvetica', 'bold');
                    pdf.text('Spending by Category', pageWidth / 2, yPos, { align: 'center'});
                    yPos += 20;
                    pdf.addImage(imgData, 'PNG', (pageWidth - imgWidth) / 2, yPos, imgWidth, imgHeight);
                 }
            }


            // --- PAGE 2: BUDGETS & AI INSIGHTS ---
            const hasBudgets = budgets.some(b => b.amount > 0);
            if (hasBudgets || aiInsight) {
                 pdf.addPage();
                 pageNumber++;
                 yPos = margin;
            }

            // Budget Summary
            if (hasBudgets) {
                pdf.setFontSize(18);
                pdf.setFont('helvetica', 'bold');
                pdf.text('Budget vs. Actuals Summary', margin, yPos);
                yPos += 30;

                const spendingByCategoryForReport = filteredExpenses.reduce((acc, expense) => {
                    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
                    return acc;
                }, {} as Record<Category, number>);

                const tableHeaderY = yPos;
                pdf.setFontSize(10);
                pdf.setFont('helvetica', 'bold');
                pdf.setFillColor(240, 240, 240);
                pdf.rect(margin, yPos, pageWidth - margin * 2, 20, 'F');
                pdf.text('Category', margin + 5, yPos + 14);
                pdf.text('Budgeted', margin + 200, yPos + 14);
                pdf.text('Spent', margin + 300, yPos + 14);
                pdf.text('Remaining', pageWidth - margin - 5, yPos + 14, { align: 'right' });
                yPos += 25;

                pdf.setFont('helvetica', 'normal');
                let totalBudgeted = 0;
                let totalSpent = 0;

                CATEGORIES.forEach(cat => {
                     const budget = budgets.find(b => b.category === cat)?.amount || 0;
                     if (budget <= 0) return;
                     
                     totalBudgeted += budget;
                     const spent = spendingByCategoryForReport[cat] || 0;
                     totalSpent += spent;
                     const remaining = budget - spent;

                     pdf.text(cat, margin + 5, yPos + 14);
                     pdf.text(new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.code }).format(budget), margin + 200, yPos + 14);
                     pdf.text(new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.code }).format(spent), margin + 300, yPos + 14);
                     
                     pdf.setTextColor(remaining >= 0 ? [0, 100, 0] : [255, 0, 0]);
                     pdf.text(new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.code }).format(remaining), pageWidth - margin - 5, yPos + 14, { align: 'right' });
                     pdf.setTextColor(0);

                     yPos += 20;
                });

                yPos += 5;
                pdf.setLineWidth(0.5);
                pdf.line(margin, yPos, pageWidth - margin, yPos);
                yPos += 5;

                pdf.setFont('helvetica', 'bold');
                const totalRemaining = totalBudgeted - totalSpent;
                pdf.text('Totals', margin + 5, yPos + 14);
                pdf.text(new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.code }).format(totalBudgeted), margin + 200, yPos + 14);
                pdf.text(new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.code }).format(totalSpent), margin + 300, yPos + 14);
                pdf.setTextColor(totalRemaining >= 0 ? [0, 100, 0] : [255, 0, 0]);
                pdf.text(new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.code }).format(totalRemaining), pageWidth - margin - 5, yPos + 14, { align: 'right' });
                pdf.setTextColor(0);

                yPos += 30;
            }


            if (aiInsight && !isAIInsightLoading) {
                if(yPos > margin) { // Add divider if budgets were shown
                    pdf.setLineWidth(0.5);
                    pdf.line(margin, yPos, pageWidth - margin, yPos);
                    yPos += 30;
                }
                
                pdf.setFontSize(16);
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(20);
                pdf.text('AI Financial Assistant', margin, yPos);
                yPos += 20;

                pdf.setFontSize(10);
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(50);
                const lines = aiInsight.split('\n').filter(line => line.trim() !== '');
                lines.forEach(line => {
                    const maxWidth = pageWidth - margin * 2;
                    let textToAdd = line;
                    let isBold = false;

                    if (line.startsWith('### ') || line.startsWith('## ')) {
                        isBold = true;
                        textToAdd = line.replace(/### |## /g, '');
                    }
                     if (line.startsWith('* ')) {
                        textToAdd = '• ' + line.substring(2);
                    }
                    
                    if (isBold) pdf.setFont('helvetica', 'bold');

                    const splitLines = pdf.splitTextToSize(textToAdd, maxWidth);
                    const requiredHeight = splitLines.length * 12 + 5;
                    if (yPos + requiredHeight > pageHeight - margin) {
                        pdf.addPage(); pageNumber++; yPos = margin;
                    }
                    pdf.text(splitLines, margin, yPos);
                    yPos += requiredHeight;

                    if (isBold) pdf.setFont('helvetica', 'normal');
                });
            }

            // --- PAGE 3+: TRANSACTIONS ---
            if (filteredExpenses.length > 0) {
                pdf.addPage();
                pageNumber++;
                yPos = margin;

                const drawPageHeader = () => {
                    pdf.setFontSize(18);
                    pdf.setFont('helvetica', 'bold');
                    pdf.text('Detailed Transactions', margin, yPos);
                    yPos += 30;
                };

                const drawTableHeader = () => {
                    pdf.setFontSize(10);
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFillColor(240, 240, 240);
                    pdf.rect(margin, yPos, pageWidth - margin * 2, 20, 'F');
                    pdf.text('Date', margin + 5, yPos + 14);
                    pdf.text('Title', margin + 100, yPos + 14);
                    pdf.text('Category', margin + 300, yPos + 14);
                    pdf.text('Amount', pageWidth - margin - 5, yPos + 14, { align: 'right' });
                    yPos += 25;
                };

                drawPageHeader();
                drawTableHeader();

                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(10);
                filteredExpenses.forEach(expense => {
                    if (yPos > pageHeight - margin - 40) { // reserve space for footer and total
                        pdf.addPage();
                        pageNumber++;
                        yPos = margin;
                        drawPageHeader();
                        drawTableHeader();
                        pdf.setFont('helvetica', 'normal');
                        pdf.setFontSize(10);
                    }
                    const dateStr = format(parseISO(expense.date), 'MMM d, yyyy');
                    const amountStr = new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.code }).format(expense.amount);

                    pdf.text(dateStr, margin + 5, yPos + 14);
                    pdf.text(expense.title, margin + 100, yPos + 14, { maxWidth: 190 });
                    pdf.text(expense.category, margin + 300, yPos + 14);
                    pdf.text(amountStr, pageWidth - margin - 5, yPos + 14, { align: 'right' });
                    
                    yPos += 20;
                    pdf.setLineWidth(0.2);
                    pdf.line(margin, yPos, pageWidth - margin, yPos);
                    yPos += 5;
                });

                // Add Total Row
                yPos += 10;
                pdf.setLineWidth(0.5);
                pdf.line(margin, yPos, pageWidth - margin, yPos);
                yPos += 5;

                pdf.setFont('helvetica', 'bold');
                const totalAmountStr = new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.code }).format(totalExpense);
                pdf.text('Total', pageWidth - margin - 150, yPos + 14, { align: 'right' });
                pdf.text(totalAmountStr, pageWidth - margin - 5, yPos + 14, { align: 'right' });

            }

            // --- Add Page Numbers ---
            const pageCount = pdf.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                addPageHeaderAndFooter(i, pageCount);
            }

            pdf.save(`report-${format(currentDate, 'yyyy-MM')}.pdf`);
        } catch (error) {
            console.error("Failed to generate PDF report:", error);
            alert("Sorry, there was an error generating the PDF report. Please try again.");
        } finally {
            setIsGeneratingReport(false);
        }
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
                         <div ref={chartContainerRef}>
                            <ExpenseChart data={expensesByCategory} currency={currency} />
                        </div>
                    )}
                     {activeTab === 'trends' && (
                        <SpendingTrendsChart allExpenses={expenses} currency={currency} />
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
        </div>
    );
};