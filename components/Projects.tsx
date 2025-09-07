import React from 'react';
import { motion } from 'framer-motion';
import { Project } from '../types';
import { PlusCircleIcon, BriefcaseIcon } from './Icons';

interface ProjectsProps {
    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

// FIX: Refactor to a standard function component to avoid potential type issues with React.FC and framer-motion.
function Projects({ projects, setProjects }: ProjectsProps) {
    
    const addProject = () => {
        const newProject: Project = {
            id: Date.now(),
            title: "New Project",
            description: "A brief description of this new project."
        };
        setProjects(prev => [newProject, ...prev]);
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold font-display">Projects</h2>
                <button onClick={addProject} className="flex items-center justify-center gap-1.5 text-sm font-semibold py-2 px-4 rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors">
                    <PlusCircleIcon className="w-5 h-5"/> New Project
                </button>
            </div>
            
            {projects.length > 0 ? (
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {projects.map(project => (
                        <motion.div key={project.id} variants={itemVariants} className="card p-5 rounded-2xl flex flex-col justify-between hover:shadow-lg transition-shadow">
                           <div>
                                <h3 className="font-bold font-display text-xl mb-2">{project.title}</h3>
                                <p className="text-sm text-text-secondary">{project.description}</p>
                           </div>
                           <div className="mt-4 pt-4 border-t border-border">
                                <p className="text-xs font-semibold text-text-secondary">PROGRESS (DEMO)</p>
                                <div className="w-full bg-border rounded-full h-2.5 mt-1">
                                    <div className="bg-accent h-2.5 rounded-full" style={{width: `${Math.floor(Math.random() * 80) + 10}%`}}></div>
                                </div>
                           </div>
                        </motion.div>
                    ))}
                </motion.div>
            ) : (
                <div className="text-center text-text-secondary py-24">
                    <BriefcaseIcon className="w-16 h-16 mx-auto mb-4" />
                    <h3 className="text-xl font-bold font-display text-text">No Projects Yet</h3>
                    <p>Create your first project to start organizing your work.</p>
                </div>
            )}
        </div>
    );
};

export default Projects;
