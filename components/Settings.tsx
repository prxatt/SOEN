import React from 'react';
import { motion } from 'framer-motion';
import { Cog6ToothIcon, GoogleCalendarIcon, ChevronRightIcon, SparklesIcon, DocumentTextIcon, UserCircleIcon, ChatBubbleLeftEllipsisIcon } from './Icons';

interface SettingsProps {
    uiMode: 'dark' | 'glass';
    toggleUiMode: () => void;
    onSyncCalendar: () => void;
    onLogout: () => void;
}

interface SettingsRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick?: () => void;
  action?: React.ReactNode;
}

function SettingsRow({ icon, title, subtitle, onClick, action }: SettingsRowProps) {
  const Component = onClick ? 'button' : 'div';
  return (
    <Component onClick={onClick} disabled={!onClick} className="w-full flex items-center justify-between text-left p-4 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5 disabled:cursor-default disabled:hover:bg-transparent">
        <div className="flex items-center gap-4">
            <div className="p-2 bg-bg rounded-lg">
                {icon}
            </div>
            <div>
                <h4 className="font-semibold">{title}</h4>
                <p className="text-sm text-text-secondary">{subtitle}</p>
            </div>
        </div>
        <div>
            {action || (onClick && <ChevronRightIcon className="w-5 h-5 text-text-secondary"/>)}
        </div>
    </Component>
  );
}

function Settings({ uiMode, toggleUiMode, onSyncCalendar, onLogout }: SettingsProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-full overflow-y-auto pb-4">
      <div className="mb-8">
        <h2 className="text-3xl font-bold font-display flex items-center gap-2"><Cog6ToothIcon className="w-8 h-8"/> Settings</h2>
        <p className="text-text-secondary">Manage your Praxis experience.</p>
      </div>

      <div className="space-y-8">
        <div>
            <h3 className="font-bold px-4 mb-2 text-text-secondary tracking-wide">INTEGRATIONS</h3>
            <div className="card rounded-2xl p-2">
                <SettingsRow 
                    icon={<GoogleCalendarIcon className="w-6 h-6 text-[#4285F4]" />}
                    title="Google Calendar"
                    subtitle="Sync your events with Praxis"
                    onClick={onSyncCalendar}
                />
                <SettingsRow 
                    icon={<svg className="w-6 h-6 text-text-secondary" viewBox="0 0 24 24" fill="currentColor"><path d="M13.41 12l5.3-5.29a1 1 0 1 0-1.42-1.42L12 10.59l-5.29-5.3a1 1 0 0 0-1.42 1.42l5.3 5.29-5.3 5.29a1 1 0 0 0 0 1.42 1 1 0 0 0 1.42 0l5.29-5.3 5.29 5.3a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42z" /></svg>}
                    title="Outlook Calendar"
                    subtitle="Coming soon"
                />
                 <SettingsRow 
                    icon={<svg className="w-6 h-6 text-text-secondary" viewBox="0 0 24 24" fill="currentColor"><path d="M17.8 3.2A9.5 9.5 0 0012 2a9.5 9.5 0 00-5.8 1.2 9.4 9.4 0 00-3.6 3.6A9.5 9.5 0 002 12a9.5 9.5 0 001.2 5.8 9.4 9.4 0 003.6 3.6 9.5 9.5 0 005.8 1.2 9.5 9.5 0 005.8-1.2 9.4 9.4 0 003.6-3.6 9.5 9.5 0 001.2-5.8 9.5 9.5 0 00-1.2-5.8 9.4 9.4 0 00-3.6-3.6zM12 20a8 8 0 110-16 8 8 0 010 16zm-1-10v5h2v-5h1V8h-4v2h1z" /></svg>}
                    title="Apple Calendar"
                    subtitle="Coming soon"
                />
            </div>
        </div>
        
         <div>
            <h3 className="font-bold px-4 mb-2 text-text-secondary tracking-wide">PREFERENCES</h3>
            <div className="card rounded-2xl p-2">
                 <SettingsRow 
                    icon={<div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${uiMode === 'dark' ? 'bg-indigo-600' : 'bg-sky-400'}`}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg></div>}
                    title="UI Mode"
                    subtitle={uiMode === 'dark' ? "Obsidian" : "Glass"}
                    action={
                        <button
                            onClick={toggleUiMode} role="switch" aria-checked={uiMode === 'dark'}
                            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${uiMode === 'dark' ? 'bg-accent' : 'bg-gray-300 dark:bg-gray-700'}`}
                        ><span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${uiMode === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} /></button>
                    }
                />
                 <SettingsRow 
                    icon={<SparklesIcon className="w-6 h-6 text-purple-400" />}
                    title="Notifications"
                    subtitle="Proactive suggestions, daily briefing"
                />
            </div>
        </div>

        <div>
            <h3 className="font-bold px-4 mb-2 text-text-secondary tracking-wide">ACCOUNT & LEGAL</h3>
            <div className="card rounded-2xl p-2">
                <SettingsRow icon={<UserCircleIcon className="w-6 h-6 text-text-secondary"/>} title="Account" subtitle="Manage your account details" />
                <SettingsRow icon={<DocumentTextIcon className="w-6 h-6 text-text-secondary" />} title="Terms of Service" subtitle="Effective September 2025" />
                <SettingsRow icon={<DocumentTextIcon className="w-6 h-6 text-text-secondary" />} title="Privacy Policy" subtitle="Your data, your rights" />
                <SettingsRow icon={<ChatBubbleLeftEllipsisIcon className="w-6 h-6 text-text-secondary" />} title="Help & Support" subtitle="Get help or provide feedback" />
                 <div className="p-4 mt-2">
                    <button onClick={onLogout} className="w-full text-center p-3 rounded-xl bg-bg font-semibold text-red-500 hover:bg-red-500/10 transition-colors">
                        Logout
                    </button>
                 </div>
            </div>
        </div>

      </div>
    </motion.div>
  );
};

export default Settings;
