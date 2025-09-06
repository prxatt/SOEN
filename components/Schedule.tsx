import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, TaskStatus, Project, Note, Category } from '../types';
import { getCategoryColor } from '../constants';
import { PlusCircleIcon, ChevronLeftIcon, ChevronRightIcon, CheckCircleIcon, ArrowUturnLeftIcon, GoogleCalendarIcon, CalendarDaysIcon, ViewColumnsIcon } from './Icons';
import NewTaskModal from './NewTaskModal';
import { kikoRequest } from '../services/kikoAIService';
import LoadingSpinner from './LoadingSpinner';

// --- PROPS ---
interface ScheduleProps {
  tasks: Task[];
  updateTask: (task: Task) => void;
  onViewTask: (task: Task | null) => void;
  addTask: (taskDetails: Partial<Task> & { title: string }) => void;
  projects: Project[];
  notes: Note[];
  onUndoTask: (taskId: number) => void;
  onCompleteTask: (taskId: number) => void;
  categories: Category[];
  onSyncCalendar: () => void;
  showToast: (message: string) => void;
}

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 }}};
const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 }};
const dayTransitionVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction < 0 ? '100%' : '-100%', opacity: 0 }),
};

const TaskItem: React.FC<{ task: Task; onViewTask: (task: Task) => void; onCompleteTask: (id: number) => void; onUndoTask: (id: number) => void; }> = ({ task, onViewTask, onCompleteTask, onUndoTask }) => {
    const isCompleted = task.status === TaskStatus.Completed;
    const isPast = new Date(task.startTime) < new Date() && !isCompleted;

    const handleCompleteClick = (e: React.MouseEvent) => { e.stopPropagation(); onCompleteTask(task.id); };
    const handleUndoClick = (e: React.MouseEvent) => { e.stopPropagation(); onUndoTask(task.id); };

    return (
        <motion.div layout variants={itemVariants} initial="hidden" animate="visible" exit={{opacity: 0}} onClick={() => onViewTask(task)} className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all duration-200 ${isCompleted ? 'bg-light-bg dark:bg-dark-bg opacity-60' : 'bg-light-card dark:bg-dark-card hover:shadow-md'}`}>
            <div className="w-1.5 h-12 rounded-full" style={{ backgroundColor: getCategoryColor(task.category) }}></div>
            <div className="flex-grow">
                <p className={`font-semibold ${isCompleted ? 'line-through' : ''} ${isPast ? 'text-red-400' : ''}`}>{task.title}</p>
                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                    {new Date(task.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {task.plannedDuration} min
                </p>
            </div>
            {isCompleted ? (
                <button onClick={handleUndoClick} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-light-text-secondary dark:text-dark-text-secondary" aria-label="Undo"><ArrowUturnLeftIcon className="w-5 h-5" /></button>
            ) : (
                <button onClick={handleCompleteClick} className="p-2 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:border-green-500 hover:text-green-500 transition-colors" aria-label="Complete Task"><CheckCircleIcon className="w-5 h-5" /></button>
            )}
        </motion.div>
    );
};

const DailyHeader: React.FC<{ date: Date, tasks: Task[] }> = ({ date, tasks }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchImage = async () => {
            setIsLoading(true);
            try {
                const result = await kikoRequest('generate_daily_image', { date, tasks });
                setImageUrl(result.data);
            } catch (error) {
                console.error("Failed to generate daily image:", error);
                // Fallback to a random image on error
                setImageUrl(`https://source.unsplash.com/random/1920x1080?abstract,${date.getDay()}`);
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchImage, 300); // Debounce image generation
        return () => clearTimeout(timeoutId);

    }, [date, tasks]);

    return (
        <div className="relative h-40 rounded-xl overflow-hidden mb-4 bg-light-card dark:bg-dark-card animate-fade-in-fast">
            {isLoading && <div className="absolute inset-0 flex items-center justify-center"><LoadingSpinner message="Generating creative spark..."/></div>}
            <AnimatePresence>
            {imageUrl && !isLoading && (
                 <motion.img 
                    src={imageUrl} 
                    alt="Daily creative spark" 
                    className="w-full h-full object-cover"
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                 />
            )}
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-4 left-4 text-white">
                <h2 className="text-3xl font-bold font-display" style={{textShadow: '0 2px 5px rgba(0,0,0,0.5)'}}>{date.toLocaleDateString('en-US', { weekday: 'long' })}</h2>
                <p className="text-lg" style={{textShadow: '0 1px 3px rgba(0,0,0,0.5)'}}>{date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
            </div>
        </div>
    )
}

const DayView: React.FC<{tasks: Task[]; onViewTask: (task: Task) => void; onCompleteTask: (id: number) => void; onUndoTask: (id: number) => void; date: Date}> = ({tasks, onViewTask, onCompleteTask, onUndoTask, date}) => (
    <>
        <DailyHeader date={date} tasks={tasks} />
        <AnimatePresence>
            {tasks.length > 0 ? (
                 <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-3">
                    {tasks.map(task => <TaskItem key={task.id} task={task} onViewTask={onViewTask} onCompleteTask={onCompleteTask} onUndoTask={onUndoTask}/>)}
                </motion.div>
            ) : (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center text-light-text-secondary dark:text-dark-text-secondary pt-16">
                    <p className="font-semibold">No tasks scheduled for today.</p>
                    <p className="text-sm">Ready to plan your day?</p>
                </motion.div>
            )}
        </AnimatePresence>
    </>
);

const MonthView: React.FC<{selectedDate: Date; setSelectedDate: (date: Date) => void; tasks: Task[]; setView: (view: 'day' | 'month') => void;}> = ({selectedDate, setSelectedDate, tasks, setView}) => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const [hoveredDay, setHoveredDay] = useState<Date | null>(null);

    const calendarDays = Array.from({ length: firstDay + daysInMonth }, (_, i) => {
        if (i < firstDay) return null; // Padding
        return new Date(year, month, i - firstDay + 1);
    });

    const tasksByDay = useMemo(() => {
        const map = new Map<string, Task[]>();
        tasks.forEach(task => {
            const day = new Date(task.startTime).toDateString();
            if (!map.has(day)) map.set(day, []);
            map.get(day)!.push(task);
        });
        return map;
    }, [tasks]);

    return (
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="py-2">{day}</div>)}
            {calendarDays.map((day, i) => (
                <div 
                    key={i} 
                    onClick={() => { if(day) { setSelectedDate(day); setView('day');} }}
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className={`relative h-24 p-1 border border-light-border dark:border-dark-border rounded-md transition-colors ${day ? 'cursor-pointer hover:bg-accent/10' : 'bg-light-bg/50 dark:bg-dark-bg/50'}`}
                >
                    {day && (
                        <>
                            <span className={`flex items-center justify-center w-6 h-6 rounded-full ${day.toDateString() === today.toDateString() ? 'bg-accent text-white' : ''}`}>{day.getDate()}</span>
                            <div className="flex flex-wrap gap-1 mt-1 justify-center">
                                {tasksByDay.get(day.toDateString())?.slice(0, 3).map(task => (
                                    <div key={task.id} className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: getCategoryColor(task.category)}}></div>
                                ))}
                            </div>
                            <AnimatePresence>
                            {hoveredDay?.getTime() === day.getTime() && (tasksByDay.get(day.toDateString())?.length || 0) > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 card rounded-lg shadow-xl z-10 text-left"
                                >
                                    {tasksByDay.get(day.toDateString())?.map(task => (
                                        <div key={task.id} className="text-xs truncate">
                                            <span className="font-semibold">{task.startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span> {task.title}
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                            </AnimatePresence>
                        </>
                    )}
                </div>
            ))}
        </div>
    );
};

const Schedule: React.FC<ScheduleProps> = ({ tasks, updateTask, onViewTask, addTask, projects, notes, onUndoTask, onCompleteTask, categories, onSyncCalendar, showToast }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
    const [view, setView] = useState<'day' | 'month'>('day');
    const [direction, setDirection] = useState(0);

    const changeDate = (amount: number) => {
        setDirection(amount);
        setSelectedDate(prev => {
            const newDate = new Date(prev);
            if (view === 'day') newDate.setDate(newDate.getDate() + amount);
            else newDate.setMonth(newDate.getMonth() + amount);
            return newDate;
        });
    };
    
    const tasksForSelectedDay = useMemo(() => tasks.filter(task => new Date(task.startTime).toDateString() === selectedDate.toDateString()).sort((a, b) => a.startTime.getTime() - b.startTime.getTime()), [tasks, selectedDate]);
    const tasksForSelectedMonth = useMemo(() => tasks.filter(task => new Date(task.startTime).getMonth() === selectedDate.getMonth() && new Date(task.startTime).getFullYear() === selectedDate.getFullYear()), [tasks, selectedDate]);

    return (
        <div className="h-full flex flex-col">
            {isNewTaskModalOpen && <NewTaskModal onClose={() => setIsNewTaskModalOpen(false)} addTask={addTask} selectedDate={selectedDate} projects={projects} notes={notes} categories={categories} showToast={showToast} />}
            <header className="flex justify-between items-center mb-4 flex-shrink-0">
                <div className="flex items-center gap-2">
                     <button onClick={() => { setDirection(selectedDate > new Date() ? -1 : 1); setSelectedDate(new Date()); }} className="text-sm font-semibold p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors">Today</button>
                    <button onClick={() => changeDate(-1)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10"><ChevronLeftIcon className="w-6 h-6"/></button>
                    <h2 className="text-xl font-bold font-display w-48 text-center">{view === 'day' ? selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
                    <button onClick={() => changeDate(1)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10"><ChevronRightIcon className="w-6 h-6"/></button>
                </div>
                 <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 p-1 bg-light-card dark:bg-dark-card rounded-lg border border-light-border dark:border-dark-border">
                        <button onClick={() => setView('day')} title="Day View" className={`p-2 text-sm font-semibold rounded-md ${view === 'day' ? 'bg-accent text-white' : ''}`}><ViewColumnsIcon className="w-5 h-5"/></button>
                        <button onClick={() => setView('month')} title="Month View" className={`p-2 text-sm font-semibold rounded-md ${view === 'month' ? 'bg-accent text-white' : ''}`}><CalendarDaysIcon className="w-5 h-5"/></button>
                    </div>
                    <button onClick={onSyncCalendar} className="flex items-center gap-1.5 text-sm font-semibold p-2 rounded-lg text-light-text-secondary dark:text-dark-text-secondary hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                        <GoogleCalendarIcon className="w-5 h-5"/> Sync
                    </button>
                    <button onClick={() => setIsNewTaskModalOpen(true)} className="flex items-center justify-center gap-1.5 text-sm font-semibold py-2 px-4 rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors">
                        <PlusCircleIcon className="w-5 h-5"/> New Task
                    </button>
                </div>
            </header>
            
            <main className="flex-grow overflow-y-auto relative">
                 <AnimatePresence mode="wait" custom={direction}>
                    {view === 'day' ? (
                        <motion.div
                            key={selectedDate.toDateString()}
                            custom={direction}
                            variants={dayTransitionVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
                            className="absolute w-full"
                        >
                            <DayView tasks={tasksForSelectedDay} onViewTask={onViewTask} onCompleteTask={onCompleteTask} onUndoTask={onUndoTask} date={selectedDate}/>
                        </motion.div>
                    ) : (
                         <motion.div key="month-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <MonthView selectedDate={selectedDate} setSelectedDate={setSelectedDate} tasks={tasksForSelectedMonth} setView={setView} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default Schedule;