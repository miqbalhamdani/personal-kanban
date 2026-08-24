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

/* Epic swatches. Ordered so one epic's auto-assigned colour and the next sit far
   apart perceptually. Names are the accessible swatch label, so hex and name stay
   in one place. Half the set is pastel, so anything drawn on top of a swatch has to
   pick its ink with epicInk/epicVeil rather than assume white. */
export const EPIC_COLOR_NAMES: Record<string, string> = {
  '#3D4A81': 'deep navy',
  '#FADE7D': 'pale yellow',
  '#AC90BB': 'lavender purple',
  '#589651': 'deep green',
  '#EF553C': 'coral red',
  '#B19C89': 'taupe',
  '#D5B60D': 'mustard',
  '#AD5B8F': 'mauve',
  '#8AD1BA': 'mint',
  '#F4AD84': 'peach',
  '#ECDCC5': 'cream',
  '#A4BE43': 'lime',
  '#F9A2BF': 'pink',
  '#23AED6': 'bright cyan',
  '#F59138': 'orange',
  '#C4C8DB': 'blue-gray',
  '#B6DE9A': 'light green',
  '#DF5970': 'raspberry',
}

export const EPIC_COLORS = Object.keys(EPIC_COLOR_NAMES)

/** sRGB relative luminance of a #rrggbb string. */
function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = Number.parseInt(hex.slice(i, i + 2), 16) / 255
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/* 0.179 is where white and black tie for contrast against a colour, so taking the
   better side of it can never drop below 4.58:1 -- true for any swatch, not just ours. */
const LIGHT_SWATCH = 0.179

/** Ink for text or icons sitting directly on an epic swatch. */
export const epicInk = (hex: string) => (luminance(hex) > LIGHT_SWATCH ? '#000000' : '#FFFFFF')

/** Wash for a decorative overlay on a swatch (the gantt progress fill). */
export const epicVeil = (hex: string) =>
  luminance(hex) > LIGHT_SWATCH ? 'rgb(0 0 0 / 0.18)' : 'rgb(255 255 255 / 0.25)'

/** Epic-tinted text on a card: 25% keeps every swatch at 4.5:1 in all nine themes. */
export const epicTextColor = (color: string) => `color-mix(in srgb, ${color} 25%, var(--foreground))`

/** Tinted pill -- a wash of the swatch behind matching tinted ink. */
export const epicTint = (color: string) => ({
  background: `color-mix(in srgb, ${color} 20%, var(--card))`,
  color: epicTextColor(color),
})
