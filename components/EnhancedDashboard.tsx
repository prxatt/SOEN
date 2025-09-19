import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, Text, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Task, Note, HealthData, Goal, Category, MissionBriefing, Screen } from '../types';
import { 
    SparklesIcon, CheckCircleIcon, FireIcon, PlusIcon, 
    CalendarDaysIcon, DocumentTextIcon, ChevronRightIcon,
    HeartIcon, BoltIcon, ClockIcon, PlayIcon, HomeIcon,
    UserCircleIcon, BabyPenguinIcon, GiftIcon
} from './Icons';

// Floating particles component
function FloatingParticles({ count = 100 }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempObject = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!meshRef.current) return;
    
    for (let i = 0; i < count; i++) {
      tempObject.position.set(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20
      );
      tempObject.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      tempObject.scale.setScalar(Math.random() * 0.5 + 0.5);
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [count, tempObject]);

  useFrame((state) => {
    if (!meshRef.current) return;
    
    for (let i = 0; i < count; i++) {
      tempObject.position.y += Math.sin(state.clock.elapsedTime + i) * 0.01;
      tempObject.rotation.x += 0.01;
      tempObject.rotation.y += 0.01;
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.1, 8, 8]} />
      <meshBasicMaterial color="#3b82f6" transparent opacity={0.6} />
    </instancedMesh>
  );
}

// 3D Background component
function Background3D() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 75 }}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <FloatingParticles count={50} />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
    </Canvas>
  );
}

interface EnhancedDashboardProps {
    tasks: Task[];
    notes: Note[];
    healthData: HealthData;
    briefing: MissionBriefing;
    goals: Goal[];
    setFocusTask: (task: Task | null) => void;
    dailyCompletionImage: string | null;
    categoryColors: Record<Category, string>;
    isBriefingLoading: boolean;
    navigateToScheduleDate: (date: Date) => void;
    inferredLocation: string | null;
    setScreen: (screen: Screen) => void;
    onCompleteTask: (taskId: number) => void;
}

export default function EnhancedDashboard(props: EnhancedDashboardProps) {
    const { tasks, notes, healthData, briefing, categoryColors, onCompleteTask, setFocusTask } = props;
    const [activeTab, setActiveTab] = useState('today');
    const [hoveredNote, setHoveredNote] = useState<number | null>(null);

    const todayTasks = useMemo(() => 
        tasks.filter(t => new Date(t.startTime).toDateString() === new Date().toDateString())
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
        [tasks]
    );

    const tomorrowTasks = useMemo(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tasks.filter(t => new Date(t.startTime).toDateString() === tomorrow.toDateString())
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    }, [tasks]);

    const completedToday = todayTasks.filter(t => t.status === 'Completed').length;
    const completionRate = todayTasks.length > 0 ? Math.round((completedToday / todayTasks.length) * 100) : 0;

    // Daily greeting with time-based message
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    // Philosophical quotes for daily inspiration
    const dailyQuotes = [
        "The best way to find yourself is to lose yourself in the service of others.",
        "No act of kindness, no matter how small, is ever wasted.",
        "Love and kindness are never wasted. They always make a difference.",
        "Be yourself; everyone else is already taken. But make sure that self is kind.",
        "The meaning of life is to find your gift. The purpose of life is to give it away.",
        "In a world where you can be anything, be kind. It costs nothing but means everything."
    ];

    const todayQuote = dailyQuotes[new Date().getDate() % dailyQuotes.length];

    const renderTasks = (taskList: Task[], title: string) => (
        <div className="space-y-3">
            <h4 className="text-white font-semibold text-lg mb-3">{title}</h4>
            {taskList.length > 0 ? (
                taskList.slice(0, 3).map((task) => (
                    <motion.div
                        key={task.id}
                        className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-200"
                        whileHover={{ scale: 1.02, x: 5 }}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: categoryColors[task.category] }}
                        />
                        <div className="flex-1">
                            <p className="text-white font-medium text-sm">{task.title}</p>
                            <p className="text-gray-400 text-xs">
                                {new Date(task.startTime).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                })} • {task.plannedDuration} min
                            </p>
                        </div>
                        <button
                            onClick={() => onCompleteTask(task.id)}
                            className="p-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                        >
                            <CheckCircleIcon className="w-4 h-4" />
                        </button>
                    </motion.div>
                ))
            ) : (
                <p className="text-gray-400 text-sm text-center py-4">No tasks scheduled</p>
            )}
        </div>
    );

    const renderNotes = () => (
        <div className="space-y-3">
            <h4 className="text-white font-semibold text-lg mb-3">Recent Notes</h4>
            {notes.slice(0, 3).map((note) => (
                <motion.div
                    key={note.id}
                    className="p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-200 cursor-pointer"
                    whileHover={{ scale: 1.02, x: 5 }}
                    onHoverStart={() => setHoveredNote(note.id)}
                    onHoverEnd={() => setHoveredNote(null)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h5 className="text-white font-medium text-sm mb-1">{note.title}</h5>
                    <p className="text-gray-400 text-xs line-clamp-2" dangerouslySetInnerHTML={{ __html: note.content }} />
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">
                            {new Date(note.updatedAt).toLocaleDateString()}
                        </span>
                        {note.flagged && <span className="text-xs text-yellow-400">⭐</span>}
                    </div>
                </motion.div>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen w-full relative overflow-hidden">
            {/* 3D Background - Hidden on mobile for performance */}
            <div className="hidden md:block">
                <Background3D />
            </div>
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-gray-900/60 to-black/80" />
            
            {/* Main Content */}
            <div className="relative z-10 min-h-screen">
                {/* Header */}
                <div className="sticky top-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/10">
                    <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
                        <div className="flex items-center justify-between mb-4 md:mb-6">
                            <div className="flex items-center gap-3 md:gap-4">
                                <motion.div
                                    className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center"
                                    whileHover={{ rotate: 360 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <span className="text-white font-bold text-lg md:text-xl">P</span>
                                </motion.div>
                                <div>
                                    <h1 className="text-white font-bold text-xl md:text-2xl">Praxis AI</h1>
                                    <p className="text-gray-400 text-xs md:text-sm">Command Center</p>
                                </div>
                            </div>
                            
                            <motion.button
                                onClick={() => props.setScreen('Kiko')}
                                className="flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl md:rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg shadow-purple-500/25"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <BabyPenguinIcon className="w-4 h-4 md:w-5 md:h-5" />
                                <span className="font-semibold text-sm md:text-base">Kiko AI</span>
                            </motion.button>
                        </div>
                        
                        {/* Tab Navigation */}
                        <div className="flex gap-1 md:gap-2 overflow-x-auto pb-2">
                            {[
                                { id: 'today', label: 'Today', count: todayTasks.length },
                                { id: 'tomorrow', label: 'Tomorrow', count: tomorrowTasks.length },
                                { id: 'notes', label: 'Notes', count: notes.length }
                            ].map((tab) => (
                                <motion.button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl font-semibold transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                                        activeTab === tab.id
                                            ? 'bg-white text-black shadow-lg'
                                            : 'text-white/80 hover:text-white hover:bg-white/10'
                                    }`}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {tab.label}
                                    <span className="ml-1 md:ml-2 px-1.5 md:px-2 py-0.5 md:py-1 bg-white/20 rounded-full text-xs">
                                        {tab.count}
                                    </span>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="max-w-7xl mx-auto px-4 py-4 md:py-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8"
                    >
                        {/* Left Column - Daily Greeting & Stats */}
                        <div className="lg:col-span-2 space-y-4 md:space-y-8">
                            {/* Daily Greeting */}
                            <motion.div
                                className="text-center py-8 md:py-12 bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-2xl md:rounded-3xl border border-white/10 backdrop-blur-sm relative overflow-hidden"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.8 }}
                            >
                                {/* Animated background elements */}
                                <div className="absolute inset-0">
                                    {[...Array(20)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            className="absolute w-2 h-2 bg-blue-400/20 rounded-full"
                                            style={{
                                                left: `${Math.random() * 100}%`,
                                                top: `${Math.random() * 100}%`,
                                            }}
                                            animate={{
                                                y: [0, -20, 0],
                                                opacity: [0, 1, 0],
                                            }}
                                            transition={{
                                                duration: 3 + Math.random() * 2,
                                                repeat: Infinity,
                                                delay: Math.random() * 2,
                                            }}
                                        />
                                    ))}
                                </div>
                                
                                <div className="relative z-10 px-4">
                                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-3 md:mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                        {getGreeting()}
                                    </h1>
                                    <p className="text-gray-300 text-lg md:text-xl italic max-w-3xl mx-auto leading-relaxed mb-4 md:mb-6">
                                        "{todayQuote}"
                                    </p>
                                    <div className="text-xs md:text-sm text-gray-400">
                                        {new Date().toLocaleDateString('en-US', { 
                                            weekday: 'long', 
                                            month: 'long', 
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                                {[
                                    { 
                                        icon: CheckCircleIcon, 
                                        label: 'Tasks Today', 
                                        value: todayTasks.length, 
                                        subtext: `${completedToday} completed`,
                                        color: 'blue'
                                    },
                                    { 
                                        icon: FireIcon, 
                                        label: 'Completion Rate', 
                                        value: `${completionRate}%`, 
                                        subtext: "Today's progress",
                                        color: 'green'
                                    },
                                    { 
                                        icon: SparklesIcon, 
                                        label: 'Notes', 
                                        value: notes.length, 
                                        subtext: 'Total notes',
                                        color: 'purple'
                                    }
                                ].map((stat, index) => (
                                    <motion.div
                                        key={stat.label}
                                        className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300"
                                        whileHover={{ scale: 1.05, y: -5 }}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className={`w-10 h-10 bg-${stat.color}-500/20 rounded-xl flex items-center justify-center`}>
                                                <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
                                            </div>
                                            <h3 className="text-white font-semibold">{stat.label}</h3>
                                        </div>
                                        <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                                        <p className="text-gray-400 text-sm">{stat.subtext}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Right Column - Dynamic Content */}
                        <div className="space-y-4 md:space-y-6">
                            <motion.div
                                className="bg-white/5 rounded-xl md:rounded-2xl p-4 md:p-6 border border-white/10 backdrop-blur-sm"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                            >
                                <AnimatePresence mode="wait">
                                    {activeTab === 'today' && (
                                        <motion.div
                                            key="today"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            {renderTasks(todayTasks, 'Today\'s Tasks')}
                                        </motion.div>
                                    )}
                                    {activeTab === 'tomorrow' && (
                                        <motion.div
                                            key="tomorrow"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            {renderTasks(tomorrowTasks, 'Tomorrow\'s Tasks')}
                                        </motion.div>
                                    )}
                                    {activeTab === 'notes' && (
                                        <motion.div
                                            key="notes"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            {renderNotes()}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}