import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Task, Note, Project, Goal, TaskStatus, Category, Notebook, ChatMessage, InsightWidgetData } from '../types';
import { CheckCircleIcon, XMarkIcon, SparklesIcon, DocumentTextIcon, LinkIcon, ArrowPathIcon, PlusIcon, VideoCameraIcon, LightBulbIcon, ClockIcon, MapPinIcon, UserIcon, PhotoIcon, ChartBarIcon, HeartIcon, RocketIcon, FlagIcon, ChatBubbleLeftEllipsisIcon, BriefcaseIcon, ChevronDownIcon, CheckIcon, SunIcon, CloudIcon, BoltIcon } from './Icons';
import * as Icons from './Icons';
import { ResponsiveContainer, BarChart, Bar, Cell, RadialBarChart, RadialBar, Tooltip } from 'recharts';
import { getAutocompleteSuggestions } from '../services/geminiService';

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
    redirectToKikoAIWithChat: (history: ChatMessage[]) => void;
    deleteTask: (taskId: number) => void;
}

const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring', damping: 30, stiffness: 300 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
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

interface EditableRowProps {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
  className?: string;
}

function EditableRow({ icon: Icon, label, children, className = '' }: EditableRowProps) {
  return (
    <div className={`bg-gray-100 dark:bg-zinc-900/50 p-3 rounded-xl flex items-center justify-between ${className}`}>
        <div className="flex items-center gap-3">
            <Icon className="w-5 h-5 text-text-secondary flex-shrink-0" />
            <span className="font-semibold text-text text-sm">{label}</span>
        </div>
        <div className="text-right text-sm font-medium text-text flex-grow">
            {children}
        </div>
    </div>
  );
}

function InsightWidget({ widget }: { widget: InsightWidgetData }) {
    switch (widget.type) {
        case 'metric': {
            const Icon = (Icons as any)[widget.icon] || SparklesIcon;
            return (
                <div className="bg-gray-100 dark:bg-zinc-900/50 p-4 rounded-xl h-full">
                    <div className="flex items-center gap-2 text-sm font-semibold text-text-secondary"><Icon className="w-4 h-4" />{widget.title}</div>
                    <p className="text-3xl font-bold font-display mt-1">{widget.value} <span className="text-lg text-text-secondary">{widget.unit}</span></p>
                </div>
            );
        }
        case 'text': {
            const Icon = (Icons as any)[widget.icon] || SparklesIcon;
            return (
                <div className="bg-gray-100 dark:bg-zinc-900/50 p-4 rounded-xl h-full">
                    <div className="flex items-center gap-2 text-sm font-semibold text-text-secondary"><Icon className="w-4 h-4" />{widget.title}</div>
                    <p className="text-sm mt-1">{widget.content}</p>
                </div>
            );
        }
        case 'radial': {
            return (
                <div className="bg-gray-100 dark:bg-zinc-900/50 p-4 rounded-xl h-full flex flex-col items-center justify-center text-center">
                    <h4 className="text-sm font-semibold text-text-secondary">{widget.title}</h4>
                    <div className="w-24 h-24 relative mt-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ value: widget.value, fill: widget.color }]} startAngle={90} endAngle={-270}>
                                <RadialBar background dataKey="value" cornerRadius={10} />
                            </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-2xl font-bold font-display">{widget.value}%</span>
                            <span className="text-xs text-text-secondary">{widget.label}</span>
                        </div>
                    </div>
                </div>
            );
        }
        case 'map': {
            return (
                <div className="bg-gray-100 dark:bg-zinc-900/50 p-4 rounded-xl h-full sm:col-span-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-text-secondary"><MapPinIcon className="w-4 h-4" />{widget.title}</div>
                    <div className="mt-2 w-full aspect-video rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700">
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
                <div className="bg-gray-100 dark:bg-zinc-900/50 p-4 rounded-xl h-full">
                    <div className="flex items-center gap-2 text-sm font-semibold text-text-secondary"><MapPinIcon className="w-4 h-4" />{widget.location}</div>
                    <div className="flex items-center gap-4 mt-2">
                        <WeatherIcon className="w-12 h-12 text-accent"/>
                        <div>
                            <p className="text-3xl font-bold font-display">{widget.currentTemp}°</p>
                            <p className="text-xs text-text-secondary">{widget.title}</p>
                        </div>
                    </div>
                     <div className="mt-3 flex justify-between gap-2 text-xs text-center">
                        {(widget.hourlyForecast || []).slice(0, 4).map((f, i) => {
                            const ForecastIcon = (Icons as any)[f.icon] || CloudIcon;
                            return (
                                <div key={i} className="flex flex-col items-center">
                                    <span className="font-semibold">{f.time}</span>
                                    <ForecastIcon className="w-5 h-5 my-1 text-text-secondary"/>
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
                <div className="bg-gray-100 dark:bg-zinc-900/50 p-4 rounded-xl h-full sm:col-span-2">
                    <div className="flex gap-4">
                        <img src={widget.imageUrl} alt={widget.name} className="w-24 h-24 rounded-lg object-cover flex-shrink-0" />
                        <div>
                            <a href={widget.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-bold hover:underline">{widget.name}</a>
                            <p className="text-xs text-text-secondary mt-1 line-clamp-3">{widget.quick_instructions}</p>
                        </div>
                    </div>
                    <details className="mt-2 text-xs">
                        <summary className="cursor-pointer font-semibold text-text-secondary">Ingredients</summary>
                        <ul className="list-disc list-inside mt-1 pl-2 text-text-secondary space-y-0.5">
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


function EventDetail({ task, allTasks, updateTask, onComplete, onClose, categories, categoryColors, onAddNewCategory, projects, notes, notebooks, deleteTask, triggerInsightGeneration }: EventDetailProps) {
    const [editableTask, setEditableTask] = useState(task);
    const titleTextareaRef = useRef<HTMLTextAreaElement>(null);
    const [locationSuggestions, setLocationSuggestions] = useState<{place_name: string; address: string}[]>([]);
    const locationInputRef = useRef<HTMLInputElement>(null);

    // Sync local state with task prop
    useEffect(() => { setEditableTask(task); }, [task]);
    
    // Resize textarea after render to ensure layout is stable
    useEffect(() => {
        const textarea = titleTextareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto'; // Reset height
            textarea.style.height = `${textarea.scrollHeight}px`; // Set to scroll height
        }
    }, [editableTask.title, task]); // Rerun on new task or title change

    const handleFieldChange = (field: keyof Task, value: any) => {
        setEditableTask(prev => ({ ...prev, [field]: value }));
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in-fast" onClick={handleSave}>
            <motion.div
                key="edit-task-modal"
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-zinc-800 rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]"
            >
                <header className="p-6 pb-4 flex-shrink-0 bg-gray-50 dark:bg-black/30 rounded-t-3xl">
                    <div className="flex justify-between items-start">
                         <div className="relative inline-block">
                             <select
                                aria-label="Task category"
                                value={editableTask.category}
                                onChange={handleCategoryChange}
                                className="appearance-none cursor-pointer rounded-full px-4 py-1.5 text-sm font-bold focus:outline-none focus:ring-2 ring-offset-2 ring-offset-bg transition-colors"
                                style={{
                                    backgroundColor: categoryColors[editableTask.category!] || '#6B7280',
                                    color: getTextColorForBackground(categoryColors[editableTask.category!] || '#6B7280'),
                                }}
                            >
                                {categories.map(c => <option key={c} value={c} className="text-black bg-white">{c}</option>)}
                                <option value="CREATE_NEW" className="text-black bg-white italic font-semibold">＋ Create New...</option>
                            </select>
                             <ChevronDownIcon 
                                className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" 
                                style={{ color: getTextColorForBackground(categoryColors[editableTask.category!] || '#6B7280') }}
                            />
                        </div>
                        <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 dark:bg-zinc-700">
                            <XMarkIcon className="w-5 h-5"/>
                        </button>
                    </div>
                    <div className="flex justify-between items-end mt-2">
                        <textarea
                            ref={titleTextareaRef}
                            value={editableTask.title}
                            onChange={e => handleFieldChange('title', e.target.value)}
                            className="text-5xl font-bold bg-transparent focus:outline-none w-full resize-none overflow-hidden placeholder:text-current/30 text-black dark:text-white"
                            rows={1}
                            placeholder="Task Title"
                        />
                         <button onClick={handleGenerateInsights} className="ml-4 flex-shrink-0 p-2 text-xs text-center border border-gray-300 dark:border-zinc-600 rounded-lg w-24 h-16 flex flex-col items-center justify-center hover:border-accent transition-colors">
                            {task.isGeneratingInsights ? (
                                <>
                                 <SparklesIcon className="w-5 h-5 text-accent animate-pulse" />
                                 <span className="text-text-secondary mt-1 animate-pulse">Generating...</span>
                                </>
                            ) : task.insights ? (
                                <>
                                    <ArrowPathIcon className="w-5 h-5 text-text-secondary" />
                                    <span className="text-text-secondary mt-1">Regenerate</span>
                                </>
                            ) : (
                                <>
                                    <CheckIcon className="w-5 h-5 text-text-secondary" />
                                    <span className="text-text-secondary mt-1">No AI insight available for this task.</span>
                                </>
                            )}
                        </button>
                    </div>
                </header>
                
                <main className="flex-grow p-6 pt-4 bg-white dark:bg-zinc-800 overflow-y-auto min-h-0">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-text">Today's tasks</h3>
                        <button onClick={onComplete} className="bg-green-500 text-white px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-2 hover:bg-green-600 transition-colors">
                            <CheckCircleIcon className="w-5 h-5"/>
                            Mark as Complete
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-sm text-text-secondary mb-2">Timing</h4>
                            <div className="space-y-2">
                                <EditableRow icon={ClockIcon} label="Start Time">
                                    <input type="time" value={new Date(editableTask.startTime).toTimeString().substring(0,5)} onChange={e => { const [h, m] = e.target.value.split(':'); const d = new Date(editableTask.startTime); d.setHours(parseInt(h), parseInt(m)); handleFieldChange('startTime', d); }} className="bg-transparent text-right font-semibold focus:outline-none" />
                                </EditableRow>
                                <EditableRow icon={DocumentTextIcon} label="Duration (min)">
                                    <input type="number" value={editableTask.plannedDuration} onChange={e => handleFieldChange('plannedDuration', parseInt(e.target.value))} className="w-20 bg-transparent text-right font-semibold focus:outline-none" />
                                </EditableRow>
                                <EditableRow icon={ArrowPathIcon} label="Repeat">
                                    <select value={editableTask.repeat || "none"} onChange={e => handleFieldChange('repeat', e.target.value)} className="bg-transparent text-right font-semibold focus:outline-none appearance-none pr-1">
                                        <option value="none">Does not repeat</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
                                    </select>
                                </EditableRow>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm text-text-secondary mb-2">Details</h4>
                            <div className="space-y-2">
                                <EditableRow icon={LinkIcon} label="Notes">
                                   <input type="text" value={editableTask.notes || ""} onChange={e => handleFieldChange('notes', e.target.value)} className="w-full bg-transparent text-right font-semibold focus:outline-none truncate" placeholder="Add a quick note..."/>
                                </EditableRow>
                                <EditableRow icon={UserIcon} label="Virtual Event">
                                    <button type="button" role="switch" aria-checked={!!editableTask.isVirtual} onClick={() => handleFieldChange('isVirtual', !editableTask.isVirtual)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${editableTask.isVirtual ? 'bg-green-500' : 'bg-gray-300 dark:bg-zinc-700'}`}>
                                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${editableTask.isVirtual ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </EditableRow>
                                <div className="relative">
                                    <EditableRow icon={editableTask.isVirtual ? VideoCameraIcon : MapPinIcon} label={editableTask.isVirtual ? 'Meeting Link' : 'Location'}>
                                        <input
                                            ref={locationInputRef}
                                            type="text"
                                            value={editableTask.isVirtual ? (editableTask.linkedUrl || '') : (editableTask.location || '')}
                                            onChange={e => handleLocationChange(e.target.value)}
                                            onBlur={() => setTimeout(() => setLocationSuggestions([]), 200)}
                                            className="w-full bg-transparent text-right font-semibold focus:outline-none truncate"
                                            placeholder={editableTask.isVirtual ? 'https://...' : 'Add address'}
                                        />
                                    </EditableRow>
                                    {locationSuggestions.length > 0 && !editableTask.isVirtual && (
                                        <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg animate-fade-in-fast">
                                            {locationSuggestions.map(s => (
                                                <button
                                                    key={s.address}
                                                    onMouseDown={() => handleLocationSuggestionClick(s)}
                                                    className="w-full text-left p-2 hover:bg-accent/10 cursor-pointer text-sm"
                                                >
                                                    <strong>{s.place_name}</strong><br />
                                                    <span className="text-xs text-text-secondary">{s.address}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                         <div>
                            <h4 className="font-semibold text-sm text-text-secondary mb-2">Connections</h4>
                            <div className="space-y-2">
                                <EditableRow icon={BriefcaseIcon} label="Project">
                                    <select value={editableTask.projectId || ''} onChange={e => handleFieldChange('projectId', e.target.value ? parseInt(e.target.value) : undefined)} className="bg-transparent text-right font-semibold focus:outline-none appearance-none pr-1">
                                        <option value="">None</option>
                                        {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                    </select>
                                </EditableRow>
                                <EditableRow icon={DocumentTextIcon} label="Notebook">
                                    <select value={editableTask.notebookId || ''} onChange={e => handleFieldChange('notebookId', e.target.value ? parseInt(e.target.value) : undefined)} className="bg-transparent text-right font-semibold focus:outline-none appearance-none pr-1">
                                        <option value="">None</option>
                                        {notebooks.map(n => <option key={n.id} value={n.id}>{n.title}</option>)}
                                    </select>
                                </EditableRow>
                            </div>
                        </div>
                    </div>

                    <AnimatePresence>
                        {task.insights && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-6"
                            >
                                <h3 className="font-semibold mb-2">AI Insights</h3>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                    {task.insights.widgets.map((widget, index) => (
                                        <InsightWidget key={index} widget={widget} />
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>

                <footer className="p-4 flex-shrink-0 border-t border-gray-200 dark:border-zinc-700 z-10 bg-white dark:bg-zinc-800/50 flex justify-between items-center rounded-b-3xl">
                    <button onClick={handleDeleteTask} className="text-red-500 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-red-500/10">Delete Task</button>
                    <button onClick={handleSave} className="bg-accent text-white px-6 py-3 rounded-full font-semibold text-sm hover:bg-accent-hover transition-colors">
                        Save Changes
                    </button>
                </footer>
            </motion.div>
        </div>
    );
}

export default EventDetail;