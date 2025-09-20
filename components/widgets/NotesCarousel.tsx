/**
 * NotesCarousel Component
 * 
 * Displays notes in an interactive carousel format
 * Features:
 * - Cinematic carousel design
 * - Note previews
 * - Interactive navigation
 * - Smooth animations
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Note, Screen } from '../../types';
import { DocumentTextIcon, ChevronLeftIcon, ChevronRightIcon, StarIcon } from '../Icons';

interface NotesCarouselProps {
    notes: Note[];
    setScreen: (screen: Screen) => void;
}

const NotesCarousel: React.FC<NotesCarouselProps> = ({ notes, setScreen }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [hoveredNote, setHoveredNote] = useState<number | null>(null);

    // Process notes for display
    const processedNotes = useMemo(() => {
        return notes.map(note => ({
            ...note,
            preview: note.content.replace(/<[^>]*>/g, '').substring(0, 150) + '...',
            wordCount: note.content.split(' ').length,
            readTime: Math.ceil(note.content.split(' ').length / 200) // Assuming 200 WPM
        }));
    }, [notes]);

    const nextNote = () => {
        setCurrentIndex((prev) => (prev + 1) % processedNotes.length);
    };

    const prevNote = () => {
        setCurrentIndex((prev) => (prev - 1 + processedNotes.length) % processedNotes.length);
    };

    const goToNote = (index: number) => {
        setCurrentIndex(index);
    };

    if (processedNotes.length === 0) {
        return (
            <div className="text-center py-12">
                <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-white text-2xl font-bold mb-2">No Notes Yet</h3>
                <p className="text-gray-400 mb-6">Start capturing your thoughts and ideas</p>
                <motion.button
                    onClick={() => setScreen('Notes')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    Create Your First Note
                </motion.button>
            </div>
        );
    }

    const currentNote = processedNotes[currentIndex];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2">Recent Notes</h2>
                <p className="text-gray-400">Your thoughts and ideas at a glance</p>
            </div>

            {/* Main Carousel */}
            <div className="relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white/5 rounded-2xl p-8 border border-white/10 backdrop-blur-sm"
                    >
                        {/* Note Header */}
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex-1">
                                <h3 className="text-white text-2xl font-bold mb-2">{currentNote.title}</h3>
                                <div className="flex items-center gap-4 text-gray-400 text-sm">
                                    <span>{currentNote.wordCount} words</span>
                                    <span>•</span>
                                    <span>{currentNote.readTime} min read</span>
                                    <span>•</span>
                                    <span>{new Date(currentNote.updatedAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                            {currentNote.flagged && (
                                <div className="flex items-center gap-2 text-yellow-400">
                                    <StarIcon className="w-5 h-5" />
                                    <span className="text-sm font-medium">Flagged</span>
                                </div>
                            )}
                        </div>

                        {/* Note Content Preview */}
                        <div className="mb-6">
                            <p className="text-gray-300 text-lg leading-relaxed">
                                {currentNote.preview}
                            </p>
                        </div>

                        {/* Note Actions */}
                        <div className="flex items-center justify-between">
                            <motion.button
                                onClick={() => setScreen('Notes')}
                                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <DocumentTextIcon className="w-5 h-5" />
                                View Full Note
                            </motion.button>

                            <div className="flex items-center gap-2">
                                <span className="text-gray-400 text-sm">
                                    {currentIndex + 1} of {processedNotes.length}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Navigation Arrows */}
                {processedNotes.length > 1 && (
                    <>
                        <motion.button
                            onClick={prevNote}
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <ChevronLeftIcon className="w-6 h-6" />
                        </motion.button>

                        <motion.button
                            onClick={nextNote}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <ChevronRightIcon className="w-6 h-6" />
                        </motion.button>
                    </>
                )}
            </div>

            {/* Note Thumbnails */}
            {processedNotes.length > 1 && (
                <div className="flex justify-center gap-2 overflow-x-auto pb-2">
                    {processedNotes.map((note, index) => (
                        <motion.button
                            key={note.id}
                            onClick={() => goToNote(index)}
                            className={`flex-shrink-0 w-16 h-16 rounded-lg border-2 transition-all duration-200 ${
                                index === currentIndex
                                    ? 'border-blue-500 bg-blue-500/20'
                                    : 'border-white/20 bg-white/5 hover:border-white/40'
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onHoverStart={() => setHoveredNote(note.id)}
                            onHoverEnd={() => setHoveredNote(null)}
                        >
                            <div className="w-full h-full flex items-center justify-center">
                                <DocumentTextIcon className={`w-6 h-6 ${
                                    index === currentIndex ? 'text-blue-400' : 'text-gray-400'
                                }`} />
                            </div>
                        </motion.button>
                    ))}
                </div>
            )}

            {/* Quick Stats */}
            <motion.div
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <div className="bg-white/5 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-white mb-1">{processedNotes.length}</div>
                    <div className="text-gray-400 text-sm">Total Notes</div>
                </div>

                <div className="bg-white/5 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-white mb-1">
                        {processedNotes.filter(note => note.flagged).length}
                    </div>
                    <div className="text-gray-400 text-sm">Flagged</div>
                </div>

                <div className="bg-white/5 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-white mb-1">
                        {Math.round(processedNotes.reduce((acc, note) => acc + note.wordCount, 0) / processedNotes.length)}
                    </div>
                    <div className="text-gray-400 text-sm">Avg Words</div>
                </div>
            </motion.div>

            {/* Call to Action */}
            <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <motion.button
                    onClick={() => setScreen('Notes')}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-blue-500/25"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    View All Notes
                </motion.button>
            </motion.div>
        </div>
    );
};

export default NotesCarousel;
