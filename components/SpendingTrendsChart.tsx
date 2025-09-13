import React, { useMemo } from 'react';
import type { Expense, Currency } from '../types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { format, isAfter } from 'date-fns';
import subMonths from 'date-fns/subMonths';
import startOfMonth from 'date-fns/startOfMonth';
import parseISO from 'date-fns/parseISO';
import { TrendingUpIcon } from './Icons';

interface SpendingTrendsChartProps {
    allExpenses: Expense[];
    currency: Currency;
}

export const SpendingTrendsChart: React.FC<SpendingTrendsChartProps> = ({ allExpenses, currency }) => {
    const chartData = useMemo(() => {
        const data: { [key: string]: number } = {};
        const monthLabels: string[] = [];
        const now = new Date();

        // Initialize last 6 months
        for (let i = 5; i >= 0; i--) {
            const date = subMonths(now, i);
            const monthKey = format(date, 'yyyy-MM');
            const monthLabel = format(date, 'MMM yy');
            data[monthKey] = 0;
            if (!monthLabels.includes(monthLabel)) {
                monthLabels.push(monthLabel);
            }
        }

        const sixMonthsAgo = startOfMonth(subMonths(now, 5));

        allExpenses.forEach(expense => {
            const expenseDate = parseISO(expense.date);
            if (isAfter(expenseDate, sixMonthsAgo)) {
                const monthKey = format(expenseDate, 'yyyy-MM');
                if (data.hasOwnProperty(monthKey)) {
                    data[monthKey] += expense.amount;
                }
            }
        });

        return monthLabels.map(label => {
            const yearMonth = Object.keys(data).find(key => format(parseISO(key), 'MMM yy') === label);
            return {
                name: label,
                Spending: data[yearMonth!] || 0,
            };
        });

    }, [allExpenses]);

    const hasData = useMemo(() => chartData.some(d => d.Spending > 0), [chartData]);


    return (
        <div>
            <div className="flex items-center mb-4">
                <h2 className="text-xl font-bold">Spending Trends</h2>
                 <TrendingUpIcon className="w-6 h-6 text-primary-500 ml-2" />
            </div>

            {hasData ? (
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <LineChart
                            data={chartData}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={(value) => currency.symbol + value} />
                            <Tooltip formatter={(value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.code }).format(value)} />
                            <Legend />
                            <Line type="monotone" dataKey="Spending" stroke="#0284c7" strokeWidth={2} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                 <div className="flex items-center justify-center h-64 text-slate-500">
                    <p>Not enough data for spending trends. Keep adding expenses to see your trends over time!</p>
                </div>
            )}
        </div>
    );
};
