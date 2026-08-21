/** All dates are local-time `YYYY-MM-DD` strings. Never use toISOString() — it shifts to UTC. */

export function toISO(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function fromISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y!, m! - 1, d!)
}

export function todayISO(): string {
  return toISO(new Date())
}

export function addDays(iso: string, n: number): string {
  const d = fromISO(iso)
  d.setDate(d.getDate() + n)
  return toISO(d)
}

export function diffDays(from: string, to: string): number {
  return Math.round((fromISO(to).getTime() - fromISO(from).getTime()) / 86_400_000)
}

/** Inclusive range. Capped so a typo'd sprint can't render a million columns. */
export function eachDay(from: string, to: string, max = 400): string[] {
  const out: string[] = []
  const span = diffDays(from, to)
  for (let i = 0; i <= Math.min(span, max - 1); i++) out.push(addDays(from, i))
  return out
}

export function isWeekend(iso: string): boolean {
  const day = fromISO(iso).getDay()
  return day === 0 || day === 6
}

const weekday = new Intl.DateTimeFormat(undefined, { weekday: 'short' })
const monthDay = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })
const longDate = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
const dayLongWeekday = new Intl.DateTimeFormat(undefined, { weekday: 'long' })
const dayLongDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long' })

export const fmtWeekday = (iso: string) => weekday.format(fromISO(iso))
export const fmtMonthDay = (iso: string) => monthDay.format(fromISO(iso))
export const fmtLongDate = (iso: string) => longDate.format(fromISO(iso))
/** "Friday, 21 August" */
export const fmtDayLong = (iso: string) => `${dayLongWeekday.format(fromISO(iso))}, ${dayLongDate.format(fromISO(iso))}`
/** "21 August" */
export const fmtDayMonth = (iso: string) => dayLongDate.format(fromISO(iso))

/** "Today" / "Tomorrow" / "Thu 14" — for board column headers. */
export function fmtRelativeDay(iso: string, today = todayISO()): string {
  const delta = diffDays(today, iso)
  if (delta === 0) return 'Today'
  if (delta === 1) return 'Tomorrow'
  if (delta === -1) return 'Yesterday'
  return `${fmtWeekday(iso)} ${fromISO(iso).getDate()}`
}

/* ---- time of day ---- */

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

export function toTime(minutes: number): string {
  const clamped = Math.max(0, Math.min(24 * 60, Math.round(minutes)))
  const h = Math.floor(clamped / 60) % 24
  const m = clamped % 60
  return `${`${h}`.padStart(2, '0')}:${`${m}`.padStart(2, '0')}`
}

/** 90 -> "1h 30m", 60 -> "1h", 45 -> "45m" */
export function fmtDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  if (!h) return `${m}m`
  return m ? `${h}h ${m}m` : `${h}h`
}
