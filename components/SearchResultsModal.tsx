

import React from 'react';
import { Task, Suggestion, Priority } from '../types';
import { formatDate, getTaskEndTime } from '../utils/dateUtils';

const priorityStyles: Record<Priority, { bg: string, text: string, border: string }> = {
    [Priority.High]: { bg: 'bg-red-500/20', text: 'text-red-300', border: 'border-red-500/30' },
    [Priority.Medium]: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', border: 'border-yellow-500/30' },
    [Priority.Low]: { bg: 'bg-green-500/20', text: 'text-green-300', border: 'border-green-500/30' },
};

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
);

// Type guard to check if an item is a Task
function isTask(item: Task | Suggestion): item is Task {
    return (item as Task).priority !== undefined;
}

const SearchResultItem: React.FC<{ item: Task | Suggestion; onEditTask: (task: Task) => void; }> = ({ item, onEditTask }) => {
    if (isTask(item)) {
        // Render Task
        const styles = priorityStyles[item.priority];
        return (
            <div 
                className={`p-3 rounded-lg flex justify-between items-start border ${styles.bg} ${styles.border} hover:border-teal-500 cursor-pointer transition-colors`}
                onClick={() => onEditTask(item)}
            >
                <div>
                    <p className={`font-semibold text-sm ${styles.text}`}>{item.title}</p>
                    {item.startTime ? (
                        <p className="text-xs text-slate-400">
                            {formatDate(new Date(item.startTime), 'eee, MMM d, yyyy HH:mm')} - {formatDate(getTaskEndTime(item), 'HH:mm')}
                        </p>
                    ) : (
                        <p className="text-xs text-slate-400">Unscheduled Task</p>
                    )}
                </div>
                <div className="text-right text-xs flex-shrink-0 ml-4">
                    <p className={`font-medium ${styles.text}`}>{item.priority}</p>
                    <p className="text-slate-500">{item.duration} min</p>
                </div>
            </div>
        );
    } else {
        // Render Suggestion
        return (
            <div className="p-3 rounded-lg bg-slate-700/50 flex justify-between items-start border border-slate-700">
                 <div>
                    <p className="font-semibold text-sm text-teal-300 capitalize">{item.type.replace('_', ' ')}</p>
                    <p className="text-sm text-white">{item.title}</p>
                    <p className="text-xs text-slate-400">{item.details}</p>
                </div>
                {item.duration && <p className="text-slate-500 text-xs flex-shrink-0 ml-4">{item.duration} min</p>}
            </div>
        );
    }
};

interface SearchResultsModalProps {
    query: string;
    results: (Task | Suggestion)[];
    isLoading: boolean;
    error: string | null;
    onClose: () => void;
    onEditTask: (task: Task) => void;
}

export const SearchResultsModal: React.FC<SearchResultsModalProps> = ({ query, results, isLoading, error, onClose, onEditTask }) => {
    return (
        <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4 pt-20">
            <div className="bg-slate-800/80 backdrop-blur-xl p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-slate-700">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-xl font-bold text-white truncate pr-4">Search: <span className="text-teal-400">"{query}"</span></h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <CloseIcon />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                    {isLoading && (
                        <div className="text-center text-slate-400 p-8 flex flex-col items-center">
                            <div className="w-8 h-8 border-4 border-teal-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p>Searching with AI...</p>
                        </div>
                    )}
                    {error && (
                        <div className="p-4 rounded-md bg-red-500/20 text-red-300 text-sm">
                            <p className="font-bold">Search Failed</p>
                            <p>{error}</p>
                        </div>
                    )}
                    {!isLoading && !error && results.length === 0 && (
                        <div className="text-center text-slate-400 p-8">
                            <p>No results found.</p>
                            <p className="text-xs">Try a different or more general search query.</p>
                        </div>
                    )}
                    {!isLoading && !error && results.length > 0 && (
                        results.map((item, index) => <SearchResultItem key={`${item.id}-${index}`} item={item} onEditTask={onEditTask} />)
                    )}
                </div>
            </div>
        </div>
    );
};