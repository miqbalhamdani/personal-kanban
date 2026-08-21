<template>
  <div class="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center">
    <component v-if="icon" :is="icon" class="size-5 text-muted-foreground" aria-hidden="true" />
    <p class="text-sm font-medium">{{ title }}</p>
    <p v-if="description" class="max-w-[38ch] text-xs leading-relaxed text-muted-foreground">
      {{ description }}
    </p>
    <slot />
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{ title: string; description?: string; icon?: Component }>()
</script>
