import type { Priority, Status } from '~/types'

export const STATUSES: Status[] = ['backlog', 'todo', 'in-progress', 'done', 'cancelled']
export const PRIORITIES: Priority[] = ['high', 'medium', 'low']

export const STATUS_LABEL: Record<Status, string> = {
  'backlog': 'Backlog',
  'todo': 'Todo',
  'in-progress': 'In Progress',
  'done': 'Done',
  'cancelled': 'Cancelled',
}

/* Tinted pill + dark text: contrast stays >= 4.5:1 and the label always
   carries the meaning, so colour is never the only signal. */
export const STATUS_CLASS: Record<Status, string> = {
  'backlog': 'bg-muted text-muted-foreground',
  'todo': 'bg-purple-soft text-accent-foreground',
  'in-progress': 'bg-brand-soft text-primary',
  'done': 'bg-emerald-100 text-emerald-800',
  'cancelled': 'bg-red-100 text-red-800',
}

export const STATUS_DOT: Record<Status, string> = {
  'backlog': 'bg-muted-foreground',
  'todo': 'bg-purple',
  'in-progress': 'bg-brand',
  'done': 'bg-emerald-600',
  'cancelled': 'bg-red-600',
}

export const PRIORITY_LABEL: Record<Priority, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

export const PRIORITY_CLASS: Record<Priority, string> = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-brand-soft text-primary',
  low: 'bg-muted text-muted-foreground',
}

export const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 }

/** Epic swatches — distinguishable in hue and lightness, all AA against white text. */
export const EPIC_COLORS = [
  '#C2410C',
  '#6941C6',
  '#0F766E',
  '#B45309',
  '#1D4ED8',
  '#BE185D',
  '#504238',
  '#15803D',
]
