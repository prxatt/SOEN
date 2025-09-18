import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, Category, TaskStatus, Project, Note } from '../types';
import { SparklesIcon, XMarkIcon, BriefcaseIcon, DocumentTextIcon, MapPinIcon, VideoCameraIcon, ClockIcon, LinkIcon, ArrowPathIcon, LightBulbIcon, HeartIcon, RocketIcon, UserIcon, ChartBarIcon, FlagIcon } from './Icons';
import { getAutocompleteSuggestions } from '../services/geminiService';
import { parseTaskFromString } from '../services/kikoAIService';
import { getTopCategories } from '../utils/taskUtils';

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

const getTextColorForBackground = (hexColor: string): 'black' | 'white' => {
    if (!hexColor.startsWith('#')) return 'black';
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? 'black' : 'white';
};

function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    return (...args: Parameters<F>): void => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), waitFor);
    };
}

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
    const [showTempMessage, setShowTempMessage] = useState(true);

    const titleInputRef = useRef<HTMLInputElement>(null);
    const topCategories = useMemo(() => getTopCategories(allTasks, 5), [allTasks]);
    const otherCategories = useMemo(() => categories.filter(c => !topCategories.includes(c) && c !== taskDetails.category), [categories, topCategories, taskDetails.category]);

    useEffect(() => { titleInputRef.current?.focus(); }, []);
    
    // Show temp message for new tasks
    useEffect(() => {
        const timer = setTimeout(() => setShowTempMessage(false), 3000);
        return () => clearTimeout(timer);
    }, []);

    // Get category icon
    const getCategoryIcon = (category: Category) => {
        switch (category) {
            case 'Meeting': return <VideoCameraIcon className="w-5 h-5" />;
            case 'Learning': return <LightBulbIcon className="w-5 h-5" />;
            case 'Workout': return <HeartIcon className="w-5 h-5" />;
            case 'Prototyping': return <RocketIcon className="w-5 h-5" />;
            case 'Editing': return <DocumentTextIcon className="w-5 h-5" />;
            case 'Personal': return <UserIcon className="w-5 h-5" />;
            case 'Admin': return <BriefcaseIcon className="w-5 h-5" />;
            case 'Deep Work': return <ChartBarIcon className="w-5 h-5" />;
            default: return <BriefcaseIcon className="w-5 h-5" />;
        }
    };
    
    const debouncedParse = useCallback(debounce(async (title: string) => {
        if (!title.startsWith('/') || title.length < 4) {
            setAiSummary(null);
            return;
        }
        setIsParsing(true);
        try {
            const { data: parsedDetails, fallbackUsed } = await parseTaskFromString(title);

            if (fallbackUsed) {
                showToast("Kiko is using a backup model for command parsing.");
            }
            
            setTaskDetails(prev => ({ ...prev, ...parsedDetails }));

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
                setAiSummary(`✨ Scheduling "${finalTitle}"${category}${time ? ' at ' + time : ''}${duration}.`);
            } else {
                setAiSummary(null);
            }
        } catch (error) {
            console.error('AI parsing error:', error);
            setAiSummary(null);
        } finally {
            setIsParsing(false);
        }
    }, 1200), [showToast, selectedDate]);

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
        const finalTitle = taskDetails.title?.startsWith('/') 
            ? (taskDetails.title || "New Task") // Use AI-parsed title if available
            : taskDetails.title;

        if (!finalTitle) {
            showToast("Please enter a title for the task.");
            return;
        }

        const [hours, minutes] = startTime.split(':');
        const taskStartTime = new Date(selectedDate);
        taskStartTime.setHours(parseInt(hours), parseInt(minutes));
        
        addTask({
            ...taskDetails,
            title: finalTitle,
            startTime: taskStartTime,
        });
        onClose();
    };
    
    const categoryColor = categoryColors[taskDetails.category!] || '#A855F7';
    const textColor = getTextColorForBackground(categoryColor);
    
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const monthNum = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const month = selectedDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                <div 
                    key={taskDetails.category}
                    className="rounded-3xl p-6 shadow-2xl transition-all duration-300"
                    style={{ backgroundColor: categoryColor, color: textColor }}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                                <p className="font-semibold opacity-80 text-sm">{dayOfWeek}</p>
                                <p className="text-3xl font-bold font-display tracking-tighter leading-none">{monthNum}.{day}</p>
                                <p className="text-3xl font-bold font-display tracking-tight leading-none opacity-60">{month}</p>
                            </div>
                            
                            <div className="border-l border-current/20 pl-3">
                                <div className="flex items-center gap-2">
                                    {getCategoryIcon(taskDetails.category!)}
                                    <h2 className="text-2xl font-bold font-display">New Task</h2>
                                </div>
                                {showTempMessage && (
                                    <motion.p 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="opacity-70 mt-0.5 text-sm"
                                    >
                                        ✨ Kiko is ready to help you organize your day
                                    </motion.p>
                                )}
                            </div>
                        </div>
                        
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="p-2 rounded-full transition-colors" 
                            style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}
                        >
                            <XMarkIcon className="w-6 h-6"/>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div className="relative">
                            <input 
                                ref={titleInputRef} 
                                type="text" 
                                value={taskDetails.title} 
                                onChange={handleTitleChange} 
                                required 
                                className="w-full text-xl font-bold px-5 py-3 rounded-2xl border-2 border-current/20 focus:border-current/40 focus:outline-none transition-colors"
                                style={{ 
                                    backgroundColor: 'rgba(0,0,0,0.1)',
                                    color: textColor,
                                }}
                                placeholder="Enter task title..."
                            />
                            {isParsing && (
                                <SparklesIcon 
                                    className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 animate-pulse" 
                                    style={{ color: textColor, opacity: 0.7 }}
                                />
                            )}
                        </div>

                        <AnimatePresence>
                            {aiSummary && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }} 
                                    animate={{ opacity: 1, y: 0 }} 
                                    exit={{ opacity: 0, y: -10 }}
                                    className="px-3 py-2 rounded-xl text-center font-medium text-sm"
                                    style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}
                                >
                                    {aiSummary}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="grid grid-cols-2 gap-3">
                            <div 
                                className={`p-3 rounded-2xl transition-all duration-300 ${highlightedFields.includes('category') ? 'ring-2 ring-current' : ''}`}
                                style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}
                            >
                                <label className="flex items-center gap-1.5 font-semibold opacity-70 mb-1.5 text-sm">
                                    <BriefcaseIcon className="w-4 h-4" /> Category
                                </label>
                                <select
                                    value={taskDetails.category}
                                    onChange={handleCategoryChange}
                                    className="w-full bg-transparent text-lg font-bold focus:outline-none appearance-none"
                                    style={{ color: textColor }}
                                >
                                    <optgroup label="Top Categories">
                                        {topCategories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </optgroup>
                                    {otherCategories.length > 0 && (
                                        <optgroup label="Other Categories">
                                            {otherCategories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </optgroup>
                                    )}
                                    <option value="CREATE_NEW" style={{ fontStyle: 'italic' }}>+ Create New...</option>
                                </select>
                            </div>

                            <div className={`p-3 rounded-2xl ${highlightedFields.includes('plannedDuration') ? 'animate-pulse' : ''}`} style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                                <label className="font-semibold opacity-70 mb-1.5 block text-sm">Duration (min)</label>
                                <input 
                                    type="number" 
                                    value={taskDetails.plannedDuration} 
                                    onChange={e => setTaskDetails({...taskDetails, plannedDuration: parseInt(e.target.value)})} 
                                    required 
                                    className="w-full bg-transparent text-lg font-bold focus:outline-none"
                                    style={{ color: textColor }}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className={`p-3 rounded-2xl ${highlightedFields.includes('startTime') ? 'animate-pulse' : ''}`} style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                                <label className="flex items-center gap-1.5 font-semibold opacity-70 mb-1.5 text-sm">
                                    <ClockIcon className="w-4 h-4"/> Start Time
                                </label>
                                <input 
                                    type="time" 
                                    value={startTime} 
                                    onChange={e => setStartTime(e.target.value)} 
                                    required 
                                    className="w-full bg-transparent text-lg font-bold focus:outline-none"
                                    style={{ color: textColor }}
                                />
                            </div>
                            
                            <div className="p-3 rounded-2xl" style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                                <label className="flex items-center gap-1.5 font-semibold opacity-70 mb-1.5 text-sm">
                                    <ArrowPathIcon className="w-4 h-4"/> Repeat
                                </label>
                                <select 
                                    value={taskDetails.repeat || 'none'} 
                                    onChange={e => setTaskDetails({...taskDetails, repeat: e.target.value as Task['repeat']})} 
                                    className="w-full bg-transparent text-lg font-bold focus:outline-none appearance-none"
                                    style={{ color: textColor }}
                                >
                                    <option value="none">None</option>
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </div>
                        </div>

                        <div 
                            className={`flex items-center justify-between p-3 rounded-2xl ${highlightedFields.includes('isVirtual') ? 'ring-2 ring-current' : ''}`}
                            style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}
                        >
                            <label className="text-lg font-bold">Virtual Event</label>
                            <button 
                                type="button" 
                                onClick={() => setTaskDetails({...taskDetails, isVirtual: !taskDetails.isVirtual, location: '', linkedUrl: ''})} 
                                className="relative inline-flex items-center h-6 rounded-full w-11 transition-colors"
                                style={{ 
                                    backgroundColor: taskDetails.isVirtual ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'
                                }}
                            >
                                <span 
                                    className="inline-block w-4 h-4 transform bg-current rounded-full transition-transform"
                                    style={{
                                        transform: taskDetails.isVirtual ? 'translateX(1.25rem)' : 'translateX(0.25rem)',
                                        opacity: 0.9
                                    }}
                                />
                            </button>
                        </div>

                        {!taskDetails.isVirtual ? (
                            <div 
                                className={`p-3 rounded-2xl relative ${highlightedFields.includes('location') ? 'ring-2 ring-current' : ''}`}
                                style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}
                            >
                                <label className="flex items-center gap-1.5 font-semibold opacity-70 mb-1.5 text-sm">
                                    <MapPinIcon className="w-4 h-4"/> Location
                                </label>
                                <input 
                                    type="text" 
                                    value={taskDetails.location || ''} 
                                    onChange={e => handleLocationChange(e.target.value)} 
                                    className="w-full bg-transparent text-lg font-bold focus:outline-none"
                                    style={{ color: textColor }}
                                    placeholder="Where will this happen?"
                                />
                                {locationSuggestions.length > 0 && (
                                    <div 
                                        className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden shadow-lg z-10"
                                        style={{ backgroundColor: categoryColor }}
                                    >
                                        {locationSuggestions.slice(0, 3).map((suggestion, index) => (
                                            <button 
                                                key={index} 
                                                type="button" 
                                                onClick={() => handleLocationSuggestionClick(suggestion)} 
                                                className="w-full text-left p-2 text-sm transition-colors"
                                                style={{ 
                                                    backgroundColor: 'rgba(0,0,0,0.05)',
                                                    borderBottom: index < Math.min(locationSuggestions.length, 3) - 1 ? '1px solid rgba(0,0,0,0.1)' : 'none'
                                                }}
                                            >
                                                <div className="font-medium">{suggestion.place_name}</div>
                                                <div className="text-xs opacity-70">{suggestion.address}</div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div 
                                className={`p-3 rounded-2xl ${highlightedFields.includes('linkedUrl') ? 'ring-2 ring-current' : ''}`}
                                style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}
                            >
                                <label className="flex items-center gap-1.5 font-semibold opacity-70 mb-1.5 text-sm">
                                    <LinkIcon className="w-4 h-4"/> Meeting Link
                                </label>
                                <input 
                                    type="url" 
                                    value={taskDetails.linkedUrl || ''} 
                                    onChange={e => setTaskDetails({...taskDetails, linkedUrl: e.target.value})} 
                                    className="w-full bg-transparent text-lg font-bold focus:outline-none"
                                    style={{ color: textColor }}
                                    placeholder="https://zoom.us/j/..."
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-2xl" style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                                <label className="flex items-center gap-1.5 font-semibold opacity-70 mb-1.5 text-sm">
                                    <DocumentTextIcon className="w-4 h-4"/> Notes
                                </label>
                                <textarea 
                                    value={taskDetails.notes || ''} 
                                    onChange={e => setTaskDetails({...taskDetails, notes: e.target.value})} 
                                    rows={2} 
                                    className="w-full bg-transparent text-sm focus:outline-none resize-none"
                                    style={{ color: textColor }}
                                    placeholder="Quick details..."
                                />
                            </div>
                            
                             <div className="p-3 rounded-2xl" style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                                <label className="flex items-center gap-1.5 font-semibold opacity-70 mb-1.5 text-sm">
                                    <LinkIcon className="w-4 h-4"/> Link Note
                                </label>
                                <select 
                                    value={taskDetails.linkedNoteId || ''} 
                                    onChange={e => setTaskDetails({...taskDetails, linkedNoteId: e.target.value ? parseInt(e.target.value, 10) : undefined})} 
                                    className="w-full bg-transparent text-sm font-bold focus:outline-none appearance-none"
                                    style={{ color: textColor }}
                                >
                                    <option value="" className="text-black bg-white">No linked note</option>
                                    {notes.filter(n => !n.deletedAt).map(note => (
                                        <option key={note.id} value={note.id} className="text-black bg-white">
                                            {note.title.length > 20 ? note.title.slice(0, 20) + '...' : note.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-3">
                            <button 
                                type="button" 
                                onClick={onClose} 
                                className="flex-1 py-3 px-4 rounded-2xl text-lg font-bold transition-colors"
                                style={{ 
                                    backgroundColor: 'rgba(0,0,0,0.2)',
                                    color: textColor 
                                }}
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className="flex-1 py-3 px-4 rounded-2xl text-lg font-bold transition-colors"
                                style={{ 
                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                    color: textColor 
                                }}
                            >
                                Create Task
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}

export default NewTaskModal;