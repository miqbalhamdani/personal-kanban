import type { Status } from '~/types'

/**
 * Native HTML5 drag & drop, shared across every board.
 * Module-scoped state: only one drag can be in flight, and drop targets need to
 * know what is being dragged without threading props through the tree.
 */
type Payload =
  | { kind: 'task'; taskId: string }
  | { kind: 'session'; taskId: string; sessionId: string; grabOffset: number }
  | { kind: 'sprint'; sprintId: string }

const dragging = ref<Payload | null>(null)
const overTarget = ref<string | null>(null)

const MIME = 'application/x-intently'

/**
 * Chrome cancels a native drag when the page re-renders under the cursor inside
 * dragstart. The Task list does exactly that: it reveals empty sprints as drop
 * targets, and a new future sprint sorts above the row being dragged. So the
 * reactive state lands one tick later, after the browser has committed to the drag.
 */
let pending: ReturnType<typeof setTimeout> | undefined
function begin(payload: Payload) {
  clearTimeout(pending)
  pending = setTimeout(() => { dragging.value = payload })
}

export function useDrag() {
  function startTask(event: DragEvent, taskId: string) {
    begin({ kind: 'task', taskId })
    if (!event.dataTransfer) return
    event.dataTransfer.effectAllowed = 'move'
    // A text/plain fallback keeps the drag valid in browsers that ignore custom types.
    event.dataTransfer.setData(MIME, taskId)
    event.dataTransfer.setData('text/plain', taskId)
  }

  function startSession(event: DragEvent, taskId: string, sessionId: string, grabOffset = 0) {
    begin({ kind: 'session', taskId, sessionId, grabOffset })
    if (!event.dataTransfer) return
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData(MIME, sessionId)
    event.dataTransfer.setData('text/plain', sessionId)
  }

  function startSprint(event: DragEvent, sprintId: string) {
    begin({ kind: 'sprint', sprintId })
    if (!event.dataTransfer) return
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData(MIME, sprintId)
    event.dataTransfer.setData('text/plain', sprintId)
  }

  function end() {
    // A drag that ends before its tick ran must not come back to life afterwards.
    clearTimeout(pending)
    dragging.value = null
    overTarget.value = null
  }

  /** Attach to a drop zone: marks it active and tells the browser a drop is allowed. */
  function over(event: DragEvent, targetId: string) {
    if (!dragging.value) return
    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
    overTarget.value = targetId
  }

  function leave(targetId: string) {
    if (overTarget.value === targetId) overTarget.value = null
  }

  const isOver = (targetId: string) => overTarget.value === targetId
  const isDraggingTask = (taskId: string) =>
    dragging.value?.kind === 'task' && dragging.value.taskId === taskId
  const isDraggingSprint = (sprintId: string) =>
    dragging.value?.kind === 'sprint' && dragging.value.sprintId === sprintId

  return {
    dragging: readonly(dragging),
    startTask,
    startSession,
    startSprint,
    end,
    over,
    leave,
    isOver,
    isDraggingTask,
    isDraggingSprint,
  }
}

export type { Payload as DragPayload, Status }
