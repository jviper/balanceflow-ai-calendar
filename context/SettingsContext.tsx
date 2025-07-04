import React, { createContext, useContext, ReactNode } from 'react';
import { useLocalStorage } from './TasksContext';
import type { BackgroundMode } from '../types';

interface SettingsContextType {
    backgroundMode: BackgroundMode;
    setBackgroundMode: (mode: BackgroundMode) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [backgroundMode, setBackgroundMode] = useLocalStorage<BackgroundMode>('balanceflow-background-mode', 'static');

    return (
        <SettingsContext.Provider value={{ backgroundMode, setBackgroundMode }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = (): SettingsContextType => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
