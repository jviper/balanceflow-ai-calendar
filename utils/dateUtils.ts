
import addDays from 'date-fns/addDays';
import addHours from 'date-fns/addHours';
import addMinutes from 'date-fns/addMinutes';
import areIntervalsOverlapping from 'date-fns/areIntervalsOverlapping';
import eachDayOfInterval from 'date-fns/eachDayOfInterval';
import eachWeekOfInterval from 'date-fns/eachWeekOfInterval';
import endOfMonth from 'date-fns/endOfMonth';
import endOfWeek from 'date-fns/endOfWeek';
import format from 'date-fns/format';
import isBefore from 'date-fns/isBefore';
import isSameDay from 'date-fns/isSameDay';
import startOfDay from 'date-fns/startOfDay';
import startOfMonth from 'date-fns/startOfMonth';
import startOfWeek from 'date-fns/startOfWeek';
import type { Task } from '../types';

export const getWeekDays = (date: Date) => {
    return eachDayOfInterval({
        start: startOfWeek(date, { weekStartsOn: 1 }),
        end: endOfWeek(date, { weekStartsOn: 1 }),
    });
};

export const getMonthWeeks = (date: Date) => {
    const weeks = eachWeekOfInterval(
        {
            start: startOfMonth(date),
            end: endOfMonth(date),
        },
        { weekStartsOn: 1 }
    );
    return weeks.map(weekStart => getWeekDays(weekStart));
};

export const getDayHours = () => {
    return Array.from({ length: 24 }, (_, i) => i);
};

export const formatDate = (date: Date, formatStr: string) => {
    return format(date, formatStr);
};

export const getTaskEndTime = (task: Task): Date => {
    return addMinutes(new Date(task.startTime), task.duration);
};

export const isToday = (date: Date) => {
    return isSameDay(date, new Date());
};

export const timeToTop = (date: Date): number => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return ((hours * 60 + minutes) / (24 * 60)) * 100;
};

export const durationToHeight = (duration: number): number => {
    return (duration / (24 * 60)) * 100;
};

export { addMinutes, isSameDay, isBefore, addDays, startOfDay, addHours, areIntervalsOverlapping, format, startOfWeek, endOfWeek, startOfMonth, endOfMonth };