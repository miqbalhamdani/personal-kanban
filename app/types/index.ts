export type Priority = 'high' | 'medium' | 'low'

export type Status = 'todo' | 'in-progress' | 'done' | 'cancelled'

/** One block of tracked work: "I worked on this task on this date, from → to". */
export interface Session {
  id: string
  date: string  // YYYY-MM-DD
  start: string // HH:mm
  end: string   // HH:mm
}

export interface Task {
  id: string
  title: string
  description: string
  priority: Priority
  dueDate: string | null
  sprintId: string | null
  epicId: string | null
  status: Status
  sessions: Session[]
  order: number
  createdAt: number
}

export interface Sprint {
  id: string
  name: string
  startDate: string
  endDate: string
  /** Manual position in the Task list's sprint groups; lower comes first. */
  order: number
  /** Lifecycle, started and ended by hand rather than derived from the dates. Only one sprint is 'active'. */
  phase: SprintPhase
}

export interface Epic {
  id: string
  name: string
  description: string
  /** Planned window on the epics timeline. Either end can be open. */
  startDate: string | null
  endDate: string | null
  priority: Priority
  color: string
}

export type SprintPhase = 'active' | 'future' | 'archived'

export interface StoreState {
  tasks: Task[]
  sprints: Sprint[]
  epics: Epic[]
}
