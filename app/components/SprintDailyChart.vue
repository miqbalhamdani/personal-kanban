<template>
  <Bar :data="data" :options="options" :aria-label="summary" />
</template>

<script setup lang="ts">
import type { ChartData, ChartOptions } from 'chart.js'
import { Bar } from 'vue-chartjs'
import { fmtDuration } from '~/utils/date'
import { chartAnimation, chartGridColor, useChartSetup } from '~/utils/chart'

const props = defineProps<{
  labels: string[]
  series: { label: string; color: string; data: number[] }[]
  totals: number[]
}>()

useChartSetup()

const data = computed<ChartData<'bar'>>(() => ({
  labels: props.labels,
  datasets: props.series.map(s => ({
    label: s.label,
    data: s.data,
    backgroundColor: s.color,
    borderRadius: 0,
    borderSkipped: false,
    maxBarThickness: 34,
  })),
}))

const options = computed<ChartOptions<'bar'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: chartAnimation(),
  interaction: { mode: 'index', intersect: false },
  scales: {
    x: { stacked: true, grid: { display: false }, ticks: { autoSkip: true, maxRotation: 0 } },
    y: {
      stacked: true,
      max: 100,
      ticks: { stepSize: 25, callback: v => `${v}%` },
      grid: { color: chartGridColor() },
      border: { display: false },
    },
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        title: items => `${items[0]?.label} · ${fmtDuration(props.totals[items[0]!.dataIndex] ?? 0)} tracked`,
        label: ctx => `${ctx.dataset.label}: ${Math.round(Number(ctx.raw))}%`,
      },
      filter: item => Number(item.raw) > 0,
    },
  },
}))

const summary = computed(() => {
  const busiest = props.totals.indexOf(Math.max(...props.totals))
  return `Stacked bar chart of daily tracked time by epic. Busiest day ${props.labels[busiest]} with ${fmtDuration(props.totals[busiest] ?? 0)}.`
})
</script>
