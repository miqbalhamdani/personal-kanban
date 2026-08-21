<template>
  <section class="flex min-h-0 flex-col border bg-card" aria-label="Day calendar">
    <header class="flex items-center gap-2 border-b px-3 py-2.5">
      <h2 class="min-w-0 grow truncate text-[13px] font-semibold">
        {{ fmtRelativeDay(date) }}
        <span class="tnum ml-1 font-normal text-muted-foreground">{{ fmtDayMonth(date) }}</span>
      </h2>
      <Button variant="ghost" size="sm" class="h-9 shrink-0 gap-1.5 text-xs text-muted-foreground" @click="scrollToNow()">
        <Crosshair class="size-3.5" /> Now
      </Button>
    </header>

    <p class="border-b bg-muted/50 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
      Drag a task in to plan when you will work on it. Drag a block to move it, its bottom
      edge to resize, or focus one and use the arrow keys.
    </p>

    <div ref="scroller" class="relative min-h-0 grow overflow-y-auto scroll-thin">
      <div class="flex">
        <!-- Hour gutter -->
        <div class="w-14 shrink-0 select-none border-r" aria-hidden="true">
          <div
            v-for="h in 24"
            :key="h"
            class="tnum relative text-[10px] font-medium text-muted-foreground"
            :style="{ height: `${HOUR_PX}px` }"
          >
            <span class="absolute -top-1.5 right-1.5">{{ h - 1 === 0 ? '' : hourLabel(h - 1) }}</span>
          </div>
        </div>

        <!-- Slot grid + blocks -->
        <div
          ref="grid"
          class="relative grow"
          :style="{ height: `${24 * HOUR_PX}px` }"
          @dragover="onGridOver"
          @dragleave="leave(dropId)"
          @drop.prevent="onDrop"
        >
          <div
            v-for="i in 48"
            :key="i"
            class="border-b"
            :class="i % 2 === 0 ? 'border-border' : 'border-border/40'"
            :style="{ height: `${HOUR_PX / 2}px` }"
          />

          <!-- Snap preview while dragging -->
          <div
            v-if="ghost !== null"
            class="pointer-events-none absolute inset-x-1 z-10 rounded-lg border-2 border-dashed border-brand bg-brand-soft/80"
            :style="{ top: `${ghost * PX_PER_MIN}px`, height: `${ghostLength * PX_PER_MIN}px` }"
          >
            <span class="tnum px-2 text-[11px] font-semibold leading-6 text-primary">{{ toTime(ghost) }}</span>
          </div>

          <!-- Current time marker -->
          <div
            v-if="isToday"
            class="pointer-events-none absolute inset-x-0 z-20 flex items-center"
            :style="{ top: `${nowMinutes * PX_PER_MIN}px` }"
            aria-hidden="true"
          >
            <span class="size-1.5 shrink-0 rounded-full bg-destructive" />
            <span class="h-px grow bg-destructive/60" />
          </div>

          <CalendarBlock
            v-for="block in blocks"
            :key="block.session.id"
            :task="block.task"
            :session="block.session"
            :px-per-min="PX_PER_MIN"
            @nudge="nudge(block, $event)"
            @resize="resize(block, $event)"
          />

          <p
            v-if="!blocks.length"
            class="pointer-events-none absolute inset-x-4 z-10 text-center text-xs leading-relaxed text-muted-foreground"
            :style="{ top: `${9 * HOUR_PX}px` }"
          >
            Nothing planned. Drag a task from the board into a slot.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Crosshair } from '@lucide/vue'
import { Button } from '~/components/ui/button'
import { fmtDayMonth, fmtRelativeDay, todayISO, toMinutes, toTime } from '~/utils/date'

const props = defineProps<{ date: string }>()

const HOUR_PX = 52
const PX_PER_MIN = HOUR_PX / 60
const SNAP = 15
const MIN_LENGTH = 15
const DEFAULT_LENGTH = 60

const store = useStore()
const { dragging, over, leave, end } = useDrag()

const dropId = computed(() => `calendar:${props.date}`)
const scroller = ref<HTMLElement | null>(null)
const grid = ref<HTMLElement | null>(null)
const ghost = ref<number | null>(null)
const ghostLength = ref(DEFAULT_LENGTH)

const blocks = computed(() => store.sessionsOn(props.date))

const isToday = computed(() => props.date === todayISO())
const nowMinutes = ref(currentMinutes())

const hourLabel = (h: number) => `${`${h}`.padStart(2, '0')}:00`

function currentMinutes() {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

let ticker: ReturnType<typeof setInterval>
onMounted(() => {
  nextTick(() => scrollToNow('auto'))
  ticker = setInterval(() => { nowMinutes.value = currentMinutes() }, 60_000)
})
onBeforeUnmount(() => clearInterval(ticker))

function scrollToNow(behavior: ScrollBehavior = 'smooth') {
  const target = isToday.value ? Math.max(0, nowMinutes.value - 90) : 8 * 60
  scroller.value?.scrollTo({ top: target * PX_PER_MIN, behavior })
}

const snap = (minutes: number) => Math.round(minutes / SNAP) * SNAP

function minutesAt(event: DragEvent): number {
  const rect = grid.value?.getBoundingClientRect()
  if (!rect) return 0
  return clamp(snap((event.clientY - rect.top) / PX_PER_MIN), 0, 24 * 60 - MIN_LENGTH)
}

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))

function onGridOver(event: DragEvent) {
  const payload = dragging.value
  if (!payload) return
  over(event, dropId.value)
  const at = minutesAt(event)
  if (payload.kind === 'session') {
    const session = store.task(payload.taskId)?.sessions.find(s => s.id === payload.sessionId)
    const length = session ? toMinutes(session.end) - toMinutes(session.start) : DEFAULT_LENGTH
    ghostLength.value = length
    ghost.value = clamp(snap(at - payload.grabOffset), 0, 24 * 60 - length)
  } else {
    ghostLength.value = DEFAULT_LENGTH
    ghost.value = clamp(at, 0, 24 * 60 - DEFAULT_LENGTH)
  }
}

function onDrop(event: DragEvent) {
  const payload = dragging.value
  const start = ghost.value ?? minutesAt(event)
  ghost.value = null
  end()
  if (!payload) return

  if (payload.kind === 'task') {
    store.addSession(payload.taskId, props.date, toTime(start), toTime(start + DEFAULT_LENGTH))
  } else {
    store.updateSession(payload.taskId, payload.sessionId, {
      date: props.date,
      start: toTime(start),
      end: toTime(start + ghostLength.value),
    })
  }
}

watch(dragging, (value) => { if (!value) ghost.value = null })

type Block = { task: { id: string }; session: { id: string; start: string; end: string } }

/** Arrow-key alternative to dragging a block. */
function nudge(block: Block, deltaMinutes: number) {
  const length = toMinutes(block.session.end) - toMinutes(block.session.start)
  const start = clamp(snap(toMinutes(block.session.start) + deltaMinutes), 0, 24 * 60 - length)
  store.updateSession(block.task.id, block.session.id, {
    start: toTime(start),
    end: toTime(start + length),
  })
}

function resize(block: Block, deltaMinutes: number) {
  const start = toMinutes(block.session.start)
  const end = clamp(snap(toMinutes(block.session.end) + deltaMinutes), start + MIN_LENGTH, 24 * 60)
  store.updateSession(block.task.id, block.session.id, { end: toTime(end) })
}
</script>
