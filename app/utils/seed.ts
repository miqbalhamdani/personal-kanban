import type { Epic, Session, Sprint, StoreState, Task } from '~/types'
import { addDays, eachDay, isWeekend, todayISO, toTime } from './date'

let n = 0
export const uid = (prefix = 'id') => `${prefix}_${Date.now().toString(36)}_${(n++).toString(36)}`

/**
 * First-run demo content, generated relative to today so the archived sprint,
 * the active sprint and the four-day focus board always have something in them.
 */
export function seedState(): StoreState {
  const today = todayISO()

  const epics: Epic[] = [
    { id: 'epic_design', name: 'Design System', description: 'Tokens, typography and the shared component set.', startDate: addDays(today, -14), endDate: addDays(today, 12), priority: 'high', color: '#3D4A81' },
    { id: 'epic_board', name: 'Kanban Core', description: 'Boards, columns, drag and drop, task lifecycle.', startDate: addDays(today, -10), endDate: addDays(today, 5), priority: 'high', color: '#FADE7D' },
    { id: 'epic_time', name: 'Calendar & Time', description: 'Day calendar and time blocking of tracked work.', startDate: addDays(today, -2), endDate: addDays(today, 20), priority: 'medium', color: '#AC90BB' },
    { id: 'epic_insight', name: 'Analytics', description: 'Sprint retrospectives and productivity reporting.', startDate: addDays(today, 5), endDate: addDays(today, 34), priority: 'low', color: '#589651' },
  ]

  const sprints: Sprint[] = [
    { id: 'sprint_12', name: 'Sprint 12 · Foundations', startDate: addDays(today, -14), endDate: addDays(today, -8), order: 2, phase: 'archived' },
    { id: 'sprint_13', name: 'Sprint 13 · Time Blocking', startDate: addDays(today, -2), endDate: addDays(today, 4), order: 1, phase: 'active' },
    { id: 'sprint_14', name: 'Sprint 14 · Polish', startDate: addDays(today, 5), endDate: addDays(today, 11), order: 0, phase: 'future' },
  ]

  type Spec = [title: string, epic: string, sprint: string | null, status: Task['status'], priority: Task['priority'], due: number | null, desc: string]

  const specs: Spec[] = [
    // Sprint 12 — archived, all resolved. These carry the tracked sessions the charts read.
    ['Define colour and spacing tokens', 'epic_design', 'sprint_12', 'done', 'high', -12, 'Map the brand palette onto semantic tokens and check every pair for contrast.'],
    ['Build the badge and pill set', 'epic_design', 'sprint_12', 'done', 'medium', -11, 'Status and priority pills that never rely on colour alone.'],
    ['Board column layout', 'epic_board', 'sprint_12', 'done', 'high', -10, 'Scrollable columns with counts and an inline add-task affordance.'],
    ['Task card anatomy', 'epic_board', 'sprint_12', 'done', 'medium', -9, 'Title, priority, due date, epic dot and sprint tag in one compact card.'],
    ['Local persistence layer', 'epic_board', 'sprint_12', 'done', 'high', -9, 'Debounced localStorage writes with a versioned schema.'],
    ['Day calendar grid', 'epic_time', 'sprint_12', 'done', 'medium', -12, 'Hour rows from 6am to 10pm with a live now-line.'],
    ['Session model and tracked minutes', 'epic_insight', 'sprint_12', 'done', 'medium', -10, 'One block of work is a date plus a start and an end; everything else derives from it.'],
    ['Drop maths for time blocks', 'epic_time', 'sprint_12', 'in-progress', 'high', -8, 'Carried into Sprint 13: the drop still rounds to the wrong quarter hour near midnight.'],
    ['Retrospective charts shell', 'epic_insight', 'sprint_12', 'in-progress', 'medium', -8, 'Carried into Sprint 13: doughnut and stacked bars render, the legend still needs a keyboard path.'],
    ['Spike: calendar grid options', 'epic_time', 'sprint_12', 'cancelled', 'low', -13, 'Compared a CSS grid against absolute positioning. Grid won; spike closed.'],

    // Sprint 13 — active. Due dates land inside the four-day focus window.
    ['Drag a task onto a time slot', 'epic_time', 'sprint_13', 'in-progress', 'high', 0, 'Dropping a task on the day calendar should create a one hour block.'],
    ['Resize a scheduled block', 'epic_time', 'sprint_13', 'in-progress', 'medium', 0, 'Drag the bottom edge to change the end time in fifteen minute steps.'],
    ['Four day focus board', 'epic_board', 'sprint_13', 'todo', 'high', 1, 'Today through today plus three, grouped by due date.'],
    ['Context menu on task cards', 'epic_board', 'sprint_13', 'todo', 'medium', 1, 'Right click for edit, move, schedule and delete.'],
    ['Keyboard path for every drag', 'epic_design', 'sprint_13', 'todo', 'high', 2, 'Native drag has no touch support, so the menu must cover the same moves.'],
    ['Sprint list grouped by phase', 'epic_insight', 'sprint_13', 'todo', 'medium', 3, 'Active, future and archived sections derived from the sprint dates.'],
    ['Empty states for every board', 'epic_design', 'sprint_13', 'todo', 'low', 4, 'A blank column should say what to do next, not sit silent.'],

    // Sprint 14 — future.
    ['Daily productivity chart', 'epic_insight', 'sprint_14', 'todo', 'high', 6, 'Stacked bars per sprint day, split by epic share of tracked minutes.'],
    ['Time spent doughnut', 'epic_insight', 'sprint_14', 'todo', 'medium', 8, 'Where the sprint actually went, by epic.'],
    ['Epic gantt timeline', 'epic_insight', 'sprint_14', 'todo', 'medium', 10, 'One row per epic, bars spanning start to due date.'],

    // Unassigned backlog.
    ['Export a sprint report', 'epic_insight', null, 'todo', 'low', null, 'Nice to have: dump the retrospective numbers to CSV.'],
    ['Dark mode pass', 'epic_design', null, 'todo', 'low', null, 'Needs its own contrast review before it ships.'],
  ]

  const tasks: Task[] = specs.map(([title, epicId, sprintId, status, priority, due, description], i) => ({
    id: `task_${i + 1}`,
    title,
    description,
    priority,
    dueDate: due === null ? null : addDays(today, due),
    sprintId,
    epicId,
    status,
    sessions: [],
    order: i,
    createdAt: Date.now() - (specs.length - i) * 3_600_000,
  }))

  const byTitle = (title: string) => tasks.find(t => t.title === title)!

  // Tracked work across the archived sprint: two or three blocks a weekday.
  const s12 = sprints[0]!
  // Interleave by epic so a single day mixes epics and the stacked bars mean something.
  const s12Tasks = interleaveByEpic(tasks.filter(t => t.sprintId === 'sprint_12' && t.status !== 'cancelled'))
  let cursor = 0
  eachDay(s12.startDate, s12.endDate).forEach((date, dayIndex) => {
    if (isWeekend(date)) return
    const blocks = 2 + (dayIndex % 2)
    let start = 9 * 60 + (dayIndex % 3) * 30
    for (let b = 0; b < blocks; b++) {
      const task = s12Tasks[cursor++ % s12Tasks.length]!
      const length = [60, 90, 120][(dayIndex + b) % 3]!
      task.sessions.push({ id: uid('ses'), date, start: toTime(start), end: toTime(start + length) })
      start += length + 30
    }
  })

  // A partly planned day today, so the focus calendar opens with content.
  byTitle('Drag a task onto a time slot').sessions.push({ id: uid('ses'), date: today, start: '09:30', end: '11:00' })
  byTitle('Resize a scheduled block').sessions.push({ id: uid('ses'), date: today, start: '13:00', end: '14:30' })
  byTitle('Four day focus board').sessions.push({ id: uid('ses'), date: addDays(today, -1), start: '10:00', end: '12:00' })

  return { tasks, sprints, epics }
}

/** Round-robin across epics: [designA, boardA, designB, boardB, boardC]. */
function interleaveByEpic(tasks: Task[]): Task[] {
  const buckets = new Map<string, Task[]>()
  for (const t of tasks) {
    const key = t.epicId ?? 'none'
    buckets.set(key, [...(buckets.get(key) ?? []), t])
  }
  const queues = [...buckets.values()]
  const out: Task[] = []
  while (out.length < tasks.length) {
    for (const q of queues) {
      const next = q.shift()
      if (next) out.push(next)
    }
  }
  return out
}
