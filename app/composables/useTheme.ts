export type ThemeId = 'flowdeck' | 'onyx' | 'outfit' | 'talcrm'

export interface ThemeMeta {
  id: ThemeId
  label: string
  description: string
  /** Preview dots in the settings picker: bg, primary, brand, foreground. */
  swatches: [string, string, string, string]
  dark?: boolean
}

export const THEMES: ThemeMeta[] = [
  {
    id: 'flowdeck',
    label: 'Flowdeck',
    description: 'Warm neutrals with orange and purple. The default.',
    swatches: ['#f9f9f7', '#c2410c', '#ff761d', '#504238'],
  },
  {
    id: 'onyx',
    label: 'Onyx',
    description: 'Cool light surfaces, vivid blue, extra-round corners.',
    swatches: ['#eef2f6', '#1d62d6', '#12a66f', '#16181d'],
  },
  {
    id: 'outfit',
    label: 'Outfit',
    description: 'Dark mode in yellow, pink and periwinkle.',
    swatches: ['#161616', '#ffcf68', '#ff98cb', '#989de7'],
    dark: true,
  },
  {
    id: 'talcrm',
    label: 'Talcrm',
    description: 'Minimal monochrome with near-black actions.',
    swatches: ['#f8fafc', '#101828', '#5d6b82', '#e4e9f0'],
  },
]

const KEY = 'flowdeck.theme'
const ids = new Set(THEMES.map(t => t.id))

const theme = ref<ThemeId>('flowdeck')
let started = false

export function useTheme() {
  if (import.meta.client && !started) {
    started = true
    try {
      const saved = localStorage.getItem(KEY)
      if (saved && ids.has(saved as ThemeId)) theme.value = saved as ThemeId
    } catch { /* private mode: default stands */ }

    watch(theme, (value) => {
      // The head script in nuxt.config applies it pre-paint; this keeps it live.
      if (value === 'flowdeck') delete document.documentElement.dataset.theme
      else document.documentElement.dataset.theme = value
      try {
        localStorage.setItem(KEY, value)
      } catch { /* ignore */ }
    }, { immediate: true })
  }

  return { theme, themes: THEMES }
}
