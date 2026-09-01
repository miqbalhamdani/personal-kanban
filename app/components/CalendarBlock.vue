<template>
  <ContextMenu>
    <ContextMenuTrigger as-child>
      <div
        draggable="true"
        role="button"
        tabindex="0"
        class="group absolute inset-x-1 z-10 flex cursor-grab flex-col overflow-hidden border-l-2 bg-card px-2 text-left shadow-[0_1px_2px_rgba(80,66,56,0.07)] transition-shadow duration-150 hover:shadow-[0_4px_10px_rgba(80,66,56,0.14)] active:cursor-grabbing"
        :class="compact ? 'justify-center py-0' : 'py-1'"
        :style="style"
        :aria-label="`${task.title}, ${session.start} to ${session.end}. Arrow keys move it, shift and arrow keys resize it.`"
        @dragstart="onDragStart"
        @dragend="end"
        @keydown="onKeydown"
        @click="dialog.openEdit(task.id)"
      >
        <!-- Short blocks have no room for a title: show time and epic on one line. -->
        <p v-if="compact" class="flex items-center gap-1 truncate text-[10px] font-semibold leading-4">
          <span class="tnum shrink-0" :style="{ color: ink }">{{ session.start }}–{{ session.end }}</span>
          <span class="truncate font-medium text-muted-foreground">{{ epic?.name || 'No epic' }}</span>
        </p>
        <template v-else>
          <p class="tnum truncate text-[10px] font-semibold leading-4" :style="{ color: ink }">
            {{ session.start }}–{{ session.end }}
          </p>
          <p class="truncate text-[11px] font-medium leading-4">{{ task.title }}</p>
          <p v-if="tall" class="truncate text-[10px] font-medium leading-4" :style="{ color: ink }">
            {{ epic?.name || 'No epic' }}
          </p>
        </template>

        <!-- Resize grip. Pointer events, not HTML5 drag, so it can track live. -->
        <span
          class="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize opacity-0 transition-opacity duration-150 group-hover:opacity-100"
          aria-hidden="true"
          @pointerdown.stop.prevent="startResize"
          @click.stop
        >
          <span class="mx-auto block h-0.5 w-6 translate-y-[3px] rounded-full bg-muted-foreground/60" />
        </span>
      </div>
    </ContextMenuTrigger>

    <ContextMenuContent class="w-48">
      <ContextMenuItem @select="dialog.openEdit(task.id)">
        <Pencil class="size-4" /> Open task
      </ContextMenuItem>
      <ContextMenuItem @select="duplicate">
        <Copy class="size-4" /> Duplicate block
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem variant="destructive" @select="unschedule">
        <CalendarX class="size-4" /> Unschedule
      </ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
</template>

<script setup lang="ts">
import { CalendarX, Copy, Pencil } from '@lucide/vue'
import { toast } from 'vue-sonner'
import type { Session, Task } from '~/types'
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger,
} from '~/components/ui/context-menu'
import { toMinutes, toTime } from '~/utils/date'
import { epicTextColor } from '~/utils/labels'

const props = defineProps<{ task: Task; session: Session; pxPerMin: number }>()
const emit = defineEmits<{ nudge: [minutes: number]; resize: [minutes: number] }>()

const store = useStore()
const dialog = useTaskDialog()
const { startSession, end } = useDrag()

const length = computed(() => Math.max(0, toMinutes(props.session.end) - toMinutes(props.session.start)))
const tall = computed(() => length.value >= 45)
const compact = computed(() => length.value <= 30)
const epic = computed(() => store.epic(props.task.epicId))
const accent = computed(() => epic.value?.color || 'var(--primary)')
// Text needs more contrast than the border stripe: mix toward the foreground.
const ink = computed(() => epicTextColor(accent.value))

const style = computed(() => ({
  top: `${toMinutes(props.session.start) * props.pxPerMin}px`,
  height: `${Math.max(length.value * props.pxPerMin, 22)}px`,
  borderLeftColor: accent.value,
  background: `color-mix(in srgb, ${accent.value} 18%, var(--card))`,
}))

function onDragStart(event: DragEvent) {
  const grabOffset = event.offsetY / props.pxPerMin
  startSession(event, props.task.id, props.session.id, grabOffset)
}

/** Arrows move in 15-minute steps; Shift+arrows resize. Covers touch and keyboard. */
function onKeydown(event: KeyboardEvent) {
  const step = event.altKey ? 60 : 15
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    event.preventDefault()
    const delta = event.key === 'ArrowUp' ? -step : step
    if (event.shiftKey) emit('resize', delta)
    else emit('nudge', delta)
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    dialog.openEdit(props.task.id)
  } else if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault()
    unschedule()
  }
}

function unschedule() {
  const { date, start, end: finish } = props.session
  store.removeSession(props.task.id, props.session.id)
  toast.success('Block removed', {
    action: { label: 'Undo', onClick: () => store.addSession(props.task.id, date, start, finish) },
  })
}

function duplicate() {
  const startMin = toMinutes(props.session.end)
  if (startMin + length.value > 24 * 60) return toast.error('No room left in the day')
  store.addSession(props.task.id, props.session.date, toTime(startMin), toTime(startMin + length.value))
}

/** Live drag-to-resize on the bottom grip. */
function startResize(event: PointerEvent) {
  const startY = event.clientY
  let applied = 0
  const move = (e: PointerEvent) => {
    const delta = Math.round((e.clientY - startY) / props.pxPerMin / 15) * 15
    if (delta === applied) return
    emit('resize', delta - applied)
    applied = delta
  }
  const up = () => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', up)
  }
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', up)
}
</script>
