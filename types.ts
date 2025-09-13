export enum Category {
    Food = 'Food',
    Transport = 'Transport',
    Housing = 'Housing',
    Utilities = 'Utilities',
    Entertainment = 'Entertainment',
    Health = 'Health',
    Shopping = 'Shopping',
    Other = 'Other'
}

export interface Expense {
    id: string;
    title: string;
    amount: number;
    category: Category;
    date: string; // ISO string format: YYYY-MM-DD
}

export enum TimeView {
    Daily = 'Daily',
    Weekly = 'Weekly',
    Monthly = 'Monthly',
    Yearly = 'Yearly'
}

export interface User {
    id: string;
    username: string;
    password?: string; // Only used for storage, not passed around
}

export interface Budget {
    category: Category;
    amount: number;
}

export interface Currency {
    code: string;
    name: string;
    symbol: string;
}

export interface Goal {
    id: string;
    title: string;
    targetAmount: number;
    aiPlan?: string;
}

export interface BackupData {
    expenses: Expense[];
    budgets: Budget[];
    goals: Goal[];
}
