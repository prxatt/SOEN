import React from 'react';
import type { HealthData, Task } from '../types';

interface MobileDashboardTilesProps {
  healthData: HealthData;
  tasks: Task[];
}

// Vivid, non-gradient palette (no purple, no gradients)
const TILE_COLORS = {
  indigo: '#4F46E5',
  lime: '#D9F99D',
  yellow: '#FDE047',
  teal: '#2DD4BF',
  black: '#0B0B0C',
  white: '#FFFFFF'
} as const;

/**
 * Mobile Dashboard Tiles - Simplified version
 * 
 * Removed calorie/nutrition tracking per user requirements.
 * All health data comes from Apple Health integration only.
 * SOEN is not a calorie tracker.
 */
export default function MobileDashboardTiles({ healthData, tasks }: MobileDashboardTilesProps) {
  const today = new Date().toDateString();
  const todaysTasks = tasks.filter(t => new Date(t.startTime).toDateString() === today);
  const completionPct = todaysTasks.length
    ? Math.round((todaysTasks.filter(t => t.status === 'Completed').length / todaysTasks.length) * 100)
    : 0;

  return (
    <section className="md:hidden space-y-4 pb-20">
      {/* Progress Tile - Task completion percentage */}
      <div className="rounded-3xl p-5" style={{ backgroundColor: TILE_COLORS.indigo, color: TILE_COLORS.white }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm/5 opacity-90">Your Progress</p>
            <div className="mt-2 flex items-end gap-3">
              <span className="text-4xl font-extrabold">{completionPct}%</span>
              <span className="text-xs opacity-85">{new Date().toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
          <div className="rounded-2xl px-3 py-2" style={{ backgroundColor: TILE_COLORS.white, color: TILE_COLORS.black }}>
            <div className="text-center">
              <div className="text-lg font-semibold leading-none">{todaysTasks.length}</div>
              <div className="text-[11px] leading-tight">Tasks</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


