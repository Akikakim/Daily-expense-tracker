import React from 'react';
// FIX: Changed 'import type' to a regular import to allow using the enum as a value.
import { Category } from './types';
import type { Currency } from './types';
import { FoodIcon, TransportIcon, HousingIcon, UtilitiesIcon, EntertainmentIcon, HealthIcon, ShoppingIcon, OtherIcon } from './components/Icons';

export const CATEGORIES: Category[] = [
    Category.Food,
    Category.Transport,
    Category.Housing,
    Category.Utilities,
    Category.Entertainment,
    Category.Health,
    Category.Shopping,
    Category.Other,
];

export const CATEGORY_DETAILS: Record<Category, { icon: React.FC<React.SVGProps<SVGSVGElement>>; color: string; hexColor: string; }> = {
    [Category.Food]: { icon: FoodIcon, color: 'bg-emerald-500', hexColor: '#10b981' },
    [Category.Transport]: { icon: TransportIcon, color: 'bg-blue-500', hexColor: '#3b82f6' },
    [Category.Housing]: { icon: HousingIcon, color: 'bg-orange-500', hexColor: '#f97316' },
    [Category.Utilities]: { icon: UtilitiesIcon, color: 'bg-yellow-500', hexColor: '#eab308' },
    [Category.Entertainment]: { icon: EntertainmentIcon, color: 'bg-purple-500', hexColor: '#8b5cf6' },
    [Category.Health]: { icon: HealthIcon, color: 'bg-red-500', hexColor: '#ef4444' },
    [Category.Shopping]: { icon: ShoppingIcon, color: 'bg-pink-500', hexColor: '#ec4899' },
    [Category.Other]: { icon: OtherIcon, color: 'bg-gray-500', hexColor: '#6b7280' },
};

export const CURRENCIES: Currency[] = [
    { code: 'USD', name: 'United States Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'GBP', name: 'British Pound Sterling', symbol: '£' },
    { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨' },
];