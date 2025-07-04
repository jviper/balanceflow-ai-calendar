
import React, { useState, useEffect } from 'react';
import { Priority } from '../types';
import type { Task } from '../types';
import { useTasks } from '../context/TasksContext';
import { getTaskEndTime, formatDate } from '../utils/dateUtils';

// --- Icons ---
export const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
);

export const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.02-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
);

export const PencilIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
);


// --- Priority Styling ---
const priorityStyles: Record<Priority, { bg: string, text: string, border: string }> = {
    [Priority.High]: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50' },
    [Priority.Medium]: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/50' },
    [Priority.Low]: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/50' },
};

// --- TaskCard ---
interface TaskCardProps {
    task: Task;
    onClick: () => void;
    style?: React.CSSProperties;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, style }) => {
    const { updateTask, deleteTask } = useTasks();
    const styles = priorityStyles[task.priority];

    const handleCompleteToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        updateTask({ ...task, completed: !task.completed });
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        deleteTask(task.id);
    };
    
    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'task', data: task }));
        e.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            onClick={onClick}
            style={style}
            className={`p-2 rounded-lg text-xs flex flex-col justify-between cursor-pointer border ${styles.bg} ${styles.border} ${task.completed ? 'opacity-50 line-through' : ''}`}
        >
            <div>
                <p className={`font-bold ${styles.text}`}>{task.title}</p>
                <p className="text-slate-400">{formatDate(new Date(task.startTime), 'HH:mm')} - {formatDate(getTaskEndTime(task), 'HH:mm')}</p>
            </div>
            <div className="flex items-center justify-end gap-2 mt-1">
                 <button onClick={handleCompleteToggle} className="text-slate-400 hover:text-green-400">
                    <CheckIcon className="w-4 h-4" />
                </button>
                <button onClick={handleDelete} className="text-slate-400 hover:text-red-400">
                    <TrashIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};


// --- UndoToast ---
interface UndoToastProps {
    message: string;
    onUndo: () => void;
}

export const UndoToast: React.FC<UndoToastProps> = ({ message, onUndo }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setVisible(true);
        const timer = setTimeout(() => setVisible(false), 4500);
        return () => clearTimeout(timer);
    }, [message]);

    if (!visible) return null;

    return (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-slate-700 text-white py-2 px-4 rounded-lg shadow-xl flex items-center gap-4 transition-opacity duration-300">
            <span>{message}</span>
            <button onClick={onUndo} className="font-bold text-teal-400 hover:text-teal-300">
                Undo
            </button>
        </div>
    );
};
