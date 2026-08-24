import type { Component } from 'vue'
import { CalendarCheck, GitBranch, Keyboard, Layers, ListTodo, Settings2 } from '@lucide/vue'
import type { Task } from '~/types'

/**
 * Single-key shortcuts, on one keydown listener owned by the layout.
 * `groups` is also what the help dialog renders, so a new shortcut is one entry here —
 * including the icon, which is the same glyph the sidebar uses for that destination.
 */
export interface Shortcut {
  key: string
  label: string
  icon: Component
  run: () => unknown
}

export interface ShortcutGroup {
  title: string
  items: Shortcut[]
}

const helpOpen = ref(false)

export function useShortcuts() {
  const task = useTaskDialog()
  const epic = useEpicDialog()
  const sprint = useSprintDialog()
  const settings = useSettingsDialog()
  const route = useRoute()
  const store = useStore()

  /** The epic and sprint editors are mounted by their own page, so land there first.
   *  The nextTick lets the layout's route watcher clear stale dialog state before we set ours. */
  async function openOnPage(path: string, target: Ref<string | null>) {
    await navigateTo(path)
    await nextTick()
    target.value = 'new'
  }

  /** On an epic or sprint detail page `n` seeds the same parent that page's New task button does,
   *  so the keyboard and the button can't disagree. The lookup drops an id that no longer exists. */
  function newTaskDefaults(): Partial<Task> {
    const id = String(route.params.id ?? '')
    if (id && route.path.startsWith('/work/epics/') && store.epic(id)) return { status: 'todo', epicId: id }
    if (id && route.path.startsWith('/work/sprints/') && store.sprint(id)) return { status: 'todo', sprintId: id }
    return { status: 'todo' }
  }

  const groups: ShortcutGroup[] = [
    {
      title: 'Create',
      items: [
        { key: 'n', label: 'New task', icon: ListTodo, run: () => task.openNew(newTaskDefaults()) },
        { key: 'e', label: 'New epic', icon: Layers, run: () => openOnPage('/work/epics', epic.epicId) },
        { key: 's', label: 'New sprint', icon: GitBranch, run: () => openOnPage('/work/sprints', sprint.sprintId) },
      ],
    },
    {
      title: 'Go to',
      items: [
        { key: '1', label: 'Today', icon: CalendarCheck, run: () => navigateTo('/work') },
        { key: '2', label: 'Task', icon: ListTodo, run: () => navigateTo('/work/tasks') },
        { key: '3', label: 'Sprint', icon: GitBranch, run: () => navigateTo('/work/sprints') },
        { key: '4', label: 'Epics', icon: Layers, run: () => navigateTo('/work/epics') },
      ],
    },
    {
      title: 'Other',
      items: [
        { key: ',', label: 'Settings', icon: Settings2, run: () => { settings.open.value = true } },
        { key: '?', label: 'Shortcut help', icon: Keyboard, run: () => { helpOpen.value = true } },
      ],
    },
  ]

  /** Anything modal owns the keyboard while it is up. */
  const busy = () =>
    task.open.value || settings.open.value || helpOpen.value
    || !!epic.epicId.value || !!sprint.sprintId.value
    // Reka only renders these while a dropdown, select or context menu is open.
    || !!document.querySelector('[role="menu"], [role="listbox"]')

  function onKey(event: KeyboardEvent) {
    // Shift is fine — '?' needs it. Anything else is a browser or OS binding.
    if (event.metaKey || event.ctrlKey || event.altKey || event.defaultPrevented) return
    const target = event.target as HTMLElement | null
    if (target?.closest('input, textarea, select, [contenteditable]')) return
    if (busy()) return
    const hit = groups.flatMap(g => g.items).find(s => s.key === event.key)
    if (!hit) return
    event.preventDefault()
    hit.run()
  }

  return { groups, helpOpen, onKey }
}
