
import React, { useState } from 'react';
import { useTasks } from '../context/TasksContext';
import { parseTask, scheduleTask } from '../services/api';

export const TaskInputForm: React.FC = () => {
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { tasks, addTask } = useTasks();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        setIsLoading(true);
        try {
            const parsedData = await parseTask(inputValue);
            const newTask = await scheduleTask(parsedData, tasks);
            addTask(newTask);
            setInputValue('');
        } catch (error) {
            console.error("Failed to add task:", error);
            // Here you could show an error toast to the user
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 bg-slate-800 rounded-lg shadow-lg">
            <h2 className="font-bold mb-2 text-white">Add a Task</h2>
            <form onSubmit={handleSubmit}>
                <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="e.g., Gym session Friday morning 8 AM"
                    className="w-full h-24 p-2 bg-slate-700 border border-slate-600 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    className="w-full mt-2 px-4 py-2 bg-teal-500 text-white font-bold rounded-md hover:bg-teal-600 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                    disabled={isLoading || !inputValue.trim()}
                >
                    {isLoading ? 'Scheduling...' : 'Add Task'}
                </button>
            </form>
        </div>
    );
};
