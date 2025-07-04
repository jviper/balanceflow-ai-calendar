export enum Priority {
    High = 'High',
    Medium = 'Medium',
    Low = 'Low',
}

export enum ViewMode {
    Day = 'day',
    Week = 'week',
    Month = 'month',
}

export type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
export const Recurrence = {
    None: 'none',
    Daily: 'daily',
    Weekly: 'weekly',
    Monthly: 'monthly',
    Yearly: 'yearly'
} as const;


export interface Task {
    id: string;
    title: string;
    description?: string;
    startTime: string | null; // ISO string. For recurring, this is the start of the first instance.
    duration: number; // in minutes
    priority: Priority;
    completed: boolean; // For non-recurring tasks
    reminder?: number; // minutes before
    isHoliday?: boolean;
    recurrence: typeof Recurrence[keyof typeof Recurrence];
    // An instanceId is created for virtual recurring tasks, e.g., "taskId_2024-07-04"
    instanceId?: string; 
}

export interface Suggestion {
    id: string;
    type: 'meal' | 'holiday_activity' | 'task_breakdown' | 'well-being' | 'social' | 'leisure';
    title: string;
    details: string;
    duration?: number;
}

export interface DragItem {
    type: 'task' | 'suggestion' | 'unscheduled_task';
    data: Task | Suggestion;
}

export type BackgroundMode = 'static' | 'live' | 'off';

export interface BackupData {
    tasks: Task[];
    unscheduledTasks: Task[];
    suggestions: Suggestion[];
    completedOccurrences: Record<string, string[]>;
}