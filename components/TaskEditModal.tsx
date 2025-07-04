import React, { useState } from 'react';
import { Priority, Recurrence } from '../types';
import type { Task } from '../types';
import { useTasks } from '../context/TasksContext';
import { formatDate } from '../utils/dateUtils';

interface TaskEditModalProps {
    task: Task;
    onClose: () => void;
}

export const TaskEditModal: React.FC<TaskEditModalProps> = ({ task, onClose }) => {
    const [editedTask, setEditedTask] = useState<Task>(task);
    const { updateTask, deleteTask } = useTasks();

    const handleSave = () => {
        updateTask(editedTask);
        onClose();
    };

    const handleDelete = () => {
        deleteTask(task.instanceId || task.id);
        onClose();
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (editedTask.startTime) {
            if (name === 'date') {
                const newDate = new Date(value);
                const oldDate = new Date(editedTask.startTime);
                newDate.setHours(oldDate.getHours(), oldDate.getMinutes());
                setEditedTask({ ...editedTask, startTime: newDate.toISOString() });
            } else if (name === 'time') {
                const [hours, minutes] = value.split(':');
                const newDate = new Date(editedTask.startTime);
                newDate.setHours(parseInt(hours), parseInt(minutes));
                setEditedTask({ ...editedTask, startTime: newDate.toISOString() });
            } else {
                 setEditedTask({ ...editedTask, [name]: name === 'duration' || name === 'reminder' ? parseInt(value) : value });
            }
        } else {
             setEditedTask({ ...editedTask, [name]: name === 'duration' || name === 'reminder' ? parseInt(value) : value });
        }
    };

    const isRecurringInstance = !!task.instanceId;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-slate-800/80 backdrop-blur-xl p-6 rounded-lg shadow-xl w-full max-w-md border border-slate-700">
                <h2 className="text-xl font-bold mb-4 text-white">Edit Task</h2>
                
                {isRecurringInstance && (
                    <div className="bg-yellow-500/20 text-yellow-300 text-sm p-3 rounded-md mb-4">
                        You are editing a recurring task. Changes will apply to all instances.
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Title</label>
                        <input type="text" name="title" value={editedTask.title} onChange={handleChange} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                        <textarea name="description" value={editedTask.description || ''} onChange={handleChange} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md h-20 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                    {editedTask.startTime && (
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-slate-400 mb-1">Date</label>
                                <input type="date" name="date" value={formatDate(new Date(editedTask.startTime), 'yyyy-MM-dd')} onChange={handleChange} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-slate-400 mb-1">Time</label>
                                <input type="time" name="time" value={formatDate(new Date(editedTask.startTime), 'HH:mm')} onChange={handleChange} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" />
                            </div>
                        </div>
                    )}
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-400 mb-1">Duration (min)</label>
                            <input type="number" name="duration" value={editedTask.duration} onChange={handleChange} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-400 mb-1">Priority</label>
                            <select name="priority" value={editedTask.priority} onChange={handleChange} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500">
                                {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Recurrence</label>
                        <select name="recurrence" value={editedTask.recurrence} onChange={handleChange} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500">
                            {Object.values(Recurrence).map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Reminder</label>
                        <select name="reminder" value={editedTask.reminder || 0} onChange={handleChange} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500">
                            <option value={0}>No reminder</option>
                            <option value={5}>5 minutes before</option>
                            <option value={10}>10 minutes before</option>
                            <option value={30}>30 minutes before</option>
                            <option value={60}>1 hour before</option>
                        </select>
                    </div>
                </div>

                <div className="mt-6 flex justify-between">
                    <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white font-bold rounded-md hover:bg-red-700 transition-colors">
                        Delete
                    </button>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 bg-slate-600 text-white font-bold rounded-md hover:bg-slate-700 transition-colors">
                            Cancel
                        </button>
                        <button onClick={handleSave} className="px-4 py-2 bg-teal-500 text-white font-bold rounded-md hover:bg-teal-600 transition-colors">
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};