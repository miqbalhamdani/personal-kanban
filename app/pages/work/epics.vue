<template>
  <div class="min-h-[calc(100dvh-3.5rem)] lg:min-h-dvh">
    <PageHeader title="Epics" :subtitle="`${state.epics.length} epics on the timeline`">
      <template #actions>
        <Button class="gap-1.5" @click="editing = 'new'">
          <Plus class="size-4" /> New epic
        </Button>
      </template>
    </PageHeader>

    <div class="space-y-4 p-4 sm:px-6 sm:py-6">
      <EmptyState
        v-if="!state.epics.length"
        :icon="Layers"
        title="No epics yet"
        description="Epics group related tasks and give the sprint charts their colours."
      >
        <Button size="sm" variant="outline" @click="editing = 'new'">Create the first epic</Button>
      </EmptyState>

      <section v-else class="overflow-hidden rounded-2xl border bg-card">
        <header class="flex flex-wrap items-center gap-2 border-b px-4 py-3">
          <div class="grow">
            <h2 class="text-sm font-semibold">Timeline</h2>
            <p class="mt-0.5 text-[11px] text-muted-foreground">
              Each bar runs from the epic's earliest task to its due date. Expand an epic to see its tasks;
              click a name or bar to edit.
            </p>
          </div>
          <div class="inline-flex rounded-lg border p-0.5" role="group" aria-label="Timeline zoom">
            <button
              v-for="z in zooms"
              :key="z.px"
              type="button"
              class="min-h-9 rounded-md px-2.5 text-[12px] font-medium transition-colors duration-150"
              :class="dayPx === z.px ? 'bg-brand-soft text-primary' : 'text-muted-foreground hover:text-foreground'"
              :aria-pressed="dayPx === z.px"
              @click="dayPx = z.px"
            >{{ z.label }}</button>
          </div>
        </header>

        <div class="overflow-x-auto scroll-thin">
          <div class="min-w-max">
            <!-- Month + day header -->
            <div class="sticky top-0 z-10 flex border-b bg-card">
              <div class="sticky left-0 z-20 w-[224px] shrink-0 border-r bg-card px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Epic
              </div>
              <div>
                <div class="flex">
                  <div
                    v-for="month in months"
                    :key="month.key"
                    class="shrink-0 truncate border-r px-2 py-1 text-[11px] font-semibold"
                    :style="{ width: `${month.days * dayPx}px` }"
                  >{{ month.label }}</div>
                </div>
                <div class="flex">
                  <div
                    v-for="day in timeline"
                    :key="day"
                    class="tnum shrink-0 border-r text-center text-[9px] leading-5"
                    :class="[
                      isWeekend(day) && 'bg-muted/60',
                      day === today && 'bg-brand-soft font-bold text-primary',
                    ]"
                    :style="{ width: `${dayPx}px` }"
                  >{{ dayPx >= 16 ? fromISO(day).getDate() : '' }}</div>
                </div>
              </div>
            </div>

            <!-- Epic rows -->
            <template v-for="epic in rows" :key="epic.id">
              <div class="flex border-b transition-colors duration-150 hover:bg-muted/40">
                <div class="sticky left-0 z-10 flex w-[224px] shrink-0 items-center gap-1 border-r bg-card py-2.5 pl-2 pr-3">
                  <button
                    type="button"
                    class="hit grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
                    :aria-expanded="expanded.has(epic.id)"
                    :aria-label="`${expanded.has(epic.id) ? 'Collapse' : 'Expand'} ${epic.name} tasks`"
                    @click="toggle(epic.id)"
                  >
                    <ChevronRight
                      class="size-4 transition-transform duration-150"
                      :class="expanded.has(epic.id) && 'rotate-90'"
                      aria-hidden="true"
                    />
                  </button>
                  <span class="size-2.5 shrink-0 rounded-full" :style="{ background: epic.color }" aria-hidden="true" />
                  <button type="button" class="min-w-0 grow rounded-md text-left" @click="editing = epic.id">
                    <p class="truncate text-[13px] font-medium">{{ epic.name }}</p>
                    <p class="tnum truncate text-[10px] text-muted-foreground">
                      {{ epic.doneCount }}/{{ epic.taskCount }} done · {{ PRIORITY_LABEL[epic.priority] }}
                    </p>
                  </button>
                </div>

                <div class="relative" :style="{ width: `${timeline.length * dayPx}px`, height: '52px' }">
                  <DayGuides :timeline="timeline" :day-px="dayPx" :today="today" />

                  <button
                    v-if="epic.bar"
                    type="button"
                    class="hit absolute top-1/2 flex h-8 -translate-y-1/2 items-center gap-1.5 rounded-full px-2.5 text-left text-[11px] font-semibold text-white shadow-[0_1px_3px_rgba(80,66,56,0.2)] transition-transform duration-150 hover:scale-[1.01]"
                    :style="{
                      left: `${epic.bar.offset * dayPx + 2}px`,
                      width: `${Math.max(epic.bar.length * dayPx - 4, 26)}px`,
                      background: epic.color,
                    }"
                    :title="`${epic.name}: ${fmtMonthDay(epic.bar.start)} – ${fmtMonthDay(epic.bar.end)}`"
                    @click="editing = epic.id"
                  >
                    <!-- Clipping lives on this inner layer: overflow-hidden on the button
                         itself would also clip its 44px hit overlay. -->
                    <span
                      v-if="epic.taskCount"
                      class="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
                      aria-hidden="true"
                    >
                      <span class="absolute inset-y-0 left-0 bg-white/25" :style="{ width: `${epic.percent}%` }" />
                    </span>
                    <span class="relative truncate">{{ epic.name }}</span>
                    <span class="tnum relative ml-auto shrink-0 opacity-90">{{ epic.percent }}%</span>
                  </button>

                  <p v-else class="absolute inset-y-0 left-2 flex items-center text-[11px] text-muted-foreground">
                    No dates yet
                  </p>
                </div>
              </div>

              <!-- Expanded: this epic's tasks -->
              <template v-if="expanded.has(epic.id)">
                <div
                  v-for="task in epic.tasks"
                  :key="task.id"
                  class="flex border-b bg-muted/25 transition-colors duration-150 hover:bg-muted/50"
                >
                  <div class="sticky left-0 z-10 flex w-[224px] shrink-0 items-center gap-2 border-r bg-card py-1.5 pl-9 pr-3">
                    <span class="size-1.5 shrink-0 rounded-full" :class="STATUS_DOT[task.status]" :title="STATUS_LABEL[task.status]" aria-hidden="true" />
                    <button
                      type="button"
                      class="min-w-0 grow truncate rounded-md text-left text-[12px] transition-colors duration-150 hover:text-primary"
                      :class="task.status === 'cancelled' && 'text-muted-foreground line-through'"
                      @click="dialog.openEdit(task.id)"
                    >
                      {{ task.title }}
                    </button>
                  </div>

                  <div class="relative" :style="{ width: `${timeline.length * dayPx}px`, height: '34px' }">
                    <DayGuides :timeline="timeline" :day-px="dayPx" :today="today" />

                    <button
                      v-if="task.bar"
                      type="button"
                      class="hit absolute top-1/2 h-2.5 -translate-y-1/2 rounded-full opacity-80 transition-opacity duration-150 hover:opacity-100"
                      :style="{
                        left: `${task.bar.offset * dayPx + 2}px`,
                        width: `${Math.max(task.bar.length * dayPx - 4, 10)}px`,
                        background: epic.color,
                      }"
                      :title="`${task.title}: ${fmtMonthDay(task.bar.start)} – ${fmtMonthDay(task.bar.end)}`"
                      :aria-label="`${task.title}, ${fmtMonthDay(task.bar.start)} to ${fmtMonthDay(task.bar.end)}. Open task.`"
                      @click="dialog.openEdit(task.id)"
                    />
                    <p v-else class="absolute inset-y-0 left-2 flex items-center text-[10px] text-muted-foreground">
                      No dates
                    </p>
                  </div>
                </div>

                <div v-if="!epic.tasks.length" class="flex border-b">
                  <div class="sticky left-0 z-10 w-[224px] shrink-0 border-r bg-card py-2 pl-9 pr-3 text-[11px] text-muted-foreground">
                    No task in this epic yet.
                  </div>
                  <div :style="{ width: `${timeline.length * dayPx}px` }" />
                </div>
              </template>
            </template>
          </div>
        </div>
      </section>
    </div>

    <EpicDialog v-model:epic-id="editing" />
  </div>
</template>

<script setup lang="ts">
import { ChevronRight, Layers, Plus } from '@lucide/vue'
import type { Task } from '~/types'
import { Button } from '~/components/ui/button'
import {
  addDays, diffDays, eachDay, fmtMonthDay, fromISO, isWeekend, todayISO,
} from '~/utils/date'
import { PRIORITY_LABEL, PRIORITY_RANK, STATUS_DOT, STATUS_LABEL } from '~/utils/labels'

const store = useStore()
const { state } = store
const dialog = useTaskDialog()

const editing = ref<string | null>(null)
const expanded = ref(new Set<string>())
const today = todayISO()

const zooms = [{ label: 'Compact', px: 8 }, { label: 'Normal', px: 18 }, { label: 'Wide', px: 30 }]
const dayPx = ref(18)

function toggle(id: string) {
  const next = new Set(expanded.value)
  next.has(id) ? next.delete(id) : next.add(id)
  expanded.value = next
}

/** Every date a task touches: its sessions plus its due date. */
function taskSpan(t: Task): { start: string; end: string } | null {
  const dates = [...t.sessions.map(s => s.date), ...(t.dueDate ? [t.dueDate] : [])].sort()
  return dates.length ? { start: dates[0]!, end: dates.at(-1)! } : null
}

const epicSpans = computed(() => new Map(state.epics.map((e) => {
  const dates = state.tasks
    .filter(t => t.epicId === e.id)
    .flatMap(t => { const s = taskSpan(t); return s ? [s.start, s.end] : [] })
    .concat(e.dueDate ? [e.dueDate] : [])
    .sort()
  return [e.id, dates.length ? { start: dates[0]!, end: dates.at(-1)! } : null]
})))

const timeline = computed(() => {
  const all = [...epicSpans.value.values()].filter(Boolean) as { start: string; end: string }[]
  if (!all.length) return eachDay(addDays(today, -7), addDays(today, 21))
  const start = all.reduce((min, s) => (s.start < min ? s.start : min), all[0]!.start)
  const end = all.reduce((max, s) => (s.end > max ? s.end : max), all[0]!.end)
  // Pad so bars never touch the edge, and always keep today in view.
  return eachDay(
    addDays(start < today ? start : today, -3),
    addDays(end > today ? end : today, 3),
  )
})

const months = computed(() => {
  const out: { key: string; label: string; days: number }[] = []
  for (const day of timeline.value) {
    const d = fromISO(day)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const last = out.at(-1)
    if (last?.key === key) last.days++
    else out.push({ key, label: d.toLocaleString(undefined, { month: 'long', year: 'numeric' }), days: 1 })
  }
  return out
})

const toBar = (span: { start: string; end: string } | null) => {
  if (!span) return null
  const first = timeline.value[0]!
  return { ...span, offset: diffDays(first, span.start), length: diffDays(span.start, span.end) + 1 }
}

const rows = computed(() => [...state.epics]
  .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.name.localeCompare(b.name))
  .map((e) => {
    const tasks = state.tasks
      .filter(t => t.epicId === e.id)
      .sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999') || a.order - b.order)
      .map(t => ({ ...t, bar: toBar(taskSpan(t)) }))
    const counted = tasks.filter(t => t.status !== 'cancelled')
    const doneCount = counted.filter(t => t.status === 'done').length
    return {
      ...e,
      tasks,
      taskCount: counted.length,
      doneCount,
      percent: counted.length ? Math.round((doneCount / counted.length) * 100) : 0,
      bar: toBar(epicSpans.value.get(e.id) ?? null),
    }
  }))
</script>
