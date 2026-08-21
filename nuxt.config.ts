import tailwindcss from '@tailwindcss/vite'

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
      title: 'Flowdeck',
      script: [
        {
          // Apply a saved non-default theme before first paint (SSR is off).
          innerHTML: `try{var t=localStorage.getItem('flowdeck.theme');if(t&&t!=='flowdeck')document.documentElement.dataset.theme=t}catch(e){}`,
        },
      ],
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Sprint, epic and daily focus planning in your browser.' },
      ],
    },
  },
})
