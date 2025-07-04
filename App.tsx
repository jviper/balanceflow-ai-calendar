
import React, { useState, useEffect, useCallback } from 'react';
import { add } from 'date-fns';
import { TasksProvider, useTasks } from './context/TasksContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { Header } from './components/Header';
import { Calendar } from './components/Calendar';
import { TaskInputForm } from './components/TaskInputForm';
import { SuggestionsPanel } from './components/SuggestionsPanel';
import { TaskEditModal } from './components/TaskEditModal';
import { UnscheduledTasksPanel } from './components/UnscheduledTasksPanel';
import { UndoToast } from './components/common';
import { useNotifications } from './services/notificationService';
import { DailyBriefingCard } from './components/DailyBriefingCard';
import { FocusModeView } from './components/FocusModeView';
import { SettingsModal } from './components/SettingsModal';
import { SearchPanel } from './components/SearchPanel';
import { SearchResultsModal } from './components/SearchResultsModal';
import { DynamicBackground } from './components/DynamicBackground';
import { searchCalendar } from './services/api';
import { ViewMode } from './types';
import type { Task, Suggestion, BackupData } from './types';


const AppContent: React.FC = () => {
    const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Week);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const { 
        recentlyDeletedTask, 
        undoDelete, 
        toggleTaskCompletion, 
        getTaskById, 
        tasks, 
        completedOccurrences, 
        backupData,
        currentDate,
        setCurrentDate
    } = useTasks();
    const { backgroundMode } = useSettings();
    const { initializeNotifications, scheduleReminders, handleSnooze } = useNotifications();
    const [showBriefing, setShowBriefing] = useState(false);
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [focusTask, setFocusTask] = useState<Task | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Search State
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<(Task | Suggestion)[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);


    const handleSWMessage = useCallback((event: MessageEvent) => {
        const { type, data } = event.data;
        if (!data || !data.taskId) return;

        const task = getTaskById(data.taskId);
        if (!task) return;

        if (type === 'MARK_TASK_DONE') {
            const date = task.startTime ? new Date(task.startTime) : new Date();
            toggleTaskCompletion(task, date);
        } else if (type === 'SNOOZE_TASK') {
            handleSnooze(data.taskId, data.snoozeMinutes);
        } else if (type === 'NAVIGATE_TO_TASK') {
            setEditingTask(task);
        }
    }, [getTaskById, toggleTaskCompletion, handleSnooze]);

    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', handleSWMessage);
        }
        
        initializeNotifications();

        return () => {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.removeEventListener('message', handleSWMessage);
            }
        };
    }, [initializeNotifications, handleSWMessage]);
    
    // Briefing logic
    useEffect(() => {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const lastDismissal = window.localStorage.getItem('balanceflow-briefing-dismissed');
        const hour = now.getHours();

        // Show between 8am and 12pm if not dismissed today
        if (lastDismissal !== todayStr && hour >= 8 && hour < 12) {
            setShowBriefing(true);
        }
    }, []);

    const handleDismissBriefing = () => {
        setShowBriefing(false);
        const todayStr = new Date().toISOString().split('T')[0];
        window.localStorage.setItem('balanceflow-briefing-dismissed', todayStr);
    };

    // This effect will run to schedule reminders whenever tasks change
    useEffect(() => {
        scheduleReminders(tasks, completedOccurrences);
    }, [tasks, completedOccurrences, scheduleReminders]);

    const handleDatePrev = () => {
        const amount = viewMode === 'day' ? { days: 1 } : viewMode === 'week' ? { weeks: 1 } : { months: 1 };
        setCurrentDate(add(currentDate, { [Object.keys(amount)[0]]: -amount[Object.keys(amount)[0]] }));
    };

    const handleDateNext = () => {
        const amount = viewMode === 'day' ? { days: 1 } : viewMode === 'week' ? { weeks: 1 } : { months: 1 };
        setCurrentDate(add(currentDate, amount));
    };
    
    const handleDateToday = () => {
        setCurrentDate(new Date());
    };

    const handleEnterFocusMode = (task: Task) => {
        setFocusTask(task);
        setIsFocusMode(true);
    };

    const handleExitFocusMode = () => {
        setIsFocusMode(false);
        setFocusTask(null);
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        setIsSearchModalOpen(true);
        setIsSearching(true);
        setSearchError(null);
        setSearchResults([]);

        try {
            const dataString = backupData();
            const dataToSearch: BackupData = JSON.parse(dataString);
            
            // Exclude static holidays from search context to avoid clutter
            dataToSearch.tasks = dataToSearch.tasks.filter(t => !t.isHoliday);

            const results = await searchCalendar(query, dataToSearch);
            setSearchResults(results);
        } catch (err: any) {
            setSearchError(err.message || "An unknown error occurred during search.");
        } finally {
            setIsSearching(false);
        }
    };


    if (isFocusMode && focusTask) {
        return <FocusModeView task={focusTask} onExit={handleExitFocusMode} />;
    }

    return (
        <div className={`h-screen text-slate-200 font-sans relative ${backgroundMode === 'off' ? 'bg-slate-900' : ''}`}>
            <DynamicBackground />
            <div className="relative z-10 flex flex-col h-full">
                <Header 
                    currentDate={currentDate}
                    viewMode={viewMode}
                    onSetViewMode={setViewMode}
                    onPrev={handleDatePrev}
                    onNext={handleDateNext}
                    onToday={handleDateToday}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                />
                <main className="flex-1 flex flex-col md:flex-row overflow-hidden p-2 md:p-4 gap-4">
                    <div className="flex flex-col gap-4 w-full md:w-1/4 lg:w-1/5 order-2 md:order-1 overflow-y-auto">
                        <TaskInputForm />
                        <SearchPanel onSearch={handleSearch} isLoading={isSearching} />
                        <UnscheduledTasksPanel onEnterFocus={handleEnterFocusMode} />
                        <SuggestionsPanel />
                    </div>
                    <div className="flex-1 order-1 md:order-2 flex flex-col">
                        <Calendar 
                            currentDate={currentDate} 
                            viewMode={viewMode}
                            onEditTask={setEditingTask}
                            onEnterFocus={handleEnterFocusMode}
                        />
                    </div>
                </main>
                {showBriefing && <DailyBriefingCard onDismiss={handleDismissBriefing} />}
                {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
                {isSearchModalOpen && (
                    <SearchResultsModal
                        query={searchQuery}
                        results={searchResults}
                        isLoading={isSearching}
                        error={searchError}
                        onClose={() => setIsSearchModalOpen(false)}
                        onEditTask={(task) => {
                            setIsSearchModalOpen(false);
                            setEditingTask(task);
                        }}
                    />
                )}
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
        </div>
    );
};

const App: React.FC = () => {
  return (
    <TasksProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </TasksProvider>
  );
};

export default App;