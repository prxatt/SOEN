import React from 'react';
import type { HealthData, Task } from '../types';

interface MobileDashboardTilesProps {
  healthData: HealthData;
  tasks: Task[];
  // Optional dynamic props to avoid hardcoding placeholder values
  weightChangeKg?: number;                // e.g., -3 (kg)
  weightChangePercent?: number;           // e.g., -3.8 (percent)
  calorieTrendPct?: number;               // e.g., +4.6 (percent)
  meal?: { title: string; kcal: number }; // e.g., { title: 'Breakfast', kcal: 260 }
  macros?: { proteins: number; carbs: number; fats: number; rdcPercent: number };
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

export default function MobileDashboardTiles({ healthData, tasks, weightChangeKg, weightChangePercent, calorieTrendPct, meal, macros }: MobileDashboardTilesProps) {
  const today = new Date().toDateString();
  const todaysCalories = Math.round(healthData?.caloriesBurned ?? 0);
  const todaysTasks = tasks.filter(t => new Date(t.startTime).toDateString() === today);
  const completionPct = todaysTasks.length
    ? Math.round((todaysTasks.filter(t => t.status === 'Completed').length / todaysTasks.length) * 100)
    : 0;

  const computedMeal = meal ?? { title: 'Breakfast', kcal: 260 };
  const computedMacros = macros ?? { proteins: 58.6, carbs: 48.8, fats: 20.3, rdcPercent: 16 };

  return (
    <section className="md:hidden space-y-4 pb-20">
      {/* Progress */}
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
              <div className="text-lg font-semibold leading-none">{todaysCalories}</div>
              <div className="text-[11px] leading-tight">Calories</div>
            </div>
          </div>
        </div>
      </div>

      {/* Row: Weight + Calories Today */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-3xl p-5" style={{ backgroundColor: '#0C3732', color: TILE_COLORS.white }}>
          <p className="text-sm/5 opacity-90">Current Weight</p>
          <div className="mt-1 text-xs opacity-80">{typeof weightChangeKg === 'number' && typeof weightChangePercent === 'number' ? `${weightChangeKg > 0 ? '+' : ''}${weightChangeKg} Kg (${weightChangePercent > 0 ? '+' : ''}${weightChangePercent}%)` : '—'}</div>
        </div>
        <div className="rounded-3xl p-5" style={{ backgroundColor: TILE_COLORS.yellow, color: TILE_COLORS.black }}>
          <p className="text-sm/5">Today's Calories</p>
          <div className="mt-2 text-3xl font-extrabold">{todaysCalories}<span className="text-base font-semibold ml-1">Kcal</span></div>
          <div className="mt-1 text-xs opacity-90">{typeof calorieTrendPct === 'number' ? `${calorieTrendPct > 0 ? '+' : ''}${calorieTrendPct}% trend` : '—'}</div>
        </div>
      </div>

      {/* Macros card */}
      <div className="rounded-3xl p-5" style={{ backgroundColor: '#CBD5FF', color: TILE_COLORS.black }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-semibold">{computedMeal.title}</p>
            <p className="text-sm opacity-80">{computedMeal.kcal} Kcal</p>
          </div>
          <button className="w-9 h-9 rounded-full border border-black/10 flex items-center justify-center" aria-label="Add item">
            <span className="text-xl leading-none">+</span>
          </button>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-3 text-center">
          <div>
            <div className="text-[11px] opacity-80">Proteins</div>
            <div className="text-base font-semibold">{computedMacros.proteins}</div>
          </div>
          <div>
            <div className="text-[11px] opacity-80">Carbs</div>
            <div className="text-base font-semibold">{computedMacros.carbs}</div>
          </div>
          <div>
            <div className="text-[11px] opacity-80">Fats</div>
            <div className="text-base font-semibold">{computedMacros.fats}</div>
          </div>
          <div>
            <div className="text-[11px] opacity-80">RDC</div>
            <div className="text-base font-semibold">{computedMacros.rdcPercent}%</div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <button className="px-3 py-2 rounded-lg bg-black text-white text-xs font-medium">Today</button>
          <button className="px-3 py-2 rounded-lg border border-black/10 text-xs font-medium">Edit</button>
        </div>
      </div>
    </section>
  );
}


