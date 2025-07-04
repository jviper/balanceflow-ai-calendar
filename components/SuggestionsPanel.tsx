import React from 'react';
import type { Suggestion, Task } from '../types';
import { useTasks } from '../context/TasksContext';
import { Priority } from '../types';

const SuggestionItem: React.FC<{ suggestion: Suggestion }> = ({ suggestion }) => {
    
    const { addTasks } = useTasks();

    const handleDragStart = (e: React.DragEvent) => {
        const taskData: Partial<Task> = {
            title: suggestion.title,
            description: suggestion.details,
            duration: suggestion.duration || 30,
            priority: Priority.Medium,
            recurrence: 'none'
        };
        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'suggestion', data: taskData }));
        e.dataTransfer.effectAllowed = 'copy';
    };

    const handleAddClick = () => {
         const newTask: Task = {
            id: crypto.randomUUID(),
            title: suggestion.title,
            description: suggestion.details,
            startTime: null, // Add as unscheduled
            duration: suggestion.duration || 30,
            priority: Priority.Medium,
            completed: false,
            recurrence: 'none',
        };
        addTasks([newTask], []);
    };

    return (
        <div 
            draggable
            onDragStart={handleDragStart}
            className="p-3 bg-slate-700/50 rounded-lg group cursor-grab active:cursor-grabbing hover:bg-slate-700 transition-colors flex justify-between items-center"
        >
            <div>
                <p className="font-semibold text-sm text-teal-300 capitalize">{suggestion.type.replace('_', ' ')}</p>
                <p className="text-sm text-white">{suggestion.title}</p>
                <p className="text-xs text-slate-400">{suggestion.details}</p>
            </div>
            <button onClick={handleAddClick} className="text-xs bg-teal-500/80 hover:bg-teal-500 text-white font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                Add
            </button>
        </div>
    );
};

export const SuggestionsPanel: React.FC = () => {
    const { suggestions, timeFillerSuggestions } = useTasks();

    const hasAISuggestions = suggestions.length > 0;
    const hasFillerSuggestions = timeFillerSuggestions.length > 0;

    const PanelWrapper: React.FC<{children: React.ReactNode}> = ({children}) => (
         <div className="p-4 bg-slate-800/70 backdrop-blur-lg rounded-lg shadow-lg flex-1 flex flex-col border border-slate-700/50">
            {children}
        </div>
    );

    if (!hasAISuggestions && !hasFillerSuggestions) {
        return (
            <PanelWrapper>
                <h2 className="font-bold mb-3 text-white">AI Suggestions</h2>
                <div className="text-center text-slate-400 text-sm mt-4">
                    Add a task to get contextual suggestions from the AI.
                </div>
            </PanelWrapper>
        )
    }

    return (
        <PanelWrapper>
             <div className="flex-1 overflow-y-auto pr-1 space-y-6">
                {hasAISuggestions && (
                    <section>
                        <h2 className="font-bold mb-3 text-white">AI Suggestions</h2>
                        <div className="space-y-3">
                            {suggestions.map(s => <SuggestionItem key={s.id} suggestion={s} />)}
                        </div>
                    </section>
                )}
                 {hasFillerSuggestions && (
                     <section>
                        <h2 className="font-bold mb-3 text-white">Productive Pauses</h2>
                        <p className="text-xs text-slate-400 mb-3 -mt-2">Suggestions for open time slots in your schedule today.</p>
                        <div className="space-y-3">
                            {timeFillerSuggestions.map(s => <SuggestionItem key={s.id} suggestion={s} />)}
                        </div>
                    </section>
                )}
            </div>
        </PanelWrapper>
    );
};