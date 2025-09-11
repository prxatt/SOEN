import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Draggable from 'react-draggable';
import { Note, Notebook, Task, NoteView, NoteAttachment, Category } from '../types';
import { kikoRequest } from '../services/kikoAIService';
import { PRESET_COLORS } from '../constants';
import { 
    PlusIcon, TrashIcon, SparklesIcon, XMarkIcon, 
    DocumentIcon, KikoIcon, ChevronDownIcon, BookOpenIcon, StarIcon, LightBulbIcon,
    BoldIcon, ItalicIcon, UnderlineIcon, PencilIcon, EllipsisVerticalIcon,
    MagnifyingGlassIcon, LinkIcon, Squares2X2Icon, Bars3Icon, ViewColumnsIcon, PaperClipIcon, CheckCircleIcon,
    SortAscendingIcon, SortDescendingIcon
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

// --- PROPS INTERFACE ---

interface NotesProps {
    notes: Note[];
    notebooks: Notebook[];
    updateNote: (note: Note, options?: { silent?: boolean }) => void;
    addNote: (title: string, content: string, notebookId: number) => Note;
    deleteNote: (noteId: number) => void;
    restoreNote: (noteId: number) => void;
    permanentlyDeleteNote: (noteId: number) => void;
    startChatWithContext: (context: string) => void;
    showToast: (message: string, action?: { label: string; onClick: () => void; }) => void;
    selectedNote: Note | null;
    setSelectedNote: (note: Note | null) => void;
    activeNotebookId: number | 'all' | 'flagged' | 'trash';
    setActiveNotebookId: (id: number | 'all' | 'flagged' | 'trash') => void;
    lastDeletedNote: Note | null;
    tasks: Task[];
    addNotebook: (title: string, color: string) => Notebook;
    updateNotebook: (notebook: Notebook) => void;
    deleteNotebook: (notebookId: number) => void;
    restoreNotebook: (notebookId: number) => void;
    navigateToScheduleDate: (date: Date) => void;
    categoryColors: Record<Category, string>;
}

// --- MAIN COMPONENT ---

function Notes(props: NotesProps) {
    const { 
        notebooks, addNote, showToast, selectedNote, setSelectedNote, activeNotebookId, setActiveNotebookId
    } = props;
    
    const [displayMode, setDisplayMode] = useState<'notes' | 'notebooks'>(
        () => (localStorage.getItem('praxis-notes-view-mode') as 'notes' | 'notebooks') || 'notes'
    );
    const [selectedNoteIds, setSelectedNoteIds] = useState<number[]>([]);

    const handleSetDisplayMode = (mode: 'notes' | 'notebooks') => {
        setDisplayMode(mode);
        localStorage.setItem('praxis-notes-view-mode', mode);
    };
    
    const handleSelectNote = (note: Note) => {
        if (note.deletedAt || selectedNoteIds.length > 0) return;
        setSelectedNote(note);
    };

    const handleToggleSelectNote = (noteId: number) => {
        setSelectedNoteIds(prev => 
            prev.includes(noteId)
            ? prev.filter(id => id !== noteId)
            : [...prev, noteId]
        );
    };
    
    const handleMoveNotes = (notebookId: number) => {
        const targetNotebook = notebooks.find(nb => nb.id === notebookId);
        if (!targetNotebook) return;

        selectedNoteIds.forEach(noteId => {
            const noteToMove = props.notes.find(n => n.id === noteId);
            if (noteToMove) {
                props.updateNote({ ...noteToMove, notebookId });
            }
        });
        showToast(`Moved ${selectedNoteIds.length} notes to "${targetNotebook.title}"`);
        setSelectedNoteIds([]);
    };

    const handleCreateNewNote = () => {
        let targetNotebookId: number;
        if (typeof activeNotebookId === 'number') {
            targetNotebookId = activeNotebookId;
        } else {
            targetNotebookId = notebooks[0]?.id;
        }
        
        if (!targetNotebookId) {
            showToast("Please create a notebook first.");
            handleSetDisplayMode('notebooks');
            return;
        }
        
        const newNote = addNote('New Note', '<p>Start writing...</p>', targetNotebookId);
        handleSelectNote(newNote);
    };

    const handleBackFromEditor = () => setSelectedNote(null);
    const viewingNotebook = useMemo(() => typeof activeNotebookId === 'number' ? notebooks.find(n => n.id === activeNotebookId) : null, [activeNotebookId, notebooks]);
    
    // Deselect notes if view changes
    useEffect(() => {
        setSelectedNoteIds([]);
    }, [activeNotebookId, displayMode]);

    return (
        <div className="h-[calc(100vh-8.5rem)] flex flex-col relative">
            <AnimatePresence mode="wait">
                {selectedNote ? (
                    <motion.div
                        key="editor-view"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col h-full"
                    >
                         <NoteEditorView
                            key={selectedNote.id}
                            note={selectedNote}
                            onBack={handleBackFromEditor}
                            {...props}
                        />
                    </motion.div>
                ) : (
                    <motion.div key="main-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full">
                        <div className="flex justify-between items-center mb-4 flex-shrink-0">
                            <div className="flex items-center gap-2 p-1 bg-zinc-200 dark:bg-zinc-800 rounded-full">
                                <button onClick={() => { setActiveNotebookId('all'); handleSetDisplayMode('notes'); }} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${displayMode === 'notes' && activeNotebookId === 'all' ? 'bg-black text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>All Notes</button>
                                <button onClick={() => handleSetDisplayMode('notebooks')} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${displayMode === 'notebooks' ? 'bg-black text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>Notebooks</button>
                                <AnimatePresence>
                                {viewingNotebook && displayMode === 'notes' && (
                                    <motion.div initial={{width:0, opacity: 0}} animate={{width:'auto', opacity: 1}} exit={{width:0, opacity: 0}}>
                                        <div className={`px-4 py-1.5 rounded-full text-sm font-semibold bg-black text-white whitespace-nowrap`}>{viewingNotebook.title}</div>
                                    </motion.div>
                                )}
                                </AnimatePresence>
                            </div>
                        </div>

                        <div className="flex-1 min-h-0">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={displayMode === 'notes' ? `notes-view-${activeNotebookId}` : 'notebooks-view'}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="h-full"
                                >
                                    {displayMode === 'notes' ? (
                                        <NoteListView {...props} onSelectNote={handleSelectNote} selectedNoteIds={selectedNoteIds} onToggleSelectNote={handleToggleSelectNote} />
                                    ) : (
                                        <NotebookListView 
                                            {...props} 
                                            onSelectNotebook={(nb) => {
                                                setActiveNotebookId(nb.id);
                                                handleSetDisplayMode('notes');
                                            }} 
                                        />
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {!selectedNote && (
                 <motion.button 
                    onClick={handleCreateNewNote}
                    className="absolute bottom-4 right-4 w-14 h-14 bg-accent rounded-full flex items-center justify-center text-white shadow-lg shadow-accent/30"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Create new note"
                >
                    <PlusIcon className="w-8 h-8"/>
                </motion.button>
            )}
             <MultiSelectActionBar 
                selectedCount={selectedNoteIds.length}
                notebooks={notebooks}
                onMove={handleMoveNotes}
                onCancel={() => setSelectedNoteIds([])}
            />
        </div>
    );
}

// --- NOTEBOOK EDIT MODAL ---
interface NotebookEditModalProps {
    notebook?: Notebook;
    onSave: (title: string, color: string) => void;
    onClose: () => void;
}

function NotebookEditModal({ notebook, onSave, onClose }: NotebookEditModalProps) {
    const [title, setTitle] = useState(notebook?.title || '');
    const [color, setColor] = useState(notebook?.color || PRESET_COLORS[0]);
    const isCreating = !notebook;

    const handleSave = () => {
        if (title.trim()) {
            onSave(title.trim(), color);
            onClose();
        }
    };

    return (
        <motion.div 
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div 
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} 
                onClick={e => e.stopPropagation()} 
                className="bg-card p-6 rounded-2xl w-full max-w-sm border border-border"
            >
                <h3 className="font-bold text-lg mb-4">{isCreating ? 'Create Notebook' : 'Edit Notebook'}</h3>
                <div className="space-y-4">
                    <input 
                        type="text" 
                        value={title} 
                        onChange={e => setTitle(e.target.value)} 
                        placeholder="Notebook Name"
                        className="w-full bg-bg p-2 rounded-lg border border-border"
                    />
                    <div className="grid grid-cols-7 gap-2">
                        {PRESET_COLORS.map(c => (
                            <button 
                                key={c} 
                                onClick={() => setColor(c)}
                                className={`w-full aspect-square rounded-full transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-offset-2 ring-offset-card ring-accent' : ''}`}
                                style={{ backgroundColor: c }}
                                aria-label={`Select color ${c}`}
                            />
                        ))}
                    </div>
                </div>
                <div className="flex gap-2 mt-6">
                    <button onClick={onClose} className="flex-1 p-2 rounded-lg bg-bg hover:bg-border/50 transition-colors">Cancel</button>
                    <button onClick={handleSave} className="flex-1 p-2 rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors">Save</button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// --- NOTEBOOKS LIST VIEW ---
interface NotebookListViewProps extends NotesProps {
    onSelectNotebook: (notebook: Notebook) => void;
}

function NotebookListView({ notes, notebooks, addNotebook, updateNotebook, deleteNotebook, onSelectNotebook }: NotebookListViewProps) {
    const [editingNotebook, setEditingNotebook] = useState<Notebook | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    return (
        <div className="flex-1 overflow-y-auto pr-2 -mr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <motion.div
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center text-text-secondary hover:bg-card hover:border-accent transition-all cursor-pointer min-h-[150px]"
                    onClick={() => setIsCreateModalOpen(true)}
                >
                    <PlusIcon className="w-8 h-8 mb-2" />
                    <span className="font-semibold">New Notebook</span>
                </motion.div>

                {notebooks.map(notebook => (
                    <motion.div 
                        layout
                        key={notebook.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl p-4 flex flex-col justify-between min-h-[150px] relative group overflow-hidden"
                        style={{
                           background: `linear-gradient(135deg, ${notebook.color} 0%, rgba(0,0,0,0.3) 100%), ${notebook.color}`
                        }}
                    >
                        <div 
                            className="absolute inset-0 bg-no-repeat opacity-10" 
                            style={{ 
                                backgroundImage: `radial-gradient(circle at 100% 0%, ${getTextColorForBackground(notebook.color)} 0%, transparent 30%)`
                            }}
                        />
                        <div className="absolute top-2 right-2 z-10">
                             <Menu target={<button className="p-2 rounded-full bg-black/20 text-white opacity-50 group-hover:opacity-100 transition-opacity"><EllipsisVerticalIcon className="w-5 h-5"/></button>}>
                                <MenuItem label="Edit" onClick={() => setEditingNotebook(notebook)} />
                                <MenuItem label="Delete" onClick={() => deleteNotebook(notebook.id)} className="text-red-500"/>
                            </Menu>
                        </div>
                        <button className="text-left w-full h-full relative" onClick={() => onSelectNotebook(notebook)}>
                            <BookOpenIcon className="absolute bottom-2 right-2 w-16 h-16 opacity-20 transform -rotate-12"/>
                            <h3 className="font-bold font-display text-2xl" style={{ color: getTextColorForBackground(notebook.color) }}>
                                {notebook.title}
                            </h3>
                            <p className="text-sm font-medium" style={{ color: getTextColorForBackground(notebook.color), opacity: 0.8 }}>
                                {notes.filter(n => n.notebookId === notebook.id && !n.deletedAt).length} notes
                            </p>
                        </button>
                    </motion.div>
                ))}
            </div>
            
            <AnimatePresence>
                {editingNotebook && (
                    <NotebookEditModal
                        notebook={editingNotebook}
                        onClose={() => setEditingNotebook(null)}
                        onSave={(title, color) => updateNotebook({ ...editingNotebook, title, color })}
                    />
                )}
                {isCreateModalOpen && (
                    <NotebookEditModal
                        onClose={() => setIsCreateModalOpen(false)}
                        onSave={(title, color) => addNotebook(title, color)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// --- ALL NOTES VIEW ---

interface NoteListViewProps extends NotesProps {
    onSelectNote: (note: Note) => void;
    selectedNoteIds: number[];
    onToggleSelectNote: (noteId: number) => void;
}

type SortByType = 'updatedAt' | 'title' | 'notebookId';
type SortDirType = 'asc' | 'desc';

function NoteListView(props: NoteListViewProps) {
    const { notes, activeNotebookId, setActiveNotebookId, notebooks, updateNote } = props;
    const [searchQuery, setSearchQuery] = useState("");
    
    const [view, setView] = useState<NoteView>(() => (localStorage.getItem('praxis-note-view') as NoteView) || 'grid');
    const [sortBy, setSortBy] = useState<SortByType>('updatedAt');
    const [sortDir, setSortDir] = useState<SortDirType>('desc');
    
    useEffect(() => {
        localStorage.setItem('praxis-note-view', view);
    }, [view]);

    const filteredNotes = useMemo(() => {
        let tempNotes = notes.filter(n => {
            if (typeof activeNotebookId === 'number') return n.notebookId === activeNotebookId && !n.deletedAt;
            if (activeNotebookId === 'all') return !n.deletedAt;
            if (activeNotebookId === 'flagged') return n.flagged && !n.deletedAt;
            if (activeNotebookId === 'trash') return !!n.deletedAt;
            return false;
        });

        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            tempNotes = tempNotes.filter(n =>
                n.title.toLowerCase().includes(lowercasedQuery) ||
                (n.content || '').replace(/<[^>]+>/g, ' ').toLowerCase().includes(lowercasedQuery) ||
                n.tags.some(tag => tag.toLowerCase().includes(lowercasedQuery))
            );
        }

        tempNotes.sort((a, b) => {
            let compare = 0;
            switch (sortBy) {
                case 'title':
                    compare = a.title.localeCompare(b.title);
                    break;
                case 'notebookId': {
                    const titleA = notebooks.find(nb => nb.id === a.notebookId)?.title || '';
                    const titleB = notebooks.find(nb => nb.id === b.notebookId)?.title || '';
                    compare = titleA.localeCompare(titleB);
                    break;
                }
                case 'updatedAt':
                default:
                    compare = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                    break;
            }
            return sortDir === 'asc' ? compare : -compare;
        });

        return tempNotes;
    }, [notes, activeNotebookId, searchQuery, sortBy, sortDir, notebooks]);

    const viewOptions: { id: NoteView; icon: React.FC<any> }[] = [
        { id: 'grid', icon: Squares2X2Icon },
        { id: 'list', icon: Bars3Icon },
        { id: 'board', icon: ViewColumnsIcon },
    ];
    
    const renderContent = () => {
         if (filteredNotes.length === 0) {
            return (
                <div className="h-full flex flex-col items-center justify-center text-text-secondary text-center flex-1">
                    <DocumentIcon className="w-16 h-16 opacity-30 mb-4"/>
                    <h3 className="font-bold text-lg text-text">No Notes Found</h3>
                    <p>Try a different search or filter.</p>
                 </div>
            );
        }
        
        switch(view) {
            case 'grid': return <GridView notes={filteredNotes} {...props} />;
            case 'list': return <CalendarStyleListView notes={filteredNotes} {...props} />;
            case 'board': return <BoardView notes={filteredNotes} {...props} />;
            default: return <GridView notes={filteredNotes} {...props} />;
        }
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 mb-4 flex-shrink-0">
                <div className="relative flex-1">
                    <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"/>
                    <input type="text" placeholder="Search notes..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-lg pl-10 pr-12 py-2 focus:ring-2 focus:ring-accent focus:outline-none"/>
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                        <Menu target={
                            <button className="p-2 rounded-lg bg-zinc-200/0 dark:bg-zinc-800/0 hover:bg-black/5 dark:hover:bg-white/10">
                                {sortDir === 'asc' ? <SortAscendingIcon className="w-5 h-5"/> : <SortDescendingIcon className="w-5 h-5"/>}
                            </button>
                        }>
                            <MenuItem label="Last Modified" onClick={() => { setSortBy('updatedAt'); setSortDir('desc'); }} />
                            <MenuItem label="Title A-Z" onClick={() => { setSortBy('title'); setSortDir('asc'); }} />
                            <MenuItem label="Notebook" onClick={() => { setSortBy('notebookId'); setSortDir('asc'); }} />
                        </Menu>
                    </div>
                </div>
                 <div className="flex items-center gap-1 p-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg">
                     {viewOptions.map(option => (
                        <button key={option.id} onClick={() => setView(option.id)} className={`p-1.5 rounded-md ${view === option.id ? 'bg-bg shadow-sm' : ''}`}>
                            <option.icon className="w-5 h-5"/>
                        </button>
                     ))}
                </div>
                
                 {typeof activeNotebookId !== 'number' && (
                    <>
                        <div className="flex items-center gap-1 p-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg">
                            <button 
                                onClick={() => setActiveNotebookId(activeNotebookId === 'flagged' ? 'all' : 'flagged')} 
                                className={`p-1.5 rounded-md transition-colors ${activeNotebookId==='flagged' ? 'bg-bg shadow-sm ring-1 ring-amber-400' : ''}`}
                                aria-label="Filter flagged notes"
                            >
                                <StarIcon className={`w-5 h-5 transition-colors ${activeNotebookId === 'flagged' ? 'text-amber-400 fill-amber-400' : ''}`}/>
                            </button>
                        </div>
                        <button onClick={() => setActiveNotebookId('trash')} className={`p-2 rounded-lg ${activeNotebookId==='trash' ? 'bg-accent text-white' : 'bg-zinc-200 dark:bg-zinc-800'}`}><TrashIcon className="w-5 h-5"/></button>
                    </>
                 )}
            </div>

            <div className="flex-1 min-h-0">
                {renderContent()}
            </div>
        </div>
    );
}

// --- MULTI-VIEW COMPONENTS ---

const GridView = (props: { notes: Note[] } & NoteListViewProps) => (
    <div className="h-full overflow-y-auto pr-2 -mr-4 pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" style={{alignItems: 'start'}}>
            {props.notes.map(note => {
                const notebook = props.notebooks.find(nb => nb.id === note.notebookId);
                return <NoteCard key={note.id} note={note} notebook={notebook} {...props} />;
            })}
        </div>
    </div>
);

const CalendarStyleListView = ({ notes, ...props }: { notes: Note[] } & NoteListViewProps) => {
    const notesByDate = useMemo(() => {
        return notes.reduce((acc, note) => {
            const dateStr = new Date(note.updatedAt).toDateString();
            if (!acc[dateStr]) acc[dateStr] = [];
            acc[dateStr].push(note);
            return acc;
        }, {} as Record<string, Note[]>);
    }, [notes]);
    
    const sortedDates = useMemo(() => Object.keys(notesByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()), [notesByDate]);

    return (
        <div className="h-full overflow-y-auto pr-2 -mr-4 pb-4 space-y-3">
            {sortedDates.map(dateStr => (
                <NoteDayCard key={dateStr} date={new Date(dateStr)} notes={notesByDate[dateStr]} {...props} />
            ))}
        </div>
    );
};

const NoteTagScroller = ({ notes, textColor }: { notes: Note[]; textColor: string }) => {
    const tags = useMemo(() => {
        const allTags = notes.flatMap(note => note.tags);
        return [...new Set(allTags)];
    }, [notes]);

    if (tags.length === 0) return null;

    return (
        <div className="flex h-full gap-2 -mr-4 overflow-x-auto pb-2">
            {tags.map(tag => (
                <div key={tag} className="flex-shrink-0 px-3 py-1 text-xs font-semibold rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.2)'}}>
                    #{tag}
                </div>
            ))}
        </div>
    );
};

const NoteDayCard = ({ date, notes, ...props }: { date: Date; notes: Note[] } & NoteListViewProps) => {
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    
    const bgColor = notes.length > 0 ? (props.notebooks.find(nb => nb.id === notes[0].notebookId)?.color || '#374151') : '#374151';
    const textColor = getTextColorForBackground(bgColor);

    const linkedTasksForDay = useMemo(() => {
        return notes
            .map(note => {
                const task = props.tasks.find(t => t.linkedNoteId === note.id);
                return task ? { note, task } : null;
            })
            .filter((item): item is { note: Note; task: Task } => item !== null);
    }, [notes, props.tasks]);


    return (
         <div 
            className="rounded-3xl flex min-h-[10rem] overflow-hidden"
            style={{ backgroundColor: bgColor, color: textColor }}
        >
            <div className="w-2/3 p-4 flex flex-col">
                <div className="flex-grow space-y-1 overflow-y-auto -mr-2 pr-2" style={{ maxHeight: '16rem' }}>
                    {notes.map(note => (
                        <CompactNoteCard key={note.id} note={note} {...props} />
                    ))}
                </div>
                <div className="pt-3 mt-auto">
                    <NoteTagScroller notes={notes} textColor={textColor} />
                </div>
            </div>
            <button 
                onClick={() => props.navigateToScheduleDate(date)} 
                className="w-1/3 flex-shrink-0 text-right rounded-2xl transition-colors p-4 flex flex-col justify-between"
            >
                <div>
                    <p className="font-semibold">{dayOfWeek}</p>
                    <p className="text-6xl font-bold font-display tracking-tighter leading-none mt-1">{day}</p>
                    <p className="text-6xl font-bold font-display tracking-tight leading-none opacity-60">{month}</p>
                </div>

                {linkedTasksForDay.length > 0 && (
                    <div className="mt-auto space-y-2 text-left">
                        {linkedTasksForDay.map(({ note, task }) => (
                            <div key={task.id} className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                                <div className="flex items-center gap-1.5 text-xs font-semibold opacity-90 mb-1">
                                    <LinkIcon className="w-3.5 h-3.5 flex-shrink-0" />
                                    Linked Task
                                </div>
                                <p className="font-bold text-base">{task.title}</p>
                            </div>
                        ))}
                    </div>
                )}
            </button>
        </div>
    );
};

const CompactNoteCard = ({ note, selectedNoteIds, onToggleSelectNote, onSelectNote, updateNote }: { note: Note } & Omit<NoteListViewProps, 'notes'>) => {
    const isSelectionMode = selectedNoteIds.length > 0;
    const isSelected = selectedNoteIds.includes(note.id);
    const longPressTimeout = useRef<number | null>(null);

    const handlePointerDown = () => {
        if (isSelectionMode) return;
        longPressTimeout.current = window.setTimeout(() => onToggleSelectNote(note.id), 500);
    };

    const clearLongPress = () => {
        if (longPressTimeout.current) clearTimeout(longPressTimeout.current);
    };

    const handleClick = () => {
        if (isSelectionMode) {
            onToggleSelectNote(note.id);
        } else {
            onSelectNote(note);
        }
    };
    
    const contentSnippet = (note.content || '').replace(/<[^>]+>/g, ' ');

    return (
        <div 
            onClick={handleClick} 
            onPointerDown={handlePointerDown}
            onPointerUp={clearLongPress}
            onPointerLeave={clearLongPress}
            className={`p-2 cursor-pointer transition-all duration-200 relative group ${isSelected ? 'ring-2 ring-current rounded-lg' : ''}`}
        >
            <AnimatePresence>
            {isSelected && (
                 <motion.div initial={{scale:0}} animate={{scale:1}} exit={{scale:0}} className="absolute top-0 right-0 w-5 h-5 bg-white rounded-full flex items-center justify-center z-10">
                    <CheckCircleIcon className="w-5 h-5 text-green-500"/>
                 </motion.div>
            )}
            </AnimatePresence>
             <div className="flex justify-between items-start gap-2">
                <h5 className="font-bold font-display text-xl break-word transition-transform duration-200 group-hover:scale-[1.02] origin-left">{note.title}</h5>
                 <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        updateNote({ ...note, flagged: !note.flagged }, { silent: true });
                    }}
                    className="p-1.5 -mr-1.5 flex-shrink-0"
                    aria-label={note.flagged ? "Unflag note" : "Flag note"}
                >
                    <StarIcon className={`w-5 h-5 transition-colors ${note.flagged ? 'text-amber-400 fill-amber-400' : 'opacity-70'}`} />
                </button>
            </div>
            <p className="text-sm opacity-80 line-clamp-2 mt-1">{contentSnippet}</p>
        </div>
    );
};


const BoardView = (props: { notes: Note[] } & NoteListViewProps) => {
    const boardNotes = useMemo(() => props.notes.filter(n => !n.deletedAt), [props.notes]);
    const notebookColumnRefs = useRef<Record<number, HTMLDivElement | null>>({});

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: any, note: Note) => {
        const noteRect = (event.target as HTMLElement).getBoundingClientRect();
        const noteCenter = {
            x: noteRect.left + noteRect.width / 2,
            y: noteRect.top + noteRect.height / 2
        };

        for (const notebookIdStr in notebookColumnRefs.current) {
            const notebookId = parseInt(notebookIdStr, 10);
            const columnEl = notebookColumnRefs.current[notebookId];
            if (columnEl && notebookId !== note.notebookId) {
                const columnRect = columnEl.getBoundingClientRect();
                if (
                    noteCenter.x > columnRect.left && noteCenter.x < columnRect.right &&
                    noteCenter.y > columnRect.top && noteCenter.y < columnRect.bottom
                ) {
                    props.updateNote({ ...note, notebookId: notebookId });
                    break;
                }
            }
        }
    };

    return (
        <div className="flex h-full overflow-x-auto pb-4 gap-4">
            {props.notebooks.map(notebook => (
                <div 
                    key={notebook.id} 
                    ref={el => { notebookColumnRefs.current[notebook.id] = el; }}
                    className="w-80 flex-shrink-0 flex flex-col"
                >
                    <div className="flex items-center gap-2 p-2 mb-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: notebook.color }} />
                        <h3 className="font-bold truncate">{notebook.title}</h3>
                        <span className="text-sm text-text-secondary">{boardNotes.filter(n => n.notebookId === notebook.id).length || 0}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 -mr-2 rounded-xl bg-bg/50 p-2">
                        {boardNotes
                            .filter(note => note.notebookId === notebook.id)
                            .map(note => (
                                <NoteCard 
                                    key={note.id} 
                                    note={note} 
                                    notebook={notebook} 
                                    isDraggable={true}
                                    onDragEnd={(event, info) => handleDragEnd(event, info, note)}
                                    {...props} 
                                />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};


// --- NOTE CARD (FOR GRID & BOARD) ---

interface NoteCardProps extends NoteListViewProps {
    note: Note;
    notebook?: Notebook;
    isDraggable?: boolean;
    onDragEnd?: (event: MouseEvent | TouchEvent | PointerEvent, info: any) => void;
}

function NoteCard({ note, notebook, tasks, onSelectNote, selectedNoteIds, onToggleSelectNote, updateNote, isDraggable, onDragEnd }: NoteCardProps) {
    const bgColor = notebook?.color || '#374151';
    const textColor = getTextColorForBackground(bgColor);
    const linkedTask = useMemo(() => tasks.find(t => t.linkedNoteId === note.id), [tasks, note.id]);
    const isSelectionMode = selectedNoteIds.length > 0;
    const isSelected = selectedNoteIds.includes(note.id);
    const longPressTimeout = useRef<number | null>(null);

    const handlePointerDown = () => {
        if (isSelectionMode) return;
        longPressTimeout.current = window.setTimeout(() => {
            onToggleSelectNote(note.id);
        }, 500);
    };

    const clearLongPress = () => {
        if (longPressTimeout.current) clearTimeout(longPressTimeout.current);
    };

    const handleClick = () => {
        if (isSelectionMode) {
            onToggleSelectNote(note.id);
        } else {
            onSelectNote(note);
        }
    };
    
    const cardContent = (
         <div
            className={`rounded-2xl p-4 flex flex-col gap-3 break-inside-avoid relative transition-all duration-200 ${isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} ${isSelected ? 'ring-2 ring-white/80' : ''}`}
        >
             <button 
                onClick={(e) => {
                    e.stopPropagation();
                    updateNote({ ...note, flagged: !note.flagged }, { silent: true });
                }}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/10 hover:bg-black/20 transition-colors z-10"
                aria-label={note.flagged ? "Unflag note" : "Flag note"}
            >
                <StarIcon className={`w-5 h-5 transition-colors ${note.flagged ? 'text-amber-400 fill-amber-400' : 'text-white/70'}`} />
            </button>
             <AnimatePresence>
            {isSelected && (
                 <motion.div initial={{scale:0}} animate={{scale:1}} exit={{scale:0}} className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center z-10">
                    <CheckCircleIcon className="w-6 h-6 text-green-500"/>
                 </motion.div>
            )}
            </AnimatePresence>
            <h4 className="font-bold text-lg break-word pr-8">{note.title}</h4>
            <div className={`text-sm opacity-80 break-word flex-grow`}>
                <div dangerouslySetInnerHTML={{ __html: (note.content || '').replace(/<[^>]+>/g, ' ').substring(0, 200) + (note.content.length > 200 ? '...' : '') }} />
            </div>
            
            {(note.tags.length > 0 || linkedTask) && (
                <div className="flex flex-col gap-2 pt-2 border-t border-current/20 mt-auto">
                    {note.tags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                            {note.tags.map(tag => (
                                <div key={tag} className="px-2 py-0.5 rounded-md text-xs font-semibold" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                                    {tag}
                                </div>
                            ))}
                        </div>
                    )}
                    {linkedTask && (
                        <div className="flex items-center gap-1.5 text-xs font-semibold" style={{color: textColor, opacity: 0.9}}>
                            <LinkIcon className="w-3.5 h-3.5 flex-shrink-0"/>
                            <span className="truncate">Linked: {linkedTask.title} ({linkedTask.category})</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
    
     return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, backgroundColor: bgColor, color: textColor }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleClick}
            onPointerDown={handlePointerDown}
            onPointerUp={clearLongPress}
            onPointerLeave={clearLongPress}
            drag={isDraggable}
            onDragEnd={onDragEnd}
            whileDrag={{ scale: 1.05, zIndex: 100 }}
            dragElastic={0.2}
            className="rounded-2xl"
        >
           {cardContent}
        </motion.div>
    );
}

// --- MULTI-SELECT ACTION BAR ---
interface MultiSelectActionBarProps {
    selectedCount: number;
    notebooks: Notebook[];
    onMove: (notebookId: number) => void;
    onCancel: () => void;
}

function MultiSelectActionBar({ selectedCount, notebooks, onMove, onCancel }: MultiSelectActionBarProps) {
    if (selectedCount === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-md z-20"
        >
            <div className="bg-card p-3 rounded-2xl shadow-lg border border-border flex items-center justify-between">
                <span className="font-semibold text-sm">{selectedCount} notes selected</span>
                <div className="flex items-center gap-2">
                     <Menu target={<button className="px-3 py-1.5 bg-accent text-white rounded-lg text-sm font-semibold">Move To...</button>}>
                        {notebooks.map(nb => (
                            <MenuItem key={nb.id} label={nb.title} onClick={() => onMove(nb.id)} />
                        ))}
                    </Menu>
                    <button onClick={onCancel} className="p-2 text-text-secondary hover:text-text rounded-lg"><XMarkIcon className="w-5 h-5" /></button>
                </div>
            </div>
        </motion.div>
    );
}


// --- NOTE EDITOR VIEW ---
interface NoteEditorViewProps extends NotesProps {
    note: Note;
    onBack: () => void;
}

function NoteEditorView({ note, onBack, updateNote, showToast, deleteNote }: NoteEditorViewProps) {
    const [currentNote, setCurrentNote] = useState(note);
    const editorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
     useEffect(() => {
        setCurrentNote(note);
        if (editorRef.current && editorRef.current.innerHTML !== note.content) {
            editorRef.current.innerHTML = note.content;
        }
    }, [note]);
    
    const debouncedUpdateNote = useCallback(debounce(updateNote, 500), [updateNote]);

    const handleNoteChange = (field: 'title' | 'content' | 'attachments' | 'flagged', value: any) => {
        const updated = { ...currentNote, [field]: value, updatedAt: new Date() };
        setCurrentNote(updated);
        debouncedUpdateNote(updated);
    };
    
    const handleToolbarCommand = (command: string) => {
        document.execCommand(command);
        editorRef.current?.focus();
        handleNoteChange('content', editorRef.current?.innerHTML || '');
    };
    
    const handleAttachmentUpdate = (updatedAttachment: NoteAttachment) => {
        const updatedAttachments = (currentNote.attachments || []).map(att => att.id === updatedAttachment.id ? updatedAttachment : att);
        handleNoteChange('attachments', updatedAttachments);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
            const newAttachment: NoteAttachment = {
                id: `${Date.now()}`,
                name: file.name,
                type: file.type.startsWith('image/') ? 'image' : 'pdf',
                url: reader.result as string,
                x: 50, y: 50, width: file.type.startsWith('image/') ? 300 : 500, height: 400
            };
            handleNoteChange('attachments', [...(currentNote.attachments || []), newAttachment]);
        };
        reader.readAsDataURL(file);
    };

    const handleDelete = () => {
        deleteNote(currentNote.id);
        onBack();
    };
    
    return (
        <div className="bg-card dark:bg-zinc-900/50 rounded-3xl p-6 flex flex-col h-full">
             <header className="flex items-center justify-between mb-6 flex-shrink-0">
                <button onClick={onBack} className="flex items-center gap-2 font-semibold text-text-secondary hover:text-text transition-colors">
                     <BookOpenIcon className="w-6 h-6"/>
                    Back
                </button>
                <button 
                    onClick={() => updateNote({ ...currentNote, flagged: !currentNote.flagged }, { silent: true })}
                    className="p-2 rounded-full hover:bg-accent/10"
                    aria-label={currentNote.flagged ? "Unflag note" : "Flag note"}
                >
                    <StarIcon className={`w-6 h-6 transition-colors ${currentNote.flagged ? 'text-amber-400 fill-amber-400' : 'text-text-secondary'}`} />
                </button>
            </header>
            
            <div className="flex-1 flex flex-col min-h-0">
                 <input type="text" value={currentNote.title} onChange={e => handleNoteChange('title', e.target.value)} className="text-4xl font-bold font-display bg-transparent w-full focus:outline-none placeholder:opacity-50 mb-4 flex-shrink-0" placeholder="Note Title"/>
                 
                 <div className="sticky top-0 z-10 p-2 mb-4 bg-bg rounded-2xl border border-border shadow-sm flex items-center justify-between flex-shrink-0">
                     <div className="flex items-center gap-1">
                        <button onClick={() => handleToolbarCommand('bold')} className="p-2.5 rounded-lg hover:bg-accent/10"><BoldIcon className="w-5 h-5"/></button>
                        <button onClick={() => handleToolbarCommand('italic')} className="p-2.5 rounded-lg hover:bg-accent/10"><ItalicIcon className="w-5 h-5"/></button>
                        <button onClick={() => handleToolbarCommand('underline')} className="p-2.5 rounded-lg hover:bg-accent/10"><UnderlineIcon className="w-5 h-5"/></button>
                     </div>
                     <div className="flex items-center gap-1">
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,application/pdf" className="hidden" />
                        <button onClick={() => fileInputRef.current?.click()} className="p-2.5 rounded-lg hover:bg-accent/10"><PaperClipIcon className="w-5 h-5"/></button>
                        <div className="relative">
                             <Menu target={
                                <button className="flex items-center gap-1 px-3 py-2 bg-accent/10 text-accent font-semibold rounded-lg hover:bg-accent/20">
                                    <KikoIcon className="w-5 h-5"/>
                                    <EllipsisVerticalIcon className="w-4 h-4"/>
                                </button>
                             }>
                                 <MenuItem label="Summarize Note" onClick={() => {}} />
                                 <MenuItem label="Auto-Tag Note" onClick={() => {}} />
                                 <MenuItem label="Add Smart Feature..." onClick={() => {}} />
                                 <div className="h-px bg-border my-1"></div>
                                 <MenuItem label="Delete Note" onClick={handleDelete} className="text-red-500" />
                            </Menu>
                        </div>
                     </div>
                 </div>
                
                <div className="relative w-full h-full min-h-0 flex-grow">
                    <div ref={editorRef} contentEditable={true} onInput={e => handleNoteChange('content', e.currentTarget.innerHTML)} dangerouslySetInnerHTML={{ __html: currentNote.content }} className="w-full h-full p-2 focus:outline-none overflow-y-auto prose prose-lg prose-headings:font-display prose-headings:tracking-tight dark:prose-invert max-w-none break-word absolute inset-0 z-0" aria-label="Note content"/>
                    
                    <div className="absolute inset-0 z-10 pointer-events-none">
                        {(currentNote.attachments || []).map(att => (
                            <DraggableAttachment key={att.id} attachment={att} onUpdate={handleAttachmentUpdate} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Draggable Attachment ---
const DraggableAttachment = ({ attachment, onUpdate }: { attachment: NoteAttachment; onUpdate: (att: NoteAttachment) => void }) => {
    const nodeRef = useRef(null);

    const handleResize = (e: React.MouseEvent, direction: string) => {
        e.stopPropagation();
        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = attachment.width || 300;
        const startHeight = attachment.height || 400;

        const doDrag = (e: MouseEvent) => {
            let newWidth = startWidth;
            let newHeight = startHeight;
            if(direction.includes('right')) newWidth = startWidth + e.clientX - startX;
            if(direction.includes('left')) newWidth = startWidth - (e.clientX - startX);
            if(direction.includes('bottom')) newHeight = startHeight + e.clientY - startY;
            if(direction.includes('top')) newHeight = startHeight - (e.clientY - startY);
            
            onUpdate({ ...attachment, width: Math.max(100, newWidth), height: Math.max(100, newHeight) });
        };

        const stopDrag = () => {
            document.removeEventListener('mousemove', doDrag);
            document.removeEventListener('mouseup', stopDrag);
        };

        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', stopDrag);
    };
    
    const renderContent = () => {
        switch(attachment.type) {
            case 'image': return <img src={attachment.url} alt={attachment.name} className="w-full h-full object-contain" draggable={false}/>;
            case 'pdf': return <iframe src={attachment.url} title={attachment.name} className="w-full h-full border-0"/>;
            default: return null;
        }
    }
    
    if (attachment.type === 'pdf') {
        return (
            <div className="p-4 rounded-xl border border-border bg-card shadow-lg absolute pointer-events-auto" style={{ top: '20px', left: '20px' }}>
                <div className="font-semibold text-sm mb-2">{attachment.name}</div>
                <div style={{width: '500px', height: '600px'}}>
                     {renderContent()}
                </div>
            </div>
        )
    }

    return (
        <Draggable
            nodeRef={nodeRef}
            position={{ x: attachment.x || 50, y: attachment.y || 50 }}
            onStop={(e, data) => onUpdate({ ...attachment, x: data.x, y: data.y })}
            bounds="parent"
        >
            <div ref={nodeRef} style={{ width: attachment.width, height: attachment.height }} className="p-2 border-2 border-accent/50 bg-bg shadow-lg rounded-lg absolute pointer-events-auto box-content cursor-move group">
                 {renderContent()}
                 <div onMouseDown={(e) => handleResize(e, 'bottom-right')} className="w-4 h-4 bg-accent rounded-full absolute -right-2 -bottom-2 cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
        </Draggable>
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
                        className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-lg shadow-xl z-[100] p-1"
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

export default Notes;