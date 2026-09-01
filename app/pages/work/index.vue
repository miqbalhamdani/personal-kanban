<template>
  <!-- Below xl the page scrolls normally and each pane gets its own height;
       from xl it becomes a locked two-pane workspace. -->
  <div class="flex min-h-[calc(100dvh-3.5rem)] flex-col xl:h-dvh">
    <PageHeader title="Today" :subtitle="fmtDayLong(today)">
      <template #title-append>
        <span class="tnum rounded-md bg-muted px-1.5 py-0.5 text-sm font-semibold text-muted-foreground" aria-label="Current time">
          {{ clock }}
        </span>
      </template>
      <template #actions>
        <Button class="gap-1.5" @click="dialog.openNew({ dueDate: today, status: 'todo' })">
          <Plus class="size-4" /> New task
        </Button>
      </template>
    </PageHeader>

    <div class="grid min-h-0 grow grid-cols-[minmax(0,1fr)] gap-4 p-4 sm:px-6 xl:py-0 xl:grid-cols-[minmax(0,1fr)_360px] xl:grid-rows-[minmax(0,1fr)] xl:overflow-hidden">
      <!-- Four day board -->
      <div class="flex h-[460px] min-w-0 flex-col gap-2 xl:h-auto xl:min-h-0 xl:py-4">
        <div class="flex items-baseline justify-between gap-2">
          <h2 class="text-sm font-semibold">Next four days</h2>
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
            :subtitle="`${overdue.length} overdue`"
            :tasks="spillover"
            drop-id="day:none"
            variant="ghost"
            empty-text="Everything has a date."
            @drop-task="id => actions.setDueDate(store.task(id)!, null)"
          />
        </div>
      </div>

      <!-- Today calendar -->
      <DayCalendar :date="today" class="h-[calc(100dvh-3.5rem)] xl:h-auto xl:min-h-0 xl:border-y-0" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus } from '@lucide/vue'
import { Button } from '~/components/ui/button'
import { addDays, fmtDayLong, fmtMonthDay, fmtRelativeDay, todayISO } from '~/utils/date'
import { PRIORITY_RANK } from '~/utils/labels'

const store = useStore()
const { state } = store
const dialog = useTaskDialog()
const actions = useTaskActions()

const today = todayISO()
const window4 = [0, 1, 2, 3].map(n => addDays(today, n))

const open = computed(() => state.tasks.filter(t => t.status !== 'done' && t.status !== 'cancelled'))

const byPriorityThenOrder = (a: { priority: keyof typeof PRIORITY_RANK; order: number }, b: typeof a) =>
  PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.order - b.order

// `open`, not every task: a finished card is not work for today.
const days = computed(() => window4.map(date => ({
  date,
  tasks: open.value.filter(t => t.dueDate === date).sort(byPriorityThenOrder),
})))

const overdue = computed(() => open.value.filter(t => t.dueDate && t.dueDate < today))
const spillover = computed(() =>
  [...overdue.value, ...open.value.filter(t => !t.dueDate)].sort(byPriorityThenOrder),
)

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
