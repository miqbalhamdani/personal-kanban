<template>
  <ContextMenu>
    <ContextMenuTrigger as-child>
      <article
        :draggable="draggable"
        class="group cursor-grab rounded-xl border border-border/50 bg-card p-3 text-left shadow-[0_1px_2px_rgba(80,66,56,0.05)] transition-[opacity,box-shadow] duration-150 hover:shadow-[0_4px_12px_rgba(80,66,56,0.08)] active:cursor-grabbing"
        :class="[
          isDraggingTask(task.id) && 'opacity-40',
          task.status === 'cancelled' && 'opacity-70',
        ]"
        tabindex="0"
        :aria-label="`${task.title}. ${STATUS_LABEL[task.status]}, ${PRIORITY_LABEL[task.priority]} priority.`"
        @dragstart="onDragStart"
        @dragend="end"
        @click="actions.edit(task.id)"
        @keydown.enter.prevent="actions.edit(task.id)"
        @keydown.space.prevent="actions.edit(task.id)"
      >
        <div class="flex flex-wrap items-center gap-1.5">
          <PriorityBadge :priority="task.priority" />
          <span
            v-if="epic"
            class="inline-flex max-w-full items-center gap-1.5 truncate rounded-full px-2 py-0.5 text-[11px] font-medium leading-5"
            :style="epicBadgeStyle"
          >
            <span class="size-1.5 shrink-0 rounded-full" :style="{ background: epic.color }" aria-hidden="true" />
            {{ epic.name }}
          </span>
        </div>

        <p
          class="mt-2 text-[13px] font-semibold leading-snug"
          :class="task.status === 'cancelled' && 'line-through decoration-muted-foreground'"
        >
          {{ task.title }}
        </p>

        <p v-if="task.description" class="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {{ task.description }}
        </p>

        <p
          v-if="task.dueDate"
          class="tnum mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium"
          :class="overdue ? 'text-red-800' : 'text-muted-foreground'"
        >
          <CalendarDays class="size-3" aria-hidden="true" />
          <span class="sr-only">{{ overdue ? 'Overdue, due' : 'Due' }} </span>{{ fmtRelativeDay(task.dueDate) }}
        </p>
      </article>
    </ContextMenuTrigger>

    <ContextMenuContent class="w-52">
      <ContextMenuItem @select="actions.edit(task.id)">
        <Pencil class="size-4" /> Edit task
      </ContextMenuItem>

      <ContextMenuSub>
        <ContextMenuSubTrigger>
          <MoveRight class="size-4" /> Move to
        </ContextMenuSubTrigger>
        <ContextMenuSubContent class="w-44">
          <ContextMenuItem
            v-for="status in STATUSES"
            :key="status"
            :disabled="status === task.status"
            @select="actions.moveTo(task, status)"
          >
            <span class="size-1.5 rounded-full" :class="STATUS_DOT[status]" aria-hidden="true" />
            {{ STATUS_LABEL[status] }}
          </ContextMenuItem>
        </ContextMenuSubContent>
      </ContextMenuSub>

      <ContextMenuSub>
        <ContextMenuSubTrigger>
          <CalendarDays class="size-4" /> Set due date
        </ContextMenuSubTrigger>
        <ContextMenuSubContent class="w-44">
          <ContextMenuItem v-for="d in 4" :key="d" @select="actions.setDueDate(task, addDays(today, d - 1))">
            {{ fmtRelativeDay(addDays(today, d - 1)) }}
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem :disabled="!task.dueDate" @select="actions.setDueDate(task, null)">
            Clear due date
          </ContextMenuItem>
        </ContextMenuSubContent>
      </ContextMenuSub>

      <ContextMenuItem @select="actions.schedule(task, today, actions.nextFreeSlot())">
        <Clock class="size-4" /> Schedule today
      </ContextMenuItem>

      <ContextMenuSeparator />
      <ContextMenuItem variant="destructive" @select="actions.remove(task)">
        <Trash2 class="size-4" /> Delete task
      </ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
</template>

<script setup lang="ts">
import { CalendarDays, Clock, MoveRight, Pencil, Trash2 } from '@lucide/vue'
import type { Task } from '~/types'
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator,
  ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger,
} from '~/components/ui/context-menu'
import { addDays, fmtRelativeDay, todayISO } from '~/utils/date'
import { PRIORITY_LABEL, STATUS_DOT, STATUS_LABEL, STATUSES } from '~/utils/labels'

const props = withDefaults(defineProps<{
  task: Task
  draggable?: boolean
}>(), { draggable: true })

const store = useStore()
const actions = useTaskActions()
const { startTask, end, isDraggingTask } = useDrag()

const today = todayISO()
const epic = computed(() => store.epic(props.task.epicId))
const overdue = computed(() =>
  !!props.task.dueDate
  && props.task.dueDate < today
  && props.task.status !== 'done'
  && props.task.status !== 'cancelled',
)

/** Tinted pill from the epic colour; ink mixed toward the foreground stays AA on any theme. */
const epicBadgeStyle = computed(() => epic.value && ({
  background: `color-mix(in srgb, ${epic.value.color} 12%, var(--card))`,
  color: `color-mix(in srgb, ${epic.value.color} 55%, var(--foreground))`,
}))

function onDragStart(event: DragEvent) {
  if (!props.draggable) return
  startTask(event, props.task.id)
}
</script>
