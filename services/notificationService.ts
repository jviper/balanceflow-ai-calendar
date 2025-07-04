
import { useCallback, useRef, useState, useEffect } from 'react';
import { Task, Recurrence } from '../types';
import { isBefore, addMinutes, format, checkRecurrence, getTaskEndTime, isSameDay } from '../utils/dateUtils';

let notificationInterval: number | null = null;
const notifiedTaskIds = new Set<string>(); // For pre-event reminders
const notifiedFollowupIds = new Set<string>(); // For post-event follow-ups

type CompletedOccurrences = Record<string, string[]>;

export const useNotifications = () => {
    const tasksRef = useRef<Task[]>([]);
    const completedOccurrencesRef = useRef<CompletedOccurrences>({});
    const [snoozedTasks, setSnoozedTasks] = useState<Record<string, string>>({}); // { [instanceId]: snoozedUntilISOString }
    const snoozedTasksRef = useRef(snoozedTasks);
    snoozedTasksRef.current = snoozedTasks;


    const initializeNotifications = useCallback(() => {
        if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
    }, []);
    
    const showActionableNotification = useCallback((type: 'reminder' | 'follow-up', task: Task) => {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: type === 'reminder' ? 'SHOW_REMINDER' : 'SHOW_FOLLOW_UP',
                data: { task }
            });
        } else {
            console.warn("Service worker not available, showing basic notification.");
            // Fallback for when SW is not active yet, though it lacks actions.
            new Notification(type === 'reminder' ? `Reminder: ${task.title}`: `Follow-up: ${task.title}` , {
                body: `Time for: ${task.title}`,
                icon: '/vite.svg',
            });
        }
    }, []);

    const checkAndSendReminders = useCallback(() => {
        const now = new Date();
        const dateString = format(now, 'yyyy-MM-dd');

        tasksRef.current.forEach(task => {
            if (!task.reminder || !task.startTime) return;
            
            let taskInstance: Task | null = null;
            let instanceId: string;

            // --- Determine the task instance for today ---
            if (task.recurrence === Recurrence.None) {
                if (!isSameDay(new Date(task.startTime), now)) return;
                taskInstance = task;
                instanceId = task.id;
            } else {
                if (!checkRecurrence(task, now)) return;

                const masterStartTime = new Date(task.startTime);
                const instanceStartTime = new Date(now);
                instanceStartTime.setHours(masterStartTime.getHours(), masterStartTime.getMinutes(), masterStartTime.getSeconds(), 0);
                
                instanceId = `${task.id}_${dateString}`;
                const completed = (completedOccurrencesRef.current[task.id] || []).includes(dateString);
                taskInstance = { ...task, instanceId, completed, startTime: instanceStartTime.toISOString() };
            }

            if (!taskInstance || taskInstance.completed) return;
            
            // --- Check if snoozed ---
            const snoozedUntil = snoozedTasksRef.current[instanceId];
            if (snoozedUntil && isBefore(now, new Date(snoozedUntil))) {
                return; // Still snoozing
            }

            const taskStartTime = new Date(taskInstance.startTime!);
            
            // --- Pre-event reminder logic ---
            const reminderTime = addMinutes(taskStartTime, -taskInstance.reminder);
            if (!notifiedTaskIds.has(instanceId) && isBefore(reminderTime, now) && isBefore(now, taskStartTime)) {
                showActionableNotification('reminder', taskInstance);
                notifiedTaskIds.add(instanceId);
            }
            
            // --- Post-task follow-up logic ---
            const taskEndTime = getTaskEndTime(taskInstance);
            const followupId = `followup_${instanceId}`;
            // Send follow up between 1 and 60 minutes after task ends
            const followupTimeStart = addMinutes(taskEndTime, 1);
            const followupTimeEnd = addMinutes(taskEndTime, 60);

            if (!notifiedFollowupIds.has(followupId) && isBefore(followupTimeStart, now) && isBefore(now, followupTimeEnd)) {
                showActionableNotification('follow-up', taskInstance);
                notifiedFollowupIds.add(followupId);
            }
        });
    }, [showActionableNotification]);

    const scheduleReminders = useCallback((tasks: Task[], completedOccurrences: CompletedOccurrences) => {
        tasksRef.current = tasks;
        completedOccurrencesRef.current = completedOccurrences;

        if (notificationInterval) {
            window.clearInterval(notificationInterval);
        }
        
        notificationInterval = window.setInterval(checkAndSendReminders, 30000); // Check every 30 seconds

        return () => {
            if (notificationInterval) {
                window.clearInterval(notificationInterval);
            }
        };
    }, [checkAndSendReminders]);

    const handleSnooze = useCallback((taskId: string, snoozeMinutes: number) => {
        setSnoozedTasks(prev => ({
            ...prev,
            [taskId]: addMinutes(new Date(), snoozeMinutes).toISOString()
        }));
    }, []);


    return { initializeNotifications, scheduleReminders, handleSnooze };
};
