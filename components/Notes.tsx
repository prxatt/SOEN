import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Note, Notebook, Insight, ActionItem } from '../types';
import { generateTextForNote, generateNoteFromTemplate, generateImageForNote, generateTitleForNote } from '../services/geminiService';
import { PlusCircleIcon, TrashIcon, ChatBubbleLeftEllipsisIcon, SparklesIcon, ChevronDownIcon, ArchiveBoxIcon, FlagIcon, XMarkIcon, DocumentPlusIcon, DocumentIcon, BriefcaseIcon, BoldIcon, ItalicIcon, UnderlineIcon, ListBulletIcon, ListOrderedIcon, PhotoIcon } from './Icons';

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


const NewNoteModal: React.FC<{onClose: () => void; onCreate: (type: 'blank' | 'ai_daily_planner' | 'case_study') => void}> = ({ onClose, onCreate }) => {
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
                    <button onClick={() => onCreate('ai_daily_planner')} className="flex flex-col items-center justify-center text-center p-6 bg-light-bg dark:bg-dark-bg rounded-xl hover:ring-2 ring-accent transition-all border border-light-border dark:border-dark-border">
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
                        <DocumentPlusIcon className="w-10 h-10 mb-2"/>
                        <p className="font-semibold">Template Library</p>
                        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">(Coming Soon)</p>
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
    updateNote: (updatedNote: Note) => void;
    addTask: (title: string, notebookId?: number) => void;
    startChatWithContext: (context: string, type: 'note' | 'suggestion' | 'theme' | 'selection') => void;
}

const Notes: React.FC<NotesProps> = ({ notes, setNotes, notebooks, setNotebooks, addInsights, updateNote, addTask, startChatWithContext }) => {
  const [selectedNotebookId, setSelectedNotebookId] = useState<number>(notebooks[0]?.id || 0);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isNewNoteModalOpen, setIsNewNoteModalOpen] = useState(false);
  const [suggestedTitle, setSuggestedTitle] = useState<string | null>(null);
  const [editingNotebookId, setEditingNotebookId] = useState<number | null>(null);

  const debouncedUpdate = useRef(debounce((updatedNote: Note) => updateNote(updatedNote), 500)).current;

  const displayedNotes = useMemo(() => {
    return notes.filter(n => n.notebookId === selectedNotebookId && !n.archived).sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [notes, selectedNotebookId]);

  useEffect(() => {
      if (selectedNote && !displayedNotes.some(n => n.id === selectedNote.id)) {
          setSelectedNote(displayedNotes[0] || null);
      }
      else if (!selectedNote && displayedNotes.length > 0) {
          setSelectedNote(displayedNotes[0] || null);
      }
  }, [selectedNote, displayedNotes]);

  useEffect(() => {
      const activeNotesInNewNotebook = notes
          .filter(n => n.notebookId === selectedNotebookId && !n.archived)
          .sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
      setSelectedNote(activeNotesInNewNotebook[0] || null);
  }, [selectedNotebookId, notes]);

  const debouncedGenerateTitle = useCallback(debounce(async (note: Note) => {
    const title = (note?.title || '').trim();
    if (title === '' || title.toLowerCase() === 'untitled note') {
        const plainTextContent = (note?.content || '').replace(/<[^>]*>?/gm, '');
        if (plainTextContent.length > 50) {
            setIsAiLoading(true);
            const newTitle = await generateTitleForNote(plainTextContent);
            setSuggestedTitle(newTitle);
            setIsAiLoading(false);
        }
    }
  }, 2000), []);

  useEffect(() => {
      setSuggestedTitle(null);
      if (selectedNote) {
          debouncedGenerateTitle(selectedNote);
      }
  }, [selectedNote?.content, selectedNote?.id, debouncedGenerateTitle]);
  
  const handleContentChange = (newContent: string) => {
      if(selectedNote) {
          const updatedNote = {...selectedNote, content: newContent};
          setSelectedNote(updatedNote);
          debouncedUpdate(updatedNote);
      }
  };

  const handleTitleChange = (title: string) => {
    if (selectedNote) {
        const updatedNote = { ...selectedNote, title };
        setSelectedNote(updatedNote);
        debouncedUpdate(updatedNote);
    }
  };
  
  const executeCommand = (command: string) => {
      document.execCommand(command, false, undefined);
  };
  
  const getSelectionAndContent = () => {
    const selection = window.getSelection();
    let selectedText = '';
    let entireNoteText = '';
    if(selectedNote?.content){
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = selectedNote.content;
        entireNoteText = tempDiv.textContent || tempDiv.innerText || '';
    }
    if (selection && !selection.isCollapsed) {
        selectedText = selection.toString();
    }
    return { selectedText, entireNoteText };
  }

  const handleAiCommand = async (command: 'summarize' | 'expand' | 'findActionItems' | 'createTable' | 'generateProposal', fullNote: boolean) => {
    if (!selectedNote) return;
    const { selectedText, entireNoteText } = getSelectionAndContent();
    let textToProcess = '';
    
    if (command === 'generateProposal') {
        const clientName = prompt("Enter the client's name for this proposal:");
        if (!clientName) return;
        textToProcess = clientName;
        fullNote = true;
    } else if (fullNote) {
        textToProcess = entireNoteText;
    } else if (selectedText) {
        textToProcess = selectedText;
    } else {
        alert("Please select some text or choose a command for the entire note.");
        return;
    }

    setIsAiLoading(true);
    const result = await generateTextForNote(command, textToProcess, entireNoteText);
    
    if (typeof result === 'string') {
        const htmlResult = command === 'generateProposal' ? `<h3>Proposal for ${textToProcess}</h3><p>${result.replace(/\n/g, '<br/>')}</p>` : `<hr><h2>AI ${command}d Summary:</h2><p>${result}</p>`;
        handleContentChange(selectedNote.content + htmlResult);
    } else if (Array.isArray(result) && result.length > 0) {
        const actionItemsHtml = result.map(item => `<li>${item.title}</li>`).join('');
        handleContentChange(selectedNote.content + `<hr><h2>AI Found Action Items:</h2><ul>${actionItemsHtml}</ul>`);
        result.forEach((item: ActionItem) => addTask(item.title, selectedNote.notebookId));
    }
    setIsAiLoading(false);
  };

  const handleChatWithSelection = () => {
      const { selectedText } = getSelectionAndContent();
      if (!selectedText) {
          alert("Please select text to chat about.");
          return;
      }
      startChatWithContext(selectedText, 'selection');
  }

  const handleCreateNewNote = async (type: 'blank' | 'ai_daily_planner' | 'case_study') => {
    if (!selectedNotebookId) { alert("Please select a notebook first!"); return; }
    setIsNewNoteModalOpen(false);
    
    let title = 'Untitled Note';
    let content = '<p></p>';
    
    if (type === 'ai_daily_planner') {
        title = `Daily Plan - ${new Date().toLocaleDateString()}`;
        setIsAiLoading(true);
        // FIX: Changed 'ai_daily_planner' to 'daily_planner' to match the function's expected parameter type.
        const data = await generateNoteFromTemplate('daily_planner');
        setIsAiLoading(false);
        if(data && !data.error) {
            content = `<h2>Top Priorities</h2><ul>${data.priorities.map((p: string) => `<li>${p}</li>`).join('')}</ul>`;
            const scheduleRows = data.schedule.map((s: {time: string, task: string}) => `<tr><td style="border: 1px solid; padding: 4px;">${s.time}</td><td style="border: 1px solid; padding: 4px;">${s.task}</td></tr>`).join('');
            content += `<h2>Schedule</h2><table style="width: 100%; border-collapse: collapse;"><thead><tr><th style="border: 1px solid; padding: 4px;">Time</th><th style="border: 1px solid; padding: 4px;">Task</th></tr></thead><tbody>${scheduleRows}</tbody></table>`;
            content += `<h2>Mindfulness Moment</h2><p>${data.mindfulness_moment}</p>`;
            content += `<h2>Notes</h2><p>${data.notes}</p>`;
        } else { content = `<h2>Error generating planner</h2><p>Please try again.</p>`; }
    } else if (type === 'case_study') {
        const { title: templateTitle, content: templateContent } = await generateNoteFromTemplate('case_study');
        title = templateTitle;
        content = templateContent;
    }
    
    const newNote: Note = { id: Date.now(), notebookId: selectedNotebookId, title, content, createdAt: new Date(), archived: false, flagged: false, tags: [] };
    setNotes(prev => [newNote, ...prev]);
    setSelectedNote(newNote);
  }

  const handleDeleteNote = (noteId: number) => {
    if (window.confirm(`Are you sure you want to permanently delete this note? This action cannot be undone.`)) {
      setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
    }
  };
  
  const handleNotePropertyUpdate = (noteToUpdate: Note, property: keyof Note, value: any) => {
    updateNote({ ...noteToUpdate, [property]: value });
  };
  
  const handleGenerateThumbnail = async () => {
      if (!selectedNote) return;
      setIsAiLoading(true);
      const imageUrl = await generateImageForNote(selectedNote.title);
      updateNote({ ...selectedNote, thumbnailUrl: imageUrl });
      setIsAiLoading(false);
  }

  const handleCreateNotebook = () => {
    const newNotebook: Notebook = { id: Date.now(), title: "New Notebook", color: '#888888' };
    setNotebooks(prev => [...prev, newNotebook]);
    setSelectedNotebookId(newNotebook.id);
  };
  
  const handleUpdateNotebookTitle = (id: number, newTitle: string) => {
      setNotebooks(prev => prev.map(nb => nb.id === id ? {...nb, title: newTitle} : nb));
      setEditingNotebookId(null);
  };

  const handleDeleteNotebook = (id: number) => {
      const notebook = notebooks.find(nb => nb.id === id);
      if(window.confirm(`Are you sure you want to delete the notebook "${notebook?.title}" and all its notes? This is permanent.`)) {
          setNotebooks(prev => prev.filter(nb => nb.id !== id));
          setNotes(prev => prev.filter(n => n.notebookId !== id));
          if(selectedNotebookId === id) {
              setSelectedNotebookId(notebooks[0]?.id || 0);
          }
      }
  }


  return (
    <>
    {isNewNoteModalOpen && <NewNoteModal onClose={() => setIsNewNoteModalOpen(false)} onCreate={handleCreateNewNote} />}
    <div className="flex h-[78vh]">
      {/* Sidebar */}
      <div className="w-1/3 card rounded-2xl p-4 flex flex-col">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <h2 className="text-xl font-bold font-display">Notebooks</h2>
             <div className="flex gap-2">
                <button onClick={handleCreateNotebook} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10" aria-label="New Notebook"><PlusCircleIcon className="w-5 h-5"/></button>
                <button onClick={() => setIsNewNoteModalOpen(true)} className="flex items-center justify-center gap-1.5 text-sm font-semibold py-1.5 px-3 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors disabled:opacity-50" disabled={!selectedNotebookId}>
                    New Note
                </button>
             </div>
        </div>
        <ul className="space-y-1 mb-4 flex-shrink-0 overflow-y-auto">
            {notebooks.map(nb => (
                <li key={nb.id} onDoubleClick={() => setEditingNotebookId(nb.id)} onClick={() => setSelectedNotebookId(nb.id)}
                    className={`group flex items-center gap-3 p-2 rounded-lg cursor-pointer font-semibold transition-colors ${selectedNotebookId === nb.id ? 'bg-accent text-white shadow-inner' : 'hover:bg-light-card dark:hover:bg-dark-card'}`}>
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: nb.color || 'grey' }}></span>
                    {editingNotebookId === nb.id ? (
                        <input type="text" defaultValue={nb.title} autoFocus onBlur={(e) => handleUpdateNotebookTitle(nb.id, e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleUpdateNotebookTitle(nb.id, e.currentTarget.value)} className="bg-transparent w-full outline-none ring-1 ring-white/50 rounded-sm px-1" />
                    ) : (
                        <span className="flex-grow truncate">{nb.title}</span>
                    )}
                     <button onClick={(e) => {e.stopPropagation(); handleDeleteNotebook(nb.id)}} className={`ml-auto opacity-0 group-hover:opacity-100 text-red-300 hover:text-red-500 transition-opacity ${selectedNotebookId === nb.id ? 'opacity-100 text-white/70 hover:text-white' : ''}`}><TrashIcon className="w-4 h-4"/></button>
                </li>
            ))}
        </ul>
        
        <div className="space-y-2 overflow-y-auto h-full pr-1">
          {displayedNotes.length > 0 ? displayedNotes.map(note => (
            <div key={note.id} onClick={() => setSelectedNote(note)}
                className={`relative group p-3 rounded-lg cursor-pointer border-l-4 ${selectedNote?.id === note.id ? 'border-accent bg-light-bg dark:bg-dark-bg' : 'border-transparent hover:bg-light-bg dark:hover:bg-dark-bg'}`}>
              <div className="flex items-start gap-3">
                 {note.thumbnailUrl ? <img src={note.thumbnailUrl} alt={note.title} className="w-16 h-12 object-cover rounded-md flex-shrink-0 bg-light-border"/> : <div className="w-16 h-12 rounded-md flex-shrink-0 bg-light-border dark:bg-dark-border"></div>}
                 <div className="flex-grow overflow-hidden">
                    <div className="flex items-center gap-2">
                        {note.flagged && <FlagIcon className="w-4 h-4 text-accent flex-shrink-0"/>}
                        <h3 className="font-semibold truncate">{note.title}</h3>
                    </div>
                    <p className={`text-xs truncate text-light-text-secondary dark:text-dark-text-secondary`}>{(note?.content || '').replace(/<[^>]*>?/gm, '') || 'Empty note...'}</p>
                 </div>
              </div>
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button onClick={(e) => { e.stopPropagation(); handleNotePropertyUpdate(note, 'flagged', !note.flagged); }} aria-label={note.flagged ? "Unflag note" : "Flag note"} className="p-1.5 rounded-full bg-light-card/80 dark:bg-dark-card/80 hover:bg-white/20"><FlagIcon className="w-4 h-4"/></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }} aria-label={"Delete note"} className="p-1.5 rounded-full bg-light-card/80 dark:bg-dark-card/80 hover:bg-white/20"><TrashIcon className="w-4 h-4 text-red-500"/></button>
              </div>
            </div>
          )) : (
            <div className="text-center text-light-text-secondary dark:text-dark-text-secondary py-10">
                <p>No notes in this notebook.</p>
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="w-2/3 pl-6">
        {selectedNote ? (
          <div className="h-full flex flex-col card rounded-2xl overflow-hidden shadow-sm">
            <div className="flex-shrink-0 p-4 border-b border-light-border dark:border-dark-border">
                <div className="relative flex justify-between items-center">
                    <input 
                        type="text" 
                        value={selectedNote.title}
                        onChange={(e) => {
                            handleTitleChange(e.target.value);
                            setSuggestedTitle(null); // Hide suggestion on manual edit
                        }}
                        className="text-2xl font-bold bg-transparent focus:outline-none w-full font-display"
                        placeholder="Untitled Note"
                        aria-label="Note title"
                    />
                    <div className="flex items-center gap-2">
                        <button onClick={handleGenerateThumbnail} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10" aria-label="Generate Thumbnail"><PhotoIcon className="w-5 h-5"/></button>
                        <button onClick={() => addTask(selectedNote.title, selectedNote.notebookId)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10" aria-label="Add to Schedule"><PlusCircleIcon className="w-5 h-5"/></button>
                        <button onClick={() => startChatWithContext(getSelectionAndContent().entireNoteText, 'note')} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10" aria-label="Chat about this note"><ChatBubbleLeftEllipsisIcon className="w-5 h-5"/></button>
                        <button onClick={() => handleDeleteNote(selectedNote.id)} className="p-2 rounded-full text-red-500 hover:bg-red-500/10" aria-label="Delete Note"><TrashIcon className="w-5 h-5"/></button>
                    </div>
                </div>
                {suggestedTitle && (
                    <div className="mt-2 p-2 bg-light-bg dark:bg-dark-bg rounded-lg shadow-sm border border-light-border dark:border-dark-border animate-fade-in-fast z-10 flex items-center justify-between gap-2">
                        <p className="text-sm">AI Suggestion: <span className="font-semibold">{suggestedTitle}</span></p>
                        <button onClick={() => { handleTitleChange(suggestedTitle); setSuggestedTitle(null); }} className="text-xs font-bold text-accent px-2 py-1 rounded bg-accent/10 hover:bg-accent/20">Accept</button>
                    </div>
                )}
            </div>
            
            <EditorToolbar onCommand={executeCommand} onAiCommand={handleAiCommand} onChat={handleChatWithSelection} />
            
            <div className="flex-grow overflow-y-auto relative">
                <LightweightEditor content={selectedNote.content} onChange={handleContentChange} />
                {isAiLoading && <div className="absolute bottom-0 left-0 w-full text-sm p-4 border-t border-light-border dark:border-dark-border text-light-text-secondary dark:text-dark-text-secondary animate-pulse card">Kiko AI is working...</div>}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-light-text-secondary dark:text-dark-text-secondary card rounded-2xl">
            <DocumentIcon className="w-20 h-20 mb-4" />
            <h3 className="text-2xl font-bold font-display text-light-text dark:text-dark-text">Select or Create a Note</h3>
            <p className="max-w-xs text-center mt-2">Your ideas, plans, and learnings live here.</p>
             <button onClick={() => setIsNewNoteModalOpen(true)} className="mt-6 flex items-center justify-center gap-2 text-white font-bold py-2 px-5 rounded-lg bg-accent hover:bg-accent-hover transition-colors" disabled={!selectedNotebookId}>
                <PlusCircleIcon className="w-5 h-5"/> Create New Note
            </button>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default Notes;
