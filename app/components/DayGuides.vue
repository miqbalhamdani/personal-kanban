<template>
  <!-- Weekend and today background guides shared by every gantt row -->
  <div
    v-for="(day, i) in timeline"
    :key="day"
    class="absolute inset-y-0"
    :class="[isWeekend(day) && 'bg-muted/40', day === today && 'bg-brand/10']"
    :style="{ left: `${i * dayPx}px`, width: `${dayPx}px` }"
    aria-hidden="true"
  />
</template>

<script setup lang="ts">
import { isWeekend } from '~/utils/date'

defineProps<{ timeline: string[]; dayPx: number; today: string }>()
</script>
