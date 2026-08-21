import {
  ArcElement, BarController, BarElement, CategoryScale, Chart,
  DoughnutController, Legend, LinearScale, Tooltip,
} from 'chart.js'

let registered = false

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

/**
 * Register the controllers once, then re-apply theme-driven defaults on every
 * call — chart components remount on theme change and pick up the new values.
 */
export function useChartSetup() {
  if (!registered) {
    Chart.register(
      BarController, BarElement, CategoryScale, LinearScale,
      DoughnutController, ArcElement, Tooltip, Legend,
    )
    Chart.defaults.font.family = '"Mona Sans Variable", ui-sans-serif, system-ui, sans-serif'
    Chart.defaults.font.size = 11
    Chart.defaults.plugins.tooltip.padding = 10
    Chart.defaults.plugins.tooltip.cornerRadius = 8
    Chart.defaults.plugins.tooltip.displayColors = true
    Chart.defaults.plugins.tooltip.boxPadding = 4
    registered = true
  }
  Chart.defaults.color = cssVar('--muted-foreground')
  Chart.defaults.borderColor = cssVar('--border')
  Chart.defaults.plugins.tooltip.backgroundColor = cssVar('--foreground')
  Chart.defaults.plugins.tooltip.titleColor = cssVar('--background')
  Chart.defaults.plugins.tooltip.bodyColor = cssVar('--background')
}

/** Gridlines a step quieter than the shared border colour. */
export function chartGridColor(): string {
  return `color-mix(in srgb, ${cssVar('--border')} 55%, transparent)`
}

/** Surface colour for slice borders so segments separate on any theme. */
export function chartSurfaceColor(): string {
  return cssVar('--card') || '#ffffff'
}

/** Charts must be readable instantly for anyone who asked for less motion. */
export function chartAnimation(): false | undefined {
  if (!import.meta.client) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? false : undefined
}
