<template>
  <div class="min-h-[calc(100dvh-3.5rem)] lg:min-h-dvh">
    <PageHeader title="Sprint" :subtitle="`${state.sprints.length} sprints · phase follows the dates`">
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
          <li v-for="s in group.sprints" :key="s.id">
            <div
              role="button"
              tabindex="0"
              class="flex min-h-12 w-full cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 border-b px-4 py-2.5 text-left transition-colors duration-150 last:border-0 hover:bg-muted/60"
              :aria-label="`${s.name}. Open sprint detail.`"
              @click="navigateTo(`/work/sprints/${s.id}`)"
              @keydown.enter.prevent="navigateTo(`/work/sprints/${s.id}`)"
              @keydown.space.prevent="navigateTo(`/work/sprints/${s.id}`)"
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
import { ChevronRight, Plus } from '@lucide/vue'
import type { Sprint, SprintPhase } from '~/types'
import { Button } from '~/components/ui/button'
import { diffDays, fmtDayMonth, fmtDuration } from '~/utils/date'

const store = useStore()
const { state } = store

const editing = ref<string | null>(null)
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
  active: 'No sprint covers today. Start one, or shift a future sprint back.',
  future: 'Nothing planned ahead yet. Create a sprint to queue up the next block of work.',
  archived: 'Sprints move here once their end date passes, along with their retrospective.',
}

const groups = computed(() => (['active', 'future', 'archived'] as SprintPhase[]).map(phase => ({
  phase,
  sprints: state.sprints
    .filter(s => store.sprintPhase(s) === phase)
    .sort((a, b) => (phase === 'archived' ? b.startDate.localeCompare(a.startDate) : a.startDate.localeCompare(b.startDate))),
})))

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
