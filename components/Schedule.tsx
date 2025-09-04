import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, Category, TaskStatus, Project, Note } from '../types';
import { getCategoryColor } from '../constants';
import { PlusCircleIcon, ChevronLeftIcon, ChevronRightIcon, SparklesIcon, XMarkIcon, BriefcaseIcon, DocumentTextIcon, MapPinIcon, VideoCameraIcon, PaperClipIcon, PlayIcon, CheckCircleIcon, ArrowUturnLeftIcon, CalendarIcon, GoogleCalendarIcon, ArrowDownTrayIcon, LinkIcon } from './Icons';
import { triggerHapticFeedback } from '../utils/haptics';
import { parseTaskFromString, getAutocompleteSuggestions } from '../services/geminiService';

// --- PROPS ---
interface ScheduleProps {
  tasks: Task[];
  updateTask: (task: Task) => void;
  onViewTask: (task: Task) => void;
  addTask: (task: Partial<Task> & { title: string }) => void;
  projects: Project[];
  notes: Note[];
  onUndoTask: (taskId: number) => void;
  onCompleteTask: (taskId: number) => void;
  categories: Category[];
  onSyncCalendar: () => void;
  showToast: (message: string) => void;
}

// --- DATE HELPERS ---
const startOfDay = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const addDays = (date: Date, days: number): Date => { const d = new Date(date); d.setDate(d.getDate() + days); return d; };
const isSameDay = (d1: Date, d2: Date): boolean => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

// --- VIEW COMPONENTS ---

type ViewLevel = 'Day' | 'Month';

const NewTaskModal: React.FC<{ onClose: () => void; addTask: ScheduleProps['addTask']; selectedDate: Date; projects: Project[]; notes: Note[]; categories: Category[]; showToast: (message: string) => void; }> = ({ onClose, addTask, selectedDate, projects, notes, categories, showToast }) => {
    const [taskDetails, setTaskDetails] = useState<Partial<Task>>({
        title: '',
        category: 'Prototyping',
        plannedDuration: 60,
    });
    const [startTime, setStartTime] = useState(() => {
        const now = new Date();
        now.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        return now.toTimeString().substring(0,5);
    });
    const [isParsing, setIsParsing] = useState(false);
    const [highlightedFields, setHighlightedFields] = useState<string[]>([]);
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const titleInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { titleInputRef.current?.focus(); }, []);
    
    const parseTitle = async (title: string) => {
        if (!title.startsWith('/')) {
            setAiSummary(null);
            return;
        };
        setIsParsing(true);
        const { data: parsedDetails, fallbackUsed } = await parseTaskFromString(title);

        if (fallbackUsed) {
            showToast("Kiko is using a backup model for command parsing.");
        }

        // Apply all parsed details to the main task state object
        setTaskDetails(prev => ({ ...prev, ...parsedDetails, title }));

        // Specifically update the separate time state if a valid date was parsed,
        // ensuring the modal's time input reflects the AI's understanding.
        if (parsedDetails.startTime instanceof Date) {
            const newStartTime = new Date(selectedDate);
            newStartTime.setHours(parsedDetails.startTime.getHours(), parsedDetails.startTime.getMinutes());
            setStartTime(newStartTime.toTimeString().substring(0,5));
        }

        // Update UI feedback based on what was parsed
        const parsedKeys = Object.keys(parsedDetails);
        if (parsedKeys.length > 1) { // Check if more than just title was parsed
            setHighlightedFields(parsedKeys);
            setTimeout(() => setHighlightedFields([]), 1500);

            const time = parsedDetails.startTime instanceof Date ? parsedDetails.startTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : 'a default time';
            const duration = parsedDetails.plannedDuration ? ` for ${parsedDetails.plannedDuration} min` : '';
            const category = parsedDetails.category ? ` as a ${parsedDetails.category} task` : '';
            setAiSummary(`✨ Okay, scheduling "${(parsedDetails.title || title).substring(1).trim()}"${category} at ${time}${duration}.`);
        } else {
            setAiSummary(null);
        }
        
        setIsParsing(false);
    };


    const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && taskDetails.title?.startsWith('/')) {
            e.preventDefault();
            parseTitle(taskDetails.title);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!taskDetails.title) return;

        const [hours, minutes] = startTime.split(':');
        const taskStartTime = new Date(selectedDate);
        taskStartTime.setHours(parseInt(hours), parseInt(minutes));
        
        addTask({
            ...taskDetails,
            title: taskDetails.title.startsWith('/') ? taskDetails.title.substring(1).trim() : taskDetails.title,
            startTime: taskStartTime,
        });
        onClose();
    };

    return (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-fast" onClick={onClose}>
            <motion.form 
                layout
                onSubmit={handleSubmit} 
                className="card rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4" 
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-start">
                    <h2 className="text-xl font-bold font-display">New Task</h2>
                    <button type="button" onClick={onClose} aria-label="Close modal" className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10"><XMarkIcon className="w-6 h-6"/></button>
                </div>
                <div>
                    <label htmlFor="task-title" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Use "/" for AI...</label>
                    <div className="relative">
                        <input ref={titleInputRef} type="text" id="task-title" value={taskDetails.title} onChange={e => setTaskDetails({...taskDetails, title: e.target.value})} onKeyDown={handleTitleKeyDown} required className="block w-full px-3 py-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg shadow-sm" placeholder="/ Run 5k every morning at 7am"/>
                        {isParsing && <SparklesIcon className="w-4 h-4 text-accent absolute right-3 top-1/2 -translate-y-1/2 animate-pulse" />}
                    </div>
                </div>

                <AnimatePresence>
                {aiSummary && (
                    <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-sm text-center text-light-text-secondary dark:text-dark-text-secondary p-2 bg-light-bg dark:bg-dark-bg rounded-lg border border-light-border dark:border-dark-border"
                    >
                        {aiSummary}
                    </motion.p>
                )}
                </AnimatePresence>

                 <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="task-category" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Category</label>
                        <input list="category-list" id="task-category" value={taskDetails.category} onChange={e => setTaskDetails({...taskDetails, category: e.target.value as Category})} className={`block w-full px-3 py-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg ${highlightedFields.includes('category') ? 'animate-highlight' : ''}`} />
                        <datalist id="category-list">
                            {categories.map(cat => <option key={cat} value={cat} />)}
                        </datalist>
                    </div>
                     <div>
                        <label htmlFor="task-time" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Start Time</label>
                        <input type="time" id="task-time" value={startTime} onChange={e => setStartTime(e.target.value)} required className={`block w-full px-3 py-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg ${highlightedFields.includes('startTime') ? 'animate-highlight' : ''}`} />
                    </div>
                     <div>
                        <label htmlFor="task-duration" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Duration (min)</label>
                        <input type="number" id="task-duration" value={taskDetails.plannedDuration} onChange={e => setTaskDetails({...taskDetails, plannedDuration: parseInt(e.target.value)})} required className={`block w-full px-3 py-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg ${highlightedFields.includes('plannedDuration') ? 'animate-highlight' : ''}`} />
                    </div>
                 </div>
                 
                 <AnimatePresence>
                 <motion.div layout className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <select value={taskDetails.projectId || ''} onChange={e => setTaskDetails({...taskDetails, projectId: Number(e.target.value) || undefined})} className="block w-full px-3 py-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg"><option value="">Link Project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select>
                        <select value={taskDetails.notebookId || ''} onChange={e => setTaskDetails({...taskDetails, notebookId: Number(e.target.value) || undefined})} className="block w-full px-3 py-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg"><option value="">Link Note</option>{notes.slice(0,10).map(n => <option key={n.id} value={n.id}>{n.title}</option>)}</select>
                    </div>

                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary"><LinkIcon className="w-5 h-5"/></span>
                        <input type="text" value={taskDetails.referenceUrl} onChange={e => setTaskDetails({...taskDetails, referenceUrl: e.target.value})} placeholder="Reference URL (for insights)..." className="block w-full px-3 py-2 pl-10 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg"/>
                    </div>

                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="is-virtual-toggle"
                            checked={taskDetails.isVirtual} 
                            onChange={e => setTaskDetails({...taskDetails, isVirtual: e.target.checked, location: '', linkedUrl: ''})}
                            className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                        />
                        <label htmlFor="is-virtual-toggle" className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
                            Virtual Event
                        </label>
                    </div>

                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary">
                            {taskDetails.isVirtual ? <VideoCameraIcon className="w-5 h-5"/> : <MapPinIcon className="w-5 h-5"/>}
                        </span>
                        <input type="text" value={taskDetails.isVirtual ? taskDetails.linkedUrl : taskDetails.location} onChange={e => taskDetails.isVirtual ? setTaskDetails({...taskDetails, linkedUrl: e.target.value}) : setTaskDetails({...taskDetails, location: e.target.value}) } placeholder={taskDetails.isVirtual ? "Virtual meeting link..." : "Location..."} className={`block w-full px-3 py-2 pl-10 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg ${highlightedFields.includes('location') || highlightedFields.includes('linkedUrl') || highlightedFields.includes('isVirtual') ? 'animate-highlight' : ''}`} />
                    </div>
                    </motion.div>
                </AnimatePresence>

                <button type="submit" className="w-full py-3 px-4 text-white font-semibold rounded-lg shadow-md transition-colors" style={{backgroundColor: getCategoryColor(taskDetails.category!)}}>Add Task</button>
            </motion.form>
         </div>
    )
}

const CompletedTaskCard: React.FC<{task: Task; onUndo: (taskId: number) => void; onViewTask: (task: Task) => void;}> = ({ task, onUndo, onViewTask }) => {
    const handleDownload = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!task.completionImageUrl) return;
        const link = document.createElement('a');
        link.href = task.completionImageUrl;
        link.download = `Praxis_${task.title.replace(/\s/g, '_')}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <motion.div layout key={task.id} onClick={() => onViewTask(task)} className="group relative rounded-2xl overflow-hidden aspect-[16/9] shadow-lg my-4 cursor-pointer">
            {task.completionImageUrl === 'loading' ? (
                <div className="w-full h-full bg-light-card dark:bg-dark-card animate-pulse flex flex-col items-center justify-center p-4 text-center">
                    <SparklesIcon className="w-8 h-8 text-accent animate-pulse"/>
                    <p className="text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary mt-2">The Muse is creating your victory image...</p>
                </div>
            ) : (
                 <img src={task.completionImageUrl} alt={`Completed: ${task.title}`} className="w-full h-full object-cover"/>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 flex flex-col justify-end">
                 <h4 className="font-bold text-white text-xl shadow-black [text-shadow:_0_2px_4px_var(--tw-shadow-color)] flex items-center gap-2"><CheckCircleIcon className="w-6 h-6 text-green-400"/> {task.completionSummary?.newTitle || task.title}</h4>
                 {task.completionSummary?.shortInsight && <p className="text-white/80 text-sm mt-1 [text-shadow:_0_1px_3px_var(--tw-shadow-color)]">{task.completionSummary.shortInsight}</p>}
            </div>
            <div className="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={handleDownload} className="p-2 rounded-full bg-black/40 text-white backdrop-blur-sm" aria-label="Download image">
                    <ArrowDownTrayIcon className="w-5 h-5"/>
                </button>
                <button onClick={(e) => { e.stopPropagation(); onUndo(task.id); }} className="p-2 rounded-full bg-black/40 text-white backdrop-blur-sm" aria-label="Undo completion">
                    <ArrowUturnLeftIcon className="w-5 h-5"/>
                </button>
            </div>
        </motion.div>
    );
};


const DayView: React.FC<Pick<ScheduleProps, 'tasks' | 'onViewTask' | 'updateTask' | 'onUndoTask' | 'onCompleteTask'> & { date: Date }> = ({ tasks, onViewTask, date, updateTask, onUndoTask, onCompleteTask }) => {
    const dayViewRef = useRef<HTMLDivElement>(null);
    const [draggedTask, setDraggedTask] = useState<Task | null>(null);
    const [dropIndicator, setDropIndicator] = useState<{ top: number; time: string } | null>(null);

    const tasksForDay = useMemo(() => tasks.filter(t => isSameDay(t.startTime, date)).sort((a,b) => a.startTime.getTime() - b.startTime.getTime()), [tasks, date]);
    
    const handleStatusChange = (task: Task, newStatus: TaskStatus) => {
        if (newStatus === TaskStatus.Completed) {
            onCompleteTask(task.id);
        } else {
            updateTask({ ...task, status: newStatus });
            triggerHapticFeedback('light');
        }
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, task: Task) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', task.id.toString());
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        e.dataTransfer.setDragImage(img, 0, 0);
        setTimeout(() => setDraggedTask(task), 0);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!dayViewRef.current || !draggedTask) return;

        const rect = dayViewRef.current.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const totalMinutes = 24 * 60;
        const rawMinute = (y / rect.height) * totalMinutes;
        const snappedMinute = Math.round(rawMinute / 15) * 15;
        const hours = Math.floor(snappedMinute / 60);
        const minutes = snappedMinute % 60;

        const newTime = new Date(date);
        newTime.setHours(hours, minutes);

        setDropIndicator({ top: y, time: newTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const taskId = parseInt(e.dataTransfer.getData('text/plain'), 10);
        const taskToUpdate = tasks.find(t => t.id === taskId);

        if (!dayViewRef.current || !taskToUpdate) return;
        
        const rect = dayViewRef.current.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const totalMinutes = 24 * 60;
        const rawMinute = (y / rect.height) * totalMinutes;
        const snappedMinute = Math.round(rawMinute / 15) * 15;
        const hours = Math.floor(snappedMinute / 60);
        const minutes = snappedMinute % 60;
        
        const newStartTime = new Date(taskToUpdate.startTime);
        newStartTime.setHours(hours, minutes);

        updateTask({ ...taskToUpdate, startTime: newStartTime });
        setDraggedTask(null);
        setDropIndicator(null);
    };

    const handleDragEnd = () => {
        setDraggedTask(null);
        setDropIndicator(null);
    };

    return (
        <div className="flex min-h-full py-4">
            <div className="w-24 text-center flex-shrink-0 pt-4 self-start sticky top-0">
                <p className="text-sm font-bold uppercase text-light-text-secondary dark:text-dark-text-secondary">{date.toLocaleDateString(undefined, { weekday: 'short' })}</p>
                <p className={`text-4xl font-display font-bold ${isSameDay(date, new Date()) ? 'text-accent' : ''}`}>{date.getDate()}</p>
            </div>
            <div className="w-full pl-2 pr-4 relative flex-grow" ref={dayViewRef} onDragOver={handleDragOver} onDrop={handleDrop} onDragLeave={handleDragEnd}>
                 {dropIndicator && (
                    <div className="absolute left-0 right-0 z-10 flex items-center gap-2 pointer-events-none" style={{ top: `${dropIndicator.top}px` }}>
                        <div className="text-xs font-mono text-accent bg-light-card dark:bg-dark-card px-1 rounded">{dropIndicator.time}</div>
                        <div className="h-px flex-grow bg-accent border-dashed border-t-2 border-accent"></div>
                    </div>
                )}
                 {tasksForDay.length > 0 ? (
                    <motion.div layout>
                        <AnimatePresence>
                            {tasksForDay.map(task => 
                                task.status === TaskStatus.Completed ? (
                                    <CompletedTaskCard key={task.id} task={task} onUndo={onUndoTask} onViewTask={onViewTask} />
                                ) : (
                                // FIX: Wrapped draggable element in a motion.div to resolve type conflicts between framer-motion props and native D&D handlers.
                                <motion.div
                                    key={task.id}
                                    layout
                                    className={`transition-opacity ${draggedTask?.id === task.id ? 'opacity-30' : ''}`}
                                >
                                    <div
                                        draggable={true}
                                        onClick={() => onViewTask(task)}
                                        onDragStart={(e) => handleDragStart(e, task)}
                                        onDragEnd={handleDragEnd}
                                        className="group relative flex gap-3 items-center cursor-pointer"
                                    >
                                        <div className="w-1.5 h-16 rounded-full" style={{ backgroundColor: getCategoryColor(task.category) }} />
                                        <div className="flex-grow py-3 border-b border-light-border dark:border-dark-border">
                                            <p className="font-semibold text-lg flex items-center gap-2">
                                                {task.googleCalendarEventId && <GoogleCalendarIcon className="w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary" />}
                                                {task.title}
                                            </p>
                                            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{task.startTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
                                        </div>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {task.status !== TaskStatus.InProgress && <button onClick={(e) => { e.stopPropagation(); handleStatusChange(task, TaskStatus.InProgress); }} className="p-2 rounded-full bg-blue-500/20 text-blue-500"><PlayIcon className="w-5 h-5"/></button>}
                                            <button onClick={(e) => { e.stopPropagation(); handleStatusChange(task, TaskStatus.Completed); }} className="p-2 rounded-full bg-green-500/20 text-green-500"><CheckCircleIcon className="w-5 h-5"/></button>
                                        </div>
                                        {task.status === TaskStatus.InProgress && <div className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-1 bg-accent rounded-full shadow-[0_0_8px] shadow-accent animate-pulse"></div>}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                ) : (
                    <div className="h-28 flex items-center justify-start text-sm text-light-text-secondary/70 dark:text-dark-text-secondary/70 italic">No events scheduled.</div>
                )}
            </div>
        </div>
    );
};


const MonthView: React.FC<{ currentDate: Date; tasks: Task[]; onDayClick: (date: Date) => void; }> = ({ currentDate, tasks, onDayClick }) => {
    const monthMatrix = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const dayOfWeek = firstDayOfMonth.getDay();
        const startDate = addDays(firstDayOfMonth, -dayOfWeek);
        const matrix: Date[][] = [];
        let currentDay = startDate;
        for(let i=0; i<6; i++) {
            const week: Date[] = [];
            for(let j=0; j<7; j++) {
                week.push(new Date(currentDay));
                currentDay.setDate(currentDay.getDate() + 1);
            }
            matrix.push(week);
             if (currentDay.getMonth() > month && currentDay.getFullYear() >= year && i > 3) break;
        }
        return matrix;
    }, [currentDate]);

    const tasksByDay = useMemo(() => {
        const map = new Map<string, Task[]>();
        tasks.forEach(task => {
            const dayKey = startOfDay(task.startTime).toISOString().split('T')[0];
            const dayTasks = map.get(dayKey) || [];
            dayTasks.push(task);
            map.set(dayKey, dayTasks.sort((a,b) => a.startTime.getTime() - b.startTime.getTime()));
        });
        return map;
    }, [tasks]);

    return (
        <div className="flex flex-col h-full p-2">
            <div className="grid grid-cols-7 text-center">
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                    <div key={day} className="text-xs font-bold font-display text-light-text-secondary dark:text-dark-text-secondary py-2">{day}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 grid-rows-6 flex-grow">
                {monthMatrix.flat().map((day, index) => {
                    const dayKey = day.toISOString().split('T')[0];
                    const dayTasks = tasksByDay.get(dayKey) || [];
                    const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                    return (
                        <div key={dayKey} onClick={() => onDayClick(day)} className={`border-t border-light-border dark:border-dark-border p-1.5 flex flex-col cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-200 ${index % 7 !== 6 ? 'border-r' : ''} ${!isCurrentMonth ? 'bg-light-bg/50 dark:bg-dark-bg/50 opacity-50' : ''}`}>
                            <span className={`font-semibold text-sm ${isSameDay(day, new Date()) ? 'text-accent' : isCurrentMonth ? 'text-light-text dark:text-dark-text' : 'text-light-text-secondary dark:text-dark-text-secondary'}`}>{day.getDate()}</span>
                            <div className="flex-grow space-y-1 mt-1 overflow-hidden">
                                {dayTasks.slice(0, 3).map(task => (
                                    <div key={task.id} className="w-full text-xs rounded-sm px-1 truncate text-white" style={{backgroundColor: getCategoryColor(task.category)}}>{task.title}</div>
                                ))}
                                {dayTasks.length > 3 && <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">+ {dayTasks.length - 3} more</div>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const Schedule: React.FC<ScheduleProps> = (props) => {
    const [view, setView] = useState<ViewLevel>('Day');
    const [displayDate, setDisplayDate] = useState(startOfDay(new Date())); 
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [renderedDays, setRenderedDays] = useState([startOfDay(new Date())]);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);
    
     useEffect(() => {
        if (view === 'Month') return; // Disable observer for month view

        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) {
                    setRenderedDays(prevDays => {
                        const lastDay = prevDays[prevDays.length - 1];
                        const nextDay = addDays(lastDay, 1);
                        return [...prevDays, nextDay];
                    });
                }
            },
            { root: scrollContainerRef.current, threshold: 0.1 }
        );

        if (sentinelRef.current) {
            observer.observe(sentinelRef.current);
        }

        return () => {
            if (sentinelRef.current) {
                observer.unobserve(sentinelRef.current);
            }
        };
    }, [view]);

     useEffect(() => {
        // Reset rendered days when view changes
        setRenderedDays([displayDate]);
    }, [view, displayDate]);


    const handleDateChange = (increment: number) => {
        setDisplayDate(current => {
            let newDate;
            if(view === 'Day') newDate = addDays(current, increment);
            else if(view === 'Month') newDate = new Date(current.getFullYear(), current.getMonth() + increment, 1);
            else newDate = current;
            setRenderedDays([newDate]);
            return newDate;
        });
    };
    
    return (
        <div className="card rounded-2xl h-[78vh] flex flex-col overflow-hidden">
             <AnimatePresence>{isAddingTask && <NewTaskModal onClose={() => setIsAddingTask(false)} addTask={props.addTask} selectedDate={displayDate} projects={props.projects} notes={props.notes} categories={props.categories} showToast={props.showToast} />}</AnimatePresence>
            <header className="flex-shrink-0 p-3 z-20 border-b border-light-border dark:border-dark-border">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                         <button onClick={() => { const today = startOfDay(new Date()); setDisplayDate(today); setRenderedDays([today]); setView('Day'); }} className="text-sm font-bold p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">TODAY</button>
                         <button onClick={() => handleDateChange(-1)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10"><ChevronLeftIcon className="w-5 h-5"/></button>
                         <button onClick={() => handleDateChange(1)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10"><ChevronRightIcon className="w-5 h-5"/></button>
                         <h3 className="font-semibold">{displayDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric', day: view === 'Day' ? 'numeric' : undefined })}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={props.onSyncCalendar} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10" aria-label="Sync with Google Calendar">
                            <GoogleCalendarIcon className="w-5 h-5"/>
                        </button>
                        <div className="p-1 bg-light-bg dark:bg-dark-bg rounded-lg flex items-center">
                           <button onClick={() => setView('Month')} className={`p-2 rounded-lg ${view === 'Month' ? 'bg-accent text-white' : 'hover:bg-black/5 dark:hover:bg-white/10'}`} aria-label="Switch to Month View">
                                <CalendarIcon className="w-5 h-5" />
                           </button>
                        </div>
                        <button onClick={() => setIsAddingTask(true)} className="p-2 rounded-lg bg-accent text-white" aria-label="Add Task"><PlusCircleIcon className="w-5 h-5"/></button>
                    </div>
                </div>
            </header>
            
            <main ref={scrollContainerRef} className="flex-grow overflow-y-auto relative">
                {view === 'Day' && (
                    <div>
                        {renderedDays.map(day => <DayView key={day.toISOString()} {...props} date={day} />)}
                        <div ref={sentinelRef} style={{ height: '1px' }} />
                    </div>
                )}
                 {view === 'Month' && <MonthView tasks={props.tasks} onDayClick={d => { setDisplayDate(d); setView('Day'); }} currentDate={displayDate} />}
            </main>
        </div>
    );
};

export default Schedule;