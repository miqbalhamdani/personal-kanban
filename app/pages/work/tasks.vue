<template>
  <div class="flex h-[calc(100dvh-3.5rem)] flex-col lg:h-dvh">
    <PageHeader title="Task" :subtitle="`${open.length} open of ${state.tasks.length}`">
      <template #actions>
        <Button class="gap-1.5" @click="dialog.openNew({ status: 'backlog' })">
          <Plus class="size-4" /> New task
        </Button>
      </template>
    </PageHeader>

    <div class="flex flex-wrap items-center gap-2 px-4 py-3 sm:px-6">
      <div class="inline-flex rounded-lg border bg-card p-0.5" role="tablist" aria-label="Task view">
        <button
          v-for="view in views"
          :key="view.id"
          role="tab"
          :aria-selected="tab === view.id"
          class="inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 text-[13px] font-medium transition-colors duration-150"
          :class="tab === view.id ? 'bg-brand-soft text-primary' : 'text-muted-foreground hover:text-foreground'"
          @click="tab = view.id"
        >
          <component :is="view.icon" class="size-3.5" aria-hidden="true" />
          {{ view.label }}
        </button>
      </div>

      <div class="relative min-w-[180px] grow sm:max-w-xs">
        <Search class="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input v-model="query" class="h-9 pl-8" placeholder="Filter tasks" aria-label="Filter tasks by title" />
      </div>

      <Select v-model="epicFilter">
        <SelectTrigger class="h-9 w-[168px]" aria-label="Filter by epic">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All epics</SelectItem>
          <SelectItem v-for="e in state.epics" :key="e.id" :value="e.id">{{ e.name }}</SelectItem>
          <SelectItem value="none">No epic</SelectItem>
        </SelectContent>
      </Select>

      <Select v-model="priorityFilter">
        <SelectTrigger class="h-9 w-[150px]" aria-label="Filter by priority">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All priorities</SelectItem>
          <SelectItem v-for="p in PRIORITIES" :key="p" :value="p">{{ PRIORITY_LABEL[p] }}</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- List, grouped by sprint -->
    <div v-if="tab === 'list'" ref="listScroll" class="min-h-0 grow overflow-y-auto p-4 sm:px-6 scroll-thin" @dragover="autoScroll">
      <div class="space-y-3">
        <EmptyState
          v-if="!sprintGroups.length"
          :icon="ListTodo"
          title="No task matches this filter"
          description="Clear the search, epic, or priority filter to see the rest of the backlog. Work in archived sprints stays on the Sprint page."
        />

        <section
          v-for="(group, gi) in sprintGroups"
          :key="group.key"
          class="rounded-2xl border bg-card transition-colors duration-150"
          :class="[
            draggingTask && isOver(`sprint:${group.key}`) && 'border-brand bg-brand-soft/70',
            isOver(`slot:${group.key}`) && 'border-brand ring-2 ring-brand/25',
            isDraggingSprint(group.key) && 'opacity-40',
          ]"
          @dragover="overSection($event, group.key)"
          @dragleave="leaveSection($event, group.key)"
          @drop.prevent="onDropAt(group.key)"
        >
          <div
            class="flex min-h-12 items-center gap-2.5 px-4"
            :class="group.key !== 'none' && 'cursor-grab active:cursor-grabbing'"
            :draggable="group.key !== 'none'"
            @dragstart="startSprint($event, group.key)"
            @dragend="end()"
          >
            <button
              type="button"
              class="flex min-w-0 grow items-center gap-2.5 py-2 text-left"
              :aria-expanded="!collapsed.has(group.key)"
              @click="toggle(group.key)"
            >
              <ChevronRight
                class="size-4 shrink-0 text-muted-foreground transition-transform duration-150"
                :class="!collapsed.has(group.key) && 'rotate-90'"
                aria-hidden="true"
              />
              <span class="truncate text-[13px] font-semibold">{{ group.title }}</span>
              <span v-if="group.phase" class="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium" :class="PHASE_CLASS[group.phase]">
                {{ group.phase }}
              </span>
              <span class="tnum ml-auto shrink-0 text-[11px] text-muted-foreground">
                {{ group.tasks.length }} {{ group.tasks.length === 1 ? 'task' : 'tasks' }}
              </span>
            </button>

            <DropdownMenu v-if="group.key !== 'none'">
              <DropdownMenuTrigger as-child>
                <button
                  type="button"
                  class="hit -mr-1 grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
                  :aria-label="`Actions for ${group.title}`"
                  @click.stop
                  @keydown.stop
                  @pointerdown.stop
                >
                  <MoreHorizontal class="size-4" aria-hidden="true" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent class="w-44" align="end">
                <DropdownMenuItem @select="editingSprint = group.key">
                  <Pencil class="size-4" /> Edit sprint
                </DropdownMenuItem>
                <DropdownMenuItem :disabled="gi === 0" @select="moveSprintGroup(gi, -1)">
                  <ArrowUp class="size-4" /> Move up
                </DropdownMenuItem>
                <DropdownMenuItem :disabled="gi === sprintKeys.length - 1" @select="moveSprintGroup(gi, 1)">
                  <ArrowDown class="size-4" /> Move down
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" @select="deleteSprint(group.key)">
                  <Trash2 class="size-4" /> Delete sprint
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <ul v-if="!collapsed.has(group.key)" class="border-t">
            <li
              v-for="(task, i) in group.tasks"
              :key="task.id"
              class="relative"
              @dragover.stop="overRow($event, group, i)"
              @drop.stop.prevent="onDropAt(group.key)"
            >
              <div
                v-if="draggingTask && dropAnchor === `before:${task.id}`"
                class="pointer-events-none absolute inset-x-2 top-0 z-10 h-0.5 rounded-full bg-brand"
              />
              <div
                v-if="draggingTask && i === group.tasks.length - 1 && dropAnchor === `end:${group.key}`"
                class="pointer-events-none absolute inset-x-2 bottom-0 z-10 h-0.5 rounded-full bg-brand"
              />
              <TaskRow
                :task="task"
                :reorder="{ upDisabled: i === 0, downDisabled: i === group.tasks.length - 1 }"
                @move-up="moveTask(task, -1)"
                @move-down="moveTask(task, 1)"
              />
            </li>
            <li
              v-if="!group.tasks.length"
              class="text-xs"
              :class="draggingTask && isOver(`sprint:${group.key}`)
                ? 'm-2 rounded-lg border border-dashed border-brand px-4 py-3 text-center font-medium text-primary'
                : 'px-4 py-4 text-muted-foreground'"
            >
              {{ draggingTask && isOver(`sprint:${group.key}`) ? 'Drop task here' : 'No task in this sprint yet.' }}
            </li>
          </ul>
        </section>
      </div>
    </div>

    <!-- Kanban, by status -->
    <div v-else-if="tab === 'board'" class="flex min-h-0 grow gap-3 overflow-x-auto p-4 sm:px-6 scroll-thin">
      <BoardColumn
        v-for="status in STATUSES"
        :key="status"
        :title="STATUS_LABEL[status]"
        :tasks="byStatus[status]"
        :drop-id="`status:${status}`"
        :dot="STATUS_DOT[status]"
        addable
        :empty-text="`Nothing in ${STATUS_LABEL[status].toLowerCase()}.`"
        @add="dialog.openNew({ status })"
        @drop-task="id => onDropOnStatus(id, status)"
      />
    </div>

    <!-- Month calendar, by due date -->
    <div v-else class="min-h-0 grow overflow-y-auto p-4 sm:px-6 scroll-thin">
      <TaskCalendar :tasks="filtered" />
    </div>

    <SprintDialog v-model:sprint-id="editingSprint" />
  </div>
</template>

<script setup lang="ts">
import { ArrowDown, ArrowUp, CalendarDays, ChevronRight, Columns3, ListTodo, MoreHorizontal, Pencil, Plus, Search, Trash2 } from '@lucide/vue'
import { toast } from 'vue-sonner'
import type { Status, Task } from '~/types'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Input } from '~/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { PRIORITIES, PRIORITY_LABEL, PRIORITY_RANK, STATUS_DOT, STATUS_LABEL, STATUSES } from '~/utils/labels'

const store = useStore()
const { state } = store
const dialog = useTaskDialog()
const actions = useTaskActions()
const { dragging, startSprint, over, leave, isOver, end, isDraggingSprint } = useDrag()
const draggingTask = computed(() => dragging.value?.kind === 'task')
const draggingSprint = computed(() => dragging.value?.kind === 'sprint')

const views = [
  { id: 'list' as const, label: 'List', icon: ListTodo },
  { id: 'board' as const, label: 'Board', icon: Columns3 },
  { id: 'calendar' as const, label: 'Calendar', icon: CalendarDays },
]
const tab = ref<'list' | 'board' | 'calendar'>('board')
const query = ref('')
const epicFilter = ref('all')
const priorityFilter = ref('all')
const collapsed = ref(new Set<string>())

const PHASE_CLASS: Record<string, string> = {
  active: 'bg-brand-soft text-primary',
  future: 'bg-purple-soft text-accent-foreground',
}

const open = computed(() => state.tasks.filter(t => t.status !== 'done' && t.status !== 'cancelled'))

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return state.tasks.filter((t) => {
    if (q && !t.title.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false
    if (priorityFilter.value !== 'all' && t.priority !== priorityFilter.value) return false
    if (epicFilter.value === 'none') return !t.epicId
    if (epicFilter.value !== 'all') return t.epicId === epicFilter.value
    return true
  })
})

const sortTasks = <T extends { priority: keyof typeof PRIORITY_RANK; order: number }>(list: T[]) =>
  [...list].sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.order - b.order)

/** List view sorts by manual order alone so move up/down and drop position always win. */
const byOrder = <T extends { order: number }>(list: T[]) => [...list].sort((a, b) => a.order - b.order)

/** Sprints in manual order (kebab Move up/down), then an "Unassigned" bucket for sprintless work.
 *  While a task drag is active, every group renders so empty sprints are drop targets. */
const sprintGroups = computed(() => {
  if (!filtered.value.length && !draggingTask.value) return []
  // Archived sprints are done with: they stay on the Sprint page, out of the planning list.
  const ordered = [...state.sprints]
    .filter(s => store.sprintPhase(s) !== 'archived')
    .sort((a, b) => a.order - b.order)
  const groups = ordered.map(s => ({
    key: s.id,
    title: s.name,
    phase: store.sprintPhase(s),
    tasks: byOrder(filtered.value.filter(t => t.sprintId === s.id)),
  }))
  const loose = byOrder(filtered.value.filter(t => !t.sprintId))
  if (loose.length || draggingTask.value) groups.push({ key: 'none', title: 'No sprint', phase: undefined as never, tasks: loose })
  return draggingTask.value ? groups : groups.filter(g => g.tasks.length)
})

const byStatus = computed(() =>
  Object.fromEntries(STATUSES.map(s => [s, sortTasks(filtered.value.filter(t => t.status === s))])) as Record<Status, typeof state.tasks>,
)

const toggle = (key: string) => {
  const next = new Set(collapsed.value)
  next.has(key) ? next.delete(key) : next.add(key)
  collapsed.value = next
}

function onDropOnStatus(taskId: string, status: Status) {
  const task = store.task(taskId)
  if (task) actions.moveTo(task, status)
}

/* ---- positional drop: anchor = "insert before task X" or end of group ---- */
const dropAnchor = ref<string | null>(null) // 'before:<taskId>' | 'end:<groupKey>'

/** Row dragover: top half inserts before this task, bottom half before the next (or at the end). */
function overRow(event: DragEvent, group: { key: string, tasks: Task[] }, i: number) {
  if (draggingSprint.value) return overSection(event, group.key)
  const el = event.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  const before = event.clientY < rect.top + rect.height / 2 ? group.tasks[i] : group.tasks[i + 1]
  const anchor = before ? `before:${before.id}` : `end:${group.key}`
  dropAnchor.value = anchor
  over(event, anchor)
}

/** Section dragover only fires over the header/gaps (rows stop propagation) → plain append. */
function overSection(event: DragEvent, key: string) {
  dropAnchor.value = null
  // "No sprint" is a bucket, not a sprint: it has no slot in the manual order.
  if (draggingSprint.value) {
    if (key !== 'none' && !isDraggingSprint(key)) over(event, `slot:${key}`)
    return
  }
  over(event, `sprint:${key}`)
}

/** True leave of the section (not a child-to-child transition): clear the insertion line too. */
function leaveSection(event: DragEvent, key: string) {
  if ((event.currentTarget as HTMLElement).contains(event.relatedTarget as Node)) return
  dropAnchor.value = null
  leave(`sprint:${key}`)
  leave(`slot:${key}`)
}

/** Nudge the list scroll when dragging near its top/bottom edge; dragover fires continuously. */
const listScroll = ref<HTMLElement | null>(null)
function autoScroll(event: DragEvent) {
  const el = listScroll.value
  if (!el || (!draggingTask.value && !draggingSprint.value)) return
  const { top, bottom } = el.getBoundingClientRect()
  const zone = 48
  if (event.clientY < top + zone) el.scrollTop -= (top + zone - event.clientY) / 3
  else if (event.clientY > bottom - zone) el.scrollTop += (event.clientY - bottom + zone) / 3
}

function onDropAt(key: string) {
  const payload = dragging.value
  const anchor = dropAnchor.value
  dropAnchor.value = null
  end()
  if (payload?.kind === 'sprint') {
    if (key !== 'none') store.reorderSprint(payload.sprintId, key)
    return
  }
  if (payload?.kind !== 'task') return
  const beforeId = anchor?.startsWith('before:') ? anchor.slice(7) : null
  insertTask(payload.taskId, key === 'none' ? null : key, beforeId)
}

/** Pull the task out, insert before `beforeId` (or at the end) of the target group, renumber 0..n. */
function insertTask(taskId: string, sprintId: string | null, beforeId: string | null) {
  const task = store.task(taskId)
  if (!task || taskId === beforeId) return
  const crossSprint = task.sprintId !== sprintId
  // Undo snapshot: both affected groups' positions, taken before any renumbering.
  const snapshot = crossSprint
    ? state.tasks
        .filter(t => (t.sprintId ?? null) === sprintId || (t.sprintId ?? null) === (task.sprintId ?? null))
        .map(t => ({ id: t.id, sprintId: t.sprintId, order: t.order }))
    : []
  const group = byOrder(state.tasks.filter(t => (t.sprintId ?? null) === sprintId && t.id !== taskId))
  const idx = beforeId ? group.findIndex(t => t.id === beforeId) : group.length
  group.splice(idx < 0 ? group.length : idx, 0, task)
  if (crossSprint) store.updateTask(taskId, { sprintId })
  group.forEach((t, i) => store.updateTask(t.id, { order: i }))
  if (crossSprint) {
    toast.success(`Moved to ${sprintId ? store.sprint(sprintId)?.name ?? 'sprint' : 'No sprint'}`, {
      action: { label: 'Undo', onClick: () => snapshot.forEach(x => store.updateTask(x.id, { sprintId: x.sprintId, order: x.order })) },
    })
  }
}

/* ---- sprint header kebab ---- */
const editingSprint = ref<string | null>(null)
/** Sprint sections in display order; the kebab and its disabled edges follow these, not the global order. */
const sprintKeys = computed(() => sprintGroups.value.filter(g => g.key !== 'none').map(g => g.key))

function moveSprintGroup(i: number, dir: -1 | 1) {
  const from = sprintKeys.value[i]
  const target = sprintKeys.value[i + dir]
  if (from && target) store.reorderSprint(from, target)
}

function deleteSprint(key: string) {
  const sp = store.sprint(key)
  if (!sp) return
  const restore = store.removeSprint(key)
  toast.success(`Deleted "${sp.name}"`, {
    description: 'Its tasks were kept and moved to No sprint.',
    action: { label: 'Undo', onClick: restore },
  })
}

/** Swap with the adjacent row, then renumber the whole sprint group —
 *  `order` can hold duplicates, so a plain two-value swap could silently no-op. */
function moveTask(task: Task, dir: -1 | 1) {
  const group = byOrder(state.tasks.filter(t => (t.sprintId ?? null) === (task.sprintId ?? null)))
  const i = group.findIndex(t => t.id === task.id)
  const j = i + dir
  if (i < 0 || j < 0 || j >= group.length) return
  ;[group[i], group[j]] = [group[j]!, group[i]!]
  group.forEach((t, idx) => store.updateTask(t.id, { order: idx }))
}
</script>
