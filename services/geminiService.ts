import { GoogleGenAI, Type } from "@google/genai";
import type { Expense, Currency, Budget, Goal } from "../types";
import { Category } from "../types";
import { CATEGORIES } from "../constants";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    console.warn("API_KEY environment variable not set. AI features will not work.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const generateInsights = async (expenses: Expense[], timePeriod: string, currency: Currency): Promise<string> => {
    if (!API_KEY) {
        return Promise.resolve("AI features are disabled because the API key is not configured.");
    }
    
    if (expenses.length === 0) {
        return Promise.resolve(`You have no expenses logged for this ${timePeriod.toLowerCase()}. Add some expenses to get AI-powered insights!`);
    }

    const prompt = `
        You are a friendly and insightful financial assistant. 
        The user's currency is ${currency.name} (${currency.code}). When you mention any monetary values, please use the symbol: ${currency.symbol}.
        Based on the following expense data for the last ${timePeriod}, provide a brief summary of spending habits and offer 3 actionable, personalized tips for saving money. 
        Format your response in Markdown. Use headings for the summary and tips. Use bullet points for the tips. Keep the tone encouraging and helpful.

        Expense Data (JSON):
        ${JSON.stringify(expenses, null, 2)}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to generate insights from Gemini API.");
    }
};

interface ScannedExpense {
    title: string;
    amount: number;
    date: string; // YYYY-MM-DD
    category: Category;
}

export const scanReceipt = async (base64ImageDataWithPrefix: string): Promise<ScannedExpense> => {
    if (!API_KEY) {
        throw new Error("AI features are disabled because the API key is not configured.");
    }

    const parts = base64ImageDataWithPrefix.split(';base64,');
    if (parts.length !== 2) {
        throw new Error("Invalid base64 image data format.");
    }
    const mimeType = parts[0].split(':')[1];
    const base64ImageData = parts[1];

    const imagePart = {
        inlineData: {
            mimeType,
            data: base64ImageData,
        },
    };

    const textPart = {
        text: `Analyze this receipt image. Extract the following information:
        1.  The merchant or store name to be used as the expense title.
        2.  The final total amount of the transaction.
        3.  The date of the transaction in YYYY-MM-DD format. If the year is not present, assume the current year.
        4.  A suggested expense category from the following list: ${CATEGORIES.join(', ')}.
        
        Provide the output in JSON format according to the provided schema. If a value cannot be determined, use a sensible default (e.g., "Scanned Expense" for title, 0 for amount, today's date, or "Other" for category).`
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [imagePart, textPart] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        amount: { type: Type.NUMBER },
                        date: { type: Type.STRING, description: "Date in YYYY-MM-DD format" },
                        category: { type: Type.STRING, enum: CATEGORIES },
                    },
                    required: ["title", "amount", "date", "category"],
                },
            },
        });
        
        const parsedResponse = JSON.parse(response.text);

        // Validate the category
        if (!CATEGORIES.includes(parsedResponse.category)) {
            parsedResponse.category = Category.Other;
        }

        return parsedResponse;

    } catch (error) {
        console.error("Error calling Gemini API for receipt scanning:", error);
        throw new Error("Failed to scan receipt. The image might be unclear or the format is not supported.");
    }
};

export const getChatResponse = async (
    question: string,
    expenses: Expense[],
    budgets: Budget[],
    currency: Currency
): Promise<string> => {
    if (!API_KEY) {
        return Promise.resolve("AI features are disabled because the API key is not configured.");
    }

    if (expenses.length === 0 && budgets.length === 0) {
        return "I don't have any data to analyze yet. Please add some expenses or set some budgets first.";
    }

    const prompt = `
        You are a helpful and friendly AI Financial Assistant. Your name is 'Pro AI'.
        Your personality is professional, yet encouraging.
        Your task is to answer the user's questions based ONLY on the JSON data provided below. Do not make up any information.
        If the user asks a question you cannot answer with the given data, politely state that you don't have that information.
        
        Data Context:
        - The user's currency is ${currency.name} (${currency.code}). Use the symbol "${currency.symbol}" for all monetary values.
        - Expense Data for the user's selected time period: ${JSON.stringify(expenses, null, 2)}
        - Budget Data for the current month: ${JSON.stringify(budgets, null, 2)}

        ---
        User's Question: "${question}"
        ---

        Your Answer:
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
             config: {
                systemInstruction: `You are a helpful and friendly AI Financial Assistant named 'Pro AI'.
                Your personality is professional, yet encouraging.
                Your task is to answer the user's questions based ONLY on the JSON data provided in the user's prompt. Do not make up any information.
                If the user asks a question you cannot answer with the given data, politely state that you don't have that information.`,
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API for chat:", error);
        throw new Error("Failed to get a response from the AI assistant.");
    }
};

export const suggestBudgets = async (expenses: Expense[], currency: Currency): Promise<Budget[]> => {
    if (!API_KEY) {
        throw new Error("AI features are disabled because the API key is not configured.");
    }
     if (expenses.length === 0) {
        return CATEGORIES.map(cat => ({ category: cat, amount: 0 }));
    }

    const prompt = `
        Based on the user's expense history provided below, suggest a reasonable monthly budget for each category.
        The user's currency is ${currency.name} (${currency.code}).
        Analyze their spending patterns and suggest a budget that is slightly challenging but achievable.
        Round the suggested budget amounts to a sensible number (e.g., nearest 10 or 50).
        Provide the output as a JSON object that strictly follows the provided schema.

        Expense History (JSON):
        ${JSON.stringify(expenses, null, 2)}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        budgets: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    category: { type: Type.STRING, enum: CATEGORIES },
                                    amount: { type: Type.NUMBER }
                                },
                                required: ["category", "amount"]
                            }
                        }
                    },
                    required: ["budgets"]
                }
            }
        });
        
        const result = JSON.parse(response.text);
        // Ensure all categories are present, even if AI omits them
        const suggestedBudgets = result.budgets as Budget[];
        const budgetMap = new Map(suggestedBudgets.map(b => [b.category, b]));
        const fullBudget = CATEGORIES.map(cat => budgetMap.get(cat) || { category: cat, amount: 0 });
        
        return fullBudget;

    } catch (error) {
        console.error("Error calling Gemini API for budget suggestion:", error);
        throw new Error("Failed to suggest budgets.");
    }
};


export const generateGoalPlan = async (goalTitle: string, goalAmount: number, expenses: Expense[], currency: Currency): Promise<string> => {
    if (!API_KEY) {
        return Promise.resolve("AI features are disabled because the API key is not configured.");
    }
    
    const prompt = `
        You are an expert financial coach. A user wants to save for a goal: "${goalTitle}" with a target of ${currency.symbol}${goalAmount}.
        Based on their recent spending habits (JSON below), create a short, encouraging, and actionable plan for them.

        Your plan should:
        1.  Start with a positive, encouraging sentence.
        2.  Identify 2-3 specific spending categories where they could realistically cut back.
        3.  Suggest a specific, reasonable amount to reduce spending by in each of those categories per month.
        4.  Estimate how long it would take to reach their goal with these changes.
        5.  Keep the entire response to 3-4 sentences. Format it as a single paragraph of Markdown text.

        Expense Data (JSON):
        ${JSON.stringify(expenses, null, 2)}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API for goal plan:", error);
        throw new Error("Failed to generate a goal plan.");
    }
};