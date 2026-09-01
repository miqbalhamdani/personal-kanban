<template>
  <div v-if="!epic" class="p-6">
    <EmptyState
      :icon="Layers"
      title="Epic not found"
      description="It may have been deleted from this browser."
    >
      <Button variant="outline" size="sm" as-child><NuxtLink to="/work/epics">Back to epics</NuxtLink></Button>
    </EmptyState>
  </div>

  <div v-else class="min-h-[calc(100dvh-3.5rem)] lg:min-h-dvh">
    <PageHeader :title="epic.name" :subtitle="subtitle" back-to="/work/epics" back-label="Back to epics">
      <template #title-append>
        <span
          class="size-2.5 shrink-0 rounded-full"
          :style="{ background: epic.color }"
          :title="`Epic colour: ${epic.color}`"
          aria-hidden="true"
        />
      </template>

      <template #actions>
        <div class="hidden items-center gap-4 pr-1 sm:flex">
          <Stat :value="String(epicTasks.length)" label="tasks" />
          <Stat :value="`${percentDone}%`" label="completed" />
          <Stat :value="fmtDuration(totalMinutes)" label="tracked" />
        </div>
        <Button variant="outline" class="gap-1.5" @click="editing = epic.id">
          <Pencil class="size-3.5" /> Edit
        </Button>
        <Button variant="outline" class="gap-1.5" @click="picking = epic.id">
          <ListPlus class="size-4" /> Add existing
        </Button>
        <Button class="gap-1.5" @click="newTask">
          <Plus class="size-4" /> New task
        </Button>
      </template>
    </PageHeader>

    <div class="space-y-3 p-4 sm:px-6 sm:py-6">
      <section v-if="epic.description" class="rounded-2xl border bg-card px-4 py-3">
        <h2 class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Description</h2>
        <p class="mt-1 whitespace-pre-line text-[13px] leading-relaxed">{{ epic.description }}</p>
      </section>

      <EmptyState
        v-if="!epicTasks.length"
        :icon="ListTodo"
        title="No task in this epic yet"
        description="Create one here, or pull in tasks that do not belong to an epic yet."
      >
        <div class="flex flex-wrap items-center justify-center gap-2">
          <Button class="gap-1.5" @click="newTask">
            <Plus class="size-4" /> New task
          </Button>
          <Button variant="outline" class="gap-1.5" @click="picking = epic.id">
            <ListPlus class="size-4" /> Add existing task
          </Button>
        </div>
      </EmptyState>

      <!-- Same anatomy as the sprint detail list: one collapsible section per status. -->
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

    <EpicDialog v-model:epic-id="editing" />
    <EpicTaskPicker v-model:epic-id="picking" />
  </div>
</template>

<script setup lang="ts">
import { ChevronRight, Layers, ListPlus, ListTodo, Pencil, Plus } from '@lucide/vue'
import { Button } from '~/components/ui/button'
import { fmtDuration, fmtMonthDay } from '~/utils/date'
import { PRIORITY_LABEL, PRIORITY_RANK, STATUS_DOT, STATUS_LABEL, STATUSES } from '~/utils/labels'

const route = useRoute()
const store = useStore()
const { state } = store
const dialog = useTaskDialog()

const epic = computed(() => store.epic(String(route.params.id)))
const epicTasks = computed(() => state.tasks.filter(t => t.epicId === epic.value?.id))

const { epicId: editing } = useEpicDialog()
const picking = ref<string | null>(null)

/** Either end of the window can be open, so all four shapes need a reading. */
const dateLabel = computed(() => {
  const e = epic.value
  if (!e) return ''
  if (e.startDate && e.endDate) return `${fmtMonthDay(e.startDate)} – ${fmtMonthDay(e.endDate)}`
  if (e.endDate) return `Ends ${fmtMonthDay(e.endDate)}`
  if (e.startDate) return `Starts ${fmtMonthDay(e.startDate)}`
  return 'No dates yet'
})

const subtitle = computed(() => {
  const e = epic.value
  if (!e) return ''
  const n = epicTasks.value.length
  return `${dateLabel.value} · ${PRIORITY_LABEL[e.priority]} priority · ${n} ${n === 1 ? 'task' : 'tasks'}`
})

const collapsed = ref(new Set<string>())
const toggle = (key: string) => {
  const next = new Set(collapsed.value)
  next.has(key) ? next.delete(key) : next.add(key)
  collapsed.value = next
}

const statusGroups = computed(() => STATUSES
  .map(status => ({
    status,
    tasks: [...epicTasks.value.filter(t => t.status === status)]
      .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.order - b.order),
  }))
  .filter(g => g.tasks.length))

/** Cancelled tasks are excluded from the count, matching the timeline's per-epic percentage. */
const percentDone = computed(() => {
  const counted = epicTasks.value.filter(t => t.status !== 'cancelled')
  if (!counted.length) return 0
  return Math.round((counted.filter(t => t.status === 'done').length / counted.length) * 100)
})

const totalMinutes = computed(() => epicTasks.value.reduce((sum, t) => sum + store.trackedMinutes(t), 0))

/** The point of this page's New task button: the epic is already picked in the form. */
const newTask = () => dialog.openNew({ epicId: epic.value?.id, status: 'todo' })

useHead({ title: () => (epic.value ? `${epic.value.name} · Intently` : 'Epic · Intently') })
</script>
