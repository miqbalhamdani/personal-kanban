/** Module-scoped so the sidebar (rendered twice) toggles one dialog in the layout. */
const open = ref(false)

export function useSettingsDialog() {
  return { open }
}
