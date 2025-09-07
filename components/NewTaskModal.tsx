import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, Category, TaskStatus, Project, Note } from '../types';
import { SparklesIcon, XMarkIcon, BriefcaseIcon, DocumentTextIcon, MapPinIcon, VideoCameraIcon, ClockIcon, LinkIcon, ArrowPathIcon } from './Icons';
import { getAutocompleteSuggestions } from '../services/geminiService';
import { parseTaskFromString } from '../services/kikoAIService';
import { getTopCategories } from '../utils/taskUtils';

// --- PROPS ---
interface NewTaskModalProps {
  onClose: () => void;
  addTask: (task: Partial<Task> & { title: string }) => void;
  selectedDate: Date;
  projects: Project[];
  notes: Note[];
  categories: Category[];
  categoryColors: Record<Category, string>;
  onAddNewCategory: (name: string) => boolean;
  allTasks: Task[];
  showToast: (message: string) => void;
}

function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    return (...args: Parameters<F>): void => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), waitFor);
    };
}


// FIX: Refactor to a standard function component to avoid potential type issues with React.FC and framer-motion.
function NewTaskModal({ onClose, addTask, selectedDate, projects, notes, categories, categoryColors, onAddNewCategory, allTasks, showToast }: NewTaskModalProps) {
    const [taskDetails, setTaskDetails] = useState<Partial<Task>>({
        title: '',
        category: 'Meeting', 
        plannedDuration: 60,
        repeat: 'none',
        isVirtual: false,
    });
    const [startTime, setStartTime] = useState(() => {
        const initialDate = new Date(selectedDate);
        if (initialDate.getMinutes() > 0 || initialDate.getSeconds() > 0 || initialDate.getMilliseconds() > 0) {
            return initialDate.toTimeString().substring(0, 5);
        }
        const nextHour = new Date();
        nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
        return nextHour.toTimeString().substring(0, 5);
    });
    const [isParsing, setIsParsing] = useState(false);
    const [highlightedFields, setHighlightedFields] = useState<string[]>([]);
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [locationSuggestions, setLocationSuggestions] = useState<{place_name: string; address: string}[]>([]);

    const titleInputRef = useRef<HTMLInputElement>(null);
    const topCategories = useMemo(() => getTopCategories(allTasks, 5), [allTasks]);
    const otherCategories = useMemo(() => categories.filter(c => !topCategories.includes(c) && c !== taskDetails.category), [categories, topCategories, taskDetails.category]);

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

        const parsedKeys = Object.keys(parsedDetails);
        if (parsedKeys.length > 0) {
            setHighlightedFields(parsedKeys);
            setTimeout(() => setHighlightedFields([]), 1500);
            
            const time = parsedDetails.startTime instanceof Date ? parsedDetails.startTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : '';
            const duration = parsedDetails.plannedDuration ? ` for ${parsedDetails.plannedDuration} min` : '';
            const category = parsedDetails.category ? ` as a ${parsedDetails.category} task` : '';
            const finalTitle = (parsedDetails.title || title.substring(1).trim().split('@')[0].trim());
            setAiSummary(`✨ Okay, scheduling "${finalTitle}"${category}${time ? ' at ' + time : ''}${duration}.`);
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

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === 'CREATE_NEW') {
            const newCategoryName = prompt('Enter new category name:');
            if (newCategoryName && newCategoryName.trim()) {
                const success = onAddNewCategory(newCategoryName.trim());
                if (success) {
                    setTaskDetails({...taskDetails, category: newCategoryName.trim() as Category});
                }
            }
        } else {
            setTaskDetails({...taskDetails, category: value as Category});
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
            ? (aiSummary ? aiSummary.split('"')[1] : taskDetails.title.substring(1).split('@')[0].trim() || "New Task")
            : taskDetails.title;

        addTask({
            ...taskDetails,
            title: finalTitle,
            startTime: taskStartTime,
        });
        onClose();
    };
    
    const categoryColor = categoryColors[taskDetails.category!] || '#A855F7';

    return (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-fast" onClick={onClose}>
            <motion.form 
                layout
                onSubmit={handleSubmit} 
                className="bg-[#F0F2F5] dark:bg-zinc-900 rounded-3xl shadow-xl w-full max-w-md p-6" 
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-3xl font-bold font-display text-black dark:text-white">New Task</h2>
                        <p className="text-md text-text-secondary mt-1">Use "/" for AI magic...</p>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Close modal" className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10"><XMarkIcon className="w-6 h-6"/></button>
                </div>
                
                <div className="space-y-4">
                    <div className="relative">
                        <input 
                            ref={titleInputRef} 
                            type="text" 
                            id="task-title" 
                            value={taskDetails.title} 
                            onChange={handleTitleChange} 
                            required 
                            className="block w-full text-lg px-4 py-3 bg-white dark:bg-zinc-800 border-2 border-transparent rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-card"
                            style={{borderColor: categoryColor}}
                            placeholder="/meeting w/ Apoorva @ 3pm for 3hr"
                        />
                        {isParsing && <SparklesIcon className="w-5 h-5 text-accent absolute right-3 top-1/2 -translate-y-1/2 animate-pulse" />}
                    </div>
                     
                    <AnimatePresence>
                    {aiSummary && (
                        <motion.p 
                            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="text-xs text-center text-text-secondary p-2 bg-white/80 dark:bg-zinc-800/50 rounded-lg"
                        >{aiSummary}</motion.p>
                    )}
                    </AnimatePresence>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className={`relative p-3 bg-white dark:bg-zinc-800 rounded-xl ${highlightedFields.includes('category') ? 'animate-highlight' : ''}`}>
                            <label className="flex items-center gap-2 font-semibold text-text-secondary mb-1">
                                <BriefcaseIcon className="w-4 h-4" /> Category
                            </label>
                            <select
                                id="task-category"
                                value={taskDetails.category}
                                onChange={handleCategoryChange}
                                className={`block w-full bg-transparent font-bold appearance-none focus:outline-none text-black dark:text-white`}
                            >
                                <optgroup label="Top Categories">{topCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</optgroup>
                                {otherCategories.length > 0 && <optgroup label="Other Categories">{otherCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</optgroup>}
                                <option value="CREATE_NEW" style={{ fontStyle: 'italic' }}>+ Create New...</option>
                            </select>
                        </div>
                         <div className="relative p-3 bg-white dark:bg-zinc-800 rounded-xl">
                             <label className="flex items-center gap-2 font-semibold text-text-secondary mb-1">
                                <ArrowPathIcon className="w-4 h-4"/> Repeat
                            </label>
                             <select id="task-repeat" value={taskDetails.repeat || 'none'} onChange={e => setTaskDetails({...taskDetails, repeat: e.target.value as Task['repeat']})} className="block w-full bg-transparent font-bold appearance-none focus:outline-none text-black dark:text-white">
                                <option value="none">Does not repeat</option>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>
                    </div>

                    <div className={`grid grid-cols-2 gap-3 p-3 bg-white dark:bg-zinc-800 rounded-xl`}>
                        <div className={`${highlightedFields.includes('startTime') ? 'animate-highlight' : ''}`}>
                            <label className="flex items-center gap-2 font-semibold text-text-secondary mb-1"><ClockIcon className="w-4 h-4"/> Start Time</label>
                            <input type="time" id="task-time" value={startTime} onChange={e => setStartTime(e.target.value)} required className={`block w-full bg-transparent font-bold focus:outline-none text-black dark:text-white`} />
                        </div>
                        <div className={`${highlightedFields.includes('plannedDuration') ? 'animate-highlight' : ''}`}>
                            <label className="font-semibold text-text-secondary mb-1">Duration (min)</label>
                            <input type="number" id="task-duration" value={taskDetails.plannedDuration} onChange={e => setTaskDetails({...taskDetails, plannedDuration: parseInt(e.target.value)})} required className={`block w-full bg-transparent font-bold focus:outline-none text-black dark:text-white`} />
                        </div>
                    </div>
                    
                     <div className="space-y-3">
                         <div className={`flex items-center justify-between p-3 bg-white dark:bg-zinc-800 rounded-xl ${highlightedFields.includes('isVirtual') ? 'animate-highlight' : ''}`}>
                             <label htmlFor="is-virtual-toggle" className="font-bold text-black dark:text-white">Virtual Event</label>
                             <button type="button" role="switch" aria-checked={taskDetails.isVirtual} onClick={() => setTaskDetails({...taskDetails, isVirtual: !taskDetails.isVirtual, location: '', linkedUrl: ''})} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${taskDetails.isVirtual ? 'bg-accent' : 'bg-gray-300 dark:bg-zinc-700'}`}>
                                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${taskDetails.isVirtual ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        <div className="relative">
                            <div className={`relative p-3 bg-white dark:bg-zinc-800 rounded-xl ${highlightedFields.includes('location') || highlightedFields.includes('linkedUrl') ? 'animate-highlight' : ''}`}>
                                 <label className="flex items-center gap-2 font-semibold text-text-secondary mb-1">
                                     {taskDetails.isVirtual ? <VideoCameraIcon className="w-4 h-4"/> : <MapPinIcon className="w-4 h-4"/>}
                                     {taskDetails.isVirtual ? "Meeting Link" : "Location"}
                                </label>
                                <input type="text" value={taskDetails.isVirtual ? taskDetails.linkedUrl : taskDetails.location} onChange={e => taskDetails.isVirtual ? setTaskDetails({...taskDetails, linkedUrl: e.target.value}) : handleLocationChange(e.target.value) } placeholder={taskDetails.isVirtual ? "https://..." : "Add a location..."} className={`block w-full bg-transparent font-bold focus:outline-none text-black dark:text-white`} />
                            </div>
                            {locationSuggestions.length > 0 && !taskDetails.isVirtual && (
                                <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg">
                                    {locationSuggestions.map(s => <div key={s.address} onClick={() => handleLocationSuggestionClick(s)} className="p-2 hover:bg-accent/10 cursor-pointer text-sm"><strong>{s.place_name}</strong><br/><span className="text-xs text-text-secondary">{s.address}</span></div>)}
                                </div>
                            )}
                        </div>
                     </div>
                </div>

                <button type="submit" className="w-full mt-6 py-3 px-4 text-white font-bold rounded-xl shadow-md transition-colors" style={{backgroundColor: categoryColor}}>Add Task</button>
            </motion.form>
         </div>
    )
}

export default NewTaskModal;
