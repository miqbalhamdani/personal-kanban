<template>
  <ContextMenu>
    <ContextMenuTrigger as-child>
      <div
        role="button"
        tabindex="0"
        draggable="true"
        class="flex min-h-12 w-full cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 border-b px-4 py-2 text-left transition-colors duration-150 last:border-0 hover:bg-muted/60"
        :class="isDraggingTask(task.id) && 'opacity-40'"
        @click="dialog.openEdit(task.id)"
        @keydown.enter.prevent="dialog.openEdit(task.id)"
        @keydown.space.prevent="dialog.openEdit(task.id)"
        @dragstart="startTask($event, task.id)"
        @dragend="end"
      >
        <span class="size-2 shrink-0 rounded-full" :class="STATUS_DOT[task.status]" :title="STATUS_LABEL[task.status]" aria-hidden="true" />

        <div class="min-w-0 grow">
          <p
            class="truncate text-[13px] font-medium"
            :class="task.status === 'cancelled' && 'line-through decoration-muted-foreground'"
          >
            {{ task.title }}
          </p>
          <p v-if="summary" class="truncate text-[11px] text-muted-foreground">{{ summary }}</p>
        </div>

        <span v-if="epic" class="hidden shrink-0 items-center gap-1.5 text-[11px] font-medium sm:inline-flex" :style="{ color: epicTextColor(epic.color) }">
          <span class="size-2 rounded-full" :style="{ background: epic.color }" aria-hidden="true" />
          {{ epic.name }}
        </span>

        <span
          v-if="tracked"
          class="tnum hidden shrink-0 text-[11px] text-muted-foreground md:inline"
          :title="`${fmtDuration(tracked)} tracked`"
        >{{ fmtDuration(tracked) }}</span>

        <span
          v-if="task.dueDate"
          class="tnum shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium"
          :class="overdue ? 'bg-red-100 text-red-800' : 'text-muted-foreground'"
        >
          <span class="sr-only">{{ overdue ? 'Overdue, due' : 'Due' }} </span>{{ fmtRelativeDay(task.dueDate) }}
        </span>

        <PriorityBadge :priority="task.priority" />
        <StatusBadge :status="task.status" class="hidden sm:inline-flex" />

        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <button
              type="button"
              class="hit -mr-1 grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
              :aria-label="`Actions for ${task.title}`"
              @click.stop
              @keydown.stop
              @pointerdown.stop
            >
              <MoreHorizontal class="size-4" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent class="w-44" align="end">
            <DropdownMenuItem @select="dialog.openEdit(task.id)">
              <Pencil class="size-4" /> Edit task
            </DropdownMenuItem>
            <template v-if="reorder">
              <DropdownMenuItem :disabled="reorder.upDisabled" @select="emit('moveUp')">
                <ArrowUp class="size-4" /> Move up
              </DropdownMenuItem>
              <DropdownMenuItem :disabled="reorder.downDisabled" @select="emit('moveDown')">
                <ArrowDown class="size-4" /> Move down
              </DropdownMenuItem>
            </template>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" @select="actions.remove(task)">
              <Trash2 class="size-4" /> Delete task
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </ContextMenuTrigger>

    <ContextMenuContent class="w-52">
      <ContextMenuItem @select="dialog.openEdit(task.id)">
        <Pencil class="size-4" /> Edit task
      </ContextMenuItem>
      <ContextMenuSub>
        <ContextMenuSubTrigger><MoveRight class="size-4" /> Move to</ContextMenuSubTrigger>
        <ContextMenuSubContent class="w-44">
          <ContextMenuItem
            v-for="s in STATUSES"
            :key="s"
            :disabled="s === task.status"
            @select="actions.moveTo(task, s)"
          >
            <span class="size-1.5 rounded-full" :class="STATUS_DOT[s]" aria-hidden="true" />
            {{ STATUS_LABEL[s] }}
          </ContextMenuItem>
        </ContextMenuSubContent>
      </ContextMenuSub>
      <ContextMenuItem @select="actions.schedule(task, todayISO(), actions.nextFreeSlot())">
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
import { ArrowDown, ArrowUp, Clock, MoreHorizontal, MoveRight, Pencil, Trash2 } from '@lucide/vue'
import type { Task } from '~/types'
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator,
  ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger,
} from '~/components/ui/context-menu'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { fmtDuration, fmtRelativeDay, todayISO } from '~/utils/date'
import { epicTextColor, STATUS_DOT, STATUS_LABEL, STATUSES } from '~/utils/labels'
import { htmlToText } from '~/utils/richtext'

const props = defineProps<{ task: Task; reorder?: { upDisabled: boolean; downDisabled: boolean } }>()
const emit = defineEmits<{ moveUp: []; moveDown: [] }>()

const store = useStore()
const dialog = useTaskDialog()
const actions = useTaskActions()
const { startTask, end, isDraggingTask } = useDrag()

const epic = computed(() => store.epic(props.task.epicId))
/** Descriptions hold light HTML now; previews show one flat line of it. */
const summary = computed(() => htmlToText(props.task.description))
const tracked = computed(() => store.trackedMinutes(props.task))
const overdue = computed(() =>
  !!props.task.dueDate
  && props.task.dueDate < todayISO()
  && props.task.status !== 'done'
  && props.task.status !== 'cancelled',
)
</script>
