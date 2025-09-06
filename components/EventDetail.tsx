import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Task, Note, Project, Goal, TaskStatus, Category, Notebook, ChatMessage, InsightWidgetData, KeyMetricWidget, TextWidget, ChartWidget } from '../types';
import { CheckCircleIcon, XMarkIcon, SparklesIcon, DocumentTextIcon, LinkIcon, ArrowPathIcon, PlusIcon, VideoCameraIcon, LightBulbIcon, ClockIcon, MapPinIcon, UserIcon, PhotoIcon, ChartBarIcon, HeartIcon, RocketIcon, FlagIcon, ChatBubbleLeftEllipsisIcon, BriefcaseIcon } from './Icons';
import * as Icons from './Icons';
import { ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { getTopCategories } from '../utils/taskUtils';

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
  hidden: { opacity: 0, y: "100%" },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 150 } },
  exit: { opacity: 0, y: "100%", transition: { duration: 0.2 } }
};

const DetailRow: React.FC<{icon: React.ElementType, label: string, children: React.ReactNode, className?: string}> = ({ icon: Icon, label, children, className = '' }) => (
    <div className={`bg-gray-100 dark:bg-zinc-700/50 p-3 rounded-xl flex items-center justify-between ${className}`}>
        <div className="flex items-center gap-3">
            <Icon className="w-5 h-5 text-gray-500 dark:text-gray-300 flex-shrink-0" />
            <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{label}</span>
        </div>
        <div className="text-right text-sm font-medium text-gray-900 dark:text-white flex-grow">
            {children}
        </div>
    </div>
);

const ToggleSwitch: React.FC<{checked: boolean, onChange: (checked: boolean) => void}> = ({ checked, onChange }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex items-center h-7 w-12 rounded-full transition-colors ${checked ? 'bg-green-500' : 'bg-gray-300 dark:bg-zinc-600'}`}
    >
        <span className={`inline-block w-5 h-5 transform bg-white rounded-full transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
);

const InsightBubble: React.FC<{task: Task, triggerInsightGeneration: (task: Task, isRegeneration: boolean) => void}> = ({ task, triggerInsightGeneration }) => {
    const isClickable = !task.isGeneratingInsights;
    const handleClick = () => {
        if (isClickable) {
            triggerInsightGeneration(task, true);
        }
    };

    let content;
    if (task.isGeneratingInsights) {
        content = (
            <>
                <ArrowPathIcon className="w-4 h-4 text-gray-400 animate-spin" />
                <span className="leading-tight">Generating...</span>
            </>
        );
    } else if (task.insights && task.insights.widgets.length > 0) {
         content = (
            <>
                <CheckCircleIcon className="w-4 h-4 text-green-500"/>
                <span className="leading-tight">Insights available<br/>for this task.</span>
            </>
        );
    } else {
        content = (
            <>
                <CheckCircleIcon className="w-4 h-4 text-gray-400"/>
                <span className="leading-tight">No Kiko insight<br/>available for this task.</span>
            </>
        );
    }

    return (
        <button
            onClick={handleClick}
            disabled={!isClickable}
            className="mt-2 flex-shrink-0 p-2 bg-white dark:bg-zinc-800 rounded-lg shadow-sm flex items-center gap-2 text-xs text-left text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-zinc-700 disabled:cursor-wait hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
        >
            {content}
        </button>
    );
};

const InsightWidget: React.FC<{ widget: InsightWidgetData }> = ({ widget }) => {
    switch (widget.type) {
        case 'metric': {
            const metric = widget as KeyMetricWidget;
            const Icon = (Icons as any)[metric.icon] || SparklesIcon;
            return (
                <div className="bg-gray-100 dark:bg-zinc-800 p-4 rounded-lg flex items-center gap-4">
                    <Icon className={`w-8 h-8 ${metric.color || 'text-accent'}`} />
                    <div>
                        <p className="text-sm text-text-secondary">{metric.title}</p>
                        <p className="text-2xl font-bold font-display">{metric.value} <span className="text-base font-sans text-text-secondary">{metric.unit}</span></p>
                    </div>
                </div>
            );
        }
        case 'text': {
            const text = widget as TextWidget;
            const Icon = (Icons as any)[text.icon] || SparklesIcon;
            return (
                <div className="bg-gray-100 dark:bg-zinc-800 p-4 rounded-lg">
                    <h4 className="font-semibold text-sm flex items-center gap-2 mb-1"><Icon className="w-4 h-4 text-accent"/> {text.title}</h4>
                    <p className="text-sm text-text-secondary whitespace-pre-wrap">{text.content}</p>
                </div>
            );
        }
         case 'bar': {
            const chart = widget as ChartWidget;
            return (
                <div className="bg-gray-100 dark:bg-zinc-800 p-4 rounded-lg col-span-1 md:col-span-2">
                    <h4 className="font-semibold text-sm mb-2">{chart.title}</h4>
                    <div className="h-40">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chart.data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {chart.data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                     <p className="text-xs text-text-secondary mt-2 italic">{chart.commentary}</p>
                </div>
            );
        }
        default:
            return null;
    }
};


const EventDetail: React.FC<EventDetailProps> = ({ task, allTasks, updateTask, onComplete, onUndoCompleteTask, onClose, categories, categoryColors, onAddNewCategory, projects, notes, deleteTask, triggerInsightGeneration }) => {
    const [editableTask, setEditableTask] = useState(task);
    const titleTextareaRef = useRef<HTMLTextAreaElement>(null);

    const topCategories = useMemo(() => getTopCategories(allTasks, 5), [allTasks]);
    const otherCategories = useMemo(() => categories.filter(c => !topCategories.includes(c) && c !== editableTask.category), [categories, topCategories, editableTask.category]);

    useEffect(() => {
        setEditableTask(task);
    }, [task]);
    
    useEffect(() => {
        const textarea = titleTextareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [editableTask.title]);

    const handleFieldChange = (field: keyof Task, value: any) => {
        setEditableTask(prev => ({ ...prev, [field]: value }));
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

    const handleSaveAndClose = () => {
        updateTask(editableTask);
        onClose();
    };

    const isCompletedView = task.status === TaskStatus.Completed;
    
    if (!isCompletedView) {
        const date = new Date(editableTask.startTime);
        const day = String(date.getDate()).padStart(2, '0');
        const monthNum = String(date.getMonth() + 1).padStart(2, '0');
        const monthShort = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();

        return (
            <div className="fixed inset-0 bg-black/30 z-60 flex flex-col justify-end" onClick={handleSaveAndClose}>
                <motion.div
                    key="event-detail-modal"
                    variants={modalVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="relative bg-[#F3F4F6] dark:bg-zinc-900 rounded-t-3xl shadow-2xl w-full max-w-2xl mx-auto flex flex-col max-h-[95vh]"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="absolute top-20 left-1/2 -translate-x-1/2 text-[10rem] sm:text-[12rem] font-black text-gray-500/10 dark:text-white/10 blur-md select-none z-0 pointer-events-none tracking-tighter">
                      {day}.{monthNum}
                    </div>
                    <div className="absolute top-44 left-1/2 -translate-x-1/2 text-[10rem] sm:text-[12rem] font-black text-gray-500/10 dark:text-white/10 blur-md select-none z-0 pointer-events-none tracking-tighter">
                      {monthShort}
                    </div>

                    <header className="p-4 flex justify-between items-center flex-shrink-0 z-10">
                        <div className="flex items-center gap-2">
                            <span className="bg-black text-white px-4 py-1.5 rounded-full text-xs font-bold">EDITING</span>
                        </div>
                        <button onClick={handleSaveAndClose} className="w-8 h-8 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center">
                            <XMarkIcon className="w-5 h-5 text-gray-600 dark:text-gray-300"/>
                        </button>
                    </header>
                    
                    <section className="px-6 pt-2 pb-6 flex-shrink-0 z-10">
                        <div className="flex justify-between items-start gap-4">
                            <textarea
                                ref={titleTextareaRef}
                                value={editableTask.title}
                                onChange={e => handleFieldChange('title', e.target.value)}
                                className="text-5xl sm:text-6xl font-extrabold text-black dark:text-white bg-transparent focus:outline-none w-full -ml-1 resize-none overflow-hidden"
                                rows={1}
                            />
                            <InsightBubble task={task} triggerInsightGeneration={triggerInsightGeneration} />
                        </div>
                    </section>

                    <main className="flex-grow p-6 bg-white dark:bg-zinc-800/50 rounded-t-3xl overflow-y-auto z-10 border-t border-gray-200 dark:border-zinc-700">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="font-bold text-black dark:text-white">Todays tasks</h2>
                            <button onClick={onComplete} className="bg-green-500 text-white px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-2 hover:bg-green-600 transition-colors">
                                <CheckCircleIcon className="w-5 h-5"/>
                                Mark as Complete
                            </button>
                        </div>
                        <div className="space-y-3 text-black dark:text-white">
                            <DetailRow icon={ClockIcon} label="Start Time">
                                <input type="time" value={new Date(editableTask.startTime).toTimeString().substring(0,5)} onChange={e => { const [h, m] = e.target.value.split(':'); const d = new Date(editableTask.startTime); d.setHours(parseInt(h), parseInt(m)); handleFieldChange('startTime', d); }} className="bg-transparent text-right font-semibold focus:outline-none" />
                            </DetailRow>
                             <DetailRow icon={BriefcaseIcon} label="Category">
                                <select value={editableTask.category} onChange={handleCategoryChange} className="bg-transparent text-right font-semibold focus:outline-none appearance-none pr-1">
                                    <optgroup label="Top Categories">{topCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</optgroup>
                                    {otherCategories.length > 0 && <optgroup label="Other Categories">{otherCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</optgroup>}
                                    <option value="CREATE_NEW" className="text-accent italic font-semibold">+ Create New...</option>
                                </select>
                            </DetailRow>
                             <DetailRow icon={DocumentTextIcon} label="Duration & Note">
                                 <div className="flex items-center gap-2">
                                     <select value={editableTask.notebookId || ""} onChange={e => handleFieldChange('notebookId', e.target.value ? parseInt(e.target.value) : undefined)} className="bg-transparent text-right font-semibold focus:outline-none appearance-none pr-1">
                                        <option value="">No Note</option>
                                        {notes.map(note => <option key={note.id} value={note.id}>{note.title}</option>)}
                                    </select>
                                    <input type="number" value={editableTask.plannedDuration} onChange={e => handleFieldChange('plannedDuration', parseInt(e.target.value))} className="w-16 bg-gray-200 dark:bg-zinc-700 p-1 rounded-md text-right font-semibold focus:outline-none" />
                                    <span className="text-xs text-text-secondary">min</span>
                                 </div>
                            </DetailRow>
                            <DetailRow icon={ArrowPathIcon} label="Repeat">
                               <select value={editableTask.repeat || "none"} onChange={e => handleFieldChange('repeat', e.target.value)} className="bg-transparent text-right font-semibold focus:outline-none appearance-none pr-1">
                                    <option value="none">Does not repeat</option>
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </DetailRow>
                            <DetailRow icon={UserIcon} label="Virtual Event...">
                                <ToggleSwitch checked={!!editableTask.isVirtual} onChange={checked => handleFieldChange('isVirtual', checked)} />
                            </DetailRow>
                            <DetailRow icon={editableTask.isVirtual ? VideoCameraIcon : MapPinIcon} label={editableTask.isVirtual ? "Meeting Link" : "Location"}>
                                <input type={editableTask.isVirtual ? "url" : "text"} value={editableTask.isVirtual ? editableTask.linkedUrl : editableTask.location} onChange={e => handleFieldChange(editableTask.isVirtual ? 'linkedUrl' : 'location', e.target.value)} className="w-48 bg-transparent text-right font-semibold focus:outline-none" placeholder={editableTask.isVirtual ? "https://..." : "Add a location..."}/>
                            </DetailRow>
                        </div>
                        
                        <AnimatePresence>
                        {task.insights && task.insights.widgets.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-6 pt-4 border-t border-gray-200 dark:border-zinc-700"
                            >
                                <h3 className="font-bold text-black dark:text-white mb-3">Kiko Insights</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {task.insights.widgets.map((widget, index) => (
                                        <InsightWidget key={index} widget={widget} />
                                    ))}
                                </div>
                            </motion.div>
                        )}
                        </AnimatePresence>
                    </main>

                    <footer className="p-6 flex justify-between items-center flex-shrink-0 border-t border-gray-200 dark:border-zinc-700 z-10 bg-[#F3F4F6] dark:bg-zinc-900">
                        <button onClick={() => { if(window.confirm('Are you sure you want to delete this task?')) { deleteTask(task.id); onClose(); }}} className="text-red-500 font-semibold hover:text-red-600">Delete Task</button>
                        <button onClick={handleSaveAndClose} className="bg-purple-600 text-white font-semibold px-6 py-3 rounded-full hover:bg-purple-700 transition-colors">Save Changes</button>
                    </footer>
                </motion.div>
            </div>
        );
    }
    
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60 flex items-center justify-center p-4 animate-fade-in-fast" onClick={onClose}>
            <motion.div
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="card relative rounded-2xl shadow-xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                 <header className="p-4 sm:p-6 flex-shrink-0 border-b border-border bg-card">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold uppercase tracking-wider text-green-400 flex items-center gap-2"><CheckCircleIcon className="w-5 h-5"/> COMPLETED</p>
                            <h3 className="text-2xl sm:text-3xl font-bold font-display mt-1">{task.completionSummary?.newTitle || task.title}</h3>
                        </div>
                        <button onClick={onClose} aria-label="Close" className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 ml-4"><XMarkIcon className="w-6 h-6"/></button>
                    </div>
                </header>
                 <main className="p-4 sm:p-6 overflow-y-auto bg-bg/80">
                    <p className="italic text-text-secondary">{task.completionSummary?.shortInsight}</p>
                 </main>
                 <footer className="flex-shrink-0 p-4 sm:p-6 border-t border-border/30 flex justify-between items-center">
                    <button
                        type="button"
                        onClick={() => onUndoCompleteTask(task)}
                        className="flex items-center gap-2 text-sm font-semibold text-blue-400 hover:bg-blue-500/10 px-4 py-2 rounded-lg"
                    >
                        Undo Completion
                    </button>
                 </footer>
            </motion.div>
        </div>
    );
}

export default EventDetail;