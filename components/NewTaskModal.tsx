import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, Category, TaskStatus, Project, Note } from '../types';
import { getCategoryColor } from '../constants';
import { PlusCircleIcon, ChevronLeftIcon, ChevronRightIcon, SparklesIcon, XMarkIcon, BriefcaseIcon, DocumentTextIcon, MapPinIcon, VideoCameraIcon, PaperClipIcon, PlayIcon, CheckCircleIcon, ArrowUturnLeftIcon, CalendarIcon, LinkIcon } from './Icons';
import { triggerHapticFeedback } from '../utils/haptics';
import { getAutocompleteSuggestions } from '../services/geminiService';
import { parseTaskFromString } from '../services/kikoAIService';

// --- PROPS ---
interface NewTaskModalProps {
  onClose: () => void;
  addTask: (task: Partial<Task> & { title: string }) => void;
  selectedDate: Date;
  projects: Project[];
  notes: Note[];
  categories: Category[];
  showToast: (message: string) => void;
}

function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    return (...args: Parameters<F>): void => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), waitFor);
    };
}


const NewTaskModal: React.FC<NewTaskModalProps> = ({ onClose, addTask, selectedDate, projects, notes, categories, showToast }) => {
    const [taskDetails, setTaskDetails] = useState<Partial<Task>>({
        title: '',
        category: 'Prototyping',
        plannedDuration: 60,
        repeat: 'none',
    });
    const [startTime, setStartTime] = useState(() => {
        const now = new Date();
        now.setHours(now.getHours() + 1, 0, 0, 0); // Default to next hour
        now.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        return now.toTimeString().substring(0,5);
    });
    const [isParsing, setIsParsing] = useState(false);
    const [highlightedFields, setHighlightedFields] = useState<string[]>([]);
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [locationSuggestions, setLocationSuggestions] = useState<{place_name: string; address: string}[]>([]);

    const titleInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { titleInputRef.current?.focus(); }, []);
    
    const debouncedParse = useCallback(debounce(async (title: string) => {
        if (!title.startsWith('/')) {
            setAiSummary(null);
            return;
        }
        setIsParsing(true);
        const { data: parsedDetails, fallbackUsed } = await parseTaskFromString(title);

        if (fallbackUsed) {
            showToast("Kiko is using a backup model for command parsing.");
        }
        
        const updatePayload = { ...parsedDetails };
        delete updatePayload.title;
        setTaskDetails(prev => ({ ...prev, ...updatePayload }));

        if (parsedDetails.startTime instanceof Date) {
            const newStartTime = new Date(selectedDate);
            newStartTime.setHours(parsedDetails.startTime.getHours(), parsedDetails.startTime.getMinutes());
            setStartTime(newStartTime.toTimeString().substring(0,5));
        }

        const parsedKeys = Object.keys(parsedDetails).filter(k => k !== 'title');
        if (parsedKeys.length > 0) {
            setHighlightedFields(parsedKeys);
            setTimeout(() => setHighlightedFields([]), 1500);
            const time = parsedDetails.startTime instanceof Date ? parsedDetails.startTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : 'a default time';
            const duration = parsedDetails.plannedDuration ? ` for ${parsedDetails.plannedDuration} min` : '';
            const category = parsedDetails.category ? ` as a ${parsedDetails.category} task` : '';
            const finalTitle = (parsedDetails.title || title.substring(1).trim().split('@')[0].trim());
            setAiSummary(`✨ Okay, scheduling "${finalTitle}"${category} at ${time}${duration}.`);
        } else {
            setAiSummary(null);
        }
        
        setIsParsing(false);
    }, 700), [showToast, selectedDate]);


    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value;
        setTaskDetails(prev => ({...prev, title: newTitle}));
        if (newTitle.startsWith('/')) {
            setIsParsing(true);
            debouncedParse(newTitle);
        } else {
            setIsParsing(false);
            setAiSummary(null);
        }
    };

    const handleLocationChange = async (value: string) => {
        setTaskDetails(prev => ({...prev, location: value}));
        if (value.length > 2) {
            const suggestions = await getAutocompleteSuggestions(value);
            setLocationSuggestions(suggestions);
        } else {
            setLocationSuggestions([]);
        }
    };

    const handleLocationSuggestionClick = (suggestion: {place_name: string; address: string}) => {
        setTaskDetails(prev => ({...prev, location: suggestion.address}));
        setLocationSuggestions([]);
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!taskDetails.title) return;

        const [hours, minutes] = startTime.split(':');
        const taskStartTime = new Date(selectedDate);
        taskStartTime.setHours(parseInt(hours), parseInt(minutes));
        
        const finalTitle = taskDetails.title.startsWith('/') 
            ? (taskDetails.title.substring(1).trim().split('@')[0].trim() || "New Task from command")
            : taskDetails.title;

        addTask({
            ...taskDetails,
            title: finalTitle,
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
                    <label htmlFor="task-title" className="block text-sm font-medium text-text-secondary mb-1">Use "/" for AI magic...</label>
                    <div className="relative">
                        <input ref={titleInputRef} type="text" id="task-title" value={taskDetails.title} onChange={handleTitleChange} required className="block w-full px-3 py-2 bg-bg border border-border rounded-lg shadow-sm" placeholder="/meeting w/ Apoorva @ 3pm for 1hr"/>
                        {isParsing && <SparklesIcon className="w-4 h-4 text-accent absolute right-3 top-1/2 -translate-y-1/2 animate-pulse" />}
                    </div>
                </div>

                <AnimatePresence>
                {aiSummary && (
                    <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-sm text-center text-text-secondary p-2 bg-bg rounded-lg border border-border"
                    >
                        {aiSummary}
                    </motion.p>
                )}
                </AnimatePresence>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="task-category" className="block text-sm font-medium text-text-secondary mb-1">Category</label>
                        <input list="category-list" id="task-category" value={taskDetails.category} onChange={e => setTaskDetails({...taskDetails, category: e.target.value as Category})} className={`block w-full px-3 py-2 bg-bg border border-border rounded-lg ${highlightedFields.includes('category') ? 'animate-highlight' : ''}`} />
                        <datalist id="category-list">
                            {categories.map(cat => <option key={cat} value={cat} />)}
                        </datalist>
                    </div>
                    <div>
                        <label htmlFor="task-repeat" className="block text-sm font-medium text-text-secondary mb-1">Repeat</label>
                        <select id="task-repeat" value={taskDetails.repeat || 'none'} onChange={e => setTaskDetails({...taskDetails, repeat: e.target.value as Task['repeat']})} className="block w-full px-3 py-2 bg-bg border border-border rounded-lg">
                            <option value="none">Does not repeat</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor="task-time" className="block text-sm font-medium text-text-secondary mb-1">Start Time</label>
                        <input type="time" id="task-time" value={startTime} onChange={e => setStartTime(e.target.value)} required className={`block w-full px-3 py-2 bg-bg border border-border rounded-lg ${highlightedFields.includes('startTime') ? 'animate-highlight' : ''}`} />
                    </div>
                     <div>
                        <label htmlFor="task-duration" className="block text-sm font-medium text-text-secondary mb-1">Duration (min)</label>
                        <input type="number" id="task-duration" value={taskDetails.plannedDuration} onChange={e => setTaskDetails({...taskDetails, plannedDuration: parseInt(e.target.value)})} required className={`block w-full px-3 py-2 bg-bg border border-border rounded-lg ${highlightedFields.includes('plannedDuration') ? 'animate-highlight' : ''}`} />
                    </div>
                 </div>
                 
                 <AnimatePresence>
                 <motion.div layout className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <select value={taskDetails.projectId || ''} onChange={e => setTaskDetails({...taskDetails, projectId: Number(e.target.value) || undefined})} className="block w-full px-3 py-2 bg-bg border border-border rounded-lg"><option value="">Link Project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select>
                        <select value={taskDetails.notebookId || ''} onChange={e => setTaskDetails({...taskDetails, notebookId: Number(e.target.value) || undefined})} className="block w-full px-3 py-2 bg-bg border border-border rounded-lg"><option value="">Link Note</option>{notes.slice(0,10).map(n => <option key={n.id} value={n.id}>{n.title}</option>)}</select>
                    </div>

                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"><LinkIcon className="w-5 h-5"/></span>
                        <input type="text" value={taskDetails.referenceUrl} onChange={e => setTaskDetails({...taskDetails, referenceUrl: e.target.value})} placeholder="Reference URL (for insights)..." className="block w-full px-3 py-2 pl-10 bg-bg border border-border rounded-lg"/>
                    </div>

                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="is-virtual-toggle"
                            checked={taskDetails.isVirtual} 
                            onChange={e => setTaskDetails({...taskDetails, isVirtual: e.target.checked, location: '', linkedUrl: ''})}
                            className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                        />
                        <label htmlFor="is-virtual-toggle" className="text-sm font-medium text-text-secondary">
                            Virtual Event
                        </label>
                    </div>

                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
                            {taskDetails.isVirtual ? <VideoCameraIcon className="w-5 h-5"/> : <MapPinIcon className="w-5 h-5"/>}
                        </span>
                        <input type="text" value={taskDetails.isVirtual ? taskDetails.linkedUrl : taskDetails.location} onChange={e => taskDetails.isVirtual ? setTaskDetails({...taskDetails, linkedUrl: e.target.value}) : handleLocationChange(e.target.value) } placeholder={taskDetails.isVirtual ? "Virtual meeting link..." : "Location..."} className={`block w-full px-3 py-2 pl-10 bg-bg border border-border rounded-lg ${highlightedFields.includes('location') || highlightedFields.includes('linkedUrl') || highlightedFields.includes('isVirtual') ? 'animate-highlight' : ''}`} />
                         {locationSuggestions.length > 0 && !taskDetails.isVirtual && (
                            <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg">
                                {locationSuggestions.map(s => <div key={s.address} onClick={() => handleLocationSuggestionClick(s)} className="p-2 hover:bg-accent/10 cursor-pointer text-sm"><strong>{s.place_name}</strong><br/><span className="text-xs text-text-secondary">{s.address}</span></div>)}
                            </div>
                        )}
                    </div>
                    </motion.div>
                </AnimatePresence>

                <button type="submit" className="w-full py-3 px-4 text-white font-semibold rounded-lg shadow-md transition-colors" style={{backgroundColor: getCategoryColor(taskDetails.category!)}}>Add Task</button>
            </motion.form>
         </div>
    )
}

export default NewTaskModal;