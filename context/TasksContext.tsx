
import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import { isSameDay, checkRecurrence, format, getTaskEndTime, startOfDay } from '../utils/dateUtils';
import { getUSFederalHolidays } from '../utils/holidayUtils';
import { Recurrence } from '../types';
import type { Task, Suggestion, BackupData } from '../types';

interface TasksContextType {
    tasks: Task[];
    unscheduledTasks: Task[];
    suggestions: Suggestion[];
    timeFillerSuggestions: Suggestion[];
    completedOccurrences: Record<string, string[]>;
    currentDate: Date;
    setCurrentDate: (date: Date) => void;
    addTasks: (tasks: Task[], newSuggestions: Suggestion[]) => void;
    updateTask: (updatedTask: Task) => void;
    deleteTask: (taskId: string) => void;
    toggleTaskCompletion: (task: Task, date: Date) => void;
    scheduleUnscheduledTask: (task: Task, newStartTime: string) => void;
    recentlyDeletedTask: Task | null;
    undoDelete: () => void;
    getTasksForDate: (date: Date) => Task[];
    getLoadForDate: (date: Date) => number;
    setSchedule: (tasks: Task[]) => void;
    backupData: () => string;
    restoreData: (jsonData: string) => void;
    getTaskById: (taskId: string) => Task | undefined;
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    const setValue = (value: T | ((val: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(error);
        }
    };

    return [storedValue, setValue];
};

const fillerTaskIdeas: Omit<Suggestion, 'id'>[] = [
    { type: 'well-being', title: "Take a 10-min walk", details: "Stretch your legs and get some fresh air.", duration: 10 },
    { type: 'leisure', title: "Tidy your desk", details: "A tidy space for a tidy mind.", duration: 15 },
    { type: 'well-being', title: "Prep a healthy snack", details: "Grab an apple or some nuts.", duration: 5 },
    { type: 'well-being', title: "Quick meditation session", details: "Use a mindfulness app or just focus on your breath.", duration: 10 },
    { type: 'task_breakdown', title: "Review tomorrow's plan", details: "Briefly look at tomorrow's tasks.", duration: 5 },
    { type: 'leisure', title: "Read an article", details: "Catch up on industry news or a personal interest.", duration: 20 },
];


export const TasksProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [userTasks, setUserTasks] = useLocalStorage<Task[]>('balanceflow-tasks', []);
    const [unscheduledTasks, setUnscheduledTasks] = useLocalStorage<Task[]>('balanceflow-unscheduled-tasks', []);
    const [suggestions, setSuggestions] = useLocalStorage<Suggestion[]>('balanceflow-suggestions', []);
    const [completedOccurrences, setCompletedOccurrences] = useLocalStorage<Record<string, string[]>>('balanceflow-completed-occurrences', {});
    const [currentDate, setCurrentDate] = useState(new Date());

    const [recentlyDeletedTask, setRecentlyDeletedTask] = useState<Task | null>(null);
    const [undoTimeout, setUndoTimeout] = useState<number | null>(null);
    
    const holidays = useMemo(() => {
        const currentYear = new Date().getFullYear();
        // Generate for a range of years to support navigation without regeneration
        const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2];
        return years.flatMap(year => getUSFederalHolidays(year));
    }, []);

    const tasks = useMemo(() => [...userTasks, ...holidays].sort((a, b) => {
        if (!a.startTime || !b.startTime) return 0;
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    }), [userTasks, holidays]);


    const addTasks = useCallback((newTasks: Task[], newSuggestions: Suggestion[]) => {
        const scheduled = newTasks.filter(t => t.startTime !== null);
        const unscheduled = newTasks.filter(t => t.startTime === null);

        if (scheduled.length > 0) {
            setUserTasks(prev => [...prev, ...scheduled]);
        }
        if (unscheduled.length > 0) {
            setUnscheduledTasks(prev => [...prev, ...unscheduled]);
        }
        if (newSuggestions.length > 0) {
            setSuggestions(newSuggestions);
        } else {
            setSuggestions([]);
        }
    }, [setUserTasks, setUnscheduledTasks, setSuggestions]);

    const updateTask = useCallback((updatedTask: Task) => {
        const masterTaskId = updatedTask.instanceId ? updatedTask.instanceId.split('_')[0] : updatedTask.id;
        if(updatedTask.startTime === null) {
            // Move from scheduled to unscheduled
            setUserTasks(prev => prev.filter(task => task.id !== masterTaskId));
            setUnscheduledTasks(prev => [...prev, updatedTask]);
        } else {
            // Update within scheduled, or from unscheduled to scheduled
            setUnscheduledTasks(prev => prev.filter(task => task.id !== masterTaskId));
            setUserTasks(prev => {
                const existing = prev.find(task => task.id === masterTaskId);
                if (existing) {
                    return prev.map(task => task.id === masterTaskId ? updatedTask : task);
                }
                return [...prev, updatedTask];
            });
        }
    }, [setUserTasks, setUnscheduledTasks]);

    const deleteTask = useCallback((taskId: string) => {
        const masterTaskId = taskId.includes('_') ? taskId.split('_')[0] : taskId;
        const taskToDeleteScheduled = userTasks.find(t => t.id === masterTaskId);
        const taskToDeleteUnscheduled = unscheduledTasks.find(t => t.id === masterTaskId);
        const taskToDelete = taskToDeleteScheduled || taskToDeleteUnscheduled;

        if (taskToDelete) {
            setRecentlyDeletedTask(taskToDelete);
            if(taskToDeleteScheduled) setUserTasks(prev => prev.filter(task => task.id !== masterTaskId));
            if(taskToDeleteUnscheduled) setUnscheduledTasks(prev => prev.filter(task => task.id !== masterTaskId));
            setCompletedOccurrences(prev => {
                const newOccurrences = {...prev};
                delete newOccurrences[masterTaskId];
                return newOccurrences;
            });

            if (undoTimeout) window.clearTimeout(undoTimeout);
            const timeout = window.setTimeout(() => setRecentlyDeletedTask(null), 5000);
            setUndoTimeout(timeout);
        }
    }, [userTasks, unscheduledTasks, undoTimeout, setUserTasks, setUnscheduledTasks, setCompletedOccurrences]);

    const undoDelete = useCallback(() => {
        if (recentlyDeletedTask) {
            addTasks([recentlyDeletedTask], []);
            setRecentlyDeletedTask(null);
            if (undoTimeout) window.clearTimeout(undoTimeout);
        }
    }, [recentlyDeletedTask, addTasks, undoTimeout]);

    const scheduleUnscheduledTask = useCallback((taskToSchedule: Task, newStartTime: string) => {
        setUnscheduledTasks(prev => prev.filter(t => t.id !== taskToSchedule.id));
        setUserTasks(prev => [...prev, {...taskToSchedule, startTime: newStartTime}]);
    }, [setUserTasks, setUnscheduledTasks]);
    
    const toggleTaskCompletion = useCallback((task: Task, date: Date) => {
        const dateString = format(date, 'yyyy-MM-dd');

        if (task.recurrence === Recurrence.None) {
            updateTask({ ...task, completed: !task.completed });
        } else {
            const masterTaskId = task.instanceId ? task.instanceId.split('_')[0] : task.id;
            setCompletedOccurrences(prev => {
                const existing = prev[masterTaskId] || [];
                const newOccurrences = {...prev};
                if (existing.includes(dateString)) {
                    newOccurrences[masterTaskId] = existing.filter(d => d !== dateString);
                } else {
                    newOccurrences[masterTaskId] = [...existing, dateString];
                }
                return newOccurrences;
            });
        }
    }, [updateTask, setCompletedOccurrences]);

    const getTasksForDate = useCallback((date: Date) => {
        const dateString = format(date, 'yyyy-MM-dd');
        const dayTasks: Task[] = [];
        
        tasks.forEach(task => {
            // Non-recurring tasks (includes holidays)
            if (task.recurrence === Recurrence.None && task.startTime && isSameDay(new Date(task.startTime), date)) {
                dayTasks.push(task);
            }
            // Recurring tasks
            else if (task.recurrence !== Recurrence.None && task.startTime && checkRecurrence(task, date)) {
                const instanceStartTime = new Date(date);
                const masterStartTime = new Date(task.startTime);
                instanceStartTime.setHours(masterStartTime.getHours(), masterStartTime.getMinutes(), masterStartTime.getSeconds());

                const isCompleted = (completedOccurrences[task.id] || []).includes(dateString);
                
                dayTasks.push({
                    ...task,
                    instanceId: `${task.id}_${dateString}`,
                    startTime: instanceStartTime.toISOString(),
                    completed: isCompleted
                });
            }
        });
        return dayTasks.sort((a,b) => new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime());
    }, [tasks, completedOccurrences]);

    const getTaskById = useCallback((taskId: string): Task | undefined => {
        const masterTaskId = taskId.includes('_') ? taskId.split('_')[0] : taskId;

        let task = userTasks.find(t => t.id === masterTaskId);
        if (!task) {
            task = unscheduledTasks.find(t => t.id === masterTaskId);
        }

        if (!task) return undefined;

        // If it's a recurring instance, we need to reconstruct the specific instance
        if (taskId.includes('_')) {
            const dateString = taskId.split('_')[1];
            // Basic check to see if it's a date string
            if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return task; // It might be a regular ID with an underscore

            const instanceDate = startOfDay(new Date(dateString));
            
            if (task.startTime && checkRecurrence(task, instanceDate)) {
                 const masterStartTime = new Date(task.startTime);
                 const instanceStartTime = new Date(instanceDate);
                 instanceStartTime.setHours(masterStartTime.getHours(), masterStartTime.getMinutes(), masterStartTime.getSeconds());
                 const isCompleted = (completedOccurrences[task.id] || []).includes(dateString);
                 return {
                     ...task,
                     instanceId: taskId,
                     startTime: instanceStartTime.toISOString(),
                     completed: isCompleted,
                 };
            }
        }
        
        return task;

    }, [userTasks, unscheduledTasks, completedOccurrences]);
    
    const getLoadForDate = useCallback((date: Date) => {
        const dayTasks = getTasksForDate(date);
        const totalMinutes = dayTasks.reduce((sum, task) => sum + task.duration, 0);
        return Math.min(totalMinutes / (8 * 60), 1);
    }, [getTasksForDate]);

    const setSchedule = useCallback((newSchedule: Task[]) => {
        // We only update user tasks, as holidays are static.
        const userOnlySchedule = newSchedule.filter(t => !t.isHoliday);
        setUserTasks(userOnlySchedule);
    }, [setUserTasks]);
    
    const backupData = useCallback((): string => {
        const data: BackupData = {
            tasks: userTasks,
            unscheduledTasks: unscheduledTasks,
            suggestions: suggestions,
            completedOccurrences: completedOccurrences,
        };
        return JSON.stringify(data, null, 2);
    }, [userTasks, unscheduledTasks, suggestions, completedOccurrences]);

    const restoreData = useCallback((jsonData: string) => {
        const data: BackupData = JSON.parse(jsonData);

        if (!data || !Array.isArray(data.tasks) || !Array.isArray(data.unscheduledTasks) || typeof data.completedOccurrences !== 'object') {
            throw new Error("Invalid backup file format.");
        }
        
        setUserTasks(data.tasks);
        setUnscheduledTasks(data.unscheduledTasks);
        setSuggestions(data.suggestions || []);
        setCompletedOccurrences(data.completedOccurrences);
    }, [setUserTasks, setUnscheduledTasks, setSuggestions, setCompletedOccurrences]);

    const timeFillerSuggestions = useMemo((): Suggestion[] => {
        const today = startOfDay(new Date());
        const tasksForToday = getTasksForDate(today);
    
        const workdayStart = new Date(today);
        workdayStart.setHours(9, 0, 0, 0);
        const workdayEnd = new Date(today);
        workdayEnd.setHours(17, 30, 0, 0);
    
        const sortedTasks = tasksForToday
            .filter(t => t.startTime && !t.isHoliday && t.duration < 1440)
            .sort((a, b) => new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime());
    
        let hasSignificantGap = false;
        let lastEventEnd = workdayStart;
    
        if (sortedTasks.length === 0 && isSameDay(today, new Date())) {
            hasSignificantGap = true;
        } else {
            for (const task of sortedTasks) {
                const taskStart = new Date(task.startTime!);
                if (taskStart > workdayEnd) continue;
    
                const gapStart = lastEventEnd > workdayStart ? lastEventEnd : workdayStart;
                const gapDuration = (taskStart.getTime() - gapStart.getTime()) / (1000 * 60);
    
                if (gapDuration >= 30) {
                    hasSignificantGap = true;
                    break;
                }
                lastEventEnd = getTaskEndTime(task);
            }
    
            if (!hasSignificantGap && lastEventEnd < workdayEnd) {
                const finalGapDuration = (workdayEnd.getTime() - lastEventEnd.getTime()) / (1000 * 60);
                if (finalGapDuration >= 30) {
                    hasSignificantGap = true;
                }
            }
        }
        
        if (hasSignificantGap) {
            return [...fillerTaskIdeas]
                .sort(() => 0.5 - Math.random())
                .slice(0, 3)
                .map((idea, index) => ({
                    ...idea,
                    id: `filler-${index}-${today.getTime()}`,
                } as Suggestion));
        }
    
        return [];
    }, [getTasksForDate]);


    return (
        <TasksContext.Provider value={{ tasks, unscheduledTasks, suggestions, timeFillerSuggestions, addTasks, updateTask, deleteTask, recentlyDeletedTask, undoDelete, getTasksForDate, getLoadForDate, scheduleUnscheduledTask, toggleTaskCompletion, setSchedule, completedOccurrences, backupData, restoreData, getTaskById, currentDate, setCurrentDate }}>
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