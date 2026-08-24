<template>
  <!-- update:open is routed through the dirty guard so the built-in X respects it too -->
  <Sheet :open="isOpen" @update:open="onOpenChange">
    <SheetContent
      side="right"
      class="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-[480px]"
      @escape-key-down="onEscape"
      @pointer-down-outside="onOutside"
    >
      <SheetHeader class="border-b px-5 py-4">
        <SheetTitle>{{ editing ? 'Edit task' : 'New task' }}</SheetTitle>
        <SheetDescription>
          {{ editing ? 'Changes save when you press Save task.' : 'Give it a title now; the rest can wait.' }}
        </SheetDescription>
      </SheetHeader>

      <form :id="formId" class="grid grow content-start gap-5 px-5 py-4" @submit.prevent="save">
        <!-- Document-style header: big borderless title, then a compact chip row -->
        <div class="grid gap-1">
          <Label :for="`${formId}-title`" class="sr-only">Title</Label>
          <Input
            :id="`${formId}-title`"
            ref="titleInput"
            v-model="form.title"
            required
            maxlength="140"
            placeholder="Task title"
            class="h-auto rounded-none border-0 bg-transparent px-0 text-xl font-bold shadow-none focus-visible:border-0 focus-visible:ring-0 md:text-xl"
            :aria-invalid="!!titleError"
            :aria-describedby="titleError ? `${formId}-title-error` : undefined"
            @blur="touched.title = true"
          />
          <!-- Reserved line: an appearing error must not shift the fields below mid-click. -->
          <p :id="`${formId}-title-error`" role="alert" class="min-h-4 text-xs font-medium text-destructive">
            {{ titleError }}
          </p>

          <div class="flex flex-wrap items-center gap-2">
            <Select v-model="form.priority">
              <SelectTrigger
                :id="`${formId}-priority`"
                size="sm"
                class="h-8 w-auto gap-1.5 rounded-lg border-border/60 text-[13px] font-medium"
                aria-label="Priority"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="pr in PRIORITIES" :key="pr" :value="pr">{{ PRIORITY_LABEL[pr] }}</SelectItem>
              </SelectContent>
            </Select>

            <Select v-model="form.status">
              <SelectTrigger
                :id="`${formId}-status`"
                size="sm"
                class="h-8 w-auto gap-1.5 rounded-lg border-border/60 text-[13px] font-medium"
                aria-label="Status"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="st in STATUSES" :key="st" :value="st">
                  <span class="size-1.5 rounded-full" :class="STATUS_DOT[st]" aria-hidden="true" />
                  {{ STATUS_LABEL[st] }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <!-- Description -->
        <section class="grid gap-2">
          <Label :for="`${formId}-desc`" class="text-sm font-semibold">Description</Label>
          <Textarea
            :id="`${formId}-desc`"
            v-model="form.description"
            rows="3"
            placeholder="Context, links, acceptance criteria…"
            class="rounded-lg border-0 bg-muted shadow-none focus-visible:ring-2"
          />
        </section>

        <!-- Detail information -->
        <section class="rounded-xl border border-border/60">
          <h3 class="border-b border-border/60 px-3 py-2.5 text-sm font-semibold">Detail information</h3>
          <div class="grid gap-3 p-4">
            <div class="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-2">
              <Label :for="`${formId}-due`" class="text-[13px] text-muted-foreground">Due date</Label>
              <DatePickerField :id="`${formId}-due`" v-model="form.dueDate" placeholder="No due date" clearable />
            </div>

            <div class="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-2">
              <Label :for="`${formId}-sprint`" class="text-[13px] text-muted-foreground">Sprint</Label>
              <Select v-model="form.sprintId">
                <SelectTrigger :id="`${formId}-sprint`" class="w-full">
                  <SelectValue placeholder="No sprint" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No sprint</SelectItem>
                  <template v-for="group in sprintGroups" :key="group.label">
                    <SelectGroup v-if="group.options.length">
                      <SelectLabel class="text-[11px] uppercase tracking-wider">{{ group.label }}</SelectLabel>
                      <SelectItem
                        v-for="opt in group.options"
                        :key="opt.sprint.id"
                        :value="opt.sprint.id"
                        :disabled="opt.archived"
                        :class="opt.current && 'bg-brand-soft font-semibold text-primary data-highlighted:bg-brand-soft'"
                      >
                        {{ opt.sprint.name }}
                      </SelectItem>
                    </SelectGroup>
                  </template>
                </SelectContent>
              </Select>
            </div>

            <div class="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-2">
              <Label :for="`${formId}-epic`" class="text-[13px] text-muted-foreground">Epics</Label>
              <Select v-model="form.epicId">
                <SelectTrigger :id="`${formId}-epic`" class="w-full">
                  <SelectValue placeholder="No epic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No epic</SelectItem>
                  <SelectItem v-for="e in state.epics" :key="e.id" :value="e.id">
                    <span class="size-2 rounded-full" :style="{ background: e.color }" aria-hidden="true" />
                    {{ e.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <!-- Tracked time: "Time when working, date and time range" -->
        <section class="rounded-xl border border-border/60">
          <h3 class="border-b border-border/60 px-3 py-2.5 text-sm font-semibold">Tracked time</h3>
          <div class="grid gap-3 p-4">
            <p v-if="!sessions.length" class="text-xs leading-relaxed text-muted-foreground">
              Nothing tracked. Drag this task onto the Today calendar, or add a block below.
            </p>

            <ul v-else class="grid gap-2.5">
              <li v-for="s in sessions" :key="s.id" class="flex flex-wrap items-center gap-2">
                  <!-- Sized wrapper: the picker's root is renderless and its button is w-full,
                       so without this the date fills the row and the time range wraps below. -->
                  <div class="min-w-[128px] flex-1">
                    <DatePickerField v-model="s.date" placeholder="Pick a date" />
                  </div>
                  <!-- One fused start–end range control -->
                  <div
                    class="flex h-9 flex-1 items-center rounded-md border border-input bg-transparent px-1 shadow-xs focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30"
                    role="group"
                    aria-label="Time range"
                  >
                    <input
                      v-model="s.start"
                      type="time"
                      step="900"
                      class="tnum h-full w-0 min-w-0 flex-1 rounded-sm bg-transparent px-1.5 text-center text-sm outline-none"
                      aria-label="Start time"
                    >
                    <span class="px-0.5 text-muted-foreground" aria-hidden="true">–</span>
                    <input
                      v-model="s.end"
                      type="time"
                      step="900"
                      class="tnum h-full w-0 min-w-0 flex-1 rounded-sm bg-transparent px-1.5 text-center text-sm outline-none"
                      aria-label="End time"
                    >
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    class="size-9 shrink-0 text-muted-foreground hover:text-destructive"
                    :aria-label="`Remove tracked block on ${s.date}`"
                    @click="sessions.splice(sessions.indexOf(s), 1)"
                  >
                    <Trash2 class="size-4" />
                  </Button>
              </li>
            </ul>

            <p v-if="sessionError" role="alert" class="text-xs font-medium text-destructive">{{ sessionError }}</p>

            <Button type="button" variant="outline" size="sm" class="justify-self-start gap-1.5" @click="addBlock">
              <Plus class="size-3.5" /> Add block
            </Button>
          </div>
        </section>
      </form>

      <!-- Inline discard confirm: the sheet traps pointer events, so a toast here
           would render behind the overlay and be unclickable. -->
      <div
        v-if="confirming"
        role="alertdialog"
        aria-label="Discard changes"
        class="mx-5 mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5"
      >
        <p class="grow text-xs font-medium">Discard your unsaved changes?</p>
        <Button type="button" variant="outline" size="sm" @click="confirming = false">Keep editing</Button>
        <Button type="button" variant="destructive" size="sm" @click="discard">Discard</Button>
      </div>

      <SheetFooter class="flex-row gap-2 border-t px-5 py-3 sm:justify-between">
        <Button
          v-if="editing"
          type="button"
          variant="ghost"
          class="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
          @click="removeAndClose"
        >
          <Trash2 class="size-4" /> Delete
        </Button>
        <span v-else />
        <div class="flex gap-2">
          <Button type="button" variant="outline" @click="requestClose">Cancel</Button>
          <Button type="submit" :form="formId" :disabled="!form.title.trim()">
            {{ editing ? 'Save task' : 'Create task' }}
          </Button>
        </div>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>

<script setup lang="ts">
import { Plus, Trash2 } from '@lucide/vue'
import { toast } from 'vue-sonner'
import type { Priority, Session, Sprint, Status } from '~/types'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '~/components/ui/sheet'
import { Textarea } from '~/components/ui/textarea'
import { todayISO, toMinutes, toTime } from '~/utils/date'
import { PRIORITIES, PRIORITY_LABEL, STATUS_DOT, STATUS_LABEL, STATUSES } from '~/utils/labels'
import { uid } from '~/utils/seed'

const store = useStore()
const { state } = store
const actions = useTaskActions()
const { open: isOpen, editingId, defaults, close } = useTaskDialog()

const formId = useId()
const titleInput = ref<{ $el?: HTMLElement } | null>(null)

const editing = computed(() => (editingId.value ? store.task(editingId.value) : undefined))

/**
 * Only current and future sprints are assignable, grouped so the trigger shows
 * just the name. An archived sprint appears (disabled) only when the task
 * already sits on it, so the value isn't lost.
 */
const sprintGroups = computed(() => {
  const opts = state.sprints
    .map(sprint => ({ sprint: sprint as Sprint, phase: store.sprintPhase(sprint) }))
    .sort((a, b) => a.sprint.startDate.localeCompare(b.sprint.startDate))
    .map(({ sprint, phase }) => ({ sprint, current: phase === 'active', archived: phase === 'archived' }))
  return [
    { label: 'Current sprint', options: opts.filter(o => o.current) },
    { label: 'Upcoming', options: opts.filter(o => !o.current && !o.archived) },
    { label: 'Archived', options: opts.filter(o => o.archived && o.sprint.id === form.sprintId) },
  ]
})

const blank = () => ({
  title: '',
  description: '',
  status: 'todo' as Status,
  priority: 'medium' as Priority,
  dueDate: '',
  sprintId: 'none',
  epicId: 'none',
})

const form = reactive(blank())
const sessions = ref<Session[]>([])
const touched = reactive({ title: false })
const snapshot = ref('')
const confirming = ref(false)

const titleError = computed(() => (touched.title && !form.title.trim() ? 'A title is required.' : ''))
const sessionError = computed(() =>
  sessions.value.some(s => !s.date || toMinutes(s.end) <= toMinutes(s.start))
    ? 'Every block needs a date and an end time after its start.'
    : '',
)

const fingerprint = () => JSON.stringify([form, sessions.value])

// Load the form whenever the panel opens, and snapshot it for the dirty check.
watch(isOpen, (value) => {
  if (!value) return
  touched.title = false
  confirming.value = false
  const t = editing.value
  Object.assign(form, blank(), t
    ? {
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate ?? '',
        sprintId: t.sprintId ?? 'none',
        epicId: t.epicId ?? 'none',
      }
    : {
        ...defaults.value,
        dueDate: defaults.value.dueDate ?? '',
        sprintId: defaults.value.sprintId ?? 'none',
        epicId: defaults.value.epicId ?? 'none',
      })
  sessions.value = (t?.sessions ?? []).map(s => ({ ...s }))
  snapshot.value = fingerprint()
  nextTick(() => {
    const el = titleInput.value?.$el as HTMLInputElement | undefined
    if (!el) return
    el.focus()
    // Radix autofocus leaves the whole title selected; park the caret at the end instead.
    el.setSelectionRange?.(el.value.length, el.value.length)
  })
}, { immediate: true })

const dirty = computed(() => fingerprint() !== snapshot.value)

function addBlock() {
  const last = sessions.value.at(-1)
  sessions.value.push({
    id: uid('ses'),
    date: last?.date || form.dueDate || todayISO(),
    start: last?.end || '09:00',
    end: last?.end ? toTime(toMinutes(last.end) + 60) : '10:00',
  })
}

function save() {
  touched.title = true
  if (!form.title.trim() || sessionError.value) return

  const patch = {
    title: form.title.trim(),
    description: form.description.trim(),
    status: form.status,
    priority: form.priority,
    dueDate: form.dueDate || null,
    sprintId: form.sprintId === 'none' ? null : form.sprintId,
    epicId: form.epicId === 'none' ? null : form.epicId,
    sessions: sessions.value.map(s => ({ ...s })),
  }

  if (editing.value) {
    store.updateTask(editing.value.id, patch)
    toast.success('Task saved')
  } else {
    store.addTask(patch)
    toast.success('Task created')
  }
  snapshot.value = fingerprint()
  close()
}

function removeAndClose() {
  const t = editing.value
  if (!t) return
  snapshot.value = fingerprint()
  close()
  actions.remove(t)
}

/** Esc and outside-click both route through the dirty guard. */
function requestClose() {
  if (!dirty.value) return close()
  confirming.value = true
}

function discard() {
  confirming.value = false
  snapshot.value = fingerprint()
  close()
}

function onOpenChange(value: boolean) {
  if (value) isOpen.value = true
  else requestClose()
}

function onEscape(event: Event) {
  event.preventDefault()
  requestClose()
}

function onOutside(event: Event) {
  event.preventDefault()
  requestClose()
}
</script>
