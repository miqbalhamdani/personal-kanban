<template>
  <div class="min-h-[calc(100dvh-3.5rem)] lg:min-h-dvh">
    <PageHeader title="Sprint" :subtitle="subtitle">
      <template #actions>
        <Button class="gap-1.5" @click="editing = 'new'">
          <Plus class="size-4" /> New sprint
        </Button>
      </template>
    </PageHeader>

    <div class="space-y-3 p-4 sm:px-6 sm:py-6">
      <!-- Same anatomy as the Task list: collapsible group sections with rows. -->
      <section v-for="group in groups" :key="group.phase" class="rounded-2xl border bg-card">
        <button
          type="button"
          class="flex min-h-12 w-full items-center gap-2.5 px-4 text-left"
          :aria-expanded="!collapsed.has(group.phase)"
          @click="toggle(group.phase)"
        >
          <ChevronRight
            class="size-4 shrink-0 text-muted-foreground transition-transform duration-150"
            :class="!collapsed.has(group.phase) && 'rotate-90'"
            aria-hidden="true"
          />
          <span class="shrink-0 rounded-full px-2 py-0.5 text-[12px] font-semibold capitalize" :class="PHASE_CLASS[group.phase]">
            {{ group.phase }}
          </span>
          <span class="tnum ml-auto shrink-0 text-[11px] text-muted-foreground">
            {{ group.sprints.length }} {{ group.sprints.length === 1 ? 'sprint' : 'sprints' }}
          </span>
        </button>

        <ul v-if="!collapsed.has(group.phase)" class="border-t">
          <li
            v-for="(s, i) in group.sprints"
            :key="s.id"
            draggable="true"
            @dragstart="startSprint($event, s.id)"
            @dragend="end()"
            @dragover="overRow($event, group.phase, s.id)"
            @dragleave="leave(`slot:${s.id}`)"
            @drop.prevent="onDrop(s.id)"
          >
            <div
              role="button"
              tabindex="0"
              class="flex min-h-12 w-full cursor-grab flex-wrap items-center gap-x-3 gap-y-1 border-b px-4 py-2.5 text-left transition-colors duration-150 last:border-0 hover:bg-muted/60 active:cursor-grabbing"
              :class="[
                isDraggingSprint(s.id) && 'opacity-40',
                isOver(`slot:${s.id}`) && 'bg-brand-soft/70 ring-1 ring-inset ring-brand',
              ]"
              :aria-label="`${s.name}. Open sprint detail. Alt with arrow up or down reorders it.`"
              @click="navigateTo(`/work/sprints/${s.id}`)"
              @keydown.enter.prevent="navigateTo(`/work/sprints/${s.id}`)"
              @keydown.space.prevent="navigateTo(`/work/sprints/${s.id}`)"
              @keydown.alt.up.prevent="nudge(group.sprints, i, -1)"
              @keydown.alt.down.prevent="nudge(group.sprints, i, 1)"
            >
              <div class="min-w-0 grow">
                <p class="truncate text-[13px] font-medium">{{ s.name }}</p>
                <p class="tnum mt-0.5 truncate text-[11px] text-muted-foreground">
                  {{ fmtDayMonth(s.startDate) }} – {{ fmtDayMonth(s.endDate) }} ·
                  {{ diffDays(s.startDate, s.endDate) + 1 }} days ·
                  {{ fmtDuration(stats(s).minutes) }} tracked
                </p>
              </div>

              <!-- Completion: number carries the meaning, bar is reinforcement -->
              <div class="flex w-36 shrink-0 items-center gap-2">
                <div class="h-1.5 grow overflow-hidden rounded-full bg-muted" role="presentation">
                  <div class="h-full rounded-full bg-brand transition-[width] duration-300" :style="{ width: `${stats(s).percent}%` }" />
                </div>
                <span class="tnum w-14 shrink-0 text-right text-[11px] text-muted-foreground">
                  {{ stats(s).done }}/{{ stats(s).total }} · {{ stats(s).percent }}%
                </span>
              </div>

              <!-- The hint sits on the wrapper: a disabled Button is pointer-events-none, so its own title never shows. -->
              <span
                v-if="s.phase === 'future'"
                class="shrink-0"
                :title="activeSprint ? `End ${activeSprint.name} before starting another sprint.` : undefined"
              >
                <Button
                  size="sm"
                  class="cursor-pointer gap-1.5"
                  :disabled="!!activeSprint"
                  @click.stop="start(s)"
                  @keydown.stop
                  @pointerdown.stop
                >
                  <Play class="size-3.5" /> Start
                </Button>
              </span>
              <Button
                v-else-if="s.phase === 'active'"
                size="sm"
                variant="outline"
                class="shrink-0 cursor-pointer gap-1.5"
                @click.stop="finish(s)"
                @keydown.stop
                @pointerdown.stop
              >
                <Flag class="size-3.5" /> End
              </Button>
            </div>
          </li>
          <li v-if="!group.sprints.length" class="px-4 py-4 text-xs leading-relaxed text-muted-foreground">
            {{ EMPTY[group.phase] }}
          </li>
        </ul>
      </section>
    </div>

    <SprintDialog v-model:sprint-id="editing" />
  </div>
</template>

<script setup lang="ts">
import { ChevronRight, Flag, Play, Plus } from '@lucide/vue'
import type { Sprint, SprintPhase } from '~/types'
import { Button } from '~/components/ui/button'
import { diffDays, fmtDayMonth, fmtDuration } from '~/utils/date'

const store = useStore()
const { state, activeSprint } = store

const subtitle = computed(() =>
  `${state.sprints.length} sprints · ${activeSprint.value ? `${activeSprint.value.name} running` : 'nothing running'}`,
)

const { start, finish } = useSprintActions()

const { sprintId: editing } = useSprintDialog()
const collapsed = ref(new Set<string>())

const toggle = (key: string) => {
  const next = new Set(collapsed.value)
  next.has(key) ? next.delete(key) : next.add(key)
  collapsed.value = next
}

const PHASE_CLASS: Record<SprintPhase, string> = {
  active: 'bg-brand-soft text-primary',
  future: 'bg-purple-soft text-accent-foreground',
  archived: 'bg-muted text-muted-foreground',
}

const EMPTY: Record<SprintPhase, string> = {
  active: 'Nothing running. Press Start on a future sprint when you are ready to work it.',
  future: 'Nothing planned ahead yet. Create a sprint to queue up the next block of work.',
  archived: 'Sprints move here when you end them, along with their retrospective.',
}

const groups = computed(() => (['active', 'future', 'archived'] as SprintPhase[]).map(phase => ({
  phase,
  sprints: state.sprints.filter(s => store.sprintPhase(s) === phase).sort((a, b) => a.order - b.order),
})))

/* ---- drag to reorder: shares the manual `order` the Task list groups by ---- */
const { dragging, startSprint, over, leave, isOver, end, isDraggingSprint } = useDrag()

/** Order is global, so only same-phase drops are allowed — a cross-group one would look like a no-op. */
function overRow(event: DragEvent, phase: SprintPhase, id: string) {
  const payload = dragging.value
  if (payload?.kind !== 'sprint' || payload.sprintId === id) return
  const dragged = store.sprint(payload.sprintId)
  if (!dragged || store.sprintPhase(dragged) !== phase) return
  over(event, `slot:${id}`)
}

function onDrop(id: string) {
  const payload = dragging.value
  end()
  if (payload?.kind === 'sprint') store.reorderSprint(payload.sprintId, id)
}

/** Keyboard equivalent: hop the neighbour inside the same phase group. */
function nudge(list: Sprint[], i: number, dir: -1 | 1) {
  const target = list[i + dir]
  if (target) store.reorderSprint(list[i]!.id, target.id)
}

function stats(s: Sprint) {
  const tasks = state.tasks.filter(t => t.sprintId === s.id)
  const counted = tasks.filter(t => t.status !== 'cancelled')
  const done = counted.filter(t => t.status === 'done').length
  return {
    total: counted.length,
    done,
    percent: counted.length ? Math.round((done / counted.length) * 100) : 0,
    minutes: tasks.reduce((sum, t) => sum + store.trackedMinutes(t), 0),
  }
}
</script>
