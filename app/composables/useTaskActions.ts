import { toast } from 'vue-sonner'
import type { Status, Task } from '~/types'
import { fmtRelativeDay, todayISO } from '~/utils/date'
import { STATUS_LABEL } from '~/utils/labels'

/** Shared task verbs, each with the feedback the UX rules ask for. */
export function useTaskActions() {
  const store = useStore()
  const dialog = useTaskDialog()

  function remove(task: Task) {
    const restore = store.removeTask(task.id)
    toast.success(`Deleted "${truncate(task.title)}"`, {
      action: { label: 'Undo', onClick: restore },
    })
  }

  function moveTo(task: Task, status: Status) {
    if (task.status === status) return
    const previous = task.status
    store.setStatus(task.id, status)
    toast.success(`Moved to ${STATUS_LABEL[status]}`, {
      action: { label: 'Undo', onClick: () => store.setStatus(task.id, previous) },
    })
  }

  function schedule(task: Task, date: string, start = '09:00', minutes = 60) {
    const [h, m] = start.split(':').map(Number)
    const end = `${`${Math.floor((h! * 60 + m! + minutes) / 60)}`.padStart(2, '0')}:${`${(h! * 60 + m! + minutes) % 60}`.padStart(2, '0')}`
    const session = store.addSession(task.id, date, start, end)
    if (!session) return
    toast.success(`Scheduled ${fmtRelativeDay(date).toLowerCase()} at ${start}`, {
      action: { label: 'Undo', onClick: () => store.removeSession(task.id, session.id) },
    })
  }

  function setDueDate(task: Task, date: string | null) {
    const previous = task.dueDate
    store.setDueDate(task.id, date)
    toast.success(date ? `Due ${fmtRelativeDay(date).toLowerCase()}` : 'Due date cleared', {
      action: { label: 'Undo', onClick: () => store.setDueDate(task.id, previous) },
    })
  }

  /** Bulk-attach tasks to an epic; Undo restores whatever epic each one had. */
  function assignEpic(taskIds: string[], epicId: string | null) {
    const previous = taskIds.map(id => ({ id, epicId: store.task(id)?.epicId ?? null }))
    taskIds.forEach(id => store.updateTask(id, { epicId }))
    const label = `${taskIds.length} ${taskIds.length === 1 ? 'task' : 'tasks'}`
    toast.success(epicId ? `${label} added to the epic` : `${label} removed from the epic`, {
      action: {
        label: 'Undo',
        onClick: () => previous.forEach(p => store.updateTask(p.id, { epicId: p.epicId })),
      },
    })
  }

  /** First free hour today, so "Schedule today" never stacks two blocks. */
  function nextFreeSlot(date = todayISO()): string {
    const taken = store.sessionsOn(date).map(({ session }) => session)
    for (let minutes = 8 * 60; minutes <= 20 * 60; minutes += 30) {
      const start = minutes
      const end = minutes + 60
      const clash = taken.some(s => toMinutes(s.start) < end && toMinutes(s.end) > start)
      if (!clash) return toTime(start)
    }
    return '20:00'
  }

  return { remove, moveTo, schedule, setDueDate, assignEpic, nextFreeSlot, edit: dialog.openEdit }
}

const truncate = (s: string, max = 32) => (s.length > max ? `${s.slice(0, max - 1)}…` : s)
