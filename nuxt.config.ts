import tailwindcss from '@tailwindcss/vite'

// GTM container, baked in at build time. Unset the env var to ship no tracking.
const gtmId = process.env.NUXT_PUBLIC_GTM_ID

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  // Hybrid rendering. SSR must be on globally: a route rule can opt a route
  // OUT of SSR, but never back in, so `ssr: false` here would leave the
  // landing page an empty shell. Landing is prerendered to real HTML for
  // crawlers; the app under /work stays a client-only SPA.
  ssr: true,
  routeRules: {
    '/': { prerender: true },
    '/work/**': { ssr: false },
  },
  devtools: { enabled: false },
  modules: ['shadcn-nuxt'],
  shadcn: { prefix: '', componentDir: './app/components/ui' },
  // Self-hosted fonts only — no third-party origin in the LCP path. Instrument
  // Serif is used italic-only (the .serif class on the landing page), so just
  // the latin italic subset ships.
  css: [
    '@fontsource-variable/mona-sans',
    '@fontsource/instrument-serif/latin-400-italic.css',
    'vue-sonner/style.css',
    '~/assets/css/main.css',
  ],
  vite: { plugins: [tailwindcss()] },
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'Intently',
      script: [
        ...(gtmId
          ? [
              {
                innerHTML: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f)})(window,document,'script','dataLayer','${gtmId}')`,
              },
            ]
          : []),
        {
          // Apply the saved theme before first paint (SSR is off). Falls back to
          // the 'cobalt' default; bare :root holds the Intently palette, so a
          // no-JS render still gets a complete, readable theme.
          innerHTML: `try{document.documentElement.dataset.theme=localStorage.getItem('intently.theme')||'cobalt'}catch(e){}`,
        },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Sprint, epic and daily focus planning in your browser.' },
        // Default the whole app to noindex so the prerendered /work SPA shells
        // carry it in their static HTML (a client-side useHead would only run
        // after JS, which crawlers can't be relied on to do). The landing page
        // overrides this back to index in its own useHead.
        { name: 'robots', content: 'noindex, nofollow' },
      ],
    },
  },
})
