<template>
  <header class="sticky top-14 z-20 border-b bg-background/85 backdrop-blur lg:top-0">
    <div class="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:px-6">
      <div class="min-w-0 grow">
        <div class="flex items-center gap-2">
          <NuxtLink
            v-if="backTo"
            :to="backTo"
            class="hit grid size-8 shrink-0 place-items-center rounded-lg border transition-colors duration-150 hover:bg-muted"
            :aria-label="backLabel || 'Back'"
          >
            <ArrowLeft class="size-4" />
          </NuxtLink>
          <h1 class="truncate text-lg font-semibold tracking-tight">{{ title }}</h1>
          <slot name="title-append" />
        </div>
        <p v-if="subtitle" class="mt-0.5 truncate text-[13px] text-muted-foreground">{{ subtitle }}</p>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <slot name="actions" />
      </div>
    </div>
    <slot name="below" />
  </header>
</template>

<script setup lang="ts">
import { ArrowLeft } from '@lucide/vue'

defineProps<{ title: string; subtitle?: string; backTo?: string; backLabel?: string }>()
</script>
