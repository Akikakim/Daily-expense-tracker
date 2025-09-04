import React from 'react';
// FIX: Changed 'import type' to a regular import to allow using the enum as a value.
import { Category } from './types';
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

export const CATEGORY_DETAILS: Record<Category, { icon: React.FC<React.SVGProps<SVGSVGElement>>; color: string }> = {
    [Category.Food]: { icon: FoodIcon, color: 'bg-emerald-500' },
    [Category.Transport]: { icon: TransportIcon, color: 'bg-blue-500' },
    [Category.Housing]: { icon: HousingIcon, color: 'bg-orange-500' },
    [Category.Utilities]: { icon: UtilitiesIcon, color: 'bg-yellow-500' },
    [Category.Entertainment]: { icon: EntertainmentIcon, color: 'bg-purple-500' },
    [Category.Health]: { icon: HealthIcon, color: 'bg-red-500' },
    [Category.Shopping]: { icon: ShoppingIcon, color: 'bg-pink-500' },
    [Category.Other]: { icon: OtherIcon, color: 'bg-gray-500' },
};