
// BalanceFlow AI Calendar Service Worker

// Listen for messages from the main app to show notifications
self.addEventListener('message', (event) => {
    const { type, data } = event.data;

    if (type === 'SHOW_REMINDER') {
        const { task } = data;
        const taskStartTime = new Date(task.startTime);
        const options = {
            body: `Today at ${taskStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            icon: '/vite.svg',
            tag: task.instanceId || task.id, // Use tag to prevent multiple notifications for same task
            renotify: true, // Vibrate/alert even if a notification with the same tag exists
            data: {
                task,
                type: 'reminder'
            },
            actions: [
                { action: 'mark-done', title: 'Mark as Done' },
                { action: 'snooze', title: 'Snooze 5 min' }
            ]
        };
        self.registration.showNotification(`Reminder: ${task.title}`, options);
    } else if (type === 'SHOW_FOLLOW_UP') {
        const { task } = data;
        const options = {
            body: `You finished "${task.title}". How did it go?`,
            icon: '/vite.svg',
            tag: `followup_${task.instanceId || task.id}`,
            data: {
                task,
                type: 'follow-up'
            },
            actions: [
                { action: 'reflect', title: 'Add Reflection' },
                { action: 'dismiss', title: 'Dismiss' }
            ]
        };
        self.registration.showNotification('Task Complete!', options);
    }
});

// Listen for clicks on notifications or their actions
self.addEventListener('notificationclick', (event) => {
    const notification = event.notification;
    const action = event.action;
    const task = notification.data.task;

    notification.close();

    // Helper function to message all open app clients
    const messageClients = (message) => {
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            if (clientList.length > 0) {
                clientList.forEach(client => {
                    client.postMessage(message);
                });
            }
        });
    };

    if (action === 'mark-done') {
        messageClients({ type: 'MARK_TASK_DONE', data: { taskId: task.instanceId || task.id } });
    } else if (action === 'snooze') {
        messageClients({ type: 'SNOOZE_TASK', data: { taskId: task.instanceId || task.id, snoozeMinutes: 5 } });
    } else if (action === 'reflect' || !action) { // Default click or 'reflect'
        // Focus or open the app window
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            const clientToFocus = clientList.find(c => c.visibilityState === 'visible') || clientList[0];
            if (clientToFocus) {
                clientToFocus.focus();
                // Tell the app to open the edit modal for this task
                clientToFocus.postMessage({ type: 'NAVIGATE_TO_TASK', data: { taskId: task.instanceId || task.id } });
            } else {
                self.clients.openWindow('/');
            }
        });
    }
    // For the 'dismiss' action, we do nothing besides closing the notification, which is already done.
});

// --- Service Worker Lifecycle ---

// On install, activate immediately
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// On activation, claim all clients to take control immediately
self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});
