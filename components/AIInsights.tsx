
import React from 'react';
import { SparklesIcon } from './Icons';

interface AIInsightsProps {
    onGenerate: () => void;
    insight: string | null;
    isLoading: boolean;
}

export const AIInsights: React.FC<AIInsightsProps> = ({ onGenerate, insight, isLoading }) => {
    const formattedInsight = insight?.replace(/### (.*?)\n/g, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
                                     .replace(/## (.*?)\n/g, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>')
                                     .replace(/\* (.*?)\n/g, '<li class="ml-5 list-disc">$1</li>');

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">AI Financial Assistant</h2>
                <SparklesIcon className="w-6 h-6 text-primary-500" />
            </div>
            
            <div className="flex-grow bg-slate-100 rounded-lg p-4 text-sm text-slate-700 overflow-y-auto min-h-[200px]">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        <p className="ml-3">Generating your insights...</p>
                    </div>
                ) : insight ? (
                    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: formattedInsight || '' }} />
                ) : (
                    <p className="text-center text-slate-500 self-center h-full flex items-center justify-center">Click the button below to get personalized financial insights for the selected period.</p>
                )}
            </div>
            
            <button
                onClick={onGenerate}
                disabled={isLoading}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all disabled:bg-primary-300 disabled:cursor-not-allowed"
            >
                {isLoading ? 'Analyzing...' : 'Get AI Insights'}
            </button>
        </div>
    );
};
