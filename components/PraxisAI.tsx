import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Insight, StrategicBriefing, Task, Note, SearchResult, SearchHistoryItem, VisionHistoryItem, Notebook, Goal, GoalTerm, MindMapNode, MindMapEdge, ChatMessage, Project, ProjectStatusReport } from '../types';
import { generateDailyBriefing, performInternetSearch, analyzeImageWithPrompt, generateMindMapData, generateProjectStatusReport } from '../services/geminiService';
import { LightBulbIcon, BookOpenIcon, LinkIcon, FlagIcon, PlusCircleIcon, CheckCircleIcon, SparklesIcon, ShareIcon, UserIcon, PaperAirplaneIcon, PaperClipIcon, HeartIcon, BrainCircuitIcon, RocketIcon, MagnifyingGlassIcon, KikoIcon, ChevronDownIcon, ChevronRightIcon, BriefcaseIcon } from './Icons';
import LoadingSpinner from './LoadingSpinner';

interface PraxisAIProps {
  insights: Insight[]; setInsights: React.Dispatch<React.SetStateAction<Insight[]>>;
  tasks: Task[]; notes: Note[]; notebooks: Notebook[]; projects: Project[];
  goals: Goal[]; setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  addTask: (title: string) => void;
  addNote: (title: string, content: string, notebookId: number) => void;
  startChatWithContext: (context: string, type: 'note' | 'suggestion' | 'theme') => void;
  searchHistory: SearchHistoryItem[]; setSearchHistory: React.Dispatch<React.SetStateAction<SearchHistoryItem[]>>;
  visionHistory: VisionHistoryItem[]; setVisionHistory: React.Dispatch<React.SetStateAction<VisionHistoryItem[]>>;
  applyInsight: (insightId: number) => void;
  chatMessages: ChatMessage[]; setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  onSendMessage: (message: string) => void;
  isAiReplying: boolean;
}

type AITab = 'briefing' | 'goals' | 'mindmap' | 'insights' | 'explore';

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

const MindMap: React.FC<{ goals: Goal[], tasks: Task[], notes: Note[] }> = ({ goals, tasks, notes }) => {
    const [mapData, setMapData] = useState<{ nodes: MindMapNode[], edges: MindMapEdge[] } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    const handleGenerate = async () => {
        setIsLoading(true);
        const data = await generateMindMapData(goals, tasks, notes);
        setMapData(data);
        setIsLoading(false);
    }

    if (!mapData && !isLoading) {
        return <div className="text-center"><button onClick={handleGenerate} className="bg-accent text-white font-bold py-3 px-5 rounded-lg hover:bg-accent-hover">Generate Mind Map</button></div>
    }
    if (isLoading) return <div className="text-center animate-pulse">Generating connections...</div>;
    
    if (mapData) {
        return (
            <div className="relative w-full h-[60vh] rounded-lg bg-light-bg dark:bg-dark-bg overflow-hidden border border-light-border dark:border-dark-border">
                <svg className="absolute top-0 left-0 w-full h-full" style={{ overflow: 'visible' }}>
                    <defs><marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" className="fill-light-text-secondary/50 dark:fill-dark-text-secondary/50" /></marker></defs>
                    {mapData.edges.map((edge, i) => {
                        const fromNode = mapData.nodes.find(n => n.id === edge.from);
                        const toNode = mapData.nodes.find(n => n.id === edge.to);
                        if (!fromNode || !toNode) return null;
                        return <line key={i} x1={fromNode.x} y1={fromNode.y} x2={toNode.x} y2={toNode.y} stroke="#9ca3af" strokeWidth="1" markerEnd="url(#arrowhead)" />;
                    })}
                </svg>
                {mapData.nodes.map(node => (
                    <div key={node.id} className={`absolute p-2 rounded-lg shadow-lg flex items-center gap-2 text-xs font-semibold text-white`} style={{ left: node.x - 50, top: node.y - 20, width: 100, height: 40, backgroundColor: { root: '#A855F7', goal: '#f59e0b', task: '#3b82f6', note: '#22c55e' }[node.type] }}>
                        {node.type === 'goal' && <FlagIcon className="w-4 h-4" />}
                        {node.type === 'task' && <CheckCircleIcon className="w-4 h-4" />}
                        {node.type === 'note' && <BookOpenIcon className="w-4 h-4" />}
                        {node.type === 'root' && <SparklesIcon className="w-4 h-4" />}
                        <span className="truncate">{node.label}</span>
                    </div>
                ))}
            </div>
        )
    }
    return null;
}

const ExploreTab: React.FC<{searchHistory: SearchHistoryItem[], setSearchHistory: React.Dispatch<React.SetStateAction<SearchHistoryItem[]>>, visionHistory: VisionHistoryItem[], setVisionHistory: React.Dispatch<React.SetStateAction<VisionHistoryItem[]>>}> = (props) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [visionImage, setVisionImage] = useState<{b64: string, mime: string, url: string} | null>(null);
    const [visionPrompt, setVisionPrompt] = useState('');
    const [visionResult, setVisionResult] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSearch = async (query: string) => {
        if (!query.trim() || isSearching) return;
        setIsSearching(true); setSearchResult(null);
        const result = await performInternetSearch(query);
        setSearchResult(result); setIsSearching(false);
        props.setSearchHistory(prev => [{ id: Date.now(), query: query, result }, ...prev]);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if(!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          setVisionImage({ b64: base64String, mime: file.type, url: URL.createObjectURL(file) });
        };
        reader.readAsDataURL(file);
    }
  
    const handleAnalyzeImage = async (prompt: string) => {
      if (!visionImage || !prompt.trim() || isAnalyzing) return;
      setIsAnalyzing(true); setVisionResult(null);
      const result = await analyzeImageWithPrompt(visionImage.b64, visionImage.mime, prompt);
      setVisionResult(result); setIsAnalyzing(false);
      props.setVisionHistory(prev => [{ id: Date.now(), prompt: prompt, imageUrl: visionImage.url, result}, ...prev]);
    }

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(visionImage) {
            handleAnalyzeImage(visionPrompt);
        } else {
            handleSearch(searchQuery);
        }
    }

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="flex-grow p-4 border-2 border-dashed border-light-border dark:border-dark-border rounded-xl flex items-center justify-center text-center bg-light-bg dark:bg-dark-bg relative">
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden"/>
                {(isSearching || isAnalyzing) && <LoadingSpinner />}
                {!isSearching && !isAnalyzing && (
                    <>
                    {searchResult && <div className="text-left space-y-4 overflow-y-auto"><p>{searchResult.text}</p><div><h5 className="font-semibold">Sources:</h5><ul className="list-disc list-inside space-y-1">{searchResult.sources.map((s,i) => <li key={i}><a href={s.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{s.title}</a></li>)}</ul></div></div>}
                    {visionResult && <div className="text-left space-y-4 overflow-y-auto"><p>{visionResult}</p></div>}
                    {!searchResult && !visionResult && (
                        visionImage ? <img src={visionImage.url} alt="upload preview" className="max-h-60 object-contain rounded-lg" /> :
                        <div className="text-light-text-secondary dark:text-dark-text-secondary">
                            <MagnifyingGlassIcon className="w-12 h-12 mx-auto mb-2"/>
                            <p>Search the web or upload an image to analyze.</p>
                        </div>
                    )}
                    </>
                )}
                 {visionImage && <button onClick={() => setVisionImage(null)} className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full">&times;</button>}
            </div>
             <form onSubmit={handleFormSubmit} className="flex gap-2">
                <div className="relative flex-grow">
                   <input type="text" value={visionImage ? visionPrompt : searchQuery} onChange={e => visionImage ? setVisionPrompt(e.target.value) : setSearchQuery(e.target.value)} placeholder={visionImage ? "What do you want to know about this image?" : "Search the web with Google..."} className="w-full bg-light-bg dark:bg-dark-bg p-3 pl-10 pr-12 rounded-lg border border-light-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-accent"/>
                   <div className="absolute left-3 top-1/2 -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary">
                       {visionImage ? <SparklesIcon className="w-5 h-5"/> : <MagnifyingGlassIcon className="w-5 h-5"/>}
                   </div>
                </div>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 rounded-lg bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border hover:bg-light-border dark:hover:bg-dark-border transition-colors"><PaperClipIcon className="w-5 h-5"/></button>
                <button type="submit" disabled={isSearching || isAnalyzing} className="p-3 rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors disabled:opacity-50">
                    {visionImage ? 'Analyze' : 'Search'}
                </button>
            </form>
        </div>
    )
}

const PraxisAI: React.FC<PraxisAIProps> = (props) => {
  const { insights, tasks, notes, notebooks, projects, goals, setGoals, searchHistory, setSearchHistory, visionHistory, setVisionHistory, applyInsight, chatMessages, onSendMessage, isAiReplying } = props;
  const [activeTab, setActiveTab] = useState<AITab>('briefing');
  const [briefing, setBriefing] = useState<StrategicBriefing | null>(null);
  const [isBriefingLoading, setIsBriefingLoading] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages, isChatExpanded]);

  const groupedInsights = useMemo(() => {
    return insights.reduce((acc, insight) => {
        (acc[insight.source] = acc[insight.source] || []).push(insight);
        return acc;
    }, {} as Record<string, Insight[]>);
  }, [insights]);
  
  useEffect(() => {
    if (activeTab === 'briefing' && !briefing) { 
        setIsBriefingLoading(true); 
        generateDailyBriefing(tasks, notes, goals).then(b => {
            setBriefing(b);
            setIsBriefingLoading(false); 
        }).catch(() => setIsBriefingLoading(false));
    }
  }, [activeTab, tasks, notes, goals, briefing]);

  const handleChatSubmit = (e: React.FormEvent) => { e.preventDefault(); onSendMessage(chatInput); setChatInput(''); };
  
  const BriefingModule: React.FC<{icon: React.ReactNode, title: string, children: React.ReactNode}> = ({icon, title, children}) => (
      <div className="bg-light-bg dark:bg-dark-bg p-4 rounded-xl h-full border border-light-border dark:border-dark-border">
          <h4 className="font-semibold font-display flex items-center gap-2 mb-3">{icon}{title}</h4>
          <div className="space-y-3">{children}</div>
      </div>
  );
  
  const renderContent = () => {
    switch(activeTab) {
        case 'briefing': return isBriefingLoading ? <LoadingSpinner /> : briefing ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BriefingModule icon={<RocketIcon className="w-5 h-5 text-accent"/>} title="Goal Progress"><p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{briefing.goal_progress.commentary}</p>{briefing.goal_progress.goals.map((g, i) => (<div key={i}><p className="font-semibold text-sm">{g.text}</p><div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-2.5 mt-1"><div className="bg-accent h-2.5 rounded-full" style={{width: `${g.progress_percentage}%`}}></div></div></div>))}</BriefingModule>
                <BriefingModule icon={<HeartIcon className="w-5 h-5 text-red-500"/>} title="Health & Performance"><p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{briefing.health_and_performance.commentary}</p><div className="flex gap-4">{briefing.health_and_performance.metrics.map((m, i) => (<div key={i}><p className="text-sm font-semibold">{m.metric}</p><p className="text-xl font-bold font-display">{m.value}</p></div>))}</div></BriefingModule>
                <BriefingModule icon={<BrainCircuitIcon className="w-5 h-5 text-blue-400"/>} title="Learning Synthesis"><p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{briefing.learning_synthesis.commentary}</p>{briefing.learning_synthesis.connections.map((c, i) => (<div key={i} className="p-2 bg-black/5 dark:bg-black/30 rounded-lg text-sm">💡 <strong>New Idea:</strong> {c.novel_idea}</div>))}</BriefingModule>
                <BriefingModule icon={<SparklesIcon className="w-5 h-5 text-yellow-400"/>} title="Creative Sparks">{briefing.creative_sparks.map((s, i) => (<div key={i}><p className="font-semibold text-sm">{s.idea}</p><p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{s.rationale}</p></div>))}</BriefingModule>
                <div className="lg:col-span-2"><BriefingModule icon={<LinkIcon className="w-5 h-5 text-green-500"/>} title="Resource Radar"><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{briefing.resource_radar.map((r, i) => (<a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="block p-3 bg-black/5 dark:bg-black/30 rounded-lg hover:bg-black/10 dark:hover:bg-white/10"><p className="font-semibold text-sm truncate">{r.title}</p><p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">{r.relevance_summary}</p></a>))}</div></BriefingModule></div>
            </div>) : <p>Could not load briefing.</p>;
        case 'goals': return <GoalsHub goals={goals} setGoals={setGoals} />;
        case 'mindmap': return <MindMap goals={goals} tasks={tasks} notes={notes} />;
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
        case 'explore': return <ExploreTab searchHistory={searchHistory} setSearchHistory={setSearchHistory} visionHistory={visionHistory} setVisionHistory={setVisionHistory} />;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold font-display flex items-center gap-2"><KikoIcon className="w-8 h-8 text-accent" /> Kiko AI Hub</h2>
         <div className="flex items-center gap-2 p-1 card rounded-xl flex-wrap">
            <TabButton label="Briefing" isActive={activeTab === 'briefing'} onClick={() => setActiveTab('briefing')} />
            <TabButton label="Goals" isActive={activeTab === 'goals'} onClick={() => setActiveTab('goals')} />
            <TabButton label="Mind Map" isActive={activeTab === 'mindmap'} onClick={() => setActiveTab('mindmap')} />
            <TabButton label="Insights" isActive={activeTab === 'insights'} onClick={() => setActiveTab('insights')} />
            <TabButton label="Explore" isActive={activeTab === 'explore'} onClick={() => setActiveTab('explore')} />
        </div>
      </div>
     
      <div className="card rounded-2xl shadow-sm flex flex-col h-[70vh] overflow-hidden">
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
                          <p className="whitespace-pre-wrap break-word" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />') }} />
                      </div>
                  </div>
                ))}
                {isAiReplying && <div className="flex items-start gap-3 text-sm"><div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0"><KikoIcon className="w-4 h-4 text-white animate-pulse"/></div><div className="p-2 rounded-lg bg-light-bg dark:bg-dark-bg"><p className="animate-pulse">Thinking...</p></div></div>}
                <div ref={chatEndRef} />
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="p-3">
             <button onClick={() => setIsChatExpanded(!isChatExpanded)} className="w-full text-xs text-light-text-secondary dark:text-dark-text-secondary flex items-center justify-center gap-1 mb-2">
                <span>{isChatExpanded ? 'Collapse' : 'Expand'} Chat</span>
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${isChatExpanded ? 'rotate-180' : ''}`} />
             </button>
            <form onSubmit={handleChatSubmit}>
                <div className="relative">
                   <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Ask Kiko, or type '/save'..." className="w-full bg-light-bg dark:bg-dark-bg p-3 pl-4 pr-12 rounded-lg border border-light-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-accent"/>
                    <button type="submit" disabled={isAiReplying || !chatInput.trim()} aria-label="Send message" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors disabled:opacity-50"><PaperAirplaneIcon className="w-5 h-5"/></button>
                </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PraxisAI;