<template>
  <span
    class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium leading-5 whitespace-nowrap"
    :class="PRIORITY_CLASS[priority]"
  >
    <component :is="icon" class="size-3" aria-hidden="true" />
    {{ PRIORITY_LABEL[priority] }}
  </span>
</template>

<script setup lang="ts">
import { ChevronDown, ChevronUp, Equal } from '@lucide/vue'
import type { Priority } from '~/types'
import { PRIORITY_CLASS, PRIORITY_LABEL } from '~/utils/labels'

const props = defineProps<{ priority: Priority }>()
const icon = computed(() => ({ high: ChevronUp, medium: Equal, low: ChevronDown })[props.priority])
</script>
