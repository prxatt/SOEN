import React from 'react';

// Mobile-first responsive styles component inspired by TaskFlow design
export const MobileOptimizedStyles = () => (
    <style>{`
        /* TaskFlow-inspired Mobile-First Design System */
        
        /* Base responsive layout */
        .dashboard-container {
            min-height: 100vh;
            background: #FAFAFA;
            padding: 1rem;
            font-family: 'Public Sans', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        /* Mobile breakpoints */
        @media (max-width: 768px) {
            .dashboard-container {
                padding: 0.75rem;
            }
            
            .dashboard-grid {
                grid-template-columns: 1fr !important;
                gap: 1rem !important;
            }
            
            .compact-card {
                padding: 1rem !important;
                margin: 0 !important;
            }
            
            .task-card {
                padding: 0.75rem !important;
            }
            
            .metric-card {
                padding: 0.75rem !important;
            }
            
            .habit-grid {
                grid-template-columns: 1fr !important;
            }
        }
        
        /* Tablet breakpoints */
        @media (min-width: 768px) and (max-width: 1024px) {
            .habit-grid {
                grid-template-columns: repeat(2, 1fr) !important;
            }
            
            .dashboard-grid {
                grid-template-columns: repeat(2, 1fr) !important;
            }
        }
        
        /* Desktop optimization */
        @media (min-width: 1024px) {
            .dashboard-container {
                padding: 1.5rem;
                margin-left: 4rem; /* Account for navigation */
            }
        }
        
        /* TaskFlow-inspired visual hierarchy */
        .task-card-bg-primary { background: #5D8BFF; }
        .task-card-bg-teal { background: #65F5ED; }
        .task-card-bg-yellow { background: #FCFF52; }
        .task-card-bg-dark { background: #101C2E; }
        
        /* Improved text contrast */
        .text-high-contrast {
            color: #101C2E;
            font-weight: 600;
        }
        
        .text-medium-contrast {
            color: #4B5563;
            font-weight: 500;
        }
        
        .text-low-contrast {
            color: #6B7280;
            font-weight: 400;
        }
        
        /* Enhanced focus states for accessibility */
        .interactive-element:focus {
            outline: 2px solid #5D8BFF;
            outline-offset: 2px;
            border-radius: 0.5rem;
        }
        
        /* Smooth animations */
        .smooth-transition {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .smooth-scale:hover {
            transform: scale(1.02);
        }
        
        .smooth-scale:active {
            transform: scale(0.98);
        }
        
        /* Mobile touch targets */
        @media (max-width: 768px) {
            .touch-target {
                min-height: 44px;
                min-width: 44px;
            }
            
            .expandable-section {
                padding: 1rem;
            }
            
            .expandable-content {
                padding: 0.75rem;
                margin-top: 0.5rem;
            }
        }
        
        /* Safe area handling for mobile devices */
        .safe-area-padding {
            padding-bottom: env(safe-area-inset-bottom);
            padding-left: env(safe-area-inset-left);
            padding-right: env(safe-area-inset-right);
        }
        
        /* Improved scrolling on mobile */
        .mobile-scroll {
            -webkit-overflow-scrolling: touch;
            overscroll-behavior: contain;
        }
        
        /* TaskFlow-inspired card shadows */
        .card-shadow {
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
        }
        
        .card-shadow-hover {
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        /* Progress bars with better visibility */
        .progress-bar {
            height: 8px;
            background: #E5E7EB;
            border-radius: 9999px;
            overflow: hidden;
        }
        
        .progress-fill {
            height: 100%;
            border-radius: 9999px;
            transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Habit calendar grid */
        .habit-calendar {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 0.25rem;
        }
        
        .habit-day {
            aspect-ratio: 1;
            border-radius: 0.375rem;
            transition: all 0.2s;
        }
        
        .habit-day-completed {
            background: #10B981;
        }
        
        .habit-day-missed {
            background: #E5E7EB;
        }
        
        /* Improved typography scale */
        .text-display {
            font-size: 2rem;
            font-weight: 700;
            line-height: 1.2;
        }
        
        .text-headline {
            font-size: 1.5rem;
            font-weight: 600;
            line-height: 1.3;
        }
        
        .text-title {
            font-size: 1.25rem;
            font-weight: 600;
            line-height: 1.4;
        }
        
        .text-body {
            font-size: 1rem;
            font-weight: 400;
            line-height: 1.5;
        }
        
        .text-caption {
            font-size: 0.875rem;
            font-weight: 400;
            line-height: 1.4;
        }
        
        .text-small {
            font-size: 0.75rem;
            font-weight: 400;
            line-height: 1.3;
        }
        
        /* Mobile-first responsive text */
        @media (max-width: 768px) {
            .text-display { font-size: 1.75rem; }
            .text-headline { font-size: 1.25rem; }
            .text-title { font-size: 1.125rem; }
        }
        
        /* Enhanced button styles */
        .btn-primary {
            background: #5D8BFF;
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 0.75rem;
            font-weight: 600;
            border: none;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .btn-primary:hover {
            background: #4F46E5;
            transform: translateY(-1px);
        }
        
        .btn-secondary {
            background: rgba(93, 139, 255, 0.1);
            color: #5D8BFF;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            font-weight: 500;
            border: 1px solid rgba(93, 139, 255, 0.2);
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .btn-secondary:hover {
            background: rgba(93, 139, 255, 0.2);
        }
        
        /* Loading states */
        .skeleton {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: loading 1.5s infinite;
        }
        
        @keyframes loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }
        
        /* Accessibility improvements */
        .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        }
        
        /* High contrast mode support */
        @media (prefers-contrast: high) {
            .card-shadow {
                border: 1px solid #000;
            }
            
            .progress-bar {
                border: 1px solid #000;
            }
        }
        
        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
            .smooth-transition,
            .progress-fill,
            .habit-day {
                transition: none;
            }
            
            .smooth-scale:hover {
                transform: none;
            }
        }
        
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
            .dashboard-container {
                background: #111827;
                color: #F9FAFB;
            }
            
            .card-shadow {
                background: #1F2937;
                border: 1px solid #374151;
            }
            
            .text-high-contrast { color: #F9FAFB; }
            .text-medium-contrast { color: #D1D5DB; }
            .text-low-contrast { color: #9CA3AF; }
        }
    `}</style>
);

export default MobileOptimizedStyles;
