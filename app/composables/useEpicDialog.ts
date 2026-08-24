/** Module-scoped: the epics page mounts the dialog, the sidebar and shortcuts open it. */
const epicId = ref<string | null>(null)

export function useEpicDialog() {
  return { epicId }
}
