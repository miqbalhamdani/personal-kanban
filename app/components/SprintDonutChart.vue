<template>
  <Doughnut :data="data" :options="options" :aria-label="summary" />
</template>

<script setup lang="ts">
import type { ChartData, ChartOptions } from 'chart.js'
import { Doughnut } from 'vue-chartjs'
import { fmtDuration } from '~/utils/date'
import { chartAnimation, chartSurfaceColor, useChartSetup } from '~/utils/chart'

const props = defineProps<{ slices: { label: string; color: string; minutes: number }[] }>()

useChartSetup()

const total = computed(() => props.slices.reduce((sum, s) => sum + s.minutes, 0))

const data = computed<ChartData<'doughnut'>>(() => ({
  labels: props.slices.map(s => s.label),
  datasets: [{
    data: props.slices.map(s => s.minutes),
    backgroundColor: props.slices.map(s => s.color),
    borderColor: chartSurfaceColor(),
    borderWidth: 2,
    hoverOffset: 6,
  }],
}))

const options = computed<ChartOptions<'doughnut'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '62%',
  animation: chartAnimation(),
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const minutes = Number(ctx.raw)
          const share = total.value ? Math.round((minutes / total.value) * 100) : 0
          return `${ctx.label}: ${fmtDuration(minutes)} (${share}%)`
        },
      },
    },
  },
}))

const summary = computed(() => {
  const parts = props.slices.map(s =>
    `${s.label} ${total.value ? Math.round((s.minutes / total.value) * 100) : 0}%`)
  return `Doughnut chart of time spent per epic: ${parts.join(', ')}.`
})
</script>
