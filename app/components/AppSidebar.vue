<template>
  <aside class="flex flex-col border-r bg-sidebar">
    <div class="flex h-14 items-center px-4">
      <AppLogo />
    </div>

    <nav class="flex-1 space-y-6 overflow-y-auto px-3 py-2 scroll-thin" aria-label="Main">
      <div v-for="group in groups" :key="group.label">
        <p class="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {{ group.label }}
        </p>
        <ul class="space-y-0.5">
          <li v-for="item in group.items" :key="item.to">
            <NuxtLink
              :to="item.to"
              :aria-current="isActive(item) ? 'page' : undefined"
              class="group relative flex min-h-10 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors duration-150"
              :class="isActive(item)
                ? 'bg-brand-soft font-semibold text-primary'
                : 'text-foreground/80 hover:bg-sidebar-accent hover:text-foreground'"
              @click="emit('navigate')"
            >
              <span
                v-if="isActive(item)"
                class="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-brand"
                aria-hidden="true"
              />
              <component :is="item.icon" class="size-4 shrink-0" aria-hidden="true" />
              <span class="truncate">{{ item.label }}</span>
              <span
                v-if="item.count"
                class="ml-auto tnum rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground"
              >{{ item.count }}</span>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </nav>

    <div class="border-t p-3">
      <p class="px-2 pb-2 text-[11px] leading-relaxed text-muted-foreground">
        Saved in this browser only. No account, no server.
      </p>
      <Button variant="ghost" size="sm" class="h-10 w-full justify-start gap-2 text-muted-foreground" @click="confirmReset">
        <RotateCcw class="size-3.5" />
        Reset demo data
      </Button>
      <Button variant="ghost" size="sm" class="h-10 w-full justify-start gap-2 text-muted-foreground" @click="settings.open.value = true">
        <Settings2 class="size-3.5" />
        Settings
      </Button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { CalendarCheck, GitBranch, Layers, ListTodo, RotateCcw, Settings2 } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { Button } from '~/components/ui/button'
import { todayISO } from '~/utils/date'

const emit = defineEmits<{ navigate: [] }>()

const route = useRoute()
const settings = useSettingsDialog()
const { state, resetToDemo, sprintPhase } = useStore()

const dueSoon = computed(() => {
  const today = todayISO()
  return state.tasks.filter(t =>
    t.dueDate && t.dueDate >= today && t.dueDate <= addDays(today, 3)
    && t.status !== 'done' && t.status !== 'cancelled',
  ).length
})

const openTasks = computed(() => state.tasks.filter(t => t.status !== 'done' && t.status !== 'cancelled').length)
const activeSprints = computed(() => state.sprints.filter(s => sprintPhase(s) === 'active').length)

const groups = computed(() => [
  {
    label: 'Focus',
    items: [{ to: '/', label: 'Today', icon: CalendarCheck, count: dueSoon.value }],
  },
  {
    label: 'Work',
    items: [
      { to: '/work/tasks', label: 'Task', icon: ListTodo, count: openTasks.value },
      { to: '/work/sprints', label: 'Sprint', icon: GitBranch, count: activeSprints.value },
      { to: '/work/epics', label: 'Epics', icon: Layers, count: state.epics.length },
    ],
  },
])

const isActive = (item: { to: string }) =>
  item.to === '/' ? route.path === '/' : route.path.startsWith(item.to)

function confirmReset() {
  toast('Reset all data to the demo set?', {
    description: 'Everything you have added in this browser will be replaced.',
    action: { label: 'Reset', onClick: () => { resetToDemo(); toast.success('Demo data restored') } },
  })
}
</script>
