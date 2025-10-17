import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Task, Note, Project, Goal, TaskStatus, Category, Notebook, ChatMessage, InsightWidgetData } from '../types';
import { CheckCircleIcon, XMarkIcon, SparklesIcon, DocumentTextIcon, LinkIcon, ArrowPathIcon, PlusIcon, VideoCameraIcon, LightBulbIcon, ClockIcon, MapPinIcon, UserIcon, PhotoIcon, ChartBarIcon, HeartIcon, RocketIcon, FlagIcon, ChatBubbleLeftEllipsisIcon, BriefcaseIcon, ChevronDownIcon, CheckIcon, SunIcon, CloudIcon, BoltIcon } from './Icons';
import * as Icons from './Icons';
import { ResponsiveContainer, BarChart, Bar, Cell, RadialBarChart, RadialBar, Tooltip } from 'recharts';
import { miraRequestWithRouting, getUserContext } from '../services/miraAIOrchestratorMigration';

interface EventDetailProps {
    task: Task;
    allTasks: Task[];
    notes: Note[];
    notebooks: Notebook[];
    projects: Project[];
    goals: Goal[];
    updateTask: (task: Task) => void;
    onComplete: () => void;
    onUndoCompleteTask: (task: Task) => void;
    onClose: () => void;
    addNote: (title: string, content: string, notebookId: number) => void;
    categories: Category[];
    categoryColors: Record<Category, string>;
    onAddNewCategory: (name: string) => boolean;
    triggerInsightGeneration: (task: Task, isRegeneration: boolean) => void;
    redirectToMiraAIWithChat: (history: ChatMessage[]) => void;
    deleteTask: (taskId: number) => void;
}

const modalVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', damping: 30, stiffness: 300 } },
    exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } }
};

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

function InsightWidget({ widget }: { widget: InsightWidgetData }) {
    switch (widget.type) {
        case 'metric': {
            const Icon = (Icons as any)[widget.icon] || SparklesIcon;
            return (
                <div className="p-3 rounded-2xl h-full" style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                    <div className="flex items-center gap-2 text-sm font-semibold opacity-70">
                        <Icon className="w-4 h-4" />{widget.title}
                    </div>
                    <p className="text-2xl font-bold font-display mt-1">
                        {widget.value} <span className="text-sm opacity-70">{widget.unit}</span>
                    </p>
                </div>
            );
        }
        case 'text': {
            const Icon = (Icons as any)[widget.icon] || SparklesIcon;
            return (
                <div className="p-3 rounded-2xl h-full" style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                    <div className="flex items-center gap-2 text-sm font-semibold opacity-70">
                        <Icon className="w-4 h-4" />{widget.title}
                    </div>
                    <p className="text-sm mt-1">{widget.content}</p>
                </div>
            );
        }
        case 'radial': {
            return (
                <div className="p-3 rounded-2xl h-full flex flex-col items-center justify-center text-center" style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                    <h4 className="text-sm font-semibold opacity-70">{widget.title}</h4>
                    <div className="w-20 h-20 relative mt-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ value: widget.value, fill: widget.color }]} startAngle={90} endAngle={-270}>
                                <RadialBar background dataKey="value" cornerRadius={10} />
                            </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-xl font-bold font-display">{widget.value}%</span>
                            <span className="text-xs opacity-70">{widget.label}</span>
                        </div>
                    </div>
                </div>
            );
        }
        case 'map': {
            return (
                <div className="p-3 rounded-2xl h-full col-span-2" style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                    <div className="flex items-center gap-2 text-sm font-semibold opacity-70">
                        <MapPinIcon className="w-4 h-4" />{widget.title}
                    </div>
                    <div className="mt-2 w-full aspect-video rounded-lg overflow-hidden border border-current/20">
                        <iframe
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            loading="lazy"
                            allowFullScreen
                            src={widget.embedUrl}>
                        </iframe>
                    </div>
                </div>
            );
        }
        case 'weather': {
            const WeatherIcon = (Icons as any)[widget.conditionIcon] || CloudIcon;
            return (
                <div className="p-3 rounded-2xl h-full" style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                    <div className="flex items-center gap-2 text-sm font-semibold opacity-70">
                        <MapPinIcon className="w-4 h-4" />{widget.location}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                        <WeatherIcon className="w-10 h-10 opacity-90"/>
                        <div>
                            <p className="text-2xl font-bold font-display">{widget.currentTemp}°</p>
                            <p className="text-xs opacity-70">{widget.title}</p>
                        </div>
                    </div>
                    <div className="mt-3 flex justify-between gap-2 text-xs text-center">
                        {(widget.hourlyForecast || []).slice(0, 4).map((f, i) => {
                            const ForecastIcon = (Icons as any)[f.icon] || CloudIcon;
                            return (
                                <div key={i} className="flex flex-col items-center">
                                    <span className="font-semibold">{f.time}</span>
                                    <ForecastIcon className="w-4 h-4 my-1 opacity-70"/>
                                    <span className="font-bold">{f.temp}°</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }
        case 'recipe': {
            return (
                <div className="p-3 rounded-2xl h-full col-span-2" style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                    <div className="flex gap-3">
                        <img src={widget.imageUrl} alt={widget.name} className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
                        <div>
                            <a href={widget.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-bold hover:underline">
                                {widget.name}
                            </a>
                            <p className="text-xs opacity-70 mt-1 line-clamp-3">{widget.quick_instructions}</p>
                        </div>
                    </div>
                    <details className="mt-2 text-xs">
                        <summary className="cursor-pointer font-semibold opacity-70">Ingredients</summary>
                        <ul className="list-disc list-inside mt-1 pl-2 opacity-70 space-y-0.5">
                            {(widget.ingredients || []).slice(0, 5).map((ing, i) => <li key={i}>{ing}</li>)}
                            {widget.ingredients && widget.ingredients.length > 5 && <li>... and more</li>}
                        </ul>
                    </details>
                </div>
            );
        }
        default: return null;
    }
}

const PrioritySelector = ({ value, onChange, textColor }: {
    value: Task['priority'], 
    onChange: (p: Task['priority']) => void,
    textColor: string
}) => {
    const priorities: Array<{ label: string, value: 'low' | 'medium' | 'high' }> = [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
    ];

    return (
        <div className="flex items-center gap-2">
            {priorities.map(p => (
                <button
                    key={p.value}
                    type="button"
                    onClick={() => onChange(p.value)}
                    className={`px-3 py-1 text-sm font-semibold rounded-full transition-all ${
                        value === p.value
                            ? 'ring-2 ring-current'
                            : 'opacity-60 hover:opacity-80'
                    }`}
                    style={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        color: textColor
                    }}
                >
                    {p.label}
                </button>
            ))}
        </div>
    );
};

function EventDetail({ 
    task, 
    allTasks, 
    updateTask, 
    onComplete, 
    onClose, 
    categories, 
    categoryColors, 
    onAddNewCategory, 
    projects, 
    notes, 
    notebooks, 
    deleteTask, 
    triggerInsightGeneration,
    redirectToMiraAIWithChat
}: EventDetailProps) {
    const [isEditMode, setIsEditMode] = useState(false);
    const [editableTask, setEditableTask] = useState(task);
    const titleInputRef = useRef<HTMLInputElement>(null);
    const [locationSuggestions, setLocationSuggestions] = useState<{place_name: string; address: string}[]>([]);
    const [isParsing, setIsParsing] = useState(false);
    const [showTempMessage, setShowTempMessage] = useState(false);

    // Sync local state with task prop
    useEffect(() => { 
        setEditableTask(task); 
    }, [task]);

    // Show temp message for new tasks only
    useEffect(() => {
        if (!isEditMode) {
            setShowTempMessage(true);
            const timer = setTimeout(() => setShowTempMessage(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [isEditMode]);

    const debouncedParseUpdate = useCallback(debounce(async (currentTaskState: Task) => {
        const title = currentTaskState.title;
        const commandStartIndex = title.indexOf('/');
        if (commandStartIndex === -1) return;

        const command = title.substring(commandStartIndex);
        const newTitleCandidate = title.substring(0, commandStartIndex).trim();
        
        setIsParsing(true);
        try {
            const { data: updatePayload } = await miraRequest('parse_task_update', { 
                command: command, 
                task: { ...currentTaskState, title: newTitleCandidate } 
            });
            
            if (updatePayload && Object.keys(updatePayload).length > 0) {
                setEditableTask(prev => ({ ...prev, title: newTitleCandidate, ...updatePayload }));
            } else {
                setEditableTask(prev => ({...prev, title: newTitleCandidate }));
            }
        } catch (error) {
            console.error('AI parsing error:', error);
        } finally {
            setIsParsing(false);
        }
    }, 1200), []);

    const handleFieldChange = (field: keyof Task, value: any) => {
        setEditableTask(prev => {
            const newState = { ...prev, [field]: value };
            if (field === 'title' && typeof value === 'string' && value.includes('/')) {
                debouncedParseUpdate(newState);
            }
            return newState;
        });
    };

    const debouncedGetLocationSuggestions = useCallback(debounce(async (query: string) => {
        if (query.length > 2) {
            const suggestions = await getAutocompleteSuggestions(query);
            setLocationSuggestions(suggestions);
        } else {
            setLocationSuggestions([]);
        }
    }, 500), []);
    
    const handleLocationChange = (value: string) => {
        if (editableTask.isVirtual) {
            handleFieldChange('linkedUrl', value);
        } else {
            handleFieldChange('location', value);
            debouncedGetLocationSuggestions(value);
        }
    };
    
    const handleLocationSuggestionClick = (suggestion: {place_name: string; address: string}) => {
        handleFieldChange('location', suggestion.address);
        setLocationSuggestions([]);
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === 'CREATE_NEW') {
            const newCategoryName = prompt('Enter new category name:');
            if (newCategoryName && newCategoryName.trim()) {
                const success = onAddNewCategory(newCategoryName.trim());
                if (success) {
                    handleFieldChange('category', newCategoryName.trim() as Category);
                }
            }
        } else {
            handleFieldChange('category', value as Category);
        }
    };

    const handleSave = () => {
        updateTask(editableTask);
        onClose();
    };

    const handleDeleteTask = () => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            deleteTask(task.id);
            onClose();
        }
    };

    const handleGenerateInsights = () => {
        triggerInsightGeneration(task, !!task.insights);
    };

    const handleDiscussWithMira = () => {
        const prompt = `Let's discuss my upcoming task: "${task.title}". Based on its details (Category: ${task.category}, Duration: ${task.plannedDuration} mins), can you give me some key points to focus on or potential challenges to watch out for?`;
        const initialChat: ChatMessage[] = [{ role: 'user', text: prompt }];
        redirectToMiraAIWithChat(initialChat);
        onClose(); // Close the modal after redirecting
    };

    // Helper for link opening based on platform
    const openExternalLink = (url: string) => {
        try {
            const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
            // For now, use a normal new tab. Later we can integrate in-app browser.
            if (isiOS) {
                window.open(url, '_blank', 'noopener,noreferrer');
            } else {
                window.open(url, '_blank', 'noopener,noreferrer');
            }
        } catch {}
    };

    // Get category color and text color
    const categoryColor = categoryColors[editableTask.category!] || '#A855F7';
    const textColor = getTextColorForBackground(categoryColor);

    // Format date display
    const taskDate = new Date(editableTask.startTime);
    const dayOfWeek = taskDate.toLocaleDateString('en-US', { weekday: 'long' });
    const day = String(taskDate.getDate()).padStart(2, '0');
    const monthNum = String(taskDate.getMonth() + 1).padStart(2, '0');
    const month = taskDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();

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

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                key="event-detail-modal"
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
                <div 
                    className="rounded-3xl p-6 shadow-2xl transition-all duration-300"
                    style={{ backgroundColor: categoryColor, color: textColor }}
                >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col">
                                <p className="font-semibold opacity-80 text-sm">{dayOfWeek}</p>
                                <p className="text-3xl font-bold font-display tracking-tighter leading-none">{monthNum}.{day}</p>
                                <p className="text-3xl font-bold font-display tracking-tight leading-none opacity-60">{month}</p>
                            </div>
                            
                            <div className="border-l border-current/20 pl-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="flex items-center gap-2">
                                        {getCategoryIcon(editableTask.category!)}
                                        <h2 className="text-2xl font-bold font-display">{editableTask.title}</h2>
                                    </div>
                                    <button 
                                        onClick={handleGenerateInsights} 
                                        className="p-1.5 rounded-lg transition-colors text-sm"
                                        style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                                    >
                                        {task.isGeneratingInsights ? (
                                            <SparklesIcon className="w-4 h-4 animate-pulse" />
                                        ) : task.insights ? (
                                            <ArrowPathIcon className="w-4 h-4" />
                                        ) : (
                                            <SparklesIcon className="w-4 h-4" />
                                        )}
                                    </button>
                                     <button 
                                        onClick={handleDiscussWithMira}
                                        className="p-1.5 rounded-lg transition-colors text-sm"
                                        style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                                        aria-label="Discuss task with Mira"
                                    >
                                        <ChatBubbleLeftEllipsisIcon className="w-4 h-4" />
                                    </button>
                                </div>
                                {showTempMessage && (
                                    <motion.p 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="opacity-70 text-sm"
                                    >
                                        ✨ Mira is ready to help you organize your day
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

                    {/* Content - Details View or Edit Mode */}
                    {!isEditMode ? (
                        // Details View
                        <div className="space-y-4">
                            {/* Task Details */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 rounded-2xl" style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                                    <div className="flex items-center gap-2 text-sm font-semibold opacity-70 mb-1">
                                        <ClockIcon className="w-4 h-4" /> Duration
                                    </div>
                                    <p className="text-lg font-bold">{editableTask.plannedDuration} minutes</p>
                                </div>
                                <div className="p-3 rounded-2xl" style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                                    <div className="flex items-center gap-2 text-sm font-semibold opacity-70 mb-1">
                                        <FlagIcon className="w-4 h-4" /> Priority
                                    </div>
                                    <p className="text-lg font-bold capitalize">{editableTask.priority || 'medium'}</p>
                                </div>
                            </div>

                            {/* Time */}
                            <div className="p-3 rounded-2xl" style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                                <div className="flex items-center gap-2 text-sm font-semibold opacity-70 mb-1">
                                    <ClockIcon className="w-4 h-4" /> Start Time
                                </div>
                                <p className="text-lg font-bold">
                                    {new Date(editableTask.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>

                            {/* Location or Link */}
                            {(editableTask.location || editableTask.linkedUrl) && (
                                <div className="p-3 rounded-2xl" style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                                    <div className="flex items-center gap-2 text-sm font-semibold opacity-70 mb-1">
                                        {editableTask.isVirtual ? (
                                            <LinkIcon className="w-4 h-4" />
                                        ) : (
                                            <MapPinIcon className="w-4 h-4" />
                                        )}
                                        {editableTask.isVirtual ? 'Meeting Link' : 'Location'}
                                    </div>
                                    <p className="text-sm break-all">
                                        {editableTask.isVirtual ? editableTask.linkedUrl : editableTask.location}
                                    </p>
                                </div>
                            )}

                            {/* Notes */}
                            {editableTask.notes && (
                                <div className="p-3 rounded-2xl" style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                                    <div className="flex items-center gap-2 text-sm font-semibold opacity-70 mb-1">
                                        <DocumentTextIcon className="w-4 h-4" /> Notes
                                    </div>
                                    <p className="text-sm">{editableTask.notes}</p>
                                </div>
                            )}

                            {/* Travel Information */}
                            {editableTask.location && !editableTask.isVirtual && (
                                <div className="p-3 rounded-2xl" style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                                    <h4 className="flex items-center gap-1.5 font-semibold opacity-70 mb-2 text-sm">
                                        <MapPinIcon className="w-4 h-4"/> Travel Information
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="bg-current/10 p-2 rounded-lg">
                                            <p className="opacity-80">Walking: ~30 min</p>
                                        </div>
                                        <div className="bg-current/10 p-2 rounded-lg">
                                            <p className="opacity-80">Driving: ~10 min</p>
                                        </div>
                                        <div className="bg-current/10 p-2 rounded-lg">
                                            <p className="opacity-80">Transit: ~20 min</p>
                                        </div>
                                        <div className="bg-current/10 p-2 rounded-lg">
                                            <p className="opacity-80">Penguin Pace: ~45 min 🐧</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* AI Insights */}
                            <AnimatePresence>
                                {task.insights && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-4"
                                    >
                                        <h3 className="font-bold mb-3 text-lg opacity-90">AI Insights</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {task.insights.widgets.map((widget, index) => (
                                                <InsightWidget key={index} widget={widget} />
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        // Edit Mode - Compact for viewport
                        <div className="space-y-3">
                            {/* Title */}
                            <div className="relative">
                                <input 
                                    ref={titleInputRef}
                                    type="text"
                                    value={editableTask.title}
                                    onChange={(e) => handleFieldChange('title', e.target.value)}
                                    className="w-full text-xl font-bold px-5 py-3 rounded-2xl border-2 border-current/20 focus:border-current/40 focus:outline-none transition-colors"
                                    style={{ 
                                        backgroundColor: 'rgba(0,0,0,0.1)',
                                        color: textColor,
                                    }}
                                    placeholder="Task title..."
                                />
                                {isParsing && (
                                    <SparklesIcon 
                                        className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 animate-pulse" 
                                        style={{ color: textColor, opacity: 0.7 }}
                                    />
                                )}
                            </div>

                            {/* Form Fields - Compact for viewport */}
                            <div className="space-y-3">
                                {/* Category and Duration */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-2xl" style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                                        <label className="flex items-center gap-1.5 font-semibold opacity-70 mb-1.5 text-sm">
                                            <BriefcaseIcon className="w-4 h-4" /> Category
                                        </label>
                                        <select
                                            value={editableTask.category}
                                            onChange={handleCategoryChange}
                                            className="w-full bg-transparent text-sm font-bold focus:outline-none appearance-none"
                                            style={{ color: textColor }}
                                        >
                                            {categories.map(c => <option key={c} value={c} className="text-black bg-white">{c}</option>)}
                                            <option value="CREATE_NEW" className="text-black bg-white italic">+ Create New...</option>
                                        </select>
                                    </div>

                                    <div className="p-3 rounded-2xl" style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                                        <label className="font-semibold opacity-70 mb-1.5 block text-sm">Duration (min)</label>
                                        <input 
                                            type="number" 
                                            value={editableTask.plannedDuration} 
                                            onChange={e => handleFieldChange('plannedDuration', parseInt(e.target.value))} 
                                            className="w-full bg-transparent text-sm font-bold focus:outline-none"
                                            style={{ color: textColor }}
                                        />
                                    </div>
                                </div>

                                {/* Time and Priority */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-2xl" style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                                        <label className="flex items-center gap-1.5 font-semibold opacity-70 mb-1.5 text-sm">
                                            <ClockIcon className="w-4 h-4"/> Start Time
                                        </label>
                                        <input 
                                            type="time" 
                                            value={new Date(editableTask.startTime).toTimeString().substring(0,5)} 
                                            onChange={e => {
                                                const [h, m] = e.target.value.split(':');
                                                const d = new Date(editableTask.startTime);
                                                d.setHours(parseInt(h), parseInt(m));
                                                handleFieldChange('startTime', d.toISOString());
                                            }}
                                            className="w-full bg-transparent text-sm font-bold focus:outline-none"
                                            style={{ color: textColor }}
                                        />
                                    </div>
                                    
                                    <div className="p-3 rounded-2xl" style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                                        <label className="flex items-center gap-1.5 font-semibold opacity-70 mb-2 text-sm">
                                            <FlagIcon className="w-4 h-4"/> Priority
                                        </label>
                                        <PrioritySelector
                                            value={editableTask.priority || 'medium'}
                                            onChange={(p) => handleFieldChange('priority', p)}
                                            textColor={textColor}
                                        />
                                    </div>
                                </div>

                                {/* Virtual Toggle */}
                                <div 
                                    className="flex items-center justify-between p-3 rounded-2xl"
                                    style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}
                                >
                                    <label className="text-sm font-bold">Virtual Event</label>
                                    <button 
                                        type="button" 
                                        onClick={() => handleFieldChange('isVirtual', !editableTask.isVirtual)} 
                                        className="relative inline-flex items-center h-5 rounded-full w-9 transition-colors"
                                        style={{ 
                                            backgroundColor: editableTask.isVirtual ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'
                                        }}
                                    >
                                        <span 
                                            className="inline-block w-3 h-3 transform bg-current rounded-full transition-transform"
                                            style={{
                                                transform: editableTask.isVirtual ? 'translateX(1rem)' : 'translateX(0.25rem)',
                                                opacity: 0.9
                                            }}
                                        />
                                    </button>
                                </div>

                                {/* Location/Link */}
                                <div className="p-3 rounded-2xl relative" style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                                    <label className="flex items-center gap-1.5 font-semibold opacity-70 mb-1.5 text-sm">
                                        {editableTask.isVirtual ? (
                                            <>
                                                <LinkIcon className="w-4 h-4"/> Meeting Link
                                            </>
                                        ) : (
                                            <>
                                                <MapPinIcon className="w-4 h-4"/> Location
                                            </>
                                        )}
                                    </label>
                                    <input 
                                        type="text" 
                                        value={editableTask.isVirtual ? (editableTask.linkedUrl || '') : (editableTask.location || '')} 
                                        onChange={e => handleLocationChange(e.target.value)} 
                                        className="w-full bg-transparent text-sm font-bold focus:outline-none"
                                        style={{ color: textColor }}
                                        placeholder={editableTask.isVirtual ? 'https://...' : 'Add address'}
                                    />
                                    {locationSuggestions.length > 0 && !editableTask.isVirtual && (
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

                                {/* Notes */}
                                <div className="p-3 rounded-2xl" style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                                    <label className="flex items-center gap-1.5 font-semibold opacity-70 mb-1.5 text-sm">
                                        <DocumentTextIcon className="w-4 h-4"/> Notes
                                    </label>
                                    <textarea 
                                        value={editableTask.notes || ''} 
                                        onChange={e => handleFieldChange('notes', e.target.value)} 
                                        rows={2} 
                                        className="w-full bg-transparent text-sm focus:outline-none resize-none"
                                        style={{ color: textColor }}
                                        placeholder="Quick details..."
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-6">
                        {!isEditMode ? (
                            // Details View Actions
                            <>
                                <button 
                                    onClick={handleDeleteTask} 
                                    className="px-4 py-3 rounded-2xl text-lg font-bold transition-colors"
                                    style={{ 
                                        backgroundColor: 'rgba(255,0,0,0.2)',
                                        color: textColor 
                                    }}
                                >
                                    Delete
                                </button>
                                <button 
                                    onClick={onComplete} 
                                    className="flex-1 py-3 px-4 rounded-2xl text-lg font-bold transition-colors flex items-center justify-center gap-2"
                                    style={{ 
                                        backgroundColor: 'rgba(0,255,0,0.2)',
                                        color: textColor 
                                    }}
                                >
                                    <CheckCircleIcon className="w-5 h-5"/>
                                    Complete
                                </button>
                                <button 
                                    onClick={() => setIsEditMode(true)} 
                                    className="flex-1 py-3 px-4 rounded-2xl text-lg font-bold transition-colors"
                                    style={{ 
                                        backgroundColor: 'rgba(255,255,255,0.2)',
                                        color: textColor 
                                    }}
                                >
                                    Edit
                                </button>
                            </>
                        ) : (
                            // Edit Mode Actions
                            <>
                                <button 
                                    onClick={() => setIsEditMode(false)} 
                                    className="px-4 py-3 rounded-2xl text-lg font-bold transition-colors"
                                    style={{ 
                                        backgroundColor: 'rgba(0,0,0,0.2)',
                                        color: textColor 
                                    }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleSave} 
                                    className="flex-1 py-3 px-4 rounded-2xl text-lg font-bold transition-colors"
                                    style={{ 
                                        backgroundColor: 'rgba(255,255,255,0.2)',
                                        color: textColor 
                                    }}
                                >
                                    Save Changes
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default EventDetail;