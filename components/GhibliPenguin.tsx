import React from 'react';
import { motion } from 'framer-motion';

/**
 * GhibliPenguin Component
 * 
 * A charming Studio Ghibli-inspired penguin mascot for SOEN.
 * Used across Profile and Dashboard components.
 */
const GhibliPenguin: React.FC = () => {
    return (
        <motion.div
            className="relative w-full h-full"
            animate={{ 
                rotate: [0, 3, -3, 0],
                scale: [1, 1.05, 1],
                y: [0, -3, 0]
            }}
            transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: 'easeInOut' 
            }}
        >
            <div 
                className="absolute inset-0 rounded-full"
                style={{ 
                    background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 30%, #4a5568 70%, #2d3748 100%)',
                    boxShadow: `
                        inset 0 3px 6px rgba(255,255,255,0.15),
                        inset 0 -3px 6px rgba(0,0,0,0.4),
                        0 6px 16px rgba(0,0,0,0.5),
                        0 0 0 2px rgba(255,255,255,0.2)
                    `,
                    transform: 'perspective(120px) rotateX(10deg) rotateY(-3deg)'
                }}
            >
                <div 
                    className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-7 h-6 rounded-full"
                    style={{
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #e2e8f0 100%)',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1), 0 2px 4px rgba(255,255,255,0.3)'
                    }}
                />
                <div 
                    className="absolute top-1.5 left-1.5 w-3 h-3 rounded-full"
                    style={{
                        background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #f0f4f8 50%, #e2e8f0 100%)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.8)'
                    }}
                />
                <div 
                    className="absolute top-1.5 right-1.5 w-3 h-3 rounded-full"
                    style={{
                        background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #f0f4f8 50%, #e2e8f0 100%)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.8)'
                    }}
                />
                <div className="absolute top-2.5 left-2.5 w-1.5 h-1.5 bg-black rounded-full"></div>
                <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-black rounded-full"></div>
                <div className="absolute top-2 left-2 w-0.5 h-0.5 bg-white rounded-full opacity-90"></div>
                <div className="absolute top-2 right-2 w-0.5 h-0.5 bg-white rounded-full opacity-90"></div>
                <svg 
                    className="absolute top-4 left-1/2 transform -translate-x-1/2 w-3 h-2"
                    viewBox="0 0 12 8"
                    style={{ fill: 'none', stroke: '#2d3748', strokeWidth: '1.5', strokeLinecap: 'round' }}
                >
                    <path d="M2 4 Q6 6 10 4" />
                </svg>
                <div 
                    className="absolute top-3.5 left-1/2 transform -translate-x-1/2 w-1 h-0.8 rounded-full"
                    style={{
                        background: 'linear-gradient(135deg, #f6ad55 0%, #ed8936 100%)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.3)'
                    }}
                />
                <div 
                    className="absolute top-4 left-0.5 w-1.5 h-1.5 rounded-full opacity-70"
                    style={{ background: 'radial-gradient(circle, #fbb6ce 0%, #f687b3 100%)' }}
                />
                <div 
                    className="absolute top-4 right-0.5 w-1.5 h-1.5 rounded-full opacity-70"
                    style={{ background: 'radial-gradient(circle, #fbb6ce 0%, #f687b3 100%)' }}
                />
            </div>
            {[...Array(3)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-yellow-300 rounded-full"
                    style={{
                        left: `${20 + i * 30}%`,
                        top: `${10 + i * 20}%`,
                    }}
                    animate={{
                        opacity: [0, 1, 0],
                        scale: [0.5, 1, 0.5],
                        y: [0, -10, 0]
                    }}
                    transition={{
                        duration: 2 + i * 0.5,
                        repeat: Infinity,
                        delay: i * 0.7,
                        ease: "easeInOut"
                    }}
                />
            ))}
        </motion.div>
    );
};

export default GhibliPenguin;

