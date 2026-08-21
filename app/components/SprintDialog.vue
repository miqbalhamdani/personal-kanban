<template>
  <Dialog :open="!!sprintId" @update:open="value => !value && requestClose()">
    <DialogContent class="sm:max-w-[440px]" @escape-key-down="guard" @pointer-down-outside="guard">
      <DialogHeader>
        <DialogTitle>{{ existing ? 'Edit sprint' : 'New sprint' }}</DialogTitle>
        <DialogDescription>
          A sprint is active, future or archived purely from these dates.
        </DialogDescription>
      </DialogHeader>

      <form :id="formId" class="grid gap-4" @submit.prevent="save">
        <div class="grid gap-1.5">
          <Label :for="`${formId}-name`">Name <span class="text-destructive" aria-hidden="true">*</span></Label>
          <Input :id="`${formId}-name`" v-model="form.name" required maxlength="80" placeholder="Sprint 15 · Reporting" @blur="touched = true" />
          <p role="alert" class="min-h-4 text-xs font-medium text-destructive">{{ nameError }}</p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="grid gap-1.5">
            <Label :for="`${formId}-start`">Date started <span class="text-destructive" aria-hidden="true">*</span></Label>
            <DatePickerField :id="`${formId}-start`" v-model="form.startDate" />
          </div>
          <div class="grid gap-1.5">
            <Label :for="`${formId}-end`">Date ended <span class="text-destructive" aria-hidden="true">*</span></Label>
            <DatePickerField :id="`${formId}-end`" v-model="form.endDate" />
          </div>
        </div>

        <p v-if="rangeError" role="alert" class="text-xs font-medium text-destructive">{{ rangeError }}</p>
        <p v-else class="text-xs text-muted-foreground">
          {{ length }} days · currently <span class="font-medium capitalize">{{ phase }}</span>
        </p>
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
        <div class="flex gap-2">
          <Button
            v-if="existing"
            type="button"
            variant="ghost"
            class="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
            @click="removeSprint"
          >
            <Trash2 class="size-4" /> Delete
          </Button>
        </div>
        <div class="flex gap-2">
          <Button type="button" variant="outline" @click="requestClose">Cancel</Button>
          <Button type="submit" :form="formId" :disabled="!form.name.trim() || !!rangeError">
            {{ existing ? 'Save sprint' : 'Create sprint' }}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { Trash2 } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { addDays, diffDays, todayISO } from '~/utils/date'

const sprintId = defineModel<string | null>('sprintId', { required: true })

const store = useStore()
const formId = useId()

const existing = computed(() => (sprintId.value && sprintId.value !== 'new' ? store.sprint(sprintId.value) : undefined))

const today = todayISO()
const form = reactive({ name: '', startDate: today, endDate: addDays(today, 13) })
const touched = ref(false)
const snapshot = ref('')
const confirming = ref(false)

const nameError = computed(() => (touched.value && !form.name.trim() ? 'A name is required.' : ''))
const rangeError = computed(() =>
  !form.startDate || !form.endDate
    ? 'Both dates are required.'
    : diffDays(form.startDate, form.endDate) < 0
      ? 'The end date must be on or after the start date.'
      : '',
)
const length = computed(() => (rangeError.value ? 0 : diffDays(form.startDate, form.endDate) + 1))
const phase = computed(() =>
  rangeError.value ? '—' : store.sprintPhase({ id: 'x', name: '', startDate: form.startDate, endDate: form.endDate }),
)

watch(sprintId, (value) => {
  if (!value) return
  touched.value = false
  confirming.value = false
  const s = existing.value
  Object.assign(form, s
    ? { name: s.name, startDate: s.startDate, endDate: s.endDate }
    : { name: '', startDate: today, endDate: addDays(today, 13) })
  snapshot.value = JSON.stringify(form)
}, { immediate: true })

const dirty = computed(() => JSON.stringify(form) !== snapshot.value)

function save() {
  touched.value = true
  if (!form.name.trim() || rangeError.value) return
  const patch = { name: form.name.trim(), startDate: form.startDate, endDate: form.endDate }
  if (existing.value) {
    store.updateSprint(existing.value.id, patch)
    toast.success('Sprint saved')
  } else {
    store.addSprint(patch)
    toast.success('Sprint created')
  }
  snapshot.value = JSON.stringify(form)
  sprintId.value = null
}

/** The list rows no longer carry inline actions, so delete lives here. */
function removeSprint() {
  const sp = existing.value
  if (!sp) return
  snapshot.value = JSON.stringify(form)
  sprintId.value = null
  const restore = store.removeSprint(sp.id)
  toast.success(`Deleted "${sp.name}"`, {
    description: 'Its tasks were kept and moved to No sprint.',
    action: { label: 'Undo', onClick: restore },
  })
}

function requestClose() {
  if (!dirty.value) return (sprintId.value = null)
  confirming.value = true
}

function discard() {
  confirming.value = false
  snapshot.value = JSON.stringify(form)
  sprintId.value = null
}

function guard(event: Event) {
  event.preventDefault()
  requestClose()
}
</script>
