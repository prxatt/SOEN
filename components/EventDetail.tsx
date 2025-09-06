import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, RadialBarChart, RadialBar, AreaChart, Area } from 'recharts';
import { Task, Note, Project, ActionableInsight, Goal, ChatMessage, TaskStatus, HealthData, InsightWidgetData, ChartWidget, KeyMetricWidget, TextWidget, RecipeWidget, Category, AreaChartWidget, RadialChartWidget, MapWidget, GeneratedImageWidget, WeatherWidget, Notebook } from '../types';
import { getChatFollowUp, getAutocompleteSuggestions, generateMapsEmbedUrl } from '../services/geminiService';
import { inferHomeLocation } from '../utils/taskUtils';
import { CheckCircleIcon, XMarkIcon, SparklesIcon, DocumentTextIcon, LinkIcon, ArrowPathIcon, PaperAirplaneIcon, PaperClipIcon, PlusIcon, VideoCameraIcon, LightBulbIcon, ChevronLeftIcon, ChevronRightIcon, PhotoIcon, MapPinIcon, ArrowDownTrayIcon, ChatBubbleLeftEllipsisIcon } from './Icons';
import * as Icons from './Icons';
import { DEFAULT_CATEGORIES } from '../constants';

interface EventDetailProps {
    task: Task;
    allTasks: Task[]; // Pass all tasks for context
    notes: Note[];
    notebooks: Notebook[];
    projects: Project[];
    goals: Goal[];
    updateTask: (task: Task) => void;
    onComplete: () => void;
    onClose: () => void;
    redirectToKikoAIWithChat: (history: ChatMessage[]) => void;
    addNote: (title: string, content: string, notebookId: number) => void;
    categories: Category[];
    triggerInsightGeneration: (task: Task, isRegeneration: boolean) => void;
    onViewNote?: (noteId: number) => void;
}

const modalVariants = { hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 }};
const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 }};
const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 }}};

// --- WIDGET SUBCOMPONENTS ---
const InsightWidgetContainer: React.FC<{title: string, icon: React.ReactNode, onAddToNotes?: () => void, onChat?: () => void, children: React.ReactNode}> = ({ title, icon, onAddToNotes, onChat, children }) => (
    <motion.div variants={itemVariants} className="relative bg-light-bg/50 dark:bg-dark-bg/50 p-3 rounded-xl border border-light-border dark:border-dark-border">
         <div className="flex justify-between items-center mb-2">
            <h5 className="font-semibold text-xs flex items-center gap-2 text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">{icon}{title}</h5>
            <div className="flex items-center">
                {onChat && <button onClick={onChat} title="Chat about this insight" className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10" aria-label="Chat about this"><ChatBubbleLeftEllipsisIcon className="w-4 h-4"/></button>}
                {onAddToNotes && <button onClick={onAddToNotes} title="Save insight to notes" className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10" aria-label="Add to Notes"><PlusIcon className="w-4 h-4"/></button>}
            </div>
        </div>
        {children}
    </motion.div>
);

const KeyMetricWidgetComponent: React.FC<{widget: KeyMetricWidget, onAddToNotes: () => void, onChat: () => void}> = ({widget, onAddToNotes, onChat}) => {
    const Icon = (Icons as any)[widget.icon] || SparklesIcon;
    return (
    <InsightWidgetContainer title={widget.title} icon={<Icon className={`w-4 h-4 ${widget.color}`}/>} onAddToNotes={onAddToNotes} onChat={onChat}>
        <div className="flex items-baseline gap-2">
            <p className={`text-4xl lg:text-5xl font-bold font-display ${widget.color}`}>{widget.value}</p>
            <p className="font-semibold text-light-text-secondary dark:text-dark-text-secondary">{widget.unit}</p>
        </div>
    </InsightWidgetContainer>
)};

const TextWidgetComponent: React.FC<{widget: TextWidget, onAddToNotes: () => void, onChat: () => void}> = ({widget, onAddToNotes, onChat}) => {
     const Icon = (Icons as any)[widget.icon] || LightBulbIcon;
     const formatContent = (content: string) => {
        return (content || '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>');
     }
     return (
        <InsightWidgetContainer title={widget.title} icon={<Icon className="w-4 h-4"/>} onAddToNotes={onAddToNotes} onChat={onChat}>
            <div className="text-sm prose prose-sm dark:prose-invert max-w-none break-word" dangerouslySetInnerHTML={{ __html: formatContent(widget.content) }}></div>
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

const ChartWidgetComponent: React.FC<{widget: ChartWidget, onAddToNotes: () => void, onChat: () => void}> = ({widget, onAddToNotes, onChat}) => (
    <InsightWidgetContainer title={widget.title} icon={<Icons.ChartBarIcon className="w-4 h-4"/>} onAddToNotes={onAddToNotes} onChat={onChat}>
        <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
                {widget.type === 'bar' ? (
                    <BarChart data={widget.data} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                        <XAxis dataKey="name" stroke="var(--color-text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="var(--color-text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{backgroundColor: 'var(--color-card, #1C1C1E)', border: '1px solid var(--color-border, #2D2D2F)', borderRadius: '0.75rem'}}/>
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {widget.data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Bar>
                    </BarChart>
                ) : ( // 'line'
                    <LineChart data={widget.data} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                        <XAxis dataKey="name" stroke="var(--color-text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="var(--color-text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{backgroundColor: 'var(--color-card, #1C1C1E)', border: '1px solid var(--color-border, #2D2D2F)', borderRadius: '0.75rem'}}/>
                        <Line type="monotone" dataKey="value" stroke={widget.data[0]?.fill || '#8884d8'} strokeWidth={2} dot={{ r: 4, fill: widget.data[0]?.fill }} activeDot={{ r: 6 }}/>
                    </LineChart>
                )}
            </ResponsiveContainer>
        </div>
         <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">{widget.commentary}</p>
    </InsightWidgetContainer>
);

const AreaChartWidgetComponent: React.FC<{widget: AreaChartWidget, onAddToNotes: () => void, onChat: () => void}> = ({widget, onAddToNotes, onChat}) => (
    <InsightWidgetContainer title={widget.title} icon={<Icons.ChartBarIcon className="w-4 h-4"/>} onAddToNotes={onAddToNotes} onChat={onChat}>
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

const RadialChartWidgetComponent: React.FC<{widget: RadialChartWidget, onAddToNotes: () => void, onChat: () => void}> = ({widget, onAddToNotes, onChat}) => (
     <InsightWidgetContainer title={widget.title} icon={<Icons.BoltIcon className="w-4 h-4"/>} onAddToNotes={onAddToNotes} onChat={onChat}>
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


const RecipeWidgetComponent: React.FC<{ widget: RecipeWidget; onAddToNotes: () => void, onChat: () => void }> = ({ widget, onAddToNotes, onChat }) => (
    <InsightWidgetContainer icon={<DocumentTextIcon className="w-4 h-4 text-blue-400"/>} title="Recipe Intel" onAddToNotes={onAddToNotes} onChat={onChat}>
        <h4 className="font-bold">{widget.name}</h4>
        {widget.imageUrl && <img src={widget.imageUrl} alt={widget.name} className="rounded-lg h-32 w-full object-cover"/>}
        <div className="text-xs"><strong className="text-blue-400">Ingredients:</strong><ul className="list-disc list-inside columns-2">{widget.ingredients.map(i=><li key={i}>{i}</li>)}</ul></div>
        <p className="text-xs"><strong className="text-blue-400">Instructions:</strong> {widget.quick_instructions}</p>
        <a href={widget.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-accent hover:underline">View Full Recipe</a>
    </InsightWidgetContainer>
);

const MapWidgetComponent: React.FC<{widget: MapWidget, onAddToNotes: () => void, onChat: () => void}> = ({widget, onAddToNotes, onChat}) => (
    <InsightWidgetContainer title={widget.title} icon={<MapPinIcon className="w-4 h-4 text-red-400"/>} onAddToNotes={onAddToNotes} onChat={onChat}>
        <iframe
            className="w-full h-48 rounded-lg border-none"
            loading="lazy"
            allowFullScreen
            src={widget.embedUrl}>
        </iframe>
    </InsightWidgetContainer>
);

const WeatherWidgetComponent: React.FC<{widget: WeatherWidget, onAddToNotes: () => void, onChat: () => void}> = ({widget, onAddToNotes, onChat}) => {
    const Icon = (Icons as any)[`${widget.conditionIcon}Icon`] || Icons.SparklesIcon;
    return (
        <InsightWidgetContainer title={widget.title} icon={<Icon className="w-4 h-4 text-blue-400"/>} onAddToNotes={onAddToNotes} onChat={onChat}>
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


const GeneratedImageWidgetComponent: React.FC<{widget: GeneratedImageWidget, onAddToNotes: () => void, onChat: () => void}> = ({widget, onAddToNotes, onChat}) => {
    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = widget.imageUrl;
        link.download = `${(widget?.title || 'PraxisAI_Image').replace(/\s/g, '_')}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    return (
        <InsightWidgetContainer title={widget.title} icon={<SparklesIcon className="w-4 h-4 text-accent"/>} onAddToNotes={onAddToNotes} onChat={onChat}>
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

/**
 * A reusable component to render any type of insight widget.
 * It acts as a dispatcher, selecting the correct sub-component based on the widget's type.
 */
const InsightWidget: React.FC<{
    widget: InsightWidgetData;
    onAddToNotes: () => void;
    onChat: () => void;
}> = ({ widget, onAddToNotes, onChat }) => {
    const props = { widget: widget as any, onAddToNotes, onChat };

    switch (widget.type) {
        case 'bar':
        case 'line':
            return <div className="sm:col-span-2"><ChartWidgetComponent {...props} /></div>;
        case 'metric':
            return <KeyMetricWidgetComponent {...props} />;
        case 'text':
            return <div className="sm:col-span-2"><TextWidgetComponent {...props} /></div>;
        case 'area':
            return <div className="sm:col-span-2"><AreaChartWidgetComponent {...props} /></div>;
        case 'radial':
            return <RadialChartWidgetComponent {...props} />;
        case 'recipe':
            return <div className="sm:col-span-2"><RecipeWidgetComponent {...props} /></div>;
        case 'map':
            if (widget.embedUrl) return <div className="sm:col-span-2"><MapWidgetComponent {...props} /></div>;
            return null;
        case 'generated_image':
            return <GeneratedImageWidgetComponent {...props} />;
        case 'weather':
            return <div className="sm:col-span-2"><WeatherWidgetComponent {...props} /></div>;
        default:
            const _exhaustiveCheck: never = widget;
            console.warn("Unhandled widget type:", _exhaustiveCheck);
            return null;
    }
};

const EventDetail: React.FC<EventDetailProps> = ({ task, allTasks, notes, notebooks, projects, goals, updateTask, onComplete, onClose, redirectToKikoAIWithChat, addNote, categories, triggerInsightGeneration, onViewNote }) => {
    const [editableTask, setEditableTask] = useState(task);
    const [locationSuggestions, setLocationSuggestions] = useState<{place_name: string; address: string}[]>([]);
    const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);

    const insight = task.insights;

    useEffect(() => {
        setEditableTask(task);
    }, [task]);
    
    useEffect(() => {
        if (!task.insights && !task.isGeneratingInsights && task.status !== TaskStatus.Completed) {
            updateTask({ ...task, isGeneratingInsights: true });
            triggerInsightGeneration(task, false);
        }
    }, [task, triggerInsightGeneration, updateTask]);


    const handleRegenerateInsights = () => {
        const taskForRegen = { ...editableTask, insights: null, isGeneratingInsights: true };
        updateTask(taskForRegen);
        triggerInsightGeneration(taskForRegen, true);
    };

    const handleSaveChanges = () => { updateTask(editableTask); onClose(); };
    
    const handleAddInsightToNotes = (widget: InsightWidgetData) => {
        let title: string;
        let contentBody: string;

        switch(widget.type) {
            case 'metric': 
                title = widget.title;
                contentBody = `<p><strong>${widget.value} ${widget.unit}</strong></p>`; 
                break;
            case 'text': 
                title = widget.title;
                contentBody = `<p>${widget.content.replace(/\n/g, '<br/>')}</p>`; 
                if (widget.links && widget.links.length > 0) {
                    contentBody += '<h3>Related Links:</h3><ul>';
                    contentBody += widget.links.map(l => `<li><a href="${l.url}" target="_blank" rel="noopener noreferrer">${l.title}</a></li>`).join('');
                    contentBody += '</ul>';
                }
                break;
            case 'area':
            case 'bar':
            case 'line': 
                title = widget.title;
                contentBody = `<ul>${widget.data.map(d => `<li>${d.name}: ${d.value}</li>`).join('')}</ul><p><em>${widget.commentary}</em></p>`;
                break;
            case 'radial': 
                title = widget.title;
                contentBody = `<p><strong>${widget.value}%</strong> - ${widget.label}</p>`; 
                break;
            case 'recipe': 
                title = widget.name;
                contentBody = `<h3>Ingredients:</h3><ul>${widget.ingredients.map(i => `<li>${i}</li>`).join('')}</ul><h3>Instructions:</h3><p>${widget.quick_instructions}</p><p><a href="${widget.sourceUrl}" target="_blank">View full recipe</a></p>`; 
                break;
            case 'map': 
                title = widget.title;
                contentBody = `<p>Location: ${widget.locationQuery}</p><p><a href="${widget.embedUrl.replace('embed', 'place')}" target="_blank">View on Google Maps</a></p><iframe src="${widget.embedUrl}" width="100%" height="300" style="border:0;" allowfullscreen="" loading="lazy"></iframe>`; 
                break;
            case 'generated_image': 
                title = widget.title;
                contentBody = `<img src="${widget.imageUrl}" alt="${widget.prompt}" style="max-width: 100%; border-radius: 8px;"/><p><em>Prompt: ${widget.prompt}</em></p>`; 
                break;
            case 'weather': 
                title = widget.title;
                contentBody = `<p>Current: ${widget.currentTemp}°, Location: ${widget.location}</p><h4>Forecast:</h4><ul>${widget.hourlyForecast.map(h => `<li>${h.time}: ${h.temp}°</li>`).join('')}</ul>`;
                break;
            default:
                const _exhaustiveCheck: never = widget;
                return;
        }
        
        const content = `<h2>${title}</h2>` + contentBody;
        const generalNotebook = notebooks.find(nb => nb.title.toLowerCase() === 'general');
        const defaultNotebookId = editableTask.notebookId || generalNotebook?.id || notebooks[0]?.id || 1;
        addNote(`Insight for "${task.title}": ${title}`, content, defaultNotebookId);
    };

    const handleLocationInputChange = async (value: string) => {
        setEditableTask(prev => ({...prev, location: value}));
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
        setEditableTask(prev => ({...prev, location: suggestion.address}));
        setLocationSuggestions([]);
    };
    
    const isCompletedView = task.status === TaskStatus.Completed;

    const renderInsights = (widgets: InsightWidgetData[]) => (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {widgets.map((widget, i) => {
                const widgetTitle = 'title' in widget ? widget.title : 'name' in widget ? widget.name : 'Insight';
                
                let widgetContent = '';
                if (widget.type === 'text') {
                    widgetContent = widget.content;
                } else if (widget.type === 'recipe') {
                    widgetContent = widget.ingredients.join(', ');
                } else if (widget.type === 'generated_image') {
                    widgetContent = widget.prompt;
                }
                
                const chatContext = `Let's talk about this insight for my task "${task.title}": ${widgetTitle}. ${widgetContent}`;
                const onChat = () => redirectToKikoAIWithChat([{ role: 'user', text: chatContext }, { role: 'model', text: `Of course. What are your thoughts on "${widgetTitle}"?` }]);
                
                return (
                    <InsightWidget
                        key={i}
                        widget={widget}
                        onAddToNotes={() => handleAddInsightToNotes(widget)}
                        onChat={onChat}
                    />
                );
            })}
        </motion.div>
    );

    const completionImageUrl = isCompletedView ? editableTask.completionImageUrl : null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-fast" onClick={handleSaveChanges}>
            {completionImageUrl && (
                <div className="absolute inset-0 z-0">
                    <img src={completionImageUrl} alt="Completion background" className="w-full h-full object-cover blur-lg scale-110"/>
                    <div className="absolute inset-0 bg-black/40"></div>
                </div>
            )}
            <motion.div 
                variants={modalVariants} 
                initial="hidden" 
                animate="visible" 
                exit="exit" 
                className={`${completionImageUrl ? 'glass-card text-white' : 'card'} relative rounded-2xl shadow-xl w-full max-w-4xl flex flex-col overflow-hidden max-h-[90vh]`}
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 sm:p-6 border-b border-light-border/30 dark:border-dark-border/30 flex-shrink-0">
                    <div className="flex justify-between items-start">
                         <div>
                            {isCompletedView ? 
                                <p className="text-sm font-bold uppercase tracking-wider text-green-400 flex items-center gap-2"><CheckCircleIcon className="w-5 h-5"/> COMPLETED</p>
                                :
                                <input list="category-list" value={editableTask.category} onChange={(e) => setEditableTask({...editableTask, category: e.target.value as Category})} className="text-sm font-bold uppercase tracking-wider text-accent bg-transparent -ml-1 p-1 appearance-none focus:ring-1 focus:ring-accent rounded-md"/>
                            }
                             <datalist id="category-list">{categories.map(cat => <option key={cat} value={cat}/>)}</datalist>

                            <input type="text" value={isCompletedView ? task.completionSummary?.newTitle || editableTask.title : editableTask.title} onChange={(e) => setEditableTask({...editableTask, title: e.target.value})} className="text-2xl sm:text-3xl font-bold font-display mt-1 bg-transparent w-full focus:outline-none focus:ring-1 focus:ring-accent rounded-sm" disabled={isCompletedView}/>
                         </div>
                        <button onClick={handleSaveChanges} aria-label="Close modal" className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 ml-4"><XMarkIcon className="w-6 h-6"/></button>
                    </div>
                </header>
                <main className="p-4 sm:p-6 overflow-y-auto bg-light-bg/80 dark:bg-dark-bg/80">
                    {isCompletedView ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-1 space-y-4 prose prose-sm dark:prose-invert max-w-none">
                                <h4 className="font-semibold !mb-2">Details</h4>
                                <p><strong>Time:</strong> {new Date(task.startTime).toLocaleString()}</p>
                                <p><strong>Duration:</strong> {task.actualDuration || task.plannedDuration} minutes</p>
                                {task.location && <p><strong>Location:</strong> {task.location}</p>}
                                {task.linkedUrl && <p><strong>Link:</strong> <a href={task.linkedUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{task.linkedUrl}</a></p>}
                                {task.completionSummary?.shortInsight && <p><strong>Summary:</strong> {task.completionSummary.shortInsight}</p>}
                            </div>
                            <div className="lg:col-span-2 space-y-4">
                                <h4 className="font-semibold flex items-center gap-2 text-accent"><SparklesIcon className="w-5 h-5"/> Strategic Insights</h4>
                                <button onClick={handleRegenerateInsights} disabled={task.isGeneratingInsights} className="w-full text-sm p-2 rounded-lg bg-accent/10 hover:bg-accent/20 flex items-center justify-center gap-2">
                                     <ArrowPathIcon className={`w-4 h-4 ${task.isGeneratingInsights ? 'animate-spin' : ''}`} />
                                     {task.isGeneratingInsights ? 'Analyzing Health Data...' : 'Regenerate with latest Health Data'}
                                </button>
                                {insight && insight.widgets && insight.widgets.length > 0 ? (
                                    renderInsights(insight.widgets)
                                ) : <p className="text-sm text-light-text-secondary">No AI insight available for this completed task.</p>}
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                            <div className="lg:col-span-3 space-y-4">
                                <div className="flex justify-between items-center"><h4 className="font-semibold flex items-center gap-2 text-accent"><SparklesIcon className="w-5 h-5"/> Strategic Insights</h4><button onClick={handleRegenerateInsights} disabled={task.isGeneratingInsights} className="p-1.5 rounded-md hover:bg-accent/20 disabled:opacity-50"><ArrowPathIcon className={`w-4 h-4 ${task.isGeneratingInsights ? 'animate-spin' : ''}`} /></button></div>
                                {task.isGeneratingInsights ? <p className="animate-pulse text-sm">✨ Kiko AI is generating new insights...</p> : insight && insight.widgets && insight.widgets.length > 0 ? (
                                    renderInsights(insight.widgets)
                                ) : <p className="text-sm text-light-text-secondary">No AI insight available for this task.</p>}
                            </div>
                            <div className="lg:col-span-2 space-y-4">
                                <button onClick={onComplete} className="w-full flex items-center justify-center gap-2 text-sm font-semibold py-2 px-4 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors">
                                    <CheckCircleIcon className="w-5 h-5"/> Mark as Complete
                                </button>
                                <div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-semibold text-light-text-secondary">Start Time</label><input type="time" value={editableTask.startTime.toTimeString().substring(0,5)} onChange={e => { const [h, m] = e.target.value.split(':'); const d = new Date(editableTask.startTime); d.setHours(parseInt(h), parseInt(m)); setEditableTask({...editableTask, startTime: d}); }} className="w-full p-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg mt-1" /></div><div><label className="text-xs font-semibold text-light-text-secondary">Duration (min)</label><input type="number" value={editableTask.plannedDuration} onChange={e => setEditableTask({...editableTask, plannedDuration: parseInt(e.target.value) || 0})} className="w-full p-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg mt-1" /></div></div>
                                <div>
                                    <label className="text-xs font-semibold text-light-text-secondary">Repeat</label>
                                    <select value={editableTask.repeat || 'none'} onChange={e => setEditableTask({...editableTask, repeat: e.target.value as Task['repeat']})} className="w-full p-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg mt-1">
                                        <option value="none">Does not repeat</option>
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                </div>
                                <div className="space-y-3">
                                     <div><label className="text-xs font-semibold text-light-text-secondary flex items-center gap-1.5 mb-1"><Icons.BriefcaseIcon className="w-4 h-4"/> Project</label><select value={editableTask.projectId || ""} onChange={(e) => setEditableTask({...editableTask, projectId: parseInt(e.target.value) || undefined})} className="w-full p-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg"><option value="">None</option>{projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
                                      <div><label className="text-xs font-semibold text-light-text-secondary flex items-center gap-1.5 mb-1"><DocumentTextIcon className="w-4 h-4"/> Linked Note</label>
                                        {editableTask.notebookId && onViewNote ? (
                                             <button onClick={() => onViewNote(editableTask.notebookId!)} className="w-full text-left p-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg hover:bg-accent/10 truncate">{notes.find(n=>n.id === editableTask.notebookId)?.title || 'Select a Note'}</button>
                                        ) : (
                                            <select value={editableTask.notebookId || ""} onChange={(e) => setEditableTask({...editableTask, notebookId: parseInt(e.target.value) || undefined})} className="w-full p-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg"><option value="">None</option>{notes.map(note => <option key={note.id} value={note.id}>{note.title}</option>)}</select>
                                        )}
                                     </div>
                                     <div>
                                        <label className="text-xs font-semibold text-light-text-secondary flex items-center gap-1.5 mb-1"><LinkIcon className="w-4 h-4"/> Reference URL</label>
                                        {editableTask.referenceUrl ? <a href={editableTask.referenceUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline block truncate p-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg">{editableTask.referenceUrl}</a> : <input type="text" placeholder="https://coursera.org/..." value={editableTask.referenceUrl || ''} onChange={(e) => setEditableTask({...editableTask, referenceUrl: e.target.value})} className="w-full p-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg"/>}
                                    </div>
                                     <div className="relative">
                                        <label className="text-xs font-semibold text-light-text-secondary flex items-center gap-1.5 mb-1">
                                            <input type="checkbox" checked={editableTask.isVirtual} onChange={e => setEditableTask({...editableTask, isVirtual: e.target.checked, location: ''})} className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent" />
                                            <span>Virtual Event</span>
                                        </label>
                                        <div className="relative">
                                             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary">{editableTask.isVirtual ? <VideoCameraIcon className="w-4 h-4"/> : <MapPinIcon className="w-4 h-4"/>}</span>
                                             {editableTask.isVirtual && editableTask.linkedUrl ? <a href={editableTask.linkedUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline block truncate p-2 pl-9 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg">{editableTask.linkedUrl}</a> : <input type="text" placeholder={editableTask.isVirtual ? "Zoom Link..." : "123 Main St, San Francisco, CA"} value={editableTask.isVirtual ? editableTask.linkedUrl || '' : editableTask.location || ''} onChange={(e) => editableTask.isVirtual ? setEditableTask({...editableTask, linkedUrl: e.target.value}) : handleLocationInputChange(e.target.value)} className="w-full p-2 pl-9 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg" />}
                                        </div>
                                        {locationSuggestions.length > 0 && !editableTask.isVirtual && (
                                            <div className="absolute z-10 w-full mt-1 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg shadow-lg">
                                                {locationSuggestions.map(s => <div key={s.address} onClick={() => handleLocationSuggestionClick(s)} className="p-2 hover:bg-accent/10 cursor-pointer text-sm"><strong>{s.place_name}</strong><br/><span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{s.address}</span></div>)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
                <footer className="flex-shrink-0 p-4 sm:p-6 border-t border-light-border/30 dark:border-dark-border/30 flex justify-end items-center">
                    {!isCompletedView && (
                        <button onClick={handleSaveChanges} className="flex items-center gap-2 text-sm font-semibold py-2 px-4 rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors">
                            Save Changes
                        </button>
                    )}
                </footer>
            </motion.div>
        </div>
    );
}

export default EventDetail;