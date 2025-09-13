import React, { useState, useRef, useEffect } from 'react';
import type { Expense, Budget, Currency } from '../types';
import { getChatResponse } from '../services/geminiService';
import { SparklesIcon, SendIcon, UserIcon } from './Icons';

interface AIChatProps {
    expenses: Expense[];
    budgets: Budget[];
    currency: Currency;
}

interface Message {
    sender: 'user' | 'ai';
    text: string;
}

const AITypingIndicator: React.FC = () => (
    <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
    </div>
);

export const AIChat: React.FC<AIChatProps> = ({ expenses, budgets, currency }) => {
    const [messages, setMessages] = useState<Message[]>([
        { sender: 'ai', text: "Hello! I'm your AI Financial Assistant. Ask me anything about your spending for the selected period." }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const aiResponse = await getChatResponse(input, expenses, budgets, currency);
            const aiMessage: Message = { sender: 'ai', text: aiResponse };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            const errorMessage: Message = { sender: 'ai', text: "Sorry, I'm having trouble connecting right now. Please try again later." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <div className="flex items-center mb-4">
                <h2 className="text-xl font-bold">AI Financial Chat</h2>
                <SparklesIcon className="w-6 h-6 text-primary-500 ml-2" />
            </div>
            <div className="bg-slate-50 rounded-lg border border-slate-200 h-80 flex flex-col p-4">
                <div ref={chatContainerRef} className="flex-grow space-y-4 overflow-y-auto pr-2">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                            {msg.sender === 'ai' && (
                                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                                    <SparklesIcon className="w-5 h-5 text-primary-600" />
                                </div>
                            )}
                            <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-primary-600 text-white rounded-br-none' : 'bg-slate-200 text-slate-800 rounded-bl-none'}`}>
                                <p className="text-sm">{msg.text}</p>
                            </div>
                             {msg.sender === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                                    <UserIcon className="w-5 h-5 text-slate-600" />
                                </div>
                            )}
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex items-start gap-3">
                             <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                                <SparklesIcon className="w-5 h-5 text-primary-600" />
                            </div>
                            <div className="max-w-xs md:max-w-md p-3 rounded-2xl bg-slate-200 text-slate-800 rounded-bl-none">
                                <AITypingIndicator />
                            </div>
                        </div>
                    )}
                </div>
                <form onSubmit={handleSend} className="mt-4 flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Ask about your finances..."
                        disabled={isLoading}
                        className="flex-grow px-4 py-2 bg-white border border-slate-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                    />
                    <button type="submit" disabled={isLoading || !input.trim()} className="bg-primary-600 text-white rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 shadow-md hover:bg-primary-700 disabled:bg-primary-300 disabled:cursor-not-allowed transition-all">
                        <SendIcon className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
};
