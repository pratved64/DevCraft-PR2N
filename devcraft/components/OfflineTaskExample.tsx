'use client';

import { useState, useEffect } from 'react';
import { dbOps } from '@/lib/db';
import { Wifi, WifiOff, Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface Task {
    id: string;
    title: string;
    completed: boolean;
    synced: boolean;
    createdAt: number;
}

export default function OfflineTaskExample() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [isOnline, setIsOnline] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    // Initial load from IndexedDB
    useEffect(() => {
        loadTasks();

        // Network status listeners
        const updateOnlineStatus = () => setIsOnline(navigator.onLine);
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);

        // Initial check
        setIsOnline(navigator.onLine);

        return () => {
            window.removeEventListener('online', updateOnlineStatus);
            window.removeEventListener('offline', updateOnlineStatus);
        };
    }, []);

    const loadTasks = async () => {
        try {
            const storedTasks = await dbOps.getAll();
            setTasks(storedTasks);
        } catch (error) {
            console.error('Failed to load tasks:', error);
        }
    };

    const addTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        const newTask: Task = {
            id: crypto.randomUUID(),
            title: newTaskTitle,
            completed: false,
            synced: false,
            createdAt: Date.now(),
        };

        // Optimistic UI update
        setTasks(prev => [...prev, newTask]);
        setNewTaskTitle('');

        // Persist to local DB
        await dbOps.put(newTask);

        // Try to sync if online
        if (isOnline) {
            syncTask(newTask);
        }
    };

    const syncTask = async (task: Task) => {
        setIsSyncing(true);
        try {
            // Simulate backend API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            const updatedTask = { ...task, synced: true };

            // Update local DB
            await dbOps.put(updatedTask);

            // Update UI
            setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
        } catch (error) {
            console.error('Sync failed:', error);
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="p-6 max-w-md mx-auto bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Offline Tasks</h2>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${isOnline
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                    {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                    {isOnline ? 'Online' : 'Offline'}
                </div>
            </div>

            <form onSubmit={addTask} className="flex gap-2 mb-6">
                <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Add a new task..."
                    className="flex-1 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
                <button
                    type="submit"
                    disabled={!newTaskTitle.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Add
                </button>
            </form>

            <div className="space-y-3">
                {tasks.length === 0 ? (
                    <p className="text-center text-zinc-500 dark:text-zinc-400 py-4">No tasks yet</p>
                ) : (
                    tasks.map(task => (
                        <div
                            key={task.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800"
                        >
                            <span className="text-zinc-700 dark:text-zinc-300">{task.title}</span>
                            <div className="flex items-center gap-2" title={task.synced ? "Synced with backend" : "Pending sync"}>
                                {task.synced ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                ) : (
                                    <div className="relative">
                                        {isSyncing && !task.synced ? (
                                            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                                        ) : (
                                            <div className="w-5 h-5 rounded-full border-2 border-dashed border-zinc-400" />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
                    Tasks are instantly saved to IndexedDB.
                    <br />
                    Updates sync when online.
                </p>
            </div>
        </div>
    );
}
