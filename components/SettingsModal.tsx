import React, { useState, useRef, useEffect } from 'react';
import { useTasks } from '../context/TasksContext';
import { useLocalStorage } from '../context/TasksContext';
import { useSettings } from '../context/SettingsContext';
import type { BackgroundMode } from '../types';

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
);

const timeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 5) return "just now";
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "just now";
};

export const SettingsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { backupData, restoreData } = useTasks();
    const { backgroundMode, setBackgroundMode } = useSettings();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Simulated Cloud Sync State
    const [isSyncEnabled, setIsSyncEnabled] = useLocalStorage('balanceflow-sync-enabled', false);
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
    const [lastSync, setLastSync] = useLocalStorage<string | null>('balanceflow-last-sync', null);

    useEffect(() => {
        const interval = setInterval(() => {
            // Force re-render to update time-ago text
            if (lastSync) {
                setLastSync(prev => prev);
            }
        }, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [lastSync, setLastSync]);


    const handleBackup = () => {
        try {
            const jsonString = backupData();
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `balanceflow_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setMessage({ type: 'success', text: 'Backup created successfully.' });
        } catch (error) {
            console.error("Backup failed:", error);
            setMessage({ type: 'error', text: 'Failed to create backup.' });
        }
    };

    const handleRestoreClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const jsonString = event.target?.result as string;
                restoreData(jsonString);
                setMessage({ type: 'success', text: 'Data restored successfully.' });
            } catch (error: any) {
                console.error("Restore failed:", error);
                setMessage({ type: 'error', text: error.message || 'Failed to restore data from file.' });
            } finally {
                // Reset file input
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        };
        reader.readAsText(file);
    };
    
    const handleSyncNow = () => {
        setSyncStatus('syncing');
        setTimeout(() => {
            setSyncStatus('success');
            setLastSync(new Date().toISOString());
            setTimeout(() => setSyncStatus('idle'), 2000);
        }, 1500); // Simulate network delay
    };

    const getSyncStatusText = () => {
        if (!isSyncEnabled) return "Sync is disabled.";
        if (syncStatus === 'syncing') return "Syncing...";
        if (lastSync) return `Last sync: ${timeAgo(new Date(lastSync))}`;
        return "Not synced yet.";
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800/80 backdrop-blur-xl p-6 rounded-lg shadow-xl w-full max-w-lg relative border border-slate-700">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Settings</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <CloseIcon />
                    </button>
                </div>
                
                {message && (
                    <div className={`p-3 rounded-md mb-4 text-sm ${message.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                       {message.text}
                       <button onClick={() => setMessage(null)} className="float-right font-bold">X</button>
                    </div>
                )}

                <div className="space-y-6">
                    {/* Background Visuals */}
                     <div className="p-4 bg-slate-900/50 rounded-lg">
                        <h3 className="font-semibold text-white mb-2">Background Visuals</h3>
                        <p className="text-sm text-slate-400 mb-4">Choose a visual style for the app background.</p>
                        <div className="flex flex-col gap-2">
                            {(['off', 'static', 'live'] as BackgroundMode[]).map(mode => (
                                <label key={mode} className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-md cursor-pointer hover:bg-slate-700 transition-colors">
                                    <input
                                        type="radio"
                                        name="background-mode"
                                        value={mode}
                                        checked={backgroundMode === mode}
                                        onChange={() => setBackgroundMode(mode)}
                                        className="w-4 h-4 text-teal-500 bg-slate-600 border-slate-500 focus:ring-teal-500 focus:ring-offset-slate-800"
                                    />
                                    <span className="capitalize text-slate-200">{mode === 'off' ? 'Off (Performance)' : mode}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Data Management */}
                    <div className="p-4 bg-slate-900/50 rounded-lg">
                        <h3 className="font-semibold text-white mb-2">Backup & Restore</h3>
                        <p className="text-sm text-slate-400 mb-4">Save your data to a file or restore it from a backup. This is useful for transferring data between browsers or devices.</p>
                        <div className="flex gap-4">
                             <button onClick={handleBackup} className="flex-1 px-4 py-2 bg-teal-500 text-white font-bold rounded-md hover:bg-teal-600 transition-colors">
                                Backup Data
                            </button>
                             <button onClick={handleRestoreClick} className="flex-1 px-4 py-2 bg-slate-600 text-white font-bold rounded-md hover:bg-slate-700 transition-colors">
                                Restore from File
                            </button>
                            <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                        </div>
                    </div>

                    {/* Cloud Sync */}
                    <div className="p-4 bg-slate-900/50 rounded-lg">
                         <h3 className="font-semibold text-white mb-2">Cloud Sync (Optional)</h3>
                         <p className="text-sm text-slate-400 mb-4">Automatically back up your data to the cloud. (This is a simulated feature)</p>
                         <div className="flex items-center justify-between bg-slate-700/50 p-3 rounded-md">
                            <label htmlFor="sync-toggle" className="font-medium text-slate-200">Enable Cloud Sync</label>
                            <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                <input 
                                    type="checkbox" 
                                    id="sync-toggle" 
                                    checked={isSyncEnabled} 
                                    onChange={() => setIsSyncEnabled(!isSyncEnabled)} 
                                    className="peer toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 border-slate-600 appearance-none cursor-pointer transition-transform duration-200 ease-in-out peer-checked:translate-x-4 peer-checked:border-teal-500"
                                />
                                <label 
                                    htmlFor="sync-toggle" 
                                    className="toggle-label block overflow-hidden h-6 rounded-full bg-slate-600 cursor-pointer transition-colors duration-200 ease-in-out peer-checked:bg-teal-500"
                                >
                                </label>
                            </div>
                         </div>
                         <div className="mt-4 flex items-center justify-between">
                            <p className="text-sm text-slate-400">{getSyncStatusText()}</p>
                            <button onClick={handleSyncNow} disabled={!isSyncEnabled || syncStatus === 'syncing'} className="px-4 py-2 text-sm bg-teal-500 text-white font-bold rounded-md hover:bg-teal-600 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors">
                                {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
                            </button>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};