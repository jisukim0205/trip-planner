import type { PlanColor } from '../types';

export const COLOR_MAP: Record<PlanColor, { bg: string; border: string; text: string; light: string }> = {
  coral:  { bg: 'bg-red-100',    border: 'border-red-400',    text: 'text-red-800',    light: '#fee2e2' },
  sky:    { bg: 'bg-sky-100',    border: 'border-sky-400',    text: 'text-sky-800',    light: '#e0f2fe' },
  sage:   { bg: 'bg-green-100',  border: 'border-green-400',  text: 'text-green-800',  light: '#dcfce7' },
  amber:  { bg: 'bg-amber-100',  border: 'border-amber-400',  text: 'text-amber-800',  light: '#fef3c7' },
  violet: { bg: 'bg-violet-100', border: 'border-violet-400', text: 'text-violet-800', light: '#ede9fe' },
};

export const COLOR_HEX: Record<PlanColor, string> = {
  coral:  '#f87171',
  sky:    '#38bdf8',
  sage:   '#4ade80',
  amber:  '#fbbf24',
  violet: '#a78bfa',
};
