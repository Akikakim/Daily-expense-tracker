import React, { useState, useMemo, useContext, useRef } from 'react';
import type { Expense, Goal } from '../types';
import { TimeView, Category } from '../types';
import { StatCard } from './StatCard';
import { ExpenseChart } from './ExpenseChart';
import { ExpenseList } from './ExpenseList';
import { AIInsights } from './AIInsights';
import { Budgets } from './Budgets';
// FIX: Removed 'startOfMonth' which is not an exported member of 'date-fns' in this context and was unused.
import { isSameDay, isSameWeek, isSameMonth, isSameYear, format, endOfWeek, getDaysInMonth } from 'date-fns';
import startOfWeek from 'date-fns/startOfWeek';
import parseISO from 'date-fns/parseISO';
import { AuthContext } from '../contexts/AuthContext';
import { CATEGORIES } from '../constants';
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
}

export const Dashboard: React.FC<DashboardProps> = ({ expenses, onEditExpense, onDeleteExpense, getAIInsights, aiInsight, isAIInsightLoading }) => {
    const [timeView, setTimeView] = useState<TimeView>(TimeView.Monthly);
    const { currency, currentUser } = useContext(AuthContext);
    const { budgets } = useBudgets();
    const { goals, addGoal, deleteGoal } = useGoals();
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<Category | 'All'>('All');
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);

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
    
    const monthlyExpenses = useMemo(() => expenses.filter(e => isSameMonth(parseISO(e.date), new Date())), [expenses]);
    
    const { monthlyForecast, monthlySurplus } = useMemo(() => {
        const now = new Date();
        const totalSpentThisMonth = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const dayOfMonth = now.getDate();
        const daysInMonth = getDaysInMonth(now);
        const avgDailySpend = totalSpentThisMonth / dayOfMonth;
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
    
    const handleGetAIInsights = () => getAIInsights(filteredExpenses, timeView);

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
        link.setAttribute("download", `expenses-${timeView}-${new Date().toISOString().split('T')[0]}.csv`);
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
            let yPos = margin;

            // --- TITLE PAGE ---
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(24);
            pdf.text('Expense Report', pageWidth / 2, yPos, { align: 'center' });
            yPos += 30;

            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(12);
            pdf.text(`Report for: ${currentUser?.username || 'N/A'}`, margin, yPos);
            pdf.text(`Period: ${title}`, pageWidth - margin, yPos, { align: 'right' });
            yPos += 20;
            pdf.text(`Generated on: ${format(new Date(), 'MMMM d, yyyy')}`, pageWidth - margin, yPos, { align: 'right' });

            yPos += 20;
            pdf.setLineWidth(0.5);
            pdf.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 30;

            const stats = [
                { title: `Total Spending`, value: new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.code }).format(totalExpense) },
                { title: "Transactions", value: filteredExpenses.length.toLocaleString() },
                { title: "Avg. Transaction", value: new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.code }).format(filteredExpenses.length > 0 ? totalExpense / filteredExpenses.length : 0) }
            ];
            const cardWidth = (pageWidth - margin * 2 - 20) / 3;
            stats.forEach((stat, index) => {
                const x = margin + index * (cardWidth + 10);
                pdf.setFontSize(10);
                pdf.setTextColor(100);
                pdf.text(stat.title, x + 10, yPos + 15);
                pdf.setFontSize(18);
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(20);
                pdf.text(stat.value, x + 10, yPos + 40);
                pdf.setFont('helvetica', 'normal');
                pdf.roundedRect(x, yPos, cardWidth, 55, 5, 5, 'S');
            });
            yPos += 75;

            const chartElement = chartContainerRef.current;
            if (chartElement && expensesByCategory.length > 0) {
                const canvas = await html2canvas(chartElement.querySelector('.recharts-wrapper')!, { scale: 3, backgroundColor: '#ffffff' });
                const imgData = canvas.toDataURL('image/png');
                const imgWidth = 250;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;

                const aiInsightsTextWidth = pageWidth - margin * 2 - imgWidth - 20;
                let insightsHeight = 0;

                 if (aiInsight && !isAIInsightLoading) {
                    pdf.setFontSize(10);
                    const lines = pdf.splitTextToSize(aiInsight.replace(/### |## |\* /g, ''), aiInsightsTextWidth);
                    insightsHeight = lines.length * 12 + 40; // Approximate height
                }
                
                if (yPos + Math.max(imgHeight, insightsHeight) > pageHeight - margin) {
                    pdf.addPage();
                    yPos = margin;
                }

                pdf.setFontSize(16);
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(20);
                pdf.text('Spending by Category', margin, yPos);
                pdf.addImage(imgData, 'PNG', margin, yPos + 15, imgWidth, imgHeight);

                if (aiInsight && !isAIInsightLoading) {
                     pdf.text('AI Financial Assistant', margin + imgWidth + 20, yPos);
                     pdf.setFontSize(10);
                     pdf.setFont('helvetica', 'normal');
                     pdf.setTextColor(50);
                     const lines = aiInsight.split('\n').filter(line => line.trim() !== '');
                     let insightY = yPos + 30;
                     lines.forEach(line => {
                         if (line.startsWith('### ') || line.startsWith('## ')) {
                             pdf.setFont('helvetica', 'bold');
                             pdf.text(line.replace(/### |## /g, ''), margin + imgWidth + 20, insightY, { maxWidth: aiInsightsTextWidth });
                             pdf.setFont('helvetica', 'normal');
                             insightY += 15;
                         } else if (line.startsWith('* ')) {
                              pdf.text(`• ${line.substring(2)}`, margin + imgWidth + 20 + 10, insightY, { maxWidth: aiInsightsTextWidth - 10 });
                               insightY += 15;
                         } else {
                             const splitLines = pdf.splitTextToSize(line, aiInsightsTextWidth);
                             pdf.text(splitLines, margin + imgWidth + 20, insightY);
                             insightY += splitLines.length * 12;
                         }
                     });
                }
                 yPos += Math.max(imgHeight, insightsHeight) + 30;
            }

            if (filteredExpenses.length > 0) {
                pdf.addPage();
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
                    if (yPos > pageHeight - margin - 20) {
                        pdf.addPage();
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
            }

            const pageCount = pdf.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                pdf.setPage(i);
                pdf.setFontSize(8);
                pdf.setTextColor(150);
                pdf.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 15, { align: 'right' });
                pdf.text('Powered by Aqeel Serani Digital Agency', margin, pageHeight - 15);
            }

            pdf.save(`report-${timeView}-${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error("Failed to generate PDF report:", error);
            // You could show an error to the user here
        } finally {
            setIsGeneratingReport(false);
        }
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title={`Total ${timeView} Spending`} value={totalExpense} currency={currency} />
                <StatCard title="This Month's Savings" value={monthlySurplus} currency={currency} tooltip="Amount you are under budget so far this month." />
                <StatCard title="Monthly Forecast" value={monthlyForecast} currency={currency} tooltip="Projected spending for this month based on your current rate." />
                <StatCard title="Transactions" value={filteredExpenses.length} isCurrency={false} currency={currency} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div ref={chartContainerRef} className="lg:col-span-3 bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-bold mb-4">Spending by Category</h2>
                    <ExpenseChart data={expensesByCategory} currency={currency} />
                </div>
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
                    <AIInsights onGenerate={handleGetAIInsights} insight={aiInsight} isLoading={isAIInsightLoading} />
                </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <SpendingTrendsChart allExpenses={expenses} currency={currency} />
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
