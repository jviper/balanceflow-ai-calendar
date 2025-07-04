
import React, { useState, useEffect } from 'react';
import add from 'date-fns/add';
import { TasksProvider, useTasks } from './context/TasksContext';
import { Header } from './components/Header';
import { Calendar } from './components/Calendar';
import { TaskInputForm } from './components/TaskInputForm';
import { SuggestionsPanel } from './components/SuggestionsPanel';
import { TaskEditModal } from './components/TaskEditModal';
import { UndoToast } from './components/common';
import { useNotifications } from './services/notificationService';
import { ViewMode } from './types';
import type { Task } from './types';


const AppContent: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Week);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const { recentlyDeletedTask, undoDelete } = useTasks();
    const { initializeNotifications, scheduleReminders } = useNotifications();

    useEffect(() => {
        initializeNotifications();
    }, [initializeNotifications]);
    
    // This effect will run to schedule reminders whenever tasks change
    const { tasks } = useTasks();
    useEffect(() => {
        scheduleReminders(tasks);
    }, [tasks, scheduleReminders]);

    const handleDatePrev = () => {
        const amount = viewMode === 'day' ? { days: 1 } : viewMode === 'week' ? { weeks: 1 } : { months: 1 };
        setCurrentDate(current => add(current, { [Object.keys(amount)[0]]: -amount[Object.keys(amount)[0]] }));
    };

    const handleDateNext = () => {
        const amount = viewMode === 'day' ? { days: 1 } : viewMode === 'week' ? { weeks: 1 } : { months: 1 };
        setCurrentDate(current => add(current, amount));
    };
    
    const handleDateToday = () => {
        setCurrentDate(new Date());
    };

    return (
        <div className="flex flex-col h-screen bg-slate-900 text-slate-200 font-sans">
            <Header 
                currentDate={currentDate}
                viewMode={viewMode}
                onSetViewMode={setViewMode}
                onPrev={handleDatePrev}
                onNext={handleDateNext}
                onToday={handleDateToday}
            />
            <main className="flex-1 flex flex-col md:flex-row overflow-hidden p-2 md:p-4 gap-4">
                <div className="flex flex-col gap-4 w-full md:w-1/4 lg:w-1/5 order-2 md:order-1 overflow-y-auto">
                    <TaskInputForm />
                    <SuggestionsPanel />
                </div>
                <div className="flex-1 order-1 md:order-2 flex flex-col">
                    <Calendar 
                        currentDate={currentDate} 
                        viewMode={viewMode}
                        onEditTask={setEditingTask}
                    />
                </div>
            </main>
            {editingTask && (
                <TaskEditModal 
                    task={editingTask} 
                    onClose={() => setEditingTask(null)}
                />
            )}
            {recentlyDeletedTask && (
                <UndoToast 
                    message={`Task "${recentlyDeletedTask.title}" deleted.`}
                    onUndo={undoDelete}
                />
            )}
        </div>
    );
};

const App: React.FC = () => {
  return (
    <TasksProvider>
      <AppContent />
    </TasksProvider>
  );
};

export default App;