
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

export interface Task {
    id: string;
    title: string;
    description?: string;
    startTime: string; // ISO string
    duration: number; // in minutes
    priority: Priority;
    completed: boolean;
    reminder?: number; // minutes before
}

export interface Suggestion {
    id: string;
    category: 'Well-being' | 'Social' | 'Health' | 'Leisure';
    text: string;
    duration: number; // in minutes
}

export interface DragItem {
    type: 'task' | 'suggestion';
    data: Task | Suggestion;
}
