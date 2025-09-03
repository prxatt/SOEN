import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, RadialBarChart, RadialBar, AreaChart, Area } from 'recharts';
import { Task, Note, Project, ActionableInsight, Goal, ChatMessage, TaskStatus, HealthData, InsightWidgetData, ChartWidget, KeyMetricWidget, TextWidget, RecipeWidget, Category, AreaChartWidget, RadialChartWidget, MapWidget, GeneratedImageWidget, WeatherWidget } from '../types';
import { generateActionableInsights, getChatFollowUp, parseHealthDataFromTasks, generateMapsEmbedUrl, getAutocompleteSuggestions } from '../services/geminiService';
import { inferHomeLocation } from '../utils/taskUtils';
import { CheckCircleIcon, XMarkIcon, SparklesIcon, DocumentTextIcon, LinkIcon, ArrowPathIcon, PaperAirplaneIcon, PaperClipIcon, PlusIcon, VideoCameraIcon, LightBulbIcon, ChevronLeftIcon, ChevronRightIcon, PhotoIcon, MapPinIcon, ArrowDownTrayIcon } from './Icons';
import * as Icons from './Icons';
import { DEFAULT_CATEGORIES } from '../constants';

interface EventDetailProps {
    task: Task;
    allTasks: Task[]; // Pass all tasks for context
    notes: Note[];
    projects: Project[];
    goals: Goal[];
    updateTask: (task: Task) => void;
    onComplete: () => void;
    onClose: () => void;
    redirectToKikoAIWithChat: (history: ChatMessage[]) => void;
    addNote: (title: string, content: string, notebookId: number) => void;
    categories: Category[];
}

const modalVariants = { hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 }};
const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 }};
const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 }}};

// --- WIDGET SUBCOMPONENTS ---
const InsightWidgetContainer: React.FC<{title: string, icon: React.ReactNode, onAddToNotes?: () => void, children: React.ReactNode}> = ({ title, icon, onAddToNotes, children }) => (
    <motion.div variants={itemVariants} className="relative bg-light-bg/50 dark:bg-dark-bg/50 p-3 rounded-xl border border-light-border dark:border-dark-border">
         <div className="flex justify-between items-center mb-2">
            <h5 className="font-semibold text-xs flex items-center gap-2 text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">{icon}{title}</h5>
            {onAddToNotes && <button onClick={onAddToNotes} className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10" aria-label="Add to Notes"><PlusIcon className="w-4 h-4"/></button>}
        </div>
        {children}
    </motion.div>
);

const KeyMetricWidgetComponent: React.FC<{widget: KeyMetricWidget, onAddToNotes: () => void}> = ({widget, onAddToNotes}) => {
    const Icon = (Icons as any)[widget.icon] || SparklesIcon;
    return (
    <InsightWidgetContainer title={widget.title} icon={<Icon className={`w-4 h-4 ${widget.color}`}/>} onAddToNotes={onAddToNotes}>
        <div className="flex items-baseline gap-2">
            <p className={`text-4xl lg:text-5xl font-bold font-display ${widget.color}`}>{widget.value}</p>
            <p className="font-semibold text-light-text-secondary dark:text-dark-text-secondary">{widget.unit}</p>
        </div>
    </InsightWidgetContainer>
)};

const TextWidgetComponent: React.FC<{widget: TextWidget, onAddToNotes: () => void}> = ({widget, onAddToNotes}) => {
     const Icon = (Icons as any)[widget.icon] || LightBulbIcon;
     const formatContent = (content: string) => {
        return (content || '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>');
     }
     return (
        <InsightWidgetContainer title={widget.title} icon={<Icon className="w-4 h-4"/>} onAddToNotes={onAddToNotes}>
            <div className="text-sm prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: formatContent(widget.content) }}></div>
            {widget.links && widget.links.length > 0 && (
                <div className="mt-2 pt-2 border-t border-light-border/50 dark:border-dark-border/50 space-y-1">
                    {widget.links.map((link, index) => (
                        <a key={index} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-blue-400 hover:underline">
                            <LinkIcon className="w-3 h-3"/>
                            <span className="truncate">{link.title}</span>
                        </a>
                    ))}
                </div>
            )}
        </InsightWidgetContainer>
     )
};

const AreaChartWidgetComponent: React.FC<{widget: AreaChartWidget, onAddToNotes: () => void}> = ({widget, onAddToNotes}) => (
    <InsightWidgetContainer title={widget.title} icon={<Icons.ChartBarIcon className="w-4 h-4"/>} onAddToNotes={onAddToNotes}>
        <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={widget.data} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                    <defs>
                        <linearGradient id={`color${widget.title}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={widget.stroke} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={widget.stroke} stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="var(--color-text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--color-text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{backgroundColor: 'var(--color-card, #1C1C1E)', border: '1px solid var(--color-border, #2D2D2F)', borderRadius: '0.75rem'}}/>
                    <Area type="monotone" dataKey="value" stroke={widget.stroke} fillOpacity={1} fill={`url(#color${widget.title})`} strokeWidth={2}/>
                </AreaChart>
            </ResponsiveContainer>
        </div>
         <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">{widget.commentary}</p>
    </InsightWidgetContainer>
);

const RadialChartWidgetComponent: React.FC<{widget: RadialChartWidget, onAddToNotes: () => void}> = ({widget, onAddToNotes}) => (
     <InsightWidgetContainer title={widget.title} icon={<Icons.BoltIcon className="w-4 h-4"/>} onAddToNotes={onAddToNotes}>
        <div className="h-40 w-full relative">
             <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{value: widget.value}]} startAngle={90} endAngle={450} barSize={15}>
                     <RadialBar background dataKey="value" fill={widget.color} cornerRadius={10} />
                </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-4xl font-bold font-display" style={{color: widget.color}}>{widget.value}%</p>
                <p className="text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary">{widget.label}</p>
            </div>
        </div>
    </InsightWidgetContainer>
)


const RecipeWidgetComponent: React.FC<{ widget: RecipeWidget; onAddToNotes: () => void }> = ({ widget, onAddToNotes }) => (
    <InsightWidgetContainer icon={<DocumentTextIcon className="w-4 h-4 text-blue-400"/>} title="Recipe Intel" onAddToNotes={onAddToNotes}>
        <h4 className="font-bold">{widget.name}</h4>
        {widget.imageUrl && <img src={widget.imageUrl} alt={widget.name} className="rounded-lg h-32 w-full object-cover"/>}
        <div className="text-xs"><strong className="text-blue-400">Ingredients:</strong><ul className="list-disc list-inside columns-2">{widget.ingredients.map(i=><li key={i}>{i}</li>)}</ul></div>
        <p className="text-xs"><strong className="text-blue-400">Instructions:</strong> {widget.quick_instructions}</p>
        <a href={widget.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-accent hover:underline">View Full Recipe</a>
    </InsightWidgetContainer>
);

const MapWidgetComponent: React.FC<{widget: MapWidget, onAddToNotes: () => void}> = ({widget, onAddToNotes}) => (
    <InsightWidgetContainer title={widget.title} icon={<MapPinIcon className="w-4 h-4 text-red-400"/>} onAddToNotes={onAddToNotes}>
        <iframe
            className="w-full h-48 rounded-lg border-none"
            loading="lazy"
            allowFullScreen
            src={widget.embedUrl}>
        </iframe>
    </InsightWidgetContainer>
);

const WeatherWidgetComponent: React.FC<{widget: WeatherWidget, onAddToNotes: () => void}> = ({widget, onAddToNotes}) => {
    const Icon = (Icons as any)[`${widget.conditionIcon}Icon`] || Icons.SparklesIcon;
    return (
        <InsightWidgetContainer title={widget.title} icon={<Icon className="w-4 h-4 text-blue-400"/>} onAddToNotes={onAddToNotes}>
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-4xl font-bold font-display">{widget.currentTemp}°</p>
                    <p className="font-semibold text-light-text-secondary dark:text-dark-text-secondary -mt-1">{widget.location}</p>
                </div>
                <div className="flex gap-2 text-center">
                    {widget.hourlyForecast.map((h, i) => {
                         const HourIcon = (Icons as any)[`${h.icon}Icon`] || Icons.SparklesIcon;
                         return (
                            <div key={i} className="flex flex-col items-center">
                                <span className="text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary">{h.time}</span>
                                <HourIcon className="w-6 h-6 my-1 text-blue-400"/>
                                <span className="text-sm font-bold">{h.temp}°</span>
                            </div>
                         )
                    })}
                </div>
            </div>
        </InsightWidgetContainer>
    );
};


const GeneratedImageWidgetComponent: React.FC<{widget: GeneratedImageWidget, onAddToNotes: () => void}> = ({widget, onAddToNotes}) => {
    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = widget.imageUrl;
        // FIX: Added optional chaining to prevent crash if title is undefined.
        link.download = `${(widget?.title || 'PraxisAI_Image').replace(/\s/g, '_')}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    return (
        <InsightWidgetContainer title={widget.title} icon={<SparklesIcon className="w-4 h-4 text-accent"/>} onAddToNotes={onAddToNotes}>
            <div className="relative group">
                <img src={widget.imageUrl} alt={widget.prompt} className="rounded-lg w-full aspect-square object-cover"/>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={handleDownload} className="p-3 bg-white/20 text-white rounded-full backdrop-blur-sm hover:bg-white/30"><ArrowDownTrayIcon className="w-6 h-6"/></button>
                </div>
            </div>
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1 italic">"{widget.prompt}"</p>
        </InsightWidgetContainer>
    );
};

const FullScreenImageViewer: React.FC<{images: string[], initialIndex: number, onClose: () => void}> = ({images, initialIndex, onClose}) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const nextImage = () => setCurrentIndex(prev => (prev + 1) % images.length);
    const prevImage = () => setCurrentIndex(prev => (prev - 1 + images.length) % images.length);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="absolute left-4 p-2 text-white bg-black/30 rounded-full hover:bg-black/50"><ChevronLeftIcon className="w-8 h-8"/></button>
            <AnimatePresence mode="wait">
            <motion.img 
                key={currentIndex}
                src={images[currentIndex]} 
                alt="Full screen view" 
                className="max-h-[90vh] max-w-[90vw] object-contain"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
            />
            </AnimatePresence>
            <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="absolute right-4 p-2 text-white bg-black/30 rounded-full hover:bg-black/50"><ChevronRightIcon className="w-8 h-8"/></button>
        </div>
    )
}

const ImageViewer: React.FC<{ attachments: string[], onImageClick: (index: number) => void }> = ({ attachments, onImageClick }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex(prev => (prev + 1) % attachments.length);
    };
    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex(prev => (prev - 1 + attachments.length) % attachments.length);
    };

    if (attachments.length === 0) {
        return <div className="w-full h-10 bg-light-bg dark:bg-dark-bg flex-shrink-0"></div>;
    }

    return (
        <div onClick={() => onImageClick(currentIndex)} className="w-full h-40 bg-black relative overflow-hidden cursor-pointer group">
             <AnimatePresence>
                <motion.img
                    key={currentIndex}
                    src={attachments[currentIndex]}
                    alt={`Attachment ${currentIndex + 1}`}
                    className="w-full h-full object-cover"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                />
            </AnimatePresence>
            {attachments.length > 1 && (
                <>
                    <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeftIcon className="w-6 h-6"/></button>
                    <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRightIcon className="w-6 h-6"/></button>
                    <div className="absolute bottom-2 right-2 px-2 py-1 rounded-full bg-black/40 text-white text-xs font-mono backdrop-blur-sm">{currentIndex + 1} / {attachments.length}</div>
                </>
            )}
        </div>
    );
};


const EventDetail: React.FC<EventDetailProps> = ({ task, allTasks, notes, projects, goals, updateTask, onComplete, onClose, redirectToKikoAIWithChat, addNote, categories }) => {
    const [isLoadingInsight, setIsLoadingInsight] = useState(false);
    const [editableTask, setEditableTask] = useState(task);
    const [isFullScreenViewerOpen, setIsFullScreenViewerOpen] = useState(false);
    const [fullScreenInitialIndex, setFullScreenInitialIndex] = useState(0);
    const [locationSuggestions, setLocationSuggestions] = useState<{place_name: string; address: string}[]>([]);
    const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const insight = task.insights; // Directly use insight from the task prop for reactivity

    useEffect(() => {
        setEditableTask(task);
    }, [task]);
    
    useEffect(() => {
        if (!task.insights && !task.isGeneratingInsights) {
            updateTask({ ...task, isGeneratingInsights: true });
            const healthData = parseHealthDataFromTasks(allTasks);
            const homeLocation = inferHomeLocation(allTasks);
            generateActionableInsights(task, healthData, notes, homeLocation, goals, allTasks).then(insightData => {
                updateTask({ ...task, insights: insightData, isGeneratingInsights: false });
            }).catch(error => {
                console.error("Async insight generation failed on detail view:", error);
                const taskWithError: Task = { ...task, isGeneratingInsights: false, insights: { widgets: [{ type: 'text', title: 'Insight Error', icon: 'SparklesIcon', content: 'Could not generate insights.' }] } };
                updateTask(taskWithError);
            });
        }
    }, [task.id, task.insights, task.isGeneratingInsights, allTasks, notes, updateTask, goals]);

    const handleRegenerateInsights = () => {
        const taskWithoutInsights = { ...editableTask, insights: null, isGeneratingInsights: true };
        updateTask(taskWithoutInsights);
        
        const healthData = parseHealthDataFromTasks(allTasks);
        const homeLocation = inferHomeLocation(allTasks);
        generateActionableInsights(taskWithoutInsights, healthData, notes, homeLocation, goals, allTasks)
            .then(insightData => {
                updateTask({ ...taskWithoutInsights, insights: insightData, isGeneratingInsights: false });
            })
            .catch(error => {
                console.error(error);
                updateTask({ ...taskWithoutInsights, insights: { widgets: [{ type: 'text', title: 'Error', icon: 'XCircleIcon', content: 'Failed to load insights. Please try again.' }] }, isGeneratingInsights: false });
            });
    };

    const handleSaveAndClose = () => { updateTask(editableTask); onClose(); };
    
    const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            
            Promise.all(files.map(file => new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            }))).then(dataUrls => {
                // FIX: Only update local state to prevent modal from closing.
                // Changes will be saved when the modal is closed via handleSaveAndClose.
                setEditableTask(currentTask => {
                    const updatedAttachments = [...(currentTask.attachmentUrls || []), ...dataUrls].slice(0, 10);
                    return { ...currentTask, attachmentUrls: updatedAttachments };
                });
            }).catch(error => {
                console.error("Error reading files:", error);
            });
        }
    };

    const handleAddInsightToNotes = (widget: InsightWidgetData) => {
        const title = widget.type === 'recipe' ? widget.name : widget.title;
        let content = `<h2>${title}</h2>`;
        switch(widget.type) {
            case 'metric': content += `<p><strong>${widget.value} ${widget.unit}</strong></p>`; break;
            case 'text': 
                content += `<p>${widget.content}</p>`; 
                if (widget.links) {
                    content += '<h3>Related Links:</h3><ul>';
                    content += widget.links.map(l => `<li><a href="${l.url}" target="_blank">${l.title}</a></li>`).join('');
                    content += '</ul>';
                }
                break;
            case 'area': case 'bar': case 'line': content += `<ul>${widget.data.map(d => `<li>${d.name}: ${d.value}</li>`).join('')}</ul><p><em>${widget.commentary}</em></p>`; break;
            case 'radial': content += `<p><strong>${widget.value}%</strong> - ${widget.label}</p>`; break;
            case 'recipe': content += `<ul>${widget.ingredients.map(i => `<li>${i}</li>`).join('')}</ul><p>${widget.quick_instructions}</p>`; break;
            case 'map': content += `<p>Location: ${widget.locationQuery}</p>`; break;
            case 'generated_image': content += `<p><em>${widget.prompt}</em></p>`; break;
            case 'weather': content += `<p>Current: ${widget.currentTemp}°, Location: ${widget.location}</p>`; break;
        }
        addNote(`Insight for ${task.title}: ${title}`, content, editableTask.notebookId || notes[0]?.notebookId || 1);
    };

    const handleLocationInputChange = async (value: string) => {
        setEditableTask(prev => ({...prev, location: value, locationEmbedUrl: undefined }));
        if (value.length > 2) {
            setIsFetchingSuggestions(true);
            const suggestions = await getAutocompleteSuggestions(value);
            setLocationSuggestions(suggestions);
            setIsFetchingSuggestions(false);
        } else {
            setLocationSuggestions([]);
        }
    };

    const handleLocationSuggestionClick = (suggestion: {place_name: string; address: string}) => {
        const newEmbedUrl = generateMapsEmbedUrl(suggestion.address);
        setEditableTask(prev => ({...prev, location: suggestion.address, locationEmbedUrl: newEmbedUrl}));
        setLocationSuggestions([]);
    };
    
    const isCompletedView = task.status === TaskStatus.Completed;

    return (
    <>
        <AnimatePresence>
        {isFullScreenViewerOpen && editableTask.attachmentUrls && (
            <FullScreenImageViewer images={editableTask.attachmentUrls.filter(Boolean) as string[]} initialIndex={fullScreenInitialIndex} onClose={() => setIsFullScreenViewerOpen(false)} />
        )}
        </AnimatePresence>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-fast" onClick={handleSaveAndClose}>
             <input type="file" ref={fileInputRef} onChange={handleAttachmentChange} accept="image/*" className="hidden" multiple/>
            <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="card rounded-2xl shadow-xl w-full max-w-4xl flex flex-col overflow-hidden max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <ImageViewer attachments={(editableTask.attachmentUrls || (isCompletedView ? [editableTask.completionImageUrl] : [])).filter(Boolean) as string[]} onImageClick={(index) => { setFullScreenInitialIndex(index); setIsFullScreenViewerOpen(true); }}/>
                <header className="p-4 sm:p-6 border-b border-light-border dark:border-dark-border flex-shrink-0">
                    <div className="flex justify-between items-start">
                         <div>
                            {isCompletedView ? 
                                <p className="text-sm font-bold uppercase tracking-wider text-green-500 flex items-center gap-2"><CheckCircleIcon className="w-5 h-5"/> COMPLETED</p>
                                :
                                <input list="category-list" value={editableTask.category} onChange={(e) => setEditableTask({...editableTask, category: e.target.value as Category})} className="text-sm font-bold uppercase tracking-wider text-accent bg-transparent -ml-1 p-1 appearance-none focus:ring-1 focus:ring-accent rounded-md"/>
                            }
                             <datalist id="category-list">{categories.map(cat => <option key={cat} value={cat}/>)}</datalist>

                            <input type="text" value={isCompletedView ? task.completionSummary?.newTitle || editableTask.title : editableTask.title} onChange={(e) => setEditableTask({...editableTask, title: e.target.value})} className="text-2xl sm:text-3xl font-bold font-display mt-1 bg-transparent w-full focus:outline-none focus:ring-1 focus:ring-accent rounded-sm" disabled={isCompletedView}/>
                         </div>
                        <button onClick={handleSaveAndClose} aria-label="Close modal" className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 ml-4"><XMarkIcon className="w-6 h-6"/></button>
                    </div>
                </header>
                <main className="p-4 sm:p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 bg-light-bg dark:bg-dark-bg">
                    <div className="space-y-4">
                         <div className="flex justify-between items-center"><h4 className="font-semibold flex items-center gap-2 text-accent"><SparklesIcon className="w-5 h-5"/> Strategic Insights</h4><button onClick={handleRegenerateInsights} disabled={task.isGeneratingInsights} className="p-1.5 rounded-md hover:bg-accent/20 disabled:opacity-50"><ArrowPathIcon className={`w-4 h-4 ${task.isGeneratingInsights ? 'animate-spin' : ''}`} /></button></div>
                        {task.isGeneratingInsights ? <p className="animate-pulse text-sm">✨ Kiko AI is generating new insights...</p> : insight && insight.widgets.length > 0 ? (
                            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                               {insight.widgets.map((widget, i) => {
                                   const props = { key: i, widget: widget as any, onAddToNotes: () => handleAddInsightToNotes(widget) };
                                   switch(widget.type) {
                                       case 'metric': return <KeyMetricWidgetComponent {...props}/>;
                                       case 'text': return <div className="sm:col-span-2"><TextWidgetComponent {...props}/></div>;
                                       case 'area': return <div className="sm:col-span-2"><AreaChartWidgetComponent {...props}/></div>;
                                       case 'radial': return <RadialChartWidgetComponent {...props} />;
                                       case 'recipe': return <div className="sm:col-span-2"><RecipeWidgetComponent {...props}/></div>;
                                       case 'map': return <div className="sm:col-span-2"><MapWidgetComponent {...props}/></div>;
                                       case 'generated_image': return <GeneratedImageWidgetComponent {...props}/>;
                                       case 'weather': return <div className="sm:col-span-2"><WeatherWidgetComponent {...props}/></div>;
                                       default: return null;
                                   }
                               })}
                            </motion.div>
                        ) : <p className="text-sm text-light-text-secondary">No AI insight available for this task.</p> }
                    </div>
                    {isCompletedView ? (
                        <div className="space-y-4">
                             <h4 className="font-semibold">Details</h4>
                             <p><strong>Time:</strong> {task.startTime.toLocaleString()}</p>
                             <p><strong>Duration:</strong> {task.actualDuration || task.plannedDuration} minutes</p>
                             {task.location && <p><strong>Location:</strong> {task.location}</p>}
                        </div>
                    ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-semibold text-light-text-secondary">Start Time</label><input type="time" value={editableTask.startTime.toTimeString().substring(0,5)} onChange={e => { const [h, m] = e.target.value.split(':'); const d = new Date(editableTask.startTime); d.setHours(parseInt(h), parseInt(m)); setEditableTask({...editableTask, startTime: d}); }} className="w-full p-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg mt-1" /></div><div><label className="text-xs font-semibold text-light-text-secondary">Duration (min)</label><input type="number" value={editableTask.plannedDuration} onChange={e => setEditableTask({...editableTask, plannedDuration: parseInt(e.target.value) || 0})} className="w-full p-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg mt-1" /></div></div>
                        <div className="space-y-3">
                             <div><label className="text-xs font-semibold text-light-text-secondary flex items-center gap-1.5 mb-1"><Icons.BriefcaseIcon className="w-4 h-4"/> Project</label><select value={editableTask.projectId || ""} onChange={(e) => setEditableTask({...editableTask, projectId: parseInt(e.target.value) || undefined})} className="w-full p-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg"><option value="">None</option>{projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
                             <div><label className="text-xs font-semibold text-light-text-secondary flex items-center gap-1.5 mb-1"><DocumentTextIcon className="w-4 h-4"/> Linked Note</label><select value={editableTask.notebookId || ""} onChange={(e) => setEditableTask({...editableTask, notebookId: parseInt(e.target.value) || undefined})} className="w-full p-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg"><option value="">None</option>{notes.map(note => <option key={note.id} value={note.id}>{note.title}</option>)}</select></div>
                             <div className="relative">
                                <label className="text-xs font-semibold text-light-text-secondary flex items-center gap-1.5 mb-1">
                                    <input type="checkbox" checked={editableTask.isVirtual} onChange={e => setEditableTask({...editableTask, isVirtual: e.target.checked, location: '', locationEmbedUrl: ''})} className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent" />
                                    <span>Virtual Event</span>
                                </label>
                                <div className="relative">
                                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary">{editableTask.isVirtual ? <LinkIcon className="w-4 h-4"/> : <MapPinIcon className="w-4 h-4"/>}</span>
                                     <input type="text" placeholder={editableTask.isVirtual ? "Zoom Link..." : "China Beach..."} value={editableTask.isVirtual ? editableTask.linkedUrl || '' : editableTask.location || ''} onChange={(e) => editableTask.isVirtual ? setEditableTask({...editableTask, linkedUrl: e.target.value}) : handleLocationInputChange(e.target.value)} className="w-full p-2 pl-9 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg" />
                                </div>
                                {locationSuggestions.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg shadow-lg">
                                        {locationSuggestions.map(s => <div key={s.address} onClick={() => handleLocationSuggestionClick(s)} className="p-2 hover:bg-accent/10 cursor-pointer text-sm"><strong>{s.place_name}</strong><br/><span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{s.address}</span></div>)}
                                    </div>
                                )}
                                {editableTask.locationEmbedUrl && !editableTask.isVirtual && (
                                    <div className="mt-2 space-y-1">
                                        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(editableTask.location || '')}`} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline">{editableTask.location}</a>
                                        <iframe className="w-full h-24 rounded-lg border-none" loading="lazy" allowFullScreen src={editableTask.locationEmbedUrl}></iframe>
                                    </div>
                                )}
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="w-full text-sm p-2 flex items-center justify-center gap-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg hover:bg-light-border dark:hover:bg-dark-border disabled:opacity-50" disabled={(editableTask.attachmentUrls?.length || 0) >= 10}>
                                <PhotoIcon className="w-4 h-4"/> Attach Images ({(editableTask.attachmentUrls?.length || 0)}/10)
                            </button>
                        </div>
                    </div>
                    )}
                </main>
                {!isCompletedView && (
                <footer className="p-4 bg-light-card/50 dark:bg-dark-card/50 border-t border-light-border dark:border-dark-border flex-shrink-0 grid grid-cols-2 gap-4">
                     <button onClick={handleSaveAndClose} className="w-full py-3 px-4 bg-light-bg dark:bg-dark-bg hover:bg-light-border dark:hover:bg-dark-border font-semibold rounded-lg shadow-sm">Save Changes</button>
                     <button onClick={onComplete} className="w-full py-3 px-4 bg-accent hover:bg-accent-hover text-white font-semibold rounded-lg shadow-md flex items-center justify-center gap-2"><CheckCircleIcon className="w-6 h-6"/> Mark Complete</button>
                </footer>
                )}
            </motion.div>
        </div>
        </>
    );
};

export default EventDetail;