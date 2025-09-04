
import React from 'react';

interface StatCardProps {
    title: string;
    value: number;
    isCurrency?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, isCurrency = true }) => {
    const formattedValue = isCurrency
        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
        : value.toLocaleString();

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col justify-between">
            <h3 className="text-slate-500 font-medium">{title}</h3>
            <p className="text-3xl font-bold text-slate-800 mt-2">{formattedValue}</p>
        </div>
    );
};
