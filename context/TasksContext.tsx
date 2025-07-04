
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Task } from '../types';

interface TasksContextType {
    tasks: Task[];
    addTask: (task: Task) => void;
    updateTask: (updatedTask: Task) => void;
    deleteTask: (taskId: string) => void;
    recentlyDeletedTask: Task | null;
    undoDelete: () => void;
    getTasksForDate: (date: Date) => Task[];
    getLoadForDate: (date: Date) => number;
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export const TasksProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [tasks, setTasks] = useState<Task[]>(() => {
        try {
            const localData = localStorage.getItem('balanceflow-tasks');
            return localData ? JSON.parse(localData) : [];
        } catch (error) {
            console.error("Error reading tasks from localStorage", error);
            return [];
        }
    });

    const [recentlyDeletedTask, setRecentlyDeletedTask] = useState<Task | null>(null);
    const [undoTimeout, setUndoTimeout] = useState<number | null>(null);

    useEffect(() => {
        try {
            localStorage.setItem('balanceflow-tasks', JSON.stringify(tasks));
        } catch (error) {
            console.error("Error writing tasks to localStorage", error);
        }
    }, [tasks]);

    const addTask = useCallback((task: Task) => {
        setTasks(prev => [...prev, task].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()));
    }, []);

    const updateTask = useCallback((updatedTask: Task) => {
        setTasks(prev => prev.map(task => task.id === updatedTask.id ? updatedTask : task).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()));
    }, []);

    const deleteTask = useCallback((taskId: string) => {
        const taskToDelete = tasks.find(t => t.id === taskId);
        if (taskToDelete) {
            setRecentlyDeletedTask(taskToDelete);
            setTasks(prev => prev.filter(task => task.id !== taskId));

            if (undoTimeout) clearTimeout(undoTimeout);
            const timeout = setTimeout(() => {
                setRecentlyDeletedTask(null);
            }, 5000);
            setUndoTimeout(timeout as unknown as number);
        }
    }, [tasks, undoTimeout]);

    const undoDelete = useCallback(() => {
        if (recentlyDeletedTask) {
            addTask(recentlyDeletedTask);
            setRecentlyDeletedTask(null);
            if (undoTimeout) clearTimeout(undoTimeout);
        }
    }, [recentlyDeletedTask, addTask, undoTimeout]);
    
    const getTasksForDate = useCallback((date: Date) => {
        return tasks.filter(task => new Date(task.startTime).toDateString() === date.toDateString());
    }, [tasks]);
    
    const getLoadForDate = useCallback((date: Date) => {
        const dayTasks = getTasksForDate(date);
        const totalMinutes = dayTasks.reduce((sum, task) => sum + task.duration, 0);
        return Math.min(totalMinutes / (8 * 60), 1); // Capped at 100% of an 8-hour day
    }, [getTasksForDate]);

    return (
        <TasksContext.Provider value={{ tasks, addTask, updateTask, deleteTask, recentlyDeletedTask, undoDelete, getTasksForDate, getLoadForDate }}>
            {children}
        </TasksContext.Provider>
    );
};

export const useTasks = (): TasksContextType => {
    const context = useContext(TasksContext);
    if (context === undefined) {
        throw new Error('useTasks must be used within a TasksProvider');
    }
    return context;
};
