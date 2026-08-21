<template>
  <div class="flex flex-col items-end leading-tight">
    <span class="tnum text-base font-semibold">{{ value }}</span>
    <span class="text-[11px] text-muted-foreground">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ value: string; label: string }>()
</script>
