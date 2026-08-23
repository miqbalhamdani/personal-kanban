export type ThemeId =
  | 'cobalt' | 'intently' | 'onyx' | 'talcrm'
  | 'meridian' | 'blush' | 'sagebrush'
  | 'outfit' | 'midnight' | 'obsidian'

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
    id: 'cobalt',
    label: 'Cobalt',
    description: 'Crisp white, deep indigo, tight corners. The default.',
    swatches: ['#fbfcfe', '#3730a3', '#4f46e5', '#101a34'],
  },
  {
    id: 'intently',
    label: 'Intently',
    description: 'Warm neutrals with orange and purple.',
    swatches: ['#f9f9f7', '#c2410c', '#ff761d', '#504238'],
  },
  {
    id: 'onyx',
    label: 'Onyx',
    description: 'Cool light surfaces, vivid blue, extra-round corners.',
    swatches: ['#eef2f6', '#1d62d6', '#12a66f', '#16181d'],
  },
  {
    id: 'talcrm',
    label: 'Talcrm',
    description: 'Minimal monochrome with near-black actions.',
    swatches: ['#f8fafc', '#101828', '#5d6b82', '#e4e9f0'],
  },
  {
    id: 'meridian',
    label: 'Meridian',
    description: 'Cool teal focus with an orange call to action.',
    swatches: ['#f2faf8', '#115e59', '#14b8a6', '#123f3a'],
  },
  {
    id: 'blush',
    label: 'Blush',
    description: 'Soft rose and warm amber, extra-round corners.',
    swatches: ['#fdf5f8', '#9d174d', '#ec4899', '#4a1d33'],
  },
  {
    id: 'sagebrush',
    label: 'Sagebrush',
    description: 'Muted sage neutrals with a calm teal.',
    swatches: ['#f4f5f0', '#3f4d43', '#57806b', '#26302a'],
  },
  {
    id: 'outfit',
    label: 'Outfit',
    description: 'Dark mode in yellow, pink and periwinkle.',
    swatches: ['#161616', '#ffcf68', '#ff98cb', '#989de7'],
    dark: true,
  },
  {
    id: 'midnight',
    label: 'Midnight',
    description: 'Navy dark with azure actions and emerald accents.',
    swatches: ['#0b1220', '#4f8ff5', '#60a5fa', '#e6ecf7'],
    dark: true,
  },
  {
    id: 'obsidian',
    label: 'Obsidian',
    description: 'True black monochrome with a cyan edge.',
    swatches: ['#000000', '#f4f4f5', '#22d3ee', '#a1a1aa'],
    dark: true,
  },
]

const KEY = 'intently.theme'
const ids = new Set(THEMES.map(t => t.id))

const theme = ref<ThemeId>('cobalt')
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
      // 'intently' has no [data-theme] block of its own — it is the bare :root
      // palette, which an unmatched attribute value falls through to.
      document.documentElement.dataset.theme = value
      try {
        localStorage.setItem(KEY, value)
      } catch { /* ignore */ }
    }, { immediate: true })
  }

  return { theme, themes: THEMES }
}
