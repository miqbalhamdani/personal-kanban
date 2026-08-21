<template>
  <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
    <li v-for="item in items" :key="item.label" class="flex items-center gap-1.5 text-[11px]">
      <span class="size-2.5 shrink-0 rounded-sm" :style="{ background: item.color }" aria-hidden="true" />
      <span class="font-medium">{{ item.label }}</span>
      <span class="tnum text-muted-foreground">{{ item.value }}</span>
    </li>
  </ul>
</template>

<script setup lang="ts">
defineProps<{ items: { label: string; color: string; value: string }[] }>()
</script>
