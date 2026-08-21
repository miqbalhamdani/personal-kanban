import type { Task } from '~/types'

/**
 * One task editor for the whole app. Cards on any board open it, so the dialog
 * is mounted once in the layout instead of per page.
 */
const open = ref(false)
const editingId = ref<string | null>(null)
const defaults = ref<Partial<Task>>({})

export function useTaskDialog() {
  function openNew(patch: Partial<Task> = {}) {
    editingId.value = null
    defaults.value = patch
    open.value = true
  }

  function openEdit(id: string) {
    editingId.value = id
    defaults.value = {}
    open.value = true
  }

  function close() {
    open.value = false
    editingId.value = null
  }

  return { open, editingId, defaults, openNew, openEdit, close }
}
