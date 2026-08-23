import type { Epic, Priority, Session, Sprint, SprintPhase, Status, StoreState, Task } from '~/types'
import { addDays, diffDays, todayISO, toMinutes } from '~/utils/date'
import { seedState, uid } from '~/utils/seed'

const KEY = 'intently.v1'
const SAVE_DEBOUNCE = 200

const state = reactive<StoreState>({ tasks: [], sprints: [], epics: [] })
const ready = ref(false)

function load() {
  if (ready.value) return
  let next: StoreState | null = null
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      // Only trust a shape we recognise; a corrupt blob falls back to the seed.
      if (parsed && Array.isArray(parsed.tasks) && Array.isArray(parsed.sprints) && Array.isArray(parsed.epics)) {
        next = parsed as StoreState
      }
    }
  } catch {
    next = null
  }
  const source = next ?? seedState()
  state.tasks = source.tasks.map(normaliseTask)
  state.sprints = source.sprints
  ensureSprintOrder(state.sprints)
  state.epics = source.epics
  ready.value = true

  // Write the seed straight away so a reload keeps the same demo set.
  if (!next) persist()

  let timer: ReturnType<typeof setTimeout> | undefined
  watch(state, () => {
    clearTimeout(timer)
    timer = setTimeout(persist, SAVE_DEBOUNCE)
  }, { deep: true })
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // Quota or private-mode failure: the app still works for this session.
  }
}

/** Older payloads predate manual sprint ordering; seed it from the newest-first display. */
function ensureSprintOrder(sprints: Sprint[]) {
  if (!sprints.some(s => typeof s.order !== 'number')) return
  ;[...sprints].sort((a, b) => b.startDate.localeCompare(a.startDate)).forEach((s, i) => { s.order = i })
}

/** Guards against hand-edited or older payloads missing newer fields. */
function normaliseTask(t: Partial<Task>): Task {
  return {
    id: t.id || uid('task'),
    title: t.title || 'Untitled task',
    description: t.description ?? '',
    priority: (t.priority ?? 'medium') as Priority,
    dueDate: t.dueDate ?? null,
    sprintId: t.sprintId ?? null,
    epicId: t.epicId ?? null,
    status: (t.status ?? 'backlog') as Status,
    sessions: Array.isArray(t.sessions) ? t.sessions.filter(s => s?.date && s?.start && s?.end) : [],
    order: t.order ?? 0,
    createdAt: t.createdAt ?? Date.now(),
  }
}

/* ---- lookups: module-scoped so every useStore() caller shares one computed ---- */
const taskMap = computed(() => new Map(state.tasks.map(t => [t.id, t])))
const epicMap = computed(() => new Map(state.epics.map(e => [e.id, e])))
const sprintMap = computed(() => new Map(state.sprints.map(s => [s.id, s])))

export function useStore() {
  if (import.meta.client) load()

  const task = (id: string) => taskMap.value.get(id)
  const epic = (id: string | null) => (id ? epicMap.value.get(id) : undefined)
  const sprint = (id: string | null) => (id ? sprintMap.value.get(id) : undefined)

  /* ---- tasks ---- */
  function addTask(patch: Partial<Task> = {}): Task {
    const next = normaliseTask({
      ...patch,
      id: uid('task'),
      order: state.tasks.length,
      createdAt: Date.now(),
    })
    state.tasks.push(next)
    return next
  }

  function updateTask(id: string, patch: Partial<Task>) {
    const t = taskMap.value.get(id)
    if (t) Object.assign(t, patch)
  }

  /** Returns a restore function so the delete toast can offer Undo. */
  function removeTask(id: string): () => void {
    const index = state.tasks.findIndex(t => t.id === id)
    if (index < 0) return () => {}
    const [removed] = state.tasks.splice(index, 1)
    return () => {
      if (removed) state.tasks.splice(Math.min(index, state.tasks.length), 0, removed)
    }
  }

  /** Move to a status. `order` stays sprint-scoped (owned by the List view) and is never touched here. */
  function setStatus(id: string, status: Status) {
    const t = taskMap.value.get(id)
    if (t) t.status = status
  }

  const setDueDate = (id: string, dueDate: string | null) => updateTask(id, { dueDate })

  /* ---- sessions (time blocking) ---- */
  function addSession(taskId: string, date: string, start: string, end: string): Session | undefined {
    const t = taskMap.value.get(taskId)
    if (!t) return
    if (toMinutes(end) <= toMinutes(start)) return
    const session: Session = { id: uid('ses'), date, start, end }
    t.sessions.push(session)
    return session
  }

  function updateSession(taskId: string, sessionId: string, patch: Partial<Omit<Session, 'id'>>) {
    const s = taskMap.value.get(taskId)?.sessions.find(x => x.id === sessionId)
    if (!s) return
    const next = { ...s, ...patch }
    if (toMinutes(next.end) <= toMinutes(next.start)) return
    Object.assign(s, next)
  }

  function removeSession(taskId: string, sessionId: string) {
    const t = taskMap.value.get(taskId)
    if (!t) return
    t.sessions = t.sessions.filter(s => s.id !== sessionId)
  }

  /** Every session on a given day, flattened with its task, sorted by start. */
  function sessionsOn(date: string) {
    return state.tasks
      .flatMap(t => t.sessions.filter(s => s.date === date).map(s => ({ session: s, task: t })))
      .sort((a, b) => toMinutes(a.session.start) - toMinutes(b.session.start))
  }

  const trackedMinutes = (t: Task, date?: string) =>
    t.sessions
      .filter(s => !date || s.date === date)
      .reduce((sum, s) => sum + Math.max(0, toMinutes(s.end) - toMinutes(s.start)), 0)

  /* ---- sprints ---- */
  function sprintPhase(s: Sprint, today = todayISO()): SprintPhase {
    if (diffDays(today, s.startDate) > 0) return 'future'
    if (diffDays(today, s.endDate) < 0) return 'archived'
    return 'active'
  }

  function addSprint(patch: Partial<Sprint> = {}): Sprint {
    const today = todayISO()
    const next: Sprint = {
      id: uid('sprint'),
      name: patch.name || 'New sprint',
      startDate: patch.startDate || today,
      endDate: patch.endDate || addDays(today, 6),
      // New sprints go to the top of the Task list, matching the newest-first convention.
      order: patch.order ?? Math.min(0, ...state.sprints.map(s => s.order)) - 1,
    }
    state.sprints.push(next)
    return next
  }

  /** Swap a sprint with its neighbour in manual order, then renumber 0..n. */
  function moveSprint(id: string, dir: -1 | 1) {
    const ordered = [...state.sprints].sort((a, b) => a.order - b.order)
    const i = ordered.findIndex(s => s.id === id)
    const j = i + dir
    if (i < 0 || j < 0 || j >= ordered.length) return
    ;[ordered[i], ordered[j]] = [ordered[j]!, ordered[i]!]
    ordered.forEach((s, idx) => { s.order = idx })
  }

  function updateSprint(id: string, patch: Partial<Sprint>) {
    const s = sprintMap.value.get(id)
    if (s) Object.assign(s, patch)
  }

  /** Sprint delete detaches its tasks rather than cascading the delete. */
  function removeSprint(id: string): () => void {
    const index = state.sprints.findIndex(s => s.id === id)
    if (index < 0) return () => {}
    const [removed] = state.sprints.splice(index, 1)
    const detached = state.tasks.filter(t => t.sprintId === id)
    detached.forEach(t => { t.sprintId = null })
    return () => {
      if (removed) state.sprints.splice(Math.min(index, state.sprints.length), 0, removed)
      detached.forEach(t => { t.sprintId = id })
    }
  }

  /* ---- epics ---- */
  function addEpic(patch: Partial<Epic> = {}): Epic {
    const next: Epic = {
      id: uid('epic'),
      name: patch.name || 'New epic',
      description: patch.description ?? '',
      dueDate: patch.dueDate ?? null,
      priority: patch.priority ?? 'medium',
      color: patch.color || '#6941C6',
    }
    state.epics.push(next)
    return next
  }

  function updateEpic(id: string, patch: Partial<Epic>) {
    const e = epicMap.value.get(id)
    if (e) Object.assign(e, patch)
  }

  function removeEpic(id: string): () => void {
    const index = state.epics.findIndex(e => e.id === id)
    if (index < 0) return () => {}
    const [removed] = state.epics.splice(index, 1)
    const detached = state.tasks.filter(t => t.epicId === id)
    detached.forEach(t => { t.epicId = null })
    return () => {
      if (removed) state.epics.splice(Math.min(index, state.epics.length), 0, removed)
      detached.forEach(t => { t.epicId = id })
    }
  }

  /** Wipes everything: tasks, sprints, epics. Persists the empty state so a reload stays empty. */
  function clearAll() {
    state.tasks = []
    state.sprints = []
    state.epics = []
    persist()
  }

  return {
    state,
    ready: readonly(ready),
    task, epic, sprint, taskMap, epicMap, sprintMap,
    addTask, updateTask, removeTask, setStatus, setDueDate,
    addSession, updateSession, removeSession, sessionsOn, trackedMinutes,
    sprintPhase, addSprint, updateSprint, removeSprint, moveSprint,
    addEpic, updateEpic, removeEpic,
    clearAll,
  }
}
