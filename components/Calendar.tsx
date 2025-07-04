
import React, { useMemo } from 'react';
import { useTasks } from '../context/TasksContext';
import { getWeekDays, getMonthWeeks, formatDate, isToday, timeToTop, durationToHeight, getTaskEndTime, startOfDay, addHours, areIntervalsOverlapping } from '../utils/dateUtils';
import { Priority, ViewMode } from '../types';
import type { Task, Suggestion, DragItem } from '../types';
import { TaskCard } from './common';

interface CalendarProps {
    currentDate: Date;
    viewMode: ViewMode;
    onEditTask: (task: Task) => void;
}

interface DayViewProps {
    date: Date;
    onEditTask: (task: Task) => void;
    onDrop: (event: React.DragEvent<HTMLDivElement>, date: Date, hour?: number) => void;
}

const DayView: React.FC<DayViewProps> = ({ date, onEditTask, onDrop }) => {
    const { getTasksForDate } = useTasks();
    const tasks = getTasksForDate(date);
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const getOverlappingTasks = (task: Task) => {
        const taskStart = new Date(task.startTime);
        const taskEnd = getTaskEndTime(task);
        return tasks.filter(t => {
            if (t.id === task.id) return false;
            const tStart = new Date(t.startTime);
            const tEnd = getTaskEndTime(t);
            return areIntervalsOverlapping({start: taskStart, end: taskEnd}, {start: tStart, end: tEnd}, {inclusive: true});
        });
    };

    const taskLayout = useMemo(() => {
        const columns: Task[][] = [];
        const processedTasks = new Set<string>();
        
        tasks.forEach(task => {
            if(processedTasks.has(task.id)) return;

            const overlapping = getOverlappingTasks(task);
            const currentColumn = [task, ...overlapping];
            processedTasks.add(task.id);
            overlapping.forEach(t => processedTasks.add(t.id));

            columns.push(currentColumn);
        });
        
        const positions = new Map<string, { left: string, width: string }>();
        tasks.forEach(task => {
            const taskStart = new Date(task.startTime);
            const taskEnd = getTaskEndTime(task);
            
            const competing = tasks.filter(t => t.id !== task.id && areIntervalsOverlapping({start: taskStart, end: taskEnd}, {start: new Date(t.startTime), end: getTaskEndTime(t)}));
            
            positions.set(task.id, { left: '0%', width: '100%' });
        });

        return positions;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tasks]);


    return (
        <div className="relative h-full" onDragOver={handleDragOver} onDrop={(e) => onDrop(e, date)}>
            {hours.map(hour => (
                <div key={hour} className="h-[calc(100%/24)] border-t border-slate-700 flex items-start" onDrop={(e) => { e.stopPropagation(); onDrop(e, date, hour); }} >
                    <span className="text-xs text-slate-500 -mt-2 ml-2">{`${hour}:00`}</span>
                </div>
            ))}
            {tasks.map(task => (
                <div
                    key={task.id}
                    className="absolute w-[95%] left-[2.5%]"
                    style={{
                        top: `${timeToTop(new Date(task.startTime))}%`,
                        height: `${durationToHeight(task.duration)}%`,
                        minHeight: '20px'
                    }}
                >
                    <TaskCard task={task} onClick={() => onEditTask(task)} />
                </div>
            ))}
        </div>
    );
};

interface WeekViewProps {
    date: Date;
    onEditTask: (task: Task) => void;
    onDrop: (event: React.DragEvent<HTMLDivElement>, date: Date) => void;
}
const WeekView: React.FC<WeekViewProps> = ({ date, onEditTask, onDrop }) => {
    const { getTasksForDate, getLoadForDate } = useTasks();
    const weekDays = getWeekDays(date);

    return (
        <div className="grid grid-cols-7 h-full">
            {weekDays.map((day, i) => {
                const tasksForDay = getTasksForDate(day);
                const load = getLoadForDate(day);
                return (
                    <div
                        key={i}
                        className="border-r border-slate-800 p-1 flex flex-col gap-1 overflow-y-auto"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => onDrop(e, day)}
                    >
                        <div className="text-center text-sm font-semibold sticky top-0 bg-slate-900/80 backdrop-blur-sm py-1">
                            <span className="text-slate-400">{formatDate(day, 'EEE')}</span>
                            <p className={`w-10 h-10 mx-auto mt-1 flex items-center justify-center rounded-full ${isToday(day) ? 'bg-teal-500 text-white' : ''}`}>
                                {formatDate(day, 'd')}
                            </p>
                        </div>
                        <div className="flex-1 space-y-1">
                            {tasksForDay.map(task => <TaskCard key={task.id} task={task} onClick={() => onEditTask(task)} />)}
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

interface MonthViewProps {
    date: Date;
    onEditTask: (task: Task) => void;
    onDrop: (event: React.DragEvent<HTMLDivElement>, date: Date) => void;
}

const MonthView: React.FC<MonthViewProps> = ({ date, onEditTask, onDrop }) => {
    const { getTasksForDate } = useTasks();
    const weeks = getMonthWeeks(date);

    return (
        <div className="grid grid-rows-5 h-full flex-col">
            <div className="grid grid-cols-7 border-b border-slate-800">
                {getWeekDays(date).map(day => <div key={formatDate(day, 'EEE')} className="text-center font-bold text-slate-400 p-2">{formatDate(day, 'EEE')}</div>)}
            </div>
            {weeks.map((week, i) => (
                <div key={i} className="grid grid-cols-7 flex-1">
                    {week.map((day, j) => {
                        const tasksForDay = getTasksForDate(day);
                        return (
                            <div
                                key={j}
                                className="border-r border-b border-slate-800 p-1 overflow-hidden flex flex-col"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => onDrop(e, day)}
                            >
                                <span className={`self-end ${isToday(day) ? 'bg-teal-500 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}`}>{formatDate(day, 'd')}</span>
                                <div className="space-y-1 mt-1 overflow-y-auto">
                                  {tasksForDay.slice(0, 2).map(task => <div key={task.id} onClick={() => onEditTask(task)} className="text-xs p-1 rounded bg-teal-500/50 truncate cursor-pointer hover:bg-teal-500/70">{task.title}</div>)}
                                  {tasksForDay.length > 2 && <div className="text-xs text-slate-400 p-1">+{tasksForDay.length - 2} more</div>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};


export const Calendar: React.FC<CalendarProps> = ({ currentDate, viewMode, onEditTask }) => {
    const { updateTask, addTask } = useTasks();
    
    const handleDrop = (event: React.DragEvent<HTMLDivElement>, date: Date, hour?: number) => {
        const dropData = event.dataTransfer.getData('application/json');
        if (!dropData) return;
        
        const item: DragItem = JSON.parse(dropData);

        if (item.type === 'task') {
            const task = item.data as Task;
            const newStartTime = startOfDay(date);
            if(hour !== undefined) {
                newStartTime.setHours(hour);
            } else {
                const oldStartTime = new Date(task.startTime);
                newStartTime.setHours(oldStartTime.getHours(), oldStartTime.getMinutes());
            }
            updateTask({ ...task, startTime: newStartTime.toISOString() });
        } else if (item.type === 'suggestion') {
            const suggestion = item.data as Suggestion;
            const newStartTime = startOfDay(date);
            newStartTime.setHours(hour !== undefined ? hour : 12); // Default to noon if no hour
            
            const newTask: Task = {
                id: crypto.randomUUID(),
                title: suggestion.text,
                startTime: newStartTime.toISOString(),
                duration: suggestion.duration,
                priority: Priority.Low,
                completed: false
            };
            addTask(newTask);
        }
    };
    
    const renderView = () => {
        switch (viewMode) {
            case 'day':
                return <DayView date={currentDate} onEditTask={onEditTask} onDrop={handleDrop} />;
            case 'week':
                return <WeekView date={currentDate} onEditTask={onEditTask} onDrop={handleDrop} />;
            case 'month':
                return <MonthView date={currentDate} onEditTask={onEditTask} onDrop={handleDrop} />;
            default:
                return null;
        }
    };

    return (
        <div className="flex-1 bg-slate-900 flex flex-col overflow-hidden border border-slate-800 rounded-lg">
            {renderView()}
        </div>
    );
};
