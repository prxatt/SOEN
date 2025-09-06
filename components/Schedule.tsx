

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AnimatePresence, motion, PanInfo } from 'framer-motion';
import { Task, Project, Note, Notebook, Goal, Category, TaskStatus, ScheduleView, ChatMessage } from '../types';
import { PlusCircleIcon, ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon, CalendarIcon, GridIcon, ArrowUturnLeftIcon } from './Icons';
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

const MonthView: React.FC<{ tasks: Task[], selectedDate: Date, setView: (view: ScheduleView) => void, setSelectedDate: (date: Date) => void; categoryColors: Record<Category, string>; categoryFilter: Category | null }> = ({ tasks, selectedDate, setSelectedDate, setView, categoryColors, categoryFilter }) => {
    const [currentMonthDate, setCurrentMonthDate] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

    const tasksByDate = useMemo(() => {
        return tasks.reduce((acc, task) => {
            if (categoryFilter && task.category !== categoryFilter) return acc;
            const dateStr = new Date(task.startTime).toDateString();
            if (!acc[dateStr]) acc[dateStr] = [];
            acc[dateStr].push(task);
            return acc;
        }, {} as Record<string, Task[]>);
    }, [tasks, categoryFilter]);

    const changeMonth = (amount: number) => {
        setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + amount, 1));
    };

    const renderCells = () => {
        const cells: JSX.Element[] = [];
        const year = currentMonthDate.getFullYear();
        const month = currentMonthDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const today = new Date();
        
        const daysInPrevMonth = new Date(year, month, 0).getDate();
        for (let i = firstDayOfMonth - 1; i >= 0; i--) {
            cells.push(<div key={`prev-${i}`} className="text-center p-2 text-text-secondary/30 h-28">{daysInPrevMonth - i}</div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = date.toDateString();
            const isToday = dateStr === today.toDateString();
            const isSelected = dateStr === selectedDate.toDateString();
            const dailyTasks = (tasksByDate[dateStr] || []).sort((a,b) => a.startTime.getTime() - b.startTime.getTime());

            cells.push(
                <button
                    key={day}
                    onClick={() => { setSelectedDate(date); setView('today'); }}
                    className={`relative flex flex-col items-start justify-start p-1.5 transition-colors duration-200 rounded-lg focus:outline-none overflow-hidden h-28 ${isSelected ? 'bg-accent/10' : 'hover:bg-card'}`}
                >
                    <span className={`text-xs font-bold self-end ${isSelected ? 'text-accent' : isToday ? 'text-text' : 'text-text-secondary'}`}>
                        {day}
                    </span>
                    <div className="w-full space-y-1 overflow-hidden mt-1">
                        {dailyTasks.slice(0, 3).map(task => (
                             <div key={task.id} className="flex items-center gap-1.5 text-xs text-left truncate">
                                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: categoryColors[task.category] }} />
                                <span className={`truncate ${task.status === TaskStatus.Completed ? 'text-text-secondary line-through' : 'text-text'}`}>{task.title}</span>
                            </div>
                        ))}
                        {dailyTasks.length > 3 && (
                            <div className="text-xs text-text-secondary pl-3.5 pt-1">+{dailyTasks.length - 3} more</div>
                        )}
                    </div>
                    {isToday && <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-accent rounded-full animate-subtle-glow" />}
                </button>
            );
        }

        const totalCells = firstDayOfMonth + daysInMonth;
        const nextMonthDays = (7 - (totalCells % 7)) % 7;
        for (let i = 1; i <= nextMonthDays; i++) {
            cells.push(<div key={`next-${i}`} className="text-center p-2 text-text-secondary/30 h-28">{i}</div>);
        }

        return cells;
    };
    
    return (
        <div className="bg-bg/50 p-4 rounded-2xl">
            <div className="flex items-center justify-between px-2 mb-4">
                 <div className="flex items-baseline gap-2">
                    <GridIcon className="w-6 h-6 text-accent" />
                    <h2 className="text-2xl font-bold uppercase tracking-widest text-accent">
                        {currentMonthDate.toLocaleString('default', { month: 'long' })}
                    </h2>
                 </div>
                 <p className="text-xl font-medium text-text-secondary">{currentMonthDate.getFullYear()}</p>
                 <div className="flex items-center">
                    <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-card"><ChevronLeftIcon className="w-6 h-6"/></button>
                    <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-card"><ChevronRightIcon className="w-6 h-6"/></button>
                 </div>
            </div>
            <div className="grid grid-cols-7 text-center text-xs font-bold text-text-secondary/50 mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {renderCells()}
            </div>
        </div>
    );
};


const ColorFilter: React.FC<{categoryColors: Record<Category, string>, onFilterChange: (category: Category | null) => void, activeFilter: Category | null}> = ({ categoryColors, onFilterChange, activeFilter }) => {
    const lastHoveredRef = useRef<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const handlePan = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const element = document.elementFromPoint(info.point.x, info.point.y);
        const category = element?.getAttribute('data-category') as Category | 'all' | null;

        if (category && category !== lastHoveredRef.current) {
            lastHoveredRef.current = category;
            triggerHapticFeedback('light');
            onFilterChange(category === 'all' ? null : category);
            
            const dot = containerRef.current?.querySelector(`[data-category="${category}"]`);
            if (dot) {
                dot.classList.add('animate-pop-in');
                setTimeout(() => dot.classList.remove('animate-pop-in'), 200);
            }
        }
    };
    
    return (
        <motion.div
            ref={containerRef}
            onPan={handlePan}
            onPanEnd={() => lastHoveredRef.current = null}
            className="card flex justify-center items-center gap-2 mt-4 p-2 rounded-full shadow-lg mx-auto max-w-sm touch-none"
            >
            <button data-category="all" onClick={() => onFilterChange(null)} className={`text-xs font-bold px-3 py-1 rounded-full ${!activeFilter ? 'bg-accent text-white' : 'text-text-secondary'}`}>All</button>
            <div className="w-px h-4 bg-border"/>
            {Object.entries(categoryColors).map(([category, color]) => (
                <div
                    key={category}
                    data-category={category}
                    className={`w-5 h-5 rounded-full border-2 transition-all duration-200`}
                    style={{ backgroundColor: color, borderColor: activeFilter === category ? 'var(--color-text)' : color, transform: activeFilter === category ? 'scale(1.2)' : 'scale(1)' }}
                />
            ))}
        </motion.div>
    )
}

const PIXELS_PER_HOUR = 80;
const PIXELS_PER_MINUTE = PIXELS_PER_HOUR / 60;
const TIMELINE_START_HOUR = 6;
const TIMELINE_END_HOUR = 24;

const TimelineTaskItem: React.FC<{ task: Task; onSelect: (task: Task) => void; categoryColors: Record<Category, string>; }> = ({ task, onSelect, categoryColors }) => {
    const start = task.startTime.getHours() + task.startTime.getMinutes() / 60;
    const top = (start - TIMELINE_START_HOUR) * PIXELS_PER_HOUR;
    const height = task.plannedDuration * PIXELS_PER_MINUTE;
    const categoryColor = categoryColors[task.category] || '#6B7280';
    const isCompleted = task.status === TaskStatus.Completed;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={() => onSelect(task)}
            className={`absolute left-16 right-0 rounded-lg p-2 cursor-pointer transition-all duration-300 flex flex-col justify-between overflow-hidden hover:scale-[1.01] hover:shadow-lg`}
            style={{
                top: `${top}px`,
                height: `${Math.max(height, 30)}px`,
                backgroundColor: isCompleted ? `${categoryColor}80` : `${categoryColor}33`,
                borderLeft: `3px solid ${categoryColor}`
            }}
        >
            <div>
                <p className={`font-bold text-sm break-word ${isCompleted ? 'line-through text-text/80' : 'text-text'}`}>{task.title}</p>
                <p className={`text-xs ${isCompleted ? 'text-text/60' : 'text-text/80'}`}>{task.plannedDuration} min</p>
            </div>
        </motion.div>
    );
};

const TodayTimelineView: React.FC<{ tasks: Task[]; onSelectTask: (task: Task) => void; categoryColors: Record<Category, string>; selectedDate: Date }> = ({ tasks, onSelectTask, categoryColors, selectedDate }) => {
    const timelineRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const now = new Date();
        const isToday = now.toDateString() === selectedDate.toDateString();
        const firstTask = tasks[0];

        let scrollTargetHour = isToday ? now.getHours() : 8;
        if (firstTask && firstTask.startTime.getHours() < scrollTargetHour) {
            scrollTargetHour = firstTask.startTime.getHours();
        }

        const scrollTop = Math.max(0, (scrollTargetHour - TIMELINE_START_HOUR - 0.5) * PIXELS_PER_HOUR);
        timelineRef.current?.scrollTo({ top: scrollTop, behavior: 'smooth' });
    }, [tasks, selectedDate]);

    const hours = Array.from({ length: TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1 }, (_, i) => TIMELINE_START_HOUR + i);
    const now = new Date();
    const nowTop = (now.getHours() - TIMELINE_START_HOUR + now.getMinutes() / 60) * PIXELS_PER_HOUR;
    const isToday = now.toDateString() === selectedDate.toDateString();

    return (
        <div ref={timelineRef} className="card rounded-2xl overflow-y-auto relative h-[calc(100vh-15rem)] bg-bg/50">
            <div className="relative" style={{ height: `${(TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1) * PIXELS_PER_HOUR}px` }}>
                {hours.map(hour => (
                    <div key={hour} className="absolute w-full flex items-start" style={{ top: `${(hour - TIMELINE_START_HOUR) * PIXELS_PER_HOUR}px` }}>
                        <span className="text-xs font-mono text-text-secondary pr-3 -mt-2">{`${String(hour).padStart(2, '0')}:00`}</span>
                        <div
                            className="flex-grow border-t border-border/50 animate-draw-in"
                            style={{ animationDelay: `${(hour - TIMELINE_START_HOUR) * 30}ms` }}
                        />
                    </div>
                ))}
                {isToday && nowTop > 0 && (
                     <div className="absolute left-16 right-0 h-px bg-red-500 z-10 animate-time-pulse" style={{ top: `${nowTop}px` }}>
                        <div className="absolute -left-1.5 -top-1 w-3 h-3 bg-red-500 rounded-full ring-2 ring-bg"></div>
                    </div>
                )}
                <AnimatePresence>
                    {tasks.map(task => (
                        <TimelineTaskItem key={task.id} task={task} onSelect={onSelectTask} categoryColors={categoryColors} />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

const Schedule: React.FC<ScheduleProps> = (props) => {
    const { tasks, onCompleteTask, onUndoCompleteTask, categoryColors } = props;
    const [view, setView] = useState<ScheduleView>('today');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState<Category | null>(null);
    
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

    return (
        <div className="h-full">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold font-display">{view === 'today' ? `Schedule, ${selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}` : 'Schedule'}</h2>
                <div className="flex items-center gap-2">
                     <button onClick={() => setView(v => v === 'today' ? 'month' : 'today')} className="p-2 rounded-lg hover:bg-card transition-colors" aria-label={view === 'today' ? 'Switch to Month View' : 'Switch to Day View'}>
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
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {view === 'today' ? (
                        <>
                            <div className="flex justify-between items-center mb-4 px-2">
                                <button onClick={() => changeDate(-1)} className="p-2 rounded-full hover:bg-card"><ChevronLeftIcon className="w-6 h-6"/></button>
                                <h3 className="font-semibold text-lg text-center">
                                    {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
                                </h3>
                                <button onClick={() => changeDate(1)} className="p-2 rounded-full hover:bg-card"><ChevronRightIcon className="w-6 h-6"/></button>
                            </div>
                            
                            {tasksForSelectedDate.length > 0 ? (
                                <TodayTimelineView tasks={tasksForSelectedDate} onSelectTask={setSelectedTask} categoryColors={categoryColors} selectedDate={selectedDate} />
                            ) : (
                                <div className="text-center py-16 text-text-secondary h-[calc(100vh-17rem)] flex flex-col items-center justify-center card rounded-2xl">
                                    <p>Nothing scheduled for this day.</p>
                                    <button onClick={() => setIsNewTaskModalOpen(true)} className="mt-2 text-accent font-semibold">Plan your day?</button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="relative pb-28">
                             <MonthView tasks={tasks} selectedDate={selectedDate} setSelectedDate={setSelectedDate} setView={setView} categoryColors={categoryColors} categoryFilter={categoryFilter} />
                             <div className="fixed bottom-24 left-0 right-0 z-10">
                                <ColorFilter categoryColors={categoryColors} onFilterChange={setCategoryFilter} activeFilter={categoryFilter}/>
                             </div>
                        </div>
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
                        selectedDate={selectedDate}
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