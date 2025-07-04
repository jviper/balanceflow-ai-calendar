import React, { useState, useEffect, useMemo } from 'react';
import type { Task } from '../types';

const motivationalMessages = [
    "The secret of getting ahead is getting started.",
    "The only way to do great work is to love what you do.",
    "Focus on being productive instead of busy.",
    "Do something today that your future self will thank you for.",
    "The key is not to prioritize what's on your schedule, but to schedule your priorities."
];

const CountdownTimer: React.FC = () => {
    // Pomodoro logic: 25 min focus, 5 min break
    const FOCUS_DURATION = 25 * 60;
    const BREAK_DURATION = 5 * 60;

    const [timeLeft, setTimeLeft] = useState(FOCUS_DURATION);
    const [isActive, setIsActive] = useState(false);
    const [isBreak, setIsBreak] = useState(false);

    useEffect(() => {
        if (!isActive) return;

        if (timeLeft <= 0) {
            setIsActive(false);
            // Using alert for simplicity as it requires no extra permissions/setup
            alert(isBreak ? "Break's over! Time to focus." : "Great work! Time for a break.");
            
            if (isBreak) {
                // Back to focus
                setIsBreak(false);
                setTimeLeft(FOCUS_DURATION);
            } else {
                // Start break
                setIsBreak(true);
                setTimeLeft(BREAK_DURATION);
            }
            return;
        }

        const intervalId = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(intervalId);
    }, [isActive, timeLeft, isBreak]);

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        setIsBreak(false);
        setTimeLeft(FOCUS_DURATION);
    };
    
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <div className="text-center">
            <div className={`my-4 px-4 py-2 rounded-md font-semibold text-lg inline-block ${isBreak ? 'bg-green-500/20 text-green-300' : 'bg-teal-500/20 text-teal-300'}`}>
                {isBreak ? 'Break Time' : 'Focus Time'}
            </div>
            <p className="font-mono text-8xl md:text-9xl font-bold my-4 text-white">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </p>
            <div className="flex gap-4 justify-center">
                <button onClick={toggleTimer} className="px-8 py-3 bg-teal-500 text-white font-bold rounded-md hover:bg-teal-600 transition-colors">
                    {isActive ? 'Pause' : 'Start'}
                </button>
                <button onClick={resetTimer} className="px-8 py-3 bg-slate-600 text-white font-bold rounded-md hover:bg-slate-700 transition-colors">
                    Reset
                </button>
            </div>
        </div>
    );
};

interface FocusModeViewProps {
    task: Task;
    onExit: () => void;
}

export const FocusModeView: React.FC<FocusModeViewProps> = ({ task, onExit }) => {
    const motivation = useMemo(() => motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)], []);

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-2xl z-50 flex flex-col items-center justify-center p-4">
            <div className="absolute top-4 left-4 text-slate-400 italic text-sm">
                {motivation}
            </div>
            <button onClick={onExit} className="absolute top-4 right-4 px-4 py-2 bg-slate-700 text-white font-bold rounded-md hover:bg-slate-600 transition-colors">
                Exit Focus Mode
            </button>
            
            <div className="w-full max-w-2xl text-center">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{task.title}</h1>
                <p className="text-slate-300 mb-8">{task.description || 'No description provided.'}</p>
                
                <CountdownTimer />
            </div>
        </div>
    );
};