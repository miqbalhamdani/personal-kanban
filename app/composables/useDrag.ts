import type { Status } from '~/types'

/**
 * Native HTML5 drag & drop, shared across every board.
 * Module-scoped state: only one drag can be in flight, and drop targets need to
 * know what is being dragged without threading props through the tree.
 */
type Payload =
  | { kind: 'task'; taskId: string }
  | { kind: 'session'; taskId: string; sessionId: string; grabOffset: number }

const dragging = ref<Payload | null>(null)
const overTarget = ref<string | null>(null)

const MIME = 'application/x-flowdeck'

export function useDrag() {
  function startTask(event: DragEvent, taskId: string) {
    dragging.value = { kind: 'task', taskId }
    if (!event.dataTransfer) return
    event.dataTransfer.effectAllowed = 'move'
    // A text/plain fallback keeps the drag valid in browsers that ignore custom types.
    event.dataTransfer.setData(MIME, taskId)
    event.dataTransfer.setData('text/plain', taskId)
  }

  function startSession(event: DragEvent, taskId: string, sessionId: string, grabOffset = 0) {
    dragging.value = { kind: 'session', taskId, sessionId, grabOffset }
    if (!event.dataTransfer) return
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData(MIME, sessionId)
    event.dataTransfer.setData('text/plain', sessionId)
  }

  function end() {
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

  return {
    dragging: readonly(dragging),
    startTask,
    startSession,
    end,
    over,
    leave,
    isOver,
    isDraggingTask,
  }
}

export type { Payload as DragPayload, Status }
