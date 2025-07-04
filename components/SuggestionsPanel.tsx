
import React, { useState, useEffect } from 'react';
import type { Suggestion } from '../types';
import { getSuggestions } from '../services/api';

const SuggestionItem: React.FC<{ suggestion: Suggestion }> = ({ suggestion }) => {
    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'suggestion', data: suggestion }));
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <div 
            draggable
            onDragStart={handleDragStart}
            className="p-3 bg-slate-700/50 rounded-lg cursor-grab active:cursor-grabbing hover:bg-slate-700 transition-colors"
        >
            <p className="font-semibold text-sm text-white">{suggestion.text}</p>
            <p className="text-xs text-slate-400">{suggestion.category} &middot; {suggestion.duration} min</p>
        </div>
    );
};

export const SuggestionsPanel: React.FC = () => {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSuggestions = async () => {
            setIsLoading(true);
            try {
                const data = await getSuggestions();
                setSuggestions(data);
            } catch (error) {
                console.error("Failed to fetch suggestions:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSuggestions();
    }, []);

    return (
        <div className="p-4 bg-slate-800 rounded-lg shadow-lg flex-1 flex flex-col">
            <h2 className="font-bold mb-3 text-white">AI Suggestions</h2>
            {isLoading ? (
                <div className="text-center text-slate-400">Loading suggestions...</div>
            ) : (
                <div className="space-y-3 overflow-y-auto pr-1">
                    {suggestions.map(s => <SuggestionItem key={s.id} suggestion={s} />)}
                </div>
            )}
        </div>
    );
};
