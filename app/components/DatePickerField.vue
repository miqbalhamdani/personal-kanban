<template>
  <!-- modal so it nests correctly inside the task Sheet (a modal dialog) -->
  <Popover v-model:open="pickerOpen" modal>
    <PopoverTrigger as-child>
      <Button
        :id="id"
        type="button"
        variant="outline"
        class="w-full justify-start gap-2 px-3 font-normal"
        :class="!modelValue && 'text-muted-foreground'"
      >
        <CalendarDays class="size-4 shrink-0 opacity-70" aria-hidden="true" />
        <span class="tnum grow truncate text-left">{{ label }}</span>
        <span
          v-if="modelValue && clearable"
          role="button"
          tabindex="0"
          class="hit -mr-1 grid size-6 place-items-center rounded-md text-muted-foreground hover:text-foreground"
          :aria-label="`Clear ${placeholder.toLowerCase()}`"
          @click.stop="clear"
          @keydown.enter.stop.prevent="clear"
        >
          <X class="size-3.5" />
        </span>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0" align="start">
      <Calendar
        :model-value="calendarValue"
        @update:model-value="onPick"
      />
    </PopoverContent>
  </Popover>
</template>

<script setup lang="ts">
import { type DateValue, parseDate } from '@internationalized/date'
import { CalendarDays, X } from '@lucide/vue'
import { Button } from '~/components/ui/button'
import { Calendar } from '~/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { fmtDayMonth } from '~/utils/date'

const props = withDefaults(defineProps<{
  id?: string
  placeholder?: string
  clearable?: boolean
}>(), { placeholder: 'Pick a date', clearable: false })

const modelValue = defineModel<string>({ required: true }) // 'YYYY-MM-DD' | ''

const pickerOpen = ref(false)

const calendarValue = computed<DateValue | undefined>(() => {
  if (!modelValue.value) return undefined
  try {
    return parseDate(modelValue.value)
  } catch {
    return undefined
  }
})

const label = computed(() =>
  modelValue.value
    ? fmtDayMonth(modelValue.value)
    : props.placeholder,
)

function onPick(value: DateValue | undefined) {
  modelValue.value = value ? value.toString() : ''
  pickerOpen.value = false
}

function clear() {
  modelValue.value = ''
  pickerOpen.value = false
}
</script>
