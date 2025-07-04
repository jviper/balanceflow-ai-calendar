import { startOfDay } from './dateUtils';
import { Task, Priority, Recurrence } from '../types';

// Helper to find the Nth occurrence of a weekday in a month.
// dayOfWeek: 0=Sun, 1=Mon, ..., 6=Sat
const getNthDayOfMonth = (n: number, dayOfWeek: number, month: number, year: number): Date => {
    const d = new Date(year, month, 1);
    let count = 0;
    while (count < n) {
        if (d.getDay() === dayOfWeek) {
            count++;
        }
        if (count < n) {
            d.setDate(d.getDate() + 1);
        }
    }
    return d;
};

// Helper to find the last occurrence of a weekday in a month.
const getLastDayOfMonth = (dayOfWeek: number, month: number, year: number): Date => {
    const d = new Date(year, month + 1, 0); // Last day of the given month
    while (d.getDay() !== dayOfWeek) {
        d.setDate(d.getDate() - 1);
    }
    return d;
};

const createHolidayTask = (year: number, title: string, date: Date): Task => ({
    id: `holiday-${title.toLowerCase().replace(/\s+/g, '-')}-${year}`,
    title,
    startTime: startOfDay(date).toISOString(),
    duration: 1440, // Full day
    priority: Priority.High,
    isHoliday: true,
    completed: false,
    recurrence: Recurrence.None,
});

export const getUSFederalHolidays = (year: number): Task[] => {
    const holidays: Task[] = [];

    // Jan 1 – New Year's Day
    holidays.push(createHolidayTask(year, "New Year's Day", new Date(year, 0, 1)));

    // 3rd Mon Jan – MLK Jr. Day
    holidays.push(createHolidayTask(year, 'Martin Luther King, Jr. Day', getNthDayOfMonth(3, 1, 0, year)));

    // 3rd Mon Feb – Presidents' Day
    holidays.push(createHolidayTask(year, "Presidents' Day", getNthDayOfMonth(3, 1, 1, year)));

    // Last Mon May – Memorial Day
    holidays.push(createHolidayTask(year, 'Memorial Day', getLastDayOfMonth(1, 4, year)));

    // July 4 – Independence Day
    holidays.push(createHolidayTask(year, 'Independence Day', new Date(year, 6, 4)));

    // 1st Mon Sept – Labor Day
    holidays.push(createHolidayTask(year, 'Labor Day', getNthDayOfMonth(1, 1, 8, year)));

    // 2nd Mon Oct – Columbus Day
    holidays.push(createHolidayTask(year, 'Columbus Day', getNthDayOfMonth(2, 1, 9, year)));

    // Nov 11 – Veterans Day
    holidays.push(createHolidayTask(year, 'Veterans Day', new Date(year, 10, 11)));

    // 4th Thurs Nov – Thanksgiving
    holidays.push(createHolidayTask(year, 'Thanksgiving Day', getNthDayOfMonth(4, 4, 10, year)));

    // Dec 25 – Christmas
    holidays.push(createHolidayTask(year, 'Christmas Day', new Date(year, 11, 25)));

    return holidays;
};