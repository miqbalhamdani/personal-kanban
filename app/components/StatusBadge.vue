<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium leading-5 whitespace-nowrap"
    :class="STATUS_CLASS[status]"
  >
    <span class="size-1.5 rounded-full" :class="STATUS_DOT[status]" aria-hidden="true" />
    {{ STATUS_LABEL[status] }}
  </span>
</template>

<script setup lang="ts">
import type { Status } from '~/types'
import { STATUS_CLASS, STATUS_DOT, STATUS_LABEL } from '~/utils/labels'

defineProps<{ status: Status }>()
</script>
