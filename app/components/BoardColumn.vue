<template>
  <section
    class="flex min-h-0 w-[280px] shrink-0 flex-col transition-colors duration-150"
    :class="ghost
      ? ['rounded-2xl', active && 'outline-2 outline-dashed outline-brand -outline-offset-2 bg-brand-soft/40']
      : ['rounded-2xl border bg-muted/60', active && 'border-brand bg-brand-soft/70']"
    :aria-label="`${title}, ${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}`"
    @dragover="over($event, dropId)"
    @dragleave="leave(dropId)"
    @drop.prevent="onDrop"
  >
    <!-- Ghost: a compact pill header row, cards float on the page background. -->
    <header
      class="flex items-center gap-2"
      :class="ghost ? 'rounded-xl border border-border/50 bg-card px-3 py-2' : 'px-3 pb-2 pt-3'"
    >
      <span v-if="dot" class="size-2 rounded-full" :class="dot" aria-hidden="true" />
      <span v-else-if="swatch" class="size-2 rounded-full" :style="{ background: swatch }" aria-hidden="true" />
      <h2 class="min-w-0 grow truncate text-[13px] font-semibold">{{ title }}</h2>
      <span v-if="subtitle" class="tnum shrink-0 text-[11px] text-muted-foreground">{{ subtitle }}</span>
      <span
        class="tnum shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground"
        :class="ghost ? 'bg-muted' : 'bg-card'"
      >{{ tasks.length }}</span>
      <button
        v-if="ghost && addable"
        type="button"
        class="hit -mr-1 grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
        :aria-label="`Add task to ${title}`"
        @click="emit('add')"
      >
        <Plus class="size-3.5" />
      </button>
    </header>

    <div
      class="flex min-h-0 grow flex-col gap-2 overflow-y-auto scroll-thin"
      :class="ghost ? 'pt-2' : 'px-2 pb-2'"
    >
      <TaskCard v-for="task in tasks" :key="task.id" :task="task" />

      <p v-if="!tasks.length" class="rounded-xl border border-dashed px-3 py-6 text-center text-xs leading-relaxed text-muted-foreground">
        {{ emptyText }}
      </p>
    </div>

    <footer v-if="addable && !ghost" class="px-2 pb-2">
      <button
        type="button"
        class="flex min-h-10 w-full items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-muted-foreground transition-colors duration-150 hover:bg-card hover:text-foreground"
        @click="emit('add')"
      >
        <Plus class="size-3.5" aria-hidden="true" />
        Add task
      </button>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { Plus } from '@lucide/vue'
import type { Task } from '~/types'

const props = withDefaults(defineProps<{
  title: string
  subtitle?: string
  tasks: Task[]
  dropId: string
  dot?: string
  swatch?: string
  emptyText?: string
  addable?: boolean
  variant?: 'default' | 'ghost'
}>(), { emptyText: 'Nothing here yet. Drag a task in or add one.', addable: false, variant: 'default' })

const emit = defineEmits<{ add: []; dropTask: [taskId: string] }>()

const { dragging, over, leave, isOver, end } = useDrag()

const ghost = computed(() => props.variant === 'ghost')
const active = computed(() => isOver(props.dropId) && dragging.value?.kind === 'task')

function onDrop() {
  const payload = dragging.value
  end()
  if (payload?.kind === 'task') emit('dropTask', payload.taskId)
}
</script>
