import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, RadialBarChart, RadialBar, Legend, Cell, PieChart, Pie } from 'recharts';
import { Insight, StrategicBriefing, Task, Note, SearchResult, SearchHistoryItem, VisionHistoryItem, Notebook, Goal, GoalTerm, MindMapNode, MindMapEdge, ChatMessage, Project, ProjectStatusReport, MissionBriefing, HealthRingMetric, HealthData } from '../types';
// FIX: Removed unused import 'generateMindMapData' as it is not exported from geminiService.
import { performInternetSearch, analyzeImageWithPrompt, generateProjectStatusReport, getChatContextualPrompts } from '../services/geminiService';
import { kikoRequest } from '../services/kikoAIService';
import { LightBulbIcon, BookOpenIcon, LinkIcon, FlagIcon, PlusCircleIcon, CheckCircleIcon, SparklesIcon, ShareIcon, UserIcon, PaperAirplaneIcon, PaperClipIcon, HeartIcon, BrainCircuitIcon, RocketIcon, MagnifyingGlassIcon, KikoIcon, ChevronDownIcon, ChevronRightIcon, BriefcaseIcon, ArrowPathIcon, XMarkIcon } from './Icons';
import * as Icons from './Icons';
import LoadingSpinner from './LoadingSpinner';

interface PraxisAIProps {
  insights: Insight[]; setInsights: React.Dispatch<React.SetStateAction<Insight[]>>;
  tasks: Task[]; notes: Note[]; notebooks: Notebook[]; projects: Project[];
  healthData: HealthData;
  goals: Goal[]; setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  addTask: (title: string) => void;
  addNote: (title: string, content: string, notebookId: number) => void;
  startChatWithContext: (context: string, type: 'note' | 'suggestion' | 'theme') => void;
  searchHistory: SearchHistoryItem[]; setSearchHistory: React.Dispatch<React.SetStateAction<SearchHistoryItem[]>>;
  visionHistory: VisionHistoryItem[]; setVisionHistory: React.Dispatch<React.SetStateAction<VisionHistoryItem[]>>;
  applyInsight: (insightId: number) => void;
  chatMessages: ChatMessage[]; setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  onSendMessage: (message: string, attachment?: ChatMessage['attachment']) => void;
  isAiReplying: boolean;
}

type AITab = 'mission_control' | 'goals_strategy' | 'insights';

const TabButton: React.FC<{label: string; isActive: boolean; onClick: () => void}> = ({label, isActive, onClick}) => (
    <button onClick={onClick} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${isActive ? 'bg-accent text-white' : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-black/5 dark:hover:bg-white/10'}`}>
        {label}
    </button>
);

const GoalsHub: React.FC<{goals: Goal[], setGoals: React.Dispatch<React.SetStateAction<Goal[]>>}> = ({ goals, setGoals }) => {
    const updateGoalText = (id: number, text: string) => setGoals(prev => prev.map(g => g.id === id ? {...g, text} : g));
    const toggleGoalStatus = (id: number) => setGoals(prev => prev.map(g => g.id === id ? {...g, status: g.status === 'active' ? 'completed' : 'active'} : g));
    const addGoal = (term: GoalTerm) => setGoals(prev => [...prev, { id: Date.now(), term, text: 'New Goal', status: 'active' }]);
    const GoalItem: React.FC<{goal: Goal}> = ({ goal }) => (
        <div className="flex items-center gap-3 p-3 bg-light-bg/50 dark:bg-dark-bg/30 rounded-lg transition-colors duration-200">
            <button onClick={() => toggleGoalStatus(goal.id)} aria-label={`Mark goal as ${goal.status === 'completed' ? 'active' : 'completed'}`} className="flex-shrink-0">
                {goal.status === 'completed' ? <CheckCircleIcon className="w-6 h-6 text-green-500" /> : <div className="w-6 h-6 rounded-full border-2 border-gray-400 dark:border-white/30 hover:border-accent transition-colors" />}
            </button>
            <input type="text" value={goal.text} onChange={(e) => updateGoalText(goal.id, e.target.value)} aria-label="Goal text" className={`flex-grow bg-transparent focus:outline-none focus:ring-1 focus:ring-accent rounded-sm px-1 text-sm ${goal.status === 'completed' ? 'line-through text-light-text-secondary dark:text-dark-text-secondary' : ''}`} />
        </div>
    );
    const GoalTermCard: React.FC<{term: GoalTerm, title: string}> = ({ term, title }) => (
        <div className="card p-4 rounded-xl flex flex-col">
            <h4 className="font-semibold mb-3 text-light-text dark:text-dark-text">{title}</h4>
            <div className="space-y-2 flex-grow">
                {goals.filter(g => g.term === term).map(goal => <GoalItem key={goal.id} goal={goal}/>)}
            </div>
            <button onClick={() => addGoal(term)} className="mt-3 flex items-center justify-center gap-2 w-full text-sm font-semibold p-2 rounded-lg text-light-text-secondary dark:text-dark-text-secondary hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                <PlusCircleIcon className="w-5 h-5" /> Add Goal
            </button>
        </div>
    );
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <GoalTermCard term="short" title="Short-Term (This Quarter)" />
            <GoalTermCard term="mid" title="Mid-Term (This Year)" />
            <GoalTermCard term="long" title="Long-Term (2-5 Years)" />
        </div>
    );
};

const GoalsAndStrategyTab: React.FC<PraxisAIProps> = ({ goals, setGoals }) => {
    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex-shrink-0">
                 <GoalsHub goals={goals} setGoals={setGoals} />
            </div>
            <div className="flex-grow min-h-[300px] card rounded-xl flex items-center justify-center text-light-text-secondary dark:text-dark-text-secondary">
                <p>Mind Map generation coming soon.</p>
            </div>
        </div>
    );
};

const MissionControl: React.FC<{tasks: Task[], notes: Note[], healthData: HealthData}> = ({ tasks, notes, healthData }) => {
    type Timeframe = 'day' | 'week' | 'month';
    const [timeframe, setTimeframe] = useState<Timeframe>('day');
    const [briefing, setBriefing] = useState<MissionBriefing | null>(null);
    const [briefingCache, setBriefingCache] = useState<Record<Timeframe, MissionBriefing | null>>({ day: null, week: null, month: null });
    const [isLoading, setIsLoading] = useState(true);
    const [loadingText, setLoadingText] = useState("Generating daily intelligence...");
    const [activeFocus, setActiveFocus] = useState<string | null>(null);


    const fetchBriefing = useCallback(async (tf: Timeframe, forceRegenerate = false) => {
        if (briefingCache[tf] && !forceRegenerate) {
            setBriefing(briefingCache[tf]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setLoadingText(`Generating ${tf === 'day' ? 'daily' : tf + 'ly'} intelligence...`);
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let filteredTasks: Task[], filteredNotes: Note[];

        switch (tf) {
            case 'week':
                const startOfWeek = new Date(startOfDay);
                startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
                filteredTasks = tasks.filter(t => t.startTime >= startOfWeek);
                filteredNotes = notes.filter(n => n.createdAt >= startOfWeek);
                break;
            case 'month':
                 const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                 filteredTasks = tasks.filter(t => t.startTime >= startOfMonth);
                 filteredNotes = notes.filter(n => n.createdAt >= startOfMonth);
                break;
            case 'day':
            default:
                filteredTasks = tasks.filter(t => t.startTime >= startOfDay && t.startTime < new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000));
                filteredNotes = notes.filter(n => n.createdAt >= startOfDay);
                break;
        }
        const data = await kikoRequest('generate_briefing', { timeframe: tf, tasks: filteredTasks, notes: filteredNotes, healthData });
        setBriefing(data);
        setBriefingCache(prev => ({...prev, [tf]: data}));
        setIsLoading(false);
    }, [tasks, notes, healthData, briefingCache]);

    useEffect(() => {
        fetchBriefing(timeframe);
    }, [timeframe, fetchBriefing]);

    const handleRegenerate = () => fetchBriefing(timeframe, true);
    
    const MetricCard: React.FC<{metric: MissionBriefing['metrics'][0]}> = ({ metric }) => {
        const Icon = (Icons as any)[metric.icon] || SparklesIcon;
        return (
             <div className="bg-light-bg/50 dark:bg-dark-bg/50 p-3 rounded-xl">
                <div className="flex items-center gap-2 text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary"><Icon className="w-5 h-5"/> {metric.label}</div>
                <p className="text-3xl font-bold font-display mt-1">{metric.value}</p>
                {metric.change && (
                    <p className={`text-xs font-semibold ${metric.changeType === 'positive' ? 'text-green-400' : 'text-red-400'}`}>
                        {metric.change}
                    </p>
                )}
            </div>
        );
    };

    if (isLoading) return <LoadingSpinner message={loadingText} />;
    if (!briefing) return <p>Could not load Mission Briefing.</p>;

    const onPieEnter = (_: any, index: number) => setActiveFocus(briefing.focusBreakdown[index].name);
    
    return (
        <div className="space-y-4">
             <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-2xl font-bold font-display">{briefing.title}</h3>
                    <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm">{briefing.summary}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleRegenerate} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"><ArrowPathIcon className="w-5 h-5"/></button>
                    <div className="flex items-center gap-1 p-1 bg-light-bg dark:bg-dark-bg rounded-lg">
                        {(['day', 'week', 'month'] as Timeframe[]).map(tf => (
                            <button key={tf} onClick={() => setTimeframe(tf)} className={`px-3 py-1 text-sm font-semibold rounded-md capitalize ${timeframe === tf ? 'bg-accent text-white' : ''}`}>
                                {tf}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {briefing.metrics.map((metric, i) => <MetricCard key={i} metric={metric} />)}
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-1 bg-light-bg/50 dark:bg-dark-bg/50 p-4 rounded-xl flex flex-col items-center justify-center">
                    <ResponsiveContainer width="100%" height={200}>
                        <RadialBarChart innerRadius="40%" outerRadius="100%" data={briefing.healthRings} startAngle={90} endAngle={-270}>
                            <RadialBar background dataKey="value" cornerRadius={10} />
                            <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />
                        </RadialBarChart>
                    </ResponsiveContainer>
                </div>
                <div className="lg:col-span-2 bg-light-bg/50 dark:bg-dark-bg/50 p-4 rounded-xl">
                     <h4 className="font-semibold mb-2">Focus Breakdown</h4>
                     <div className="grid grid-cols-2 gap-4 h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={briefing.focusBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="80%" onMouseEnter={onPieEnter} onMouseLeave={() => setActiveFocus(null)}>
                                     {briefing.focusBreakdown.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} className="focus:outline-none" />)}
                                </Pie>
                                <Tooltip contentStyle={{backgroundColor: '#1C1C1E', border: '1px solid #2D2D2F', borderRadius: '0.75rem'}}/>
                            </PieChart>
                        </ResponsiveContainer>
                        <AnimatePresence mode="wait">
                            <motion.div key={activeFocus || 'default'} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="flex flex-col justify-center">
                                {activeFocus ? (
                                    <>
                                        <h5 className="font-bold text-lg">{activeFocus}</h5>
                                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary break-word">
                                            {briefing.categoryAnalysis.find(a => a.category === activeFocus)?.analysis || "No analysis available."}
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <h5 className="font-bold text-lg">Hover for Analysis</h5>
                                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Explore your main areas of focus for this period.</p>
                                    </>
                                )}
                            </motion.div>
                        </AnimatePresence>
                     </div>
                </div>
            </div>
             <div className="bg-light-bg/50 dark:bg-dark-bg/50 p-4 rounded-xl">
                <h4 className="font-semibold mb-2">Kiko's Mission Objective</h4>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary italic">{briefing.commentary}</p>
             </div>
        </div>
    );
};


const PraxisAI: React.FC<PraxisAIProps> = (props) => {
  const { insights, tasks, notes, healthData, goals, setGoals, applyInsight, chatMessages, onSendMessage, isAiReplying } = props;
  const [activeTab, setActiveTab] = useState<AITab>('mission_control');
  const [chatInput, setChatInput] = useState('');
  const [chatAttachment, setChatAttachment] = useState<ChatMessage['attachment'] & { url: string } | null>(null);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages, isChatExpanded]);

  const groupedInsights = useMemo(() => {
    return insights.reduce((acc, insight) => {
        (acc[insight.source] = acc[insight.source] || []).push(insight);
        return acc;
    }, {} as Record<string, Insight[]>);
  }, [insights]);
  
  const handleChatSubmit = (e: React.FormEvent) => { 
    e.preventDefault(); 
    onSendMessage(chatInput, chatAttachment ? { base64: chatAttachment.base64, mimeType: chatAttachment.mimeType } : undefined); 
    setChatInput(''); 
    setChatAttachment(null);
  };
  
  const handleContextualPromptClick = (prompt: string) => {
    onSendMessage(prompt);
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
      if(!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setChatAttachment({ base64: base64String, mimeType: file.type, url: URL.createObjectURL(file) });
        setIsChatExpanded(true); // Expand chat to show attachment
      };
      reader.readAsDataURL(file);
  };

  const renderContent = () => {
    switch(activeTab) {
        case 'mission_control': return <MissionControl tasks={tasks} notes={notes} healthData={healthData} />;
        case 'goals_strategy': return <GoalsAndStrategyTab {...props} />;
        case 'insights': return (
            Object.keys(groupedInsights).length > 0 ? (
                <div className="space-y-6">
                    {Object.entries(groupedInsights).map(([source, sourceInsights]) => (
                        <div key={source}>
                            <h4 className="font-semibold mb-2">{source}</h4>
                            <div className="space-y-3">
                                {sourceInsights.map(insight => (
                                <div key={insight.id} className={`p-3 rounded-lg flex items-center justify-between gap-4 ${insight.applied ? 'bg-black/5 dark:bg-black/20 opacity-60' : 'bg-accent/10 dark:bg-accent/20'}`}>
                                    <div><p className="text-sm font-medium">{insight.insightText}</p><p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">+ {insight.points}pts</p></div>
                                    <button onClick={() => applyInsight(insight.id)} disabled={insight.applied} className="flex items-center gap-2 text-sm font-semibold py-2 px-3 rounded-lg bg-black/10 dark:bg-black/30 text-green-400 hover:bg-green-500 hover:text-black disabled:bg-green-500/50 disabled:cursor-not-allowed transition-colors"><CheckCircleIcon className="w-5 h-5"/> {insight.applied ? 'Applied' : 'Apply'}</button>
                                </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 text-light-text-secondary dark:text-dark-text-secondary">
                    <LightBulbIcon className="w-16 h-16 mx-auto mb-4" />
                    <h3 className="text-xl font-bold font-display text-light-text dark:text-dark-text">No Insights... Yet</h3>
                    <p>Insights are generated from your notes. Start writing to uncover new ideas.</p>
                </div>
            )
        );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold font-display flex items-center gap-2"><KikoIcon className="w-8 h-8 text-accent" /> Kiko AI Hub</h2>
         <div className="flex items-center gap-2 p-1 card rounded-xl flex-wrap">
            <TabButton label="Mission Control" isActive={activeTab === 'mission_control'} onClick={() => setActiveTab('mission_control')} />
            <TabButton label="Goals & Strategy" isActive={activeTab === 'goals_strategy'} onClick={() => setActiveTab('goals_strategy')} />
            <TabButton label="Insights" isActive={activeTab === 'insights'} onClick={() => setActiveTab('insights')} />
        </div>
      </div>
     
      <div className="card rounded-2xl shadow-sm flex flex-col h-[78vh] overflow-hidden">
        <div className="p-4 sm:p-6 flex-grow overflow-y-auto">{renderContent()}</div>
        
        {/* CHAT INTERFACE */}
        <div className="flex-shrink-0 border-t border-light-border dark:border-dark-border">
          <AnimatePresence>
            {isChatExpanded && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-y-auto max-h-80 p-4 space-y-3 bg-light-bg/50 dark:bg-dark-bg/50"
              >
                {chatMessages.map((msg, index) => (
                  <div key={index} className={`flex items-start gap-3 text-sm ${msg.role === 'user' ? 'justify-end' : ''}`}>
                      {msg.role === 'model' && <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0"><KikoIcon className="w-4 h-4 text-white"/></div>}
                      <div className={`p-2 rounded-lg max-w-xs sm:max-w-md ${msg.role === 'model' ? 'bg-light-bg dark:bg-dark-bg' : 'bg-accent text-white'}`}>
                           {msg.attachment && <img src={`data:${msg.attachment.mimeType};base64,${msg.attachment.base64}`} alt="attachment" className="rounded-md max-w-full mb-2" />}
                           <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                      </div>
                      {msg.role === 'user' && <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center flex-shrink-0"><UserIcon className="w-4 h-4"/></div>}
                  </div>
                ))}
                {isAiReplying && (
                    <div className="flex items-start gap-3 text-sm">
                        <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0"><KikoIcon className="w-4 h-4 text-white animate-pulse"/></div>
                        <div className="p-2 rounded-lg bg-light-bg dark:bg-dark-bg">
                            <div className="flex gap-1 items-center">
                                <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
              </motion.div>
            )}
          </AnimatePresence>
          <div className="p-2">
            {!isChatExpanded && chatMessages.length === 0 && (
                 <div className="flex items-center gap-2 px-2 overflow-x-auto pb-1">
                    <p className="text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary flex-shrink-0">Try:</p>
                    {getChatContextualPrompts(activeTab).map(prompt => (
                        <button key={prompt} onClick={() => handleContextualPromptClick(prompt)} className="text-xs px-2 py-1 bg-light-bg dark:bg-dark-bg rounded-md hover:bg-accent/10 flex-shrink-0">{prompt}</button>
                    ))}
                 </div>
            )}
            <AnimatePresence>
            {chatAttachment && (
                 <motion.div initial={{opacity:0, height: 0}} animate={{opacity:1, height: 'auto'}} exit={{opacity:0, height: 0}} className="px-2 pt-2">
                    <div className="relative inline-block">
                        <img src={chatAttachment.url} alt="attachment preview" className="h-16 w-16 object-cover rounded-lg"/>
                        {isAiReplying && (
                            <div className="absolute inset-0 bg-accent/30 rounded-lg animate-pulse flex items-center justify-center">
                                <SparklesIcon className="w-6 h-6 text-white" />
                            </div>
                        )}
                        {!isAiReplying && (
                           <button onClick={() => setChatAttachment(null)} className="absolute -top-1 -right-1 bg-gray-700 text-white rounded-full p-0.5"><XMarkIcon className="w-3 h-3"/></button>
                        )}
                    </div>
                 </motion.div>
            )}
            </AnimatePresence>
            <form onSubmit={handleChatSubmit} className="flex items-center gap-2 p-2">
              <button type="button" onClick={() => setIsChatExpanded(prev => !prev)} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-light-text-secondary dark:text-dark-text-secondary">
                {isChatExpanded ? <ChevronDownIcon className="w-5 h-5"/> : <KikoIcon className="w-5 h-5"/>}
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileAttach} className="hidden" accept="image/*" />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-light-text-secondary dark:text-dark-text-secondary"><PaperClipIcon className="w-5 h-5"/></button>
              <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Ask Kiko anything..." className="flex-grow bg-light-bg dark:bg-dark-bg border-none focus:ring-0 rounded-lg py-2 px-3 text-sm"/>
              <button type="submit" disabled={isAiReplying || (!chatInput.trim() && !chatAttachment)} className="p-2 rounded-full bg-accent text-white disabled:bg-gray-400 dark:disabled:bg-gray-600"><PaperAirplaneIcon className="w-5 h-5"/></button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PraxisAI;
