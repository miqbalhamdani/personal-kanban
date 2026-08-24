/** Module-scoped: three pages mount a SprintDialog, and a shortcut opens it from anywhere. */
const sprintId = ref<string | null>(null)

export function useSprintDialog() {
  return { sprintId }
}
