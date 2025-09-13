import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { CATEGORY_DETAILS } from '../constants';
import { Category, Currency } from '../types';

interface ExpenseChartProps {
    data: { name: string; value: number }[];
    currency: Currency;
}

export const ExpenseChart: React.FC<ExpenseChartProps> = ({ data, currency }) => {
    const chartData = data.map(item => {
        const categoryKey = item.name as Category;
        const hexColor = CATEGORY_DETAILS[categoryKey]?.hexColor || '#6b7280'; // Default to gray
        return { ...item, color: hexColor };
    });
    
    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-500">
                <p>No expense data to display for this period.</p>
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={110}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.code }).format(value)} />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};