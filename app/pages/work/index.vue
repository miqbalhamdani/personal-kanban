<template>
  <!-- Below xl the page scrolls normally and each pane gets its own height;
       from xl it becomes a locked two-pane workspace. -->
  <div class="flex min-h-[calc(100dvh-3.5rem)] flex-col xl:h-dvh">
    <PageHeader :title="fmtRelativeDay(viewDay)" :subtitle="fmtDayLong(viewDay)">
      <template #title-append>
        <!-- A running clock only tells the truth next to today. -->
        <span
          v-if="onToday"
          class="tnum rounded-md bg-muted px-1.5 py-0.5 text-sm font-semibold text-muted-foreground"
          aria-label="Current time"
        >
          {{ clock }}
        </span>
      </template>
      <template #actions>
        <!-- Same stepper as the month calendar on the Task page. -->
        <div class="flex items-center gap-1.5">
          <Button variant="outline" size="sm" class="hit size-8 p-0" aria-label="Previous day" @click="step(-1)">
            <ChevronLeft class="size-4" aria-hidden="true" />
          </Button>
          <Button variant="outline" size="sm" :disabled="onToday" @click="goToday">Today</Button>
          <Button variant="outline" size="sm" class="hit size-8 p-0" aria-label="Next day" @click="step(1)">
            <ChevronRight class="size-4" aria-hidden="true" />
          </Button>
        </div>
        <Button class="gap-1.5" @click="dialog.openNew({ dueDate: viewDay, status: 'todo' })">
          <Plus class="size-4" /> New task
        </Button>
      </template>
    </PageHeader>

    <div class="grid min-h-0 grow grid-cols-[minmax(0,1fr)] gap-4 p-4 sm:px-6 xl:py-0 xl:grid-cols-[minmax(0,1fr)_360px] xl:grid-rows-[minmax(0,1fr)] xl:overflow-hidden">
      <!-- Four day board -->
      <div class="flex h-[460px] min-w-0 flex-col gap-2 xl:h-auto xl:min-h-0 xl:py-4">
        <div class="flex items-baseline justify-between gap-2">
          <h2 class="text-sm font-semibold">
            {{ onToday ? 'Next four days' : `${fmtMonthDay(window4[0]!)} – ${fmtMonthDay(window4.at(-1)!)}` }}
          </h2>
          <p class="hidden text-[11px] text-muted-foreground sm:block">Drop a card on a day to change its due date</p>
        </div>

        <div class="flex min-h-0 grow gap-3 overflow-x-auto pb-2 scroll-thin">
          <BoardColumn
            v-for="day in days"
            :key="day.date"
            :title="fmtRelativeDay(day.date)"
            :subtitle="fmtMonthDay(day.date)"
            :tasks="day.tasks"
            :drop-id="`day:${day.date}`"
            :dot="day.date === today ? 'bg-brand' : undefined"
            variant="ghost"
            addable
            empty-text="No task due on this day."
            @add="dialog.openNew({ dueDate: day.date, status: 'todo' })"
            @drop-task="id => onDropOnDay(id, day.date)"
          />

          <!-- Overdue and undated work has to live somewhere, or it silently vanishes. -->
          <BoardColumn
            v-if="spillover.length"
            title="Needs a date"
            :subtitle="`${overdueShown} overdue`"
            :tasks="spillover"
            drop-id="day:none"
            variant="ghost"
            empty-text="Everything has a date."
            @drop-task="id => actions.setDueDate(store.task(id)!, null)"
          />
        </div>
      </div>

      <!-- Day calendar for whichever day the page is on -->
      <DayCalendar :date="viewDay" class="h-[calc(100dvh-3.5rem)] xl:h-auto xl:min-h-0 xl:border-y-0" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronLeft, ChevronRight, Plus } from '@lucide/vue'
import { Button } from '~/components/ui/button'
import { addDays, fmtDayLong, fmtMonthDay, fmtRelativeDay, todayISO } from '~/utils/date'
import { PRIORITY_RANK } from '~/utils/labels'

const store = useStore()
const { state } = store
const dialog = useTaskDialog()
const actions = useTaskActions()

// `today` stays the real today — it marks the brand dot and draws the overdue line.
// `viewDay` is whichever day the page is showing; everything else derives from it.
const today = todayISO()
const viewDay = ref(today)
const onToday = computed(() => viewDay.value === today)
const window4 = computed(() => [0, 1, 2, 3].map(n => addDays(viewDay.value, n)))

const step = (n: number) => { viewDay.value = addDays(viewDay.value, n) }
const goToday = () => { viewDay.value = today }

const open = computed(() => state.tasks.filter(t => t.status !== 'done' && t.status !== 'cancelled'))

const byPriorityThenOrder = (a: { priority: keyof typeof PRIORITY_RANK; order: number }, b: typeof a) =>
  PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.order - b.order

// `open`, not every task: a finished card is not work for today.
const days = computed(() => window4.value.map(date => ({
  date,
  tasks: open.value.filter(t => t.dueDate === date).sort(byPriorityThenOrder),
})))

// Overdue and undated work, minus anything the visible window already shows: stepping
// back a day would otherwise list that day's cards twice.
const spillover = computed(() => open.value
  .filter(t => !t.dueDate || (t.dueDate < today && !window4.value.includes(t.dueDate)))
  .sort(byPriorityThenOrder))
const overdueShown = computed(() => spillover.value.filter(t => t.dueDate).length)

// Live clock with seconds in the header.
const clock = ref('')
let clockTimer: ReturnType<typeof setInterval>
const tick = () => {
  clock.value = new Date().toLocaleTimeString(undefined, {
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
}
onMounted(() => { tick(); clockTimer = setInterval(tick, 1000) })
onBeforeUnmount(() => clearInterval(clockTimer))

function onDropOnDay(taskId: string, date: string) {
  const task = store.task(taskId)
  if (task && task.dueDate !== date) actions.setDueDate(task, date)
}
</script>
