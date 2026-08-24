import { toast } from 'vue-sonner'
import type { Sprint } from '~/types'

/** Shared sprint lifecycle verbs, each with the feedback the UX rules ask for. */
export function useSprintActions() {
  const store = useStore()

  function start(s: Sprint) {
    if (!store.startSprint(s.id)) return
    toast.success(`Started "${s.name}"`, { description: 'Today is day one. It moved to Active.' })
  }

  function finish(s: Sprint) {
    store.endSprint(s.id)
    toast.success(`Ended "${s.name}"`, { description: 'Today is its last day. It moved to Archived.' })
  }

  return { start, finish }
}
