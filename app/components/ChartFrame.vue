<template>
  <section class="rounded-2xl border bg-card p-4">
    <header class="mb-3">
      <h2 class="text-sm font-semibold">{{ title }}</h2>
      <p v-if="subtitle" class="mt-0.5 text-[11px] text-muted-foreground">{{ subtitle }}</p>
    </header>

    <EmptyState
      v-if="empty"
      :icon="ChartColumnBig"
      title="No tracked time"
      description="Nothing was scheduled on the calendar during this sprint, so there is nothing to chart."
    />
    <div v-else :style="{ height: `${height}px` }">
      <slot />
    </div>

    <slot name="legend" />
  </section>
</template>

<script setup lang="ts">
import { ChartColumnBig } from '@lucide/vue'

withDefaults(defineProps<{ title: string; subtitle?: string; empty?: boolean; height?: number }>(), { height: 240 })
</script>
