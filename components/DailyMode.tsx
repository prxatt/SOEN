import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task } from '../types';
import { XMarkIcon, CheckCircleIcon, ArrowRightIcon } from './Icons';

interface DailyModeProps {
  tasks: Task[];
  onClose: () => void;
  onStartFocus: (task: Task) => void;
}

type DailyStep = 'plan' | 'focus' | 'reflect';

function DailyMode({ tasks, onClose, onStartFocus }: DailyModeProps) {
  const [step, setStep] = useState<DailyStep>('plan');

  const today = new Date().toDateString();
  const todayTasks = useMemo(() => tasks
    .filter(t => new Date(t.startTime).toDateString() === today)
    .sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()), [tasks, today]);

  const nextTask = todayTasks.find(t => t.status !== 'Completed');
  const completedCount = todayTasks.filter(t => t.status === 'Completed').length;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-xl text-white">
      <div className="w-full flex justify-between items-center p-4">
        <h2 className="text-xl font-bold font-display">Daily Mode</h2>
        <button onClick={onClose} className="p-2 text-white/80 hover:text-white" aria-label="Close Daily Mode">
          <XMarkIcon className="w-7 h-7" />
        </button>
      </div>

      <div className="flex-1 w-full max-w-3xl mx-auto px-4 pb-8">
        <div className="flex items-center justify-center gap-2 text-sm mb-4">
          <span className={`px-3 py-1 rounded-full ${step === 'plan' ? 'bg-white/15' : 'bg-white/5'}`}>Plan</span>
          <span className={`px-3 py-1 rounded-full ${step === 'focus' ? 'bg-white/15' : 'bg-white/5'}`}>Focus</span>
          <span className={`px-3 py-1 rounded-full ${step === 'reflect' ? 'bg-white/15' : 'bg-white/5'}`}>Reflect</span>
        </div>

        <AnimatePresence mode="wait">
          {step === 'plan' && (
            <motion.div key="plan" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="card rounded-3xl p-4">
              <h3 className="text-lg font-bold mb-2">Today's plan</h3>
              {todayTasks.length === 0 ? (
                <p className="text-text-secondary">No tasks scheduled today.</p>
              ) : (
                <ul className="divide-y divide-white/10">
                  {todayTasks.map(t => (
                    <li key={t.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{t.title}</p>
                        <p className="text-xs text-white/70">{new Date(t.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} • {t.category}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-white/10">{(t.priority || 'medium').toUpperCase()}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setStep('focus')}
                  className="px-4 py-2 rounded-full bg-accent hover:bg-accent-hover transition-colors flex items-center gap-2"
                >
                  Continue <ArrowRightIcon className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'focus' && (
            <motion.div key="focus" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="card rounded-3xl p-4">
              <h3 className="text-lg font-bold mb-2">Focus</h3>
              {nextTask ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-lg">{nextTask.title}</p>
                    <p className="text-xs text-white/70">Starts {new Date(nextTask.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} • {nextTask.plannedDuration} min</p>
                  </div>
                  <button
                    onClick={() => onStartFocus(nextTask)}
                    className="px-4 py-2 rounded-full bg-accent hover:bg-accent-hover transition-colors flex items-center gap-2"
                  >
                    Start Focus <CheckCircleIcon className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <p className="text-text-secondary">No upcoming tasks. You're clear to plan more or reflect.</p>
              )}
              <div className="mt-4 flex justify-end">
                <button onClick={() => setStep('reflect')} className="px-4 py-2 text-sm text-white/80 hover:text-white">Skip</button>
              </div>
            </motion.div>
          )}

          {step === 'reflect' && (
            <motion.div key="reflect" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="card rounded-3xl p-4">
              <h3 className="text-lg font-bold mb-2">Reflect</h3>
              <p className="text-sm mb-3">Completed today: <span className="font-semibold">{completedCount}</span> / {todayTasks.length}</p>
              <p className="text-sm text-white/80">Great work. Close Daily Mode to return to your dashboard.</p>
              <div className="mt-4 flex justify-end">
                <button onClick={onClose} className="px-4 py-2 rounded-full bg-accent hover:bg-accent-hover transition-colors">Close</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default DailyMode;

