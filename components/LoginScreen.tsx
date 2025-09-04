import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export const LoginScreen: React.FC = () => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const auth = useContext(AuthContext);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!username) {
            setError('Username is required.');
            return;
        }

        let success = false;
        try {
            if (isLoginView) {
                success = await auth!.login(username, password);
                if (!success) setError('Invalid username or password.');
            } else {
                success = await auth!.signup(username, password);
                if (!success) setError('Username already exists.');
            }
        } catch (err) {
            setError('An unexpected error occurred.');
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen flex items-center justify-center font-sans p-4">
            <div className="w-full max-w-sm">
                <div className="bg-white rounded-xl shadow-2xl p-8">
                    <h1 className="text-3xl font-bold text-primary-700 text-center mb-2">AI Expense Tracker Pro</h1>
                    <p className="text-center text-slate-500 mb-8">{isLoginView ? 'Welcome back!' : 'Create your account'}</p>
                    
                    {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-center">{error}</p>}
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-slate-600">Username</label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                placeholder="Enter your username"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-600">Password (Optional)</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                placeholder="Enter your password"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-3 px-4 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                            {isLoginView ? 'Login' : 'Sign Up'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-slate-500 mt-8">
                        {isLoginView ? "Don't have an account?" : "Already have an account?"}
                        <button onClick={() => { setIsLoginView(!isLoginView); setError(''); }} className="font-semibold text-primary-600 hover:text-primary-700 ml-1">
                            {isLoginView ? 'Sign Up' : 'Login'}
                        </button>
                    </p>
                </div>
                <footer className="py-4 text-center text-sm text-slate-500 mt-4">
                    Powered by Aqeel Serani Digital Agency
                </footer>
            </div>
        </div>
    );
};