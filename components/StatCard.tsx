import React from 'react';
import type { Currency } from '../types';

interface StatCardProps {
    title: string;
    value: number;
    currency: Currency;
    isCurrency?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, currency, isCurrency = true }) => {
    const formattedValue = isCurrency
        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.code }).format(value)
        : value.toLocaleString();

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col justify-between">
            <h3 className="text-slate-500 font-medium">{title}</h3>
            <p className="text-3xl font-bold text-slate-800 mt-2">{formattedValue}</p>
        </div>
    );
};