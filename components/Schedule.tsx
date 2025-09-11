import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    initialDate?: Date;
}

const getTextColorForBackground = (hexColor: string): 'black' | 'white' => {
    if (!hexColor.startsWith('#')) return 'black';
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? 'black' : 'white';
};

interface TaskCardProps {
  task: Task;
  categoryColors: Record<Category, string>;
  onSelect: (task: Task) => void;
}

// FIX: Refactor to a standard function component to avoid potential type issues with React.FC and framer-motion.
function TaskCard({ task, categoryColors, onSelect }: TaskCardProps) {
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
            className="p-4 rounded-3xl cursor-pointer text-white flex-shrink-0"
            style={{ backgroundColor: categoryColor }}
        >
            <div className="flex justify-between items-start">
                <div className="w-3/4">
                     <h3 className="text-2xl font-bold relative inline-block break-word">{task.title}
                        <AnimatePresence>
                        {isCompleted && (
                            <motion.div
                              className="absolute top-1/2 left-0 w-full h-0.5 bg-current"
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: 1, transition: { duration: 0.4, ease: 'circOut' } }}
                              exit={{ scaleX: 0 }}
                              // FIX: 'originX' is not a valid style property. Use `transformOrigin` for CSS or the `originX` prop directly (though direct props seem to have type issues in this environment).
                              style={{ transformOrigin: '0% 50%' }}
                            />
                        )}
                        </AnimatePresence>
                    </h3>
                </div>
                <div className="flex -space-x-2">
                    <img className="w-8 h-8 rounded-full object-cover ring-2 ring-current" src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=2080&auto=format&fit=crop" alt="user 1" />
                    <img className="w-8 h-8 rounded-full object-cover ring-2 ring-current" src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=2080&auto=format&fit=crop" alt="user 2" />
                </div>
            </div>
            <div className={`mt-6 pt-4 border-t border-white/20 flex justify-between items-center`}>
                <div className="text-center">
                    <p className="font-semibold">{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
                    <p className="text-sm opacity-80">Start</p>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-sm font-semibold`} style={{ backgroundColor: 'rgba(0,0,0,0.2)'}}>
                    {task.plannedDuration} Min
                </div>
                <div className="text-center">
                    <p className="font-semibold">{endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
                    <p className="text-sm opacity-80">End</p>
                </div>
            </div>
        </motion.div>
    );
};

interface TodayViewProps {
  selectedDate: Date;
  tasks: Task[];
  categoryColors: Record<Category, string>;
  onSelectTask: (task: Task) => void;
  changeDate: (amount: number) => void;
}

// FIX: Refactor to a standard function component to avoid potential type issues with React.FC and framer-motion.
function TodayView({ selectedDate, tasks, categoryColors, onSelectTask, changeDate }: TodayViewProps) {
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const monthNum = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const month = selectedDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    
    const isToday = new Date().toDateString() === selectedDate.toDateString();
    
    const firstUpcomingTask = tasks.find(t => t.status !== TaskStatus.Completed);
    const bgColor = firstUpcomingTask ? categoryColors[firstUpcomingTask.category] : '#374151'; // gray-700
    const textColor = getTextColorForBackground(bgColor);

    const handlePrevDay = () => changeDate(-1);
    const handleNextDay = () => changeDate(1);

    return (
        <div 
          className="rounded-3xl p-4 sm:p-6 h-full flex flex-col sm:flex-row"
          style={{ backgroundColor: bgColor, color: textColor }}
        >
            <div className="w-full sm:w-1/3 flex-shrink-0 sm:pr-4 flex flex-row sm:flex-col justify-between items-center sm:items-start sm:justify-between mb-4 sm:mb-0">
                <div>
                    <div className="flex items-center justify-between">
                         <p className="font-semibold">{dayOfWeek}</p>
                         {isToday && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{backgroundColor: 'rgba(0,0,0,0.2)'}}>Today</span>}
                    </div>
                    <div className="flex items-baseline sm:block gap-2">
                        <p className="text-6xl sm:text-7xl font-bold font-display tracking-tighter leading-none sm:mt-1">{monthNum}.{day}</p>
                        <p className="text-3xl sm:text-7xl font-bold font-display tracking-tight leading-none sm:opacity-60">{month}</p>
                    </div>
                </div>
                <div className="flex sm:flex-row items-center sm:items-start gap-2">
                    <button onClick={handlePrevDay} className="p-2 rounded-full transition-colors" style={{backgroundColor: 'rgba(0,0,0,0.1)'}} aria-label="Previous day">
                        <ChevronLeftIcon className="w-6 h-6"/>
                    </button>
                    <button onClick={handleNextDay} className="p-2 rounded-full transition-colors" style={{backgroundColor: 'rgba(0,0,0,0.1)'}} aria-label="Next day">
                        <ChevronRightIcon className="w-6 h-6"/>
                    </button>
                </div>
            </div>

            <div className="w-full sm:w-2/3 sm:pl-4 sm:border-l border-current/20 flex-1 min-h-0">
                {tasks.length > 0 ? (
                    <div className="h-full overflow-y-auto hide-scrollbar">
                        <div className="space-y-4">
                            {tasks.map(task => <TaskCard key={task.id} task={task} categoryColors={categoryColors} onSelect={onSelectTask} />)}
                        </div>
                    </div>
                ) : (
                     <div className="h-full flex items-center justify-center text-center rounded-2xl" style={{backgroundColor: 'rgba(0,0,0,0.1)'}}>
                        <p className="opacity-80">Nothing scheduled for today.</p>
                     </div>
                )}
            </div>
        </div>
    );
};

interface MiniTimelineProps {
  tasks: Task[];
  textColor: string;
  date: Date;
  onAddTask: (date: Date, hour: number) => void;
  categoryColors: Record<Category, string>;
}

// FIX: Refactor to a standard function component to avoid potential type issues with React.FC and framer-motion.
function MiniTimeline({ tasks, textColor, date, onAddTask, categoryColors }: MiniTimelineProps) {
    const timelineRef = useRef<HTMLDivElement>(null);
    
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
    
    useEffect(() => {
        if (timelineRef.current && tasks.length > 0) {
            const firstTaskHour = new Date(tasks[0].startTime).getHours();
            const scrollToIndex = Math.max(0, firstTaskHour - displayStartHour);
            
            // Assuming each hour block is w-24 (6rem) with gap-2 (0.5rem) = 6.5rem total
            // Using pixels for more accuracy, assuming 1rem = 16px. 6 * 16 + 8 = 104px per block.
            const blockWidth = (6 * 16) + 8;
            const scrollPosition = scrollToIndex * blockWidth;
            
            timelineRef.current.scrollTo({ left: scrollPosition, behavior: 'auto' });
        }
    }, [tasks]);

    return (
        <div ref={timelineRef} className="flex h-full gap-2 overflow-x-auto hide-scrollbar">
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

interface CalendarDayCardProps {
  date: Date;
  tasks: Task[];
  categoryColors: Record<Category, string>;
  onAddTask: (date: Date, hour: number) => void;
}

function CalendarDayCard({ date, tasks, categoryColors, onAddTask }: CalendarDayCardProps) {
    // Defensive programming for date and tasks
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        return (
            <div className="rounded-3xl p-4 flex min-h-[10rem] bg-gray-700 flex-shrink-0">
                <div className="w-full flex items-center justify-center">
                    <p className="text-gray-400">Invalid date</p>
                </div>
            </div>
        );
    }

    let dayOfWeek, day, month;
    try {
        dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
        day = String(date.getDate()).padStart(2, '0');
        month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    } catch (e) {
        console.error("Error formatting date in CalendarDayCard:", e);
        return (
             <div className="rounded-3xl p-4 flex min-h-[10rem] bg-red-800 text-white flex-shrink-0">
                <div className="w-full flex items-center justify-center">
                    <p>Date Error</p>
                </div>
            </div>
        );
    }

    // Filter malformed task data
    const safeTasks = Array.isArray(tasks)
        ? tasks.filter(task => task && task.category && task.startTime && !isNaN(new Date(task.startTime).getTime()))
        : [];
        
    const bgColor = safeTasks.length > 0 ? (categoryColors[safeTasks[0].category] || '#374151') : '#374151';
    const textColor = getTextColorForBackground(bgColor);

    return (
        <div
            data-date={date.toISOString().split('T')[0]} // Unique key for scrolling
            className="rounded-3xl p-4 flex min-h-[10rem] flex-shrink-0"
            style={{ backgroundColor: bgColor, color: textColor }}
        >
            <div className="w-1/3 flex-shrink-0 pr-4">
                <p className="font-semibold">{dayOfWeek}</p>
                <p className="text-6xl font-bold font-display tracking-tighter leading-none mt-1">{day}</p>
                <p className="text-6xl font-bold font-display tracking-tight leading-none opacity-60">{month}</p>
            </div>
            <div className="w-2/3 overflow-hidden">
                <MiniTimeline tasks={safeTasks} textColor={textColor} date={date} onAddTask={onAddTask} categoryColors={categoryColors}/>
            </div>
        </div>
    );
};

interface CalendarViewProps {
  tasks: Task[];
  categoryColors: Record<Category, string>;
  onAddTask: (date: Date, hour: number) => void;
  selectedDate: Date;
}

function CalendarView({ tasks, categoryColors, onAddTask, selectedDate }: CalendarViewProps) {
    const [currentMonthDate, setCurrentMonthDate] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    const listRef = useRef<HTMLDivElement>(null);
    const isFirstRender = useRef(true);
    const [isAnimating, setIsAnimating] = useState(false);
    const [animationDirection, setAnimationDirection] = useState(1); // 1 for next, -1 for prev

    const tasksByDate = useMemo(() => {
        try {
            if (!Array.isArray(tasks)) {
                console.warn("tasksByDate: tasks prop is not an array.");
                return {};
            }
            return tasks.reduce((acc, task) => {
                if (task && task.startTime) {
                    const taskDate = new Date(task.startTime);
                    if (!isNaN(taskDate.getTime())) {
                        const dateStr = taskDate.toDateString();
                        if (!acc[dateStr]) acc[dateStr] = [];
                        acc[dateStr].push(task);
                    }
                }
                return acc;
            }, {} as Record<string, Task[]>);
        } catch (error) {
            console.error("Error processing tasks in tasksByDate:", error);
            return {};
        }
    }, [tasks]);

    const changeMonth = useCallback((amount: number) => {
        if (isAnimating) return;
        setAnimationDirection(amount > 0 ? 1 : -1);
        setIsAnimating(true);
        setCurrentMonthDate(prev => {
            const newDate = new Date(prev.getFullYear(), prev.getMonth() + amount, 1);
            return newDate;
        });
    }, [isAnimating]);
    
    useEffect(() => {
        // This effect runs only once on mount to scroll to the initial date.
        if (!listRef.current) return;
    
        const targetDateStr = selectedDate.toISOString().split('T')[0];
        const targetElement = listRef.current.querySelector(`[data-date='${targetDateStr}']`) as HTMLElement;
    
        if (targetElement) {
            const timer = setTimeout(() => {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                });
            }, 450); // Wait for mount animation to complete.
            return () => clearTimeout(timer);
        }
    }, []); // Empty dependency array ensures it runs only once.

    useEffect(() => {
        // This effect scrolls to the top when the month changes, but not on the initial render.
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        if (listRef.current) {
            listRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [currentMonthDate]);

    const dayElements = useMemo(() => {
        const year = currentMonthDate.getFullYear();
        const month = currentMonthDate.getMonth();

        if (isNaN(year) || isNaN(month) || month < 0 || month > 11) {
            console.error("Invalid year or month provided to CalendarView:", { year, month });
            return [<div key="error">Error rendering calendar days.</div>];
        }

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const elements: JSX.Element[] = [];
        for (let day = 1; day <= daysInMonth; day++) {
            try {
                const date = new Date(year, month, day);
                if (isNaN(date.getTime())) {
                    throw new Error(`Invalid date created for day ${day}`);
                }
                const dateStr = date.toDateString();
                const dailyTasks = (tasksByDate[dateStr] || []).sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
                const uniqueKey = `${year}-${month}-${day}`;
                elements.push(
                    <CalendarDayCard key={uniqueKey} date={date} tasks={dailyTasks} categoryColors={categoryColors} onAddTask={onAddTask}/>
                );
            } catch (error) {
                console.error(`Failed to generate day card for ${year}-${month}-${day}:`, error);
                elements.push(<div key={`error-${day}`} className="p-4 bg-red-900 text-white rounded-xl flex-shrink-0">Error loading day {day}.</div>);
            }
        }
        return elements;
    }, [currentMonthDate, tasksByDate, categoryColors, onAddTask]);

    let prevMonth = '...';
    let currentMonthName = 'Loading';
    let currentYear = new Date().getFullYear();
    let nextMonth = '...';

    try {
        prevMonth = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1).toLocaleString('default', { month: 'short' }).toUpperCase();
        currentMonthName = currentMonthDate.toLocaleString('default', { month: 'long' }).toUpperCase();
        currentYear = currentMonthDate.getFullYear();
        nextMonth = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1).toLocaleString('default', { month: 'short' }).toUpperCase();
    } catch(e) {
        console.error("Error formatting header dates:", e);
    }
    
    if (dayElements.length === 0 && !isAnimating) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-text-secondary min-h-[300px]">
                <p>No tasks to display for this month.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center text-xl font-bold p-2 mb-4 flex-shrink-0">
                <span className="text-text-secondary/50 font-medium">{prevMonth}</span>
                <div className="flex items-center gap-3 text-2xl font-display">
                    <button onClick={() => changeMonth(-1)} disabled={isAnimating} className="p-1 rounded-full hover:bg-card transition-colors disabled:opacity-50 disabled:cursor-wait">
                        <ChevronLeftIcon className="w-6 h-6"/>
                    </button>
                    <div className="text-center">
                        <div className="text-2xl font-bold">{currentMonthName}</div>
                        <div className="text-lg font-semibold text-text-secondary/70 -mt-1">{currentYear}</div>
                    </div>
                    <button onClick={() => changeMonth(1)} disabled={isAnimating} className="p-1 rounded-full hover:bg-card transition-colors disabled:opacity-50 disabled:cursor-wait">
                        <ChevronRightIcon className="w-6 h-6"/>
                    </button>
                </div>
                <span className="text-text-secondary/50 font-medium">{nextMonth}</span>
            </div>
            <div className="flex-1 min-h-0">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentMonthDate.toISOString()}
                        ref={listRef}
                        className="h-full overflow-y-auto hide-scrollbar"
                        initial={{ opacity: 0, y: 30 * animationDirection }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 * animationDirection }}
                        transition={{ duration: 0.4, ease: 'easeInOut' }}
                        onAnimationComplete={() => setIsAnimating(false)}
                    >
                        <div className="space-y-3">
                            {dayElements}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

// FIX: Refactor to a standard function component to avoid potential type issues with React.FC and framer-motion.
function Schedule(props: ScheduleProps) {
    const { tasks, setTasks, showToast, onCompleteTask, onUndoCompleteTask, categoryColors, initialDate } = props;
    const [view, setView] = useState<ScheduleView>('today');
    const [selectedDate, setSelectedDate] = useState(initialDate || new Date());
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
    const [prefillDateForModal, setPrefillDateForModal] = useState<Date>(new Date());

    useEffect(() => {
        if (initialDate) {
            setSelectedDate(new Date(initialDate));
            setView('today');
        }
    }, [initialDate]);

    const tasksForSelectedDate = useMemo(() => {
        return tasks
            .filter(t => new Date(t.startTime).toDateString() === selectedDate.toDateString())
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    }, [tasks, selectedDate]);
    
    const changeDate = (amount: number) => {
        setSelectedDate(currentDate => {
            const newDate = new Date(currentDate);
            newDate.setDate(newDate.getDate() + amount);
            return newDate;
        });
    };

    const handleOpenNewTaskModal = useCallback((date: Date, hour?: number) => {
        const prefillDate = new Date(date.getTime()); // Use timestamp to avoid reference issues
        if (hour !== undefined) {
            prefillDate.setHours(hour, 0, 0, 0);
        } else {
             const now = new Date();
             prefillDate.setHours(now.getHours() + 1, 0, 0, 0);
        }
        setPrefillDateForModal(prefillDate);
        setIsNewTaskModalOpen(true);
    }, []);

    const handleHeaderAddTask = useCallback(() => {
        const dateForModal = view === 'month' ? new Date() : new Date(selectedDate.getTime());
        handleOpenNewTaskModal(dateForModal);
    }, [view, selectedDate, handleOpenNewTaskModal]);

    return (
        <div className="h-full max-h-[90vh] flex flex-col overflow-hidden">
             <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <div className="flex items-center gap-2 p-1 bg-zinc-200 dark:bg-zinc-800 rounded-full">
                    <button onClick={() => setView('today')} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${view === 'today' ? 'bg-black text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>Today</button>
                    <button onClick={() => setView('month')} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${view === 'month' ? 'bg-black text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>Calendar</button>
                </div>
                <button onClick={handleHeaderAddTask} className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors">
                    <PlusIcon className="w-6 h-6"/>
                </button>
            </div>

            <div className="flex-1 min-h-0">
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
                              tasks={tasksForSelectedDate}
                              categoryColors={categoryColors}
                              onSelectTask={setSelectedTask}
                              changeDate={changeDate}
                           />
                        ) : (
                            <CalendarView 
                                tasks={tasks} 
                                categoryColors={categoryColors} 
                                onAddTask={handleOpenNewTaskModal} 
                                selectedDate={selectedDate}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

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
                            props.onUndoCompleteTask(task);
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