import { clsx, type ClassValue } from 'clsx';
import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';
import { Priority, Stage } from '../types';

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isValid(d) ? format(d, 'MMM d, yyyy') : '';
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isValid(d) ? format(d, 'MMM d, yyyy h:mm a') : '';
}

export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isValid(d) ? formatDistanceToNow(d, { addSuffix: true }) : '';
}

export function getPriorityColor(priority: Priority): string {
  const colors: Record<Priority, string> = {
    HIGH: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    MEDIUM: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    NORMAL: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    LOW: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  };
  return colors[priority];
}

export function getPriorityDot(priority: Priority): string {
  const colors: Record<Priority, string> = {
    HIGH: 'bg-red-500',
    MEDIUM: 'bg-orange-500',
    NORMAL: 'bg-blue-500',
    LOW: 'bg-gray-400',
  };
  return colors[priority];
}

export function getStageColor(stage: Stage): string {
  const colors: Record<Stage, string> = {
    TODO: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    IN_PROGRESS: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  };
  return colors[stage];
}

export function getStageBgColor(stage: Stage): string {
  const colors: Record<Stage, string> = {
    TODO: 'bg-slate-50 dark:bg-slate-900/50',
    IN_PROGRESS: 'bg-amber-50 dark:bg-amber-900/20',
    COMPLETED: 'bg-emerald-50 dark:bg-emerald-900/20',
  };
  return colors[stage];
}

export function getStageLabel(stage: Stage): string {
  const labels: Record<Stage, string> = {
    TODO: 'To Do',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
  };
  return labels[stage];
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getAvatarColor(name: string): string {
  const colors = [
    'bg-primary-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-violet-500',
    'bg-cyan-500',
    'bg-pink-500',
    'bg-indigo-500',
  ];
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[index % colors.length];
}
