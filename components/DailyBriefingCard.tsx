import React, { useState, useEffect, useMemo } from 'react';
import { useTasks } from '../context/TasksContext';
import { Priority } from '../types';
import type { Task } from '../types';
import { formatDate } from '../utils/dateUtils';

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
);

const wellBeingSuggestions = [
    "Take a 5-minute walk to clear your head.",
    "Stay hydrated! Grab a glass of water.",
    "Try a 2-minute meditation to focus your energy.",
    "Start your day with a healthy, light breakfast.",
    "Stretch your body for a few minutes to wake up.",
];

const motivationalMessages = [
    "One small positive thought in the morning can change your whole day.",
    "Believe you can and you're halfway there.",
    "The secret of getting ahead is getting started.",
    "It's a new day. A new start. Make it count.",
    "Success is the sum of small efforts, repeated day in and day out.",
];

interface BriefingTaskItemProps {
    task: Task;
}
const BriefingTaskItem: React.FC<BriefingTaskItemProps> = ({ task }) => (
    <div className="flex items-center gap-3 text-sm">
        <div className={`w-2 h-2 rounded-full ${
            task.priority === Priority.High ? 'bg-red-400' :
            task.priority === Priority.Medium ? 'bg-yellow-400' : 'bg-green-400'
        }`}></div>
        <div>
            <p className="font-semibold text-slate-200">{task.title}</p>
            {task.startTime && <p className="text-xs text-slate-400">{formatDate(new Date(task.startTime), 'HH:mm')}</p>}
        </div>
    </div>
);


export const DailyBriefingCard: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => {
    const { getTasksForDate } = useTasks();
    const [isVisible, setIsVisible] = useState(false);

    const today = useMemo(() => new Date(), []);
    
    const todaysTasks = useMemo(() => {
        return getTasksForDate(today).filter(t => !t.completed && !t.isHoliday);
    }, [getTasksForDate, today]);

    const priorityOrder = { [Priority.High]: 1, [Priority.Medium]: 2, [Priority.Low]: 3 };

    const topTasks = useMemo(() => {
        return [...todaysTasks].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]).slice(0, 3);
    }, [todaysTasks]);

    const atRiskTasks = useMemo(() => {
        return todaysTasks.filter(t => t.priority === Priority.High);
    }, [todaysTasks]);
    
    const [wellBeingTip, setWellBeingTip] = useState('');
    const [motivation, setMotivation] = useState('');

    useEffect(() => {
        setWellBeingTip(wellBeingSuggestions[Math.floor(Math.random() * wellBeingSuggestions.length)]);
        setMotivation(motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]);
        // Animate in
        const timer = setTimeout(() => setIsVisible(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        // Allow animation to finish before calling parent dismiss
        setTimeout(onDismiss, 300);
    };

    return (
        <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ease-in-out ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
            <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700 rounded-lg shadow-2xl w-full max-w-sm p-5 text-slate-300">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h3 className="text-lg font-bold text-white">Your Daily Briefing</h3>
                        <p className="text-sm text-slate-400">{formatDate(today, 'EEEE, MMMM d')}</p>
                    </div>
                    <button onClick={handleDismiss} className="text-slate-500 hover:text-white transition-colors">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    {topTasks.length > 0 ? (
                        <div>
                            <h4 className="font-semibold text-teal-400 text-sm mb-2">Top 3 Priorities</h4>
                            <div className="space-y-2">
                                {topTasks.map(task => <BriefingTaskItem key={task.instanceId || task.id} task={task} />)}
                            </div>
                        </div>
                    ) : (
                         <div>
                            <h4 className="font-semibold text-teal-400 text-sm mb-2">Today's Focus</h4>
                             <p className="text-sm text-slate-400">Your schedule is clear. A great day to tackle some unscheduled tasks!</p>
                        </div>
                    )}

                    {atRiskTasks.length > 0 && (
                         <div>
                            <h4 className="font-semibold text-red-400 text-sm mb-2">High Priority</h4>
                            <div className="space-y-2">
                                {atRiskTasks.map(task => <BriefingTaskItem key={task.instanceId || task.id} task={task} />)}
                            </div>
                        </div>
                    )}

                    <div className="bg-slate-700/50 p-3 rounded-md">
                         <h4 className="font-semibold text-teal-400 text-sm mb-1">Well-being Tip</h4>
                         <p className="text-sm">{wellBeingTip}</p>
                    </div>
                    
                    <div className="border-t border-slate-700 pt-3 mt-3">
                         <p className="text-xs text-center italic text-slate-500">{motivation}</p>
                    </div>
                </div>
                 <button onClick={handleDismiss} className="w-full mt-4 px-4 py-2 bg-teal-500 text-white font-bold rounded-md hover:bg-teal-600 transition-colors text-sm">
                    Got it, let's start the day!
                </button>
            </div>
        </div>
    );
};