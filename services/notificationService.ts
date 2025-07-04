
import { useCallback, useRef } from 'react';
import { Task } from '../types';
import isBefore from 'date-fns/isBefore';
import addMinutes from 'date-fns/addMinutes';

let notificationInterval: number | null = null;
const notifiedTaskIds = new Set<string>();

export const useNotifications = () => {
    const tasksRef = useRef<Task[]>([]);

    const initializeNotifications = useCallback(() => {
        if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
    }, []);

    const showNotification = (task: Task) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification('BalanceFlow Reminder', {
                body: `Time for: ${task.title}`,
                icon: '/vite.svg', // Replace with a proper icon if available
            });
        }
    };
    
    const checkAndSendReminders = useCallback(() => {
        const now = new Date();
        tasksRef.current.forEach(task => {
            if (task.completed || !task.reminder || notifiedTaskIds.has(task.id)) {
                return;
            }
            const taskStartTime = new Date(task.startTime);
            const reminderTime = addMinutes(taskStartTime, -task.reminder);

            if (isBefore(reminderTime, now) && isBefore(now, taskStartTime)) {
                showNotification(task);
                notifiedTaskIds.add(task.id);
            }
        });
    }, []);

    const scheduleReminders = useCallback((tasks: Task[]) => {
        tasksRef.current = tasks;
        if (notificationInterval) {
            clearInterval(notificationInterval);
        }
        
        notificationInterval = setInterval(checkAndSendReminders, 30000); // Check every 30 seconds

        return () => {
            if (notificationInterval) {
                clearInterval(notificationInterval);
            }
        };
    }, [checkAndSendReminders]);


    return { initializeNotifications, scheduleReminders };
};