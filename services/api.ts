
import { Task, Priority, Suggestion } from '../types';

// Helper to simulate network delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// A very basic natural language date parser
const parseDateFromText = (text: string): Date => {
    const now = new Date();
    if (text.match(/tomorrow/i)) {
        return new Date(now.setDate(now.getDate() + 1));
    }
    if (text.match(/tonight/i)) {
        return new Date(new Date().setHours(20, 0, 0, 0));
    }
    const timeMatch = text.match(/(\d{1,2})\s*(am|pm)?/i);
    if (timeMatch) {
        let hour = parseInt(timeMatch[1], 10);
        if (timeMatch[2]?.toLowerCase() === 'pm' && hour < 12) {
            hour += 12;
        }
        if (timeMatch[2]?.toLowerCase() === 'am' && hour === 12) {
            hour = 0;
        }
        now.setHours(hour, 0, 0, 0);
    } else {
        now.setHours(12, 0, 0, 0); // Default to noon
    }
    return now;
};


export const parseTask = async (rawText: string): Promise<Partial<Task>> => {
    await sleep(500);
    const inferredDate = parseDateFromText(rawText);
    return {
        title: rawText.split(' by ')[0].split(' at ')[0],
        description: rawText,
        startTime: inferredDate.toISOString(),
        duration: 60, // default duration
        priority: Priority.Medium,
    };
};

export const scheduleTask = async (task: Partial<Task>, existingTasks: Task[]): Promise<Task> => {
    await sleep(300);
    // This is a very simple scheduler. A real one would be much more complex.
    // It just confirms the task data. A real one might adjust startTime.
    const newTask: Task = {
        id: crypto.randomUUID(),
        completed: false,
        ...task,
    } as Task;
    return newTask;
};

export const getSuggestions = async (): Promise<Suggestion[]> => {
    await sleep(700);
    return [
        { id: 's1', category: 'Well-being', text: 'Take a 15-min walk', duration: 15 },
        { id: 's2', category: 'Health', text: 'Plan lunch for tomorrow', duration: 10 },
        { id: 's3', category: 'Leisure', text: 'Read for 30 mins', duration: 30 },
        { id: 's4', category: 'Social', text: 'Call a friend or family', duration: 20 },
        { id: 's5', category: 'Well-being', text: '5-minute meditation', duration: 5 },
    ];
};
