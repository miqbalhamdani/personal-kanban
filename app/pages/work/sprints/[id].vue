<template>
  <div v-if="!sprint" class="p-6">
    <EmptyState
      :icon="GitBranch"
      title="Sprint not found"
      description="It may have been deleted from this browser."
    >
      <Button variant="outline" size="sm" as-child><NuxtLink to="/work/sprints">Back to sprints</NuxtLink></Button>
    </EmptyState>
  </div>

  <div v-else class="min-h-[calc(100dvh-3.5rem)] lg:min-h-dvh">
    <PageHeader
      :title="sprint.name"
      :subtitle="`${fmtMonthDay(sprint.startDate)} – ${fmtMonthDay(sprint.endDate)} · ${days.length} days · ${phaseLabel}`"
      back-to="/work/sprints"
      back-label="Back to sprints"
    >
      <template #actions>
        <div class="hidden items-center gap-4 pr-1 sm:flex">
          <Stat :value="String(sprintTasks.length)" label="tasks" />
          <Stat :value="`${percentDone}%`" label="completed" />
          <Stat :value="fmtDuration(totalMinutes)" label="tracked" />
        </div>
        <Button variant="outline" class="gap-1.5" @click="editing = sprint.id">
          <Pencil class="size-3.5" /> Edit
        </Button>
        <Button class="gap-1.5" @click="newTask">
          <Plus class="size-4" /> New task
        </Button>
      </template>
    </PageHeader>

    <div class="px-4 pt-3 sm:px-6">
      <div class="inline-flex rounded-lg border bg-card p-0.5" role="tablist" aria-label="Sprint view">
        <button
          v-for="view in views"
          :key="view.id"
          role="tab"
          :aria-selected="tab === view.id"
          class="inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 text-[13px] font-medium transition-colors duration-150"
          :class="tab === view.id ? 'bg-brand-soft text-primary' : 'text-muted-foreground hover:text-foreground'"
          @click="setTab(view.id)"
        >
          <component :is="view.icon" class="size-3.5" aria-hidden="true" />
          {{ view.label }}
        </button>
      </div>
    </div>

    <!-- Tasks: everything assigned to this sprint, grouped by status -->
    <div v-if="tab === 'tasks'" class="space-y-3 p-4 pt-3 sm:px-6 sm:pb-6 sm:pt-3">
      <EmptyState
        v-if="!sprintTasks.length"
        :icon="ListTodo"
        title="No task in this sprint yet"
        description="Add one here, or assign existing tasks from the Task page."
      >
        <Button class="gap-1.5" @click="newTask">
          <Plus class="size-4" /> New task
        </Button>
      </EmptyState>

      <section v-for="group in statusGroups" :key="group.status" class="rounded-2xl border bg-card">
        <button
          type="button"
          class="flex min-h-12 w-full items-center gap-2.5 px-4 text-left"
          :aria-expanded="!collapsed.has(group.status)"
          @click="toggle(group.status)"
        >
          <ChevronRight
            class="size-4 shrink-0 text-muted-foreground transition-transform duration-150"
            :class="!collapsed.has(group.status) && 'rotate-90'"
            aria-hidden="true"
          />
          <span class="size-2 shrink-0 rounded-full" :class="STATUS_DOT[group.status]" aria-hidden="true" />
          <span class="truncate text-[13px] font-semibold">{{ STATUS_LABEL[group.status] }}</span>
          <span class="tnum ml-auto shrink-0 text-[11px] text-muted-foreground">
            {{ group.tasks.length }} {{ group.tasks.length === 1 ? 'task' : 'tasks' }}
          </span>
        </button>

        <ul v-if="!collapsed.has(group.status)" class="border-t">
          <li v-for="task in group.tasks" :key="task.id">
            <TaskRow :task="task" />
          </li>
        </ul>
      </section>
    </div>

    <div v-else class="p-4 pt-3 sm:px-6 sm:pb-6 sm:pt-3">
      <div class="grid gap-4 lg:grid-cols-[1fr_5fr]">
        <div class="space-y-4">
          <ChartFrame
            title="How you spent your time"
            subtitle="Total across the sprint, by epic"
            :empty="!totalMinutes"
            :height="176"
          >
            <LazySprintDonutChart :key="theme" :slices="slices" />
            <template #legend>
              <ChartLegend v-if="totalMinutes" :items="legend" />
            </template>
          </ChartFrame>

          <ChartFrame
            title="Daily productivity"
            subtitle="Share of each day's tracked time, split by epic"
            :empty="!totalMinutes"
            :height="176"
          >
            <LazySprintDailyChart :key="theme" :labels="dayLabels" :series="dailySeries" :totals="dailyTotals" />
            <template #legend>
              <ChartLegend v-if="totalMinutes" :items="legend" />
            </template>
          </ChartFrame>
        </div>

        <!-- Day-by-day board: a task appears on every day it was actually worked. -->
        <section class="min-w-0 rounded-2xl border bg-card p-4">
        <header class="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 class="text-sm font-semibold">Day by day</h2>
            <p class="mt-0.5 text-[11px] text-muted-foreground">
              Each column lists the tasks you tracked time against that day.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <div class="inline-flex rounded-lg border bg-card p-0.5" role="tablist" aria-label="Day range">
              <button
                v-for="m in DAY_MODES"
                :key="m.id"
                role="tab"
                :aria-selected="mode === m.id"
                class="inline-flex min-h-8 items-center rounded-md px-2.5 text-[12px] font-medium transition-colors duration-150"
                :class="mode === m.id ? 'bg-brand-soft text-primary' : 'text-muted-foreground hover:text-foreground'"
                @click="mode = m.id"
              >
                {{ m.label }}
              </button>
            </div>

            <div class="flex items-center gap-1">
              <Button variant="outline" size="icon-sm" :disabled="page <= 0" aria-label="Earlier days" @click="page--">
                <ChevronLeft class="size-4" />
              </Button>
              <span class="tnum w-28 text-center text-[11px] text-muted-foreground">{{ rangeLabel }}</span>
              <Button variant="outline" size="icon-sm" :disabled="page >= maxPage" aria-label="Later days" @click="page++">
                <ChevronRight class="size-4" />
              </Button>
            </div>
          </div>
        </header>

        <div class="flex gap-3 overflow-x-auto pb-2 scroll-thin">
          <section
            v-for="day in visibleDays"
            :key="day.date"
            class="flex w-[228px] shrink-0 grow flex-col"
            :aria-label="`${fmtLongDate(day.date)}, ${day.entries.length} tasks`"
          >
            <!-- Ghost pill header, cards float below — same look as the Today board. -->
            <header class="mb-2 flex items-baseline gap-1.5 rounded-xl border border-border/50 bg-card px-3 py-2">
              <span class="text-[13px] font-semibold">{{ fmtWeekday(day.date) }}</span>
              <span class="tnum text-[11px] text-muted-foreground">{{ fmtMonthDay(day.date) }}</span>
              <span class="tnum ml-auto rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {{ day.minutes ? fmtDuration(day.minutes) : '—' }}
              </span>
            </header>

            <div class="flex grow flex-col gap-2">
              <article
                v-for="entry in day.entries"
                :key="entry.task.id"
                class="cursor-pointer rounded-lg border bg-card p-2.5 text-left transition-shadow duration-150 hover:shadow-[0_3px_10px_rgba(80,66,56,0.09)]"
                role="button"
                tabindex="0"
                @click="dialog.openEdit(entry.task.id)"
                @keydown.enter.prevent="dialog.openEdit(entry.task.id)"
              >
                <div class="flex items-start gap-1.5">
                  <span
                    class="mt-1 size-2 shrink-0 rounded-full"
                    :style="{ background: store.epic(entry.task.epicId)?.color || 'var(--muted-foreground)' }"
                    aria-hidden="true"
                  />
                  <p class="min-w-0 grow text-[12px] font-medium leading-snug">{{ entry.task.title }}</p>
                </div>
                <div class="mt-1.5 flex items-center gap-1.5">
                  <StatusBadge :status="entry.task.status" />
                  <span class="tnum ml-auto text-[10px] text-muted-foreground">{{ fmtDuration(entry.minutes) }}</span>
                </div>
              </article>

              <p v-if="!day.entries.length" class="rounded-xl border border-dashed px-3 py-6 text-center text-xs leading-relaxed text-muted-foreground">
                {{ day.weekend ? 'Weekend' : 'Nothing tracked' }}
              </p>
            </div>
          </section>
        </div>
        </section>
      </div>
    </div>

    <SprintDialog v-model:sprint-id="editing" />
  </div>
</template>

<script setup lang="ts">
import { ChartColumnBig, ChevronLeft, ChevronRight, GitBranch, ListTodo, Pencil, Plus } from '@lucide/vue'
import { Button } from '~/components/ui/button'
import {
  eachDay, fmtDuration, fmtLongDate, fmtMonthDay, fmtWeekday, isWeekend, toMinutes,
} from '~/utils/date'
import { PRIORITY_RANK, STATUS_DOT, STATUS_LABEL, STATUSES } from '~/utils/labels'

const route = useRoute()
const router = useRouter()
const store = useStore()
const { state } = store
const dialog = useTaskDialog()
const { theme } = useTheme()

const sprint = computed(() => store.sprint(String(route.params.id)))
const phaseLabel = computed(() => (sprint.value ? store.sprintPhase(sprint.value) : ''))

const days = computed(() => (sprint.value ? eachDay(sprint.value.startDate, sprint.value.endDate) : []))
const dayLabels = computed(() => days.value.map(d => `${fmtWeekday(d)} ${fmtMonthDay(d)}`))

const sprintTasks = computed(() => state.tasks.filter(t => t.sprintId === sprint.value?.id))

// Tabs — backed by the query param so the retrospective stays deep-linkable.
const views = [
  { id: 'tasks' as const, label: 'Tasks', icon: ListTodo },
  { id: 'retro' as const, label: 'Retrospective', icon: ChartColumnBig },
]
const tab = computed<'tasks' | 'retro'>(() => (route.query.tab === 'retro' ? 'retro' : 'tasks'))
const setTab = (t: 'tasks' | 'retro') => router.replace({ query: t === 'tasks' ? {} : { tab: t } })

const collapsed = ref(new Set<string>())
const toggle = (key: string) => {
  const next = new Set(collapsed.value)
  next.has(key) ? next.delete(key) : next.add(key)
  collapsed.value = next
}

const statusGroups = computed(() => STATUSES
  .map(status => ({
    status,
    tasks: [...sprintTasks.value.filter(t => t.status === status)]
      .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.order - b.order),
  }))
  .filter(g => g.tasks.length))

const newTask = () => dialog.openNew({ sprintId: sprint.value?.id, status: 'todo' })

const editing = ref<string | null>(null)

const percentDone = computed(() => {
  const counted = sprintTasks.value.filter(t => t.status !== 'cancelled')
  if (!counted.length) return 0
  return Math.round((counted.filter(t => t.status === 'done').length / counted.length) * 100)
})

const sum = (list: number[]) => list.reduce((a, b) => a + b, 0)

/** minutes[epicKey][dayIndex] — the one pass every chart below reads from. */
const matrix = computed(() => {
  const dayIndex = new Map(days.value.map((d, i) => [d, i]))
  const table = new Map<string, number[]>()
  for (const task of sprintTasks.value) {
    const key = task.epicId ?? 'none'
    const row = table.get(key) ?? Array.from({ length: days.value.length }, () => 0)
    for (const s of task.sessions) {
      const i = dayIndex.get(s.date)
      if (i === undefined) continue
      row[i] = (row[i] ?? 0) + Math.max(0, toMinutes(s.end) - toMinutes(s.start))
    }
    table.set(key, row)
  }
  return table
})

const epicKeys = computed(() =>
  [...matrix.value.entries()]
    .filter(([, row]) => row.some(v => v > 0))
    .sort((a, b) => sum(b[1]) - sum(a[1]))
    .map(([key]) => key),
)

const epicMeta = (key: string) => {
  const e = key === 'none' ? undefined : store.epic(key)
  return { label: e?.name ?? 'No epic', color: e?.color ?? '#A8A29E' }
}

const dailyTotals = computed(() =>
  days.value.map((_, i) => [...matrix.value.values()].reduce((s, row) => s + (row[i] ?? 0), 0)),
)
const totalMinutes = computed(() => sum(dailyTotals.value))

// Percentages, so a light day still reads as a full bar of its own composition.
const dailySeries = computed(() => epicKeys.value.map((key) => {
  const row = matrix.value.get(key)!
  const meta = epicMeta(key)
  return {
    label: meta.label,
    color: meta.color,
    data: row.map((minutes, i) => {
      const total = dailyTotals.value[i] ?? 0
      return total ? Math.round((minutes / total) * 100) : 0
    }),
  }
}))

const slices = computed(() => epicKeys.value.map((key) => {
  const meta = epicMeta(key)
  return { ...meta, minutes: sum(matrix.value.get(key)!) }
}))

const legend = computed(() => slices.value.map(s => ({
  label: s.label,
  color: s.color,
  value: `${totalMinutes.value ? Math.round((s.minutes / totalMinutes.value) * 100) : 0}% · ${fmtDuration(s.minutes)}`,
})))

const dayBoard = computed(() => days.value.map((date) => {
  const entries = sprintTasks.value
    .map(task => ({ task, minutes: store.trackedMinutes(task, date) }))
    .filter(e => e.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes)
  return { date, entries, weekend: isWeekend(date), minutes: sum(entries.map(e => e.minutes)) }
}))

// Day-by-day window. Work week drops weekend columns; the others page over every day.
const DAY_MODES = [
  { id: '3d' as const, label: '3 days', size: 3, weekdaysOnly: false },
  { id: '5d' as const, label: 'Work week', size: 5, weekdaysOnly: true },
  { id: '7d' as const, label: 'Week', size: 7, weekdaysOnly: false },
]
const mode = ref<(typeof DAY_MODES)[number]['id']>('7d')
const page = ref(0)
const activeMode = computed(() => DAY_MODES.find(m => m.id === mode.value)!)

const boardDays = computed(() =>
  (activeMode.value.weekdaysOnly ? dayBoard.value.filter(d => !d.weekend) : dayBoard.value),
)
const maxPage = computed(() => Math.max(0, Math.ceil(boardDays.value.length / activeMode.value.size) - 1))
const visibleDays = computed(() => {
  const size = activeMode.value.size
  return boardDays.value.slice(page.value * size, page.value * size + size)
})

const rangeLabel = computed(() => {
  const first = visibleDays.value[0]
  const last = visibleDays.value[visibleDays.value.length - 1]
  if (!first || !last) return '—'
  return first === last ? fmtMonthDay(first.date) : `${fmtMonthDay(first.date)} – ${fmtMonthDay(last.date)}`
})

// Switching mode or sprint can leave the cursor past the end.
watch([mode, maxPage], () => { page.value = Math.min(page.value, maxPage.value) })

useHead({ title: () => (sprint.value ? `${sprint.value.name} · Intently` : 'Sprint · Intently') })
</script>
