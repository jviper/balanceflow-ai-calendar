

import React, { useState } from 'react';

const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
);


interface SearchPanelProps {
    onSearch: (query: string) => void;
    isLoading: boolean;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({ onSearch, isLoading }) => {
    const [query, setQuery] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || isLoading) return;
        onSearch(query);
    };

    return (
        <div className="p-4 bg-slate-800/70 backdrop-blur-lg rounded-lg shadow-lg border border-slate-700/50">
            <h2 className="font-bold mb-2 text-white">Search Calendar</h2>
            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., meetings last week"
                    className="flex-grow p-2 bg-slate-700/80 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    className="p-2 bg-teal-500 text-white font-bold rounded-md hover:bg-teal-600 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center w-10 h-10"
                    disabled={isLoading || !query.trim()}
                    aria-label="Search"
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <SearchIcon className="w-5 h-5" />
                    )}
                </button>
            </form>
        </div>
    );
};