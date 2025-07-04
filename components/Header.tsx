
import React from 'react';
import { formatDate } from '../utils/dateUtils';
import { ViewMode } from '../types';

interface HeaderProps {
    currentDate: Date;
    viewMode: ViewMode;
    onSetViewMode: (view: ViewMode) => void;
    onPrev: () => void;
    onNext: () => void;
    onToday: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentDate, viewMode, onSetViewMode, onPrev, onNext, onToday }) => {
    const viewModes: ViewMode[] = [ViewMode.Day, ViewMode.Week, ViewMode.Month];
    const dateFormat = viewMode === 'month' ? 'MMMM yyyy' : 'MMMM d, yyyy';

    return (
        <header className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 text-slate-200">
            <div className="flex items-center gap-2 md:gap-4">
                <h1 className="text-xl md:text-2xl font-bold text-white">
                  <span className="text-teal-400">Balance</span>Flow
                </h1>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
                 <button onClick={onToday} className="px-3 py-1 text-sm border border-slate-600 rounded-md hover:bg-slate-700">Today</button>
                <div className="flex items-center">
                    <button onClick={onPrev} className="p-2 rounded-md hover:bg-slate-700">&lt;</button>
                    <span className="w-36 text-center font-semibold text-white">{formatDate(currentDate, dateFormat)}</span>
                    <button onClick={onNext} className="p-2 rounded-md hover:bg-slate-700">&gt;</button>
                </div>
            </div>

            <div className="hidden md:flex items-center gap-1 bg-slate-800 p-1 rounded-md">
                {viewModes.map(mode => (
                    <button
                        key={mode}
                        onClick={() => onSetViewMode(mode)}
                        className={`px-3 py-1 text-sm rounded capitalize ${viewMode === mode ? 'bg-teal-500 text-white' : 'hover:bg-slate-700'}`}
                    >
                        {mode}
                    </button>
                ))}
            </div>
        </header>
    );
};
