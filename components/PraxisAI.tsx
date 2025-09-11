import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Screen, Note, ChatMessage, ChatSession, Notebook } from '../types';
import { getChatContextualPrompts } from '../services/geminiService';
import { UserIcon, PaperAirplaneIcon, PaperClipIcon, XMarkIcon, EllipsisVerticalIcon, TrashIcon, PencilIcon, DocumentPlusIcon, Bars3Icon, DocumentTextIcon, ArrowUpOnSquareIcon, BabyPenguinIcon, ArrowPathIcon, ChatBubbleOvalLeftEllipsisIcon } from './Icons';

interface PraxisAIProps {
  chatHistory: ChatSession[];
  activeChatId: number | null;
  setActiveChatId: React.Dispatch<React.SetStateAction<number | null>>;
  onNewChat: () => void;
  onDeleteChat: (id: number) => void;
  onRenameChat: (id: number, newTitle: string) => void;
  onSendMessage: (message: string, attachment?: ChatMessage['attachment']) => void;
  isAiReplying: boolean;
  
  notes: Note[];
  updateNote: (note: Note) => void;
  addNote: (title: string, content: string, notebookId: number) => Note;

  showToast: (message: string) => void;
  previousScreen: Screen;
  goals: any;
  praxisFlow: number;
  lastDeletedChat: ChatSession | null;
  onRestoreChat: (id: number) => void;
}


// New component for editable chat titles.
const EditableTitle = ({ value, onSave }: { value: string, onSave: (newValue: string) => void }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);

    const handleSave = () => {
        if (text.trim()) {
            onSave(text.trim());
        } else {
            setText(value); // Reset if empty
        }
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <input
                ref={inputRef}
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onBlur={handleSave}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                className="w-full bg-transparent border-b border-accent focus:outline-none text-2xl font-bold font-display"
            />
        );
    }
    return (
        <h3 onClick={() => setIsEditing(true)} className="text-2xl font-bold font-display truncate cursor-pointer">
            {value}
        </h3>
    );
};

// New component for chat history sidebar.
function ChatHistorySidebar({
    chatHistory,
    activeChatId,
    setActiveChatId,
    onNewChat,
    onRenameChat,
    onDeleteChat,
    isAiReplying,
    lastDeletedChat,
    onRestoreChat,
}: {
    chatHistory: ChatSession[];
    activeChatId: number | null;
    setActiveChatId: (id: number) => void;
    onNewChat: () => void;
    onRenameChat: (id: number, newTitle: string) => void;
    onDeleteChat: (id: number) => void;
    isAiReplying: boolean;
    lastDeletedChat: ChatSession | null;
    onRestoreChat: (id: number) => void;
}) {
    return (
        <div className="w-72 flex-shrink-0 bg-card/50 dark:bg-zinc-900/50 border-r border-border/50 flex flex-col h-full">
            <div className="p-3 border-b border-border/50">
                <button onClick={onNewChat} className="w-full flex items-center justify-center gap-2 text-sm font-semibold p-2 rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors">
                    <DocumentPlusIcon className="w-5 h-5"/> New Chat
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
                <div className="space-y-1">
                    {chatHistory.map(chat => (
                        <div key={chat.id} className="relative group">
                             <button 
                                onClick={() => setActiveChatId(chat.id)}
                                className={`w-full text-left p-2.5 rounded-lg text-sm transition-all duration-200 flex items-center gap-3 ${activeChatId === chat.id ? 'bg-accent/20 text-text font-bold' : 'text-text-secondary hover:text-text hover:bg-accent/10'}`}
                            >
                                <div className="w-4 h-4 flex-shrink-0">
                                    {activeChatId === chat.id && isAiReplying ? (
                                        <ArrowPathIcon className="w-4 h-4 animate-spin"/>
                                    ) : (
                                        <ChatBubbleOvalLeftEllipsisIcon className="w-4 h-4" />
                                    )}
                                </div>
                                <div className="flex-1 truncate">
                                    <p className="font-semibold truncate">{chat.title}</p>
                                    <p className={`text-xs truncate ${activeChatId === chat.id ? 'text-text/70' : 'text-text-secondary/80'}`}>
                                        {chat.messages.length > 0 ? (
                                            <>
                                                <span className="font-medium">{chat.messages[chat.messages.length - 1].role === 'user' ? 'You: ' : 'Kiko: '}</span>
                                                {chat.messages[chat.messages.length - 1].text}
                                            </>
                                        ) : 'No messages yet'}
                                    </p>
                                </div>
                            </button>
                             <div className="absolute top-1/2 -translate-y-1/2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Menu target={<button className="p-1 rounded-md hover:bg-card"><EllipsisVerticalIcon className="w-4 h-4 text-text-secondary"/></button>}>
                                    <MenuItem label="Rename" icon={<PencilIcon className="w-4 h-4"/>} onClick={() => {
                                        const newTitle = prompt("Enter new chat title:", chat.title);
                                        if (newTitle) onRenameChat(chat.id, newTitle);
                                    }}/>
                                    <MenuItem label="Delete" icon={<TrashIcon className="w-4 h-4"/>} onClick={() => onDeleteChat(chat.id)} className="text-red-500"/>
                                </Menu>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {/* Trash Bin Section */}
            <AnimatePresence>
            {lastDeletedChat && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="p-3 border-t border-border/50 flex-shrink-0"
                >
                    <div className="flex items-center gap-3 text-sm">
                        <TrashIcon className="w-5 h-5 text-text-secondary flex-shrink-0"/>
                        <div className="flex-1 truncate">
                            <p className="text-text-secondary">Deleted: "{lastDeletedChat.title}"</p>
                        </div>
                        <button onClick={() => onRestoreChat(lastDeletedChat.id)} className="font-semibold text-accent hover:underline">
                            Undo
                        </button>
                    </div>
                </motion.div>
            )}
            </AnimatePresence>
        </div>
    );
}

// New modal for selecting a note.
const SelectNoteModal = ({ notes, onSelect, onClose }: { notes: Note[], onSelect: (noteId: number) => void, onClose: () => void }) => (
    <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    >
        <motion.div
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card p-4 rounded-2xl w-full max-w-md border border-border h-full max-h-96 flex flex-col"
        >
            <h3 className="font-bold text-lg mb-3 px-2">Add to Existing Note</h3>
            <div className="flex-1 overflow-y-auto space-y-1">
                {notes.filter(n => !n.deletedAt).map(note => (
                    <button
                        key={note.id}
                        onClick={() => onSelect(note.id)}
                        className="w-full text-left p-2 rounded-lg hover:bg-accent/10"
                    >
                        {note.title}
                    </button>
                ))}
            </div>
        </motion.div>
    </motion.div>
);


function ChatInterface(props: {
    activeChat: ChatSession;
    onSendMessage: (message: string, attachment?: ChatMessage['attachment']) => void;
    isAiReplying: boolean;
    previousScreen: Screen;
    onRename: (newTitle: string) => void;
    notes: Note[];
    onAddToNote: (noteId: number, chatContent: string) => void;
    onNewNoteFromChat: (title: string, chatContent: string) => void;
    showToast: (message: string) => void;
}) {
    const { activeChat, onSendMessage, isAiReplying, previousScreen, onRename, notes, onAddToNote, onNewNoteFromChat, showToast } = props;
    const [chatInput, setChatInput] = useState('');
    const [chatAttachment, setChatAttachment] = useState<ChatMessage['attachment'] & { url: string } | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [activeChat.messages, isAiReplying]);

    const handleChatSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() && !chatAttachment) return;
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
    
    const formatChatForNote = () => {
        return activeChat.messages.map(m =>
            `<p><strong>${m.role === 'user' ? 'You' : 'Kiko'}:</strong> ${m.text}</p>`
        ).join('');
    };
    
    const handleCreateNewNote = () => {
        onNewNoteFromChat(activeChat.title, formatChatForNote());
    };
    
    const handleAddToNote = (noteId: number) => {
        onAddToNote(noteId, formatChatForNote());
        setIsNoteModalOpen(false);
    };

    return (
        <div className="h-full flex flex-col flex-1 min-w-0">
            <div className="flex items-center justify-between p-4 border-b border-border/50 flex-shrink-0">
                 <EditableTitle value={activeChat.title} onSave={onRename} />
                <Menu target={<button className="p-2 rounded-lg hover:bg-card"><EllipsisVerticalIcon className="w-5 h-5"/></button>}>
                    <MenuItem icon={<DocumentPlusIcon className="w-4 h-4"/>} label="Create New Note from Chat" onClick={handleCreateNewNote} />
                    <MenuItem icon={<ArrowUpOnSquareIcon className="w-4 h-4"/>} label="Add to Existing Note..." onClick={() => setIsNoteModalOpen(true)} />
                </Menu>
            </div>
            <div className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-6">
                {activeChat.messages.length === 0 && (
                     <div className="text-center py-8 text-text-secondary animate-fade-in flex flex-col items-center justify-center h-full">
                        <BabyPenguinIcon className="w-24 h-24 mx-auto mb-4 text-accent/20" />
                        <h3 className="text-2xl font-bold font-display text-text">Kiko is ready.</h3>
                        <p className="text-base mt-2">Your strategic partner is listening.</p>
                        <div className="flex flex-wrap items-center justify-center gap-3 mt-10 max-w-2xl mx-auto">
                            {getChatContextualPrompts(previousScreen || 'Dashboard').map((prompt) => (
                                <button 
                                    key={prompt} 
                                    onClick={() => handleContextualPromptClick(prompt)} 
                                    className="text-sm px-4 py-2 bg-card/50 dark:bg-zinc-900/40 backdrop-blur-lg border border-white/10 hover:border-white/20 hover:bg-card/70 rounded-xl flex-shrink-0 transition-all duration-300 font-semibold shadow-lg"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {activeChat.messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 text-sm group ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'model' && <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0"><BabyPenguinIcon className="w-6 h-6 text-white" /></div>}
                        <div className={`p-4 rounded-3xl max-w-2xl relative shadow-md ${msg.role === 'model' ? 'bg-card' : 'bg-accent text-white'}`}>
                            {msg.attachment && <img src={`data:${msg.attachment.mimeType};base64,${msg.attachment.base64}`} alt="attachment" className="rounded-lg max-w-full mb-3" />}
                            <p className="whitespace-pre-wrap break-word">{msg.text}</p>
                             <button 
                                 onClick={() => { navigator.clipboard.writeText(msg.text); showToast("Copied to clipboard!")}} 
                                 className="absolute top-2 right-2 p-1.5 bg-black/20 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                 aria-label="Copy message"
                             >
                                <DocumentTextIcon className="w-4 h-4" />
                            </button>
                        </div>
                        {msg.role === 'user' && <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0"><UserIcon className="w-6 h-6" /></div>}
                    </div>
                ))}
                {isAiReplying && (
                    <div className="flex items-start gap-3 text-sm">
                        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0"><BabyPenguinIcon className="w-6 h-6 text-white animate-pulse" /></div>
                        <div className="p-4 rounded-2xl bg-card">
                            <div className="flex gap-1.5 items-center">
                                <span className="h-2 w-2 bg-text-secondary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="h-2 w-2 bg-text-secondary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="h-2 w-2 bg-text-secondary rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>
            <div className="flex-shrink-0 p-2 border-t border-border/50">
                 <AnimatePresence>
                    {chatAttachment && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="px-2 pt-2">
                            <div className="relative inline-block">
                                <img src={chatAttachment.url} alt="attachment preview" className="h-16 w-16 object-cover rounded-lg" />
                                <button onClick={() => setChatAttachment(null)} className="absolute -top-1 -right-1 bg-zinc-800 text-white rounded-full p-0.5"><XMarkIcon className="w-3 h-3" /></button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <form onSubmit={handleChatSubmit} className="flex items-center gap-2 p-2">
                    <input type="file" ref={fileInputRef} onChange={handleFileAttach} className="hidden" accept="image/*" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3.5 hover:bg-card rounded-full text-text-secondary"><PaperClipIcon className="w-6 h-6" /></button>
                    <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Ask Kiko anything..." className="flex-grow bg-card border-none focus:ring-0 rounded-full py-3 px-5 text-base" />
                    <button type="submit" disabled={isAiReplying || (!chatInput.trim() && !chatAttachment)} className="p-3.5 rounded-full bg-accent text-white disabled:bg-zinc-300 dark:disabled:bg-zinc-600 transition-colors"><PaperAirplaneIcon className="w-6 h-6" /></button>
                </form>
            </div>
            <AnimatePresence>
                {isNoteModalOpen && <SelectNoteModal notes={notes} onClose={() => setIsNoteModalOpen(false)} onSelect={handleAddToNote} />}
            </AnimatePresence>
        </div>
    );
};


function PraxisAI(props: PraxisAIProps) {
  const { chatHistory, activeChatId, setActiveChatId, onNewChat, onDeleteChat, onRenameChat, showToast, notes, addNote, updateNote, lastDeletedChat, onRestoreChat } = props;
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  
  const handleNewNoteFromChat = (title: string, content: string) => {
      // Find the first notebook to add the note to, or handle case where no notebooks exist.
      const defaultNotebookId = 1;
      addNote(title, content, defaultNotebookId);
      showToast(`Note "${title}" created from chat.`);
  };
  
  const handleAddToNote = (noteId: number, chatContent: string) => {
      const note = notes.find(n => n.id === noteId);
      if (note) {
          const updatedContent = `${note.content}<hr><h3>Chat Log - ${new Date().toLocaleString()}</h3>${chatContent}`;
          updateNote({ ...note, content: updatedContent });
          showToast(`Chat added to note "${note.title}".`);
      }
  };

  const activeChat = useMemo(() => chatHistory.find(c => c.id === activeChatId), [chatHistory, activeChatId]);

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)]">
      <div className="flex justify-between items-center flex-shrink-0 mb-4 px-2">
        <h2 className="text-3xl font-bold font-display flex items-center gap-3">
             <button onClick={() => setIsHistoryVisible(!isHistoryVisible)} className="p-2 md:hidden mr-2 rounded-lg bg-card hover:bg-border">
                <Bars3Icon className="w-6 h-6"/>
            </button>
            <BabyPenguinIcon className="w-8 h-8 text-accent" /> Kiko AI
        </h2>
      </div>

      <div className="card rounded-3xl shadow-sm flex-grow min-h-0 overflow-hidden flex">
        <div className="hidden md:flex">
             <ChatHistorySidebar 
                chatHistory={chatHistory} 
                activeChatId={activeChatId} 
                setActiveChatId={setActiveChatId}
                onNewChat={onNewChat}
                onRenameChat={onRenameChat}
                onDeleteChat={onDeleteChat}
                isAiReplying={props.isAiReplying}
                lastDeletedChat={lastDeletedChat}
                onRestoreChat={onRestoreChat}
            />
        </div>
        {activeChat ? (
             <ChatInterface 
                {...props} 
                activeChat={activeChat}
                onRename={(newTitle) => onRenameChat(activeChat.id, newTitle)}
                onAddToNote={handleAddToNote}
                onNewNoteFromChat={handleNewNoteFromChat}
             />
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-text-secondary">
                <BabyPenguinIcon className="w-16 h-16 mb-4"/>
                <p className="font-semibold">No active chat.</p>
                <p>Select a conversation or start a new one.</p>
            </div>
        )}
      </div>

      <AnimatePresence>
        {isHistoryVisible && (
            <motion.div
                initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed top-0 left-0 bottom-0 w-72 bg-bg z-50 md:hidden shadow-lg border-r border-border"
            >
                <button onClick={() => setIsHistoryVisible(false)} className="absolute top-2 right-2 p-2 rounded-full"><XMarkIcon className="w-6 h-6"/></button>
                 <ChatHistorySidebar 
                    chatHistory={chatHistory} 
                    activeChatId={activeChatId} 
                    setActiveChatId={(id) => { setActiveChatId(id); setIsHistoryVisible(false); }}
                    onNewChat={() => { onNewChat(); setIsHistoryVisible(false); }}
                    onRenameChat={onRenameChat}
                    onDeleteChat={onDeleteChat}
                    isAiReplying={props.isAiReplying}
                    lastDeletedChat={lastDeletedChat}
                    onRestoreChat={onRestoreChat}
                />
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- SHARED SUB-COMPONENTS ---

const Menu = ({ target, children }: { target: React.ReactNode; children: React.ReactNode; }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuRef]);

    return (
        <div className="relative" ref={menuRef}>
            {React.cloneElement(target as React.ReactElement<any>, { onClick: () => setIsOpen(p => !p) })}
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{opacity:0,y:-10}} 
                        animate={{opacity:1,y:0}} 
                        exit={{opacity:0,y:-10}} 
                        className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-lg shadow-xl z-[100] p-1"
                    >
                        {React.Children.map(children, child =>
                             React.isValidElement<{ onClick?: () => void }>(child) && child.props.onClick ? React.cloneElement(child as React.ReactElement<any>, { onClick: () => { child.props.onClick!(); setIsOpen(false); } }) : child
                         )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const MenuItem = ({ icon, label, onClick, className }: { icon?: React.ReactNode; label: string; onClick: () => void; className?: string }) => (
    <button onClick={onClick} className={`w-full text-left flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors hover:bg-black/5 dark:hover:bg-white/10 ${className}`}>
        {icon}
        <span>{label}</span>
    </button>
);

export default PraxisAI;