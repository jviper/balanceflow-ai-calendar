import React from 'react';
import { useTasks } from '../context/TasksContext';
import { UnscheduledTaskItem } from './common';
import type { Task } from '../types';

interface UnscheduledTasksPanelProps {
    onEnterFocus: (task: Task) => void;
}

export const UnscheduledTasksPanel: React.FC<UnscheduledTasksPanelProps> = ({ onEnterFocus }) => {
    const { unscheduledTasks } = useTasks();

    if (unscheduledTasks.length === 0) {
        return null;
    }

    return (
        <div className="p-4 bg-slate-800/70 backdrop-blur-lg rounded-lg shadow-lg flex-1 flex flex-col border border-slate-700/50">
            <h2 className="font-bold mb-3 text-white">Unscheduled Tasks</h2>
            <div className="space-y-3 overflow-y-auto pr-1">
                {unscheduledTasks.map(task => (
                    <UnscheduledTaskItem key={task.id} task={task} onEnterFocus={onEnterFocus} />
                ))}
            </div>
        </div>
    );
};