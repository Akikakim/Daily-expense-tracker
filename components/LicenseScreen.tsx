import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export const LicenseScreen: React.FC = () => {
    const [licenseKey, setLicenseKey] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const auth = useContext(AuthContext);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!licenseKey) {
            setError('License key is required.');
            return;
        }
        setIsLoading(true);

        try {
            const success = await auth!.activateLicense(licenseKey);
            if (!success) {
                setError('Invalid or incorrect license key.');
            }
        } catch (err) {
            setError('An unexpected error occurred during activation.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen flex items-center justify-center font-sans p-4">
            <div className="w-full max-w-sm">
                <div className="bg-white rounded-xl shadow-2xl p-8">
                    <h1 className="text-3xl font-bold text-primary-700 text-center mb-2">AI Expense Tracker Pro</h1>
                    <p className="text-center text-slate-500 mb-8">Activate Your Software</p>
                    
                    {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-center">{error}</p>}
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="licenseKey" className="block text-sm font-medium text-slate-600">License Key</label>
                            <input
                                type="text"
                                id="licenseKey"
                                value={licenseKey}
                                onChange={e => setLicenseKey(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                placeholder="Enter your license key"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 px-4 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-300"
                        >
                            {isLoading ? 'Activating...' : 'Activate'}
                        </button>
                    </form>
                </div>
                <footer className="py-4 text-center text-sm text-slate-500 mt-4">
                    Powered by Aqeel Serani Digital Agency
                </footer>
            </div>
        </div>
    );
};
