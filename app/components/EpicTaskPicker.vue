<template>
  <Dialog :open="!!epicId" @update:open="value => !value && close()">
    <DialogContent class="gap-4 sm:max-w-[520px]">
      <DialogHeader>
        <DialogTitle>Add existing tasks</DialogTitle>
        <DialogDescription>
          Only tasks with no epic yet.
          {{ selected.size ? `${selected.size} selected.` : 'Pick the ones this epic covers.' }}
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-3">
        <Input
          v-if="candidates.length"
          ref="filterInput"
          v-model="query"
          type="search"
          placeholder="Filter unassigned tasks…"
          aria-label="Filter unassigned tasks"
        />

        <EmptyState
          v-if="!candidates.length"
          :icon="ListTodo"
          title="Every task already has an epic"
          description="Create a task from this page instead, or clear a task's epic on the Tasks page."
        />
        <EmptyState
          v-else-if="!matches.length"
          :icon="ListTodo"
          title="No task matches that filter"
          description="Try a shorter word, or clear the filter to see every unassigned task."
        />

        <!-- Toggle rows, not checkboxes: the tick reserves its column so nothing reflows. -->
        <ul
          v-else
          class="max-h-[50dvh] overflow-y-auto rounded-xl border scroll-thin"
          role="listbox"
          aria-multiselectable="true"
          aria-label="Unassigned tasks"
        >
          <li v-for="task in matches" :key="task.id">
            <button
              type="button"
              role="option"
              :aria-selected="selected.has(task.id)"
              class="flex min-h-12 w-full items-center gap-3 border-b px-3 py-2 text-left transition-colors duration-150 last:border-0 hover:bg-muted/60"
              :class="selected.has(task.id) && 'bg-brand-soft/60'"
              @click="toggle(task.id)"
            >
              <Check
                class="size-4 shrink-0 text-primary transition-opacity duration-150"
                :class="!selected.has(task.id) && 'opacity-0'"
                aria-hidden="true"
              />
              <span
                class="size-2 shrink-0 rounded-full"
                :class="STATUS_DOT[task.status]"
                :title="STATUS_LABEL[task.status]"
                aria-hidden="true"
              />
              <span class="min-w-0 grow">
                <span class="block truncate text-[13px] font-medium">{{ task.title }}</span>
                <span class="block truncate text-[11px] text-muted-foreground">
                  {{ STATUS_LABEL[task.status] }}{{ task.dueDate ? ` · due ${fmtMonthDay(task.dueDate)}` : '' }}
                </span>
              </span>
              <PriorityBadge :priority="task.priority" class="shrink-0" />
            </button>
          </li>
        </ul>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" @click="close">Cancel</Button>
        <Button type="button" :disabled="!selected.size" @click="save">
          {{ selected.size ? `Add ${selected.size} ${selected.size === 1 ? 'task' : 'tasks'}` : 'Add tasks' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { Check, ListTodo } from '@lucide/vue'
import { Button } from '~/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { fmtMonthDay } from '~/utils/date'
import { PRIORITY_RANK, STATUS_DOT, STATUS_LABEL } from '~/utils/labels'
import { htmlToText } from '~/utils/richtext'

const epicId = defineModel<string | null>('epicId', { required: true })

const store = useStore()
const { state } = store
const actions = useTaskActions()

const query = ref('')
const selected = ref(new Set<string>())
const filterInput = ref<{ $el?: HTMLElement } | null>(null)

const candidates = computed(() => [...state.tasks]
  .filter(t => !t.epicId)
  .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.order - b.order))

const matches = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return candidates.value
  return candidates.value.filter(t =>
    t.title.toLowerCase().includes(q) || htmlToText(t.description).toLowerCase().includes(q))
})

// Reset per opening, then park the caret in the filter.
watch(epicId, (value) => {
  if (!value) return
  query.value = ''
  selected.value = new Set()
  nextTick(() => (filterInput.value?.$el as HTMLInputElement | undefined)?.focus())
})

function toggle(id: string) {
  const next = new Set(selected.value)
  next.has(id) ? next.delete(id) : next.add(id)
  selected.value = next
}

const close = () => { epicId.value = null }

function save() {
  if (!selected.value.size || !epicId.value) return
  actions.assignEpic([...selected.value], epicId.value)
  close()
}
</script>
