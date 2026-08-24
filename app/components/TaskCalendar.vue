<template>
  <div class="space-y-2">
    <div class="flex items-center justify-between gap-2">
      <h2 class="text-sm font-semibold">{{ monthLabel }}</h2>
      <div class="flex items-center gap-1.5">
        <Button variant="outline" size="sm" class="size-8 p-0" aria-label="Previous month" @click="shiftMonth(-1)">
          <ChevronLeft class="size-4" aria-hidden="true" />
        </Button>
        <Button variant="outline" size="sm" @click="goToday">Today</Button>
        <Button variant="outline" size="sm" class="size-8 p-0" aria-label="Next month" @click="shiftMonth(1)">
          <ChevronRight class="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>

    <div class="overflow-x-auto scroll-thin">
      <div class="min-w-[640px] overflow-hidden rounded-2xl border bg-card">
        <div class="grid grid-cols-7 border-b bg-muted/40">
          <div v-for="d in weekdayLabels" :key="d" class="px-2 py-1.5 text-[11px] font-semibold text-muted-foreground">
            {{ d }}
          </div>
        </div>

        <div v-for="(week, w) in weeks" :key="w" class="grid grid-cols-7" :class="w && 'border-t'">
          <div
            v-for="date in week"
            :key="date"
            class="min-h-24 space-y-1 border-r p-1 transition-colors duration-150 last:border-r-0"
            :class="[
              !inMonth(date) && 'bg-muted/30',
              isWeekend(date) && inMonth(date) && 'bg-muted/15',
              isOver(`day:${date}`) && dragging?.kind === 'task'
                && 'outline-2 outline-dashed outline-brand -outline-offset-2 bg-brand-soft/40',
            ]"
            :aria-label="fmtLongDate(date)"
            @dragover="over($event, `day:${date}`)"
            @dragleave="leave(`day:${date}`)"
            @drop.prevent="onDrop(date)"
          >
            <span
              class="tnum inline-flex text-[11px]"
              :class="date === today
                ? 'size-6 items-center justify-center rounded-full bg-brand-soft font-bold text-primary'
                : inMonth(date) ? 'px-1 text-muted-foreground' : 'px-1 text-muted-foreground/60'"
            >
              {{ fromISO(date).getDate() }}
            </span>

            <button
              v-for="t in visible(date)"
              :key="t.id"
              draggable="true"
              class="flex w-full cursor-grab items-center gap-1 rounded-md px-1.5 py-0.5 text-left text-[11px] font-medium leading-4 active:cursor-grabbing"
              :class="[
                isDraggingTask(t.id) && 'opacity-40',
                t.status === 'done' && 'line-through opacity-60',
                !store.epic(t.epicId) && 'bg-muted text-foreground',
              ]"
              :style="chipStyle(t)"
              :title="t.title"
              @dragstart="startTask($event, t.id)"
              @dragend="end"
              @click="actions.edit(t.id)"
            >
              <span
                class="size-1.5 shrink-0 rounded-full"
                :style="{ background: store.epic(t.epicId)?.color ?? 'var(--muted-foreground)' }"
                aria-hidden="true"
              />
              <span class="truncate">{{ t.title }}</span>
            </button>

            <button
              v-if="(byDay.get(date)?.length ?? 0) > CHIP_CAP"
              class="w-full rounded-md px-1.5 py-0.5 text-left text-[11px] text-muted-foreground hover:text-foreground"
              @click="toggleExpanded(date)"
            >
              {{ expanded.has(date) ? 'Show less' : `+${byDay.get(date)!.length - CHIP_CAP} more` }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import type { Task } from '~/types'
import { Button } from '~/components/ui/button'
import { addDays, eachDay, fmtLongDate, fmtWeekday, fromISO, isWeekend, toISO, todayISO } from '~/utils/date'
import { epicTint, PRIORITY_RANK } from '~/utils/labels'

const props = defineProps<{ tasks: Task[] }>()

const store = useStore()
const actions = useTaskActions()
const { dragging, startTask, end, over, leave, isOver, isDraggingTask } = useDrag()

const today = todayISO()
const CHIP_CAP = 3

const monthStart = ref(`${todayISO().slice(0, 7)}-01`)
function shiftMonth(n: number) {
  const d = fromISO(monthStart.value)
  d.setMonth(d.getMonth() + n)
  monthStart.value = toISO(d)
}
const goToday = () => { monthStart.value = `${todayISO().slice(0, 7)}-01` }
const monthLabel = computed(() =>
  fromISO(monthStart.value).toLocaleString(undefined, { month: 'long', year: 'numeric' }))

/** Monday-start grid; the `(getDay() + 6) % 7` offset is the only line encoding that. */
const weeks = computed(() => {
  const first = fromISO(monthStart.value)
  const lead = (first.getDay() + 6) % 7
  const gridStart = addDays(monthStart.value, -lead)
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
  const rows = Math.ceil((lead + daysInMonth) / 7)
  const days = eachDay(gridStart, addDays(gridStart, rows * 7 - 1))
  return Array.from({ length: rows }, (_, w) => days.slice(w * 7, w * 7 + 7))
})
const weekdayLabels = computed(() => weeks.value[0]!.map(fmtWeekday))
const inMonth = (iso: string) => iso.slice(0, 7) === monthStart.value.slice(0, 7)

const byDay = computed(() => {
  const map = new Map<string, Task[]>()
  for (const t of props.tasks) {
    if (!t.dueDate) continue
    const list = map.get(t.dueDate) ?? []
    list.push(t)
    map.set(t.dueDate, list)
  }
  for (const list of map.values())
    list.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.order - b.order)
  return map
})

const expanded = ref(new Set<string>())
const toggleExpanded = (date: string) => {
  const next = new Set(expanded.value)
  next.has(date) ? next.delete(date) : next.add(date)
  expanded.value = next
}
const visible = (date: string) => {
  const list = byDay.value.get(date) ?? []
  return expanded.value.has(date) ? list : list.slice(0, CHIP_CAP)
}

function chipStyle(t: Task) {
  const epic = store.epic(t.epicId)
  return epic && epicTint(epic.color)
}

function onDrop(date: string) {
  const payload = dragging.value
  end()
  if (payload?.kind !== 'task') return
  const task = store.task(payload.taskId)
  if (task && task.dueDate !== date) actions.setDueDate(task, date)
}
</script>
