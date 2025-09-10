import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Note, Notebook } from '../types';
import { kikoRequest } from '../services/kikoAIService';
import { PRESET_COLORS } from '../constants';
import { 
    PlusIcon, 
    TrashIcon, 
    SparklesIcon, 
    ArchiveBoxIcon, 
    FlagIcon, 
    XMarkIcon, 
    DocumentPlusIcon, 
    DocumentIcon, 
    PhotoIcon, 
    DocumentTextIcon, 
    ChevronLeftIcon,
    ChevronRightIcon,
    EllipsisVerticalIcon,
    StarIcon,
    MagnifyingGlassIcon,
    BookOpenIcon,
    PencilIcon,
    LightBulbIcon,
    ArrowsPointingOutIcon,
    ArrowsPointingInIcon,
} from './Icons';

// --- UTILITY FUNCTIONS ---

function debounce<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void {
    let timeoutId: number | undefined;
    return function(...args: Parameters<T>) {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => { func(...args); }, delay);
    };
}

const getTextColorForBackground = (hexColor: string): 'black' | 'white' => {
    if (!hexColor || !hexColor.startsWith('#')) return 'black';
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6 ? 'black' : 'white';
};

// --- EDITOR COMPONENT ---

function LightweightEditor({ content, onChange, textColor }: {
  content: string;
  onChange: (newContent: string) => void;
  textColor: string;
}) {
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
        className="w-full h-full p-6 focus:outline-none overflow-y-auto prose prose-lg prose-headings:font-display prose-headings:tracking-tight dark:prose-invert max-w-none"
        style={{ color: textColor, '--tw-prose-body': textColor, '--tw-prose-headings': textColor, '--tw-prose-bold': textColor, '--tw-prose-links': textColor, '--tw-prose-bullets': textColor } as React.CSSProperties}
        aria-label="Note content"
      />
    );
}

// --- PROPS INTERFACE ---

interface NotesProps {
    notes: Note[];
    notebooks: Notebook[];
    setNotebooks: React.Dispatch<React.SetStateAction<Notebook[]>>;
    updateNote: (note: Note) => void;
    addNote: (title: string, content: string, notebookId: number) => Note;
    deleteNote: (noteId: number) => void;
    startChatWithContext: (context: string) => void;
    showToast: (message: string, action?: { label: string; onClick: () => void; }) => void;
    selectedNote: Note | null;
    setSelectedNote: (note: Note | null) => void;
    activeNotebookId: number | 'all' | 'flagged' | 'archived';
    setActiveNotebookId: (id: number | 'all' | 'flagged' | 'archived') => void;
}

// --- MAIN COMPONENT ---

function Notes({ 
    notes, notebooks, setNotebooks, 
    updateNote, addNote, deleteNote, showToast,
    selectedNote, setSelectedNote, 
    activeNotebookId, setActiveNotebookId 
}: NotesProps) {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortMethod, setSortMethod] = useState<'updatedAt-newest' | 'updatedAt-oldest' | 'createdAt-newest' | 'createdAt-oldest' | 'title-az' | 'title-za'>('updatedAt-newest');
    const [isNotebookModalOpen, setIsNotebookModalOpen] = useState(false);
    const [editingNotebook, setEditingNotebook] = useState<Notebook | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isParsingTitle, setIsParsingTitle] = useState(false);
    const [notebookToDelete, setNotebookToDelete] = useState<Notebook | null>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [summary, setSummary] = useState<string | null>(null);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [isTagging, setIsTagging] = useState(false);


    // --- NOTEBOOK & NOTE FILTERING/SORTING ---

    const filteredAndSortedNotes = useMemo(() => {
        let filtered = notes;
        
        if (activeNotebookId === 'all') filtered = notes.filter(n => !n.archived);
        else if (activeNotebookId === 'flagged') filtered = notes.filter(n => n.flagged && !n.archived);
        else if (activeNotebookId === 'archived') filtered = notes.filter(n => n.archived);
        else filtered = notes.filter(n => n.notebookId === activeNotebookId && !n.archived);
        
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(note => 
                note.title.toLowerCase().includes(query) ||
                (note.content && note.content.replace(/<[^>]*>?/gm, '').toLowerCase().includes(query)) ||
                note.tags.some(tag => tag.toLowerCase().includes(query))
            );
        }
        
        return filtered.sort((a, b) => {
            switch (sortMethod) {
                case 'updatedAt-oldest':
                    return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
                case 'createdAt-newest':
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case 'createdAt-oldest':
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case 'title-az':
                    return a.title.localeCompare(b.title);
                case 'title-za':
                    return b.title.localeCompare(a.title);
                case 'updatedAt-newest':
                default:
                    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            }
        });
    }, [notes, activeNotebookId, searchQuery, sortMethod]);

    useEffect(() => {
        if (filteredAndSortedNotes.length > 0 && (!selectedNote || !filteredAndSortedNotes.find(n => n.id === selectedNote.id))) {
            setSelectedNote(filteredAndSortedNotes[0]);
        } else if (filteredAndSortedNotes.length === 0) {
            setSelectedNote(null);
        }
    }, [filteredAndSortedNotes, selectedNote, setSelectedNote]);

    // --- NOTEBOOK CRUD ---

    const handleSaveNotebook = (title: string, color: string) => {
        if (!title.trim()) {
            showToast("Notebook title cannot be empty.");
            return;
        }
        if (editingNotebook) { // Editing existing notebook
            setNotebooks(prev => prev.map(nb => nb.id === editingNotebook.id ? { ...nb, title, color } : nb));
            showToast(`Notebook "${title}" updated.`);
        } else { // Creating new notebook
            const newNotebook: Notebook = { id: Date.now(), title, color };
            setNotebooks(prev => [...prev, newNotebook]);
            setActiveNotebookId(newNotebook.id);
            showToast(`Notebook "${title}" created.`);
        }
        setIsNotebookModalOpen(false);
        setEditingNotebook(null);
    };

    const handleDeleteNotebook = (notebookId: number) => {
        const notebook = notebooks.find(nb => nb.id === notebookId);
        if (notebook) {
            setNotebookToDelete(notebook);
        }
    };
    
    const confirmDeleteNotebook = () => {
        if (!notebookToDelete) return;
        
        setNotebooks(prev => prev.filter(nb => nb.id !== notebookToDelete.id));
        const notesInNotebook = notes.filter(n => n.notebookId === notebookToDelete.id);
        notesInNotebook.forEach(note => {
            if (selectedNote?.id === note.id) {
                setSelectedNote(null);
            }
        });
        
        showToast(`Notebook "${notebookToDelete.title}" deleted.`);
        if (activeNotebookId === notebookToDelete.id) {
            setActiveNotebookId('all');
        }
        
        setNotebookToDelete(null);
    };

    // --- NOTE CRUD & ACTIONS ---

    const handleCreateNote = () => {
        const currentNotebookId = (typeof activeNotebookId === 'number') ? activeNotebookId : notebooks[0]?.id;
        if (!currentNotebookId) {
            showToast("Create a notebook before adding notes.", { label: "New Notebook", onClick: () => setIsNotebookModalOpen(true) });
            return;
        }
        const newNote = addNote('Untitled Note', '<p></p>', currentNotebookId);
        setSelectedNote(newNote);
    };
    
    const debouncedUpdateNote = useCallback(debounce(updateNote, 500), [updateNote]);

    const handleNoteChange = (field: 'title' | 'content', value: string) => {
        if (selectedNote) {
            const updated = { ...selectedNote, [field]: value, updatedAt: new Date() };
            setSelectedNote(updated);
            debouncedUpdateNote(updated);
            if (field === 'title' && value.includes('/tags')) {
                handleAiTitleParse(value);
            }
        }
    };

    const handleAiTitleParse = useCallback(debounce(async (title: string) => {
        if (!selectedNote) return;
        setIsParsingTitle(true);
        try {
            const {data: tags} = await kikoRequest('generate_note_tags', { title, content: selectedNote.content });
            if (tags && tags.length > 0) {
                const newTitle = title.replace(/\/tags/g, '').trim();
                const updatedNote = { ...selectedNote, title: newTitle, tags: [...new Set([...selectedNote.tags, ...tags])] };
                updateNote(updatedNote); // Update immediately, not debounced
                setSelectedNote(updatedNote);
                showToast(`Added tags: ${tags.join(', ')}`);
            }
        } catch (e) {
            console.error("Error generating tags:", e);
            showToast("Kiko couldn't generate tags for this note.");
        } finally {
            setIsParsingTitle(false);
        }
    }, 1500), [selectedNote, updateNote, showToast]);
    
    const handleToggleFlag = () => {
        if (selectedNote) updateNote({ ...selectedNote, flagged: !selectedNote.flagged });
    };

    const handleToggleArchive = () => {
        if (selectedNote) {
            const isArchiving = !selectedNote.archived;
            const updated = { ...selectedNote, archived: isArchiving };
            updateNote(updated);
            setSelectedNote(null); // Deselect after archiving/unarchiving
            showToast(isArchiving ? "Note archived." : "Note restored from archive.");
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && selectedNote) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const updatedNote = { ...selectedNote, attachment: { name: file.name, url: reader.result as string, mimeType: file.type } };
                updateNote(updatedNote);
                setSelectedNote(updatedNote);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSummarize = async () => {
        if (!selectedNote || !selectedNote.content) {
            showToast("Note is empty, nothing to summarize.");
            return;
        }
        setIsSummarizing(true);
        try {
            const contentToSummarize = selectedNote.content.replace(/<[^>]*>?/gm, ''); // Strip HTML
            const { data: summaryText } = await kikoRequest('generate_note_text', { instruction: 'summarize', text: contentToSummarize });
            setSummary(summaryText);
        } catch (e) {
            console.error("Error generating summary:", e);
            showToast("Kiko couldn't generate a summary for this note.");
        } finally {
            setIsSummarizing(false);
        }
    };

    const handleAutoTag = async () => {
        if (!selectedNote) return;
        setIsTagging(true);
        try {
            const { data: newTags } = await kikoRequest('generate_note_tags', { title: selectedNote.title, content: selectedNote.content });
            if (newTags && newTags.length > 0) {
                const updatedTags = [...new Set([...(selectedNote.tags || []), ...newTags])];
                const updatedNote = { ...selectedNote, tags: updatedTags };
                updateNote(updatedNote);
                setSelectedNote(updatedNote);
                showToast(`Added tags: ${newTags.join(', ')}`);
            } else {
                showToast("No new tags were found.");
            }
        } catch (e) {
            console.error("Error generating tags:", e);
            showToast("Kiko couldn't generate tags for this note.");
        } finally {
            setIsTagging(false);
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        if (selectedNote) {
            const updatedTags = selectedNote.tags.filter(t => t !== tagToRemove);
            const updatedNote = { ...selectedNote, tags: updatedTags };
            updateNote(updatedNote);
            setSelectedNote(updatedNote);
        }
    };

    const selectedNotebook = notebooks.find(nb => nb.id === selectedNote?.notebookId);
    const editorColor = selectedNotebook?.color || '#374151';
    const editorTextColor = getTextColorForBackground(editorColor);

    return (
        <div className={`transition-all duration-300 ${isFullScreen ? 'fixed inset-0 z-40 h-screen !rounded-none bg-bg/50 backdrop-blur-md' : 'h-[calc(100vh-8rem)] rounded-3xl bg-card shadow-lg'} flex overflow-hidden`}>
            <AnimatePresence>
                {isNotebookModalOpen && (
                    <NotebookModal 
                        onClose={() => { setIsNotebookModalOpen(false); setEditingNotebook(null); }}
                        onSave={handleSaveNotebook}
                        notebook={editingNotebook}
                    />
                )}
            </AnimatePresence>
            
            <AnimatePresence>
                {notebookToDelete && (
                    <ConfirmationModal
                        title={`Delete "${notebookToDelete.title}"?`}
                        message="This will permanently delete the notebook and all associated notes. This action cannot be undone."
                        onConfirm={confirmDeleteNotebook}
                        onCancel={() => setNotebookToDelete(null)}
                    />
                )}
            </AnimatePresence>
            
            <AnimatePresence>
                {summary && !isSummarizing && (
                    <SummaryModal summary={summary} onClose={() => setSummary(null)} showToast={showToast} />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {!isSidebarCollapsed && !isFullScreen && (
                    <motion.aside 
                        initial={{ width: 0, opacity: 0, padding: 0 }}
                        animate={{ width: 280, opacity: 1, padding: '0.5rem' }}
                        exit={{ width: 0, opacity: 0, padding: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="flex-shrink-0 border-r border-border flex flex-col bg-bg/50"
                    >
                        <div className="p-2 flex items-center justify-between border-b border-border mb-1">
                            <h3 className="font-bold font-display text-lg flex items-center gap-2">
                                <BookOpenIcon className="w-5 h-5"/> Notebooks
                            </h3>
                            <button onClick={() => setIsSidebarCollapsed(true)} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10" title="Collapse sidebar">
                                <ChevronLeftIcon className="w-5 h-5"/>
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto space-y-1">
                            <SidebarItem id="all" icon={<DocumentTextIcon className="w-5 h-5"/>} title="All Notes" count={notes.filter(n => !n.archived).length} activeId={activeNotebookId} onClick={setActiveNotebookId} />
                            <SidebarItem id="flagged" icon={<StarIcon className="w-5 h-5"/>} title="Starred" count={notes.filter(n => n.flagged && !n.archived).length} activeId={activeNotebookId} onClick={setActiveNotebookId} />
                            <div className="h-px bg-border my-2 mx-2"></div>
                            {notebooks.map(nb => (
                                <SidebarItem 
                                    key={nb.id} id={nb.id} icon={<div className="w-3 h-3 rounded-full flex-shrink-0" style={{backgroundColor: nb.color}}/>} 
                                    title={nb.title} count={notes.filter(n => n.notebookId === nb.id && !n.archived).length}
                                    activeId={activeNotebookId} onClick={setActiveNotebookId} 
                                    onEdit={() => { setEditingNotebook(nb); setIsNotebookModalOpen(true); }}
                                    onDelete={() => handleDeleteNotebook(nb.id)}
                                />
                            ))}
                            <div className="h-px bg-border my-2 mx-2"></div>
                             <SidebarItem id="archived" icon={<ArchiveBoxIcon className="w-5 h-5"/>} title="Archived" count={notes.filter(n => n.archived).length} activeId={activeNotebookId} onClick={setActiveNotebookId} />
                        </div>

                        <div className="p-2 border-t border-border mt-1">
                            <button onClick={() => { setEditingNotebook(null); setIsNotebookModalOpen(true); }} className="w-full flex items-center justify-center gap-2 text-sm font-semibold p-2 rounded-lg text-text-secondary hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                                <PlusIcon className="w-5 h-5"/> New Notebook
                            </button>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            <main className="flex-1 flex min-w-0">
                <AnimatePresence>
                    {!isFullScreen && (
                        <motion.section 
                            initial={{ width: 0, opacity: 0, padding: 0 }}
                            animate={{ width: 350, opacity: 1 }}
                            exit={{ width: 0, opacity: 0, padding: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="w-[350px] flex-shrink-0 border-r border-border flex flex-col bg-card"
                        >
                            <div className="p-4 border-b border-border flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    {isSidebarCollapsed && (
                                        <button onClick={() => setIsSidebarCollapsed(false)} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10" title="Expand sidebar">
                                            <ChevronRightIcon className="w-5 h-5"/>
                                        </button>
                                    )}
                                    <h2 className="font-bold font-display text-lg">Notes</h2>
                                    <button onClick={handleCreateNote} className="p-2 rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors" title="New note">
                                        <DocumentPlusIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-grow">
                                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary"/>
                                        <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-bg border border-border rounded-lg text-sm focus:ring-2 focus:ring-accent" />
                                    </div>
                                    <select value={sortMethod} onChange={e => setSortMethod(e.target.value as any)} className="bg-bg border border-border rounded-lg text-sm p-2 focus:ring-2 focus:ring-accent appearance-none">
                                        <option value="updatedAt-newest">Modified: Newest</option>
                                        <option value="updatedAt-oldest">Modified: Oldest</option>
                                        <option value="createdAt-newest">Created: Newest</option>
                                        <option value="createdAt-oldest">Created: Oldest</option>
                                        <option value="title-az">Title: A-Z</option>
                                        <option value="title-za">Title: Z-A</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2">
                                <AnimatePresence>
                                    {filteredAndSortedNotes.map(note => (
                                        <NoteListItem key={note.id} note={note} isSelected={selectedNote?.id === note.id} onClick={() => setSelectedNote(note)} notebooks={notebooks} />
                                    ))}
                                </AnimatePresence>
                            </div>
                        </motion.section>
                    )}
                </AnimatePresence>
                
                <section className="flex-1 flex flex-col min-w-0 bg-bg">
                    {selectedNote ? (
                        <motion.div 
                            key={selectedNote.id}
                            layoutId={`editor-card-${selectedNote.id}`}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className={`flex-1 flex flex-col transition-all duration-300 ${isFullScreen ? 'p-4 sm:p-8 m-auto max-w-4xl w-full h-full' : 'p-6 rounded-3xl m-3'}`}
                            style={{ backgroundColor: editorColor }}
                        >
                            <div className="flex-shrink-0 flex items-start justify-between gap-4 mb-4">
                                <div className="flex-1 relative">
                                    <input 
                                        type="text" 
                                        value={selectedNote.title} 
                                        onChange={e => handleNoteChange('title', e.target.value)} 
                                        className="text-4xl font-bold font-display bg-transparent w-full focus:outline-none placeholder:opacity-50"
                                        style={{ color: editorTextColor }}
                                        placeholder="Note title..."
                                    />
                                    {isParsingTitle && <SparklesIcon className="w-5 h-5 absolute right-0 top-1/2 -translate-y-1/2 animate-pulse" style={{ color: editorTextColor }}/>}
                                </div>
                                <div className="flex items-center gap-1">
                                    <EditorIconButton onClick={handleSummarize} title="Summarize Note" textColor={editorTextColor} disabled={isSummarizing}>
                                        <LightBulbIcon className={`w-5 h-5 ${isSummarizing ? 'animate-pulse' : ''}`}/>
                                    </EditorIconButton>
                                    <EditorIconButton onClick={handleAutoTag} title="Auto-tag Note" textColor={editorTextColor} disabled={isTagging}>
                                        <SparklesIcon className={`w-5 h-5 ${isTagging ? 'animate-pulse' : ''}`}/>
                                    </EditorIconButton>
                                    <EditorIconButton onClick={() => setIsFullScreen(p => !p)} title={isFullScreen ? "Exit Full Screen" : "Full Screen"} textColor={editorTextColor}>
                                        {isFullScreen ? <ArrowsPointingInIcon className="w-5 h-5"/> : <ArrowsPointingOutIcon className="w-5 h-5"/>}
                                    </EditorIconButton>
                                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,application/pdf" />
                                    <EditorIconButton onClick={() => fileInputRef.current?.click()} title="Attach File" textColor={editorTextColor}><PhotoIcon className="w-5 h-5"/></EditorIconButton>
                                    <EditorIconButton onClick={handleToggleFlag} title={selectedNote.flagged ? 'Unstar' : 'Star'} textColor={editorTextColor} active={selectedNote.flagged}><StarIcon className="w-5 h-5"/></EditorIconButton>
                                    <EditorIconButton onClick={handleToggleArchive} title={selectedNote.archived ? 'Unarchive' : 'Archive'} textColor={editorTextColor}><ArchiveBoxIcon className="w-5 h-5"/></EditorIconButton>
                                    <EditorIconButton onClick={() => deleteNote(selectedNote.id)} title="Delete Note" textColor={editorTextColor}><TrashIcon className="w-5 h-5"/></EditorIconButton>
                                </div>
                            </div>
                            
                            {selectedNote.tags && selectedNote.tags.length > 0 && (
                                <TagsDisplay tags={selectedNote.tags} onRemove={handleRemoveTag} textColor={editorTextColor} />
                            )}

                            {selectedNote.attachment && (
                                <AttachmentPreview
                                    attachment={selectedNote.attachment}
                                    onRemove={() => {
                                        if (selectedNote) {
                                            const updated = { ...selectedNote, attachment: undefined };
                                            updateNote(updated);
                                            setSelectedNote(updated);
                                        }
                                    }}
                                    textColor={editorTextColor}
                                />
                            )}
                            
                            <div className="flex-1 bg-black/10 rounded-2xl overflow-hidden mt-4">
                                <LightweightEditor key={selectedNote.id} content={selectedNote.content || ''} onChange={v => handleNoteChange('content', v)} textColor={editorTextColor} />
                            </div>
                        </motion.div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-center p-8">
                             <div>
                                <DocumentIcon className="w-16 h-16 text-text-secondary/30 mx-auto mb-4"/>
                                <h3 className="text-lg font-semibold text-text-secondary mb-2">Select a note</h3>
                                <p className="text-text-secondary/70 mb-6">Choose a note from the list or create a new one to begin.</p>
                                <button onClick={handleCreateNote} className="inline-flex items-center gap-2 px-5 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors shadow-lg">
                                    <DocumentPlusIcon className="w-5 h-5"/> Create New Note
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

// --- SUB-COMPONENTS ---

const SidebarItem = ({ id, icon, title, count, activeId, onClick, onEdit, onDelete }: {
    id: number | 'all' | 'flagged' | 'archived';
    icon: React.ReactNode;
    title: string;
    count?: number;
    activeId: any;
    onClick: (id: any) => void;
    onEdit?: () => void;
    onDelete?: () => void;
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [ref]);

    return (
        <button 
            onClick={() => onClick(id)} 
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`flex items-center justify-between w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${activeId === id ? 'bg-accent text-white shadow-md' : 'hover:bg-black/5 dark:hover:bg-white/10 text-text'}`}
        >
            <span className="flex items-center gap-3 truncate">
                {icon}
                <span className="font-semibold text-sm">{title}</span>
            </span>
            <div className="flex items-center gap-1">
                {typeof id === 'number' && (isHovered || isMenuOpen) && (
                    <motion.div initial={{opacity: 0, scale: 0.8}} animate={{opacity: 1, scale: 1}} exit={{opacity: 0}}>
                        <EllipsisVerticalIcon onClick={(e) => { e.stopPropagation(); setIsMenuOpen(p => !p); }} className="w-5 h-5 p-0.5 rounded-md hover:bg-black/10 dark:hover:bg-white/20"/>
                    </motion.div>
                )}
                 {count !== undefined && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full transition-colors ${activeId === id ? 'bg-white/20' : 'bg-black/5 dark:bg-white/10'}`}>
                        {count}
                    </span>
                )}
            </div>
            <AnimatePresence>
                {isMenuOpen && typeof id === 'number' && (
                    <motion.div ref={ref} initial={{opacity: 0, y: -10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -10}} className="absolute right-0 top-10 w-32 bg-card border border-border rounded-lg shadow-xl z-10 p-1">
                        <button onClick={(e) => { e.stopPropagation(); onEdit?.(); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-black/5 dark:hover:bg-white/10"><PencilIcon className="w-4 h-4"/> Edit</button>
                        <button onClick={(e) => { e.stopPropagation(); onDelete?.(); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-red-500"><TrashIcon className="w-4 h-4"/> Delete</button>
                    </motion.div>
                )}
            </AnimatePresence>
        </button>
    );
};

const NoteListItem = ({ note, isSelected, onClick, notebooks }: { note: Note; isSelected: boolean; onClick: () => void; notebooks: Notebook[] }) => {
    const notebook = notebooks.find(nb => nb.id === note.notebookId);
    const ref = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (isSelected) {
            ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [isSelected]);

    return (
        <motion.button 
            ref={ref}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClick} className={`block w-full text-left p-3 rounded-xl transition-all duration-200 ${isSelected ? 'bg-accent/20' : 'hover:bg-black/5 dark:hover:bg-white/5'}`
        }>
            <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-semibold text-text truncate pr-4">{note.title}</h4>
                {note.flagged && <StarIcon className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5"/>}
            </div>
            <p className="text-sm text-text-secondary line-clamp-2 mb-2">
                {(note.content || '').replace(/<[^>]*>?/gm, '')}
            </p>
            <div className="flex items-center justify-between text-xs text-text-secondary">
                <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                {notebook && <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{backgroundColor: notebook.color}}></div><span>{notebook.title}</span></div>}
            </div>
        </motion.button>
    );
};

const EditorIconButton = ({ onClick, title, textColor, active = false, disabled = false, children }: { onClick: (e: React.MouseEvent) => void; title: string; textColor: string; active?: boolean; disabled?: boolean; children: React.ReactNode; }) => (
    <button 
        onClick={onClick} 
        title={title} 
        disabled={disabled}
        className={`p-2 rounded-lg transition-colors ${active ? 'bg-black/20 text-amber-300' : 'hover:bg-black/10'} disabled:opacity-50 disabled:cursor-not-allowed`} 
        style={{ color: active ? undefined : textColor }}
    >
        {children}
    </button>
);

const AttachmentPreview = ({ attachment, onRemove, textColor }: {
    attachment: Note['attachment'];
    onRemove: () => void;
    textColor: string;
}) => {
    if (!attachment) return null;
    const isImage = attachment.mimeType.startsWith('image/');
    const handleRemoveClick = (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation(); onRemove();
    };
    return (
        <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} className="relative group p-3 bg-black/10 rounded-2xl mt-4">
            <a href={attachment.url} target="_blank" rel="noopener noreferrer" download={!isImage ? attachment.name : undefined} className="block cursor-pointer" title={`Open ${attachment.name} in new tab`}>
                {isImage ? (
                    <img src={attachment.url} alt={attachment.name} className="max-h-48 rounded-lg object-contain mx-auto" />
                ) : (
                    <div className="flex items-center gap-3 p-2 rounded-lg">
                        <DocumentIcon className="w-8 h-8 flex-shrink-0 opacity-70" style={{color: textColor}}/>
                        <div className="truncate"><p className="font-semibold truncate">{attachment.name}</p><p className="text-xs opacity-70">Click to open or download</p></div>
                    </div>
                )}
            </a>
            <button onClick={handleRemoveClick} title="Remove attachment" className="absolute top-1 right-1 p-1 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"><XMarkIcon className="w-4 h-4 text-white" /></button>
        </motion.div>
    );
};

const TagsDisplay = ({ tags, onRemove, textColor }: { tags: string[], onRemove: (tag: string) => void, textColor: string }) => (
    <div className="flex flex-wrap gap-2 mt-3">
        {tags.map(tag => (
            <motion.div 
                key={tag} layout
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full text-xs font-semibold"
                style={{ backgroundColor: 'rgba(0,0,0,0.15)', color: textColor }}
            >
                <span>{tag}</span>
                <button onClick={() => onRemove(tag)} className="p-0.5 rounded-full hover:bg-black/20"><XMarkIcon className="w-3 h-3"/></button>
            </motion.div>
        ))}
    </div>
);

const SummaryModal = ({ summary, onClose, showToast }: { summary: string, onClose: () => void, showToast: (msg: string) => void }) => {
    const handleCopy = () => {
        navigator.clipboard.writeText(summary);
        showToast("Summary copied to clipboard!");
    };
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl p-6 border border-border" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-accent/20 rounded-full text-accent"><LightBulbIcon className="w-6 h-6"/></div>
                    <h2 className="text-xl font-bold font-display text-text">Kiko's Summary</h2>
                </div>
                <div className="max-h-[50vh] overflow-y-auto pr-2 text-text-secondary prose dark:prose-invert">
                    <p>{summary}</p>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={handleCopy} className="px-4 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">Copy</button>
                    <button onClick={onClose} className="px-4 py-2 rounded-lg bg-accent text-white hover:bg-accent-hover">Close</button>
                </div>
            </motion.div>
        </motion.div>
    );
};

const NotebookModal = ({ onClose, onSave, notebook }: { onClose: () => void; onSave: (title: string, color: string) => void; notebook: Notebook | null; }) => {
    const [title, setTitle] = useState(notebook?.title || '');
    const [color, setColor] = useState(notebook?.color || PRESET_COLORS[0]);
    const [hexInput, setHexInput] = useState(notebook?.color || PRESET_COLORS[0]);
    useEffect(() => { setHexInput(color); }, [color]);
    const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value; setHexInput(value);
        if (/^#[0-9A-F]{6}$/i.test(value)) { setColor(value); }
    };
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-card rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold font-display mb-6">{notebook ? 'Edit Notebook' : 'New Notebook'}</h2>
                <div className="space-y-5">
                    <div><label className="block text-sm font-medium text-text-secondary mb-1">Title</label><input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Notebook Title" className="w-full p-2 bg-bg border border-border rounded-lg" /></div>
                    <div><label className="block text-sm font-medium text-text-secondary mb-2">Color</label><div className="grid grid-cols-7 gap-2 mb-3">{PRESET_COLORS.map(c => (<button key={c} type="button" onClick={() => setColor(c)} className={`w-full aspect-square rounded-full transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-offset-2 ring-offset-card ring-accent' : ''}`} style={{ backgroundColor: c }} aria-label={`Select color ${c}`}/>))}</div>
                        <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full border border-border flex-shrink-0" style={{ backgroundColor: /^#[0-9A-F]{6}$/i.test(hexInput) ? hexInput : 'transparent' }}></div><input type="text" value={hexInput} onChange={handleHexInputChange} className="w-full p-2 bg-bg border border-border rounded-lg font-mono text-sm" placeholder="#A855F7"/></div>
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-8"><button onClick={onClose} className="px-4 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">Cancel</button><button onClick={() => onSave(title, color)} className="px-4 py-2 rounded-lg bg-accent text-white hover:bg-accent-hover">Save</button></div>
            </motion.div>
        </motion.div>
    );
};

const ConfirmationModal = ({ title, message, onConfirm, onCancel }: { title: string; message: string; onConfirm: () => void; onCancel: () => void; }) => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={onCancel}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-card rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold font-display mb-2 text-red-500">{title}</h2>
            <p className="text-text-secondary mb-6">{message}</p>
            <div className="flex justify-center gap-3"><button onClick={onCancel} className="px-6 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 font-semibold">Cancel</button><button onClick={onConfirm} className="px-6 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-semibold">Delete</button></div>
        </motion.div>
    </motion.div>
);

export default Notes;