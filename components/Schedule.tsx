import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Task, Project, Note, Notebook, Goal, Category, TaskStatus, ScheduleView, ChatMessage } from '../types';
import { PlusCircleIcon, ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon, CalendarIcon, CheckCircleIcon, ArrowUturnLeftIcon, PlusIcon } from './Icons';
import EventDetail from './EventDetail';
import NewTaskModal from './NewTaskModal';

interface ScheduleProps {
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    projects: Project[];
    notes: Note[];
    notebooks: Notebook[];
    goals: Goal[];
    categories: Category[];
    categoryColors: Record<Category, string>;
    showToast: (message: string) => void;
    onCompleteTask: (taskId: number, actualDuration: number) => void;
    onUndoCompleteTask: (task: Task) => void;
    triggerInsightGeneration: (task: Task, isRegeneration: boolean) => void;
    redirectToKikoAIWithChat: (history: ChatMessage[]) => void;
    addNote: (title: string, content: string, notebookId: number) => void;
    deleteTask: (taskId: number) => void;
    addTask: (task: Partial<Task> & { title: string }) => void;
    onTaskSwap: (draggedId: number, targetId: number) => void;
    onAddNewCategory: (name: string) => boolean;
}

const getTextColorForBackground = (hexColor: string): 'black' | 'white' => {
    if (!hexColor.startsWith('#')) return 'black';
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? 'black' : 'white';
};


const TaskCard: React.FC<{ task: Task; categoryColors: Record<Category, string>; onSelect: (task: Task) => void;}> = ({ task, categoryColors, onSelect }) => {
    const categoryColor = categoryColors[task.category] || '#6B7280';
    const textColor = getTextColorForBackground(categoryColor);
    const startTime = new Date(task.startTime);
    const endTime = new Date(startTime.getTime() + task.plannedDuration * 60000);
    const isCompleted = task.status === TaskStatus.Completed;

    return (
        <motion.div
            layoutId={`task-card-${task.id}`}
            onClick={() => onSelect(task)}
            animate={{ opacity: isCompleted ? 0.6 : 1 }}
            className="p-4 rounded-3xl cursor-pointer"
            style={{ backgroundColor: categoryColor, color: textColor }}
        >
            <div className="flex justify-between items-start">
                <div className="w-3/4">
                     <h3 className="text-2xl font-bold relative inline-block">{task.title}
                        <AnimatePresence>
                        {isCompleted && (
                            <motion.div
                              className="absolute top-1/2 left-0 w-full h-0.5 bg-current"
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: 1, transition: { duration: 0.4, ease: 'circOut' } }}
                              exit={{ scaleX: 0 }}
                              style={{ originX: 0 }}
                            />
                        )}
                        </AnimatePresence>
                    </h3>
                </div>
                <div className="flex -space-x-2">
                    <img className="w-8 h-8 rounded-full object-cover" style={{ borderWidth: '2px', borderColor: textColor }} src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=2080&auto=format&fit=crop" alt="user 1" />
                    <img className="w-8 h-8 rounded-full object-cover" style={{ borderWidth: '2px', borderColor: textColor }} src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=2080&auto=format&fit=crop" alt="user 2" />
                </div>
            </div>
            <div className={`mt-6 pt-4 border-t border-black/20 flex justify-between items-center`}>
                <div className="text-center">
                    <p className="font-semibold">{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-sm opacity-80">Start</p>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-sm font-semibold`} style={{ backgroundColor: 'rgba(0,0,0,0.15)', color: textColor }}>
                    {task.plannedDuration} Min
                </div>
                <div className="text-center">
                    <p className="font-semibold">{endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-sm opacity-80">End</p>
                </div>
            </div>
        </motion.div>
    );
};

const TodayView: React.FC<{ selectedDate: Date; changeDate: (amount: number); tasks: Task[]; categoryColors: Record<Category, string>; onSelectTask: (task: Task) => void; }> = ({ selectedDate, changeDate, tasks, categoryColors, onSelectTask }) => {
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const monthNum = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const month = selectedDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    return (
        <div>
            <div className="flex mb-8">
                <div className="flex-grow">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-medium text-text-secondary">{dayOfWeek}</h3>
                        <div className="flex items-center gap-1">
                            <button onClick={() => changeDate(-1)} className="p-1 rounded-full hover:bg-card"><ChevronLeftIcon className="w-5 h-5"/></button>
                            <button onClick={() => changeDate(1)} className="p-1 rounded-full hover:bg-card"><ChevronRightIcon className="w-5 h-5"/></button>
                        </div>
                    </div>
                    <div className="flex items-end gap-4 mt-1">
                        <p className="text-7xl font-bold font-display tracking-tighter leading-none">{day}.{monthNum}</p>
                        <p className="text-7xl font-bold font-display tracking-tight leading-none text-text-secondary">{month}</p>
                    </div>
                </div>
                <div className="border-l border-border pl-4 flex-shrink-0 flex flex-col justify-center">
                    <div className="text-right">
                        <p className="font-semibold text-lg">{currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        <p className="text-sm text-text-secondary">San Francisco</p>
                    </div>
                    <div className="text-right mt-4">
                        <p className="font-semibold text-lg">{currentTime.toLocaleTimeString([], {timeZone: 'Europe/London', hour: '2-digit', minute:'2-digit'})}</p>
                        <p className="text-sm text-text-secondary">United Kingdom</p>
                    </div>
                </div>
            </div>

            <div>
                <h4 className="font-semibold mb-4">Today's tasks</h4>
                {tasks.length > 0 ? (
                    <div className="space-y-4">
                        {tasks.map(task => <TaskCard key={task.id} task={task} categoryColors={categoryColors} onSelect={onSelectTask} />)}
                    </div>
                ) : (
                     <div className="text-center py-16 text-text-secondary rounded-2xl bg-card">
                        <p>Nothing scheduled for today.</p>
                     </div>
                )}
            </div>
        </div>
    );
};


const MiniTimeline: React.FC<{ tasks: Task[]; textColor: string; date: Date; onAddTask: (date: Date, hour: number) => void; categoryColors: Record<Category, string> }> = ({ tasks, textColor, date, onAddTask, categoryColors }) => {
    const tasksByHour = useMemo(() => {
        const groups: Record<number, Task[]> = {};
        tasks.forEach(task => {
            const hour = new Date(task.startTime).getHours();
            if (!groups[hour]) groups[hour] = [];
            groups[hour].push(task);
        });
        return groups;
    }, [tasks]);
    
    const visibleHours = [];
    const displayStartHour = 5; // 5 AM
    const displayEndHour = 23;  // 11 PM (slot ends at 12 AM)

    for (let i = displayStartHour; i <= displayEndHour; i++) {
        visibleHours.push(i);
    }

    return (
        <div className="flex h-full gap-2 pl-4 -mr-4 overflow-x-auto pb-2">
            {visibleHours.map(hour => (
                <div key={hour} className="flex flex-col items-center flex-shrink-0 w-24">
                    <div className="text-center border-b w-full pb-1" style={{ borderColor: `${textColor}40`}}>
                        <span className="text-xs font-semibold">{hour % 12 === 0 ? 12 : hour % 12}{hour < 12 ? ' am' : ' pm'}</span>
                    </div>
                    <div className="flex-grow w-full pt-2 space-y-1.5 min-h-[6rem]">
                        {(tasksByHour[hour] || []).map(task => (
                             <div key={task.id} className="p-1.5 rounded-lg text-xs break-words" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                                {task.title}
                             </div>
                        ))}
                        <button onClick={() => onAddTask(date, hour)} className="w-full flex justify-center items-center h-8 rounded-lg transition-colors hover:bg-black/20" style={{ backgroundColor: 'rgba(0,0,0,0.1)'}}>
                            <PlusIcon className="w-4 h-4" style={{ color: textColor, opacity: 0.7 }} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};


const CalendarDayCard: React.FC<{ date: Date; tasks: Task[]; categoryColors: Record<Category, string>; onAddTask: (date: Date, hour: number) => void; }> = ({ date, tasks, categoryColors, onAddTask }) => {
    const bgColor = tasks.length > 0 ? categoryColors[tasks[0].category] : '#374151'; // gray-700
    const textColor = getTextColorForBackground(bgColor);

    return (
        <div
            className="rounded-3xl p-4 flex min-h-[10rem]"
            style={{ backgroundColor: bgColor, color: textColor }}
        >
            <div className="w-1/3 flex-shrink-0 pr-4">
                <p className="font-semibold">{date.toLocaleDateString('en-US', { weekday: 'long' })}</p>
                <p className="text-6xl font-bold font-display tracking-tighter leading-none mt-1">{String(date.getDate()).padStart(2, '0')}</p>
                <p className="text-6xl font-bold font-display tracking-tight leading-none opacity-60">{date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</p>
            </div>
            <div className="w-2/3">
                <MiniTimeline tasks={tasks} textColor={textColor} date={date} onAddTask={onAddTask} categoryColors={categoryColors}/>
            </div>
        </div>
    );
};


const CalendarView: React.FC<{ tasks: Task[]; categoryColors: Record<Category, string>; onAddTask: (date: Date, hour: number) => void; }> = ({ tasks, categoryColors, onAddTask }) => {
    const [currentMonthDate, setCurrentMonthDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    const listRef = useRef<HTMLDivElement>(null);

    const tasksByDate = useMemo(() => {
        return tasks.reduce((acc, task) => {
            const dateStr = new Date(task.startTime).toDateString();
            if (!acc[dateStr]) acc[dateStr] = [];
            acc[dateStr].push(task);
            return acc;
        }, {} as Record<string, Task[]>);
    }, [tasks]);

    const changeMonth = (amount: number) => {
        setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + amount, 1));
    };
    
    useEffect(() => {
        listRef.current?.scrollTo(0, 0);
    }, [currentMonthDate]);

    const dayElements = useMemo(() => {
        const year = currentMonthDate.getFullYear();
        const month = currentMonthDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const elements: JSX.Element[] = [];
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = date.toDateString();
            const dailyTasks = (tasksByDate[dateStr] || []).sort((a,b) => a.startTime.getTime() - b.startTime.getTime());
            elements.push(
                <CalendarDayCard key={dateStr} date={date} tasks={dailyTasks} categoryColors={categoryColors} onAddTask={onAddTask}/>
            );
        }
        return elements;
    }, [currentMonthDate, tasksByDate, categoryColors, onAddTask]);


    const prevMonth = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1).toLocaleString('default', { month: 'short' }).toUpperCase();
    const currentMonth = currentMonthDate.toLocaleString('default', { month: 'long' }).toUpperCase();
    const nextMonth = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1).toLocaleString('default', { month: 'short' }).toUpperCase();
    
    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center text-xl font-bold p-2 mb-4">
                <span className="text-text-secondary/50 font-medium">{prevMonth}</span>
                <div className="flex items-center gap-2 text-2xl font-display">
                    <button onClick={() => changeMonth(-1)} className="p-1 rounded-full hover:bg-card"><ChevronLeftIcon className="w-6 h-6"/></button>
                    <span>{currentMonth}</span>
                    <button onClick={() => changeMonth(1)} className="p-1 rounded-full hover:bg-card"><ChevronRightIcon className="w-6 h-6"/></button>
                </div>
                <span className="text-text-secondary/50 font-medium">{nextMonth}</span>
            </div>
            <div className="relative flex-grow h-0 overflow-hidden">
                 <AnimatePresence mode="wait">
                    <motion.div
                        key={currentMonthDate.toISOString()}
                        ref={listRef}
                        className="absolute inset-0 overflow-y-auto pr-2 -mr-2 space-y-3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.25 }}
                    >
                        {dayElements}
                    </motion.div>
                 </AnimatePresence>
            </div>
        </div>
    );
};


const Schedule: React.FC<ScheduleProps> = (props) => {
    const { tasks, setTasks, showToast, onCompleteTask, onUndoCompleteTask, categoryColors } = props;
    const [view, setView] = useState<ScheduleView>('today');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
    const [prefillDateForModal, setPrefillDateForModal] = useState<Date>(new Date());

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

    const handleOpenNewTaskModal = useCallback((date: Date, hour?: number) => {
        const prefillDate = new Date(date);
        if (hour !== undefined) {
            prefillDate.setHours(hour, 0, 0, 0);
        } else {
             const now = new Date();
             prefillDate.setHours(now.getHours() + 1, 0, 0, 0);
        }
        setPrefillDateForModal(prefillDate);
        setIsNewTaskModalOpen(true);
    }, [setPrefillDateForModal, setIsNewTaskModalOpen]);

    const handleHeaderAddTask = () => {
        const dateForModal = view === 'month' ? new Date() : selectedDate;
        handleOpenNewTaskModal(dateForModal);
    };

    return (
        <div className="h-[calc(100vh-10rem)]">
             <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2 p-1 bg-zinc-200 dark:bg-zinc-800 rounded-full">
                    <button onClick={() => setView('today')} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${view === 'today' ? 'bg-black text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>Today</button>
                    <button onClick={() => setView('month')} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${view === 'month' ? 'bg-black text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>Calendar</button>
                </div>
                <button onClick={handleHeaderAddTask} className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors">
                    <PlusIcon className="w-6 h-6"/>
                </button>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={view}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                >
                    {view === 'today' ? (
                       <TodayView 
                          selectedDate={selectedDate}
                          changeDate={changeDate}
                          tasks={tasksForSelectedDate}
                          categoryColors={categoryColors}
                          onSelectTask={setSelectedTask}
                       />
                    ) : (
                        <CalendarView tasks={tasks} categoryColors={categoryColors} onAddTask={handleOpenNewTaskModal} />
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
                        categoryColors={props.categoryColors}
                        onAddNewCategory={props.onAddNewCategory}
                        updateTask={(updatedTask) => {
                            props.setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
                            setSelectedTask(updatedTask);
                        }}
                        onComplete={() => {
                            onCompleteTask(selectedTask.id, selectedTask.plannedDuration);
                            setSelectedTask(null);
                        }}
                        onUndoCompleteTask={(task) => {
                            onUndoCompleteTask(task);
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
                        addTask={props.addTask}
                        selectedDate={prefillDateForModal}
                        projects={props.projects}
                        notes={props.notes}
                        categories={props.categories}
                        categoryColors={props.categoryColors}
                        onAddNewCategory={props.onAddNewCategory}
                        allTasks={tasks}
                        showToast={props.showToast}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default Schedule;