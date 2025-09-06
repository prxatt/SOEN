

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, RadialBarChart, RadialBar, Legend, Cell, PieChart, Pie } from 'recharts';
import { Insight, StrategicBriefing, Task, Note, SearchResult, SearchHistoryItem, VisionHistoryItem, Notebook, Goal, GoalTerm, MindMapNode, MindMapEdge, ChatMessage, Project, ProjectStatusReport, MissionBriefing, HealthRingMetric, HealthData } from '../types';
import { performInternetSearch, generateProjectStatusReport, getChatContextualPrompts } from '../services/geminiService';
import { kikoRequest } from '../services/kikoAIService';
import { LightBulbIcon, BookOpenIcon, LinkIcon, FlagIcon, PlusCircleIcon, CheckCircleIcon, SparklesIcon, UserIcon, PaperAirplaneIcon, PaperClipIcon, HeartIcon, BrainCircuitIcon, RocketIcon, MagnifyingGlassIcon, KikoIcon, ChevronDownIcon, ChevronRightIcon, BriefcaseIcon, ArrowPathIcon, XMarkIcon } from './Icons';
import * as Icons from './Icons';
import LoadingSpinner from './LoadingSpinner';

interface PraxisAIProps {
  insights: Insight[]; setInsights: React.Dispatch<React.SetStateAction<Insight[]>>;
  tasks: Task[]; notes: Note[]; notebooks: Notebook[]; projects: Project[];
  healthData: HealthData;
  addTask: (title: string) => void;
  addNote: (title: string, content: string, notebookId: number) => void;
  startChatWithContext: (context: string) => void;
  searchHistory: SearchHistoryItem[]; setSearchHistory: React.Dispatch<React.SetStateAction<SearchHistoryItem[]>>;
  visionHistory: VisionHistoryItem[]; setVisionHistory: React.Dispatch<React.SetStateAction<VisionHistoryItem[]>>;
  applyInsight: (insightId: number) => void;
  chatMessages: ChatMessage[]; setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  onSendMessage: (message: string, attachment?: ChatMessage['attachment']) => void;
  isAiReplying: boolean;
  showToast: (message: string) => void;
}

const ChatInterface: React.FC<PraxisAIProps> = (props) => {
    const { onSendMessage, chatMessages, isAiReplying } = props;
    const [chatInput, setChatInput] = useState('');
    const [chatAttachment, setChatAttachment] = useState<ChatMessage['attachment'] & { url: string } | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

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
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            setChatAttachment({ base64: base64String, mimeType: file.type, url: URL.createObjectURL(file) });
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex-grow overflow-y-auto p-4 space-y-3">
                {chatMessages.length === 0 && (
                     <div className="text-center py-16 text-text-secondary">
                        <KikoIcon className="w-16 h-16 mx-auto mb-4 text-accent/50" />
                        <h3 className="text-xl font-bold font-display text-text">Kiko AI</h3>
                        <p>Your strategic partner is ready. Ask anything.</p>
                        <div className="flex items-center justify-center gap-2 px-2 overflow-x-auto mt-4 flex-wrap max-w-md mx-auto">
                            {getChatContextualPrompts('Chat').map(prompt => (
                                <button key={prompt} onClick={() => handleContextualPromptClick(prompt)} className="text-xs px-3 py-1.5 bg-bg rounded-lg hover:bg-accent/10 border border-border flex-shrink-0">{prompt}</button>
                            ))}
                        </div>
                    </div>
                )}
                {chatMessages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 text-sm ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'model' && <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0"><KikoIcon className="w-4 h-4 text-white" /></div>}
                        <div className={`p-2 rounded-lg max-w-xs sm:max-w-md ${msg.role === 'model' ? 'bg-bg' : 'bg-accent text-white'}`}>
                            {msg.attachment && <img src={`data:${msg.attachment.mimeType};base64,${msg.attachment.base64}`} alt="attachment" className="rounded-md max-w-full mb-2" />}
                            <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                        </div>
                        {msg.role === 'user' && <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center flex-shrink-0"><UserIcon className="w-4 h-4" /></div>}
                    </div>
                ))}
                {isAiReplying && (
                    <div className="flex items-start gap-3 text-sm">
                        <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0"><KikoIcon className="w-4 h-4 text-white animate-pulse" /></div>
                        <div className="p-2 rounded-lg bg-bg">
                            <div className="flex gap-1 items-center">
                                <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>
            <div className="flex-shrink-0 p-2 border-t border-border">
                 <AnimatePresence>
                    {chatAttachment && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="px-2 pt-2">
                            <div className="relative inline-block">
                                <img src={chatAttachment.url} alt="attachment preview" className="h-16 w-16 object-cover rounded-lg" />
                                <button onClick={() => setChatAttachment(null)} className="absolute -top-1 -right-1 bg-gray-700 text-white rounded-full p-0.5"><XMarkIcon className="w-3 h-3" /></button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <form onSubmit={handleChatSubmit} className="flex items-center gap-2 p-2">
                    <input type="file" ref={fileInputRef} onChange={handleFileAttach} className="hidden" accept="image/*" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-text-secondary"><PaperClipIcon className="w-5 h-5" /></button>
                    <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Ask Kiko anything..." className="flex-grow bg-bg border-none focus:ring-0 rounded-lg py-2 px-3 text-sm" />
                    <button type="submit" disabled={isAiReplying || (!chatInput.trim() && !chatAttachment)} className="p-2 rounded-full bg-accent text-white disabled:bg-gray-400 dark:disabled:bg-gray-600"><PaperAirplaneIcon className="w-5 h-5" /></button>
                </form>
            </div>
        </div>
    );
};


const PraxisAI: React.FC<PraxisAIProps> = (props) => {
  return (
    <div className="flex flex-col h-[calc(100vh-9.5rem)]">
      <div className="flex justify-between items-center flex-shrink-0 mb-4">
        <h2 className="text-2xl font-bold font-display flex items-center gap-2"><KikoIcon className="w-8 h-8 text-accent" /> Kiko Hub (キコ)</h2>
      </div>
     
      <div className="card rounded-2xl shadow-sm flex flex-col flex-grow min-h-0 overflow-hidden">
        <ChatInterface {...props} />
      </div>
    </div>
  );
};

export default PraxisAI;