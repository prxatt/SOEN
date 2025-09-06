import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, TaskPrep } from '../types';
import { getActualDuration } from '../utils/taskUtils';
import { generateTaskPrimer } from '../services/geminiService';
import { PauseIcon, PlayIcon, CheckCircleIcon, XMarkIcon, LightBulbIcon, ClipboardDocumentListIcon, ChatBubbleLeftRightIcon, LinkIcon, CheckIcon } from './Icons';
import LoadingSpinner from './LoadingSpinner';

interface FocusModeProps {
    task: Task;
    onComplete: (taskId: number, actualDurationMinutes: number) => void;
    onClose: () => void;
    activeFocusBackground: string;
}

const FocusMode: React.FC<FocusModeProps> = ({ task, onComplete, onClose, activeFocusBackground }) => {
    const durationSeconds = getActualDuration(task) * 60;
    const [remainingSeconds, setRemainingSeconds] = useState(durationSeconds);
    const [isPaused, setIsPaused] = useState(false);
    const [prep, setPrep] = useState<TaskPrep | null>(null);
    const [isLoadingPrep, setIsLoadingPrep] = useState(true);
    const [completedActionItems, setCompletedActionItems] = useState<boolean[]>([]);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        const fetchPrimer = async () => {
            setIsLoadingPrep(true);
            const primerData = await generateTaskPrimer(task);
            setPrep(primerData);
            if (primerData?.action_plan) {
                setCompletedActionItems(new Array(primerData.action_plan.length).fill(false));
            }
            setIsLoadingPrep(false);
        };
        fetchPrimer();
    }, [task]);

    const startTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = window.setInterval(() => {
            setRemainingSeconds(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    handleComplete();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    useEffect(() => {
        if (!isPaused) {
            startTimer();
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isPaused]);

    const handleComplete = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        const elapsedSeconds = durationSeconds - remainingSeconds;
        const elapsedMinutes = Math.max(1, Math.ceil(elapsedSeconds / 60)); // Complete with at least 1 minute
        onComplete(task.id, elapsedMinutes);
    };
    
    const toggleActionItem = (index: number) => {
        setCompletedActionItems(prev => {
            const newCompleted = [...prev];
            newCompleted[index] = !newCompleted[index];
            return newCompleted;
        });
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const progress = (remainingSeconds / durationSeconds) * 100;

    return (
        <div 
            className="fixed inset-0 bg-light-bg/90 dark:bg-dark-bg/90 backdrop-blur-xl z-50 flex flex-col p-4 animate-fade-in-fast text-white"
            data-focus-theme={activeFocusBackground}
        >
            <div className="w-full flex justify-end flex-shrink-0">
                <button onClick={onClose} className="p-2 text-white/70 hover:text-white rounded-full">
                    <XMarkIcon className="w-8 h-8"/>
                </button>
            </div>
            
            <div className="text-center w-full max-w-4xl mx-auto flex-grow flex flex-col items-center justify-center">
                <p className="text-lg text-white/80">Focusing on</p>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-display my-4 break-word" style={{textShadow: '0 2px 10px rgba(0,0,0,0.3)'}}>{task.title}</h1>
                
                <div className="relative my-8 w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
                    <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="54" stroke="currentColor" strokeWidth="6" className="text-white/20" fill="transparent"/>
                        <motion.circle
                            cx="60"
                            cy="60"
                            r="54"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="transparent"
                            strokeLinecap="round"
                            className="text-accent"
                            strokeDasharray="339.292"
                            initial={{ strokeDashoffset: 339.292 }}
                            animate={{ strokeDashoffset: 339.292 - (progress / 100) * 339.292 }}
                            transition={{ duration: 1, ease: "linear" }}
                        />
                    </svg>
                    <span className="text-6xl sm:text-7xl font-mono font-bold tracking-tighter" style={{textShadow: '0 2px 10px rgba(0,0,0,0.3)'}}>{formatTime(remainingSeconds)}</span>
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={() => setIsPaused(p => !p)} className="p-4 rounded-full bg-white/10 border border-white/20 shadow-md backdrop-blur-sm">
                        {isPaused ? <PlayIcon className="w-8 h-8 text-green-400" /> : <PauseIcon className="w-8 h-8 text-amber-400" />}
                    </button>
                     <button onClick={handleComplete} className="py-4 px-8 rounded-full bg-accent text-white font-bold text-lg shadow-lg shadow-accent/30 flex items-center gap-2">
                        <CheckCircleIcon className="w-8 h-8"/>
                        Mark as Complete
                    </button>
                </div>
            </div>

            <div className="w-full max-w-5xl mx-auto px-4 pb-4 flex-shrink-0">
                {isLoadingPrep ? <p className="text-center text-sm text-white/70 animate-pulse">Preparing AI insights...</p> : prep && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-left text-sm"
                    >
                        <div className="p-3 bg-black/20 backdrop-blur-sm rounded-lg border border-white/10">
                           <h4 className="font-semibold text-xs flex items-center gap-2 mb-1 text-purple-300"><ClipboardDocumentListIcon className="w-4 h-4"/> Action Plan</h4>
                           <ul className="space-y-1 text-xs text-white/80">
                                {prep.action_plan.slice(0, 3).map((step, index) => (
                                    <li key={index} className="flex items-start gap-2 py-0.5">
                                        <button 
                                            onClick={() => toggleActionItem(index)}
                                            aria-label={`Mark step ${index + 1} as ${completedActionItems[index] ? 'incomplete' : 'complete'}`}
                                            className={`w-4 h-4 mt-0.5 rounded-sm border-2 flex-shrink-0 flex items-center justify-center transition-all ${completedActionItems[index] ? 'bg-purple-400 border-purple-400' : 'border-white/50'}`}
                                        >
                                            {completedActionItems[index] && <CheckIcon className="w-3 h-3 text-black/70" />}
                                        </button>
                                        <span className={`${completedActionItems[index] ? 'line-through opacity-60' : ''}`}>{step}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="p-3 bg-black/20 backdrop-blur-sm rounded-lg border border-white/10">
                           <h4 className="font-semibold text-xs flex items-center gap-2 mb-1 text-green-300"><ChatBubbleLeftRightIcon className="w-4 h-4"/> Inquiry Prompts</h4>
                           <ul className="space-y-1 list-disc list-inside text-xs text-white/80">{prep.inquiry_prompts.slice(0, 3).map((s,i) => <li key={i}>{s}</li>)}</ul>
                        </div>
                        <div className="p-3 bg-black/20 backdrop-blur-sm rounded-lg border border-white/10">
                           <h4 className="font-semibold text-xs flex items-center gap-2 mb-1 text-yellow-300"><LightBulbIcon className="w-4 h-4"/> Key Takeaways</h4>
                           <ul className="space-y-1 list-disc list-inside text-xs text-white/80">{prep.key_takeaways.slice(0, 2).map((s,i) => <li key={i}>{s}</li>)}</ul>
                        </div>
                        <div className="p-3 bg-black/20 backdrop-blur-sm rounded-lg border border-white/10">
                           <h4 className="font-semibold text-xs flex items-center gap-2 mb-1 text-blue-300"><LinkIcon className="w-4 h-4"/> Related Links</h4>
                           <ul className="space-y-1 text-xs text-white/80">{prep.related_links.slice(0, 2).map((l,i) => <li key={i}><a href={l.url} target="_blank" rel="noopener noreferrer" className="hover:underline truncate block">{l.title}</a></li>)}</ul>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default FocusMode;