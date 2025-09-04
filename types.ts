
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
