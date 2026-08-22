<template>
  <NuxtLink to="/" class="flex min-h-9 items-center gap-2.5 rounded-md" aria-label="Intently home">
    <span
      class="grid size-7 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground"
      aria-hidden="true"
    >
      <LayoutDashboard class="size-4" />
    </span>
    <span class="truncate text-[15px] font-semibold tracking-tight">Intently</span>
  </NuxtLink>
</template>

<script setup lang="ts">
import { LayoutDashboard } from '@lucide/vue'
</script>
