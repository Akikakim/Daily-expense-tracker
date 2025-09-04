import { GoogleGenAI } from "@google/genai";
import type { Expense, Currency } from "../types";

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