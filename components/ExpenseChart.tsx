
import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { CATEGORY_DETAILS } from '../constants';
import { Category } from '../types';

interface ExpenseChartProps {
    data: { name: string; value: number }[];
}

const COLORS = Object.values(CATEGORY_DETAILS).map(c => c.color.replace('bg-', '#').replace('-500', ''));


export const ExpenseChart: React.FC<ExpenseChartProps> = ({ data }) => {
    const chartData = data.map(item => {
        const categoryKey = item.name as Category;
        const colorClass = CATEGORY_DETAILS[categoryKey]?.color || 'bg-gray-500';
        const hexColor = colorClass.replace('bg-', '#').replace('-500', '');
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
                    <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};
