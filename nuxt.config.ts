// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  runtimeConfig: {
    public: {
      liffId: process.env.NUXT_PUBLIC_LIFF_ID || '',
    },
  },
  vite: {
    server: {
      allowedHosts: ['.ngrok-free.app'],
      hmr: false
    },
  },
})