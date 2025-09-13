import React from 'react';
import type { Currency } from '../types';

interface StatCardProps {
    title: string;
    value: number;
    currency: Currency;
    isCurrency?: boolean;
    tooltip?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, currency, isCurrency = true, tooltip }) => {
    const formattedValue = isCurrency
        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.code }).format(value)
        : value.toLocaleString();

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col justify-between">
            <div className="flex items-center gap-2">
                 <h3 className="text-slate-500 font-medium">{title}</h3>
                 {tooltip && (
                    <div className="group relative">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="absolute bottom-full mb-2 w-48 bg-slate-700 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            {tooltip}
                        </span>
                    </div>
                )}
            </div>
            <p className="text-3xl font-bold text-slate-800 mt-2">{formattedValue}</p>
        </div>
    );
};