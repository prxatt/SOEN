

import React, { useState, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Task, Project, Note, Notebook, Goal, Category, TaskStatus, ScheduleView, ChatMessage } from '../types';
import { PlusCircleIcon, ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon, CalendarIcon } from './Icons';
import { getCategoryColor } from '../constants';
import EventDetail from './EventDetail';
import NewTaskModal from './NewTaskModal';
import { triggerHapticFeedback } from '../utils/haptics';

interface ScheduleProps {
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    projects: Project[];
    notes: Note[];
    notebooks: Notebook[];
    goals: Goal[];
    categories: Category[];
    showToast: (message: string) => void;
    onCompleteTask: (taskId: number, actualDuration: number) => void;
    triggerInsightGeneration: (task: Task, isRegeneration: boolean) => void;
    redirectToKikoAIWithChat: (history: ChatMessage[]) => void;
    addNote: (title: string, content: string, notebookId: number) => void;
    deleteTask: (taskId: number) => void;
    addTask: (task: Partial<Task> & { title: string }) => void;
    onTaskSwap: (draggedId: number, targetId: number) => void;
}

const TaskItem: React.FC<{ task: Task; onSelect: (task: Task) => void; onComplete: () => void; onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: number) => void; onDrop: (e: React.DragEvent<HTMLDivElement>, targetTaskId: number) => void; }> = ({ task, onSelect, onComplete, onDragStart, onDrop }) => {
    const isCompleted = task.status === TaskStatus.Completed;
    
    return (
        <motion.div
            layout
            draggable={!isCompleted}
            // FIX: Cast event to `any` to resolve type mismatch between Framer Motion's gesture events and native HTML drag events.
            onDragStart={(e) => onDragStart(e as any, task.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDrop(e as any, task.id)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`flex items-center gap-4 p-3 rounded-lg transition-all duration-300 ${isCompleted ? '' : 'bg-card hover:shadow-lg cursor-grab'}`}
            style={isCompleted ? { backgroundColor: getCategoryColor(task.category) } : {}}
        >
            <div className={`flex-shrink-0 w-16 text-center ${isCompleted ? 'text-white/80' : ''}`}>
                <p className={`font-bold text-sm ${isCompleted ? 'text-white' : ''}`}>{new Date(task.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
                <p className={`text-xs ${isCompleted ? 'text-white/70' : 'text-text-secondary'}`}>{task.plannedDuration} min</p>
            </div>
            {!isCompleted && <div className="w-1.5 h-full rounded-full" style={{ backgroundColor: getCategoryColor(task.category) }}></div>}
            <div className="flex-grow cursor-pointer" onClick={() => onSelect(task)}>
                <p className={`font-semibold ${isCompleted ? 'line-through text-white' : ''}`}>{task.title}</p>
                <p className={`text-xs ${isCompleted ? 'text-white/70' : 'text-text-secondary'}`}>{task.category}</p>
            </div>
            {!isCompleted &&
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onComplete();
                    }}
                    className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full border-2 transition-colors border-gray-300 dark:border-gray-600 hover:border-accent`}
                >
                </button>
            }
        </motion.div>
    );
};

const MonthView: React.FC<{ tasks: Task[], selectedDate: Date, setSelectedDate: (date: Date) => void, onSelectTask: (task: Task) => void }> = ({ tasks, selectedDate, setSelectedDate, onSelectTask }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

    const daysInMonth = () => new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = () => new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

    const tasksByDate = useMemo(() => {
        return tasks.reduce((acc, task) => {
            const dateStr = new Date(task.startTime).toDateString();
            if (!acc[dateStr]) acc[dateStr] = [];
            acc[dateStr].push(task);
            return acc;
        }, {} as Record<string, Task[]>);
    }, [tasks]);

    const changeMonth = (amount: number) => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + amount, 1));
    };

    const renderCells = () => {
        const cells = [];
        const numDays = daysInMonth();
        const startDay = firstDayOfMonth();
        const today = new Date();

        for (let i = 0; i < startDay; i++) {
            cells.push(<div key={`empty-${i}`} className="p-1 border-r border-b border-border/30"></div>);
        }

        for (let day = 1; day <= numDays; day++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const dateStr = date.toDateString();
            const isToday = dateStr === today.toDateString();
            const isSelected = dateStr === selectedDate.toDateString();
            const dailyTasks = tasksByDate[dateStr] || [];

            cells.push(
                <div key={day} onClick={() => setSelectedDate(date)} className={`p-1 border-r border-b border-border/30 min-h-[80px] transition-colors ${isSelected ? 'bg-accent/10' : 'hover:bg-bg'}`}>
                    <div className={`text-xs font-bold ${isToday ? 'text-accent' : ''}`}>{day}</div>
                    <div className="space-y-0.5 mt-1">
                        {dailyTasks.slice(0, 2).map(task => (
                            <div key={task.id} onClick={(e) => {e.stopPropagation(); onSelectTask(task);}} className="text-xs p-0.5 rounded-sm truncate cursor-pointer" style={{ backgroundColor: getCategoryColor(task.category) + '80' }}>
                                {task.title}
                            </div>
                        ))}
                        {dailyTasks.length > 2 && <div className="text-xs text-text-secondary">+{dailyTasks.length - 2} more</div>}
                    </div>
                </div>
            );
        }
        return cells;
    };

    return (
        <div className="card p-4 rounded-2xl">
            <div className="flex justify-between items-center mb-2">
                <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10"><ChevronLeftIcon className="w-6 h-6"/></button>
                <h3 className="font-semibold text-lg">{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
                <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10"><ChevronRightIcon className="w-6 h-6"/></button>
            </div>
            <div className="grid grid-cols-7 border-t border-l border-border/30">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="text-center text-xs font-bold p-1 border-r border-b border-border/30 text-text-secondary">{day}</div>)}
                {renderCells()}
            </div>
        </div>
    );
};

const Schedule: React.FC<ScheduleProps> = (props) => {
    const { tasks, onCompleteTask, showToast, onTaskSwap } = props;
    const [view, setView] = useState<ScheduleView>('today');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
    const draggedTaskIdRef = useRef<number | null>(null);
    
    const tasksForSelectedDate = useMemo(() => {
        return tasks
            .filter(t => new Date(t.startTime).toDateString() === selectedDate.toDateString())
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    }, [tasks, selectedDate]);
    
    const changeDate = (amount: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + amount);
        setSelectedDate(newDate);
    };

    const handleAddTask = (task: Partial<Task> & { title: string }) => {
        props.addTask(task);
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: number) => {
        draggedTaskIdRef.current = taskId;
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetTaskId: number) => {
        e.preventDefault();
        if (draggedTaskIdRef.current !== null && draggedTaskIdRef.current !== targetTaskId) {
            onTaskSwap(draggedTaskIdRef.current, targetTaskId);
        }
        draggedTaskIdRef.current = null;
    };

    return (
        <div className="h-full">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold font-display">{view === 'today' ? `Today, ${selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}` : 'Schedule'}</h2>
                <div className="flex items-center gap-2">
                     <button onClick={() => setView(v => v === 'today' ? 'month' : 'today')} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                        {view === 'today' ? <CalendarDaysIcon className="w-5 h-5"/> : <CalendarIcon className="w-5 h-5"/>}
                    </button>
                     <button onClick={() => setIsNewTaskModalOpen(true)} className="flex items-center justify-center gap-1.5 text-sm font-semibold py-2 px-4 rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors">
                        <PlusCircleIcon className="w-5 h-5"/> New Task
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={view}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {view === 'today' ? (
                        <div className="card p-4 rounded-2xl">
                            <div className="flex justify-between items-center mb-4">
                                <button onClick={() => changeDate(-1)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10"><ChevronLeftIcon className="w-6 h-6"/></button>
                                <h3 className="font-semibold text-lg text-center">
                                    {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
                                </h3>
                                <button onClick={() => changeDate(1)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10"><ChevronRightIcon className="w-6 h-6"/></button>
                            </div>
                            
                            <div className="space-y-3 min-h-[300px]">
                                {tasksForSelectedDate.length > 0 ? tasksForSelectedDate.map(task => (
                                    <TaskItem 
                                        key={task.id}
                                        task={task}
                                        onSelect={setSelectedTask}
                                        onComplete={() => onCompleteTask(task.id, task.plannedDuration)}
                                        onDragStart={handleDragStart}
                                        onDrop={handleDrop}
                                    />
                                )) : (
                                    <div className="text-center py-16 text-text-secondary">
                                        <p>No tasks scheduled for this day.</p>
                                        <button onClick={() => setIsNewTaskModalOpen(true)} className="mt-2 text-accent font-semibold">Schedule one?</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <MonthView tasks={tasks} selectedDate={selectedDate} setSelectedDate={setSelectedDate} onSelectTask={setSelectedTask} />
                    )}
                </motion.div>
            </AnimatePresence>

             <AnimatePresence>
                {selectedTask && (
                    <EventDetail 
                        task={selectedTask}
                        allTasks={tasks}
                        notes={props.notes}
                        notebooks={props.notebooks}
                        projects={props.projects}
                        goals={props.goals}
                        categories={props.categories}
                        updateTask={(updatedTask) => {
                            props.setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
                            setSelectedTask(updatedTask);
                        }}
                        onComplete={() => {
                            onCompleteTask(selectedTask.id, selectedTask.plannedDuration);
                            setSelectedTask(null);
                        }}
                        onClose={() => setSelectedTask(null)}
                        redirectToKikoAIWithChat={props.redirectToKikoAIWithChat}
                        addNote={props.addNote}
                        triggerInsightGeneration={props.triggerInsightGeneration}
                        deleteTask={props.deleteTask}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isNewTaskModalOpen && (
                    <NewTaskModal 
                        onClose={() => setIsNewTaskModalOpen(false)}
                        addTask={handleAddTask}
                        selectedDate={selectedDate}
                        projects={props.projects}
                        notes={props.notes}
                        categories={props.categories}
                        showToast={props.showToast}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default Schedule;