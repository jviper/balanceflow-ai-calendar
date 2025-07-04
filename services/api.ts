

import { GoogleGenAI } from "@google/genai";
import { Recurrence } from '../types';
import type { Task, Suggestion, BackupData } from '../types';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    console.warn("API_KEY is not set. AI features will not work.");
}
const ai = new GoogleGenAI({apiKey: API_KEY});

const getPrompt = (existingTasks: Task[]) => `You are an advanced AI assistant for a smart calendar app, BalanceFlow. Your primary role is to act as an intelligent task prioritization and scheduling engine. Your goal is to help users manage their time effectively by automatically parsing, prioritizing, and scheduling their tasks.

**Core Directives:**

1.  **Parse and Structure:**
    -   Analyze the user's natural language input to identify tasks, events, and goals.
    -   For each item, create a structured task object.

2.  **Prioritize Intelligently:**
    -   Automatically determine the task's importance and urgency.
    -   Assign a 'priority' level: 'High', 'Medium', or 'Low'. For example, "fix leaking pipe" is 'High', while "organize bookshelf" might be 'Low'.

3.  **Estimate Duration:**
    -   Accurately estimate the 'duration' for each task in minutes. A quick call might be 15 minutes, while "meal prep for the week" could be 90 minutes.

4.  **Break Down Large Tasks:**
    -   If a user provides a large or complex task (e.g., "plan my vacation," "write a report"), you MUST break it down into smaller, concrete sub-tasks.
    -   Schedule these sub-tasks logically, potentially over several days. For example, "plan vacation" could become "Research destinations (60 min)", "Book flights (45 min)", and "Book hotel (45 min)" on different days.

5.  **Smart Scheduling Engine:**
    -   This is your most critical function. You must find the best time slot for each new task by analyzing the user's provided existing schedule.
    -   **Check Availability:** Place tasks in empty slots, avoiding overlaps.
    -   **Respect Holidays:** Do not schedule work-related tasks on days marked with \`isHoliday: true\`. You may suggest holiday-appropriate activities or leisure time.
    -   **Balance Workload:** Distribute tasks to maintain a reasonable daily schedule. Avoid cramming too many high-effort tasks into a single day.
    -   **Fill Gaps:** Intelligently blend low-effort, short tasks (like "reply to email") into small gaps between existing meetings or routines.
    -   **Handle Ambiguity:** For tasks without a clear deadline (e.g., "call mom sometime"), place them in the unscheduled list by setting "startTime" to null.

6.  **Handle Special Cases:**
    -   **Recurring Tasks:** Correctly identify recurring tasks (e.g., "team meeting every Friday at 10am", "go to gym daily"). Set the 'recurrence' property accordingly ('daily', 'weekly', etc.).
    -   **Multiple Times:** If a user specifies multiple times for a recurring task (e.g., "Feed dog at 8am and 6pm daily"), you MUST create a separate recurring task object for each time.
    -   **Holidays & Events:** Correctly identify one-off events like holidays or birthdays.
    -   **Suggestions:** Generate relevant, contextual 'suggestions' (for meals, breaks, etc.) based on the user's schedule, especially for holidays or busy days.

**Context for Scheduling:**
-   **Current Date:** ${new Date().toISOString()}
-   **User's Existing Schedule (do not modify these, just use them for context):**
    \`\`\`json
    ${JSON.stringify(existingTasks.map(({ id, instanceId, completed, ...rest }) => rest), null, 2)}
    \`\`\`

**Output Format:**
You MUST respond with a single, valid JSON object. Do not add any text before or after the JSON. The JSON should conform to this structure:
{
  "schedule": [
    {
      "title": "string (e.g., 'Draft project outline')",
      "description": "string (optional, more details)",
      "startTime": "string (ISO 8601 format, e.g., '2024-07-04T09:00:00.000Z') or null for unscheduled tasks",
      "duration": "number (in minutes)",
      "priority": "'High' | 'Medium' | 'Low'",
      "recurrence": "'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'",
      "isHoliday": "boolean (true if it's a recognized public holiday)",
      "reminder": "number (minutes before event, default to 10 for timed events)"
    }
  ],
  "suggestions": [
    {
      "type": "'meal' | 'holiday_activity' | 'task_breakdown' | 'well-being' | 'social' | 'leisure'",
      "title": "string",
      "details": "string",
      "duration": "number (optional, in minutes)"
    }
  ]
}
`;

const getRebalancePrompt = (tasks: Task[]): string => `You are an expert calendar optimization engine for the BalanceFlow app. Your sole purpose is to rebalance a user's schedule to prevent burnout and ensure a healthy distribution of tasks across their week.

**Core Directives:**

1.  **Analyze Workload:**
    -   You will be given a JSON array of all currently scheduled tasks.
    -   Calculate the total duration of tasks for each day. The goal is to keep each day's total workload below a "soft cap" of 420 minutes (7 hours) and a "hard cap" of 540 minutes (9 hours).

2.  **Identify Task Types:**
    -   **Fixed Tasks:** These tasks MUST NOT be moved. A task is considered fixed if:
        -   It is a holiday (the \`isHoliday\` property is \`true\`).
        -   It has a 'priority' of 'High'.
        -   It has a 'recurrence' value other than 'none'.
        -   Its title implies a fixed appointment (e.g., "Doctor's Appointment", "Meeting with team").
    -   **Flexible Tasks:** These tasks CAN be moved. A task is considered flexible if it is not a "Fixed Task". Typically, these have 'Low' or 'Medium' priority and 'recurrence' of 'none'.

3.  **Rebalancing Algorithm:**
    -   Iterate through the days in the schedule.
    -   If a day's total workload exceeds the "soft cap" (420 minutes), identify flexible tasks on that day.
    -   Find a less busy day (well below the soft cap) in the near future (within the same week or the next) to move one or more of these flexible tasks to.
    -   When moving a task, you can change its \`startTime\` (both date and time), but try to keep it within reasonable working hours (e.g., 9 AM to 6 PM).
    -   Prioritize moving smaller tasks first to fill gaps in other days.

4.  **Preserve Data Integrity:**
    -   You MUST preserve the original \`id\` for every task. Do not generate new IDs.
    -   All other task properties (title, duration, priority, etc.) must remain unchanged.
    -   The output MUST be the complete list of all tasks (both fixed and rescheduled), not just the ones that were moved.

**Input Schedule:**
-   **Current Date:** ${new Date().toISOString()}
-   **User's Full Schedule:**
    \`\`\`json
    ${JSON.stringify(tasks.map(({ instanceId, completed, ...rest }) => rest), null, 2)}
    \`\`\`

**Output Format:**
You MUST respond with a single, valid JSON array of task objects. Do not add any text before or after the JSON. The format should be an array of the same task objects you received. Example: \`[ { "id": "abc-123", "title": "...", ... }, { ... } ]\`
`;

const getSearchPrompt = (query: string, data: BackupData): string => `You are a powerful, intelligent search engine for a user's personal calendar application, BalanceFlow. Your goal is to understand a user's natural language query and find all relevant items from their entire calendar history.

**Core Directives:**

1.  **Analyze the Query:** Carefully parse the user's search query to understand their intent. This could involve dates, time ranges, keywords, properties, or item types.
2.  **Interpret Time:** Use the provided \`currentDate\` to resolve relative time queries:
    -   "last weekend": The most recent Saturday and Sunday.
    -   "from March": All items in March of the current year unless a different year is specified.
    -   "yesterday," "last week," "next month."
3.  **Filter by Properties:** Handle queries that filter by item attributes:
    -   "tasks that took more than an hour": Filter by \`duration > 60\`.
    -   "high priority tasks": Filter by \`priority === 'High'\`.
    -   "recurring tasks": Filter by \`recurrence !== 'none'\`.
4.  **Filter by Type:** Differentiate between item types based on the query:
    -   "meal ideas": Search within \`suggestions\` where \`type === 'meal'\`.
    -   "all suggestions": Return all items from the \`suggestions\` array.
    -   "tasks": Search within \`tasks\` and \`unscheduledTasks\`.
5.  **Search Content:** Search the \`title\` and \`description\` fields for keywords.
6.  **Handle Recurring Tasks:** If a query matches a recurring task within a specific timeframe (e.g., "meeting last Monday"), return the main recurring task object. The front-end will handle displaying its instances.
7.  **Return Original Objects:** The items in your response MUST be the original, unmodified objects from the provided data context. Do not create new IDs or alter properties.

**Data Context:**
-   **Current Date:** ${new Date().toISOString()}
-   **User's Full Data:**
    \`\`\`json
    ${JSON.stringify(data, null, 2)}
    \`\`\`

**Output Format:**
You MUST respond with a single, valid JSON object with one key, "results". The value should be an array of Task or Suggestion objects that match the query. Do not add any text before or after the JSON.
Example:
{
  "results": [
    { "id": "abc-123", "title": "Team Meeting", "startTime": "2024-07-08T10:00:00.000Z", ... },
    { "id": "sug-456", "type": "meal", "title": "Quick lunch salad", ... }
  ]
}
`;


interface ApiResponse {
    schedule: Partial<Task>[];
    suggestions: Partial<Suggestion>[];
}

export const processNaturalLanguageInput = async (rawText: string, existingTasks: Task[]): Promise<{ scheduledTasks: Task[], suggestions: Suggestion[] }> => {
    if (!API_KEY) {
      throw new Error("API Key is not configured.");
    }

    try {
        const fullPrompt = `${getPrompt(existingTasks)}\n\nUser Input:\n"${rawText}"`;
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-04-17",
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
            }
        });
        
        let jsonStr = response.text.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
          jsonStr = match[2].trim();
        }
        
        const parsedJson: ApiResponse = JSON.parse(jsonStr);
        
        const scheduledTasks: Task[] = (parsedJson.schedule || []).map((task) => ({
            id: crypto.randomUUID(),
            completed: false,
            recurrence: Recurrence.None,
            ...task,
        } as Task));

        const suggestions: Suggestion[] = (parsedJson.suggestions || []).map((suggestion) => ({
            id: crypto.randomUUID(),
            ...suggestion,
        } as Suggestion));
        
        return { scheduledTasks, suggestions };

    } catch (e) {
        console.error("Failed to process natural language input with Gemini API", e);
        if (e instanceof SyntaxError) {
             console.error("Received malformed JSON from API");
             throw new Error("The AI assistant returned an invalid response. Please try again.");
        }
        throw new Error("The AI assistant failed to understand. Please try rephrasing.");
    }
};

export const rebalanceSchedule = async (tasks: Task[]): Promise<Task[]> => {
    if (!API_KEY) {
        throw new Error("API Key is not configured.");
    }
    if (tasks.length === 0) {
        return [];
    }

    try {
        const prompt = getRebalancePrompt(tasks);
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-04-17",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        });
        
        let jsonStr = response.text.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
            jsonStr = match[2].trim();
        }
        
        const rebalancedTasks: Partial<Task>[] = JSON.parse(jsonStr);

        const originalTaskMap = new Map(tasks.map(t => [t.id, t]));
        
        const finalTasks: Task[] = rebalancedTasks.map(rebalancedTask => {
            const originalTask = originalTaskMap.get(rebalancedTask.id!);
            if (!originalTask) {
                console.warn(`AI returned a task with an unknown ID during rebalancing: ${rebalancedTask.id}`);
                return null;
            }
            return {
                ...originalTask,
                ...rebalancedTask,
            };
        }).filter((t): t is Task => t !== null);
        
        if (finalTasks.length !== tasks.length) {
            console.warn("Task count mismatch after rebalancing. Reverting to original schedule.");
            return tasks;
        }

        return finalTasks;

    } catch (e) {
        console.error("Failed to rebalance schedule with Gemini API", e);
        if (e instanceof SyntaxError) {
            console.error("Received malformed JSON from API during rebalancing");
            throw new Error("The AI assistant returned an invalid response while rebalancing.");
        }
        throw new Error("The AI assistant failed to rebalance the schedule.");
    }
};

export const searchCalendar = async (query: string, data: BackupData): Promise<(Task | Suggestion)[]> => {
    if (!API_KEY) {
      throw new Error("API Key is not configured.");
    }

    try {
        const prompt = getSearchPrompt(query, data);
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-04-17",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        });

        let jsonStr = response.text.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
          jsonStr = match[2].trim();
        }

        const parsedJson: { results: (Task | Suggestion)[] } = JSON.parse(jsonStr);
        return parsedJson.results || [];

    } catch (e) {
        console.error("Failed to search calendar with Gemini API", e);
        if (e instanceof SyntaxError) {
             console.error("Received malformed JSON from API during search");
             throw new Error("The AI assistant returned an invalid response. Please try again.");
        }
        throw new Error("The AI assistant failed to perform the search. Please try rephrasing your query.");
    }
};