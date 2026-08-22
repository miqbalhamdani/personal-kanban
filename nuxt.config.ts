import tailwindcss from '@tailwindcss/vite'

// GA4 measurement ID, baked in at build time (static SPA, no server runtime).
const gaId = process.env.NUXT_PUBLIC_GA_ID

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  ssr: false,
  devtools: { enabled: false },
  modules: ['shadcn-nuxt'],
  shadcn: { prefix: '', componentDir: './app/components/ui' },
  css: ['@fontsource-variable/mona-sans', 'vue-sonner/style.css', '~/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] },
  app: {
    head: {
      title: 'Intently',
      script: [
        ...(gaId
          ? [
              { src: `https://www.googletagmanager.com/gtag/js?id=${gaId}`, async: true },
              {
                innerHTML: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}')`,
              },
            ]
          : []),
        {
          // Apply a saved non-default theme before first paint (SSR is off).
          innerHTML: `try{var t=localStorage.getItem('intently.theme');if(t&&t!=='intently')document.documentElement.dataset.theme=t}catch(e){}`,
        },
      ],
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Sprint, epic and daily focus planning in your browser.' },
      ],
    },
  },
})
