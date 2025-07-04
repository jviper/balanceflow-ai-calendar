import React, { useState } from 'react';
import { useTasks } from '../context/TasksContext';
import { processNaturalLanguageInput, rebalanceSchedule } from '../services/api';

export const TaskInputForm: React.FC = () => {
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('Processing...');
    const [error, setError] = useState<string | null>(null);
    const { addTasks, tasks, unscheduledTasks, setSchedule } = useTasks();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        setIsLoading(true);
        setLoadingMessage('Processing...');
        setError(null);
        try {
            const allCurrentTasks = [...tasks, ...unscheduledTasks];
            const { scheduledTasks: newTasks, suggestions } = await processNaturalLanguageInput(inputValue, allCurrentTasks);
            
            const newlyScheduled = newTasks.filter(t => t.startTime !== null);
            const newlyUnscheduled = newTasks.filter(t => t.startTime === null);

            // Add unscheduled tasks and new suggestions right away
            addTasks(newlyUnscheduled, suggestions);

            // If there are new scheduled tasks, trigger the rebalancing process
            if (newlyScheduled.length > 0) {
                setLoadingMessage('Balancing schedule...');
                const combinedSchedule = [...tasks, ...newlyScheduled];
                const rebalancedSchedule = await rebalanceSchedule(combinedSchedule);
                setSchedule(rebalancedSchedule);
            }

            setInputValue('');
        } catch (error: any) {
            console.error("Failed to add task or rebalance schedule:", error);
            setError(error.message || "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 bg-slate-800/70 backdrop-blur-lg rounded-lg shadow-lg border border-slate-700/50">
            <h2 className="font-bold mb-2 text-white">Add Tasks</h2>
            <form onSubmit={handleSubmit}>
                <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="e.g., plan a team offsite for next month, doctor appointment tomorrow 2pm..."
                    className="w-full h-24 p-2 bg-slate-700/80 border border-slate-600 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    className="w-full mt-2 px-4 py-2 bg-teal-500 text-white font-bold rounded-md hover:bg-teal-600 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                    disabled={isLoading || !inputValue.trim()}
                >
                    {isLoading ? loadingMessage : 'Add with AI'}
                </button>
                 {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            </form>
        </div>
    );
};