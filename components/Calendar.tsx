import React, { useState } from 'react';
import { useTasks } from '../context/TasksContext';
import { getWeekDays, getMonthWeeks, formatDate, isToday, timeToTop, durationToHeight, startOfDay, isSameDay } from '../utils/dateUtils';
import { ViewMode } from '../types';
import type { Task, DragItem } from '../types';
import { TaskCard } from './common';

interface CalendarProps {
    currentDate: Date;
    viewMode: ViewMode;
    onEditTask: (task: Task) => void;
    onEnterFocus: (task: Task) => void;
}

interface ViewProps {
    onEditTask: (task: Task) => void;
    onDrop: (event: React.DragEvent<HTMLDivElement>, date: Date, hour?: number) => void;
    onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
    onDragEnter: (event: React.DragEvent<HTMLDivElement>, date: Date, hour?: number) => void;
    onDragLeave: (event: React.DragEvent<HTMLDivElement>) => void;
    dragOverInfo: { date: Date, hour?: number } | null;
    onEnterFocus: (task: Task) => void;
}

interface DayViewProps extends ViewProps {
    date: Date;
}

const DayView: React.FC<DayViewProps> = ({ date, onEditTask, onDrop, onDragOver, onDragEnter, onDragLeave, dragOverInfo, onEnterFocus }) => {
    const { getTasksForDate } = useTasks();
    const tasks = getTasksForDate(date);
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return (
        <div 
            className="relative h-full" 
            onDragOver={onDragOver}
            onDragLeave={onDragLeave} 
            onDrop={(e) => onDrop(e, date)}
            onDragEnter={(e) => onDragEnter(e, date)}
        >
            {hours.map(hour => {
                const isDragOver = dragOverInfo && isSameDay(dragOverInfo.date, date) && dragOverInfo.hour === hour;
                return (
                    <div 
                        key={hour} 
                        className={`h-[calc(100%/24)] border-t border-slate-700/50 flex items-start transition-colors ${isDragOver ? 'bg-teal-500/20' : ''}`} 
                        onDragEnter={(e) => { e.stopPropagation(); onDragEnter(e, date, hour); }}
                        onDrop={(e) => { e.stopPropagation(); onDrop(e, date, hour); }} 
                    >
                        <span className="text-xs text-slate-500 -mt-2 ml-2">{`${hour}:00`}</span>
                    </div>
                );
            })}
            {tasks.map(task => {
                if (!task.startTime) return null;
                
                const card = <TaskCard task={task} onClick={() => !task.isHoliday && onEditTask(task)} onEnterFocus={onEnterFocus} />;

                if (task.duration >= 1440) {
                    return (
                        <div key={task.instanceId || task.id} className="absolute w-full top-0 left-0 px-1 z-10">
                             {card}
                        </div>
                    )
                }
                return (
                    <div
                        key={task.instanceId || task.id}
                        className="absolute w-[95%] left-[2.5%]"
                        style={{
                            top: `${timeToTop(new Date(task.startTime))}%`,
                            height: `${durationToHeight(task.duration)}%`,
                            minHeight: '20px'
                        }}
                    >
                        {card}
                    </div>
                )
            })}
        </div>
    );
};

interface WeekViewProps extends ViewProps {
    date: Date;
}
const WeekView: React.FC<WeekViewProps> = ({ date, onEditTask, onDrop, onDragOver, onDragEnter, onDragLeave, dragOverInfo, onEnterFocus }) => {
    const { getTasksForDate, getLoadForDate } = useTasks();
    const weekDays = getWeekDays(date);

    return (
        <div className="grid grid-cols-7 h-full" onDragLeave={onDragLeave}>
            {weekDays.map((day, i) => {
                const tasksForDay = getTasksForDate(day);
                const load = getLoadForDate(day);
                const isDragOver = dragOverInfo && isSameDay(dragOverInfo.date, day);
                return (
                    <div
                        key={i}
                        className={`border-r border-slate-800/50 p-1 flex flex-col gap-1 overflow-y-auto transition-colors ${isDragOver ? 'bg-slate-700/50' : ''}`}
                        onDragOver={onDragOver}
                        onDrop={(e) => onDrop(e, day)}
                        onDragEnter={(e) => onDragEnter(e, day)}
                    >
                        <div className="text-center text-sm font-semibold sticky top-0 bg-slate-900/50 backdrop-blur-sm py-1 z-20">
                            <span className="text-slate-400">{formatDate(day, 'EEE')}</span>
                            <p className={`w-10 h-10 mx-auto mt-1 flex items-center justify-center rounded-full ${isToday(day) ? 'bg-teal-500 text-white' : ''}`}>
                                {formatDate(day, 'd')}
                            </p>
                        </div>
                        <div className="flex-1 space-y-1">
                            {tasksForDay.map(task => <TaskCard key={task.instanceId || task.id} task={task} onClick={() => !task.isHoliday && onEditTask(task)} onEnterFocus={onEnterFocus} />)}
                        </div>
                        <div className="h-1 w-full bg-slate-700 rounded-full mt-auto">
                            <div className="h-1 bg-teal-500 rounded-full" style={{ width: `${load * 100}%` }}></div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

interface MonthViewProps extends Omit<ViewProps, 'onEnterFocus'> {
    date: Date;
}

const MonthView: React.FC<MonthViewProps> = ({ date, onEditTask, onDrop, onDragOver, onDragEnter, onDragLeave, dragOverInfo }) => {
    const { getTasksForDate } = useTasks();
    const weeks = getMonthWeeks(date);

    return (
        <div className="grid grid-rows-5 h-full flex-col" onDragLeave={onDragLeave}>
            <div className="grid grid-cols-7 border-b border-slate-800/50">
                {getWeekDays(date).map(day => <div key={formatDate(day, 'EEE')} className="text-center font-bold text-slate-400 p-2">{formatDate(day, 'EEE')}</div>)}
            </div>
            {weeks.map((week, i) => (
                <div key={i} className="grid grid-cols-7 flex-1">
                    {week.map((day, j) => {
                        const tasksForDay = getTasksForDate(day);
                        const isDragOver = dragOverInfo && isSameDay(dragOverInfo.date, day);
                        return (
                            <div
                                key={j}
                                className={`border-r border-b border-slate-800/50 p-1 overflow-hidden flex flex-col transition-colors ${isDragOver ? 'bg-slate-700/50' : ''}`}
                                onDragOver={onDragOver}
                                onDrop={(e) => onDrop(e, day)}
                                onDragEnter={(e) => onDragEnter(e, day)}
                            >
                                <span className={`self-end ${isToday(day) ? 'bg-teal-500 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}`}>{formatDate(day, 'd')}</span>
                                <div className="space-y-1 mt-1 overflow-y-auto">
                                  {tasksForDay.map(task => (
                                    <div 
                                        key={task.instanceId || task.id} 
                                        onClick={() => !task.isHoliday && onEditTask(task)} 
                                        className={`text-xs p-1 rounded truncate ${!task.isHoliday ? 'cursor-pointer' : ''} ${task.isHoliday ? 'bg-indigo-500/50 text-indigo-300 text-center font-semibold' : 'bg-teal-500/50 hover:bg-teal-500/70'}`}
                                    >
                                        {task.title}
                                    </div>
                                  ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};


export const Calendar: React.FC<CalendarProps> = ({ currentDate, viewMode, onEditTask, onEnterFocus }) => {
    const { updateTask, addTasks, scheduleUnscheduledTask } = useTasks();
    const [dragOverInfo, setDragOverInfo] = useState<{ date: Date, hour?: number } | null>(null);

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const types = event.dataTransfer.types;
        if (types.includes('application/json')) {
            event.dataTransfer.dropEffect = "move";
        }
    };

    const handleDragEnter = (event: React.DragEvent<HTMLDivElement>, date: Date, hour?: number) => {
        event.preventDefault();
        const types = event.dataTransfer.types;
        if (types.includes('application/json')) {
             setDragOverInfo({ date, hour });
        }
    };

    const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        // This check prevents flickering when moving over child elements inside a drop zone
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            setDragOverInfo(null);
        }
    };
    
    const handleDrop = (event: React.DragEvent<HTMLDivElement>, date: Date, hour?: number) => {
        event.preventDefault();
        setDragOverInfo(null); // Clear visual feedback
        const dropData = event.dataTransfer.getData('application/json');
        if (!dropData) return;
        
        const item: DragItem = JSON.parse(dropData);
        const newStartTime = startOfDay(date);

        if (item.type === 'task') {
            const task = item.data as Task;
            // When dropping an existing task:
            // 1. Use the specific hour if dropped in Day view.
            // 2. Otherwise, keep the task's original time of day on the new date.
            if (hour !== undefined) {
                newStartTime.setHours(hour);
            } else if (task.startTime) {
                const oldStartTime = new Date(task.startTime);
                newStartTime.setHours(oldStartTime.getHours(), oldStartTime.getMinutes());
            } else {
                newStartTime.setHours(9, 0, 0, 0); // Default for tasks that somehow lost their time
            }
            updateTask({ ...task, startTime: newStartTime.toISOString(), recurrence: 'none' });
        } else if (item.type === 'suggestion' || item.type === 'unscheduled_task') {
            // For new items, use the drop hour or default to 9 AM
            newStartTime.setHours(hour ?? 9, 0, 0, 0);
            
            if (item.type === 'suggestion') {
                const partialTask = item.data as Partial<Task>;
                const newTask: Task = {
                    id: crypto.randomUUID(),
                    completed: false,
                    ...partialTask,
                    startTime: newStartTime.toISOString(),
                } as Task;
                addTasks([newTask], []);
            } else { // unscheduled_task
                const task = item.data as Task;
                scheduleUnscheduledTask(task, newStartTime.toISOString());
            }
        }
    };
    
    const renderView = () => {
        const viewProps = {
            onEditTask,
            onDrop: handleDrop,
            onDragOver: handleDragOver,
            onDragEnter: handleDragEnter,
            onDragLeave: handleDragLeave,
            dragOverInfo,
            onEnterFocus,
        };
        switch (viewMode) {
            case ViewMode.Day:
                return <DayView date={currentDate} {...viewProps} />;
            case ViewMode.Week:
                return <WeekView date={currentDate} {...viewProps} />;
            case ViewMode.Month:
                // Month view is for overview, so focus mode isn't initiated from here
                const { onEnterFocus, ...monthViewProps } = viewProps;
                return <MonthView date={currentDate} {...monthViewProps} />;
            default:
                return null;
        }
    };

    return (
        <div className="flex-1 bg-slate-900/70 backdrop-blur-lg flex flex-col overflow-hidden border border-slate-800/50 rounded-lg">
            {renderView()}
        </div>
    );
};