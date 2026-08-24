<template>
  <Dialog :open="!!epicId" @update:open="value => !value && requestClose()">
    <DialogContent class="sm:max-w-[480px]" @escape-key-down="guard" @pointer-down-outside="guard">
      <DialogHeader>
        <DialogTitle>{{ existing ? 'Edit epic' : 'New epic' }}</DialogTitle>
        <DialogDescription>Epics group tasks and give the sprint charts their colours.</DialogDescription>
      </DialogHeader>

      <form :id="formId" class="grid gap-4" @submit.prevent="save">
        <div class="grid gap-1.5">
          <Label :for="`${formId}-name`">Name <span class="text-destructive" aria-hidden="true">*</span></Label>
          <Input :id="`${formId}-name`" v-model="form.name" required maxlength="60" placeholder="Reporting & exports" @blur="touched = true" />
          <p role="alert" class="min-h-4 text-xs font-medium text-destructive">{{ nameError }}</p>
        </div>

        <div class="grid gap-1.5">
          <Label :for="`${formId}-desc`">Description</Label>
          <Textarea :id="`${formId}-desc`" v-model="form.description" rows="2" placeholder="What does this epic cover?" />
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="grid gap-1.5">
            <Label :for="`${formId}-due`">Due date</Label>
            <DatePickerField :id="`${formId}-due`" v-model="form.dueDate" placeholder="No due date" clearable />
          </div>
          <div class="grid gap-1.5">
            <Label :for="`${formId}-priority`">Priority</Label>
            <Select v-model="form.priority">
              <SelectTrigger :id="`${formId}-priority`" class="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="p in PRIORITIES" :key="p" :value="p">{{ PRIORITY_LABEL[p] }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <fieldset class="grid gap-2">
          <legend class="pb-1 text-sm font-medium">Colour</legend>
          <div class="flex flex-wrap gap-2">
            <label
              v-for="color in EPIC_COLORS"
              :key="color"
              class="relative grid size-9 cursor-pointer place-items-center rounded-lg transition-transform duration-150 hover:scale-105 has-[:checked]:ring-2 has-[:checked]:ring-ring has-[:checked]:ring-offset-2"
              :style="{ background: color }"
            >
              <input
                v-model="form.color"
                type="radio"
                name="epic-color"
                :value="color"
                class="absolute size-full cursor-pointer opacity-0"
                :aria-label="`Colour ${EPIC_COLOR_NAMES[color] ?? color}`"
              >
              <Check v-if="form.color === color" class="size-4" :style="{ color: epicInk(color) }" aria-hidden="true" />
            </label>
          </div>
          <p class="text-xs text-muted-foreground">
            Used for the epic dot on cards, its gantt bar and its chart segments.
          </p>
        </fieldset>
      </form>

      <div
        v-if="confirming"
        role="alertdialog"
        aria-label="Discard changes"
        class="flex flex-wrap items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5"
      >
        <p class="grow text-xs font-medium">Discard your unsaved changes?</p>
        <Button type="button" variant="outline" size="sm" @click="confirming = false">Keep editing</Button>
        <Button type="button" variant="destructive" size="sm" @click="discard">Discard</Button>
      </div>

      <DialogFooter class="gap-2 sm:justify-between">
        <Button
          v-if="existing"
          type="button"
          variant="ghost"
          class="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
          @click="removeEpic"
        >
          <Trash2 class="size-4" /> Delete
        </Button>
        <span v-else />
        <div class="flex gap-2">
          <Button type="button" variant="outline" @click="requestClose">Cancel</Button>
          <Button type="submit" :form="formId" :disabled="!form.name.trim()">
            {{ existing ? 'Save epic' : 'Create epic' }}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { Check, Trash2 } from '@lucide/vue'
import { toast } from 'vue-sonner'
import type { Priority } from '~/types'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'
import { EPIC_COLOR_NAMES, EPIC_COLORS, epicInk, PRIORITIES, PRIORITY_LABEL } from '~/utils/labels'

const epicId = defineModel<string | null>('epicId', { required: true })

const store = useStore()
const formId = useId()

const existing = computed(() => (epicId.value && epicId.value !== 'new' ? store.epic(epicId.value) : undefined))

const blank = () => ({ name: '', description: '', dueDate: '', priority: 'medium' as Priority, color: EPIC_COLORS[1]! })
const form = reactive(blank())
const touched = ref(false)
const snapshot = ref('')
const confirming = ref(false)

const nameError = computed(() => (touched.value && !form.name.trim() ? 'A name is required.' : ''))

watch(epicId, (value) => {
  if (!value) return
  touched.value = false
  confirming.value = false
  const e = existing.value
  Object.assign(form, blank(), e
    ? { name: e.name, description: e.description, dueDate: e.dueDate ?? '', priority: e.priority, color: e.color }
    : { color: EPIC_COLORS[store.state.epics.length % EPIC_COLORS.length]! })
  snapshot.value = JSON.stringify(form)
}, { immediate: true })

const dirty = computed(() => JSON.stringify(form) !== snapshot.value)

function save() {
  touched.value = true
  if (!form.name.trim()) return
  const patch = {
    name: form.name.trim(),
    description: form.description.trim(),
    dueDate: form.dueDate || null,
    priority: form.priority,
    color: form.color,
  }
  if (existing.value) {
    store.updateEpic(existing.value.id, patch)
    toast.success('Epic saved')
  } else {
    store.addEpic(patch)
    toast.success('Epic created')
  }
  snapshot.value = JSON.stringify(form)
  epicId.value = null
}

/** The gantt no longer has detail cards, so delete lives here. Undo via toast. */
function removeEpic() {
  const e = existing.value
  if (!e) return
  snapshot.value = JSON.stringify(form)
  epicId.value = null
  const restore = store.removeEpic(e.id)
  toast.success(`Deleted "${e.name}"`, {
    description: 'Its tasks were kept and moved to No epic.',
    action: { label: 'Undo', onClick: restore },
  })
}

function requestClose() {
  if (!dirty.value) return (epicId.value = null)
  confirming.value = true
}

function discard() {
  confirming.value = false
  snapshot.value = JSON.stringify(form)
  epicId.value = null
}

function guard(event: Event) {
  event.preventDefault()
  requestClose()
}
</script>
