import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Note, Notebook, Insight, ActionItem } from '../types';
import { generateNoteFromTemplate } from '../services/geminiService';
import { kikoRequest } from '../services/kikoAIService';
import { PlusCircleIcon, TrashIcon, ChatBubbleLeftEllipsisIcon, SparklesIcon, ChevronDownIcon, ArchiveBoxIcon, FlagIcon, XMarkIcon, DocumentPlusIcon, DocumentIcon, BriefcaseIcon, BoldIcon, ItalicIcon, UnderlineIcon, ListBulletIcon, ListOrderedIcon, PhotoIcon, DocumentTextIcon, ArrowsPointingOutIcon } from './Icons';

function debounce<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void {
    let timeoutId: number | undefined;
    return function(...args: Parameters<T>) {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => { func(...args); }, delay);
    };
}

const LightweightEditor: React.FC<{ content: string; onChange: (newContent: string) => void }> = ({ content, onChange }) => {
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const editor = editorRef.current;
        if (editor && editor.innerHTML !== content) {
            editor.innerHTML = content;
        }
    }, [content]);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        onChange(e.currentTarget.innerHTML);
    };
    
    return (
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="w-full h-full p-4 focus:outline-none overflow-y-auto prose prose-sm sm:prose-base dark:prose-invert max-w-none"
        aria-label="Note content"
      />
    );
};

const EditorToolbar: React.FC<{ onCommand: (cmd: string) => void; onAiCommand: (cmd: 'summarize' | 'expand' | 'findActionItems' | 'createTable' | 'generateProposal', fullNote: boolean) => void; onChat: () => void; }> = ({ onCommand, onAiCommand, onChat }) => {
    const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);
    const aiMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (aiMenuRef.current && !aiMenuRef.current.contains(event.target as Node)) setIsAiMenuOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const TButton: React.FC<{onClick: () => void; children: React.ReactNode; title: string, 'aria-label': string}> = ({onClick, children, title, ...props}) => (
      <button type="button" title={title} onMouseDown={(e) => { e.preventDefault(); onClick(); }} className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors hover:bg-light-bg dark:hover:bg-black/20 text-light-text-secondary dark:text-dark-text-secondary`} {...props}>{children}</button>
    );

    return (
        <div className="flex items-center gap-1 p-2 bg-light-card dark:bg-dark-card border-b border-light-border dark:border-dark-border flex-wrap">
            <TButton onClick={() => onCommand('bold')} title="Bold" aria-label="Bold"><BoldIcon className="w-5 h-5"/></TButton>
            <TButton onClick={() => onCommand('italic')} title="Italic" aria-label="Italic"><ItalicIcon className="w-5 h-5"/></TButton>
            <TButton onClick={() => onCommand('underline')} title="Underline" aria-label="Underline"><UnderlineIcon className="w-5 h-5"/></TButton>
            <div className="w-px h-6 bg-light-border dark:bg-dark-border mx-1"></div>
            <TButton onClick={() => onCommand('insertUnorderedList')} title="Bullet List" aria-label="Bullet list"><ListBulletIcon className="w-5 h-5"/></TButton>
            <TButton onClick={() => onCommand('insertOrderedList')} title="Numbered List" aria-label="Numbered list"><ListOrderedIcon className="w-5 h-5"/></TButton>
            <div className="w-px h-6 bg-light-border dark:bg-dark-border mx-1"></div>
            <div className="relative" ref={aiMenuRef}>
                 <button onClick={() => setIsAiMenuOpen(prev => !prev)} className="flex items-center gap-1.5 p-2 bg-accent text-white rounded-lg hover:bg-accent-hover text-sm" aria-haspopup="true" aria-expanded={isAiMenuOpen}>
                    <SparklesIcon className="w-5 h-5"/> Kiko AI <ChevronDownIcon className="w-4 h-4"/>
                </button>
                {isAiMenuOpen && (
                    <div className="absolute top-full right-0 mt-1 w-48 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg shadow-xl z-10 animate-fade-in-fast" role="menu">
                        <button onClick={onChat} className="w-full text-left px-3 py-1.5 text-sm hover:bg-light-card dark:hover:bg-dark-card" role="menuitem">Chat about selection</button>
                        <div className="h-px bg-light-border dark:bg-dark-border my-1"></div>
                        <button onClick={() => {onAiCommand('summarize', false); setIsAiMenuOpen(false);}} className="w-full text-left px-3 py-1.5 text-sm hover:bg-light-card dark:hover:bg-dark-card" role="menuitem">Summarize selection</button>
                        <button onClick={() => {onAiCommand('expand', false); setIsAiMenuOpen(false);}} className="w-full text-left px-3 py-1.5 text-sm hover:bg-light-card dark:hover:bg-dark-card" role="menuitem">Expand selection</button>
                        <button onClick={() => {onAiCommand('findActionItems', false); setIsAiMenuOpen(false);}} className="w-full text-left px-3 py-1.5 text-sm hover:bg-light-card dark:hover:bg-dark-card" role="menuitem">Find action items</button>
                        <div className="h-px bg-light-border dark:bg-dark-border my-1"></div>
                        <button onClick={() => {onAiCommand('generateProposal', true); setIsAiMenuOpen(false);}} className="w-full text-left px-3 py-1.5 text-sm hover:bg-light-card dark:hover:bg-dark-card" role="menuitem">Generate Proposal</button>
                    </div>
                )}
            </div>
        </div>
    )
};


const NewNoteModal: React.FC<{onClose: () => void; onCreate: (type: 'blank' | 'daily_planner' | 'case_study') => void}> = ({ onClose, onCreate }) => {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in-fast p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="new-note-title">
            <div className="card rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start">
                    <h2 id="new-note-title" className="text-xl font-bold font-display">Create New Note</h2>
                    <button onClick={onClose} aria-label="Close modal" className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10"><XMarkIcon className="w-6 h-6"/></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button onClick={() => onCreate('blank')} className="flex flex-col items-center justify-center text-center p-6 bg-light-bg dark:bg-dark-bg rounded-xl hover:ring-2 ring-accent transition-all border border-light-border dark:border-dark-border">
                        <DocumentIcon className="w-10 h-10 mb-2"/>
                        <p className="font-semibold">Blank Note</p>
                        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Start from scratch.</p>
                    </button>
                    <button onClick={() => onCreate('daily_planner')} className="flex flex-col items-center justify-center text-center p-6 bg-light-bg dark:bg-dark-bg rounded-xl hover:ring-2 ring-accent transition-all border border-light-border dark:border-dark-border">
                        <SparklesIcon className="w-10 h-10 mb-2 text-accent"/>
                        <p className="font-semibold">AI Daily Planner</p>
                        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Let AI structure your day.</p>
                    </button>
                    <button onClick={() => onCreate('case_study')} className="flex flex-col items-center justify-center text-center p-6 bg-light-bg dark:bg-dark-bg rounded-xl hover:ring-2 ring-accent transition-all border border-light-border dark:border-dark-border">
                        <BriefcaseIcon className="w-10 h-10 mb-2"/>
                        <p className="font-semibold">Business Case Study</p>
                        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">For clients and proposals.</p>
                    </button>
                     <div className="flex flex-col items-center justify-center text-center p-6 bg-light-bg dark:bg-dark-bg rounded-xl opacity-50 cursor-not-allowed border border-light-border dark:border-dark-border">
                         <PhotoIcon className="w-10 h-10 mb-2"/>
                         <p className="font-semibold">Visual Note</p>
                         <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">From image (soon).</p>
                     </div>
                </div>
            </div>
        </div>
    );
};

interface NotesProps {
    notes: Note[];
    setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
    notebooks: Notebook[];
    setNotebooks: React.Dispatch<React.SetStateAction<Notebook[]>>;
    addInsights: (newInsights: Insight[]) => void;
    updateNote: (note: Note) => void;
    addTask: (title: string, notebookId: number) => void;
    startChatWithContext: (context: string, type: 'note' | 'suggestion' | 'theme' | 'selection') => void;
}

const Notes: React.FC<NotesProps> = ({ notes, setNotes, notebooks, setNotebooks, addInsights, updateNote, addTask, startChatWithContext }) => {
    const [activeNotebookId, setActiveNotebookId] = useState<number | 'all' | 'flagged' | 'archived'>('all');
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [isNewNoteModalOpen, setIsNewNoteModalOpen] = useState(false);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const editorContainerRef = useRef<HTMLDivElement>(null);
    const [isFocusMode, setIsFocusMode] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const filteredNotes = useMemo(() => {
        let filtered = notes;
        if (activeNotebookId === 'all') {
            filtered = notes.filter(n => !n.archived);
        } else if (activeNotebookId === 'flagged') {
            filtered = notes.filter(n => n.flagged && !n.archived);
        } else if (activeNotebookId === 'archived') {
            filtered = notes.filter(n => n.archived);
        } else {
            filtered = notes.filter(n => n.notebookId === activeNotebookId && !n.archived);
        }
        return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }, [notes, activeNotebookId]);

    useEffect(() => {
        if (filteredNotes.length > 0) {
            if (!selectedNote || !filteredNotes.find(n => n.id === selectedNote.id)) {
                setSelectedNote(filteredNotes[0]);
            }
        } else {
            setSelectedNote(null);
        }
    }, [filteredNotes, selectedNote]);
    
    const handleCreateNote = async (type: 'blank' | 'daily_planner' | 'case_study') => {
        setIsNewNoteModalOpen(false);
        const defaultNotebookId = notebooks[0]?.id || 1;
        let newNote: Note;

        if (type === 'blank') {
            newNote = {
                id: Date.now(),
                notebookId: defaultNotebookId,
                title: 'Untitled Note',
                content: '<p>Start writing...</p>',
                createdAt: new Date(),
                archived: false, flagged: false, tags: [],
            };
        } else {
            setIsLoadingAI(true);
            const templateContent = await generateNoteFromTemplate(type);
            setIsLoadingAI(false);
            if (templateContent.error) {
                // handle error, maybe show toast
                console.error("Failed to generate note from template:", templateContent.error);
                return;
            }
            if (type === 'daily_planner') {
                const content = `<h2>Priorities</h2><ul>${templateContent.priorities.map((p:string) => `<li>${p}</li>`).join('')}</ul><h2>Schedule</h2><ul>${templateContent.schedule.map((s:{time:string, task:string}) => `<li><strong>${s.time}:</strong> ${s.task}</li>`).join('')}</ul><h2>Mindfulness Moment</h2><p>${templateContent.mindfulness_moment}</p><hr><h2>Notes</h2><p>${templateContent.notes}</p>`;
                newNote = {
                    id: Date.now(), notebookId: defaultNotebookId, title: `Daily Plan - ${new Date().toLocaleDateString()}`, content,
                    createdAt: new Date(), archived: false, flagged: false, tags: ['ai', 'planner'],
                };
            } else { // case_study
                 newNote = {
                    id: Date.now(), notebookId: defaultNotebookId, title: templateContent.title, content: templateContent.content,
                    createdAt: new Date(), archived: false, flagged: false, tags: ['casestudy', 'template'],
                };
            }
        }
        setNotes(prev => [newNote, ...prev]);
        setSelectedNote(newNote);
    };

    const handleDeleteNote = (noteId: number) => {
        setNotes(prev => prev.filter(note => note.id !== noteId));
        if (selectedNote?.id === noteId) {
            setSelectedNote(null);
        }
    };
    
    const debouncedUpdateNote = useCallback(debounce(updateNote, 500), [updateNote]);

    const handleNoteContentChange = (newContent: string) => {
        if (selectedNote) {
            const updated: Note = {...selectedNote, content: newContent};
            setSelectedNote(updated);
            debouncedUpdateNote(updated);
        }
    };

    const handleNoteTitleChange = (newTitle: string) => {
        if (selectedNote) {
            const updated: Note = {...selectedNote, title: newTitle};
            setSelectedNote(updated);
            debouncedUpdateNote(updated);
        }
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && selectedNote) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const updatedNote = { ...selectedNote, imageUrl: reader.result as string };
                setSelectedNote(updatedNote);
                updateNote(updatedNote);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAnalyzeImage = async () => {
        if (!selectedNote || !selectedNote.imageUrl) return;

        setIsLoadingAI(true);
        try {
            const [header, base64] = selectedNote.imageUrl.split(',');
            const mimeTypeMatch = header.match(/:(.*?);/);
            const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';

            if (!base64 || !mimeType) throw new Error("Invalid image URL format");

            const result = await kikoRequest('analyze_image', {
                base64,
                mimeType,
                prompt: "Analyze this image in detail. Describe the objects, setting, mood, and potential significance."
            });
            
            const analysisText = result.data;
            const newContent = `${selectedNote.content}<hr><h3>Image Analysis</h3><p>${analysisText}</p>`;
            handleNoteContentChange(newContent);

        } catch (error) {
            console.error("Image analysis failed", error);
            // TODO: show toast with error
        } finally {
            setIsLoadingAI(false);
        }
    };
    
    const handleGenerateTags = async () => {
        if (!selectedNote) return;
        setIsLoadingAI(true);
        try {
            const result = await kikoRequest('generate_note_tags', {
                title: selectedNote.title,
                content: selectedNote.content,
            });

            if (result.data && Array.isArray(result.data)) {
                // Merge with existing tags, removing duplicates
                const newTags = [...new Set([...selectedNote.tags, ...result.data])];
                const updatedNote = { ...selectedNote, tags: newTags };
                setSelectedNote(updatedNote);
                updateNote(updatedNote);
            }
        } catch (error) {
            console.error("Error generating tags:", error);
            // TODO: show a toast notification on error
        } finally {
            setIsLoadingAI(false);
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        if (selectedNote) {
            const newTags = selectedNote.tags.filter(tag => tag !== tagToRemove);
            const updatedNote = { ...selectedNote, tags: newTags };
            setSelectedNote(updatedNote);
            updateNote(updatedNote);
        }
    };

    const handleAICommand = async (command: 'summarize' | 'expand' | 'findActionItems' | 'createTable' | 'generateProposal', fullNote: boolean) => {
        if (!selectedNote) return;
        const selection = window.getSelection();
        const textToProcess = (fullNote || !selection || selection.toString().trim().length === 0) 
            ? selectedNote.content.replace(/<[^>]*>?/gm, '')
            : selection.toString();
        
        if (!textToProcess) return;

        setIsLoadingAI(true);
        const result = await kikoRequest('generate_note_text', {
            instruction: command,
            text: textToProcess,
            noteContent: command === 'generateProposal' ? selectedNote.content : undefined
        });
        setIsLoadingAI(false);

        if (command === 'findActionItems' && Array.isArray(result)) {
            result.forEach(item => addTask((item as ActionItem).title, selectedNote.notebookId));
            // Maybe show toast here
        } else if (typeof result === 'string') {
            const editor = editorContainerRef.current?.querySelector('[contenteditable]');
            if (editor) {
                if (selection && selection.rangeCount > 0 && selection.toString().trim().length > 0) {
                     const range = selection.getRangeAt(0);
                     range.deleteContents();
                     range.insertNode(document.createTextNode(result));
                } else {
                    const newContent = `${selectedNote.content}<hr><p><strong>${command.toUpperCase()}:</strong></p><p>${result}</p>`;
                    handleNoteContentChange(newContent);
                }
            }
        }
    };

    const handleEditorCommand = (command: string) => {
        document.execCommand(command, false);
    };

    const handleChatFromSelection = () => {
        const selection = window.getSelection()?.toString().trim();
        if (selection) {
            startChatWithContext(selection, 'selection');
        }
    };
    
    const NotebookItem: React.FC<{id: number | 'all' | 'flagged' | 'archived', icon: React.ReactNode, title: string, count?: number}> = ({id, icon, title, count}) => (
        <button onClick={() => setActiveNotebookId(id)} className={`flex items-center justify-between w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeNotebookId === id ? 'bg-accent/10 text-accent' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}>
            <span className="flex items-center gap-2 truncate">{icon}{title}</span>
            {count !== undefined && <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{count}</span>}
        </button>
    );

    const NoteListItem: React.FC<{note: Note}> = ({note}) => (
        <button onClick={() => setSelectedNote(note)} className={`block w-full text-left p-3 border-b border-light-border dark:border-dark-border ${selectedNote?.id === note.id ? 'bg-accent/10' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}>
            <h4 className="font-semibold truncate">{note.title}</h4>
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary truncate mt-1">{(note?.content || '').replace(/<[^>]*>?/gm, '')}</p>
        </button>
    );
    
    return (
        <div className="card rounded-2xl h-full flex overflow-hidden relative">
             {isNewNoteModalOpen && <NewNoteModal onClose={() => setIsNewNoteModalOpen(false)} onCreate={handleCreateNote} />}
             {isLoadingAI && <div className="absolute inset-0 bg-black/30 z-20 flex items-center justify-center text-white"><SparklesIcon className="w-6 h-6 animate-pulse"/></div>}
            
            <AnimatePresence>
            {!isFocusMode && (
                <motion.aside 
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: '25%', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="max-w-[250px] border-r border-light-border dark:border-dark-border flex-shrink-0 flex flex-col p-3 overflow-hidden"
                >
                    <h3 className="font-bold font-display px-2 mb-2">Notebooks</h3>
                    <div className="space-y-1">
                        <NotebookItem id="all" icon={<DocumentTextIcon className="w-5 h-5"/>} title="All Notes" count={notes.filter(n => !n.archived).length} />
                        <NotebookItem id="flagged" icon={<FlagIcon className="w-5 h-5"/>} title="Flagged" count={notes.filter(n => n.flagged && !n.archived).length} />
                    </div>
                    <div className="my-2 border-t border-light-border dark:border-dark-border"></div>
                    <div className="space-y-1 flex-grow overflow-y-auto">
                        {notebooks.map(nb => <NotebookItem key={nb.id} id={nb.id} icon={<div className="w-3 h-3 rounded-full" style={{backgroundColor: nb.color}}/>} title={nb.title} count={notes.filter(n => n.notebookId === nb.id && !n.archived).length}/>)}
                    </div>
                    <div className="mt-2 border-t border-light-border dark:border-dark-border"></div>
                    <div className="pt-2">
                        <NotebookItem id="archived" icon={<ArchiveBoxIcon className="w-5 h-5"/>} title="Archived" count={notes.filter(n => n.archived).length} />
                    </div>
                </motion.aside>
            )}
            </AnimatePresence>
            
            <AnimatePresence>
            {!isFocusMode && (
                 <motion.section 
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: '33.33%', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="max-w-[320px] border-r border-light-border dark:border-dark-border flex flex-col"
                >
                    <div className="p-3 border-b border-light-border dark:border-dark-border flex-shrink-0">
                        <button onClick={() => setIsNewNoteModalOpen(true)} className="w-full flex items-center justify-center gap-2 text-sm font-semibold p-2 rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors">
                            <DocumentPlusIcon className="w-5 h-5"/> New Note
                        </button>
                    </div>
                    <div className="overflow-y-auto flex-grow">
                        {filteredNotes.map(note => <NoteListItem key={note.id} note={note}/>)}
                    </div>
                </motion.section>
            )}
            </AnimatePresence>
            
             <section ref={editorContainerRef} className="flex-1 flex flex-col bg-light-bg dark:bg-dark-bg">
                 {selectedNote ? (
                    <>
                        <div className="p-3 border-b border-light-border dark:border-dark-border flex-shrink-0">
                             <div className="flex items-center">
                                <input type="text" value={selectedNote.title} onChange={e => handleNoteTitleChange(e.target.value)} className="font-bold text-xl bg-transparent w-full focus:outline-none"/>
                                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                                <button onClick={handleGenerateTags} disabled={isLoadingAI} className="p-2 rounded-full hover:bg-accent/20 disabled:opacity-50" title="Generate Tags with AI">
                                    <SparklesIcon className="w-5 h-5 text-light-text-secondary"/>
                                </button>
                                <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-full hover:bg-accent/20" title="Attach Image"><PhotoIcon className="w-5 h-5 text-light-text-secondary"/></button>
                                <button onClick={() => setIsFocusMode(!isFocusMode)} className="p-2 rounded-full hover:bg-accent/20" title="Toggle Focus Mode"><ArrowsPointingOutIcon className="w-5 h-5 text-light-text-secondary"/></button>
                                <button onClick={() => handleDeleteNote(selectedNote.id)} className="p-2 rounded-full hover:bg-red-500/10 text-light-text-secondary"><TrashIcon className="w-5 h-5"/></button>
                             </div>
                             {selectedNote.tags.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2 pt-2">
                                    {selectedNote.tags.map(tag => (
                                        <div key={tag} className="flex items-center gap-1 bg-accent/10 text-accent text-xs font-semibold px-2 py-1 rounded-full animate-fade-in-fast">
                                            <span>{tag}</span>
                                            <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-500 rounded-full">
                                                <XMarkIcon className="w-3 h-3"/>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                             )}
                        </div>
                        {selectedNote.imageUrl && (
                            <div className="p-4 border-b border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg/50">
                                <div className="relative group max-w-xs mx-auto">
                                    <img src={selectedNote.imageUrl} alt="Note attachment" className="rounded-lg shadow-md w-full object-contain" />
                                    <button 
                                        onClick={() => {
                                            if (selectedNote) {
                                                const updated = {...selectedNote, imageUrl: undefined};
                                                setSelectedNote(updated);
                                                updateNote(updated);
                                            }
                                        }}
                                        className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                                        aria-label="Remove image"
                                    >
                                        <XMarkIcon className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="text-center mt-3">
                                    <button onClick={handleAnalyzeImage} disabled={isLoadingAI} className="flex items-center gap-2 text-sm font-semibold py-2 px-4 rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors mx-auto disabled:bg-gray-500">
                                        <SparklesIcon className="w-5 h-5"/> Analyze with Kiko
                                    </button>
                                </div>
                            </div>
                        )}
                        <EditorToolbar onCommand={handleEditorCommand} onAiCommand={handleAICommand} onChat={handleChatFromSelection} />
                        <div className="relative flex-grow overflow-hidden">
                           <LightweightEditor key={selectedNote.id} content={selectedNote.content} onChange={handleNoteContentChange} />
                        </div>
                    </>
                 ) : (
                    <div className="flex-grow flex items-center justify-center text-light-text-secondary dark:text-dark-text-secondary">
                        <p>Select a note to view or create a new one.</p>
                    </div>
                 )}
            </section>
        </div>
    );
};
export default Notes;